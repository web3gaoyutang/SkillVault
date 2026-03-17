package biz

import (
	"context"
	"errors"
	"fmt"
	"time"
)

var (
	ErrSkillNotFound = errors.New("skill not found")
	ErrSkillExists   = errors.New("skill already exists in this organization")
	ErrLockFailed    = errors.New("failed to acquire lock, please retry")
)

func (uc *SkillUsecase) Create(ctx context.Context, userID uint64, orgName, name, displayName, description, visibility string, tags, runtimes []string) (*Skill, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}

	member, err := uc.memberRepo.FindByOrgAndUser(ctx, org.ID, userID)
	if err != nil || member == nil || roleHierarchy[member.Role] < roleHierarchy["developer"] {
		return nil, ErrPermissionDenied
	}

	// Distributed lock
	lockKey := fmt.Sprintf("lock:skill:%s:%s", orgName, name)
	acquired, _ := uc.cache.SetNX(ctx, lockKey, "1", 10*time.Second)
	if !acquired {
		return nil, ErrLockFailed
	}
	defer func() { _ = uc.cache.Delete(ctx, lockKey) }()

	existing, _ := uc.skillRepo.FindByOrgAndName(ctx, org.ID, name)
	if existing != nil {
		return nil, ErrSkillExists
	}

	if visibility == "" {
		visibility = "private"
	}

	skill := &Skill{
		OrgID:       org.ID,
		Name:        name,
		DisplayName: displayName,
		Description: description,
		Tags:        tags,
		Visibility:  visibility,
		Runtimes:    runtimes,
		CreatedBy:   userID,
	}
	return uc.skillRepo.Create(ctx, skill)
}

func (uc *SkillUsecase) Get(ctx context.Context, orgName, name string) (*Skill, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}

	cacheKey := fmt.Sprintf("skill:%s:%s", orgName, name)
	var skill Skill
	if err := uc.cache.Get(ctx, cacheKey, &skill); err == nil && skill.ID != 0 {
		skill.OrgName = orgName
		return &skill, nil
	}

	s, err := uc.skillRepo.FindByOrgAndName(ctx, org.ID, name)
	if err != nil {
		return nil, err
	}
	if s == nil {
		return nil, ErrSkillNotFound
	}
	s.OrgName = orgName
	_ = uc.cache.Set(ctx, cacheKey, s, 15*time.Minute)
	return s, nil
}

func (uc *SkillUsecase) List(ctx context.Context, query SkillQuery) ([]*Skill, int64, error) {
	return uc.skillRepo.List(ctx, query)
}

func (uc *SkillUsecase) Update(ctx context.Context, userID uint64, orgName, name string, updates map[string]interface{}) (*Skill, error) {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return nil, ErrOrgNotFound
	}

	member, err := uc.memberRepo.FindByOrgAndUser(ctx, org.ID, userID)
	if err != nil || member == nil || roleHierarchy[member.Role] < roleHierarchy["developer"] {
		return nil, ErrPermissionDenied
	}

	skill, err := uc.skillRepo.FindByOrgAndName(ctx, org.ID, name)
	if err != nil || skill == nil {
		return nil, ErrSkillNotFound
	}

	if v, ok := updates["display_name"].(string); ok {
		skill.DisplayName = v
	}
	if v, ok := updates["description"].(string); ok {
		skill.Description = v
	}
	if v, ok := updates["visibility"].(string); ok {
		skill.Visibility = v
	}
	if v, ok := updates["tags"].([]string); ok {
		skill.Tags = v
	}
	if v, ok := updates["runtimes"].([]string); ok {
		skill.Runtimes = v
	}

	if err := uc.skillRepo.Update(ctx, skill); err != nil {
		return nil, err
	}

	cacheKey := fmt.Sprintf("skill:%s:%s", orgName, name)
	_ = uc.cache.Delete(ctx, cacheKey)

	skill.OrgName = orgName
	return skill, nil
}

func (uc *SkillUsecase) Delete(ctx context.Context, userID uint64, orgName, name string) error {
	org, err := uc.orgRepo.FindByName(ctx, orgName)
	if err != nil || org == nil {
		return ErrOrgNotFound
	}

	member, err := uc.memberRepo.FindByOrgAndUser(ctx, org.ID, userID)
	if err != nil || member == nil || roleHierarchy[member.Role] < roleHierarchy["admin"] {
		return ErrPermissionDenied
	}

	skill, err := uc.skillRepo.FindByOrgAndName(ctx, org.ID, name)
	if err != nil || skill == nil {
		return ErrSkillNotFound
	}

	if err := uc.skillRepo.Delete(ctx, skill.ID); err != nil {
		return err
	}

	cacheKey := fmt.Sprintf("skill:%s:%s", orgName, name)
	_ = uc.cache.Delete(ctx, cacheKey)
	return nil
}
