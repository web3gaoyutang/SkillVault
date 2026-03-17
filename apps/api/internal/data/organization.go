package data

import (
	"context"

	"github.com/go-kratos/kratos/v2/log"
	"gorm.io/gorm"

	"github.com/skillvault/api/internal/biz"
)

type organizationRepo struct {
	data *Data
	log  *log.Helper
}

func NewOrganizationRepo(data *Data, logger log.Logger) biz.OrganizationRepo {
	return &organizationRepo{data: data, log: log.NewHelper(logger)}
}

func (r *organizationRepo) Create(ctx context.Context, org *biz.Organization) (*biz.Organization, error) {
	m := orgModelFromEntity(org)
	if err := r.data.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *organizationRepo) FindByID(ctx context.Context, id uint64) (*biz.Organization, error) {
	var m OrganizationModel
	if err := r.data.db.WithContext(ctx).Where("id = ?", id).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *organizationRepo) FindByName(ctx context.Context, name string) (*biz.Organization, error) {
	var m OrganizationModel
	if err := r.data.db.WithContext(ctx).Where("name = ?", name).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *organizationRepo) ListByUser(ctx context.Context, userID uint64) ([]*biz.Organization, error) {
	var models []OrganizationModel
	err := r.data.db.WithContext(ctx).
		Joins("INNER JOIN org_members ON org_members.org_id = organizations.id").
		Where("org_members.user_id = ?", userID).
		Find(&models).Error
	if err != nil {
		return nil, err
	}
	result := make([]*biz.Organization, len(models))
	for i, m := range models {
		result[i] = m.toEntity()
	}
	return result, nil
}

func (r *organizationRepo) Update(ctx context.Context, org *biz.Organization) error {
	m := orgModelFromEntity(org)
	return r.data.db.WithContext(ctx).Save(m).Error
}

func (r *organizationRepo) Delete(ctx context.Context, id uint64) error {
	return r.data.db.WithContext(ctx).Delete(&OrganizationModel{}, id).Error
}
