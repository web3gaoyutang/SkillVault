package data

import (
	"context"
	"time"

	"github.com/go-kratos/kratos/v2/log"
	"gorm.io/gorm"

	"github.com/skillvault/api/internal/biz"
)

type apiTokenRepo struct {
	data *Data
	log  *log.Helper
}

func NewAPITokenRepo(data *Data, logger log.Logger) biz.APITokenRepo {
	return &apiTokenRepo{data: data, log: log.NewHelper(logger)}
}

func (r *apiTokenRepo) Create(ctx context.Context, token *biz.APIToken) (*biz.APIToken, error) {
	m := &APITokenModel{
		UserID:      token.UserID,
		Name:        token.Name,
		TokenHash:   token.TokenHash,
		TokenPrefix: token.TokenPrefix,
		Scopes:      StringSlice(token.Scopes),
		ExpiresAt:   token.ExpiresAt,
	}
	if err := r.data.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *apiTokenRepo) FindByHash(ctx context.Context, hash string) (*biz.APIToken, error) {
	var m APITokenModel
	if err := r.data.db.WithContext(ctx).Where("token_hash = ?", hash).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *apiTokenRepo) ListByUser(ctx context.Context, userID uint64) ([]*biz.APIToken, error) {
	var models []APITokenModel
	if err := r.data.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*biz.APIToken, len(models))
	for i, m := range models {
		result[i] = m.toEntity()
	}
	return result, nil
}

func (r *apiTokenRepo) Delete(ctx context.Context, id, userID uint64) error {
	return r.data.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&APITokenModel{}).Error
}

func (r *apiTokenRepo) UpdateLastUsed(ctx context.Context, id uint64) error {
	now := time.Now()
	return r.data.db.WithContext(ctx).
		Model(&APITokenModel{}).
		Where("id = ?", id).
		Update("last_used_at", now).Error
}
