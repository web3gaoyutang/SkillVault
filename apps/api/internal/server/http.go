package server

import (
	"github.com/go-kratos/kratos/v2/log"
	"github.com/go-kratos/kratos/v2/transport/http"

	"github.com/skillvault/api/internal/conf"
	"github.com/skillvault/api/internal/middleware"
	"github.com/skillvault/api/internal/service"
)

func NewHTTPServer(c *conf.Server, auth *conf.Auth, svc *service.SkillVaultService, logger log.Logger) *http.Server {
	opts := []http.ServerOption{
		http.Middleware(
			middleware.Auth(auth),
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
	r.GET("/api/v1/healthz", svc.Healthz)

	return srv
}
