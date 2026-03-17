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
  version: string;
  status: string;
  changelog: string;
  artifact_size: number;
  checksum_sha256: string;
  created_at: string;
  published_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
