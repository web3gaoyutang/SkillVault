# SkillVault 技术文档

---

## 1. 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端 | React + TypeScript | SPA，统一使用 Ant Design 5 组件库 |
| 后端 | Go + Kratos v2 | 微服务框架，支持 gRPC + HTTP 双协议 |
| 数据库 | MySQL 8.0 | 主存储，关系型数据 |
| 缓存 | Redis 7.x | 缓存、会话管理、异步任务队列 |
| 对象存储 | MinIO / S3 兼容 | Skill 包制品存储 |
| CLI | Go | 与后端共享部分 model 定义 |
| 部署 | Docker Compose / Kubernetes | 容器化部署 |

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                       │
│                                                         │
│   ┌─────────────┐    ┌──────────────┐                   │
│   │  React Web  │    │  CLI (Go)    │                   │
│   │  (Browser)  │    │  (Terminal)  │                   │
│   └──────┬──────┘    └──────┬───────┘                   │
│          │                  │                           │
└──────────┼──────────────────┼───────────────────────────┘
           │ HTTP/REST        │ HTTP/REST + gRPC
           ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    API Gateway Layer                     │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │              Kratos BFF / Gateway               │   │
│   │         (认证、限流、路由、日志、链路追踪)          │   │
│   └──────────────────────┬──────────────────────────┘   │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │ gRPC
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│                                                         │
│   ┌────────────┐ ┌────────────┐ ┌────────────────────┐  │
│   │ Auth       │ │ Skill      │ │ Organization       │  │
│   │ Service    │ │ Service    │ │ Service            │  │
│   └────────────┘ └────────────┘ └────────────────────┘  │
│                                                         │
│   ┌────────────┐ ┌────────────┐ ┌────────────────────┐  │
│   │ Version    │ │ Audit      │ │ Scan               │  │
│   │ Service    │ │ Service    │ │ Worker             │  │
│   └────────────┘ └────────────┘ └────────────────────┘  │
│                                                         │
└───────┬──────────────┬───────────────┬──────────────────┘
        │              │               │
        ▼              ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────────┐
│  MySQL     │  │  Redis     │  │  MinIO / S3    │
│  (数据)    │  │  (缓存/队列)│  │  (制品存储)    │
└────────────┘  └────────────┘  └────────────────┘
```

---

## 3. Kratos 项目结构

遵循 Kratos 标准布局（DDD 分层）：

```
apps/api/
├── cmd/                          # 启动入口
│   └── server/
│       ├── main.go
│       ├── wire.go               # Wire 依赖注入
│       └── wire_gen.go
├── api/                          # Protobuf 定义 & 生成代码
│   ├── auth/v1/
│   │   ├── auth.proto
│   │   └── auth_http.pb.go
│   ├── skill/v1/
│   │   ├── skill.proto
│   │   └── skill_http.pb.go
│   ├── organization/v1/
│   ├── version/v1/
│   └── audit/v1/
├── internal/
│   ├── conf/                     # 配置结构（由 proto 生成）
│   │   ├── conf.proto
│   │   └── conf.pb.go
│   ├── server/                   # HTTP & gRPC Server 注册
│   │   ├── http.go
│   │   └── grpc.go
│   ├── service/                  # Service 层（对接 API）
│   │   ├── auth.go
│   │   ├── skill.go
│   │   ├── organization.go
│   │   ├── version.go
│   │   └── audit.go
│   ├── biz/                      # 业务逻辑层
│   │   ├── auth.go
│   │   ├── skill.go
│   │   ├── organization.go
│   │   ├── version.go
│   │   └── audit.go
│   └── data/                     # 数据访问层
│       ├── data.go               # Data provider（MySQL + Redis 初始化）
│       ├── auth.go
│       ├── skill.go
│       ├── organization.go
│       ├── version.go
│       └── audit.go
├── configs/                      # 配置文件
│   └── config.yaml
├── third_party/                  # 第三方 proto 依赖
├── Makefile
├── Dockerfile
└── go.mod
```

---

## 4. 数据库设计（MySQL）

### 4.1 ER 关系概览

```
User ──< OrgMember >── Organization
  │          │
  │          └── role (owner/admin/developer/viewer)
  │
  └── creates ──> Skill ──> SkillVersion ──> Artifact
                                │
                                └── ScanResult

所有关键操作 ──> AuditLog
```

说明：
- `User` 与 `Organization` 是多对多关系，通过 `org_members` 关联
- `organizations.created_by` 表示组织创建者，不等同于成员关系本身

### 4.2 表结构

#### users — 用户表

```sql
CREATE TABLE `users` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username`      VARCHAR(64)     NOT NULL,
    `email`         VARCHAR(255)    NOT NULL,
    `password_hash` VARCHAR(255)    NOT NULL,
    `display_name`  VARCHAR(128)    NOT NULL DEFAULT '',
    `avatar_url`    VARCHAR(512)    NOT NULL DEFAULT '',
    `status`        TINYINT         NOT NULL DEFAULT 1 COMMENT '1=active, 2=disabled',
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### organizations — 组织表

```sql
CREATE TABLE `organizations` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(64)     NOT NULL COMMENT '组织标识（namespace）',
    `display_name` VARCHAR(128)   NOT NULL DEFAULT '',
    `description` TEXT,
    `avatar_url`  VARCHAR(512)    NOT NULL DEFAULT '',
    `created_by`  BIGINT UNSIGNED NOT NULL,
    `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`),
    KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### org_members — 组织成员表

```sql
CREATE TABLE `org_members` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `org_id`          BIGINT UNSIGNED NOT NULL,
    `user_id`         BIGINT UNSIGNED NOT NULL,
    `role`            VARCHAR(32)     NOT NULL DEFAULT 'developer' COMMENT 'owner/admin/developer/viewer',
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_org_user` (`org_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### skills — Skill 表

```sql
CREATE TABLE `skills` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `org_id`        BIGINT UNSIGNED NOT NULL,
    `name`          VARCHAR(128)    NOT NULL COMMENT 'Skill 标识名',
    `display_name`  VARCHAR(256)    NOT NULL DEFAULT '',
    `description`   TEXT,
    `tags`          JSON            COMMENT '标签列表',
    `visibility`    VARCHAR(16)     NOT NULL DEFAULT 'private' COMMENT 'public/private/internal',
    `runtimes`      JSON            COMMENT '兼容的 Runtime 列表 ["openclaw","claude"]',
    `latest_version` VARCHAR(64)    NOT NULL DEFAULT '' COMMENT '最新发布版本号',
    `download_count` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `created_by`    BIGINT UNSIGNED NOT NULL,
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_org_name` (`org_id`, `name`),
    KEY `idx_visibility` (`visibility`),
    KEY `idx_created_by` (`created_by`),
    FULLTEXT KEY `ft_search` (`name`, `display_name`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### skill_versions — Skill 版本表

```sql
CREATE TABLE `skill_versions` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `skill_id`        BIGINT UNSIGNED NOT NULL,
    `version`         VARCHAR(64)     NOT NULL COMMENT '语义化版本号',
    `status`          VARCHAR(32)     NOT NULL DEFAULT 'draft' COMMENT 'draft/pending_review/approved/published/rejected',
    `changelog`       TEXT,
    `artifact_path`   VARCHAR(512)    NOT NULL COMMENT '制品存储路径（MinIO key）',
    `artifact_size`   BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '包大小（字节）',
    `checksum_sha256` VARCHAR(64)     NOT NULL DEFAULT '',
    `manifest`        JSON            COMMENT 'Canonical manifest 内容',
    `reviewed_by`     BIGINT UNSIGNED DEFAULT NULL,
    `reviewed_at`     DATETIME        DEFAULT NULL,
    `review_comment`  TEXT,
    `published_at`    DATETIME        DEFAULT NULL,
    `created_by`      BIGINT UNSIGNED NOT NULL,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_skill_version` (`skill_id`, `version`),
    KEY `idx_status` (`status`),
    KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### scan_results — 安全扫描结果表

```sql
CREATE TABLE `scan_results` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `version_id`      BIGINT UNSIGNED NOT NULL,
    `scan_type`       VARCHAR(32)     NOT NULL COMMENT 'structure/security/metadata',
    `status`          VARCHAR(16)     NOT NULL COMMENT 'passed/warning/failed',
    `findings`        JSON            COMMENT '扫描发现详情',
    `scanned_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_version_id` (`version_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### api_tokens — API Token 表

```sql
CREATE TABLE `api_tokens` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`      BIGINT UNSIGNED NOT NULL,
    `name`         VARCHAR(128)    NOT NULL COMMENT 'Token 名称',
    `token_hash`   VARCHAR(255)    NOT NULL COMMENT 'Token SHA256 哈希',
    `token_prefix` VARCHAR(16)     NOT NULL COMMENT 'Token 前缀（用于识别）',
    `scopes`       JSON            COMMENT '权限范围',
    `last_used_at` DATETIME        DEFAULT NULL,
    `expires_at`   DATETIME        DEFAULT NULL,
    `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token_hash` (`token_hash`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### audit_logs — 审计日志表

```sql
CREATE TABLE `audit_logs` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`      BIGINT UNSIGNED NOT NULL,
    `org_id`       BIGINT UNSIGNED DEFAULT NULL,
    `action`       VARCHAR(64)     NOT NULL COMMENT '操作类型',
    `resource_type` VARCHAR(32)    NOT NULL COMMENT 'skill/version/org/user',
    `resource_id`  BIGINT UNSIGNED NOT NULL,
    `detail`       JSON            COMMENT '操作详情',
    `ip`           VARCHAR(45)     NOT NULL DEFAULT '',
    `user_agent`   VARCHAR(512)    NOT NULL DEFAULT '',
    `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_org_id` (`org_id`),
    KEY `idx_action` (`action`),
    KEY `idx_resource` (`resource_type`, `resource_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.3 约束与一致性策略

- MVP 阶段默认不强依赖数据库外键约束，主要通过应用层事务与唯一索引保障一致性
- 涉及多表写入（如发布版本、成员变更）必须在单事务内完成
- 对高并发写场景使用唯一索引 + 幂等校验，避免重复创建
- 定期执行数据巡检任务（孤儿版本、孤儿扫描记录）并写入审计日志

---

## 5. Redis 使用方案

### 5.1 缓存策略

| Key 模式 | 用途 | TTL | 说明 |
|---------|------|-----|------|
| `user:{id}` | 用户信息缓存 | 30min | 登录态校验时减少 DB 查询 |
| `skill:{id}` | Skill 详情缓存 | 15min | Catalog 页面高频读 |
| `skill:list:{hash}` | Skill 列表查询缓存 | 5min | 按查询条件 hash 作 key |
| `org:{id}` | 组织信息缓存 | 30min | |
| `org:{id}:members` | 组织成员列表缓存 | 10min | |
| `version:{id}:scan` | 扫描结果缓存 | 1h | 扫描结果不常变 |

### 5.2 会话与认证

| Key 模式 | 用途 | TTL |
|---------|------|-----|
| `session:{token}` | 用户会话 | 24h |
| `refresh:{token}` | Refresh Token | 7d |
| `rate:api:{user_id}` | API 限流计数 | 1min |
| `rate:login:{ip}` | 登录限流 | 15min |

### 5.3 异步任务队列

使用 Redis List 实现轻量级任务队列（MVP 阶段不引入 MQ）：

| Key 模式 | 用途 |
|---------|------|
| `queue:scan` | 安全扫描任务队列 |
| `queue:scan:processing` | 处理中的扫描任务（可靠消费） |
| `task:scan:{version_id}` | 单个扫描任务状态 |

**队列操作流程：**

```
Producer:  LPUSH queue:scan {task_json}
Consumer:  BRPOPLPUSH queue:scan queue:scan:processing
完成后:    LREM queue:scan:processing 1 {task_json}
```

### 5.4 分布式锁

| Key 模式 | 用途 | TTL |
|---------|------|-----|
| `lock:skill:{org}:{name}` | Skill 创建防重复 | 10s |
| `lock:version:{skill_id}:{version}` | 版本发布防并发 | 30s |

### 5.5 缓存失效矩阵

| 写操作 | 需要失效的 Key |
|------|---------------|
| 更新用户信息 | `user:{id}` |
| 更新组织信息 | `org:{id}` |
| 组织成员变更 | `org:{id}:members` |
| 更新 Skill 元数据 | `skill:{id}`, `skill:list:{hash}`（按前缀批量失效） |
| 发布新版本 | `skill:{id}`, `skill:list:{hash}`, `version:{id}:scan` |
| 重扫版本 | `version:{id}:scan` |

实践建议：
- 优先“先写数据库，再删除缓存”策略，避免脏写回填
- 列表缓存采用短 TTL + 主动失效组合，平衡一致性与性能

---

## 6. API 设计

### 6.1 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新 Token |
| POST | `/api/v1/auth/logout` | 登出 |
| GET  | `/api/v1/auth/me` | 获取当前用户信息 |

### 6.2 组织相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST   | `/api/v1/organizations` | 创建组织 |
| GET    | `/api/v1/organizations` | 获取我的组织列表 |
| GET    | `/api/v1/organizations/{org}` | 获取组织详情 |
| PUT    | `/api/v1/organizations/{org}` | 更新组织信息 |
| DELETE | `/api/v1/organizations/{org}` | 删除组织 |
| GET    | `/api/v1/organizations/{org}/members` | 获取成员列表 |
| POST   | `/api/v1/organizations/{org}/members` | 添加成员 |
| PUT    | `/api/v1/organizations/{org}/members/{user_id}` | 更新成员角色 |
| DELETE | `/api/v1/organizations/{org}/members/{user_id}` | 移除成员 |

### 6.3 Skill 相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST   | `/api/v1/skills` | 创建 Skill |
| GET    | `/api/v1/skills` | Skill 列表（搜索、筛选、分页） |
| GET    | `/api/v1/skills/{org}/{name}` | 获取 Skill 详情 |
| PUT    | `/api/v1/skills/{org}/{name}` | 更新 Skill 信息 |
| DELETE | `/api/v1/skills/{org}/{name}` | 删除 Skill |

### 6.4 版本相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/skills/{org}/{name}/versions` | 上传新版本（multipart） |
| GET  | `/api/v1/skills/{org}/{name}/versions` | 获取版本列表 |
| GET  | `/api/v1/skills/{org}/{name}/versions/{version}` | 获取版本详情 |
| GET  | `/api/v1/skills/{org}/{name}/versions/{version}/download` | 下载制品包 |
| POST | `/api/v1/skills/{org}/{name}/versions/{version}/review` | 审核版本 |
| POST | `/api/v1/skills/{org}/{name}/versions/{version}/publish` | 发布版本 |

### 6.5 扫描相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/v1/skills/{org}/{name}/versions/{version}/scan` | 获取扫描结果 |
| POST | `/api/v1/skills/{org}/{name}/versions/{version}/rescan` | 重新扫描 |

### 6.6 审计日志

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/audit-logs` | 查询审计日志（分页、筛选） |

### 6.7 API Token

| 方法 | 路径 | 说明 |
|------|------|------|
| POST   | `/api/v1/tokens` | 创建 API Token |
| GET    | `/api/v1/tokens` | 获取 Token 列表 |
| DELETE | `/api/v1/tokens/{id}` | 撤销 Token |

### 6.8 通用约定

**认证方式：**

```
Authorization: Bearer <jwt_token>
```

CLI 场景也支持 API Token：

```
Authorization: Bearer <api_token>
```

**统一响应格式：**

```json
{
    "code": 0,
    "message": "success",
    "data": { }
}
```

### 6.9 API 语义与错误码约定

- 路径参数 `{org}` 表示组织 namespace（`organizations.name`），不是数值 ID
- 路径参数 `{name}` 表示 Skill 标识名（`skills.name`）
- `POST /api/v1/skills/{org}/{name}/versions/{version}/publish` 需要幂等：重复请求返回成功且不重复发布
- `POST /api/v1/skills/{org}/{name}/versions/{version}/review` 需要记录审核人、审核意见、审核时间

常见 HTTP 状态码语义：
- `400` 参数错误（版本号非法、分页参数非法）
- `401` 未认证（Token 缺失、过期或签名无效）
- `403` 已认证但无权限（角色不满足）
- `404` 资源不存在（组织/Skill/版本不存在）
- `409` 状态冲突（例如对已发布版本再次执行拒绝审核）
- `429` 触发限流（登录/API 频控）

**分页参数：**

```
GET /api/v1/skills?page=1&page_size=20&keyword=sql&tag=database&runtime=openclaw
```

**分页响应：**

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "items": [],
        "total": 100,
        "page": 1,
        "page_size": 20
    }
}
```

---

## 7. 前端架构（React）

### 7.1 技术选型

| 库 | 用途 |
|---|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| React Router v6 | 路由管理 |
| Zustand / Redux Toolkit | 状态管理 |
| Ant Design 5 | UI 组件库 |
| Axios | HTTP 请求 |
| React Query (TanStack Query) | 服务端状态管理 & 缓存 |
| Vite | 构建工具 |

### 7.2 项目结构

```
apps/web/
├── public/
├── src/
│   ├── api/                    # API 请求封装
│   │   ├── client.ts           # Axios 实例
│   │   ├── auth.ts
│   │   ├── skill.ts
│   │   ├── organization.ts
│   │   └── version.ts
│   ├── components/             # 通用组件
│   │   ├── Layout/
│   │   ├── SkillCard/
│   │   ├── SearchBar/
│   │   ├── VersionBadge/
│   │   └── ScanReport/
│   ├── pages/                  # 页面组件
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Catalog/            # Skill 目录
│   │   ├── SkillDetail/        # Skill 详情
│   │   ├── SkillUpload/        # 上传 Skill
│   │   ├── Organization/       # 组织管理
│   │   ├── ReviewCenter/       # 审核中心
│   │   ├── AuditLog/           # 审计日志
│   │   ├── Settings/           # 系统设置
│   │   └── Profile/            # 个人中心
│   ├── hooks/                  # 自定义 Hooks
│   ├── store/                  # 全局状态
│   ├── utils/                  # 工具函数
│   ├── types/                  # TypeScript 类型定义
│   ├── routes/                 # 路由配置
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 7.3 核心页面

| 页面 | 路由 | 说明 |
|------|------|------|
| 登录 | `/login` | 用户登录 |
| 注册 | `/register` | 用户注册 |
| Skill Catalog | `/` | Skill 目录首页，搜索 & 筛选 |
| Skill 详情 | `/skills/:org/:name` | 详情、版本、安装命令、扫描状态 |
| 上传 Skill | `/skills/new` | 创建 Skill 并上传第一个版本 |
| 上传新版本 | `/skills/:org/:name/versions/new` | 为已有 Skill 上传新版本 |
| 组织列表 | `/organizations` | 我的组织列表 |
| 组织详情 | `/organizations/:org` | 组织详情、成员管理、Skill 列表 |
| 审核中心 | `/reviews` | 待审核版本列表 |
| 审计日志 | `/audit-logs` | 审计日志查看 |
| 个人中心 | `/profile` | 个人信息、Token 管理 |

---

## 8. Scan Worker 设计

Scan Worker 是异步安全扫描服务，独立于主 API 进程运行。

### 8.1 工作流程

```
API 收到上传请求
    │
    ▼
存储制品到 MinIO → 创建 version 记录(status=draft)
    │
    ▼
LPUSH scan 任务到 Redis 队列
    │
    ▼
Scan Worker BRPOPLPUSH 获取任务
    │
    ▼
从 MinIO 下载制品到临时沙箱目录
    │
    ▼
执行扫描链：
  ├── 结构校验（manifest 完整性、必要字段）
  ├── 文件策略检查（禁止可执行文件、路径穿越检测）
  ├── 大小检查
  ├── checksum 计算（SHA256）
  └── 静态规则扫描（脚本中的危险模式、markdown 注入）
    │
    ▼
写入 scan_results 表 → 更新 version status
    │
    ▼
清理临时文件
```

### 8.2 扫描规则分类

| 类型 | 规则 | 级别 |
|------|------|------|
| 结构 | manifest.yaml 缺失 | error |
| 结构 | 必要字段缺失（name/version/runtime） | error |
| 安全 | 包含可执行文件（.exe/.sh/.bat） | error |
| 安全 | 路径穿越（../ 模式） | error |
| 安全 | 脚本中包含 curl/wget/eval 等高危操作 | warning |
| 安全 | 包大小超限（默认 50MB） | error |
| 安全 | 文件数量超限（默认 500 个） | error |
| 内容 | Markdown 中包含可疑外部链接 | warning |

---

## 9. Runtime 适配器

### 9.1 Canonical Package Model

SkillVault 内部统一使用 Canonical Package Model，`manifest.yaml` 示例：

```yaml
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
    type: prompt
  - path: templates/query.sql
    type: template
  - path: scripts/analyze.py
    type: script
```

### 9.2 OpenClaw 适配器

将 Canonical Package 转换为 OpenClaw 目录结构并安装到对应路径。

### 9.3 Claude Code 适配器

将 Canonical Package 转换为 Claude Code 本地 Skill 格式，安装到：
- `--scope project` → `.claude/skills/`
- `--scope user` → `~/.claude/skills/`

---

## 10. 认证与权限

### 10.1 认证流程

```
登录 → 返回 Access Token (JWT, 2h) + Refresh Token (7d)
    │
    ▼
Access Token 过期 → 使用 Refresh Token 换新的 Access Token
    │
    ▼
Refresh Token 过期 → 重新登录
```

**JWT Payload：**

```json
{
    "sub": "user_id",
    "username": "johndoe",
    "exp": 1234567890,
    "iat": 1234567890
}
```

### 10.2 RBAC 权限模型

| 角色 | 权限 |
|------|------|
| owner | 组织所有权限，包括删除组织、转让所有权 |
| admin | 管理成员、审核 Skill、管理组织设置 |
| developer | 上传 Skill、创建版本、查看 |
| viewer | 只读访问 |

### 10.3 版本状态流转规则

| From | To | Actor | 条件 |
|------|----|-------|------|
| draft | pending_review | developer/admin | 上传完成且基础校验通过 |
| pending_review | approved | admin/owner | 扫描结果无阻断项，审核通过 |
| pending_review | rejected | admin/owner | 审核拒绝并填写原因 |
| approved | published | admin/owner/system | 发布动作成功，制品可下载 |
| rejected | draft | developer | 重新提交修复后再次送审 |

说明：
- 当组织策略开启“自动发布”且扫描结果全量通过时，可由 `draft` 直接进入 `published`
- 任意状态变更都需要写入 `audit_logs`

**API 鉴权中间件（Kratos Middleware）：**

```go
func AuthMiddleware() middleware.Middleware {
    return func(handler middleware.Handler) middleware.Handler {
        return func(ctx context.Context, req interface{}) (interface{}, error) {
            // 从 Header 提取 Token
            // 验证 JWT / API Token
            // 注入用户信息到 Context
            // 调用下游 handler
        }
    }
}
```

---

## 11. 配置管理

Kratos 配置文件 `configs/config.yaml`：

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
  jwt_secret: "your-secret-key"
  access_token_ttl: 2h
  refresh_token_ttl: 168h

scan:
  max_package_size: 52428800  # 50MB
  max_file_count: 500
  sandbox_dir: /tmp/skillvault-scan
```

---

## 12. 部署方案

### 12.1 Docker Compose（MVP 推荐）

```yaml
version: "3.8"
services:
  web:
    build: ./apps/web
    ports:
      - "3000:80"
    depends_on:
      - api

  api:
    build: ./apps/api
    ports:
      - "8080:8080"
      - "9090:9090"
    depends_on:
      - mysql
      - redis
      - minio
    environment:
      - CONFIG_PATH=/app/configs/config.yaml

  worker:
    build: ./apps/worker
    depends_on:
      - mysql
      - redis
      - minio
    environment:
      - CONFIG_PATH=/app/configs/config.yaml

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: skillvault
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  mysql_data:
  redis_data:
  minio_data:
```

### 12.2 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Web (React) | 3000 | 前端页面 |
| API (HTTP) | 8080 | REST API |
| API (gRPC) | 9090 | gRPC 接口 |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存 |
| MinIO | 9000 / 9001 | 对象存储 / 控制台 |

### 12.3 生产环境最小基线

- 所有密钥（JWT、数据库、对象存储）通过环境变量或密钥管理系统注入，禁止硬编码
- MySQL 开启定时备份与恢复演练，至少保留最近 7 天全量备份
- MinIO 开启版本化与生命周期策略，防止误删制品不可恢复
- API 与 Worker 配置健康检查与重启策略（如 Kubernetes liveness/readiness）
- 关键审计日志至少保留 180 天，并支持导出归档

---

## 13. 开发规范

### 13.1 后端规范

- 遵循 Kratos 标准分层：`api → service → biz → data`
- Protobuf 定义 API 接口，生成 HTTP + gRPC 代码
- 使用 Wire 进行依赖注入
- 使用 GORM 作为 ORM
- 错误码使用 Kratos errors 包统一管理
- 日志使用 Kratos 内置 log 包

### 13.2 前端规范

- 组件使用函数式组件 + Hooks
- 使用 React Query 管理服务端状态
- 使用 Ant Design 组件库保持 UI 一致性
- API 请求统一通过 `api/` 目录封装
- 路由使用懒加载减少首屏体积

### 13.3 Git 规范

- 分支：`main` / `feature/*` / `fix/*` / `release/*`
- Commit 格式：`type(scope): description`
  - type: feat / fix / docs / refactor / test / chore
  - scope: api / web / cli / worker / deploy
