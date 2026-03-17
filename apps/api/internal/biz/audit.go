package biz

import "context"

func (uc *AuditUsecase) Log(ctx context.Context, entry *AuditLog) {
	if err := uc.auditRepo.Create(ctx, entry); err != nil {
		uc.log.WithContext(ctx).Errorf("failed to write audit log: %v", err)
	}
}

func (uc *AuditUsecase) List(ctx context.Context, query AuditQuery) ([]*AuditLog, int64, error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 {
		query.PageSize = 20
	}
	return uc.auditRepo.List(ctx, query)
}
