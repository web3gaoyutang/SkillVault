package biz

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"time"
)

var (
	ErrVersionNotFound     = errors.New("version not found")
	ErrVersionExists       = errors.New("version already exists")
	ErrInvalidStateTransition = errors.New("invalid version state transition")
	ErrNotPublished        = errors.New("version is not published")
)

func (uc *VersionUsecase) Upload(ctx context.Context, userID uint64, orgName, skillName, version, changelog string, reader io.Reader, size int64) (*SkillVersion, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}

	member, err := uc.memberRepo.FindByOrgAndUser(ctx, org.ID, userID)
	if err != nil || member == nil || roleHierarchy[member.Role] < roleHierarchy["developer"] {
		return nil, ErrPermissionDenied
	}

	skill, err := uc.skillRepo.FindByOrgAndName(ctx, org.ID, skillName)
	if err != nil || skill == nil {
		return nil, ErrSkillNotFound
	}

	existing, _ := uc.versionRepo.FindBySkillAndVersion(ctx, skill.ID, version)
	if existing != nil {
		return nil, ErrVersionExists
	}

	// Read content and compute SHA256
	content, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to read artifact: %w", err)
	}
	hash := sha256.Sum256(content)
	checksum := hex.EncodeToString(hash[:])

	// Upload to MinIO
	artifactPath := fmt.Sprintf("%s/%s/%s/%s.tar.gz", orgName, skillName, version, checksum[:8])
	if err := uc.storage.Upload(ctx, artifactPath, newBytesReader(content), int64(len(content)), "application/gzip"); err != nil {
		return nil, fmt.Errorf("failed to upload artifact: %w", err)
	}

	sv := &SkillVersion{
		SkillID:        skill.ID,
		Version:        version,
		Status:         "draft",
		Changelog:      changelog,
		ArtifactPath:   artifactPath,
		ArtifactSize:   uint64(len(content)),
		ChecksumSHA256: checksum,
		CreatedBy:      userID,
	}
	sv, err = uc.versionRepo.Create(ctx, sv)
	if err != nil {
		return nil, err
	}

	// Enqueue scan task
	_ = uc.queue.Enqueue(ctx, sv.ID)

	return sv, nil
}

func (uc *VersionUsecase) List(ctx context.Context, orgName, skillName string) ([]*SkillVersion, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}
	skill, err := uc.skillRepo.FindByOrgAndName(ctx, org.ID, skillName)
	if err != nil || skill == nil {
		return nil, ErrSkillNotFound
	}
	return uc.versionRepo.ListBySkill(ctx, skill.ID)
}

func (uc *VersionUsecase) Get(ctx context.Context, orgName, skillName, version string) (*SkillVersion, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}
	skill, err := uc.skillRepo.FindByOrgAndName(ctx, org.ID, skillName)
	if err != nil || skill == nil {
		return nil, ErrSkillNotFound
	}
	sv, err := uc.versionRepo.FindBySkillAndVersion(ctx, skill.ID, version)
	if err != nil {
		return nil, err
	}
	if sv == nil {
		return nil, ErrVersionNotFound
	}
	return sv, nil
}

func (uc *VersionUsecase) SubmitForReview(ctx context.Context, userID uint64, orgName, skillName, version string) (*SkillVersion, error) {
	sv, err := uc.getVersionWithPermission(ctx, userID, orgName, skillName, version, "developer")
	if err != nil {
		return nil, err
	}
	if sv.Status != "draft" && sv.Status != "rejected" {
		return nil, ErrInvalidStateTransition
	}
	sv.Status = "pending_review"
	if err := uc.versionRepo.Update(ctx, sv); err != nil {
		return nil, err
	}
	return sv, nil
}

func (uc *VersionUsecase) Review(ctx context.Context, userID uint64, orgName, skillName, version, action, comment string) (*SkillVersion, error) {
	sv, err := uc.getVersionWithPermission(ctx, userID, orgName, skillName, version, "admin")
	if err != nil {
		return nil, err
	}
	if sv.Status != "pending_review" {
		return nil, ErrInvalidStateTransition
	}

	now := time.Now()
	sv.ReviewedBy = &userID
	sv.ReviewedAt = &now
	sv.ReviewComment = comment

	switch action {
	case "approve":
		sv.Status = "approved"
	case "reject":
		sv.Status = "rejected"
	default:
		return nil, errors.New("action must be 'approve' or 'reject'")
	}

	if err := uc.versionRepo.Update(ctx, sv); err != nil {
		return nil, err
	}
	return sv, nil
}

func (uc *VersionUsecase) Publish(ctx context.Context, userID uint64, orgName, skillName, version string) (*SkillVersion, error) {
	sv, err := uc.getVersionWithPermission(ctx, userID, orgName, skillName, version, "admin")
	if err != nil {
		return nil, err
	}

	// Idempotent: already published
	if sv.Status == "published" {
		return sv, nil
	}
	if sv.Status != "approved" {
		return nil, ErrInvalidStateTransition
	}

	now := time.Now()
	sv.Status = "published"
	sv.PublishedAt = &now
	if err := uc.versionRepo.Update(ctx, sv); err != nil {
		return nil, err
	}

	// Update skill latest_version
	org, _ := uc.orgRepo.FindByName(ctx, orgName)
	if org != nil {
		skill, _ := uc.skillRepo.FindByOrgAndName(ctx, org.ID, skillName)
		if skill != nil {
			skill.LatestVersion = version
			_ = uc.skillRepo.Update(ctx, skill)
			cacheKey := fmt.Sprintf("skill:%s:%s", orgName, skillName)
			_ = uc.cache.Delete(ctx, cacheKey)
		}
	}

	return sv, nil
}

func (uc *VersionUsecase) Download(ctx context.Context, orgName, skillName, version string) (io.ReadCloser, int64, string, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, 0, "", ErrOrgNotFound
	}
	skill, err := uc.skillRepo.FindByOrgAndName(ctx, org.ID, skillName)
	if err != nil || skill == nil {
		return nil, 0, "", ErrSkillNotFound
	}
	sv, err := uc.versionRepo.FindBySkillAndVersion(ctx, skill.ID, version)
	if err != nil || sv == nil {
		return nil, 0, "", ErrVersionNotFound
	}
	if sv.Status != "published" {
		return nil, 0, "", ErrNotPublished
	}

	reader, size, err := uc.storage.Download(ctx, sv.ArtifactPath)
	if err != nil {
		return nil, 0, "", fmt.Errorf("failed to download artifact: %w", err)
	}

	_ = uc.skillRepo.IncrementDownloadCount(ctx, skill.ID)
	return reader, size, sv.ChecksumSHA256, nil
}

func (uc *VersionUsecase) GetScanResults(ctx context.Context, orgName, skillName, version string) ([]*ScanResult, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}
	skill, err := uc.skillRepo.FindByOrgAndName(ctx, org.ID, skillName)
	if err != nil || skill == nil {
		return nil, ErrSkillNotFound
	}
	sv, err := uc.versionRepo.FindBySkillAndVersion(ctx, skill.ID, version)
	if err != nil || sv == nil {
		return nil, ErrVersionNotFound
	}
	return uc.scanRepo.ListByVersion(ctx, sv.ID)
}

func (uc *VersionUsecase) Rescan(ctx context.Context, userID uint64, orgName, skillName, version string) error {
	sv, err := uc.getVersionWithPermission(ctx, userID, orgName, skillName, version, "admin")
	if err != nil {
		return err
	}
	return uc.queue.Enqueue(ctx, sv.ID)
}

func (uc *VersionUsecase) ListPendingReview(ctx context.Context, orgIDs []uint64) ([]*SkillVersion, error) {
	return uc.versionRepo.ListPendingReview(ctx, orgIDs)
}

func (uc *VersionUsecase) getVersionWithPermission(ctx context.Context, userID uint64, orgName, skillName, version, requiredRole string) (*SkillVersion, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}

	member, err := uc.memberRepo.FindByOrgAndUser(ctx, org.ID, userID)
	if err != nil || member == nil || roleHierarchy[member.Role] < roleHierarchy[requiredRole] {
		return nil, ErrPermissionDenied
	}

	skill, err := uc.skillRepo.FindByOrgAndName(ctx, org.ID, skillName)
	if err != nil || skill == nil {
		return nil, ErrSkillNotFound
	}

	sv, err := uc.versionRepo.FindBySkillAndVersion(ctx, skill.ID, version)
	if err != nil || sv == nil {
		return nil, ErrVersionNotFound
	}
	return sv, nil
}

type bytesReader struct {
	data   []byte
	offset int
}

func newBytesReader(data []byte) *bytesReader {
	return &bytesReader{data: data}
}

func (r *bytesReader) Read(p []byte) (n int, err error) {
	if r.offset >= len(r.data) {
		return 0, io.EOF
	}
	n = copy(p, r.data[r.offset:])
	r.offset += n
	return n, nil
}
