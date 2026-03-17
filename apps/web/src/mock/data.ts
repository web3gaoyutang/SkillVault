import type {
  UserInfo,
  Organization,
  OrgMember,
  Skill,
  SkillVersion,
  ScanResult,
  APIToken,
  AuditLog,
} from '../types';

// --- Users ---

export const mockCurrentUser: UserInfo = {
  id: 1,
  username: 'alex_chen',
  email: 'alex.chen@example.com',
  display_name: 'Alex Chen',
  avatar_url: '',
};

// --- Organizations ---

export const mockOrganizations: Organization[] = [
  {
    id: 1,
    name: 'acme-ai',
    display_name: 'ACME AI Labs',
    description: 'Building next-generation AI developer tools and reusable skills for coding agents.',
    avatar_url: '',
    created_by: 1,
  },
  {
    id: 2,
    name: 'devtools-inc',
    display_name: 'DevTools Inc.',
    description: 'Open-source developer productivity tools and automation skills.',
    avatar_url: '',
    created_by: 1,
  },
  {
    id: 3,
    name: 'cloud-ops',
    display_name: 'CloudOps Team',
    description: 'Cloud infrastructure automation and DevOps skills for AI agents.',
    avatar_url: '',
    created_by: 2,
  },
];

// --- Organization Members ---

export const mockOrgMembers: Record<string, OrgMember[]> = {
  'acme-ai': [
    { id: 1, org_id: 1, user_id: 1, role: 'owner', username: 'alex_chen', email: 'alex.chen@example.com', created_at: '2026-01-15T08:00:00Z' },
    { id: 2, org_id: 1, user_id: 2, role: 'admin', username: 'sarah_kim', email: 'sarah.kim@example.com', created_at: '2026-01-20T10:30:00Z' },
    { id: 3, org_id: 1, user_id: 3, role: 'developer', username: 'mike_zhang', email: 'mike.zhang@example.com', created_at: '2026-02-01T14:00:00Z' },
    { id: 4, org_id: 1, user_id: 4, role: 'viewer', username: 'lisa_wang', email: 'lisa.wang@example.com', created_at: '2026-02-15T09:00:00Z' },
  ],
  'devtools-inc': [
    { id: 5, org_id: 2, user_id: 1, role: 'owner', username: 'alex_chen', email: 'alex.chen@example.com', created_at: '2026-02-01T08:00:00Z' },
    { id: 6, org_id: 2, user_id: 5, role: 'developer', username: 'james_li', email: 'james.li@example.com', created_at: '2026-02-10T11:00:00Z' },
  ],
  'cloud-ops': [
    { id: 7, org_id: 3, user_id: 2, role: 'owner', username: 'sarah_kim', email: 'sarah.kim@example.com', created_at: '2026-01-10T08:00:00Z' },
    { id: 8, org_id: 3, user_id: 1, role: 'developer', username: 'alex_chen', email: 'alex.chen@example.com', created_at: '2026-02-05T10:00:00Z' },
  ],
};

// --- Skills ---

export const mockSkills: Skill[] = [
  {
    id: 1,
    org_name: 'acme-ai',
    name: 'code-reviewer',
    display_name: 'Code Reviewer',
    description: 'Automated code review skill that analyzes pull requests for best practices, potential bugs, and style consistency across multiple languages.',
    tags: ['code-quality', 'review', 'best-practices'],
    visibility: 'public',
    runtimes: ['claude', 'openclaw'],
    latest_version: '2.1.0',
    download_count: 1842,
  },
  {
    id: 2,
    org_name: 'acme-ai',
    name: 'test-generator',
    display_name: 'Test Generator',
    description: 'Generates comprehensive unit and integration tests based on source code analysis. Supports Jest, Pytest, Go testing, and more.',
    tags: ['testing', 'automation', 'code-quality'],
    visibility: 'public',
    runtimes: ['claude', 'openclaw'],
    latest_version: '1.4.2',
    download_count: 956,
  },
  {
    id: 3,
    org_name: 'acme-ai',
    name: 'db-migrator',
    display_name: 'Database Migrator',
    description: 'Generates and validates database migration scripts. Supports MySQL, PostgreSQL, and SQLite with schema diff detection.',
    tags: ['database', 'migration', 'devops'],
    visibility: 'private',
    runtimes: ['claude'],
    latest_version: '1.0.3',
    download_count: 327,
  },
  {
    id: 4,
    org_name: 'devtools-inc',
    name: 'api-scaffolder',
    display_name: 'API Scaffolder',
    description: 'Scaffolds REST and gRPC API endpoints from OpenAPI or protobuf definitions. Generates handlers, models, and tests.',
    tags: ['api', 'scaffolding', 'code-generation'],
    visibility: 'public',
    runtimes: ['openclaw', 'claude'],
    latest_version: '3.0.1',
    download_count: 2105,
  },
  {
    id: 5,
    org_name: 'devtools-inc',
    name: 'doc-writer',
    display_name: 'Documentation Writer',
    description: 'Automatically generates and maintains API documentation, README files, and inline code comments from source code.',
    tags: ['documentation', 'markdown', 'automation'],
    visibility: 'public',
    runtimes: ['claude'],
    latest_version: '1.2.0',
    download_count: 743,
  },
  {
    id: 6,
    org_name: 'cloud-ops',
    name: 'k8s-deployer',
    display_name: 'Kubernetes Deployer',
    description: 'Generates and manages Kubernetes manifests, Helm charts, and deployment configurations with best practices.',
    tags: ['kubernetes', 'devops', 'deployment'],
    visibility: 'private',
    runtimes: ['openclaw'],
    latest_version: '2.0.0',
    download_count: 489,
  },
  {
    id: 7,
    org_name: 'cloud-ops',
    name: 'security-scanner',
    display_name: 'Security Scanner',
    description: 'Scans codebases for common security vulnerabilities including OWASP Top 10, dependency CVEs, and secret leaks.',
    tags: ['security', 'scanning', 'vulnerability'],
    visibility: 'public',
    runtimes: ['claude', 'openclaw'],
    latest_version: '1.5.1',
    download_count: 1203,
  },
  {
    id: 8,
    org_name: 'acme-ai',
    name: 'refactor-assist',
    display_name: 'Refactor Assistant',
    description: 'Suggests and applies code refactoring patterns to improve readability, performance, and maintainability.',
    tags: ['refactoring', 'code-quality', 'best-practices'],
    visibility: 'public',
    runtimes: ['claude'],
    latest_version: '1.1.0',
    download_count: 612,
  },
  {
    id: 9,
    org_name: 'devtools-inc',
    name: 'ci-pipeline',
    display_name: 'CI Pipeline Generator',
    description: 'Creates CI/CD pipeline configurations for GitHub Actions, GitLab CI, and Jenkins from project analysis.',
    tags: ['ci-cd', 'devops', 'automation'],
    visibility: 'public',
    runtimes: ['openclaw', 'claude'],
    latest_version: '',
    download_count: 0,
  },
  {
    id: 10,
    org_name: 'cloud-ops',
    name: 'terraform-gen',
    display_name: 'Terraform Generator',
    description: 'Generates Terraform configurations for AWS, GCP, and Azure infrastructure from natural language descriptions.',
    tags: ['terraform', 'infrastructure', 'cloud'],
    visibility: 'private',
    runtimes: ['claude'],
    latest_version: '0.9.0',
    download_count: 178,
  },
];

// --- Skill Versions ---

export const mockVersions: Record<string, SkillVersion[]> = {
  'acme-ai/code-reviewer': [
    {
      id: 1, skill_id: 1, version: '2.1.0', status: 'published', changelog: 'Added support for Rust and Kotlin code review. Improved suggestion accuracy.',
      artifact_path: 'acme-ai/code-reviewer/2.1.0.tar.gz', artifact_size: 245760, checksum_sha256: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      reviewed_by: 2, reviewed_at: '2026-03-10T14:30:00Z', review_comment: 'Excellent improvements to language support.', published_at: '2026-03-10T15:00:00Z',
      created_by: 3, created_at: '2026-03-08T09:00:00Z',
    },
    {
      id: 2, skill_id: 1, version: '2.0.0', status: 'published', changelog: 'Major rewrite with multi-language support. Breaking changes to configuration format.',
      artifact_path: 'acme-ai/code-reviewer/2.0.0.tar.gz', artifact_size: 230400, checksum_sha256: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      reviewed_by: 2, reviewed_at: '2026-02-20T11:00:00Z', review_comment: 'Good work on the rewrite.', published_at: '2026-02-20T11:30:00Z',
      created_by: 1, created_at: '2026-02-15T10:00:00Z',
    },
    {
      id: 3, skill_id: 1, version: '1.0.0', status: 'published', changelog: 'Initial release with JavaScript/TypeScript/Python support.',
      artifact_path: 'acme-ai/code-reviewer/1.0.0.tar.gz', artifact_size: 153600, checksum_sha256: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
      reviewed_by: 2, reviewed_at: '2026-01-20T10:00:00Z', review_comment: 'Approved.', published_at: '2026-01-20T10:30:00Z',
      created_by: 1, created_at: '2026-01-18T08:00:00Z',
    },
  ],
  'acme-ai/test-generator': [
    {
      id: 4, skill_id: 2, version: '1.4.2', status: 'published', changelog: 'Fixed edge case in Go test generation.',
      artifact_path: 'acme-ai/test-generator/1.4.2.tar.gz', artifact_size: 189440, checksum_sha256: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      reviewed_by: 1, reviewed_at: '2026-03-05T09:00:00Z', review_comment: 'Patch looks good.', published_at: '2026-03-05T09:30:00Z',
      created_by: 3, created_at: '2026-03-04T16:00:00Z',
    },
    {
      id: 5, skill_id: 2, version: '1.5.0', status: 'pending_review', changelog: 'Added integration test generation and mock factory support.',
      artifact_path: 'acme-ai/test-generator/1.5.0.tar.gz', artifact_size: 204800, checksum_sha256: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
      reviewed_by: null, reviewed_at: null, review_comment: '', published_at: null,
      created_by: 3, created_at: '2026-03-15T11:00:00Z',
    },
  ],
  'acme-ai/db-migrator': [
    {
      id: 6, skill_id: 3, version: '1.0.3', status: 'published', changelog: 'Added SQLite migration support.',
      artifact_path: 'acme-ai/db-migrator/1.0.3.tar.gz', artifact_size: 122880, checksum_sha256: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
      reviewed_by: 2, reviewed_at: '2026-03-01T13:00:00Z', review_comment: 'LGTM', published_at: '2026-03-01T13:30:00Z',
      created_by: 1, created_at: '2026-02-28T15:00:00Z',
    },
  ],
  'devtools-inc/api-scaffolder': [
    {
      id: 7, skill_id: 4, version: '3.0.1', status: 'published', changelog: 'Fixed gRPC stub generation for nested message types.',
      artifact_path: 'devtools-inc/api-scaffolder/3.0.1.tar.gz', artifact_size: 307200, checksum_sha256: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
      reviewed_by: 1, reviewed_at: '2026-03-12T10:00:00Z', review_comment: 'Good fix.', published_at: '2026-03-12T10:30:00Z',
      created_by: 5, created_at: '2026-03-11T14:00:00Z',
    },
    {
      id: 8, skill_id: 4, version: '3.1.0', status: 'draft', changelog: 'WIP: Adding GraphQL schema scaffolding support.',
      artifact_path: 'devtools-inc/api-scaffolder/3.1.0.tar.gz', artifact_size: 327680, checksum_sha256: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
      reviewed_by: null, reviewed_at: null, review_comment: '', published_at: null,
      created_by: 5, created_at: '2026-03-16T09:00:00Z',
    },
  ],
  'devtools-inc/doc-writer': [
    {
      id: 9, skill_id: 5, version: '1.2.0', status: 'published', changelog: 'Improved Markdown formatting and added JSDoc support.',
      artifact_path: 'devtools-inc/doc-writer/1.2.0.tar.gz', artifact_size: 163840, checksum_sha256: 'c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
      reviewed_by: 1, reviewed_at: '2026-03-08T16:00:00Z', review_comment: 'Nice improvements.', published_at: '2026-03-08T16:30:00Z',
      created_by: 5, created_at: '2026-03-07T10:00:00Z',
    },
  ],
  'cloud-ops/k8s-deployer': [
    {
      id: 10, skill_id: 6, version: '2.0.0', status: 'published', changelog: 'Added Helm chart generation and Kustomize support.',
      artifact_path: 'cloud-ops/k8s-deployer/2.0.0.tar.gz', artifact_size: 276480, checksum_sha256: 'd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
      reviewed_by: 2, reviewed_at: '2026-02-25T09:00:00Z', review_comment: 'Great additions.', published_at: '2026-02-25T09:30:00Z',
      created_by: 1, created_at: '2026-02-22T14:00:00Z',
    },
  ],
  'cloud-ops/security-scanner': [
    {
      id: 11, skill_id: 7, version: '1.5.1', status: 'published', changelog: 'Updated CVE database and added Go module vulnerability scanning.',
      artifact_path: 'cloud-ops/security-scanner/1.5.1.tar.gz', artifact_size: 358400, checksum_sha256: 'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
      reviewed_by: 2, reviewed_at: '2026-03-14T11:00:00Z', review_comment: 'Important security update.', published_at: '2026-03-14T11:30:00Z',
      created_by: 1, created_at: '2026-03-13T10:00:00Z',
    },
    {
      id: 12, skill_id: 7, version: '1.6.0', status: 'pending_review', changelog: 'Added SAST (static application security testing) engine for Python and Java.',
      artifact_path: 'cloud-ops/security-scanner/1.6.0.tar.gz', artifact_size: 389120, checksum_sha256: 'f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3',
      reviewed_by: null, reviewed_at: null, review_comment: '', published_at: null,
      created_by: 1, created_at: '2026-03-16T15:00:00Z',
    },
  ],
  'acme-ai/refactor-assist': [
    {
      id: 13, skill_id: 8, version: '1.1.0', status: 'published', changelog: 'Added extract-method and inline-variable refactoring patterns.',
      artifact_path: 'acme-ai/refactor-assist/1.1.0.tar.gz', artifact_size: 143360, checksum_sha256: 'a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4',
      reviewed_by: 2, reviewed_at: '2026-03-06T10:00:00Z', review_comment: 'Useful patterns.', published_at: '2026-03-06T10:30:00Z',
      created_by: 1, created_at: '2026-03-05T08:00:00Z',
    },
  ],
  'devtools-inc/ci-pipeline': [
    {
      id: 14, skill_id: 9, version: '0.1.0', status: 'draft', changelog: 'Initial draft — GitHub Actions support only.',
      artifact_path: 'devtools-inc/ci-pipeline/0.1.0.tar.gz', artifact_size: 92160, checksum_sha256: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
      reviewed_by: null, reviewed_at: null, review_comment: '', published_at: null,
      created_by: 5, created_at: '2026-03-17T08:00:00Z',
    },
  ],
  'cloud-ops/terraform-gen': [
    {
      id: 15, skill_id: 10, version: '0.9.0', status: 'published', changelog: 'Beta release with AWS module generation.',
      artifact_path: 'cloud-ops/terraform-gen/0.9.0.tar.gz', artifact_size: 204800, checksum_sha256: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      reviewed_by: 2, reviewed_at: '2026-03-02T14:00:00Z', review_comment: 'Good beta.', published_at: '2026-03-02T14:30:00Z',
      created_by: 1, created_at: '2026-03-01T10:00:00Z',
    },
  ],
};

// --- Scan Results ---

export const mockScanResults: Record<string, ScanResult[]> = {
  'acme-ai/code-reviewer/2.1.0': [
    { id: 1, version_id: 1, scan_type: 'structure', status: 'passed', findings: { valid_manifest: true, file_count: 12 }, scanned_at: '2026-03-08T09:05:00Z' },
    { id: 2, version_id: 1, scan_type: 'security', status: 'passed', findings: { no_secrets: true, no_eval: true }, scanned_at: '2026-03-08T09:06:00Z' },
    { id: 3, version_id: 1, scan_type: 'metadata', status: 'passed', findings: { has_readme: true, has_license: true }, scanned_at: '2026-03-08T09:06:30Z' },
  ],
  'acme-ai/test-generator/1.5.0': [
    { id: 4, version_id: 5, scan_type: 'structure', status: 'passed', findings: { valid_manifest: true, file_count: 18 }, scanned_at: '2026-03-15T11:05:00Z' },
    { id: 5, version_id: 5, scan_type: 'security', status: 'warning', findings: { no_secrets: true, no_eval: false, details: 'Dynamic code execution found in test runner' }, scanned_at: '2026-03-15T11:06:00Z' },
    { id: 6, version_id: 5, scan_type: 'metadata', status: 'passed', findings: { has_readme: true, has_license: true }, scanned_at: '2026-03-15T11:06:30Z' },
  ],
  'cloud-ops/security-scanner/1.6.0': [
    { id: 7, version_id: 12, scan_type: 'structure', status: 'passed', findings: { valid_manifest: true, file_count: 25 }, scanned_at: '2026-03-16T15:05:00Z' },
    { id: 8, version_id: 12, scan_type: 'security', status: 'passed', findings: { no_secrets: true, no_eval: true }, scanned_at: '2026-03-16T15:06:00Z' },
    { id: 9, version_id: 12, scan_type: 'metadata', status: 'passed', findings: { has_readme: true, has_license: true }, scanned_at: '2026-03-16T15:06:30Z' },
  ],
};

// --- API Tokens ---

export const mockTokens: APIToken[] = [
  { id: 1, name: 'CI/CD Pipeline', token_prefix: 'svt_a1b2c3d4', scopes: ['read', 'write'], last_used_at: '2026-03-17T06:30:00Z', expires_at: null, created_at: '2026-02-01T10:00:00Z' },
  { id: 2, name: 'Local Dev CLI', token_prefix: 'svt_e5f6g7h8', scopes: ['read'], last_used_at: '2026-03-16T18:45:00Z', expires_at: '2026-06-01T00:00:00Z', created_at: '2026-03-01T08:00:00Z' },
  { id: 3, name: 'Staging Deploy', token_prefix: 'svt_i9j0k1l2', scopes: ['read', 'write', 'admin'], last_used_at: null, expires_at: null, created_at: '2026-03-10T14:00:00Z' },
];

// --- Audit Logs ---

export const mockAuditLogs: AuditLog[] = [
  { id: 1, user_id: 1, org_id: 1, action: 'create', resource_type: 'skill', resource_id: 1, detail: { name: 'code-reviewer' }, ip: '192.168.1.10', user_agent: 'Mozilla/5.0', created_at: '2026-01-18T08:00:00Z' },
  { id: 2, user_id: 1, org_id: 1, action: 'publish', resource_type: 'version', resource_id: 3, detail: { skill: 'code-reviewer', version: '1.0.0' }, ip: '192.168.1.10', user_agent: 'Mozilla/5.0', created_at: '2026-01-20T10:30:00Z' },
  { id: 3, user_id: 2, org_id: 1, action: 'review', resource_type: 'version', resource_id: 2, detail: { skill: 'code-reviewer', version: '2.0.0', action: 'approve' }, ip: '10.0.0.5', user_agent: 'Mozilla/5.0', created_at: '2026-02-20T11:00:00Z' },
  { id: 4, user_id: 1, org_id: 2, action: 'create', resource_type: 'org', resource_id: 2, detail: { name: 'devtools-inc' }, ip: '192.168.1.10', user_agent: 'Mozilla/5.0', created_at: '2026-02-01T08:00:00Z' },
  { id: 5, user_id: 5, org_id: 2, action: 'create', resource_type: 'skill', resource_id: 4, detail: { name: 'api-scaffolder' }, ip: '172.16.0.20', user_agent: 'skillvault-cli/1.0', created_at: '2026-02-15T14:00:00Z' },
  { id: 6, user_id: 1, org_id: 3, action: 'create', resource_type: 'skill', resource_id: 7, detail: { name: 'security-scanner' }, ip: '192.168.1.10', user_agent: 'Mozilla/5.0', created_at: '2026-02-28T10:00:00Z' },
  { id: 7, user_id: 3, org_id: 1, action: 'create', resource_type: 'version', resource_id: 5, detail: { skill: 'test-generator', version: '1.5.0' }, ip: '10.0.0.15', user_agent: 'skillvault-cli/1.0', created_at: '2026-03-15T11:00:00Z' },
  { id: 8, user_id: 1, org_id: 1, action: 'update', resource_type: 'skill', resource_id: 8, detail: { field: 'tags', old: ['refactoring'], new: ['refactoring', 'code-quality', 'best-practices'] }, ip: '192.168.1.10', user_agent: 'Mozilla/5.0', created_at: '2026-03-05T09:00:00Z' },
  { id: 9, user_id: 2, org_id: 3, action: 'publish', resource_type: 'version', resource_id: 11, detail: { skill: 'security-scanner', version: '1.5.1' }, ip: '10.0.0.5', user_agent: 'Mozilla/5.0', created_at: '2026-03-14T11:30:00Z' },
  { id: 10, user_id: 1, org_id: null, action: 'login', resource_type: 'user', resource_id: 1, detail: { method: 'password' }, ip: '192.168.1.10', user_agent: 'Mozilla/5.0', created_at: '2026-03-17T08:00:00Z' },
  { id: 11, user_id: 1, org_id: 1, action: 'create', resource_type: 'version', resource_id: 1, detail: { skill: 'code-reviewer', version: '2.1.0' }, ip: '192.168.1.10', user_agent: 'Mozilla/5.0', created_at: '2026-03-08T09:00:00Z' },
  { id: 12, user_id: 1, org_id: 3, action: 'create', resource_type: 'version', resource_id: 12, detail: { skill: 'security-scanner', version: '1.6.0' }, ip: '192.168.1.10', user_agent: 'skillvault-cli/1.0', created_at: '2026-03-16T15:00:00Z' },
];

// --- Pending Reviews (enriched versions) ---

export const mockPendingReviews = [
  {
    ...mockVersions['acme-ai/test-generator'][1],
    skill_name: 'test-generator',
    org_name: 'acme-ai',
  },
  {
    ...mockVersions['cloud-ops/security-scanner'][1],
    skill_name: 'security-scanner',
    org_name: 'cloud-ops',
  },
];
