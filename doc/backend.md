# SkillVault 后端技术文档

## 1. 技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| 语言 | Go | 1.21+ | 主开发语言 |
| 框架 | Kratos v2 | v2.x | 微服务框架，支持 gRPC + HTTP 双协议 |
| ORM | GORM | v2 | MySQL 数据访问层 |
| 数据库 | MySQL | 8.0 | 主关系型存储 |
| 缓存/队列 | Redis | 7.x | 缓存、会话、限流、异步扫描队列 |
| 对象存储 | MinIO | latest | S3 兼容制品存储 |
| 依赖注入 | Wire | v0.5+ | 编译时依赖注入 |
| 认证 | JWT (HS256) | - | Access Token + Refresh Token |

---

## 2. 项目结构

```
apps/api/
├── cmd/
│   └── server/
│       ├── main.go          # 程序入口，加载配置并启动服务
│       ├── wire.go          # Wire DI 注入声明
│       └── wire_gen.go      # Wire 自动生成的 DI 代码
├── api/                     # Protobuf 定义 & 生成的 HTTP 路由代码
│   ├── auth/v1/
│   ├── skill/v1/
│   ├── organization/v1/
│   ├── version/v1/
│   └── audit/v1/
├── internal/
│   ├── conf/                # 配置结构（由 proto 生成）
│   │   ├── conf.proto
│   │   └── conf.pb.go
│   ├── server/              # HTTP & gRPC Server 注册
│   │   ├── http.go          # HTTP 路由注册（42 个端点）
│   │   └── grpc.go          # gRPC 服务注册
│   ├── service/             # Service 层（HTTP 处理器 → biz）
│   │   └── service.go       # 所有 HTTP handler（828 行）
│   ├── biz/                 # 业务逻辑层（Usecase）
│   │   ├── auth.go          # 认证：注册、登录、Token 刷新
│   │   ├── skill.go         # Skill CRUD、可见性、下载计数
│   │   ├── organization.go  # 组织创建、成员管理
│   │   ├── version.go       # 版本上传、状态机、发布
│   │   ├── audit.go         # 审计日志查询
│   │   ├── token.go         # API Token 管理
│   │   └── biz.go           # Biz provider set（Wire）
│   ├── data/                # 数据访问层
│   │   ├── data.go          # MySQL + Redis + MinIO 初始化
│   │   ├── model.go         # GORM 模型定义（8 张表）
│   │   ├── user.go          # UserRepo 实现
│   │   ├── organization.go  # OrgRepo + OrgMemberRepo 实现
│   │   ├── skill.go         # SkillRepo 实现（含全文搜索）
│   │   ├── version.go       # VersionRepo 实现
│   │   ├── scan.go          # ScanResultRepo 实现
│   │   ├── audit.go         # AuditLogRepo 实现
│   │   ├── token.go         # APITokenRepo 实现
│   │   ├── cache.go         # Redis 缓存操作封装
│   │   ├── storage.go       # MinIO 对象存储操作封装
│   │   └── scan_queue.go    # Redis List 扫描任务队列
│   └── middleware/
│       └── auth.go          # JWT + API Token 认证中间件
└── configs/
    └── config.yaml          # 服务配置文件
```

---

## 3. 分层架构

Kratos 标准 DDD 分层，调用流向严格单向：

```
HTTP Request
    │
    ▼
server/http.go          ← 路由注册、请求解析
    │
    ▼
service/service.go      ← HTTP handler（参数绑定、响应格式化、错误处理）
    │
    ▼
biz/*.go                ← 业务逻辑（权限校验、状态机、核心流程）
    │
    ▼
data/*.go               ← 数据访问（MySQL GORM / Redis / MinIO）
```

### 3.1 Service 层职责

- 解析 HTTP 请求参数（Query、Body、Path）
- 从 context 提取当前用户信息（由认证中间件注入）
- 调用对应 Usecase
- 统一响应格式封装：`{ "code": 0, "message": "success", "data": {} }`
- 错误映射为 HTTP 状态码

### 3.2 Biz 层职责

- 业务规则校验（角色权限、状态合法性）
- 跨实体协调（如版本发布需同步更新 skill.latest_version）
- 分布式锁控制并发
- 触发异步任务（推送扫描队列）
- 写入审计日志

### 3.3 Data 层职责

- GORM 模型 CRUD
- Redis 缓存读写（先查缓存，缓存未命中再查 DB）
- MinIO 对象存储（上传/下载/签名 URL）
- 自定义 JSON 列类型（`StringSlice`、`JSONMap`）

---

## 4. 数据模型

### 4.1 GORM 模型

**User**
```go
type User struct {
    ID           uint64    `gorm:"primaryKey;autoIncrement"`
    Username     string    `gorm:"size:64;uniqueIndex;not null"`
    Email        string    `gorm:"size:255;uniqueIndex;not null"`
    PasswordHash string    `gorm:"size:255;not null"`
    DisplayName  string    `gorm:"size:128;default:''"`
    AvatarURL    string    `gorm:"size:512;default:''"`
    Status       int       `gorm:"default:1"` // 1=active, 2=disabled
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
```

**Organization**
```go
type Organization struct {
    ID          uint64    `gorm:"primaryKey;autoIncrement"`
    Name        string    `gorm:"size:64;uniqueIndex;not null"` // namespace
    DisplayName string    `gorm:"size:128;default:''"`
    Description string    `gorm:"type:text"`
    AvatarURL   string    `gorm:"size:512;default:''"`
    CreatedBy   uint64    `gorm:"index;not null"`
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

**OrgMember**
```go
type OrgMember struct {
    ID        uint64    `gorm:"primaryKey;autoIncrement"`
    OrgID     uint64    `gorm:"uniqueIndex:uk_org_user;index;not null"`
    UserID    uint64    `gorm:"uniqueIndex:uk_org_user;index;not null"`
    Role      string    `gorm:"size:32;default:'developer'"` // owner/admin/developer/viewer
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

**Skill**
```go
type Skill struct {
    ID            uint64      `gorm:"primaryKey;autoIncrement"`
    OrgID         uint64      `gorm:"uniqueIndex:uk_org_name;index;not null"`
    Name          string      `gorm:"size:128;uniqueIndex:uk_org_name;not null"`
    DisplayName   string      `gorm:"size:256;default:''"`
    Description   string      `gorm:"type:text"`
    Tags          StringSlice `gorm:"type:json"`
    Visibility    string      `gorm:"size:16;index;default:'private'"` // public/private/internal
    Runtimes      StringSlice `gorm:"type:json"`
    LatestVersion string      `gorm:"size:64;default:''"`
    DownloadCount uint64      `gorm:"default:0"`
    CreatedBy     uint64      `gorm:"index;not null"`
    CreatedAt     time.Time
    UpdatedAt     time.Time
}
```

**SkillVersion**
```go
type SkillVersion struct {
    ID             uint64    `gorm:"primaryKey;autoIncrement"`
    SkillID        uint64    `gorm:"uniqueIndex:uk_skill_ver;index;not null"`
    Version        string    `gorm:"size:64;uniqueIndex:uk_skill_ver;not null"`
    Status         string    `gorm:"size:32;index;default:'draft'"` // draft/pending_review/approved/published/rejected
    Changelog      string    `gorm:"type:text"`
    ArtifactPath   string    `gorm:"size:512;not null"`
    ArtifactSize   uint64    `gorm:"default:0"`
    ChecksumSHA256 string    `gorm:"size:64;default:''"`
    Manifest       JSONMap   `gorm:"type:json"`
    ReviewedBy     *uint64
    ReviewedAt     *time.Time
    ReviewComment  string    `gorm:"type:text"`
    PublishedAt    *time.Time
    CreatedBy      uint64    `gorm:"index;not null"`
    CreatedAt      time.Time
    UpdatedAt      time.Time
}
```

**ScanResult**
```go
type ScanResult struct {
    ID        uint64    `gorm:"primaryKey;autoIncrement"`
    VersionID uint64    `gorm:"index;not null"`
    ScanType  string    `gorm:"size:32;not null"` // structure/security/metadata
    Status    string    `gorm:"size:16;not null"` // passed/warning/failed
    Findings  JSONMap   `gorm:"type:json"`
    ScannedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}
```

**APIToken**
```go
type APIToken struct {
    ID          uint64     `gorm:"primaryKey;autoIncrement"`
    UserID      uint64     `gorm:"index;not null"`
    Name        string     `gorm:"size:128;not null"`
    TokenHash   string     `gorm:"size:255;uniqueIndex;not null"` // SHA256
    TokenPrefix string     `gorm:"size:16;not null"`
    Scopes      StringSlice `gorm:"type:json"`
    LastUsedAt  *time.Time
    ExpiresAt   *time.Time
    CreatedAt   time.Time
}
```

**AuditLog**
```go
type AuditLog struct {
    ID           uint64    `gorm:"primaryKey;autoIncrement"`
    UserID       uint64    `gorm:"index;not null"`
    OrgID        *uint64   `gorm:"index"`
    Action       string    `gorm:"size:64;index;not null"`
    ResourceType string    `gorm:"size:32;not null"` // skill/version/org/user
    ResourceID   uint64    `gorm:"index;not null"`
    Detail       JSONMap   `gorm:"type:json"`
    IP           string    `gorm:"size:45;default:''"`
    UserAgent    string    `gorm:"size:512;default:''"`
    CreatedAt    time.Time `gorm:"index"`
}
```

### 4.2 自定义类型

```go
// StringSlice — JSON 数组列（如 tags、runtimes、scopes）
type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) { ... }
func (s *StringSlice) Scan(value interface{}) error { ... }

// JSONMap — JSON 对象列（如 manifest、findings、detail）
type JSONMap map[string]interface{}

func (j JSONMap) Value() (driver.Value, error) { ... }
func (j *JSONMap) Scan(value interface{}) error { ... }
```

---

## 5. HTTP 路由（42 个端点）

所有路由统一前缀 `/api/v1/`，路由注册在 `internal/server/http.go`。

### 5.1 认证（Auth）

| 方法 | 路径 | 说明 | 是否需要认证 |
|------|------|------|-------------|
| POST | `/api/v1/auth/register` | 用户注册 | 否 |
| POST | `/api/v1/auth/login` | 用户登录 | 否 |
| POST | `/api/v1/auth/refresh` | 刷新 Access Token | 否 |
| POST | `/api/v1/auth/logout` | 登出 | 是 |
| GET  | `/api/v1/auth/me` | 获取当前用户信息 | 是 |

### 5.2 组织（Organization）

| 方法 | 路径 | 说明 | 最低角色 |
|------|------|------|---------|
| POST   | `/api/v1/organizations` | 创建组织 | 已认证用户 |
| GET    | `/api/v1/organizations` | 获取我的组织列表 | 已认证用户 |
| GET    | `/api/v1/organizations/:org` | 获取组织详情 | viewer |
| PUT    | `/api/v1/organizations/:org` | 更新组织信息 | admin |
| DELETE | `/api/v1/organizations/:org` | 删除组织 | owner |
| GET    | `/api/v1/organizations/:org/members` | 获取成员列表 | viewer |
| POST   | `/api/v1/organizations/:org/members` | 添加成员 | admin |
| PUT    | `/api/v1/organizations/:org/members/:user_id` | 更新成员角色 | admin |
| DELETE | `/api/v1/organizations/:org/members/:user_id` | 移除成员 | admin |

### 5.3 Skill

| 方法 | 路径 | 说明 | 最低角色 |
|------|------|------|---------|
| POST   | `/api/v1/skills` | 创建 Skill | developer |
| GET    | `/api/v1/skills` | Skill 列表（搜索、筛选、分页） | - |
| GET    | `/api/v1/skills/:org/:name` | 获取 Skill 详情 | - |
| PUT    | `/api/v1/skills/:org/:name` | 更新 Skill 信息 | developer |
| DELETE | `/api/v1/skills/:org/:name` | 删除 Skill | admin |

### 5.4 版本（Version）

| 方法 | 路径 | 说明 | 最低角色 |
|------|------|------|---------|
| POST | `/api/v1/skills/:org/:name/versions` | 上传新版本（multipart/form-data） | developer |
| GET  | `/api/v1/skills/:org/:name/versions` | 获取版本列表 | viewer |
| GET  | `/api/v1/skills/:org/:name/versions/:version` | 获取版本详情 | viewer |
| GET  | `/api/v1/skills/:org/:name/versions/:version/download` | 下载制品包 | viewer |
| POST | `/api/v1/skills/:org/:name/versions/:version}/submit` | 提交审核 | developer |
| POST | `/api/v1/skills/:org/:name/versions/:version/review` | 审核（通过/拒绝） | admin |
| POST | `/api/v1/skills/:org/:name/versions/:version/publish` | 发布版本 | admin |

### 5.5 扫描（Scan）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/v1/skills/:org/:name/versions/:version/scan` | 获取扫描结果 |
| POST | `/api/v1/skills/:org/:name/versions/:version/rescan` | 触发重新扫描 |

### 5.6 审计日志（Audit）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/audit-logs` | 查询审计日志（分页、按 org/action/resource 筛选） |

### 5.7 API Token

| 方法 | 路径 | 说明 |
|------|------|------|
| POST   | `/api/v1/tokens` | 创建 API Token（仅返回一次明文） |
| GET    | `/api/v1/tokens` | 获取 Token 列表（不含明文） |
| DELETE | `/api/v1/tokens/:id` | 撤销 Token |

### 5.8 审核中心

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/reviews/pending` | 获取待审核版本列表 |

---

## 6. 认证与中间件

### 6.1 JWT 认证

JWT 使用 HS256 算法，Payload 结构：

```json
{
  "sub": "12345",
  "username": "johndoe",
  "exp": 1734567890,
  "iat": 1734560690
}
```

- Access Token TTL：2 小时
- Refresh Token TTL：7 天（存储在 Redis，key: `refresh:{token}`）

### 6.2 API Token 认证

用于 CLI 场景，格式：`skv_<random>`

```go
// 创建：生成随机字符串 → SHA256 哈希 → 存 DB（token_hash）
// 返回：只返回一次明文原始 token
// 验证：对请求 token 计算 SHA256 → 查询 DB token_hash
```

### 6.3 认证中间件逻辑（auth.go）

```
提取 Authorization: Bearer <token>
    │
    ├─ 尝试 JWT 解析
    │     ├─ 成功 → 注入 userID、username 到 ctx
    │     └─ 失败 → 尝试 API Token
    │
    ├─ 尝试 API Token（SHA256 哈希后查 DB）
    │     ├─ 成功 → 注入 userID 到 ctx，更新 last_used_at
    │     └─ 失败 → 继续（context 中无用户信息）
    │
    └─ 公开路径（register/login/refresh/healthz）→ 直接放行
```

### 6.4 RBAC 权限层级

```go
roleHierarchy := map[string]int{
    "owner":     4,
    "admin":     3,
    "developer": 2,
    "viewer":    1,
}

// 校验：roleHierarchy[member.Role] >= roleHierarchy[required]
```

---

## 7. 业务逻辑层（Biz）

### 7.1 AuthUsecase

```go
type AuthUsecase struct {
    userRepo UserRepo
    cache    CacheRepo
}

// 核心方法
Register(ctx, username, email, password) (*User, error)
Login(ctx, username, password) (*AuthResult, error)  // bcrypt 验证
RefreshToken(ctx, refreshToken) (*AuthResult, error)
Logout(ctx, userID, refreshToken) error
```

**密码处理：** bcrypt cost=10，不存储明文密码。

### 7.2 SkillUsecase

```go
type SkillUsecase struct {
    skillRepo SkillRepo
    orgRepo   OrgRepo
    cache     CacheRepo
    audit     AuditRepo
}

// 核心方法
CreateSkill(ctx, userID, orgName, req) (*Skill, error)
ListSkills(ctx, req) (*SkillList, error)          // 支持全文搜索、tag/runtime 筛选
GetSkill(ctx, orgName, skillName) (*Skill, error)
UpdateSkill(ctx, userID, orgName, skillName, req) (*Skill, error)
DeleteSkill(ctx, userID, orgName, skillName) error
```

**分布式锁：** CreateSkill 使用 Redis SetNX（`lock:skill:{org}:{name}`，TTL 10s）防止并发创建重复 Skill。

### 7.3 VersionUsecase

```go
type VersionUsecase struct {
    versionRepo VersionRepo
    skillRepo   SkillRepo
    storage     ObjectStorageRepo
    scanQueue   ScanQueueRepo
    cache       CacheRepo
    audit       AuditRepo
}

// 核心方法
UploadVersion(ctx, userID, orgName, skillName, req) (*SkillVersion, error)
SubmitForReview(ctx, userID, versionID) error
ReviewVersion(ctx, reviewerID, versionID, approved bool, comment string) error
PublishVersion(ctx, userID, versionID) error
DownloadVersion(ctx, userID, orgName, skillName, version) ([]byte, error)
```

**制品存储路径：**
```go
checksum := sha256.Sum256(content)
path := fmt.Sprintf("%s/%s/%s/%s.tar.gz", orgName, skillName, version, hex(checksum[:8]))
```

### 7.4 版本状态机

```
draft
  │
  ├─ SubmitForReview ──→ pending_review
  │                           │
  │                    ├─ ReviewVersion(approved=true)  ──→ approved
  │                    │                                         │
  │                    │                               PublishVersion ──→ published
  │                    │
  │                    └─ ReviewVersion(approved=false) ──→ rejected
  │                                                              │
  └──────────────── 重新上传 ─────────────────────────────── (back to) draft
```

合法状态转换矩阵：

| From | To | 触发动作 |
|------|----|---------|
| `draft` | `pending_review` | SubmitForReview |
| `pending_review` | `approved` | ReviewVersion(true) |
| `pending_review` | `rejected` | ReviewVersion(false) |
| `approved` | `published` | PublishVersion |
| `rejected` | `draft` | 重新上传 |

### 7.5 OrganizationUsecase

```go
// 创建组织时同时创建 owner 成员记录
CreateOrganization(ctx, userID, name, displayName, desc) (*Organization, error)

// 添加成员前校验操作者权限 >= admin
AddMember(ctx, operatorID, orgName, username, role) error

// 移除成员时防止移除唯一 owner
RemoveMember(ctx, operatorID, orgName, targetUserID) error
```

---

## 8. 数据访问层（Data）

### 8.1 Redis 缓存

```go
type CacheRepo interface {
    Get(ctx, key string) (string, error)
    Set(ctx, key string, value interface{}, ttl time.Duration) error
    SetNX(ctx, key string, value interface{}, ttl time.Duration) (bool, error)
    Delete(ctx, keys ...string) error
    Exists(ctx, key string) (bool, error)
    Incr(ctx, key string) (int64, error)
    Expire(ctx, key string, ttl time.Duration) error
}
```

Redis Key 规范：

| Key | TTL | 说明 |
|-----|-----|------|
| `user:{id}` | 30min | 用户信息缓存 |
| `skill:{id}` | 15min | Skill 详情缓存 |
| `skill:list:{hash}` | 5min | Skill 列表查询缓存（按参数 hash） |
| `org:{id}` | 30min | 组织信息缓存 |
| `refresh:{token}` | 7d | Refresh Token 存储 |
| `rate:api:{user_id}` | 1min | API 限流计数 |
| `rate:login:{ip}` | 15min | 登录限流计数 |
| `lock:skill:{org}:{name}` | 10s | Skill 创建分布式锁 |
| `lock:version:{skill_id}:{ver}` | 30s | 版本发布分布式锁 |

### 8.2 MinIO 对象存储

```go
type ObjectStorageRepo interface {
    Upload(ctx, path string, content []byte) error
    Download(ctx, path string) ([]byte, error)
    Delete(ctx, path string) error
    GetPresignedURL(ctx, path string, ttl time.Duration) (string, error)
}
```

Bucket 名称：`skillvault-artifacts`

### 8.3 扫描任务队列

```go
type ScanQueueRepo interface {
    Push(ctx context.Context, task ScanTask) error   // LPUSH queue:scan
    Pop(ctx context.Context) (*ScanTask, error)      // BRPOPLPUSH queue:scan queue:scan:processing
    Complete(ctx context.Context, task ScanTask) error // LREM queue:scan:processing
}
```

---

## 9. 配置

### 9.1 config.yaml

```yaml
server:
  http:
    addr: 0.0.0.0:8080
    timeout: 5s
  grpc:
    addr: 0.0.0.0:9090
    timeout: 5s

data:
  database:
    driver: mysql
    source: "root:password@tcp(127.0.0.1:3306)/skillvault?charset=utf8mb4&parseTime=True&loc=Local"
    max_open_conns: 100
    max_idle_conns: 10
    conn_max_lifetime: 3600s
  redis:
    addr: 127.0.0.1:6379
    password: ""
    db: 0
    read_timeout: 0.2s
    write_timeout: 0.2s
  minio:
    endpoint: 127.0.0.1:9000
    access_key: minioadmin
    secret_key: minioadmin
    bucket: skillvault-artifacts
    use_ssl: false

auth:
  jwt_secret: "your-secret-key"      # 生产环境必须替换
  access_token_ttl: 2h
  refresh_token_ttl: 168h            # 7 天

scan:
  max_package_size: 52428800         # 50MB
  max_file_count: 500
  sandbox_dir: /tmp/skillvault-scan
```

### 9.2 环境变量（.env）

```bash
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=skillvault
REDIS_PASSWORD=
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
JWT_SECRET=change-me-in-production
API_HTTP_ADDR=0.0.0.0:8080
API_GRPC_ADDR=0.0.0.0:9090
```

---

## 10. 错误处理

### 10.1 业务错误定义

```go
var (
    // Auth
    ErrUserExists          = errors.New("user already exists")
    ErrInvalidCredentials  = errors.New("invalid username or password")
    ErrTokenExpired        = errors.New("token expired")
    ErrPermissionDenied    = errors.New("permission denied")

    // Skill
    ErrSkillNotFound       = errors.New("skill not found")
    ErrSkillExists         = errors.New("skill already exists")

    // Version
    ErrVersionNotFound     = errors.New("version not found")
    ErrVersionExists       = errors.New("version already exists")
    ErrInvalidStateTransition = errors.New("invalid state transition")
    ErrChecksumMismatch    = errors.New("checksum mismatch")

    // Organization
    ErrOrgNotFound         = errors.New("organization not found")
    ErrOrgExists           = errors.New("organization already exists")
    ErrNotMember           = errors.New("not a member of this organization")
    ErrCannotRemoveOwner   = errors.New("cannot remove the only owner")

    // System
    ErrLockFailed          = errors.New("concurrent operation in progress")
)
```

### 10.2 HTTP 状态码映射

| 错误类型 | HTTP 状态码 |
|---------|-----------|
| 参数校验失败 | 400 |
| 未认证 | 401 |
| 权限不足 | 403 |
| 资源不存在 | 404 |
| 状态冲突 | 409 |
| 触发限流 | 429 |
| 服务器错误 | 500 |

---

## 11. Scan Worker

### 11.1 工作流程

Worker 进程独立运行，通过 Redis 队列与 API 解耦：

```
API 收到上传 → LPUSH queue:scan {task}
                        │
                        ▼
Worker: BRPOPLPUSH queue:scan queue:scan:processing (阻塞等待)
                        │
                        ▼
            下载制品 → 解压 → 执行扫描规则
                        │
                        ▼
            写入 scan_results → 更新 version.status
                        │
                        ▼
            LREM queue:scan:processing (移除已处理任务)
                        │
                        ▼
            清理临时文件
```

### 11.2 扫描规则

| 规则类型 | 规则 | 级别 |
|---------|------|------|
| 结构 | manifest.yaml 缺失 | error |
| 结构 | name/version/runtimes 字段缺失 | error |
| 安全 | 包含可执行文件（.exe/.sh/.bat） | error |
| 安全 | 路径穿越（../ 模式） | error |
| 安全 | 脚本含高危命令（curl/wget/eval） | warning |
| 安全 | 包超过 50MB | error |
| 安全 | 文件数量超过 500 | error |
| 内容 | Markdown 中含可疑外部链接 | warning |

---

## 12. Wire 依赖注入

`cmd/server/wire.go` 声明 Provider Set：

```go
var ProviderSet = wire.NewSet(
    server.ProviderSet,   // HTTP + gRPC server
    data.ProviderSet,     // DB + cache + storage
    biz.ProviderSet,      // usecases
    service.ProviderSet,  // handlers
)
```

初始化顺序（由 `wire_gen.go` 生成）：

```
Config
  └─ Data (MySQL, Redis, MinIO)
       └─ Repos (User, Skill, Version, ...)
            └─ Usecases (Auth, Skill, Version, ...)
                  └─ Service (HTTP handlers)
                        └─ Server (HTTP + gRPC)
```

---

## 13. 开发规范

- 遵循 Kratos 标准分层：`api → service → biz → data`，禁止跨层调用
- 业务错误在 `biz` 层定义，`service` 层映射为 HTTP 状态码
- 所有关键操作在 `biz` 层写入 `audit_logs`
- 缓存策略：先写 DB，再删除缓存；缓存 miss 时从 DB 加载并回写
- 并发控制：高频写操作使用 Redis SetNX 分布式锁
- 日志使用 Kratos `log` 包，不使用 fmt.Printf
- 配置从 `config.yaml` 读取，敏感配置通过环境变量覆盖
