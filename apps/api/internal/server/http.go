package server

import (
	"github.com/go-kratos/kratos/v2/log"
	"github.com/go-kratos/kratos/v2/transport/http"

	"github.com/skillvault/api/internal/biz"
	"github.com/skillvault/api/internal/conf"
	"github.com/skillvault/api/internal/middleware"
	"github.com/skillvault/api/internal/service"
)

func NewHTTPServer(c *conf.Server, auth *conf.Auth, tokenRepo biz.APITokenRepo, svc *service.SkillVaultService, logger log.Logger) *http.Server {
	opts := []http.ServerOption{
		http.Middleware(
			middleware.Auth(auth, tokenRepo),
		),
	}
	if c.HTTP.Addr != "" {
		opts = append(opts, http.Address(c.HTTP.Addr))
	}
	if c.HTTP.Timeout != 0 {
		opts = append(opts, http.Timeout(c.HTTP.Timeout))
	}
	srv := http.NewServer(opts...)

	// Register routes
	r := srv.Route("/")

	// Health
	r.GET("/api/v1/healthz", svc.Healthz)

	// Auth
	r.POST("/api/v1/auth/register", svc.Register)
	r.POST("/api/v1/auth/login", svc.Login)
	r.POST("/api/v1/auth/refresh", svc.RefreshToken)
	r.POST("/api/v1/auth/logout", svc.Logout)
	r.GET("/api/v1/auth/me", svc.GetMe)

	// Organizations
	r.POST("/api/v1/organizations", svc.CreateOrganization)
	r.GET("/api/v1/organizations", svc.ListOrganizations)
	r.GET("/api/v1/organizations/{org}", svc.GetOrganization)
	r.PUT("/api/v1/organizations/{org}", svc.UpdateOrganization)
	r.DELETE("/api/v1/organizations/{org}", svc.DeleteOrganization)

	// Organization members
	r.GET("/api/v1/organizations/{org}/members", svc.ListMembers)
	r.POST("/api/v1/organizations/{org}/members", svc.AddMember)
	r.PUT("/api/v1/organizations/{org}/members/{user_id}", svc.UpdateMember)
	r.DELETE("/api/v1/organizations/{org}/members/{user_id}", svc.RemoveMember)

	// Skills
	r.POST("/api/v1/skills", svc.CreateSkill)
	r.GET("/api/v1/skills", svc.ListSkills)
	r.GET("/api/v1/skills/{org}/{name}", svc.GetSkill)
	r.PUT("/api/v1/skills/{org}/{name}", svc.UpdateSkill)
	r.DELETE("/api/v1/skills/{org}/{name}", svc.DeleteSkill)

	// Versions
	r.POST("/api/v1/skills/{org}/{name}/versions", svc.UploadVersion)
	r.GET("/api/v1/skills/{org}/{name}/versions", svc.ListVersions)
	r.GET("/api/v1/skills/{org}/{name}/versions/{version}", svc.GetVersion)
	r.GET("/api/v1/skills/{org}/{name}/versions/{version}/download", svc.DownloadVersion)
	r.POST("/api/v1/skills/{org}/{name}/versions/{version}/submit", svc.SubmitForReview)
	r.POST("/api/v1/skills/{org}/{name}/versions/{version}/review", svc.ReviewVersion)
	r.POST("/api/v1/skills/{org}/{name}/versions/{version}/publish", svc.PublishVersion)

	// Scan
	r.GET("/api/v1/skills/{org}/{name}/versions/{version}/scan", svc.GetScanResults)
	r.POST("/api/v1/skills/{org}/{name}/versions/{version}/rescan", svc.Rescan)

	// Audit logs
	r.GET("/api/v1/audit-logs", svc.ListAuditLogs)

	// API Tokens
	r.POST("/api/v1/tokens", svc.CreateToken)
	r.GET("/api/v1/tokens", svc.ListTokens)
	r.DELETE("/api/v1/tokens/{id}", svc.DeleteToken)

	// Review center
	r.GET("/api/v1/reviews", svc.ListPendingReviews)

	return srv
}
