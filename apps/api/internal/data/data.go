package data

import (
	"context"
	"fmt"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/go-redis/redis/v8"
	"github.com/google/wire"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/skillvault/api/internal/biz"
	"github.com/skillvault/api/internal/conf"
)

var ProviderSet = wire.NewSet(NewData, NewUserRepo, NewSkillRepo, NewOrganizationRepo)

type Data struct {
	db    *gorm.DB
	rdb   *redis.Client
	minio *minio.Client
}

func NewData(c *conf.Data, logger log.Logger) (*Data, func(), error) {
	helper := log.NewHelper(logger)

	db, err := gorm.Open(mysql.Open(c.Database.Source), &gorm.Config{})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}
	sqlDB.SetMaxOpenConns(c.Database.MaxOpenConns)
	sqlDB.SetMaxIdleConns(c.Database.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(c.Database.ConnMaxLifetime)

	rdb := redis.NewClient(&redis.Options{
		Addr:         c.Redis.Addr,
		Password:     c.Redis.Password,
		DB:           c.Redis.DB,
		ReadTimeout:  c.Redis.ReadTimeout,
		WriteTimeout: c.Redis.WriteTimeout,
	})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		helper.Warnf("redis ping failed: %v", err)
	}

	minioClient, err := minio.New(c.MinIO.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(c.MinIO.AccessKey, c.MinIO.SecretKey, ""),
		Secure: c.MinIO.UseSSL,
	})
	if err != nil {
		helper.Warnf("minio connection failed: %v", err)
	}

	cleanup := func() {
		helper.Info("closing data resources")
		_ = sqlDB.Close()
		_ = rdb.Close()
	}

	return &Data{db: db, rdb: rdb, minio: minioClient}, cleanup, nil
}

// --- Repository implementations ---

type userRepo struct {
	data *Data
	log  *log.Helper
}

func NewUserRepo(data *Data, logger log.Logger) biz.UserRepo {
	return &userRepo{data: data, log: log.NewHelper(logger)}
}

func (r *userRepo) Create(ctx context.Context, user *biz.User) (*biz.User, error) {
	// TODO: implement
	return user, nil
}

func (r *userRepo) FindByID(ctx context.Context, id uint64) (*biz.User, error) {
	// TODO: implement
	return nil, nil
}

func (r *userRepo) FindByUsername(ctx context.Context, username string) (*biz.User, error) {
	// TODO: implement
	return nil, nil
}

func (r *userRepo) FindByEmail(ctx context.Context, email string) (*biz.User, error) {
	// TODO: implement
	return nil, nil
}

type skillRepo struct {
	data *Data
	log  *log.Helper
}

func NewSkillRepo(data *Data, logger log.Logger) biz.SkillRepo {
	return &skillRepo{data: data, log: log.NewHelper(logger)}
}

func (r *skillRepo) Create(ctx context.Context, skill *biz.Skill) (*biz.Skill, error) {
	// TODO: implement
	return skill, nil
}

func (r *skillRepo) FindByID(ctx context.Context, id uint64) (*biz.Skill, error) {
	// TODO: implement
	return nil, nil
}

func (r *skillRepo) FindByOrgAndName(ctx context.Context, orgID uint64, name string) (*biz.Skill, error) {
	// TODO: implement
	return nil, nil
}

func (r *skillRepo) List(ctx context.Context, query biz.SkillQuery) ([]*biz.Skill, int64, error) {
	// TODO: implement
	return nil, 0, nil
}

type organizationRepo struct {
	data *Data
	log  *log.Helper
}

func NewOrganizationRepo(data *Data, logger log.Logger) biz.OrganizationRepo {
	return &organizationRepo{data: data, log: log.NewHelper(logger)}
}

func (r *organizationRepo) Create(ctx context.Context, org *biz.Organization) (*biz.Organization, error) {
	// TODO: implement
	return org, nil
}

func (r *organizationRepo) FindByID(ctx context.Context, id uint64) (*biz.Organization, error) {
	// TODO: implement
	return nil, nil
}

func (r *organizationRepo) FindByName(ctx context.Context, name string) (*biz.Organization, error) {
	// TODO: implement
	return nil, nil
}

func (r *organizationRepo) ListByUser(ctx context.Context, userID uint64) ([]*biz.Organization, error) {
	// TODO: implement
	return nil, nil
}
