//go:build wireinject
// +build wireinject

package main

import (
	"github.com/go-kratos/kratos/v2"
	"github.com/go-kratos/kratos/v2/log"
	"github.com/google/wire"

	"github.com/skillvault/api/internal/biz"
	"github.com/skillvault/api/internal/conf"
	"github.com/skillvault/api/internal/data"
	"github.com/skillvault/api/internal/server"
	"github.com/skillvault/api/internal/service"
)

func wireApp(*conf.Server, *conf.Data, *conf.Auth, log.Logger) (*kratos.App, func(), error) {
	panic(wire.Build(server.ProviderSet, data.ProviderSet, biz.ProviderSet, service.ProviderSet, newApp))
}
