/**
 * Mock API handlers for SkillVault frontend.
 *
 * Enabled when:
 *   - Vite env: VITE_MOCK=true
 *   - Or: localStorage.getItem('mock') === 'true'
 *
 * Toggle at runtime:  localStorage.setItem('mock', 'true') then reload.
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  mockCurrentUser,
  mockOrganizations,
  mockOrgMembers,
  mockSkills,
  mockVersions,
  mockScanResults,
  mockTokens,
  mockAuditLogs,
  mockPendingReviews,
} from './data';

export function isMockEnabled(): boolean {
  // Vite env variable check
  try {
    if (import.meta.env.VITE_MOCK === 'true') return true;
  } catch {
    // ignore
  }
  // Runtime toggle via localStorage
  return localStorage.getItem('mock') === 'true';
}

// Simulate async delay
function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Wrap data in the API envelope format {code, message, data}
function ok(data: unknown) {
  return { code: 0, message: 'success', data };
}

let nextTokenId = mockTokens.length + 1;

type RouteHandler = (params: {
  pathParts: string[];
  query: Record<string, string>;
  body: unknown;
  method: string;
  url: string;
}) => unknown | null;

/**
 * Match URL path with template like '/skills/{org}/{name}'.
 * Returns extracted params or null if no match.
 */
function matchPath(
  urlPath: string,
  template: string,
): Record<string, string> | null {
  const urlParts = urlPath.split('/').filter(Boolean);
  const tmplParts = template.split('/').filter(Boolean);
  if (urlParts.length !== tmplParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < tmplParts.length; i++) {
    if (tmplParts[i].startsWith('{') && tmplParts[i].endsWith('}')) {
      params[tmplParts[i].slice(1, -1)] = urlParts[i];
    } else if (tmplParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}

function parseQuery(url: string): Record<string, string> {
  const q: Record<string, string> = {};
  const idx = url.indexOf('?');
  if (idx < 0) return q;
  const search = url.slice(idx + 1);
  for (const pair of search.split('&')) {
    const [k, v] = pair.split('=');
    if (k) q[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return q;
}

function getUrlPath(url: string): string {
  // Remove baseURL prefix (/api/v1) if present, and query string
  let path = url.split('?')[0];
  if (path.startsWith('/api/v1')) path = path.slice(7);
  return path;
}

function handleMockRequest(method: string, url: string, body: unknown): unknown | undefined {
  const path = getUrlPath(url);
  const query = parseQuery(url);
  const m = method.toUpperCase();

  // --- Auth ---
  if (m === 'POST' && path === '/auth/login') {
    return ok({
      access_token: 'mock_access_token_' + Date.now(),
      refresh_token: 'mock_refresh_token_' + Date.now(),
      expires_in: 7200,
    });
  }
  if (m === 'POST' && path === '/auth/register') {
    return ok({ id: 99 });
  }
  if (m === 'POST' && path === '/auth/refresh') {
    return ok({
      access_token: 'mock_access_token_refreshed_' + Date.now(),
      refresh_token: 'mock_refresh_token_refreshed_' + Date.now(),
      expires_in: 7200,
    });
  }
  if (m === 'POST' && path === '/auth/logout') {
    return ok(null);
  }
  if (m === 'GET' && path === '/auth/me') {
    return ok(mockCurrentUser);
  }

  // --- Organizations ---
  if (m === 'GET' && path === '/organizations') {
    return ok(mockOrganizations);
  }
  let p = matchPath(path, '/organizations/{org}');
  if (p) {
    if (m === 'GET') {
      const org = mockOrganizations.find((o) => o.name === p!.org);
      return org ? ok(org) : ok(null);
    }
    if (m === 'PUT') {
      return ok(mockOrganizations.find((o) => o.name === p!.org));
    }
    if (m === 'DELETE') {
      return ok(null);
    }
  }
  if (m === 'POST' && path === '/organizations') {
    const b = body as Record<string, string>;
    return ok({ id: 100, name: b?.name || 'new-org' });
  }

  // --- Members ---
  p = matchPath(path, '/organizations/{org}/members');
  if (p) {
    if (m === 'GET') {
      return ok(mockOrgMembers[p.org] || []);
    }
    if (m === 'POST') {
      return ok({ id: 100 });
    }
  }
  p = matchPath(path, '/organizations/{org}/members/{user_id}');
  if (p) {
    if (m === 'PUT' || m === 'DELETE') {
      return ok(null);
    }
  }

  // --- Skills ---
  if (m === 'GET' && path === '/skills') {
    const keyword = query.keyword?.toLowerCase() || '';
    const tag = query.tag || '';
    const runtime = query.runtime || '';
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.page_size || '20', 10);

    let filtered = [...mockSkills];
    if (keyword) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(keyword) ||
          s.display_name.toLowerCase().includes(keyword) ||
          s.description.toLowerCase().includes(keyword),
      );
    }
    if (tag) {
      filtered = filtered.filter((s) => s.tags.includes(tag));
    }
    if (runtime) {
      filtered = filtered.filter((s) => s.runtimes.includes(runtime));
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return ok({ items, total, page, page_size: pageSize });
  }
  if (m === 'POST' && path === '/skills') {
    return ok({ id: 100 });
  }
  p = matchPath(path, '/skills/{org}/{name}');
  if (p) {
    if (m === 'GET') {
      const skill = mockSkills.find((s) => s.org_name === p!.org && s.name === p!.name);
      return skill ? ok(skill) : ok(null);
    }
    if (m === 'PUT') {
      return ok(mockSkills.find((s) => s.org_name === p!.org && s.name === p!.name));
    }
    if (m === 'DELETE') {
      return ok(null);
    }
  }

  // --- Versions ---
  p = matchPath(path, '/skills/{org}/{name}/versions');
  if (p) {
    const key = `${p.org}/${p.name}`;
    if (m === 'GET') {
      return ok(mockVersions[key] || []);
    }
    if (m === 'POST') {
      // Upload
      return ok({
        id: 100,
        skill_id: 1,
        version: '0.0.1',
        status: 'draft',
        changelog: '',
        artifact_path: 'mock/path.tar.gz',
        artifact_size: 10240,
        checksum_sha256: 'mock_sha256',
        reviewed_by: null,
        reviewed_at: null,
        review_comment: '',
        published_at: null,
        created_by: 1,
        created_at: new Date().toISOString(),
      });
    }
  }
  p = matchPath(path, '/skills/{org}/{name}/versions/{version}');
  if (p) {
    const key = `${p.org}/${p.name}`;
    const versions = mockVersions[key] || [];
    const ver = versions.find((v) => v.version === p!.version);
    if (m === 'GET') {
      return ver ? ok(ver) : ok(null);
    }
  }
  p = matchPath(path, '/skills/{org}/{name}/versions/{version}/download');
  if (p && m === 'GET') {
    // Return empty blob-like response
    return ok(null);
  }
  p = matchPath(path, '/skills/{org}/{name}/versions/{version}/submit');
  if (p && m === 'POST') {
    return ok({ status: 'pending_review' });
  }
  p = matchPath(path, '/skills/{org}/{name}/versions/{version}/review');
  if (p && m === 'POST') {
    const b = body as Record<string, string>;
    return ok({ status: b?.action === 'approve' ? 'approved' : 'rejected' });
  }
  p = matchPath(path, '/skills/{org}/{name}/versions/{version}/publish');
  if (p && m === 'POST') {
    return ok({ status: 'published' });
  }

  // --- Scan ---
  p = matchPath(path, '/skills/{org}/{name}/versions/{version}/scan');
  if (p && m === 'GET') {
    const key = `${p.org}/${p.name}/${p.version}`;
    return ok(mockScanResults[key] || []);
  }
  p = matchPath(path, '/skills/{org}/{name}/versions/{version}/rescan');
  if (p && m === 'POST') {
    return ok(null);
  }

  // --- Audit logs ---
  if (m === 'GET' && path === '/audit-logs') {
    const action = query.action || '';
    const resourceType = query.resource_type || '';
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.page_size || '20', 10);

    let filtered = [...mockAuditLogs];
    if (action) filtered = filtered.filter((l) => l.action === action);
    if (resourceType) filtered = filtered.filter((l) => l.resource_type === resourceType);

    // Sort descending by id (most recent first)
    filtered.sort((a, b) => b.id - a.id);

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return ok({ items, total, page, page_size: pageSize });
  }

  // --- Tokens ---
  if (m === 'GET' && path === '/tokens') {
    return ok(mockTokens);
  }
  if (m === 'POST' && path === '/tokens') {
    const b = body as Record<string, unknown>;
    const id = nextTokenId++;
    const token = {
      id,
      name: (b?.name as string) || 'New Token',
      token: 'svt_mock_' + Math.random().toString(36).slice(2, 18),
      token_prefix: 'svt_mock_' + Math.random().toString(36).slice(2, 6),
      created_at: new Date().toISOString(),
    };
    return ok(token);
  }
  p = matchPath(path, '/tokens/{id}');
  if (p && m === 'DELETE') {
    return ok(null);
  }

  // --- Reviews ---
  if (m === 'GET' && path === '/reviews') {
    return ok(mockPendingReviews);
  }

  // No match — return undefined so the real request proceeds
  return undefined;
}

/**
 * Install mock interceptor on an axios instance.
 * The interceptor short-circuits requests and returns mock data.
 */
export function installMockInterceptor(client: AxiosInstance): void {
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toUpperCase() || 'GET';
    const url = (config.baseURL || '') + (config.url || '');

    const result = handleMockRequest(method, url, config.data);
    if (result !== undefined) {
      await delay(200 + Math.random() * 300);

      // Create an adapter that resolves with mock response
      // This prevents the actual HTTP request from being sent
      config.adapter = () =>
        Promise.resolve({
          data: result,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
    }
    return config;
  });
}

/**
 * Patch the global fetch for endpoints that use fetch directly (e.g., ReviewCenter).
 * Only patches when mock mode is enabled.
 */
export function installFetchMock(): void {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method?.toUpperCase() || 'GET';

    const result = handleMockRequest(method, url, null);
    if (result !== undefined) {
      await delay(200 + Math.random() * 300);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return originalFetch(input, init);
  };
}
