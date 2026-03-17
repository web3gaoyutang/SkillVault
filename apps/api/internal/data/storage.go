package data

import (
	"context"
	"fmt"
	"io"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/minio/minio-go/v7"

	"github.com/skillvault/api/internal/biz"
)

type objectStorageRepo struct {
	data *Data
	log  *log.Helper
}

func NewObjectStorageRepo(data *Data, logger log.Logger) biz.ObjectStorageRepo {
	return &objectStorageRepo{data: data, log: log.NewHelper(logger)}
}

func (r *objectStorageRepo) Upload(ctx context.Context, key string, reader io.Reader, size int64, contentType string) error {
	_, err := r.data.minio.PutObject(ctx, r.data.conf.MinIO.Bucket, key, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("minio upload failed: %w", err)
	}
	return nil
}

func (r *objectStorageRepo) Download(ctx context.Context, key string) (io.ReadCloser, int64, error) {
	obj, err := r.data.minio.GetObject(ctx, r.data.conf.MinIO.Bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, 0, fmt.Errorf("minio download failed: %w", err)
	}
	stat, err := obj.Stat()
	if err != nil {
		obj.Close()
		return nil, 0, fmt.Errorf("minio stat failed: %w", err)
	}
	return obj, stat.Size, nil
}

func (r *objectStorageRepo) Delete(ctx context.Context, key string) error {
	return r.data.minio.RemoveObject(ctx, r.data.conf.MinIO.Bucket, key, minio.RemoveObjectOptions{})
}
