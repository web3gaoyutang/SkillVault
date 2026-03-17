package data

import (
	"context"

	"github.com/go-kratos/kratos/v2/log"
	"gorm.io/gorm"

	"github.com/skillvault/api/internal/biz"
)

type skillVersionRepo struct {
	data *Data
	log  *log.Helper
}

func NewSkillVersionRepo(data *Data, logger log.Logger) biz.SkillVersionRepo {
	return &skillVersionRepo{data: data, log: log.NewHelper(logger)}
}

func (r *skillVersionRepo) Create(ctx context.Context, version *biz.SkillVersion) (*biz.SkillVersion, error) {
	m := &SkillVersionModel{
		SkillID:        version.SkillID,
		Version:        version.Version,
		Status:         version.Status,
		Changelog:      version.Changelog,
		ArtifactPath:   version.ArtifactPath,
		ArtifactSize:   version.ArtifactSize,
		ChecksumSHA256: version.ChecksumSHA256,
		CreatedBy:      version.CreatedBy,
	}
	if err := r.data.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *skillVersionRepo) FindByID(ctx context.Context, id uint64) (*biz.SkillVersion, error) {
	var m SkillVersionModel
	if err := r.data.db.WithContext(ctx).Where("id = ?", id).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *skillVersionRepo) FindBySkillAndVersion(ctx context.Context, skillID uint64, version string) (*biz.SkillVersion, error) {
	var m SkillVersionModel
	if err := r.data.db.WithContext(ctx).Where("skill_id = ? AND version = ?", skillID, version).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *skillVersionRepo) ListBySkill(ctx context.Context, skillID uint64) ([]*biz.SkillVersion, error) {
	var models []SkillVersionModel
	if err := r.data.db.WithContext(ctx).Where("skill_id = ?", skillID).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*biz.SkillVersion, len(models))
	for i, m := range models {
		result[i] = m.toEntity()
	}
	return result, nil
}

func (r *skillVersionRepo) Update(ctx context.Context, version *biz.SkillVersion) error {
	return r.data.db.WithContext(ctx).
		Model(&SkillVersionModel{}).
		Where("id = ?", version.ID).
		Updates(map[string]interface{}{
			"status":         version.Status,
			"reviewed_by":    version.ReviewedBy,
			"reviewed_at":    version.ReviewedAt,
			"review_comment": version.ReviewComment,
			"published_at":   version.PublishedAt,
		}).Error
}

func (r *skillVersionRepo) ListPendingReview(ctx context.Context, orgIDs []uint64) ([]*biz.SkillVersion, error) {
	var models []SkillVersionModel
	query := r.data.db.WithContext(ctx).
		Where("status = ?", "pending_review")
	if len(orgIDs) > 0 {
		query = query.Joins("INNER JOIN skills ON skills.id = skill_versions.skill_id").
			Where("skills.org_id IN ?", orgIDs)
	}
	if err := query.Order("skill_versions.created_at DESC").Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*biz.SkillVersion, len(models))
	for i, m := range models {
		result[i] = m.toEntity()
	}
	return result, nil
}
