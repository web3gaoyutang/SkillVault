# SkillVault 产品文档

> Store, govern, and ship private skills.
>
> 私有 Skill 的存储、治理与分发平台。

---

## 1. 产品定位

SkillVault 是一个**可自托管的私有 Skill Registry**，面向 AI 编码 Agent 生态。它帮助团队安全地上传、管理、审核、发现并安装可复用 Skill，适配 OpenClaw、Claude Code 等环境，同时不依赖公开 Skill 市场。

SkillVault **不是**一个 AI Runtime，而是 Skill 的**控制平面与分发层**。

---

## 2. 解决的问题

当前团队管理 AI Skill 面临的痛点：

| 痛点 | 现状 | SkillVault 方案 |
|------|------|----------------|
| 不好找 | Skill 分散在 Git 仓库、ZIP 文件、本地目录 | 统一 Web Catalog + CLI 搜索 |
| 不好管 | 缺乏版本控制与审核流程 | 版本管理 + 审核状态 + 角色权限 |
| 安装不一致 | 手工复制、路径不统一 | 一条命令安装 + Runtime 适配 |
| 安全风险高 | 无安全扫描、无信任机制 | 上传安全扫描 + 信任标签 + checksum 校验 |

---

## 3. 目标用户

| 角色 | 描述 | 核心需求 |
|------|------|---------|
| **Skill 开发者** | 编写并上传 Skill 的开发人员 | 快速上传、版本管理、跨 Runtime 适配 |
| **Skill 使用者** | 搜索并安装 Skill 的开发人员 | 快速发现、一键安装、版本更新 |
| **团队管理员** | 管理组织内 Skill 的技术负责人 | 权限管理、审核发布、安全合规 |
| **平台团队** | 管理内部研发工具链的平台工程师 | 自托管部署、审计日志、策略配置 |

---

## 4. 产品原则

1. **Private by default** — 默认私有，不把内部 Skill 暴露到公网
2. **Registry-first** — 先把 Skill 管理和分发做好，不重新发明 Runtime
3. **One-command install** — 安装链路必须足够简单
4. **Trust is visible** — 安全状态和风险提示必须明确可见
5. **Compatibility is practical** — 兼容策略以实际可安装、可运行优先

---

## 5. 核心功能

### 5.1 私有 Skill 仓库

集中管理 Skill，支持版本历史、元数据和可见性控制。

- 按组织/命名空间管理 Skill
- 每个 Skill 维护独立版本线
- 支持 public / private / internal 可见性级别
- 丰富的元数据：名称、描述、标签、作者、兼容 Runtime 列表

### 5.2 一条命令安装

通过 CLI 一条命令安装到本地目标环境。

```bash
skillvault install acme/db-debugger --target openclaw
skillvault install acme/release-helper --target claude --scope project
```

- 支持指定目标 Runtime（openclaw / claude）
- 支持指定安装范围（user / project）
- 自动解析最新可用版本
- 安装前校验 checksum

### 5.3 自托管部署

支持内网部署，也支持公网部署。

- Docker Compose 一键部署
- 支持 Kubernetes 部署
- 所有数据自主可控

### 5.4 安全扫描

在发布前校验 Skill 包结构，并标记高风险内容。

**上传阶段控制：**
- 解包沙箱
- 路径穿越防护
- 文件策略检查（禁止可执行文件等）
- 包大小限制
- 静态规则扫描（脚本、markdown 中的可疑内容）

**安装阶段控制：**
- checksum 校验
- 信任标签和风险警告
- 明确安装目标路径
- 按策略阻断安装

### 5.5 治理与审计

支持版本管理、审核状态、角色权限和审计日志。

- **版本状态机**：draft → pending_review → approved → published / rejected
- **角色权限**：owner / admin / developer / viewer
- **审计日志**：记录所有关键操作（上传、审核、发布、安装、删除）

### 5.6 Runtime 适配层

通过适配层支持 OpenClaw、Claude Code 等不同生态。

- 内部使用统一的 Canonical Package Model
- 安装时按目标 Runtime 进行格式转换
- MVP 支持 OpenClaw 和 Claude Code 两种适配器

---

## 6. 核心使用流程

### 6.1 发布流程

```
开发者上传 Skill 包（Web UI / CLI）
        │
        ▼
SkillVault 存储制品 + 创建版本记录
        │
        ▼
校验器检查结构、元数据、兼容性
        │
        ▼
扫描器标记可疑脚本和高风险模式
        │
        ▼
    ┌───┴───┐
    │       │
 自动发布  进入审核
    │       │
    ▼       ▼
  published  pending_review → approved → published
                           → rejected
```

### 6.2 安装流程

```
CLI 登录认证
    │
    ▼
搜索 Skill / 按命名空间+名称直接安装
    │
    ▼
SkillVault 解析版本与目标 Runtime
    │
    ▼
CLI 下载制品 + 校验 checksum
    │
    ▼
适配器安装 Skill 到正确的本地目录
```

### 6.3 CLI 命令一览

```bash
# 认证
skillvault login https://registry.example.com

# 搜索
skillvault search sql

# 安装
skillvault install acme/db-debugger --target openclaw

# 更新
skillvault update acme/release-helper

# 卸载
skillvault remove acme/release-helper --target claude

# 校验
skillvault verify acme/release-helper
```

---

## 7. Web 端功能模块

### 7.1 Skill Catalog（Skill 目录）

- Skill 列表展示（卡片/列表视图）
- 多维搜索与筛选（关键词、标签、Runtime、组织）
- Skill 详情页（描述、版本历史、安装命令、安全状态）

### 7.2 Skill 管理

- 上传 Skill 包（拖拽 / 选择文件）
- 编辑 Skill 元数据
- 版本管理（查看历史版本、设置 latest）
- 可见性配置（public / private / internal）

### 7.3 审核中心

- 待审核 Skill 列表
- 安全扫描结果查看
- 审核操作（approve / reject + 备注）
- 审核历史记录

### 7.4 组织管理

- 创建与管理组织
- 成员管理与角色分配
- 组织级别策略配置

### 7.5 用户中心

- 登录 / 注册
- 个人 API Token 管理
- 个人发布的 Skill 列表
- 安装历史

### 7.6 审计日志

- 按时间、操作类型、用户、Skill 筛选
- 操作详情查看
- 日志导出

### 7.7 系统设置（管理员）

- 全局安全策略配置
- 文件类型白名单 / 黑名单
- 包大小限制
- 扫描规则管理

---

## 8. MVP 范围

### 8.1 MVP 包含

| 模块 | 功能 |
|------|------|
| 认证 | 用户注册、登录、JWT Token |
| 组织 | 创建组织、成员管理、角色权限 |
| Skill 管理 | 元数据 CRUD、版本管理、包上传 |
| 安全 | 结构校验、基础安全扫描 |
| Web Catalog | Skill 浏览、搜索、详情展示 |
| CLI | login / search / install / update / remove / verify |
| 适配器 | OpenClaw 适配器、Claude Code 本地 Skill 适配器 |
| 审计 | 基础审计日志 |
| 部署 | Docker Compose 部署方案 |

### 8.2 MVP 不包含

- 完整在线 Skill 编辑器
- 复杂审批工作流
- Claude plugin marketplace 导出
- 深度分析能力
- 完整签名与供应链可信体系

---

## 9. 兼容性

### MVP 阶段

| Runtime | 支持程度 |
|---------|---------|
| OpenClaw | install-compatible |
| Claude Code | local skill install-compatible |

### 后续规划

- Claude plugin marketplace 导出
- 更多 Runtime 适配器
- 公私混合 Registry 模式

---

## 10. 产品路线图

### Phase 1 — 基础能力

- Registry 核心
- 上传与校验流程
- Web Catalog
- CLI 安装链路
- OpenClaw 适配器
- Claude 本地 Skill 适配器

### Phase 2 — 治理增强

- 审核工作流
- 更丰富的安全策略
- 审计日志 UI
- API Token 管理
- 搜索与筛选增强

### Phase 3 — 生态扩展

- Claude marketplace 导出
- 签名与供应链可信
- Skill 集合与 Bundle
- 使用分析
- 公私混合 Registry 模式

---

## 11. 成功指标

| 指标 | 说明 |
|------|------|
| Skill 上传量 | 注册的 Skill 总数及月增量 |
| 安装次数 | CLI 安装成功次数 |
| 活跃用户数 | 月活跃开发者数量 |
| 安装成功率 | 安装操作成功/失败比 |
| 安全拦截率 | 被安全扫描阻断的上传比例 |
| 平均安装耗时 | 从执行 install 到安装完成的耗时 |
