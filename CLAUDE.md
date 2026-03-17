# CLAUDE.md — SkillVault Developer Guide

## Project Overview

SkillVault is a self-hostable private Skill Registry for AI coding agents. It provides the control plane and distribution layer for reusable skills, supporting upload, management, review, discovery, and installation across environments like OpenClaw and Claude Code.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite + Ant Design 5 + TanStack Query + Zustand |
| Backend | Go + Kratos v2 (HTTP :8080, gRPC :9090) |
| Database | MySQL 8.0 |
| Cache/Queue | Redis 7.x |
| Object Storage | MinIO (S3-compatible) |
| CLI | Go + Cobra |
| DI | Wire (compile-time) |
| Deployment | Docker Compose / Kubernetes |

---

## Repository Structure

```
SkillVault/
├── apps/
│   ├── api/          # Kratos backend
│   │   ├── cmd/server/       # Entry point + Wire DI
│   │   ├── api/              # Protobuf definitions → generated HTTP/gRPC code
│   │   ├── internal/
│   │   │   ├── biz/          # Business logic (usecases)
│   │   │   ├── service/      # HTTP handlers
│   │   │   ├── data/         # MySQL/Redis/MinIO repos
│   │   │   ├── server/       # HTTP & gRPC registration
│   │   │   ├── middleware/   # Auth middleware
│   │   │   └── conf/         # Config structs
│   │   └── configs/config.yaml
│   ├── web/          # React frontend
│   │   └── src/
│   │       ├── api/          # Axios client & API wrappers (7 modules)
│   │       ├── components/   # Shared components (Layout, SkillCard, etc.)
│   │       ├── pages/        # Page components (10 pages)
│   │       ├── store/        # Zustand auth store
│   │       ├── routes/       # React Router v6 (lazy-loaded)
│   │       ├── types/        # TypeScript interfaces
│   │       └── mock/         # Mock API system
│   └── worker/       # Async scan worker
├── cli/skillvault/   # CLI tool (login/search/install/update/remove)
├── packages/
│   ├── canonical-model/  # Manifest struct
│   ├── validator/        # Manifest validation
│   ├── scanner/          # Scan rule engine
│   ├── adapter-openclaw/ # OpenClaw adapter stub
│   └── adapter-claude/   # Claude Code adapter stub
├── deploy/
│   ├── docker-compose/
│   └── kubernetes/
└── doc/
    ├── architecture.md   # System architecture & data flows
    ├── backend.md        # Backend technical reference
    ├── frontend.md       # Frontend technical reference
    ├── technical.md      # Full spec (DB schema, API table)
    └── product.md        # Product documentation
```

---

## Backend Architecture (Kratos DDD Layers)

**Layer flow — strictly one-way:**
```
api (proto → HTTP route) → service (handler) → biz (usecase) → data (repo)
```

### Layer Responsibilities

| Layer | File(s) | Responsibility |
|-------|---------|----------------|
| server | `internal/server/http.go` | Route registration (42 endpoints) |
| service | `internal/service/service.go` | Parameter binding, response formatting, error mapping |
| biz | `internal/biz/*.go` | Business rules, state machine, permission checks, audit logging |
| data | `internal/data/*.go` | GORM CRUD, Redis cache, MinIO storage |

### Key Usecases

| Usecase | File | Responsibility |
|---------|------|----------------|
| AuthUsecase | `biz/auth.go` | Register, login (bcrypt), JWT signing, refresh token |
| SkillUsecase | `biz/skill.go` | Skill CRUD, full-text search, visibility, download count |
| VersionUsecase | `biz/version.go` | Upload, state machine, MinIO storage, trigger scan |
| OrganizationUsecase | `biz/organization.go` | Org CRUD, member management, role validation |
| AuditUsecase | `biz/audit.go` | Write & query audit logs |
| TokenUsecase | `biz/token.go` | API token lifecycle (SHA256 hash, never store plaintext) |

### Version State Machine

```
draft → pending_review → approved → published
                    ↓
                 rejected → (resubmit) → draft
```

Valid transitions: `draft→pending_review`, `pending_review→approved`, `pending_review→rejected`, `approved→published`, `rejected→draft`

### RBAC

```go
roleHierarchy := map[string]int{"owner": 4, "admin": 3, "developer": 2, "viewer": 1}
// check: roleHierarchy[member.Role] >= roleHierarchy[required]
```

### Authentication Middleware (`internal/middleware/auth.go`)

1. Extract `Authorization: Bearer <token>`
2. Try JWT parse → inject userID + username to context
3. If JWT fails → try API token (SHA256 hash lookup in DB)
4. Public paths (register/login/refresh/healthz) → always allow

---

## Frontend Architecture

### API Client Pattern

All API calls go through `src/api/` modules. The Axios client in `src/api/client.ts`:
- Auto-attaches `Authorization: Bearer <token>` from Zustand store
- Unwraps `{ code, message, data }` response envelope
- On 401 → auto-logout

### State Management

- **Server state** (API data): TanStack Query (`useQuery`, `useMutation`)
- **Client state** (auth): Zustand store (`src/store/auth.ts`) persisted to localStorage

### Mock API

Enable mock mode for frontend development without a backend:
```bash
VITE_MOCK=true npm run dev
# or in browser console: localStorage.setItem('mock', '1')
```

---

## Database Schema (8 tables)

Core tables: `users`, `organizations`, `org_members`, `skills`, `skill_versions`, `scan_results`, `api_tokens`, `audit_logs`

Key relationships:
- User ↔ Organization: many-to-many via `org_members` (role: owner/admin/developer/viewer)
- Organization → Skill → SkillVersion → ScanResult
- All key operations → `audit_logs`

Full DDL and field details: see `doc/technical.md` section 4 and `doc/backend.md` section 4.

---

## Redis Key Patterns

| Key | TTL | Purpose |
|-----|-----|---------|
| `user:{id}` | 30min | User info cache |
| `skill:{id}` | 15min | Skill detail cache |
| `skill:list:{hash}` | 5min | Skill list query cache |
| `org:{id}` | 30min | Org info cache |
| `refresh:{token}` | 7d | Refresh token storage |
| `rate:api:{user_id}` | 1min | API rate limit counter |
| `rate:login:{ip}` | 15min | Login rate limit counter |
| `lock:skill:{org}:{name}` | 10s | Distributed lock for Skill creation |
| `queue:scan` | — | Scan task queue (Redis List) |
| `queue:scan:processing` | — | In-progress scan tasks (BRPOPLPUSH target) |

---

## API Conventions

- Base path: `/api/v1/`
- Auth: `Authorization: Bearer <jwt_token>` or `Bearer <api_token>` (CLI)
- Response format: `{ "code": 0, "message": "success", "data": {} }`
- Pagination: `?page=1&page_size=20` → `{ "items": [], "total": 100, "page": 1, "page_size": 20 }`
- Path params: `{org}` = org namespace (string), `{name}` = skill name (string), not numeric IDs

HTTP status semantics: 400 bad params, 401 unauthenticated, 403 forbidden, 404 not found, 409 state conflict, 429 rate limited

Full endpoint table: see `doc/technical.md` section 6 and `doc/backend.md` section 5.

---

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| Web (React) | 3000 | Frontend |
| API (HTTP) | 8080 | REST API |
| API (gRPC) | 9090 | gRPC interface |
| MySQL | 3306 | Database |
| Redis | 6379 | Cache & queue |
| MinIO | 9000 | Artifact storage (S3 API) |
| MinIO Console | 9001 | MinIO web UI |

---

## Development Commands

```bash
# Start infrastructure
docker compose -f deploy/docker-compose/docker-compose.yaml up -d

# Init environment
cp .env.example .env

# Run database migrations
make migrate

# Start all app services
make dev

# Frontend only (with mock API)
cd apps/web && VITE_MOCK=true npm run dev

# Backend only
cd apps/api && go run cmd/server/main.go

# Regenerate Wire DI
cd apps/api && wire ./cmd/server/
```

---

## Code Conventions

### Backend

- Follow Kratos layering strictly: **never call data layer directly from service layer**
- Define business errors in `biz/` layer, map to HTTP status in `service/` layer
- All key mutations must write to `audit_logs` in the same transaction
- Cache strategy: **write DB first, then delete cache** (never cache-then-write)
- Use `log.Infof/Errorf` (Kratos log), not `fmt.Printf`
- Sensitive config (JWT secret, passwords) must come from env vars, never hardcoded

### Frontend

- All API calls through `src/api/` modules — no direct axios calls in components
- Server state (API data) → TanStack Query; client state (auth) → Zustand
- Functional components + hooks only, no class components
- Types in `src/types/index.ts`
- Routes use `React.lazy()` for code splitting

### Git

- Branches: `main` / `feature/*` / `fix/*` / `release/*`
- Commit format: `type(scope): description`
  - type: `feat` / `fix` / `docs` / `refactor` / `test` / `chore`
  - scope: `api` / `web` / `cli` / `worker` / `deploy`

---

## Documentation

| File | Contents |
|------|----------|
| `doc/architecture.md` | System architecture, data flows, deployment, ADRs |
| `doc/backend.md` | Backend layers, models, routes, auth, Redis, Worker |
| `doc/frontend.md` | React components, pages, state, routing, mock system |
| `doc/technical.md` | Full spec: DB DDL, complete API table, config reference |
| `doc/product.md` | Product positioning, user roles, roadmap |
