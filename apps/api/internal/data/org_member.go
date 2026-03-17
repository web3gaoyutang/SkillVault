package data

import (
	"context"

	"github.com/go-kratos/kratos/v2/log"
	"gorm.io/gorm"

	"github.com/skillvault/api/internal/biz"
)

type orgMemberRepo struct {
	data *Data
	log  *log.Helper
}

func NewOrgMemberRepo(data *Data, logger log.Logger) biz.OrgMemberRepo {
	return &orgMemberRepo{data: data, log: log.NewHelper(logger)}
}

func (r *orgMemberRepo) Create(ctx context.Context, member *biz.OrgMember) (*biz.OrgMember, error) {
	m := &OrgMemberModel{
		OrgID:  member.OrgID,
		UserID: member.UserID,
		Role:   member.Role,
	}
	if err := r.data.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *orgMemberRepo) FindByOrgAndUser(ctx context.Context, orgID, userID uint64) (*biz.OrgMember, error) {
	var m OrgMemberModel
	if err := r.data.db.WithContext(ctx).Where("org_id = ? AND user_id = ?", orgID, userID).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *orgMemberRepo) ListByOrg(ctx context.Context, orgID uint64) ([]*biz.OrgMember, error) {
	type memberWithUser struct {
		OrgMemberModel
		Username string `gorm:"column:username"`
		Email    string `gorm:"column:email"`
	}

	var results []memberWithUser
	err := r.data.db.WithContext(ctx).
		Table("org_members").
		Select("org_members.*, users.username, users.email").
		Joins("LEFT JOIN users ON users.id = org_members.user_id").
		Where("org_members.org_id = ?", orgID).
		Scan(&results).Error
	if err != nil {
		return nil, err
	}

	members := make([]*biz.OrgMember, len(results))
	for i, r := range results {
		m := r.OrgMemberModel.toEntity()
		m.Username = r.Username
		m.Email = r.Email
		members[i] = m
	}
	return members, nil
}

func (r *orgMemberRepo) Update(ctx context.Context, member *biz.OrgMember) error {
	return r.data.db.WithContext(ctx).
		Model(&OrgMemberModel{}).
		Where("id = ?", member.ID).
		Update("role", member.Role).Error
}

func (r *orgMemberRepo) Delete(ctx context.Context, orgID, userID uint64) error {
	return r.data.db.WithContext(ctx).
		Where("org_id = ? AND user_id = ?", orgID, userID).
		Delete(&OrgMemberModel{}).Error
}
