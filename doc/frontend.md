# SkillVault 前端技术文档

## 1. 技术栈

| 库/工具 | 版本 | 用途 |
|--------|------|------|
| React | 18 | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具，开发服务器 |
| Ant Design | 5.x | UI 组件库 |
| React Router | v6 | 客户端路由（懒加载） |
| TanStack Query | v5 | 服务端状态管理 & 缓存 |
| Zustand | v4 | 客户端全局状态管理 |
| Axios | v1 | HTTP 请求客户端 |

---

## 2. 项目结构

```
apps/web/
├── public/                  # 静态资源
├── src/
│   ├── api/                 # API 请求封装（7 个模块）
│   │   ├── client.ts        # Axios 实例 + 拦截器 + mock 检测
│   │   ├── auth.ts          # 认证相关请求
│   │   ├── skill.ts         # Skill CRUD 请求
│   │   ├── organization.ts  # 组织 + 成员请求
│   │   ├── version.ts       # 版本 CRUD + 下载 + 审核
│   │   ├── token.ts         # API Token 管理
│   │   └── audit.ts         # 审计日志查询
│   ├── components/          # 通用组件（6 个）
│   │   ├── Layout/          # 主布局（侧边菜单 + header + 内容区）
│   │   ├── SkillCard/       # Skill 展示卡片
│   │   ├── PageHeader/      # 页面标题 + 面包屑
│   │   ├── StatsCard/       # 统计数字卡片
│   │   ├── StatusBadge/     # 版本状态标签（draft/pending/approved/published）
│   │   └── AuthGuard/       # 路由保护（未登录重定向）
│   ├── pages/               # 页面组件（10 个）
│   │   ├── Login/           # 登录页
│   │   ├── Register/        # 注册页
│   │   ├── Catalog/         # Skill 目录首页
│   │   ├── SkillDetail/     # Skill 详情页
│   │   ├── SkillUpload/     # 上传 Skill / 新版本
│   │   ├── Organization/    # 我的组织列表
│   │   ├── OrganizationDetail/ # 组织详情 + 成员管理
│   │   ├── ReviewCenter/    # 审核中心
│   │   ├── AuditLog/        # 审计日志
│   │   └── Profile/         # 个人中心 + API Token 管理
│   ├── hooks/               # 自定义 Hooks
│   ├── store/               # Zustand 全局状态
│   │   └── auth.ts          # 认证状态（token + user）
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts         # 所有接口类型
│   ├── routes/              # 路由配置
│   │   └── index.tsx        # React Router v6 懒加载路由
│   ├── mock/                # Mock API 系统
│   │   ├── index.ts         # Mock 开启检测
│   │   ├── handlers.ts      # Axios 拦截器 + mock 响应
│   │   └── data.ts          # Mock 数据fixtures
│   ├── App.tsx              # 根组件 + QueryClientProvider
│   └── main.tsx             # 入口文件
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. API 客户端（src/api）

### 3.1 Axios 实例配置（client.ts）

```typescript
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器：自动附加 Authorization header
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一解包 { code, message, data }
client.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data
    if (code !== 0) throw new Error(message)
    return data
  },
  (error) => {
    if (error.response?.status === 401) {
      // 自动登出
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)
```

### 3.2 Mock 模式检测

```typescript
// 通过环境变量或 localStorage 开启 mock
export function isMockEnabled(): boolean {
  return import.meta.env.VITE_MOCK === 'true' ||
         localStorage.getItem('mock') === '1'
}
```

开发时启用 mock：
```bash
VITE_MOCK=true npm run dev
# 或在浏览器控制台：
localStorage.setItem('mock', '1')
```

### 3.3 API 模块

**auth.ts**
```typescript
export const authApi = {
  login(params: LoginParams): Promise<AuthResponse>
  register(params: RegisterParams): Promise<AuthResponse>
  refreshToken(refreshToken: string): Promise<AuthResponse>
  logout(): Promise<void>
  getMe(): Promise<UserInfo>
}
```

**skill.ts**
```typescript
export const skillApi = {
  list(params: SkillListParams): Promise<PaginatedResponse<Skill>>
  get(org: string, name: string): Promise<Skill>
  create(data: CreateSkillRequest): Promise<Skill>
  update(org: string, name: string, data: UpdateSkillRequest): Promise<Skill>
  delete(org: string, name: string): Promise<void>
}
```

**version.ts**
```typescript
export const versionApi = {
  upload(org: string, name: string, formData: FormData): Promise<SkillVersion>
  list(org: string, name: string): Promise<SkillVersion[]>
  get(org: string, name: string, version: string): Promise<SkillVersion>
  download(org: string, name: string, version: string): Promise<Blob>
  submitForReview(org: string, name: string, version: string): Promise<void>
  review(org: string, name: string, version: string, approved: boolean, comment?: string): Promise<void>
  publish(org: string, name: string, version: string): Promise<void>
}
```

**organization.ts**
```typescript
export const orgApi = {
  list(): Promise<Organization[]>
  get(org: string): Promise<Organization>
  create(data: CreateOrgRequest): Promise<Organization>
  update(org: string, data: UpdateOrgRequest): Promise<Organization>
  delete(org: string): Promise<void>
  listMembers(org: string): Promise<OrgMember[]>
  addMember(org: string, username: string, role: string): Promise<OrgMember>
  updateMember(org: string, userId: number, role: string): Promise<OrgMember>
  removeMember(org: string, userId: number): Promise<void>
}
```

---

## 4. 状态管理

### 4.1 Zustand Auth Store（store/auth.ts）

```typescript
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserInfo | null

  setTokens(access: string, refresh: string): void
  setUser(user: UserInfo): void
  fetchUser(): Promise<void>   // 调用 /api/v1/auth/me
  logout(): void               // 清除 token + user，重定向到 /login
}

// 持久化到 localStorage
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ ... }),
    { name: 'skillvault-auth' }
  )
)
```

### 4.2 React Query 服务端状态

页面数据通过 TanStack Query 管理，提供自动缓存和后台刷新：

```typescript
// Skill 列表（Catalog 页）
const { data, isLoading } = useQuery({
  queryKey: ['skills', filters],
  queryFn: () => skillApi.list(filters),
})

// 版本列表（SkillDetail 页）
const { data: versions } = useQuery({
  queryKey: ['versions', org, name],
  queryFn: () => versionApi.list(org, name),
})

// 提交审核 mutation
const reviewMutation = useMutation({
  mutationFn: ({ approved, comment }) =>
    versionApi.review(org, name, version, approved, comment),
  onSuccess: () => queryClient.invalidateQueries(['versions', org, name]),
})
```

---

## 5. 路由配置（routes/index.tsx）

所有页面路由均使用 `React.lazy` 实现按需加载：

```typescript
const Catalog = lazy(() => import('../pages/Catalog'))
const SkillDetail = lazy(() => import('../pages/SkillDetail'))
// ...

export const routes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: <AuthGuard><Layout /></AuthGuard>,  // 受保护布局
    children: [
      { index: true,                      element: <Catalog /> },
      { path: 'skills/new',               element: <SkillUpload /> },
      { path: 'skills/:org/:name',        element: <SkillDetail /> },
      { path: 'skills/:org/:name/versions/new', element: <SkillUpload /> },
      { path: 'organizations',            element: <Organization /> },
      { path: 'organizations/:org',       element: <OrganizationDetail /> },
      { path: 'reviews',                  element: <ReviewCenter /> },
      { path: 'audit-logs',               element: <AuditLog /> },
      { path: 'profile',                  element: <Profile /> },
    ],
  },
]
```

---

## 6. 页面组件详解

### 6.1 Catalog（目录首页）

路由：`/`

功能：
- 展示所有可访问的 Skill（分页）
- 关键词搜索、tag 筛选、runtime 筛选
- 顶部统计卡片（总 Skill 数、已发布数、组织数）
- 点击 SkillCard 进入详情页

**关键状态：**
```typescript
const [filters, setFilters] = useState({
  keyword: '',
  tag: '',
  runtime: '',
  page: 1,
  page_size: 20,
})
```

### 6.2 SkillDetail（Skill 详情）

路由：`/skills/:org/:name`

功能：
- Skill 基本信息（名称、描述、tags、runtimes、可见性）
- 版本列表，每个版本显示状态徽章和扫描结果
- 下载命令展示（CLI 安装命令生成）
- 有权限时显示版本操作按钮（提交审核、审核、发布）

**CLI 命令生成：**
```typescript
const installCmd = `skillvault install ${org}/${name}@${version} --target openclaw`
```

### 6.3 SkillUpload（上传）

路由：`/skills/new`（新建）或 `/skills/:org/:name/versions/new`（新版本）

功能：
- 选择所属组织（下拉，从用户组织列表获取）
- 填写 Skill 元数据（name、displayName、description、tags、runtimes、visibility）
- 拖拽 / 点击上传 `.tar.gz` 包（multipart/form-data）
- 填写版本号（semver 格式校验）和 changelog
- 上传进度展示

### 6.4 ReviewCenter（审核中心）

路由：`/reviews`

功能：
- 展示所有待审核（`pending_review`）版本
- 管理员可点击通过/拒绝，并填写审核意见
- 拒绝时弹出 Modal 输入拒绝原因

### 6.5 Profile（个人中心）

路由：`/profile`

功能：
- 展示用户基本信息
- API Token 管理：
  - 创建新 Token（设置名称和权限范围）
  - 创建后一次性展示明文 Token（关闭后不再显示）
  - 撤销 Token

### 6.6 OrganizationDetail（组织详情）

路由：`/organizations/:org`

功能：
- 组织基本信息展示与编辑
- 成员列表：展示角色、加入时间
- 添加/移除成员，更改成员角色（需 admin 权限）
- 该组织下的 Skill 列表

### 6.7 AuditLog（审计日志）

路由：`/audit-logs`

功能：
- 分页展示审计日志
- 筛选：按操作类型（action）、资源类型、时间范围
- 每条日志展示：用户、操作、资源、IP、时间、详情（可展开 JSON）

---

## 7. 通用组件

### 7.1 Layout

主应用布局，结构：

```
┌─────────────────────────────────────┐
│          Header (用户信息 + 导航)      │
├────────────┬────────────────────────┤
│  Sidebar   │                        │
│  (菜单)    │   Content Area         │
│            │   <Outlet />           │
│            │                        │
└────────────┴────────────────────────┘
```

侧边菜单项：
- Skill Catalog（首页）
- 我的组织
- 审核中心（仅 admin/owner 可见）
- 审计日志（仅 admin/owner 可见）
- 个人中心

### 7.2 SkillCard

```typescript
interface SkillCardProps {
  skill: Skill
  onClick?: () => void
}
// 展示：名称、displayName、描述摘要、tags、runtimes、下载数、最新版本、状态
```

### 7.3 StatusBadge

```typescript
interface StatusBadgeProps {
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected'
}
// 颜色映射：
// draft → gray
// pending_review → blue
// approved → cyan
// published → green
// rejected → red
```

### 7.4 AuthGuard

```typescript
// 检查 Zustand store 中是否有 accessToken
// 无 token → 重定向到 /login（保存 redirect 参数）
// 有 token 且无 user 信息 → 调用 fetchUser()
// 有 token 且有 user 信息 → 渲染 children
```

---

## 8. TypeScript 类型定义（types/index.ts）

```typescript
// 用户
interface UserInfo {
  id: number
  username: string
  email: string
  display_name: string
  avatar_url: string
  status: number
}

// 认证
interface LoginParams { username: string; password: string }
interface RegisterParams { username: string; email: string; password: string }
interface AuthResponse { access_token: string; refresh_token: string; user: UserInfo }

// 组织
interface Organization {
  id: number
  name: string
  display_name: string
  description: string
  avatar_url: string
  created_by: number
  created_at: string
}

interface OrgMember {
  id: number
  org_id: number
  user_id: number
  username: string
  display_name: string
  role: 'owner' | 'admin' | 'developer' | 'viewer'
  created_at: string
}

// Skill
interface Skill {
  id: number
  org_id: number
  org_name: string
  name: string
  display_name: string
  description: string
  tags: string[]
  visibility: 'public' | 'private' | 'internal'
  runtimes: string[]
  latest_version: string
  download_count: number
  created_by: number
  created_at: string
}

// Skill 版本
interface SkillVersion {
  id: number
  skill_id: number
  version: string
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected'
  changelog: string
  artifact_path: string
  artifact_size: number
  checksum_sha256: string
  manifest: Record<string, unknown>
  reviewed_by?: number
  reviewed_at?: string
  review_comment?: string
  published_at?: string
  created_by: number
  created_at: string
}

// 扫描结果
interface ScanResult {
  id: number
  version_id: number
  scan_type: 'structure' | 'security' | 'metadata'
  status: 'passed' | 'warning' | 'failed'
  findings: ScanFinding[]
  scanned_at: string
}

interface ScanFinding {
  rule_name: string
  severity: 'error' | 'warning' | 'info'
  message: string
  file?: string
  line?: number
}

// API Token
interface APIToken {
  id: number
  user_id: number
  name: string
  token_prefix: string
  scopes: string[]
  last_used_at?: string
  expires_at?: string
  created_at: string
}

// 审计日志
interface AuditLog {
  id: number
  user_id: number
  username: string
  org_id?: number
  action: string
  resource_type: string
  resource_id: number
  detail: Record<string, unknown>
  ip: string
  created_at: string
}

// 分页
interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
```

---

## 9. Mock API 系统

### 9.1 工作原理

Mock 系统通过 Axios 请求拦截器在客户端拦截请求并返回 Mock 数据，不需要启动后端服务。

```typescript
// handlers.ts
client.interceptors.request.use(async (config) => {
  if (!isMockEnabled()) return config

  const { method, url, data, params } = config

  // 匹配路由 → 返回 mock 响应
  if (method === 'post' && url?.includes('/auth/login')) {
    return Promise.reject(createMockResponse({ access_token: '...', ... }))
  }
  // ...
})
```

### 9.2 Mock 数据（data.ts）

提供预置的测试数据，涵盖：
- 2 个用户（admin + developer）
- 2 个组织（acme、devteam）
- 6 个 Skills（覆盖不同 visibility、runtimes、tags）
- 每个 Skill 带有 2-3 个版本（不同状态）
- 扫描结果（passed、warning 示例）

### 9.3 使用场景

- 前端独立开发（不依赖后端）
- UI 组件 Story 开发
- E2E 测试（固定数据集）

---

## 10. 构建与环境

### 10.1 环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080
VITE_MOCK=false

# .env.mock（本地 mock 开发）
VITE_API_BASE_URL=http://localhost:8080
VITE_MOCK=true
```

### 10.2 开发命令

```bash
npm run dev        # 启动开发服务器（:3000）
npm run build      # 生产构建（输出到 dist/）
npm run preview    # 预览生产构建
npm run type-check # TypeScript 类型检查
```

### 10.3 Vite 代理配置

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 11. 开发规范

- 组件使用函数式组件 + Hooks，禁止使用 Class 组件
- 服务端状态（API 数据）使用 TanStack Query 管理，避免手动 useState + useEffect 组合
- 全局客户端状态（认证信息）使用 Zustand 管理
- 所有 API 请求必须通过 `src/api/` 目录下的封装函数发出，禁止在组件中直接调用 axios
- TypeScript 类型定义统一放在 `src/types/index.ts`
- 路由使用懒加载（`React.lazy`）减少首屏体积
- Ant Design 组件按需引入，不使用全量导入
- 表单使用 Ant Design Form 组件，利用内置校验规则
