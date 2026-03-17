# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Project scaffold** — full monorepo skeleton established
  - Root: `go.work` (Go workspace), `Makefile`, `.env.example`, `.gitignore`
  - Infrastructure: Docker Compose with MySQL 8.0, Redis 7, MinIO
  - Database: `init.sql` with 8 core tables (`users`, `organizations`, `org_members`, `skills`, `skill_versions`, `scan_results`, `api_tokens`, `audit_logs`)
- **Backend API** (`apps/api/`) — Go + Kratos v2
  - Kratos application entry point with Wire DI
  - HTTP server (`:8080`) and gRPC server (`:9090`)
  - DDD layered architecture: `conf` → `server` → `service` → `biz` → `data`
  - JWT authentication middleware skeleton
  - Config management via YAML
  - 5 Protobuf service definitions: Auth, Skill, Organization, Version, Audit
  - Data layer with MySQL (GORM), Redis, MinIO client initialization
  - Core domain entities and repository interfaces
- **Frontend Web** (`apps/web/`) — React 18 + TypeScript + Vite + Ant Design 5
  - Vite dev server with API proxy to backend
  - React Router v6 with lazy-loaded routes
  - React Query (TanStack Query) for server state
  - Zustand auth store with localStorage persistence
  - Axios client with JWT interceptor and 401 redirect
  - API modules: auth, skill, organization, version
  - Layout component with sidebar navigation and user dropdown
  - Page skeletons: Login, Register, Catalog, SkillDetail, Organization, Profile
  - TypeScript type definitions for all domain models
- **Scan Worker** (`apps/worker/`) — Go
  - Redis BRPOPLPUSH consumer loop
  - Scanner interface with pluggable rules
  - Default rules: manifest check, path traversal, file policy, dangerous patterns
- **CLI** (`cli/skillvault/`) — Go + Cobra
  - Root command with `--server` flag
  - Subcommands: `login`, `search`, `install` (with `--target` and `--scope`), `version`
- **Shared packages** (`packages/`)
  - `canonical-model` — Manifest and File type definitions
  - `validator` — Manifest validation interface and implementation
  - `scanner` — Scan rule interface and Finding types
  - `adapter-openclaw` — OpenClaw runtime adapter interface
  - `adapter-claude` — Claude Code runtime adapter interface (project/user scope)
- **Documentation**
  - `README.md` — project overview
  - `CLAUDE.md` — development guide for AI agents
  - `doc/product.md` — product documentation
  - `doc/technical.md` — technical documentation
