package data

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/skillvault/api/internal/biz"
)

// StringSlice is a custom type for JSON string arrays in MySQL.
type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	b, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

func (s *StringSlice) Scan(src interface{}) error {
	if src == nil {
		*s = StringSlice{}
		return nil
	}
	var bytes []byte
	switch v := src.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("unsupported type: %T", src)
	}
	return json.Unmarshal(bytes, s)
}

// JSONMap is a custom type for JSON object columns in MySQL.
type JSONMap map[string]interface{}

func (m JSONMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	b, err := json.Marshal(m)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

func (m *JSONMap) Scan(src interface{}) error {
	if src == nil {
		*m = nil
		return nil
	}
	var bytes []byte
	switch v := src.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("unsupported type: %T", src)
	}
	return json.Unmarshal(bytes, m)
}

// --- GORM Models ---

type UserModel struct {
	ID           uint64    `gorm:"column:id;primaryKey;autoIncrement"`
	Username     string    `gorm:"column:username;uniqueIndex:uk_username;size:64;not null"`
	Email        string    `gorm:"column:email;uniqueIndex:uk_email;size:255;not null"`
	PasswordHash string    `gorm:"column:password_hash;size:255;not null"`
	DisplayName  string    `gorm:"column:display_name;size:128;not null;default:''"`
	AvatarURL    string    `gorm:"column:avatar_url;size:512;not null;default:''"`
	Status       int8      `gorm:"column:status;not null;default:1"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt    time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

func (UserModel) TableName() string { return "users" }

func (m *UserModel) toEntity() *biz.User {
	return &biz.User{
		ID:           m.ID,
		Username:     m.Username,
		Email:        m.Email,
		PasswordHash: m.PasswordHash,
		DisplayName:  m.DisplayName,
		AvatarURL:    m.AvatarURL,
		Status:       m.Status,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
}

func userModelFromEntity(u *biz.User) *UserModel {
	return &UserModel{
		ID:           u.ID,
		Username:     u.Username,
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
		DisplayName:  u.DisplayName,
		AvatarURL:    u.AvatarURL,
		Status:       u.Status,
		CreatedAt:    u.CreatedAt,
		UpdatedAt:    u.UpdatedAt,
	}
}

type OrganizationModel struct {
	ID          uint64    `gorm:"column:id;primaryKey;autoIncrement"`
	Name        string    `gorm:"column:name;uniqueIndex:uk_name;size:64;not null"`
	DisplayName string    `gorm:"column:display_name;size:128;not null;default:''"`
	Description string    `gorm:"column:description;type:text"`
	AvatarURL   string    `gorm:"column:avatar_url;size:512;not null;default:''"`
	CreatedBy   uint64    `gorm:"column:created_by;not null;index:idx_created_by"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt   time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

func (OrganizationModel) TableName() string { return "organizations" }

func (m *OrganizationModel) toEntity() *biz.Organization {
	return &biz.Organization{
		ID:          m.ID,
		Name:        m.Name,
		DisplayName: m.DisplayName,
		Description: m.Description,
		AvatarURL:   m.AvatarURL,
		CreatedBy:   m.CreatedBy,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
}

func orgModelFromEntity(o *biz.Organization) *OrganizationModel {
	return &OrganizationModel{
		ID:          o.ID,
		Name:        o.Name,
		DisplayName: o.DisplayName,
		Description: o.Description,
		AvatarURL:   o.AvatarURL,
		CreatedBy:   o.CreatedBy,
		CreatedAt:   o.CreatedAt,
		UpdatedAt:   o.UpdatedAt,
	}
}

type OrgMemberModel struct {
	ID        uint64    `gorm:"column:id;primaryKey;autoIncrement"`
	OrgID     uint64    `gorm:"column:org_id;not null;uniqueIndex:uk_org_user"`
	UserID    uint64    `gorm:"column:user_id;not null;uniqueIndex:uk_org_user;index:idx_user_id"`
	Role      string    `gorm:"column:role;size:32;not null;default:'developer'"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

func (OrgMemberModel) TableName() string { return "org_members" }

func (m *OrgMemberModel) toEntity() *biz.OrgMember {
	return &biz.OrgMember{
		ID:        m.ID,
		OrgID:     m.OrgID,
		UserID:    m.UserID,
		Role:      m.Role,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

type SkillModel struct {
	ID            uint64      `gorm:"column:id;primaryKey;autoIncrement"`
	OrgID         uint64      `gorm:"column:org_id;not null;uniqueIndex:uk_org_name"`
	Name          string      `gorm:"column:name;size:128;not null;uniqueIndex:uk_org_name"`
	DisplayName   string      `gorm:"column:display_name;size:256;not null;default:''"`
	Description   string      `gorm:"column:description;type:text"`
	Tags          StringSlice `gorm:"column:tags;type:json"`
	Visibility    string      `gorm:"column:visibility;size:16;not null;default:'private';index:idx_visibility"`
	Runtimes      StringSlice `gorm:"column:runtimes;type:json"`
	LatestVersion string      `gorm:"column:latest_version;size:64;not null;default:''"`
	DownloadCount uint64      `gorm:"column:download_count;not null;default:0"`
	CreatedBy     uint64      `gorm:"column:created_by;not null;index:idx_created_by"`
	CreatedAt     time.Time   `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt     time.Time   `gorm:"column:updated_at;autoUpdateTime"`
}

func (SkillModel) TableName() string { return "skills" }

func (m *SkillModel) toEntity() *biz.Skill {
	return &biz.Skill{
		ID:            m.ID,
		OrgID:         m.OrgID,
		Name:          m.Name,
		DisplayName:   m.DisplayName,
		Description:   m.Description,
		Tags:          []string(m.Tags),
		Visibility:    m.Visibility,
		Runtimes:      []string(m.Runtimes),
		LatestVersion: m.LatestVersion,
		DownloadCount: m.DownloadCount,
		CreatedBy:     m.CreatedBy,
		CreatedAt:     m.CreatedAt,
		UpdatedAt:     m.UpdatedAt,
	}
}

func skillModelFromEntity(s *biz.Skill) *SkillModel {
	return &SkillModel{
		ID:            s.ID,
		OrgID:         s.OrgID,
		Name:          s.Name,
		DisplayName:   s.DisplayName,
		Description:   s.Description,
		Tags:          StringSlice(s.Tags),
		Visibility:    s.Visibility,
		Runtimes:      StringSlice(s.Runtimes),
		LatestVersion: s.LatestVersion,
		DownloadCount: s.DownloadCount,
		CreatedBy:     s.CreatedBy,
		CreatedAt:     s.CreatedAt,
		UpdatedAt:     s.UpdatedAt,
	}
}

type SkillVersionModel struct {
	ID             uint64     `gorm:"column:id;primaryKey;autoIncrement"`
	SkillID        uint64     `gorm:"column:skill_id;not null;uniqueIndex:uk_skill_version"`
	Version        string     `gorm:"column:version;size:64;not null;uniqueIndex:uk_skill_version"`
	Status         string     `gorm:"column:status;size:32;not null;default:'draft';index:idx_status"`
	Changelog      string     `gorm:"column:changelog;type:text"`
	ArtifactPath   string     `gorm:"column:artifact_path;size:512;not null"`
	ArtifactSize   uint64     `gorm:"column:artifact_size;not null;default:0"`
	ChecksumSHA256 string     `gorm:"column:checksum_sha256;size:64;not null;default:''"`
	Manifest       JSONMap    `gorm:"column:manifest;type:json"`
	ReviewedBy     *uint64    `gorm:"column:reviewed_by"`
	ReviewedAt     *time.Time `gorm:"column:reviewed_at"`
	ReviewComment  string     `gorm:"column:review_comment;type:text"`
	PublishedAt    *time.Time `gorm:"column:published_at"`
	CreatedBy      uint64     `gorm:"column:created_by;not null;index:idx_created_by"`
	CreatedAt      time.Time  `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt      time.Time  `gorm:"column:updated_at;autoUpdateTime"`
}

func (SkillVersionModel) TableName() string { return "skill_versions" }

func (m *SkillVersionModel) toEntity() *biz.SkillVersion {
	return &biz.SkillVersion{
		ID:             m.ID,
		SkillID:        m.SkillID,
		Version:        m.Version,
		Status:         m.Status,
		Changelog:      m.Changelog,
		ArtifactPath:   m.ArtifactPath,
		ArtifactSize:   m.ArtifactSize,
		ChecksumSHA256: m.ChecksumSHA256,
		ReviewedBy:     m.ReviewedBy,
		ReviewedAt:     m.ReviewedAt,
		ReviewComment:  m.ReviewComment,
		PublishedAt:    m.PublishedAt,
		CreatedBy:      m.CreatedBy,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}

type ScanResultModel struct {
	ID        uint64    `gorm:"column:id;primaryKey;autoIncrement"`
	VersionID uint64    `gorm:"column:version_id;not null;index:idx_version_id"`
	ScanType  string    `gorm:"column:scan_type;size:32;not null"`
	Status    string    `gorm:"column:status;size:16;not null;index:idx_status"`
	Findings  JSONMap   `gorm:"column:findings;type:json"`
	ScannedAt time.Time `gorm:"column:scanned_at;autoCreateTime"`
}

func (ScanResultModel) TableName() string { return "scan_results" }

func (m *ScanResultModel) toEntity() *biz.ScanResult {
	return &biz.ScanResult{
		ID:        m.ID,
		VersionID: m.VersionID,
		ScanType:  m.ScanType,
		Status:    m.Status,
		Findings:  map[string]interface{}(m.Findings),
		ScannedAt: m.ScannedAt,
	}
}

type APITokenModel struct {
	ID          uint64     `gorm:"column:id;primaryKey;autoIncrement"`
	UserID      uint64     `gorm:"column:user_id;not null;index:idx_user_id"`
	Name        string     `gorm:"column:name;size:128;not null"`
	TokenHash   string     `gorm:"column:token_hash;size:255;not null;uniqueIndex:uk_token_hash"`
	TokenPrefix string     `gorm:"column:token_prefix;size:16;not null"`
	Scopes      StringSlice `gorm:"column:scopes;type:json"`
	LastUsedAt  *time.Time `gorm:"column:last_used_at"`
	ExpiresAt   *time.Time `gorm:"column:expires_at"`
	CreatedAt   time.Time  `gorm:"column:created_at;autoCreateTime"`
}

func (APITokenModel) TableName() string { return "api_tokens" }

func (m *APITokenModel) toEntity() *biz.APIToken {
	return &biz.APIToken{
		ID:          m.ID,
		UserID:      m.UserID,
		Name:        m.Name,
		TokenHash:   m.TokenHash,
		TokenPrefix: m.TokenPrefix,
		Scopes:      []string(m.Scopes),
		LastUsedAt:  m.LastUsedAt,
		ExpiresAt:   m.ExpiresAt,
		CreatedAt:   m.CreatedAt,
	}
}

type AuditLogModel struct {
	ID           uint64    `gorm:"column:id;primaryKey;autoIncrement"`
	UserID       uint64    `gorm:"column:user_id;not null;index:idx_user_id"`
	OrgID        *uint64   `gorm:"column:org_id;index:idx_org_id"`
	Action       string    `gorm:"column:action;size:64;not null;index:idx_action"`
	ResourceType string    `gorm:"column:resource_type;size:32;not null"`
	ResourceID   uint64    `gorm:"column:resource_id;not null"`
	Detail       JSONMap   `gorm:"column:detail;type:json"`
	IP           string    `gorm:"column:ip;size:45;not null;default:''"`
	UserAgent    string    `gorm:"column:user_agent;size:512;not null;default:''"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime;index:idx_created_at"`
}

func (AuditLogModel) TableName() string { return "audit_logs" }

func (m *AuditLogModel) toEntity() *biz.AuditLog {
	return &biz.AuditLog{
		ID:           m.ID,
		UserID:       m.UserID,
		OrgID:        m.OrgID,
		Action:       m.Action,
		ResourceType: m.ResourceType,
		ResourceID:   m.ResourceID,
		Detail:       map[string]interface{}(m.Detail),
		IP:           m.IP,
		UserAgent:    m.UserAgent,
		CreatedAt:    m.CreatedAt,
	}
}
