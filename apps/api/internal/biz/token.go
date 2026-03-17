package biz

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
)

var (
	ErrTokenNotFound = errors.New("token not found")
)

func (uc *TokenUsecase) Create(ctx context.Context, userID uint64, name string, scopes []string) (string, *APIToken, error) {
	// Generate random 32-byte token
	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return "", nil, fmt.Errorf("failed to generate token: %w", err)
	}
	rawToken := "svt_" + hex.EncodeToString(rawBytes)

	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])
	tokenPrefix := rawToken[:12]

	apiToken := &APIToken{
		UserID:      userID,
		Name:        name,
		TokenHash:   tokenHash,
		TokenPrefix: tokenPrefix,
		Scopes:      scopes,
	}

	created, err := uc.tokenRepo.Create(ctx, apiToken)
	if err != nil {
		return "", nil, err
	}

	return rawToken, created, nil
}

func (uc *TokenUsecase) List(ctx context.Context, userID uint64) ([]*APIToken, error) {
	return uc.tokenRepo.ListByUser(ctx, userID)
}

func (uc *TokenUsecase) Delete(ctx context.Context, id, userID uint64) error {
	return uc.tokenRepo.Delete(ctx, id, userID)
}
