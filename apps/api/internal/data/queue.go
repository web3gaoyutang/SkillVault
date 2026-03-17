package data

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/go-kratos/kratos/v2/log"

	"github.com/skillvault/api/internal/biz"
)

type scanQueueRepo struct {
	data *Data
	log  *log.Helper
}

func NewScanQueueRepo(data *Data, logger log.Logger) biz.ScanQueueRepo {
	return &scanQueueRepo{data: data, log: log.NewHelper(logger)}
}

func (r *scanQueueRepo) Enqueue(ctx context.Context, versionID uint64) error {
	task := map[string]interface{}{
		"version_id": versionID,
	}
	b, err := json.Marshal(task)
	if err != nil {
		return fmt.Errorf("failed to marshal scan task: %w", err)
	}
	return r.data.rdb.LPush(ctx, "queue:scan", string(b)).Err()
}
