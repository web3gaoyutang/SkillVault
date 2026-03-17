package data

import (
	"context"

	"github.com/go-kratos/kratos/v2/log"
	"gorm.io/gorm"

	"github.com/skillvault/api/internal/biz"
)

type userRepo struct {
	data *Data
	log  *log.Helper
}

func NewUserRepo(data *Data, logger log.Logger) biz.UserRepo {
	return &userRepo{data: data, log: log.NewHelper(logger)}
}

func (r *userRepo) Create(ctx context.Context, user *biz.User) (*biz.User, error) {
	m := userModelFromEntity(user)
	if err := r.data.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *userRepo) FindByID(ctx context.Context, id uint64) (*biz.User, error) {
	var m UserModel
	if err := r.data.db.WithContext(ctx).Where("id = ?", id).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *userRepo) FindByUsername(ctx context.Context, username string) (*biz.User, error) {
	var m UserModel
	if err := r.data.db.WithContext(ctx).Where("username = ?", username).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *userRepo) FindByEmail(ctx context.Context, email string) (*biz.User, error) {
	var m UserModel
	if err := r.data.db.WithContext(ctx).Where("email = ?", email).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *userRepo) Update(ctx context.Context, user *biz.User) error {
	m := userModelFromEntity(user)
	return r.data.db.WithContext(ctx).Save(m).Error
}
