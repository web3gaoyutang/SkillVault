package biz

import (
	"context"
	"time"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/google/wire"
)

var ProviderSet = wire.NewSet(NewAuthUsecase, NewSkillUsecase, NewOrganizationUsecase)

// --- Entities ---

type User struct {
	ID           uint64
	Username     string
	Email        string
	PasswordHash string
	DisplayName  string
	AvatarURL    string
	Status       int8
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type Organization struct {
	ID          uint64
	Name        string
	DisplayName string
	Description string
	AvatarURL   string
	CreatedBy   uint64
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type Skill struct {
	ID            uint64
	OrgID         uint64
	Name          string
	DisplayName   string
	Description   string
	Tags          []string
	Visibility    string
	Runtimes      []string
	LatestVersion string
	DownloadCount uint64
	CreatedBy     uint64
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type SkillVersion struct {
	ID             uint64
	SkillID        uint64
	Version        string
	Status         string
	Changelog      string
	ArtifactPath   string
	ArtifactSize   uint64
	ChecksumSHA256 string
	ReviewedBy     *uint64
	ReviewedAt     *time.Time
	ReviewComment  string
	PublishedAt    *time.Time
	CreatedBy      uint64
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// --- Repositories (interfaces for data layer) ---

type UserRepo interface {
	Create(ctx context.Context, user *User) (*User, error)
	FindByID(ctx context.Context, id uint64) (*User, error)
	FindByUsername(ctx context.Context, username string) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
}

type OrganizationRepo interface {
	Create(ctx context.Context, org *Organization) (*Organization, error)
	FindByID(ctx context.Context, id uint64) (*Organization, error)
	FindByName(ctx context.Context, name string) (*Organization, error)
	ListByUser(ctx context.Context, userID uint64) ([]*Organization, error)
}

type SkillRepo interface {
	Create(ctx context.Context, skill *Skill) (*Skill, error)
	FindByID(ctx context.Context, id uint64) (*Skill, error)
	FindByOrgAndName(ctx context.Context, orgID uint64, name string) (*Skill, error)
	List(ctx context.Context, query SkillQuery) ([]*Skill, int64, error)
}

type SkillQuery struct {
	Keyword    string
	Tag        string
	Runtime    string
	Visibility string
	OrgID      uint64
	Page       int
	PageSize   int
}

// --- Usecases ---

type AuthUsecase struct {
	userRepo UserRepo
	log      *log.Helper
}

func NewAuthUsecase(repo UserRepo, logger log.Logger) *AuthUsecase {
	return &AuthUsecase{userRepo: repo, log: log.NewHelper(logger)}
}

type SkillUsecase struct {
	skillRepo SkillRepo
	log       *log.Helper
}

func NewSkillUsecase(repo SkillRepo, logger log.Logger) *SkillUsecase {
	return &SkillUsecase{skillRepo: repo, log: log.NewHelper(logger)}
}

type OrganizationUsecase struct {
	orgRepo OrganizationRepo
	log     *log.Helper
}

func NewOrganizationUsecase(repo OrganizationRepo, logger log.Logger) *OrganizationUsecase {
	return &OrganizationUsecase{orgRepo: repo, log: log.NewHelper(logger)}
}
