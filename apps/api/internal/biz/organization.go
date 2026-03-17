package biz

import (
	"context"
	"errors"
	"fmt"
	"time"
)

var (
	ErrOrgNotFound    = errors.New("organization not found")
	ErrOrgExists      = errors.New("organization name already exists")
	ErrPermissionDenied = errors.New("permission denied")
	ErrMemberExists   = errors.New("member already exists in organization")
	ErrMemberNotFound = errors.New("member not found")
	ErrCannotRemoveOwner = errors.New("cannot remove organization owner")
)

var roleHierarchy = map[string]int{
	"viewer":    0,
	"developer": 1,
	"admin":     2,
	"owner":     3,
}

func (uc *OrganizationUsecase) Create(ctx context.Context, userID uint64, name, displayName, description string) (*Organization, error) {
	existing, _ := uc.orgRepo.FindByName(ctx, name)
	if existing != nil {
		return nil, ErrOrgExists
	}

	org := &Organization{
		Name:        name,
		DisplayName: displayName,
		Description: description,
		CreatedBy:   userID,
	}
	org, err := uc.orgRepo.Create(ctx, org)
	if err != nil {
		return nil, err
	}

	// Auto-add creator as owner
	_, err = uc.memberRepo.Create(ctx, &OrgMember{
		OrgID:  org.ID,
		UserID: userID,
		Role:   "owner",
	})
	if err != nil {
		return nil, err
	}

	return org, nil
}

func (uc *OrganizationUsecase) Get(ctx context.Context, name string) (*Organization, error) {
	org, err := uc.orgRepo.FindByName(ctx, name)
	if err != nil {
		return nil, err
	}
	if org == nil {
		return nil, ErrOrgNotFound
	}
	return org, nil
}

func (uc *OrganizationUsecase) ListByUser(ctx context.Context, userID uint64) ([]*Organization, error) {
	return uc.orgRepo.ListByUser(ctx, userID)
}

func (uc *OrganizationUsecase) Update(ctx context.Context, userID uint64, name string, displayName, description *string) (*Organization, error) {
	org, err := uc.orgRepo.FindByName(ctx, name)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}

	if err := uc.checkPermission(ctx, org.ID, userID, "admin"); err != nil {
		return nil, err
	}

	if displayName != nil {
		org.DisplayName = *displayName
	}
	if description != nil {
		org.Description = *description
	}
	if err := uc.orgRepo.Update(ctx, org); err != nil {
		return nil, err
	}

	cacheKey := fmt.Sprintf("org:%d", org.ID)
	_ = uc.cache.Delete(ctx, cacheKey)

	return org, nil
}

func (uc *OrganizationUsecase) Delete(ctx context.Context, userID uint64, name string) error {
	org, err := uc.orgRepo.FindByName(ctx, name)
	if err != nil || org == nil {
		return ErrOrgNotFound
	}

	if err := uc.checkPermission(ctx, org.ID, userID, "owner"); err != nil {
		return err
	}

	if err := uc.orgRepo.Delete(ctx, org.ID); err != nil {
		return err
	}

	cacheKey := fmt.Sprintf("org:%d", org.ID)
	_ = uc.cache.Delete(ctx, cacheKey)
	return nil
}

func (uc *OrganizationUsecase) ListMembers(ctx context.Context, orgName string) ([]*OrgMember, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}
	return uc.memberRepo.ListByOrg(ctx, org.ID)
}

func (uc *OrganizationUsecase) AddMember(ctx context.Context, userID uint64, orgName string, targetUserID uint64, role string) (*OrgMember, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}

	if err := uc.checkPermission(ctx, org.ID, userID, "admin"); err != nil {
		return nil, err
	}

	existing, _ := uc.memberRepo.FindByOrgAndUser(ctx, org.ID, targetUserID)
	if existing != nil {
		return nil, ErrMemberExists
	}

	member := &OrgMember{
		OrgID:  org.ID,
		UserID: targetUserID,
		Role:   role,
	}
	return uc.memberRepo.Create(ctx, member)
}

func (uc *OrganizationUsecase) UpdateMemberRole(ctx context.Context, userID uint64, orgName string, targetUserID uint64, newRole string) error {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return ErrOrgNotFound
	}

	if err := uc.checkPermission(ctx, org.ID, userID, "admin"); err != nil {
		return err
	}

	member, err := uc.memberRepo.FindByOrgAndUser(ctx, org.ID, targetUserID)
	if err != nil || member == nil {
		return ErrMemberNotFound
	}

	// Cannot change owner role unless you are also owner
	if member.Role == "owner" {
		if err := uc.checkPermission(ctx, org.ID, userID, "owner"); err != nil {
			return err
		}
	}

	member.Role = newRole
	return uc.memberRepo.Update(ctx, member)
}

func (uc *OrganizationUsecase) RemoveMember(ctx context.Context, userID uint64, orgName string, targetUserID uint64) error {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return ErrOrgNotFound
	}

	if err := uc.checkPermission(ctx, org.ID, userID, "admin"); err != nil {
		return err
	}

	member, err := uc.memberRepo.FindByOrgAndUser(ctx, org.ID, targetUserID)
	if err != nil || member == nil {
		return ErrMemberNotFound
	}

	if member.Role == "owner" {
		return ErrCannotRemoveOwner
	}

	return uc.memberRepo.Delete(ctx, org.ID, targetUserID)
}

func (uc *OrganizationUsecase) CheckPermission(ctx context.Context, orgName string, userID uint64, requiredRole string) error {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return ErrOrgNotFound
	}
	return uc.checkPermission(ctx, org.ID, userID, requiredRole)
}

func (uc *OrganizationUsecase) GetOrgByName(ctx context.Context, name string) (*Organization, error) {
	cacheKey := fmt.Sprintf("org:name:%s", name)
	var org Organization
	if err := uc.cache.Get(ctx, cacheKey, &org); err == nil && org.ID != 0 {
		return &org, nil
	}
	o, err := uc.orgRepo.FindByName(ctx, name)
	if err != nil {
		return nil, err
	}
	if o == nil {
		return nil, ErrOrgNotFound
	}
	_ = uc.cache.Set(ctx, cacheKey, o, 30*time.Minute)
	return o, nil
}

func (uc *OrganizationUsecase) GetOrgByID(ctx context.Context, id uint64) (*Organization, error) {
	org, err := uc.orgRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return org, nil
}

func (uc *OrganizationUsecase) checkPermission(ctx context.Context, orgID, userID uint64, requiredRole string) error {
	member, err := uc.memberRepo.FindByOrgAndUser(ctx, orgID, userID)
	if err != nil || member == nil {
		return ErrPermissionDenied
	}
	if roleHierarchy[member.Role] < roleHierarchy[requiredRole] {
		return ErrPermissionDenied
	}
	return nil
}
