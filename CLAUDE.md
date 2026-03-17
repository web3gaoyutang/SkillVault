# CLAUDE.md — SkillVault Project Guide

## Project Overview

SkillVault is a self-hostable private Skill Registry for AI coding agents. It provides the control plane and distribution layer for reusable skills, supporting upload, management, review, discovery, and installation across environments like OpenClaw and Claude Code.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Ant Design 5 + React Query + React Router v6
- **Backend**: Go + Kratos v2 (gRPC + HTTP dual protocol)
- **Database**: MySQL 8.0
- **Cache/Queue**: Redis 7.x (caching, session, rate limiting, scan task queue)
- **Object Storage**: MinIO (S3-compatible, for skill package artifacts)
- **CLI**: Go
- **Deployment**: Docker Compose / Kubernetes

## Repository Structure

```
skillvault/
├── apps/
│   ├── web/          # React frontend (Vite + Ant Design)
│   ├── api/          # Kratos backend (HTTP :8080, gRPC :9090)
│   └── worker/       # Scan worker (async security scanning)
├── cli/
│   └── skillvault/   # CLI tool (Go)
├── packages/
│   ├── adapter-openclaw/
│   ├── adapter-claude/
│   ├── validator/
│   ├── scanner/
│   └── canonical-model/
├── deploy/
│   ├── docker-compose/
│   └── kubernetes/
├── doc/
│   ├── product.md    # Product documentation
│   └── technical.md  # Technical documentation
└── README.md
```

## Backend Architecture (Kratos)

Follows Kratos DDD layered structure:

```
apps/api/
├── cmd/server/        # Entry point + Wire DI
├── api/               # Protobuf definitions → generated HTTP/gRPC code
│   ├── auth/v1/
│   ├── skill/v1/
│   ├── organization/v1/
│   ├── version/v1/
│   └── audit/v1/
├── internal/
│   ├── conf/          # Config (proto-generated)
│   ├── server/        # HTTP & gRPC server registration
│   ├── service/       # Service layer (API handler → biz)
│   ├── biz/           # Business logic layer
│   └── data/          # Data access layer (MySQL + Redis)
└── configs/config.yaml
```

**Layer flow**: `api (proto) → service → biz → data`

- Use **Wire** for dependency injection
- Use **GORM** as ORM
- Use **Kratos errors** for error codes
- Use **Kratos log** for logging

## Frontend Architecture (React)

```
apps/web/src/
├── api/          # Axios client & API request wrappers
├── components/   # Shared components (Layout, SkillCard, SearchBar, etc.)
├── pages/        # Page components (Catalog, SkillDetail, Organization, etc.)
├── hooks/        # Custom hooks
├── store/        # Global state (Zustand / Redux Toolkit)
├── utils/        # Utilities
├── types/        # TypeScript type definitions
└── routes/       # Route config (lazy-loaded)
```

## Database (MySQL)

Core tables: `users`, `organizations`, `org_members`, `skills`, `skill_versions`, `scan_results`, `api_tokens`, `audit_logs`

Key relationships:
- User belongs to Organization (via org_members with role: owner/admin/developer/viewer)
- Organization has many Skills
- Skill has many SkillVersions
- SkillVersion has ScanResults
- All key operations log to audit_logs

Full DDL available in `doc/technical.md` section 4.

## Redis Usage

| Purpose | Key Pattern | TTL |
|---------|------------|-----|
| User cache | `user:{id}` | 30min |
| Skill cache | `skill:{id}` | 15min |
| Session | `session:{token}` | 24h |
| Refresh token | `refresh:{token}` | 7d |
| API rate limit | `rate:api:{user_id}` | 1min |
| Login rate limit | `rate:login:{ip}` | 15min |
| Scan task queue | `queue:scan` | - |
| Distributed lock | `lock:skill:{org}:{name}` | 10s |

## API Conventions

- Base path: `/api/v1/`
- Auth: `Authorization: Bearer <jwt_token>` or `Bearer <api_token>` (CLI)
- Response format: `{ "code": 0, "message": "success", "data": {} }`
- Pagination: `?page=1&page_size=20` → `{ "items": [], "total": 100, "page": 1, "page_size": 20 }`
- Key endpoints: auth, organizations, skills, versions, scan, audit-logs, tokens

Full API table in `doc/technical.md` section 6.

## Authentication & RBAC

- JWT-based: Access Token (2h) + Refresh Token (7d)
- API Token supported for CLI/automation
- Roles per organization: **owner** > **admin** > **developer** > **viewer**
- Auth middleware: Kratos middleware extracts token, validates, injects user into context

## Core Business Flows

**Publish**: Upload → Store artifact (MinIO) → Create version (draft) → Async scan (Redis queue → Worker) → Review → Publish

**Install (CLI)**: Login → Search/Resolve → Download + checksum verify → Runtime adapter installs to local path

**Version states**: `draft → pending_review → approved → published` or `→ rejected`

## Development Commands

```bash
docker compose up -d          # Start infrastructure (MySQL, Redis, MinIO)
cp .env.example .env          # Initialize environment
make migrate                  # Run database migrations
make dev                      # Start app services
```

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| Web (React) | 3000 | Frontend |
| API (HTTP) | 8080 | REST API |
| API (gRPC) | 9090 | gRPC interface |
| MySQL | 3306 | Database |
| Redis | 6379 | Cache & queue |
| MinIO | 9000/9001 | Object storage / console |

## Git Conventions

- Branches: `main` / `feature/*` / `fix/*` / `release/*`
- Commit format: `type(scope): description`
  - type: feat / fix / docs / refactor / test / chore
  - scope: api / web / cli / worker / deploy

## Key Design Decisions

- **Canonical Package Model**: Internal unified model, adapted per runtime on install
- **Scan Worker**: Separate process consuming Redis queue, not blocking API
- **MinIO for artifacts**: Immutable package storage, S3-compatible
- **Private by default**: All skills are private unless explicitly set otherwise
- **No MQ in MVP**: Redis List-based queue is sufficient for scan tasks
