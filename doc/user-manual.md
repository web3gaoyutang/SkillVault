# SkillVault 用户手册

## 目录

1. [简介](#1-简介)
2. [快速开始](#2-快速开始)
3. [Web 界面使用](#3-web-界面使用)
4. [CLI 命令行工具](#4-cli-命令行工具)
5. [API 使用](#5-api-使用)
6. [组织与权限管理](#6-组织与权限管理)
7. [Skill 发布流程](#7-skill-发布流程)
8. [Skill 安装流程](#8-skill-安装流程)
9. [安全扫描](#9-安全扫描)
10. [部署指南](#10-部署指南)
11. [常见问题](#11-常见问题)

---

## 1. 简介

SkillVault 是一个可自托管的私有 Skill Registry，为 AI 编码 Agent 提供 Skill 的存储、治理与分发能力。

**核心功能：**

- 私有 Skill 仓库 — 按组织/命名空间集中管理 Skill
- 一条命令安装 — 通过 CLI 安装到 OpenClaw、Claude Code 等目标环境
- 安全扫描 — 上传时自动检查包结构和高风险内容
- 版本管理与审核 — draft → pending_review → approved → published
- 角色权限控制 — owner / admin / developer / viewer 四级权限

**支持的运行环境：**

| Runtime | 说明 |
|---------|------|
| OpenClaw | 安装到 OpenClaw 目录结构 |
| Claude Code | 安装到 `.claude/skills/`（project 或 user 级别）|

---

## 2. 快速开始

### 2.1 环境要求

- Docker & Docker Compose
- Node.js 20+（前端开发）
- Go 1.22+（后端开发）

### 2.2 启动基础设施

```bash
# 克隆项目
git clone <your-repo-url> skillvault
cd skillvault

# 复制环境变量
cp .env.example .env

# 启动 MySQL、Redis、MinIO
docker compose -f deploy/docker-compose/docker-compose.yaml up -d

# 初始化数据库（首次启动自动执行，也可手动执行）
make migrate
```

### 2.3 启动后端 API

```bash
cd apps/api
go run ./cmd/server/ -conf ./configs
```

服务启动后：
- HTTP API: http://localhost:8080
- gRPC: localhost:9090
- 健康检查: http://localhost:8080/api/v1/healthz

### 2.4 启动前端

```bash
cd apps/web
npm install
npm run dev
```

打开浏览器访问 http://localhost:3000

### 2.5 启动扫描 Worker

```bash
cd apps/worker
go run ./cmd/worker/
```

---

## 3. Web 界面使用

### 3.1 注册与登录

1. 访问 http://localhost:3000/register 创建账号
2. 填写用户名、邮箱、密码
3. 注册成功后跳转到登录页
4. 输入用户名和密码登录

### 3.2 Skill 目录（Catalog）

登录后进入首页即为 Skill 目录：

- **搜索** — 顶部搜索框，支持按关键词搜索 Skill
- **浏览** — 以卡片形式展示所有可见的 Skill
- **筛选** — 按标签、Runtime、可见性筛选
- **点击卡片** — 进入 Skill 详情页

### 3.3 Skill 详情

详情页展示：

- 基本信息（名称、组织、描述、标签、可见性）
- 兼容的 Runtime 列表
- 安装命令（可复制）
- 版本列表（版本号、状态、大小、发布时间）
- 下载次数

### 3.4 组织管理

进入侧边栏 "Organizations"：

- 查看已加入的组织列表
- 创建新组织
- 管理组织成员和角色

### 3.5 个人中心

进入侧边栏 "Profile"：

- 查看个人信息
- 管理 API Token（用于 CLI 认证）

---

## 4. CLI 命令行工具

### 4.1 安装 CLI

```bash
# 从源码构建
cd cli/skillvault
go build -o skillvault .

# 移动到 PATH
mv skillvault /usr/local/bin/
```

### 4.2 认证登录

```bash
# 登录到 SkillVault 服务器
skillvault login https://registry.example.com
```

按提示输入用户名和密码，认证成功后 Token 会保存在本地。

### 4.3 搜索 Skill

```bash
# 按关键词搜索
skillvault search database
skillvault search "sql debugger"
```

### 4.4 安装 Skill

```bash
# 安装到 OpenClaw（默认）
skillvault install acme/db-debugger

# 安装到 Claude Code（项目级别）
skillvault install acme/release-helper --target claude --scope project

# 安装到 Claude Code（用户级别）
skillvault install acme/release-helper --target claude --scope user
```

**安装参数：**

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--target` | `openclaw` | 目标 Runtime：`openclaw` 或 `claude` |
| `--scope` | `project` | 安装范围：`project` 或 `user` |

**安装路径：**

| Target | Scope | 安装路径 |
|--------|-------|---------|
| openclaw | - | OpenClaw 标准目录 |
| claude | project | `./.claude/skills/<skill-name>/` |
| claude | user | `~/.claude/skills/<skill-name>/` |

### 4.5 查看版本

```bash
skillvault version
```

---

## 5. API 使用

### 5.1 认证

所有需要认证的接口需携带 Token：

```
Authorization: Bearer <access_token>
```

CLI 场景也支持 API Token：

```
Authorization: Bearer <api_token>
```

### 5.2 统一响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": { }
}
```

错误响应：

```json
{
  "code": 401,
  "message": "unauthorized"
}
```

### 5.3 分页

请求：

```
GET /api/v1/skills?page=1&page_size=20&keyword=sql
```

响应：

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

### 5.4 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 注册 |
| POST | `/api/v1/auth/login` | 登录 |
| POST | `/api/v1/auth/refresh` | 刷新 Token |
| GET | `/api/v1/auth/me` | 当前用户信息 |
| POST | `/api/v1/organizations` | 创建组织 |
| GET | `/api/v1/organizations` | 组织列表 |
| POST | `/api/v1/skills` | 创建 Skill |
| GET | `/api/v1/skills` | Skill 列表 |
| GET | `/api/v1/skills/{org}/{name}` | Skill 详情 |
| POST | `/api/v1/skills/{org}/{name}/versions` | 上传新版本 |
| GET | `/api/v1/skills/{org}/{name}/versions/{version}/download` | 下载制品 |
| POST | `/api/v1/skills/{org}/{name}/versions/{version}/review` | 审核 |
| POST | `/api/v1/skills/{org}/{name}/versions/{version}/publish` | 发布 |
| POST | `/api/v1/tokens` | 创建 API Token |
| GET | `/api/v1/audit-logs` | 审计日志 |

---

## 6. 组织与权限管理

### 6.1 组织概念

SkillVault 以组织（Organization）作为 Skill 的命名空间。每个 Skill 属于一个组织，通过 `{org}/{name}` 形式引用。

### 6.2 角色权限

| 角色 | 浏览 Skill | 上传 Skill | 审核 Skill | 管理成员 | 管理组织 | 删除组织 |
|------|-----------|-----------|-----------|---------|---------|---------|
| viewer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| developer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 6.3 成员管理

组织 owner 或 admin 可以：

- 邀请新成员加入组织
- 修改成员角色
- 移除成员

---

## 7. Skill 发布流程

### 7.1 Canonical Package 结构

Skill 包使用统一的 Canonical Package 格式：

```
my-skill/
├── manifest.yaml      # 包元数据（必须）
├── skill.md           # Prompt 文件
├── templates/          # 模板文件
│   └── query.sql
└── scripts/            # 脚本文件
    └── analyze.py
```

### 7.2 manifest.yaml 示例

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

**必要字段：** `name`、`version`、`runtimes`

### 7.3 版本状态流转

```
draft → pending_review → approved → published
                       → rejected
```

| 状态 | 说明 |
|------|------|
| draft | 刚上传，等待提交审核 |
| pending_review | 已提交审核，等待 admin/owner 审批 |
| approved | 审核通过，可以发布 |
| published | 已发布，用户可安装 |
| rejected | 审核拒绝，需修改后重新提交 |

### 7.4 发布步骤

1. 打包 Skill 目录为 `.tar.gz`
2. 通过 Web 上传或 API 创建新版本
3. 系统自动执行安全扫描
4. admin/owner 审核扫描结果
5. 审核通过后发布

---

## 8. Skill 安装流程

### 8.1 安装原理

```
CLI 发起安装请求
    ↓
SkillVault 解析最新可用版本
    ↓
CLI 下载制品包
    ↓
校验 SHA256 checksum
    ↓
Runtime 适配器将包转换为目标格式
    ↓
安装到本地对应目录
```

### 8.2 Checksum 校验

每次安装前，CLI 会自动校验下载文件的 SHA256 校验和，确保制品完整性。如校验失败，安装中止。

### 8.3 Runtime 适配

安装时通过 `--target` 指定目标 Runtime，适配器会将 Canonical Package 转换为目标环境所需的格式和目录结构。

---

## 9. 安全扫描

### 9.1 扫描时机

Skill 版本上传后，系统自动将扫描任务推入队列，Scan Worker 异步执行扫描。

### 9.2 扫描规则

| 类型 | 规则 | 级别 |
|------|------|------|
| 结构 | manifest.yaml 缺失 | error |
| 结构 | 必要字段缺失（name/version/runtime） | error |
| 安全 | 包含可执行文件（.exe/.sh/.bat） | warning |
| 安全 | 路径穿越（`../` 模式） | error |
| 安全 | 脚本中包含 curl/wget/eval 等高危操作 | warning |
| 安全 | 包大小超限（默认 50MB） | error |
| 安全 | 文件数量超限（默认 500 个） | error |
| 内容 | Markdown 中包含可疑外部链接 | warning |

### 9.3 扫描结果

| 状态 | 说明 |
|------|------|
| passed | 所有规则通过 |
| warning | 存在警告项，但不阻断发布 |
| failed | 存在错误项，需修复后重新上传 |

---

## 10. 部署指南

### 10.1 Docker Compose 部署（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url> skillvault
cd skillvault

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，修改密码和密钥

# 3. 启动所有服务
docker compose -f deploy/docker-compose/docker-compose.yaml up -d

# 4. 验证服务状态
docker compose -f deploy/docker-compose/docker-compose.yaml ps
```

### 10.2 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Web | 3000 | 前端页面 |
| API (HTTP) | 8080 | REST API |
| API (gRPC) | 9090 | gRPC 接口 |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存与队列 |
| MinIO | 9000 | 对象存储 API |
| MinIO Console | 9001 | 对象存储控制台 |

### 10.3 生产环境注意事项

- 修改 `.env` 中所有默认密码
- 设置强 `JWT_SECRET`
- 配置 HTTPS（建议使用反向代理如 Nginx/Caddy）
- 配置数据库备份策略
- MinIO 建议配置持久化存储卷

---

## 11. 常见问题

### Q: 如何创建 API Token？

在 Web 界面的个人中心（Profile）页面，可以创建和管理 API Token。API Token 可用于 CLI 认证和自动化场景。

### Q: 忘记密码怎么办？

当前版本暂不支持密码找回，请联系管理员重置密码。

### Q: Skill 的可见性有哪些选项？

| 可见性 | 说明 |
|--------|------|
| private | 仅组织成员可见（默认） |
| internal | 所有登录用户可见 |
| public | 所有人可见 |

### Q: 支持哪些 Runtime？

当前 MVP 版本支持 OpenClaw 和 Claude Code 两种 Runtime。后续会扩展更多适配器。

### Q: 如何重新触发安全扫描？

```
POST /api/v1/skills/{org}/{name}/versions/{version}/rescan
```

### Q: 最大允许的包大小是多少？

默认 50MB，可通过配置文件 `configs/config.yaml` 中的 `scan.max_package_size` 调整。
