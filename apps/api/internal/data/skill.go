package data

import (
	"context"

	"github.com/go-kratos/kratos/v2/log"
	"gorm.io/gorm"

	"github.com/skillvault/api/internal/biz"
)

type skillRepo struct {
	data *Data
	log  *log.Helper
}

func NewSkillRepo(data *Data, logger log.Logger) biz.SkillRepo {
	return &skillRepo{data: data, log: log.NewHelper(logger)}
}

func (r *skillRepo) Create(ctx context.Context, skill *biz.Skill) (*biz.Skill, error) {
	m := skillModelFromEntity(skill)
	if err := r.data.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *skillRepo) FindByID(ctx context.Context, id uint64) (*biz.Skill, error) {
	var m SkillModel
	if err := r.data.db.WithContext(ctx).Where("id = ?", id).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *skillRepo) FindByOrgAndName(ctx context.Context, orgID uint64, name string) (*biz.Skill, error) {
	var m SkillModel
	if err := r.data.db.WithContext(ctx).Where("org_id = ? AND name = ?", orgID, name).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *skillRepo) List(ctx context.Context, query biz.SkillQuery) ([]*biz.Skill, int64, error) {
	db := r.data.db.WithContext(ctx).Model(&SkillModel{})

	if query.Keyword != "" {
		db = db.Where("MATCH(name, display_name, description) AGAINST(? IN BOOLEAN MODE)", query.Keyword)
	}
	if query.OrgID != 0 {
		db = db.Where("org_id = ?", query.OrgID)
	}
	if query.Visibility != "" {
		db = db.Where("visibility = ?", query.Visibility)
	}
	if query.Tag != "" {
		db = db.Where("JSON_CONTAINS(tags, ?)", `"`+query.Tag+`"`)
	}
	if query.Runtime != "" {
		db = db.Where("JSON_CONTAINS(runtimes, ?)", `"`+query.Runtime+`"`)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := query.Page
	if page <= 0 {
		page = 1
	}
	pageSize := query.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}

	var models []SkillModel
	if err := db.Offset((page - 1) * pageSize).Limit(pageSize).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, 0, err
	}

	result := make([]*biz.Skill, len(models))
	for i, m := range models {
		result[i] = m.toEntity()
	}
	return result, total, nil
}

func (r *skillRepo) Update(ctx context.Context, skill *biz.Skill) error {
	m := skillModelFromEntity(skill)
	return r.data.db.WithContext(ctx).Save(m).Error
}

func (r *skillRepo) Delete(ctx context.Context, id uint64) error {
	return r.data.db.WithContext(ctx).Delete(&SkillModel{}, id).Error
}

func (r *skillRepo) IncrementDownloadCount(ctx context.Context, id uint64) error {
	return r.data.db.WithContext(ctx).
		Model(&SkillModel{}).
		Where("id = ?", id).
		UpdateColumn("download_count", gorm.Expr("download_count + 1")).Error
}
