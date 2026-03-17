export interface UserInfo {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface Organization {
  id: number;
  name: string;
  display_name: string;
  description: string;
  avatar_url: string;
  created_by: number;
}

export interface OrgMember {
  id: number;
  org_id: number;
  user_id: number;
  role: string;
  username: string;
  email: string;
  created_at: string;
}

export interface Skill {
  id: number;
  org_name: string;
  name: string;
  display_name: string;
  description: string;
  tags: string[];
  visibility: string;
  runtimes: string[];
  latest_version: string;
  download_count: number;
}

export interface SkillVersion {
  id: number;
  skill_id: number;
  version: string;
  status: string;
  changelog: string;
  artifact_path: string;
  artifact_size: number;
  checksum_sha256: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_comment: string;
  published_at: string | null;
  created_by: number;
  created_at: string;
}

export interface ScanResult {
  id: number;
  version_id: number;
  scan_type: string;
  status: string;
  findings: Record<string, unknown>;
  scanned_at: string;
}

export interface APIToken {
  id: number;
  name: string;
  token_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  org_id: number | null;
  action: string;
  resource_type: string;
  resource_id: number;
  detail: Record<string, unknown>;
  ip: string;
  user_agent: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
