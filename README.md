# SkillVault

> Store, govern, and ship private skills.
>
> 私有 Skill 的存储、治理与分发平台。

SkillVault is a self-hostable private skill registry for AI coding agents. It helps teams upload, manage, review, discover, and install reusable skills across environments like OpenClaw and Claude Code — without relying on public marketplaces.

SkillVault 是一个可自托管的私有 Skill Registry，面向 AI 编码 Agent。它帮助团队安全地上传、管理、审核、发现并安装可复用 Skill，适配 OpenClaw、Claude Code 等环境，同时不依赖公开 Skill 市场。

---

## Why SkillVault / 为什么是 SkillVault

Teams are starting to treat AI skills as reusable infrastructure: prompts, workflows, scripts, references, templates, and operating conventions that should be versioned and shared just like code.

But today, most teams still manage skills in fragmented ways:

- private Git repositories / 私有 Git 仓库
- ZIP files passed around manually / 手工传 ZIP
- local folders copied between machines / 本地目录直接复制
- public marketplaces that are not suitable for internal assets / 不适合内部资产的公开市场

This leads to the same problems again and again:

- poor discoverability / 不好找
- weak governance / 不好管
- inconsistent installation / 安装不一致
- trust and security concerns / 安全与信任风险高

SkillVault solves this by giving teams a private, versioned, auditable, and installable registry for skills.

SkillVault 的目标，就是把 Skill 变成像代码包、镜像、内部制品一样可治理、可审计、可分发的资产。

---

## What is SkillVault / SkillVault 是什么

SkillVault is **not** an AI runtime.

It is the **control plane and distribution layer** for reusable skills.

SkillVault 不是新的 Agent Runtime，而是 Skill 的**控制平面与分发层**。

It is built for teams that want to:

- keep skills private by default / 默认私有托管 Skill
- publish approved skills centrally / 集中发布经过审核的 Skill
- install skills with one command / 一条命令完成安装
- support self-hosted internal deployments / 支持内网与自托管部署
- work across multiple agent ecosystems / 跨多个 Agent 生态使用 Skill

---

## Core Features / 核心能力

### 1. Private Skill Registry / 私有 Skill 仓库
Upload and manage skills in a central registry with version history, metadata, and visibility controls.

集中管理 Skill，支持版本、元数据和可见性控制。

### 2. One-command Install / 一条命令安装
Install skills into supported local environments through a CLI.

通过 CLI 一条命令安装到本地目标环境。

### 3. Self-hostable / 支持自托管
Run SkillVault inside your internal network or on the public internet.

支持内网部署，也支持公网部署。

### 4. Security Scanning / 安全扫描
Validate uploaded packages and flag suspicious or risky content before publication.

在发布前校验 Skill 包结构，并标记高风险内容。

### 5. Governance and Auditability / 治理与审计
Support version control, review states, role-based access, and audit logs.

支持版本管理、审核状态、角色权限和审计日志。

### 6. Runtime Adapters / Runtime 适配层
Install or export skills for different ecosystems such as OpenClaw and Claude Code.

通过适配层支持 OpenClaw、Claude Code 等不同生态。

---

## MVP Scope / MVP 范围

### Included / 已包含
- authentication and organizations / 用户认证与组织
- skill metadata and versioning / Skill 元数据与版本管理
- package upload / Skill 包上传
- validation and basic security scanning / 结构校验与基础安全扫描
- web catalog / Web Catalog
- CLI login, search, install, update, remove / CLI 登录、搜索、安装、更新、卸载
- OpenClaw adapter / OpenClaw 适配器
- Claude Code local skill adapter / Claude Code 本地 Skill 适配器
- basic audit logs / 基础审计日志
- Docker Compose deployment / Docker Compose 部署

### Not in MVP / 不在 MVP
- full in-browser skill editor / 完整在线 Skill 编辑器
- advanced approval workflows / 复杂审批流
- Claude plugin marketplace export / Claude plugin marketplace 导出
- deep analytics / 深度分析能力
- formal signing and provenance infrastructure / 完整签名与供应链可信体系

---

## How It Works / 工作方式

### Publish Flow / 发布流程
1. Upload a skill package through Web UI or CLI.  
   通过 Web 或 CLI 上传 Skill 包。
2. SkillVault stores the artifact and creates a version record.  
   SkillVault 存储制品并创建版本记录。
3. The validator checks structure, metadata, and compatibility.  
   校验器检查结构、元数据和兼容性。
4. The scanner flags suspicious scripts or risky patterns.  
   扫描器标记可疑脚本和高风险模式。
5. The version is reviewed or published based on policy.  
   根据策略进入审核或发布状态。

### Install Flow / 安装流程
1. Log in through the CLI.  
   通过 CLI 登录。
2. Search for a skill or install directly by namespace and name.  
   搜索 Skill，或按组织/名称直接安装。
3. SkillVault resolves the version and target runtime.  
   SkillVault 解析版本与目标 Runtime。
4. The CLI downloads and verifies the artifact.  
   CLI 下载并校验制品。
5. The adapter installs it into the correct local path.  
   适配器把 Skill 安装到正确的本地目录。

---

## Architecture Overview / 架构概览

SkillVault is designed around a registry-first architecture:

- **Web App** — browse, manage, review, configure  
  浏览、管理、审核、配置
- **Registry API** — auth, metadata, permissions, versions, downloads  
  认证、元数据、权限、版本、下载
- **Artifact Storage** — immutable package storage  
  不可变制品存储
- **Validation & Scan Worker** — validation, checksum, security scanning  
  校验、校验和生成、安全扫描
- **CLI** — install, update, publish, verify  
  安装、更新、发布、校验
- **Runtime Adapters** — OpenClaw / Claude / future targets  
  OpenClaw / Claude / 更多未来目标

### Suggested Stack / 推荐技术栈
- Frontend: Next.js
- API: Go / FastAPI / Node.js
- CLI: Go or Rust
- Database: Postgres
- Object Storage: MinIO / S3-compatible storage
- Jobs: Redis + Worker or DB-backed queue

---

## Compatibility / 兼容性

### MVP
- OpenClaw: install-compatible
- Claude Code: local skill install-compatible

### Planned
- Claude plugin marketplace export
- more runtime adapters
- public/private hybrid registry modes

SkillVault internally uses a canonical package model and adapts it to runtime-specific layouts when needed.

SkillVault 内部采用统一的 Canonical Package Model，再按不同 Runtime 的要求进行导出或安装适配。

---

## Security Model / 安全模型

SkillVault assumes that uploaded skill packages may be unsafe.

SkillVault 默认假设上传包可能存在风险，因此把安全作为第一原则之一。

### Upload-time controls / 上传阶段控制
- archive extraction sandbox / 解包沙箱
- path traversal prevention / 路径穿越防护
- file policy checks / 文件策略检查
- size limits / 大小限制
- static scan rules for scripts and markdown / 对脚本和 markdown 做静态规则扫描

### Install-time controls / 安装阶段控制
- checksum verification / checksum 校验
- trust labels and warnings / 信任标签和风险警告
- target path confirmation / 明确安装目标路径
- policy-based blocking / 按策略阻断安装

---

## Example CLI / CLI 示例

```bash
skillvault login https://registry.example.com
skillvault search sql
skillvault install acme/db-debugger --target openclaw
skillvault install acme/release-helper --target claude --scope project
skillvault update acme/release-helper
skillvault remove acme/release-helper --target claude
skillvault verify acme/release-helper
```

---

## Repository Structure / 仓库结构建议

```text
skillvault/
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
├── cli/
│   └── skillvault/
├── packages/
│   ├── adapter-openclaw/
│   ├── adapter-claude/
│   ├── validator/
│   ├── scanner/
│   └── canonical-model/
├── deploy/
│   ├── docker-compose/
│   └── kubernetes/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── security/
│   └── product/
└── README.md
```

---

## Quickstart / 快速开始

> The commands below are illustrative for now and can be adjusted once the actual repo structure is finalized.  
> 下面的命令是建议写法，后续可以按真实仓库结构调整。

### 1. Start local services / 启动本地服务

```bash
docker compose up -d
```

### 2. Initialize environment / 初始化环境

```bash
cp .env.example .env
```

### 3. Run database migrations / 执行数据库迁移

```bash
make migrate
```

### 4. Start app services / 启动应用

```bash
make dev
```

### 5. Access local endpoints / 访问本地服务

- Web: `http://localhost:3000`
- API: `http://localhost:8080`

---

## Product Principles / 产品原则

1. **Private by default**  
   默认私有，不把内部 Skill 暴露到公网。
2. **Registry-first**  
   先把 Skill 管理和分发做好，而不是重新发明 Runtime。
3. **One-command install**  
   安装链路必须足够简单。
4. **Trust is visible**  
   安全状态和风险提示必须明确可见。
5. **Compatibility is practical**  
   兼容策略以实际可安装、可运行优先，而不是追求抽象完美。

---

## Roadmap / 路线图

### Phase 1
- registry core
- upload and validation flow
- web catalog
- CLI install path
- OpenClaw adapter
- Claude local skill adapter

### Phase 2
- review workflows
- richer policies
- audit UI
- API tokens
- improved search and filtering

### Phase 3
- Claude marketplace export
- provenance/signing
- collections and bundles
- usage analytics
- hybrid private/public registry modes

---

## Who Is This For / 适合谁

SkillVault is for teams that already see AI skills as reusable internal assets.

SkillVault 适合以下团队：

- teams using AI coding agents in daily development / 在日常研发中使用 AI 编码 Agent 的团队
- platform teams managing internal developer workflows / 管理内部研发流程的平台团队
- security-conscious organizations that cannot rely on public marketplaces / 无法依赖公开市场的安全敏感组织
- open-source builders who want a registry-first architecture for reusable skills / 想把 Skill 当成制品来治理的开源项目作者

---

## Status / 当前状态

SkillVault is currently at the project-definition stage.

Current focus:
- canonical package model
- adapter contract design
- registry core architecture
- MVP implementation plan

SkillVault 当前处于项目定义和 MVP 设计阶段，现阶段重点包括：
- Canonical Package Model
- Adapter Contract 设计
- Registry Core 架构
- MVP 落地计划

---

## Contributing / 参与贡献

Contributions are welcome.

Suggested areas:
- canonical manifest design
- runtime adapter implementation
- validator and scanner rules
- CLI UX
- self-hosted deployment templates
- docs and examples

欢迎参与贡献，尤其是以下方向：
- canonical manifest 设计
- runtime adapter 实现
- validator / scanner 规则
- CLI 体验
- 自托管部署模板
- 文档与示例

---

## License / 许可证

TBD

---

## Vision / 愿景

SkillVault aims to become the trusted private system of record for AI agent skills.

SkillVault 希望成为 AI Agent Skill 的可信私有基础设施。

Not a shared folder.  
Not a ZIP dump.  
Not an unsafe public marketplace.  

A real registry for reusable AI workflows.

不是共享文件夹。  
不是 ZIP 中转站。  
不是不受控的公开市场。  

而是一个真正面向可复用 AI 工作流的 Skill Registry。

