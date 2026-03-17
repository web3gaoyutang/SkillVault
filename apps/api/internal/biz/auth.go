package biz

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserExists       = errors.New("username or email already exists")
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrInvalidToken     = errors.New("invalid or expired token")
	ErrUserDisabled     = errors.New("user account is disabled")
)

type TokenPair struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int64
}

func (uc *AuthUsecase) Register(ctx context.Context, username, email, password string) (*User, error) {
	existing, _ := uc.userRepo.FindByUsername(ctx, username)
	if existing != nil {
		return nil, ErrUserExists
	}
	existing, _ = uc.userRepo.FindByEmail(ctx, email)
	if existing != nil {
		return nil, ErrUserExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hash),
		DisplayName:  username,
		Status:       1,
	}
	return uc.userRepo.Create(ctx, user)
}

func (uc *AuthUsecase) Login(ctx context.Context, username, password string) (*TokenPair, error) {
	user, err := uc.userRepo.FindByUsername(ctx, username)
	if err != nil || user == nil {
		return nil, ErrInvalidCredentials
	}
	if user.Status != 1 {
		return nil, ErrUserDisabled
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	pair, err := uc.generateTokenPair(user)
	if err != nil {
		return nil, err
	}

	// Store refresh token in Redis
	refreshKey := fmt.Sprintf("refresh:%s", pair.RefreshToken)
	_ = uc.cache.Set(ctx, refreshKey, user.ID, uc.authConf.RefreshTokenTTL)

	return pair, nil
}

func (uc *AuthUsecase) RefreshToken(ctx context.Context, refreshToken string) (*TokenPair, error) {
	refreshKey := fmt.Sprintf("refresh:%s", refreshToken)
	var userID uint64
	if err := uc.cache.Get(ctx, refreshKey, &userID); err != nil {
		return nil, ErrInvalidToken
	}

	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil || user == nil {
		return nil, ErrInvalidToken
	}

	// Delete old refresh token
	_ = uc.cache.Delete(ctx, refreshKey)

	pair, err := uc.generateTokenPair(user)
	if err != nil {
		return nil, err
	}

	// Store new refresh token
	newRefreshKey := fmt.Sprintf("refresh:%s", pair.RefreshToken)
	_ = uc.cache.Set(ctx, newRefreshKey, user.ID, uc.authConf.RefreshTokenTTL)

	return pair, nil
}

func (uc *AuthUsecase) Logout(ctx context.Context, refreshToken string) error {
	if refreshToken != "" {
		refreshKey := fmt.Sprintf("refresh:%s", refreshToken)
		_ = uc.cache.Delete(ctx, refreshKey)
	}
	return nil
}

func (uc *AuthUsecase) GetCurrentUser(ctx context.Context, userID uint64) (*User, error) {
	cacheKey := fmt.Sprintf("user:%d", userID)
	var user User
	if err := uc.cache.Get(ctx, cacheKey, &user); err == nil && user.ID != 0 {
		return &user, nil
	}

	u, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, errors.New("user not found")
	}

	_ = uc.cache.Set(ctx, cacheKey, u, 30*time.Minute)
	return u, nil
}

func (uc *AuthUsecase) ValidateToken(tokenStr string) (uint64, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(uc.authConf.JWTSecret), nil
	})
	if err != nil {
		return 0, ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return 0, ErrInvalidToken
	}

	sub, err := claims.GetSubject()
	if err != nil {
		return 0, ErrInvalidToken
	}

	var userID uint64
	if _, err := fmt.Sscanf(sub, "%d", &userID); err != nil {
		return 0, ErrInvalidToken
	}
	return userID, nil
}

func (uc *AuthUsecase) ValidateAPIToken(ctx context.Context, tokenStr string, tokenRepo APITokenRepo) (uint64, error) {
	hash := sha256Hash(tokenStr)
	apiToken, err := tokenRepo.FindByHash(ctx, hash)
	if err != nil || apiToken == nil {
		return 0, ErrInvalidToken
	}
	if apiToken.ExpiresAt != nil && apiToken.ExpiresAt.Before(time.Now()) {
		return 0, ErrInvalidToken
	}
	_ = tokenRepo.UpdateLastUsed(ctx, apiToken.ID)
	return apiToken.UserID, nil
}

func (uc *AuthUsecase) generateTokenPair(user *User) (*TokenPair, error) {
	now := time.Now()
	exp := now.Add(uc.authConf.AccessTokenTTL)

	claims := jwt.MapClaims{
		"sub":      fmt.Sprintf("%d", user.ID),
		"username": user.Username,
		"iat":      now.Unix(),
		"exp":      exp.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString([]byte(uc.authConf.JWTSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign token: %w", err)
	}

	refreshToken := generateRefreshToken(user.ID, now)

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(uc.authConf.AccessTokenTTL.Seconds()),
	}, nil
}

func generateRefreshToken(userID uint64, now time.Time) string {
	data := fmt.Sprintf("%d:%d:%s", userID, now.UnixNano(), "skillvault-refresh")
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func sha256Hash(s string) string {
	hash := sha256.Sum256([]byte(s))
	return hex.EncodeToString(hash[:])
}
