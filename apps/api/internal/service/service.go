package service

import (
	"github.com/go-kratos/kratos/v2/transport/http"
	"github.com/google/wire"

	"github.com/skillvault/api/internal/biz"
)

var ProviderSet = wire.NewSet(NewSkillVaultService)

type SkillVaultService struct {
	authUC  *biz.AuthUsecase
	skillUC *biz.SkillUsecase
	orgUC   *biz.OrganizationUsecase
}

func NewSkillVaultService(authUC *biz.AuthUsecase, skillUC *biz.SkillUsecase, orgUC *biz.OrganizationUsecase) *SkillVaultService {
	return &SkillVaultService{
		authUC:  authUC,
		skillUC: skillUC,
		orgUC:   orgUC,
	}
}

func (s *SkillVaultService) Healthz(ctx http.Context) error {
	return ctx.JSON(200, map[string]interface{}{
		"code":    0,
		"message": "ok",
	})
}
