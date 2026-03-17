package middleware

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"github.com/go-kratos/kratos/v2/middleware"
	"github.com/go-kratos/kratos/v2/transport"
	"github.com/golang-jwt/jwt/v5"

	"github.com/skillvault/api/internal/biz"
	"github.com/skillvault/api/internal/conf"
)

type userIDKey struct{}

var publicPaths = map[string]bool{
	"/api/v1/healthz":       true,
	"/api/v1/auth/login":    true,
	"/api/v1/auth/register": true,
	"/api/v1/auth/refresh":  true,
}

func Auth(authConf *conf.Auth, tokenRepo biz.APITokenRepo) middleware.Middleware {
	return func(handler middleware.Handler) middleware.Handler {
		return func(ctx context.Context, req interface{}) (interface{}, error) {
			tr, ok := transport.FromServerContext(ctx)
			if !ok {
				return handler(ctx, req)
			}

			// Check if this is a public path
			operation := tr.Operation()
			if publicPaths[operation] {
				return handler(ctx, req)
			}

			tokenStr := tr.RequestHeader().Get("Authorization")
			if tokenStr == "" {
				// Allow unauthenticated access - handlers will check auth
				return handler(ctx, req)
			}
			tokenStr = strings.TrimPrefix(tokenStr, "Bearer ")

			// Try JWT first
			userID, err := validateJWT(tokenStr, authConf.JWTSecret)
			if err == nil {
				ctx = context.WithValue(ctx, userIDKey{}, userID)
				return handler(ctx, req)
			}

			// Try API token
			if tokenRepo != nil {
				hash := sha256.Sum256([]byte(tokenStr))
				hashStr := hex.EncodeToString(hash[:])
				apiToken, err := tokenRepo.FindByHash(ctx, hashStr)
				if err == nil && apiToken != nil {
					_ = tokenRepo.UpdateLastUsed(ctx, apiToken.ID)
					ctx = context.WithValue(ctx, userIDKey{}, apiToken.UserID)
					return handler(ctx, req)
				}
			}

			// Token invalid - continue without auth, handlers will check
			return handler(ctx, req)
		}
	}
}

func validateJWT(tokenStr, secret string) (uint64, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, biz.ErrInvalidToken
		}
		return []byte(secret), nil
	})
	if err != nil {
		return 0, biz.ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return 0, biz.ErrInvalidToken
	}

	sub, err := claims.GetSubject()
	if err != nil {
		return 0, biz.ErrInvalidToken
	}

	var userID uint64
	if _, err := parseUint64(sub, &userID); err != nil {
		return 0, biz.ErrInvalidToken
	}
	return userID, nil
}

func parseUint64(s string, out *uint64) (bool, error) {
	var v uint64
	for _, c := range s {
		if c < '0' || c > '9' {
			return false, biz.ErrInvalidToken
		}
		v = v*10 + uint64(c-'0')
	}
	*out = v
	return true, nil
}

func UserIDFromContext(ctx context.Context) (uint64, bool) {
	v, ok := ctx.Value(userIDKey{}).(uint64)
	return v, ok
}
