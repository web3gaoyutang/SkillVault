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

var ProviderSet = wire.NewSet(
	NewData,
	NewUserRepo,
	NewOrganizationRepo,
	NewOrgMemberRepo,
	NewSkillRepo,
	NewSkillVersionRepo,
	NewScanResultRepo,
	NewAPITokenRepo,
	NewAuditLogRepo,
	NewCacheRepo,
	NewObjectStorageRepo,
	NewScanQueueRepo,
	NewAuthConfig,
)

type Data struct {
	db    *gorm.DB
	rdb   *redis.Client
	minio *minio.Client
	conf  *conf.Data
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

	// Ensure MinIO bucket exists
	if minioClient != nil {
		ctx := context.Background()
		exists, err := minioClient.BucketExists(ctx, c.MinIO.Bucket)
		if err != nil {
			helper.Warnf("minio bucket check failed: %v", err)
		} else if !exists {
			if err := minioClient.MakeBucket(ctx, c.MinIO.Bucket, minio.MakeBucketOptions{}); err != nil {
				helper.Warnf("minio bucket creation failed: %v", err)
			} else {
				helper.Infof("created minio bucket: %s", c.MinIO.Bucket)
			}
		}
	}

	cleanup := func() {
		helper.Info("closing data resources")
		_ = sqlDB.Close()
		_ = rdb.Close()
	}

	return &Data{db: db, rdb: rdb, minio: minioClient, conf: c}, cleanup, nil
}

func NewAuthConfig(c *conf.Auth) biz.AuthConfig {
	return biz.AuthConfig{
		JWTSecret:       c.JWTSecret,
		AccessTokenTTL:  c.AccessTokenTTL,
		RefreshTokenTTL: c.RefreshTokenTTL,
	}
}
