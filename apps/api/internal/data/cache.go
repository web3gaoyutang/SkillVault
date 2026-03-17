package data

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-kratos/kratos/v2/log"

	"github.com/skillvault/api/internal/biz"
)

type cacheRepo struct {
	data *Data
	log  *log.Helper
}

func NewCacheRepo(data *Data, logger log.Logger) biz.CacheRepo {
	return &cacheRepo{data: data, log: log.NewHelper(logger)}
}

func (r *cacheRepo) Get(ctx context.Context, key string, dest interface{}) error {
	val, err := r.data.rdb.Get(ctx, key).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(val), dest)
}

func (r *cacheRepo) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	b, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal cache value: %w", err)
	}
	return r.data.rdb.Set(ctx, key, string(b), ttl).Err()
}

func (r *cacheRepo) Delete(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}
	return r.data.rdb.Del(ctx, keys...).Err()
}

func (r *cacheRepo) SetNX(ctx context.Context, key string, value interface{}, ttl time.Duration) (bool, error) {
	b, err := json.Marshal(value)
	if err != nil {
		return false, err
	}
	return r.data.rdb.SetNX(ctx, key, string(b), ttl).Result()
}
