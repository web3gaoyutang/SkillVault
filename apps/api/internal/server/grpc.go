package server

import (
	"github.com/go-kratos/kratos/v2/log"
	"github.com/go-kratos/kratos/v2/transport/grpc"

	"github.com/skillvault/api/internal/biz"
	"github.com/skillvault/api/internal/conf"
	"github.com/skillvault/api/internal/middleware"
)

func NewGRPCServer(c *conf.Server, auth *conf.Auth, tokenRepo biz.APITokenRepo, logger log.Logger) *grpc.Server {
	opts := []grpc.ServerOption{
		grpc.Middleware(
			middleware.Auth(auth, tokenRepo),
		),
	}
	if c.GRPC.Addr != "" {
		opts = append(opts, grpc.Address(c.GRPC.Addr))
	}
	if c.GRPC.Timeout != 0 {
		opts = append(opts, grpc.Timeout(c.GRPC.Timeout))
	}
	srv := grpc.NewServer(opts...)
	return srv
}
