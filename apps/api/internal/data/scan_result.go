package data

import (
	"context"

	"github.com/go-kratos/kratos/v2/log"

	"github.com/skillvault/api/internal/biz"
)

type scanResultRepo struct {
	data *Data
	log  *log.Helper
}

func NewScanResultRepo(data *Data, logger log.Logger) biz.ScanResultRepo {
	return &scanResultRepo{data: data, log: log.NewHelper(logger)}
}

func (r *scanResultRepo) Create(ctx context.Context, result *biz.ScanResult) (*biz.ScanResult, error) {
	m := &ScanResultModel{
		VersionID: result.VersionID,
		ScanType:  result.ScanType,
		Status:    result.Status,
		Findings:  JSONMap(result.Findings),
	}
	if err := r.data.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, err
	}
	return m.toEntity(), nil
}

func (r *scanResultRepo) ListByVersion(ctx context.Context, versionID uint64) ([]*biz.ScanResult, error) {
	var models []ScanResultModel
	if err := r.data.db.WithContext(ctx).Where("version_id = ?", versionID).Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*biz.ScanResult, len(models))
	for i, m := range models {
		result[i] = m.toEntity()
	}
	return result, nil
}
