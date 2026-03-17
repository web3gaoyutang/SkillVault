package biz

import (
	"context"
	"io"
	"time"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/google/wire"
)

var ProviderSet = wire.NewSet(
	NewAuthUsecase,
	NewSkillUsecase,
	NewOrganizationUsecase,
	NewVersionUsecase,
	NewAuditUsecase,
	NewTokenUsecase,
)

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

type OrgMember struct {
	ID        uint64
	OrgID     uint64
	UserID    uint64
	Role      string
	Username  string // joined from users table
	Email     string // joined from users table
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Skill struct {
	ID            uint64
	OrgID         uint64
	OrgName       string // populated by service layer
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

type ScanResult struct {
	ID        uint64
	VersionID uint64
	ScanType  string
	Status    string
	Findings  map[string]interface{}
	ScannedAt time.Time
}

type APIToken struct {
	ID          uint64
	UserID      uint64
	Name        string
	TokenHash   string
	TokenPrefix string
	Scopes      []string
	LastUsedAt  *time.Time
	ExpiresAt   *time.Time
	CreatedAt   time.Time
}

type AuditLog struct {
	ID           uint64
	UserID       uint64
	OrgID        *uint64
	Action       string
	ResourceType string
	ResourceID   uint64
	Detail       map[string]interface{}
	IP           string
	UserAgent    string
	CreatedAt    time.Time
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

type AuditQuery struct {
	OrgID        uint64
	UserID       uint64
	Action       string
	ResourceType string
	StartTime    *time.Time
	EndTime      *time.Time
	Page         int
	PageSize     int
}

// --- Repository Interfaces ---

type UserRepo interface {
	Create(ctx context.Context, user *User) (*User, error)
	FindByID(ctx context.Context, id uint64) (*User, error)
	FindByUsername(ctx context.Context, username string) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	Update(ctx context.Context, user *User) error
}

type OrganizationRepo interface {
	Create(ctx context.Context, org *Organization) (*Organization, error)
	FindByID(ctx context.Context, id uint64) (*Organization, error)
	FindByName(ctx context.Context, name string) (*Organization, error)
	ListByUser(ctx context.Context, userID uint64) ([]*Organization, error)
	Update(ctx context.Context, org *Organization) error
	Delete(ctx context.Context, id uint64) error
}

type OrgMemberRepo interface {
	Create(ctx context.Context, member *OrgMember) (*OrgMember, error)
	FindByOrgAndUser(ctx context.Context, orgID, userID uint64) (*OrgMember, error)
	ListByOrg(ctx context.Context, orgID uint64) ([]*OrgMember, error)
	Update(ctx context.Context, member *OrgMember) error
	Delete(ctx context.Context, orgID, userID uint64) error
}

type SkillRepo interface {
	Create(ctx context.Context, skill *Skill) (*Skill, error)
	FindByID(ctx context.Context, id uint64) (*Skill, error)
	FindByOrgAndName(ctx context.Context, orgID uint64, name string) (*Skill, error)
	List(ctx context.Context, query SkillQuery) ([]*Skill, int64, error)
	Update(ctx context.Context, skill *Skill) error
	Delete(ctx context.Context, id uint64) error
	IncrementDownloadCount(ctx context.Context, id uint64) error
}

type SkillVersionRepo interface {
	Create(ctx context.Context, version *SkillVersion) (*SkillVersion, error)
	FindByID(ctx context.Context, id uint64) (*SkillVersion, error)
	FindBySkillAndVersion(ctx context.Context, skillID uint64, version string) (*SkillVersion, error)
	ListBySkill(ctx context.Context, skillID uint64) ([]*SkillVersion, error)
	Update(ctx context.Context, version *SkillVersion) error
	ListPendingReview(ctx context.Context, orgIDs []uint64) ([]*SkillVersion, error)
}

type ScanResultRepo interface {
	Create(ctx context.Context, result *ScanResult) (*ScanResult, error)
	ListByVersion(ctx context.Context, versionID uint64) ([]*ScanResult, error)
}

type APITokenRepo interface {
	Create(ctx context.Context, token *APIToken) (*APIToken, error)
	FindByHash(ctx context.Context, hash string) (*APIToken, error)
	ListByUser(ctx context.Context, userID uint64) ([]*APIToken, error)
	Delete(ctx context.Context, id, userID uint64) error
	UpdateLastUsed(ctx context.Context, id uint64) error
}

type AuditLogRepo interface {
	Create(ctx context.Context, entry *AuditLog) error
	List(ctx context.Context, query AuditQuery) ([]*AuditLog, int64, error)
}

type CacheRepo interface {
	Get(ctx context.Context, key string, dest interface{}) error
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
	SetNX(ctx context.Context, key string, value interface{}, ttl time.Duration) (bool, error)
}

type ObjectStorageRepo interface {
	Upload(ctx context.Context, key string, reader io.Reader, size int64, contentType string) error
	Download(ctx context.Context, key string) (io.ReadCloser, int64, error)
	Delete(ctx context.Context, key string) error
}

type ScanQueueRepo interface {
	Enqueue(ctx context.Context, versionID uint64) error
}

// --- Usecases ---

type AuthUsecase struct {
	userRepo UserRepo
	cache    CacheRepo
	authConf AuthConfig
	log      *log.Helper
}

type AuthConfig struct {
	JWTSecret       string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
}

func NewAuthUsecase(repo UserRepo, cache CacheRepo, conf AuthConfig, logger log.Logger) *AuthUsecase {
	return &AuthUsecase{userRepo: repo, cache: cache, authConf: conf, log: log.NewHelper(logger)}
}

type SkillUsecase struct {
	skillRepo SkillRepo
	orgRepo   OrganizationRepo
	memberRepo OrgMemberRepo
	cache     CacheRepo
	log       *log.Helper
}

func NewSkillUsecase(repo SkillRepo, orgRepo OrganizationRepo, memberRepo OrgMemberRepo, cache CacheRepo, logger log.Logger) *SkillUsecase {
	return &SkillUsecase{skillRepo: repo, orgRepo: orgRepo, memberRepo: memberRepo, cache: cache, log: log.NewHelper(logger)}
}

type OrganizationUsecase struct {
	orgRepo    OrganizationRepo
	memberRepo OrgMemberRepo
	cache      CacheRepo
	log        *log.Helper
}

func NewOrganizationUsecase(orgRepo OrganizationRepo, memberRepo OrgMemberRepo, cache CacheRepo, logger log.Logger) *OrganizationUsecase {
	return &OrganizationUsecase{orgRepo: orgRepo, memberRepo: memberRepo, cache: cache, log: log.NewHelper(logger)}
}

type VersionUsecase struct {
	versionRepo SkillVersionRepo
	skillRepo   SkillRepo
	orgRepo     OrganizationRepo
	memberRepo  OrgMemberRepo
	scanRepo    ScanResultRepo
	storage     ObjectStorageRepo
	queue       ScanQueueRepo
	cache       CacheRepo
	log         *log.Helper
}

func NewVersionUsecase(
	versionRepo SkillVersionRepo,
	skillRepo SkillRepo,
	orgRepo OrganizationRepo,
	memberRepo OrgMemberRepo,
	scanRepo ScanResultRepo,
	storage ObjectStorageRepo,
	queue ScanQueueRepo,
	cache CacheRepo,
	logger log.Logger,
) *VersionUsecase {
	return &VersionUsecase{
		versionRepo: versionRepo,
		skillRepo:   skillRepo,
		orgRepo:     orgRepo,
		memberRepo:  memberRepo,
		scanRepo:    scanRepo,
		storage:     storage,
		queue:       queue,
		cache:       cache,
		log:         log.NewHelper(logger),
	}
}

type AuditUsecase struct {
	auditRepo AuditLogRepo
	log       *log.Helper
}

func NewAuditUsecase(repo AuditLogRepo, logger log.Logger) *AuditUsecase {
	return &AuditUsecase{auditRepo: repo, log: log.NewHelper(logger)}
}

type TokenUsecase struct {
	tokenRepo APITokenRepo
	log       *log.Helper
}

func NewTokenUsecase(repo APITokenRepo, logger log.Logger) *TokenUsecase {
	return &TokenUsecase{tokenRepo: repo, log: log.NewHelper(logger)}
}
