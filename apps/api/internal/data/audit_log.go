package data

import (
	"context"

	"github.com/go-kratos/kratos/v2/log"

	"github.com/skillvault/api/internal/biz"
)

type auditLogRepo struct {
	data *Data
	log  *log.Helper
}

func NewAuditLogRepo(data *Data, logger log.Logger) biz.AuditLogRepo {
	return &auditLogRepo{data: data, log: log.NewHelper(logger)}
}

func (r *auditLogRepo) Create(ctx context.Context, entry *biz.AuditLog) error {
	m := &AuditLogModel{
		UserID:       entry.UserID,
		OrgID:        entry.OrgID,
		Action:       entry.Action,
		ResourceType: entry.ResourceType,
		ResourceID:   entry.ResourceID,
		Detail:       JSONMap(entry.Detail),
		IP:           entry.IP,
		UserAgent:    entry.UserAgent,
	}
	return r.data.db.WithContext(ctx).Create(m).Error
}

func (r *auditLogRepo) List(ctx context.Context, query biz.AuditQuery) ([]*biz.AuditLog, int64, error) {
	db := r.data.db.WithContext(ctx).Model(&AuditLogModel{})

	if query.OrgID != 0 {
		db = db.Where("org_id = ?", query.OrgID)
	}
	if query.UserID != 0 {
		db = db.Where("user_id = ?", query.UserID)
	}
	if query.Action != "" {
		db = db.Where("action = ?", query.Action)
	}
	if query.ResourceType != "" {
		db = db.Where("resource_type = ?", query.ResourceType)
	}
	if query.StartTime != nil {
		db = db.Where("created_at >= ?", *query.StartTime)
	}
	if query.EndTime != nil {
		db = db.Where("created_at <= ?", *query.EndTime)
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

	var models []AuditLogModel
	if err := db.Offset((page - 1) * pageSize).Limit(pageSize).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, 0, err
	}

	result := make([]*biz.AuditLog, len(models))
	for i, m := range models {
		result[i] = m.toEntity()
	}
	return result, total, nil
}
