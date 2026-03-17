# SkillVault 架构文档

## 1. 系统概览

SkillVault 是一个可自托管的私有 Skill Registry，面向 AI 编码 Agent 团队。系统定位是 Skill 的**控制平面与分发层**，而非 AI Runtime 本身。

核心架构原则：
- **Registry-first**：集中管理和分发，不重新发明 Runtime
- **Private by default**：所有 Skill 默认私有，显式设置才可公开
- **Scan before publish**：异步安全扫描解耦上传与发布流程
- **Canonical model**：内部统一数据模型，按 Runtime 适配导出格式

---

## 2. 整体架构图

```
┌──────────────────────────────────────────────────────────────┐
│                         Client Layer                          │
│                                                               │
│   ┌──────────────────┐          ┌───────────────────────┐    │
│   │   React Web App  │          │   CLI (skillvault)    │    │
│   │   (Browser)      │          │   (Terminal)          │    │
│   └────────┬─────────┘          └──────────┬────────────┘    │
│            │ HTTP/REST                      │ HTTP/REST       │
└────────────┼──────────────────────────────-┼─────────────────┘
             │                               │
             ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│                         API Layer                             │
│                                                               │
│   ┌──────────────────────────────────────────────────────┐   │
│   │              Kratos HTTP Server (:8080)              │   │
│   │                                                      │   │
│   │  Auth Middleware (JWT + API Token)                   │   │
│   │  Rate Limiting (Redis)                               │   │
│   │                                                      │   │
│   │  ┌────────┐ ┌───────┐ ┌──────────┐ ┌─────────────┐  │   │
│   │  │ Auth   │ │ Skill │ │  Org     │ │  Version    │  │   │
│   │  │ /5     │ │ /5    │ │  /9      │ │  /7         │  │   │
│   │  └────────┘ └───────┘ └──────────┘ └─────────────┘  │   │
│   │  ┌────────┐ ┌───────┐ ┌──────────┐ ┌─────────────┐  │   │
│   │  │ Scan   │ │ Audit │ │  Token   │ │  Review     │  │   │
│   │  │ /2     │ │ /1    │ │  /3      │ │  /1         │  │   │
│   │  └────────┘ └───────┘ └──────────┘ └─────────────┘  │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                               │
│   ┌──────────────────────────────────────────────────────┐   │
│   │              Kratos gRPC Server (:9090)              │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
          ┌────────────────┼────────────────────┐
          ▼                ▼                     ▼
┌─────────────┐   ┌─────────────┐    ┌──────────────────┐
│   MySQL     │   │   Redis     │    │   MinIO          │
│   (:3306)   │   │   (:6379)   │    │   (:9000)        │
│             │   │             │    │                  │
│ 8 tables    │   │ Cache       │    │ Artifacts        │
│ users       │   │ Sessions    │    │ (tar.gz)         │
│ orgs        │   │ Rate limit  │    │                  │
│ skills      │   │ Scan queue  │    │                  │
│ versions    │   │ Dist locks  │    │                  │
│ ...         │   │             │    │                  │
└─────────────┘   └──────┬──────┘    └──────────────────┘
                         │
                         │ queue:scan (Redis List)
                         ▼
               ┌──────────────────┐
               │   Scan Worker    │
               │   (async)        │
               │                  │
               │ Structure check  │
               │ Security scan    │
               │ Metadata verify  │
               └──────────────────┘
```

---

## 3. 组件详解

### 3.1 React Web App

**角色：** 管理员和开发者的 Web 操作界面

**主要功能：**
- Skill 浏览、搜索、筛选（Catalog）
- 上传 Skill 包（multipart form）
- 版本状态管理（提交审核 → 审核 → 发布）
- 组织成员管理
- 审计日志查看
- API Token 管理

**关键设计：**
- Axios 拦截器自动附加 JWT，统一处理 401 自动登出
- TanStack Query 管理服务端状态，提供缓存和后台刷新
- Zustand + localStorage 持久化登录态
- Mock API 模式支持前端独立开发（`VITE_MOCK=true`）

### 3.2 Registry API（Kratos）

**角色：** 系统核心，提供所有业务功能的 HTTP/gRPC 接口

**分层结构：**
```
server/http.go      ← 路由注册（42 端点）
  service/          ← HTTP handler（参数绑定、响应格式化）
    biz/            ← 业务逻辑（权限、状态机、跨实体协调）
      data/         ← 数据访问（MySQL / Redis / MinIO）
```

**核心服务：**

| 服务 | 职责 |
|------|------|
| AuthUsecase | 注册/登录/Token 刷新，bcrypt 密码，JWT 签发 |
| SkillUsecase | Skill CRUD，全文搜索，可见性控制 |
| VersionUsecase | 版本上传，状态机，MinIO 存储，扫描触发 |
| OrganizationUsecase | 组织 CRUD，成员管理，角色权限 |
| AuditUsecase | 审计日志记录与查询 |
| TokenUsecase | API Token 生命周期管理 |

### 3.3 Scan Worker

**角色：** 异步安全扫描服务，独立进程

**设计考量：** 扫描可能耗时较长（解压、静态分析），独立 Worker 避免阻塞 API 响应。

**流程：**
```
1. API 上传制品 → LPUSH 扫描任务到 queue:scan
2. Worker BRPOPLPUSH 获取任务（可靠消费模式）
3. 从 MinIO 下载制品到沙箱目录
4. 执行扫描规则链（结构 → 安全 → 内容）
5. 写入 scan_results，更新 version.status
6. 清理临时文件，LREM 完成确认
```

### 3.4 CLI Tool（skillvault）

**角色：** 开发者本地安装/管理工具

**命令：**
```bash
skillvault login <server_url>                         # 认证，保存 token
skillvault search <keyword>                           # 搜索 Skills
skillvault install <org>/<name> [--target openclaw]   # 下载并安装
skillvault update <org>/<name>                        # 检查并更新
skillvault remove <org>/<name> [--target openclaw]    # 卸载
skillvault version                                    # 显示版本
```

**安装流程：**
```
login → resolve 最新版本 → 下载 tar.gz → SHA256 校验 → 解压到目标目录
```

---

## 4. 数据流

### 4.1 Skill 发布流程

```
Developer                API                  MinIO          Redis          DB
    │                     │                     │              │             │
    ├── POST /versions ──→ │                     │              │             │
    │   (multipart)        │                     │              │             │
    │                      ├── Upload ─────────→ │              │             │
    │                      ├── Create version ──────────────────────────────→ │
    │                      │   (status=draft)     │              │            │
    │                      ├── Push scan task ─────────────────→ │            │
    │                      │                     │              │             │
    │ ←── version (draft) ─┤                     │              │             │
    │                      │                     │              │             │
    │                      │              Worker pops task ←──── │            │
    │                      │                     │                            │
    │                      │              Download ←────────── MinIO          │
    │                      │              Run scan rules                      │
    │                      │              Write scan_results ───────────────→ │
    │                      │              Update version.status ─────────────→│
    │                      │                                                  │
    ├── POST /submit ─────→ │                     │              │             │
    │                      ├── status: pending_review ────────────────────────│
    │                      │                                                  │
Admin ├── POST /review ──→  │                     │              │             │
    │   (approved=true)     ├── status: approved ───────────────────────────→ │
    │                      │                                                  │
    ├── POST /publish ────→ │                     │              │             │
    │                      ├── status: published ──────────────────────────→  │
    │                      ├── Update skill.latest_version ─────────────────→ │
```

### 4.2 Skill 安装流程（CLI）

```
CLI User               API                  MinIO
    │                   │                     │
    ├── login ─────────→ │                     │
    │ ←── JWT token ────  │                     │
    │                    │                     │
    ├── GET /skills ────→ │                     │
    │ ←── skill list ─── │                     │
    │                    │                     │
    ├── GET /versions ──→ │                     │
    │ ←── versions ────── │                     │
    │                    │                     │
    ├── GET /download ──→ │                     │
    │                    ├── GetObject ────────→ │
    │ ←── tar.gz ──────────────────────────────  │
    │                    │                     │
    │ Verify SHA256      │                     │
    │ Extract to target  │                     │
    │ Runtime adapter    │                     │
    │ (openclaw/.claude) │                     │
```

### 4.3 认证流程

```
Client                      API                      Redis
  │                           │                         │
  ├── POST /auth/login ──────→ │                         │
  │   {username, password}     │                         │
  │                            ├── bcrypt.Compare ─────  │
  │                            ├── Generate JWT (2h)     │
  │                            ├── Generate Refresh(7d)  │
  │                            ├── SET refresh:{token} ─→ │
  │ ←── {access, refresh} ────  │                         │
  │                            │                         │
  │ (2h later, JWT expires)     │                         │
  │                            │                         │
  ├── POST /auth/refresh ─────→ │                         │
  │   {refresh_token}           ├── GET refresh:{token} ─→ │
  │                             │ ←── valid ──────────────  │
  │                             ├── Generate new JWT      │
  │ ←── {new_access_token} ────  │                         │
```

---

## 5. 版本状态机

```
                  ┌─────────────────────┐
                  │                     │
     upload ──→ [draft] ──submit──→ [pending_review]
                  ↑                     │
                  │                ┌────┴────┐
              resubmit        approve    reject
                  │                │        │
             [rejected] ←──────────┘  [rejected]
                                          │
                                     resubmit
                                          │
                                       [draft]

[approved] ──publish──→ [published]
```

| 状态 | 说明 | 可执行操作 |
|------|------|-----------|
| `draft` | 初始状态，上传后创建 | 提交审核（developer+）|
| `pending_review` | 等待审核 | 通过/拒绝（admin+）|
| `approved` | 审核通过，等待发布 | 发布（admin+）|
| `published` | 已发布，可下载 | 无（终态）|
| `rejected` | 审核拒绝 | 修改后重新上传（developer+）|

---

## 6. RBAC 权限模型

角色层级（高 → 低）：`owner > admin > developer > viewer`

```
Owner (4)
  ├── 所有 admin 权限
  ├── 删除组织
  └── 转让所有权

Admin (3)
  ├── 所有 developer 权限
  ├── 管理成员（添加/移除/改角色）
  ├── 审核版本（通过/拒绝）
  ├── 发布版本
  └── 更新组织信息

Developer (2)
  ├── 所有 viewer 权限
  ├── 创建 Skill
  ├── 上传版本
  └── 提交版本审核

Viewer (1)
  ├── 查看 Skill 列表和详情
  ├── 下载已发布版本
  └── 查看版本详情
```

权限检查实现：

```go
func checkPermission(ctx context.Context, orgName string, required string) error {
    member := getMemberFromCtx(ctx, orgName)
    if roleHierarchy[member.Role] < roleHierarchy[required] {
        return ErrPermissionDenied
    }
    return nil
}
```

---

## 7. 缓存策略

### 7.1 Redis 键规范

```
user:{id}                 → 用户信息 (TTL 30min)
skill:{id}                → Skill 详情 (TTL 15min)
skill:list:{params_hash}  → Skill 列表 (TTL 5min)
org:{id}                  → 组织信息 (TTL 30min)
org:{id}:members          → 组织成员 (TTL 10min)
refresh:{token}           → Refresh Token (TTL 7d)
rate:api:{user_id}        → API 限流计数 (TTL 1min)
rate:login:{ip}           → 登录限流计数 (TTL 15min)
lock:skill:{org}:{name}   → 创建锁 (TTL 10s)
lock:version:{id}:{ver}   → 发布锁 (TTL 30s)
queue:scan                → 扫描任务队列 (Redis List)
queue:scan:processing     → 处理中任务 (BRPOPLPUSH 目标)
```

### 7.2 缓存失效矩阵

| 写操作 | 失效 Key |
|------|---------|
| 更新用户信息 | `user:{id}` |
| 创建/更新 Skill | `skill:{id}`, `skill:list:*` |
| 发布版本 | `skill:{id}`, `skill:list:*` |
| 组织成员变更 | `org:{id}:members` |

缓存更新策略：**先写 DB，再删缓存**（避免脏数据回写）。

---

## 8. 安全设计

### 8.1 上传阶段

| 控制点 | 措施 |
|------|------|
| 包大小 | 最大 50MB，超限拒绝 |
| 文件数量 | 最多 500 个文件 |
| 路径穿越 | 检测 `../` 模式 |
| 可执行文件 | 拒绝 .exe/.sh/.bat 等 |
| 高危命令 | 脚本中检测 curl/wget/eval（warning）|
| Checksum | SHA256 计算并存储 |

### 8.2 下载阶段

| 控制点 | 措施 |
|------|------|
| 访问控制 | 需 viewer 角色或公开 Skill |
| Checksum 验证 | CLI 下载后自动校验 SHA256 |
| 安装路径 | 适配器限制安装目标目录 |

### 8.3 API 安全

| 控制点 | 措施 |
|------|------|
| 认证 | JWT HS256，2h 过期 |
| 密码存储 | bcrypt cost=10 |
| API Token | SHA256 哈希存储，不可逆 |
| 限流 | Redis 计数器，API 1min/user，登录 15min/IP |
| 审计 | 所有关键操作写入 audit_logs |

---

## 9. 部署架构

### 9.1 Docker Compose（MVP / 单机部署）

```
┌────────────────────────────────────────────┐
│              Docker Host                    │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  web     │  │   api    │  │  worker  │  │
│  │ :3000    │  │ :8080    │  │          │  │
│  │ (nginx)  │  │ :9090    │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  mysql   │  │  redis   │  │  minio   │  │
│  │ :3306    │  │ :6379    │  │ :9000    │  │
│  │ (volume) │  │ (volume) │  │ :9001    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
└────────────────────────────────────────────┘
```

服务端口：

| 服务 | 端口 | 协议 |
|------|------|------|
| Web (React) | 3000 | HTTP |
| API (HTTP) | 8080 | HTTP/REST |
| API (gRPC) | 9090 | gRPC |
| MySQL | 3306 | TCP |
| Redis | 6379 | TCP |
| MinIO | 9000 | HTTP (S3 API) |
| MinIO Console | 9001 | HTTP |

### 9.2 启动顺序依赖

```
mysql ─────────────────────────┐
redis ─────────────────────────┤──→ api ──→ worker
minio ─────────────────────────┤
                                └──→ web (depends on api)
```

---

## 10. Canonical Package Model

SkillVault 内部统一使用 Canonical Package Model，不同 Runtime 通过适配器转换。

### 10.1 Manifest 结构

```yaml
# manifest.yaml（打包在 tar.gz 内）
name: db-debugger
version: 1.2.0
description: Database debugging skill for AI agents
author: acme
runtimes:
  - openclaw
  - claude
tags:
  - database
  - debugging
files:
  - path: skill.md
    type: prompt        # prompt / template / script / config
  - path: templates/query.sql
    type: template
  - path: scripts/analyze.py
    type: script
```

### 10.2 Runtime 适配器

| 适配器 | 包 | 安装位置 |
|------|------|---------|
| OpenClaw | `packages/adapter-openclaw` | OpenClaw 插件目录 |
| Claude Code | `packages/adapter-claude` | `.claude/skills/`（project）或 `~/.claude/skills/`（user）|

适配器接口：
```go
type Adapter interface {
    Install(manifest *canonical.Manifest, artifactDir string, opts InstallOptions) error
    Uninstall(name string, opts InstallOptions) error
    ListInstalled(opts InstallOptions) ([]*InstalledSkill, error)
}
```

---

## 11. 目录结构总览

```
SkillVault/
├── apps/
│   ├── api/              # Kratos 后端（HTTP :8080, gRPC :9090）
│   │   ├── cmd/server/   # 入口 + Wire DI
│   │   ├── api/          # Protobuf → 生成代码
│   │   ├── internal/     # biz / service / data / middleware
│   │   └── configs/      # config.yaml
│   ├── web/              # React 前端（:3000）
│   │   └── src/          # api / pages / components / store / routes
│   └── worker/           # 异步扫描 Worker
│       └── internal/scanner/
├── cli/
│   └── skillvault/       # CLI 工具（cobra）
│       └── cmd/          # login / search / install / update / remove
├── packages/             # 共享 Go 库
│   ├── canonical-model/  # Manifest 定义
│   ├── validator/        # Manifest 校验
│   ├── scanner/          # 扫描规则基础
│   ├── adapter-openclaw/ # OpenClaw 适配器
│   └── adapter-claude/   # Claude Code 适配器
├── deploy/
│   ├── docker-compose/   # docker-compose.yaml
│   └── kubernetes/       # K8s 部署配置（待完善）
├── doc/
│   ├── product.md        # 产品文档
│   ├── technical.md      # 技术规格文档
│   ├── architecture.md   # 本文件：架构总览
│   ├── backend.md        # 后端详细技术文档
│   └── frontend.md       # 前端详细技术文档
├── CLAUDE.md             # 开发者指南（AI 辅助编程专用）
├── README.md             # 项目介绍
└── .env.example          # 环境变量示例
```

---

## 12. 技术决策记录（ADR）

### ADR-001：使用 Redis List 作为扫描队列

**决策：** MVP 阶段使用 Redis List（BRPOPLPUSH）替代 Kafka/RabbitMQ
**原因：** 扫描任务量较小，Redis 已是基础依赖，不引入额外中间件降低复杂度
**权衡：** 无持久化保证（重启可能丢失任务），适合 MVP 容忍度

### ADR-002：MinIO 存储制品（不在 DB）

**决策：** Skill 包制品存储在 MinIO，DB 只存路径和 checksum
**原因：** 制品是不可变二进制文件，对象存储天然适合；数据库存 blob 性能差
**权衡：** 增加一个基础设施依赖

### ADR-003：Wire 编译时依赖注入

**决策：** 使用 Wire 而非运行时 DI 框架
**原因：** 编译时检查依赖关系，避免运行时 DI 错误；是 Kratos 推荐方案
**权衡：** 需要生成 `wire_gen.go`，增加一个代码生成步骤

### ADR-004：应用层事务代替 DB 外键

**决策：** MVP 阶段不强依赖 MySQL 外键约束
**原因：** 外键在高并发迁移场景下会造成性能瓶颈；应用层已有唯一索引和事务保障
**权衡：** 需要更严格的应用层一致性保证

### ADR-005：前端 Mock API 系统

**决策：** 内置 Axios 拦截器 Mock 而非 MSW
**原因：** 更简单，不需要 Service Worker；通过环境变量或 localStorage 可随时切换
**权衡：** Mock 精确度依赖手工维护，不如 MSW 通用
