package middleware

import (
	"context"
	"strings"

	"github.com/go-kratos/kratos/v2/middleware"
	"github.com/go-kratos/kratos/v2/transport"

	"github.com/skillvault/api/internal/conf"
)

type userIDKey struct{}

func Auth(authConf *conf.Auth) middleware.Middleware {
	return func(handler middleware.Handler) middleware.Handler {
		return func(ctx context.Context, req interface{}) (interface{}, error) {
			if tr, ok := transport.FromServerContext(ctx); ok {
				tokenStr := tr.RequestHeader().Get("Authorization")
				if tokenStr == "" {
					return handler(ctx, req)
				}
				tokenStr = strings.TrimPrefix(tokenStr, "Bearer ")

				// TODO: validate JWT or API token using authConf.JWTSecret
				// On success, inject user info into context:
				// ctx = context.WithValue(ctx, userIDKey{}, userID)
				_ = tokenStr
			}
			return handler(ctx, req)
		}
	}
}

func UserIDFromContext(ctx context.Context) (uint64, bool) {
	v, ok := ctx.Value(userIDKey{}).(uint64)
	return v, ok
}
