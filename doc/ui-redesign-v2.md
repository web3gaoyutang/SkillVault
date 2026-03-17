# SkillVault UI 改版文档 · v2.0

> **改版时间**：2026-03-17
> **改版范围**：`apps/web/src` 全部页面组件、通用组件、全局样式、Ant Design 主题配置
> **改版目标**：从传统深色企业后台风格迁移至现代浅色 AI SaaS 产品风格

---

## 一、改版背景与目标

### 改版前问题

| 问题 | 具体表现 |
|------|---------|
| 深色区域过重 | 侧边栏使用深靛紫渐变 `#1E1B4B → #312E81`，在浅色内容区旁对比过于强烈 |
| 渐变滥用 | 按钮、卡片图标、徽章、页面头部均使用 `135deg` 紫色渐变，视觉疲劳 |
| 留白不足 | 内容密度高，间距偏小，缺乏呼吸感 |
| 配色传统 | 整体以 Indigo-600/Purple-600 为主，缺乏现代 SaaS 产品的轻盈感 |
| Auth 页沉重 | 登录/注册使用全屏深紫渐变背景，与产品定位不符 |

### 改版目标

- **浅色科技感**：以白色、极浅 Slate 为主色调，减少深色面积
- **薄荷绿 + 淡紫点缀**：用 `#10B981`（mint）与 `#A78BFA`（lavender）做少量功能性点缀
- **极简 SaaS 后台**：对标 Linear、Vercel、Supabase 等现代工具产品的视觉风格
- **更轻、更透气、更柔和**：提升留白比例，降低视觉重量

---

## 二、设计系统变更

### 2.1 色彩系统

#### 主色调

| Token | 旧值 | 新值 | 说明 |
|-------|------|------|------|
| `colorPrimary` | `#4F46E5` (Indigo-600) | `#6366F1` (Indigo-500) | 更轻的主色 |
| `colorSuccess` | 未配置 | `#10B981` (Emerald-500) | 薄荷绿，用于成功态 |
| `colorBorder` | 未配置 | `#E2E8F0` (Slate-200) | 统一边框色 |
| `colorBgLayout` | `#F8FAFC` | `#F8FAFC` | 保持不变 |

#### 扩展色板

```
─── 品牌色 ────────────────────────────────────
Primary Indigo:   #6366F1  (按钮、选中、链接)
Primary Light:    #EEF2FF  (选中背景、标签底色)
Primary Border:   #E0E7FF  (标签边框)

─── 功能色 ────────────────────────────────────
Mint Green:       #10B981  (成功、SkillCard hover、已发布标签)
Mint Light:       #ECFDF5  (成功底色、组织图标背景)
Mint Border:      #A7F3D0  (成功边框)

Lavender:         #A78BFA  (Avatar 渐变点缀)
Lavender Light:   #F5F3FF  (Owner 角色 / stats-purple 底色)

─── 中性色 ────────────────────────────────────
Text Primary:     #0F172A  (Slate-900, 标题、强调文字)
Text Secondary:   #64748B  (Slate-500, 正文、描述)
Text Muted:       #94A3B8  (Slate-400, 辅助文字、图标)
Border:           #E2E8F0  (Slate-200, 卡片/输入框边框)
Divider:          #F1F5F9  (Slate-100, 分割线)
Surface:          #FFFFFF  (卡片、侧边栏背景)
Background:       #F8FAFC  (Slate-50, 页面背景)
```

### 2.2 间距与圆角

| 元素 | 旧值 | 新值 |
|------|------|------|
| 卡片圆角 | 12px | 12px（保持） |
| 按钮圆角 | 8px | 8px（保持） |
| 标签圆角 | 12px | **20px**（全圆角胶囊形） |
| 内容区 padding | 24px | **28px**（略加留白） |
| 侧边栏宽度 | 240px | **232px** |
| Header 高度 | 64px | **60px** |

### 2.3 字体

字体族保持 **Inter**，新增以下细节约束：

```css
/* 标题 */
font-weight: 700;
letter-spacing: -0.02em;
color: #0F172A;

/* 标签/分组标题 */
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.04em;
color: #94A3B8;

/* 正文 */
line-height: 1.55–1.6;
color: #64748B;
```

### 2.4 阴影

| 用途 | 旧值 | 新值 |
|------|------|------|
| 卡片默认 | 无 | `0 1px 3px rgba(0,0,0,0.04)` |
| 卡片 hover | `0 8px 25px rgba(79,70,229,0.12)` 紫色 | `0 8px 24px rgba(16,185,129,0.10)` 薄荷色 |
| Auth 卡片 | `0 20px 60px rgba(0,0,0,0.3)` | `0 4px 24px rgba(99,102,241,0.08)` |
| Header | `0 1px 3px rgba(0,0,0,0.05)` | 改为 `border-bottom: 1px solid #E2E8F0` |

---

## 三、组件变更详情

### 3.1 Layout — 侧边栏 & Header

**改动最大的组件**，视觉风格完全重塑。

#### 侧边栏

```
旧：深靛紫渐变背景 (#1E1B4B → #312E81)，白色文字，dark 主题菜单
新：纯白背景 (#FFFFFF)，右侧细边框 (#E2E8F0)，light 主题菜单
```

- Menu 选中背景：`#EEF2FF`，选中文字：`#6366F1`
- Menu 组标题：全大写，`#94A3B8`，字号 11px
- 菜单分组由 `Main / Management / Account` 改为 `DISCOVER / MANAGE / ACCOUNT`

#### Logo

```
旧：SafetyCertificateOutlined 图标 + 白色文字
新：自定义 SVG LogoMark（双矩形叠加，Indigo + Mint 描边）+ 深色文字
```

```tsx
// 新 LogoMark SVG（双 vault 方块，代表 skill + registry 两层概念）
<svg width="28" height="28" viewBox="0 0 28 28">
  <rect x="2" y="2" width="16" height="16" rx="4"
    fill="#6366F1" fillOpacity="0.15" stroke="#6366F1" strokeWidth="1.5"/>
  <rect x="10" y="10" width="16" height="16" rx="4"
    fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1.5"/>
</svg>
```

#### Header

```
旧：白色背景 + box-shadow
新：白色背景 + border-bottom (#E2E8F0) + 高度 60px + position: sticky
```

- Avatar：渐变从 `#4F46E5→#7C3AED` 改为 `#6366F1→#A78BFA`
- 侧边栏改为 `position: fixed`，主内容区配套 `marginLeft: 232px`

---

### 3.2 SkillCard

| 属性 | 旧 | 新 |
|------|----|----|
| 顶部 hover 线颜色 | `#4F46E5` (紫) | `#10B981` (薄荷绿) |
| hover 阴影 | 紫色 `rgba(79,70,229,0.12)` | 薄荷色 `rgba(16,185,129,0.10)` |
| 标签底色 | `#EDE9FE` 紫色 | `#F0FDF4` 薄荷绿 |
| 标签文字 | `#5B21B6` | `#059669` |
| 标签边框 | 无 | `#D1FAE5` |
| 版本标签 | Ant Design `color="green"` | `#EEF2FF` 底 / `#6366F1` 文字（indigo 胶囊） |
| 标签圆角 | 12px | **20px**（胶囊形） |
| `+N` 溢出标签 | 默认灰色 | `#F8FAFC` 底 / `#94A3B8` 文字 |
| 卡片边框 | 无（Ant Design 默认） | `1px solid #E2E8F0` |

---

### 3.3 StatsCard

```
旧：通过 className 设置渐变背景（stats-card-purple 等有 gradient）
新：纯 pastel 底色 + 细边框，去除渐变
```

| 卡片 | 旧背景 | 新背景 | 新边框 |
|------|--------|--------|--------|
| Purple | `#EDE9FE → #DDD6FE` 渐变 | `#F5F3FF` 纯色 | `#EDE9FE` |
| Blue | `#DBEAFE → #BFDBFE` 渐变 | `#EFF6FF` 纯色 | `#DBEAFE` |
| Green | `#D1FAE5 → #A7F3D0` 渐变 | `#ECFDF5` 纯色 | `#D1FAE5` |
| Amber | `#FEF3C7 → #FDE68A` 渐变 | `#FFFBEB` 纯色 | `#FEF3C7` |

标题改为 `uppercase + letter-spacing`，增强信息层级。

---

### 3.4 PageHeader

```
旧：Breadcrumb.Item 语法（Ant Design v4 写法）
新：items 数组语法（Ant Design v5 规范）
```

- 标题颜色：显式指定 `#0F172A`，`letter-spacing: -0.02em`
- 面包屑颜色：链接 `#94A3B8`，当前页 `#64748B`

---

### 3.5 StatusBadge

| 状态 | 旧底色 | 新底色 | 旧文字 | 新文字 |
|------|--------|--------|--------|--------|
| draft | `#F3F4F6` | `#F1F5F9` | `#6B7280` | `#64748B` |
| pending_review | `#DBEAFE` | `#EFF6FF` | `#2563EB` | `#3B82F6` |
| approved | `#D1FAE5` | `#ECFDF5` | `#059669` | 不变 |
| published | `#ECFDF5` | 不变 | `#047857` | 不变 |
| rejected | `#FEE2E2` | `#FFF1F2` | `#DC2626` | `#E11D48` |

圆角从 12px → **20px**，视觉更轻盈。

---

### 3.6 Role Badge

```
旧：彩色渐变背景 + 白色文字（solid, heavy）
新：浅色 pastel 底色 + 深色文字 + 细边框（soft, light）
```

| 角色 | 旧 | 新底色 / 文字 / 边框 |
|------|----|--------------------|
| owner | `F59E0B→D97706` 渐变, 白字 | `#FEF3C7` / `#92400E` / `#FDE68A` |
| admin | `8B5CF6→7C3AED` 渐变, 白字 | `#F5F3FF` / `#6D28D9` / `#DDD6FE` |
| developer | `3B82F6→2563EB` 渐变, 白字 | `#EFF6FF` / `#1D4ED8` / `#BFDBFE` |
| viewer | `6B7280→4B5563` 渐变, 白字 | `#F8FAFC` / `#475569` / `#E2E8F0` |

---

### 3.7 Auth 页 (Login / Register)

#### 背景

```
旧：linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #7C3AED 100%)
    — 全屏深紫，沉重
新：linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #ECFDF5 100%)
    — 浅色三段渐变（indigo → lavender → mint），轻盈通透
```

#### 卡片布局

```
旧：Card 在渐变背景上，width: 420px，padding: 40px，阴影 0 20px 60px rgba(0,0,0,0.3)
新：品牌标识（SVG LogoMark + 标题 + 副标题）外置于卡片顶部
    Card width: 400px，padding: 32px，阴影 0 4px 24px rgba(99,102,241,0.08)
    边框 1px solid #E2E8F0
```

#### 按钮

```
旧：inline style background: linear-gradient(135deg, #4F46E5, #7C3AED)
新：type="primary"，由 Ant Design ConfigProvider 统一管理，height: 42px
```

#### 密码强度条（Register）

```
旧：Ant Design Progress 组件
新：自定义 div — height: 4px，颜色随强度变化（红/黄/绿），动画过渡
```

---

### 3.8 gradient-header（SkillDetail / OrganizationDetail）

这是改动最明显的区域之一。

```
旧：深紫渐变卡片，白色/半透明文字
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)

新：白色卡片，深色文字
    background: #FFFFFF
    border: 1px solid #E2E8F0
    padding: 28px 32px
```

对应所有子元素颜色同步更新：

| 元素 | 旧颜色 | 新颜色 |
|------|--------|--------|
| 路径文字 (org/name) | `rgba(255,255,255,0.8)` | `#64748B` |
| 描述文字 | `rgba(255,255,255,0.9)` | `#1E293B` |
| 内嵌标签底色 | `rgba(255,255,255,0.2)` 半透明白 | `#F0FDF4` 薄荷绿 / `#EEF2FF` 蓝紫 |
| 内嵌标签文字 | `#fff` | `#059669` / `#6366F1` |
| 下载量图标 | `rgba(255,255,255,0.7)` | `#94A3B8` |
| 下载量文字 | `rgba(255,255,255,0.8)` | `#64748B` |

---

### 3.9 Organization 卡片图标

```
旧：width: 40px, 40px，background: linear-gradient(135deg, #4F46E5, #7C3AED)，白色图标
新：width: 40px, 40px，background: #ECFDF5，border: 1px solid #D1FAE5，#059669 图标
```

---

### 3.10 Profile 页面

新增用户身份块（Avatar + 用户名 + handle），取代原本的 Descriptions 表格顶部，视觉层级更清晰：

```
旧：Descriptions bordered 表格，无用户头像
新：头像（56px，渐变）+ 显示名 + @handle，下方改为轻量 label-value 布局
```

Token 警告提示从 `<Text type="warning">` 改为带边框的浅黄色提示框：

```tsx
// 新：更醒目、非破坏性
<div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px' }}>
  <Text style={{ color: '#92400E' }}>Copy this token now...</Text>
</div>
```

---

### 3.11 ReviewCenter

Approve / Reject 按钮从 solid 颜色改为 pastel 风格：

```
旧：
  Approve: background #059669（深绿实心）, 白字
  Reject:  danger 红色实心, 白字

新：
  Approve: background #ECFDF5, border #A7F3D0, color #059669（浅绿描边）
  Reject:  background #FFF1F2, border #FECDD3, color #E11D48（浅红描边）
```

空状态图标从 Ant Design 默认改为 `SafetyOutlined`（语义更贴近审核场景）。

---

### 3.12 AuditLog

Action Tag 从 Ant Design 语义色（`color="green"` 等）改为自定义 pastel 样式：

| Action | 底色 | 文字 | 边框 |
|--------|------|------|------|
| create | `#ECFDF5` | `#059669` | `#A7F3D0` |
| update | `#EFF6FF` | `#3B82F6` | `#BFDBFE` |
| delete | `#FFF1F2` | `#E11D48` | `#FECDD3` |
| publish | `#F5F3FF` | `#7C3AED` | `#DDD6FE` |
| review | `#FFFBEB` | `#D97706` | `#FDE68A` |
| login | `#ECFEFF` | `#0891B2` | `#A5F3FC` |

所有标签圆角统一为 20px（胶囊形）。

---

### 3.13 SkillUpload

- Dragger 上传区：图标从默认改为 `InboxOutlined`（color `#6366F1`，36px）
- 成功结果图标：从 Ant Design 默认绿对勾改为 `CheckCircleOutlined`（color `#10B981`）
- 按钮高度统一 40px

---

## 四、全局 CSS 变更（`global.css`）

### 移除

| 类/规则 | 原内容 | 处理 |
|---------|--------|------|
| `.sidebar-gradient` | 深紫渐变 | 改为 `.sidebar-light`（白色 + 边框） |
| `.gradient-header` | 深紫渐变 + 白字 | 改为白色卡片 + 浅边框 + 深字 |
| `.role-badge-*` | 彩色渐变 + padding 内联 | 重写为 pastel 底色 + 独立 padding 规则 |
| `.stats-card-*` | `linear-gradient` | 改为纯 pastel 背景色 + `!important` 边框 |
| `.auth-bg` | 全屏深紫渐变 | 改为浅色三段渐变 |

### 新增

```css
/* 薄荷绿 hover 顶线（替换原紫色） */
.skill-card:hover {
  border-top-color: #10B981 !important;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.10) !important;
}

/* 代码块：底色从 #1E1B4B 改为 #0F172A（更通用深色），文字改为 #CBD5E1 */
.code-block { background: #0F172A; color: #CBD5E1; }

/* 自定义滚动条：从 indigo 改为 Slate */
::-webkit-scrollbar-thumb { background: #CBD5E1; }
```

---

## 五、Ant Design 主题配置变更（`main.tsx`）

```tsx
// 新增的 token
colorSuccess: '#10B981',
colorWarning: '#F59E0B',
colorError: '#EF4444',
colorBorder: '#E2E8F0',
colorBorderSecondary: '#F1F5F9',
colorTextSecondary: '#64748B',
colorTextTertiary: '#94A3B8',
boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',

// 新增的 components token
Menu: {
  itemSelectedBg: '#EEF2FF',
  itemSelectedColor: '#6366F1',
  itemHoverBg: '#F8FAFC',
  groupTitleColor: '#94A3B8',
  groupTitleFontSize: 11,
},
Table: {
  headerBg: '#F8FAFC',
  borderColor: '#E2E8F0',
  rowHoverBg: '#F8FAFC',
},
Tabs: {
  inkBarColor: '#6366F1',
  itemSelectedColor: '#6366F1',
},
```

---

## 六、修改文件清单

| 文件路径 | 改动类型 | 核心变更 |
|----------|---------|---------|
| `src/styles/global.css` | 完全重写 | 侧边栏/auth/header/badge/card 全面浅色化 |
| `src/main.tsx` | 主题扩展 | 新增 10+ Ant Design token |
| `src/components/Layout/index.tsx` | 重写 | 白色侧边栏、SVG Logo、sticky header、fixed sider |
| `src/components/SkillCard/index.tsx` | 重写 | 薄荷绿 tag/hover，indigo 版本徽章，胶囊圆角 |
| `src/components/StatsCard/index.tsx` | 重写 | pastel 背景（CSS 驱动），uppercase 标题 |
| `src/components/PageHeader/index.tsx` | 重写 | AntD v5 Breadcrumb items API，深色标题 |
| `src/pages/Login/index.tsx` | 重写 | 浅色背景，SVG Logo 外置，柔和卡片阴影 |
| `src/pages/Register/index.tsx` | 重写 | 同 Login，密码强度条自定义实现 |
| `src/pages/Catalog/index.tsx` | 更新 | icon 颜色与新色板对齐，分页颜色 |
| `src/pages/SkillDetail/index.tsx` | 更新 | gradient-header 子元素色值全部改为深色 |
| `src/pages/SkillUpload/index.tsx` | 更新 | Dragger 图标、结果图标、按钮高度 |
| `src/pages/Organization/index.tsx` | 更新 | org 图标改薄荷绿，按钮去渐变 |
| `src/pages/OrganizationDetail/index.tsx` | 更新 | gradient-header 色值，成员/skill tag 样式 |
| `src/pages/Profile/index.tsx` | 重写 | 用户身份块，轻量 info 布局，token 警告框 |
| `src/pages/ReviewCenter/index.tsx` | 更新 | Approve/Reject 改 pastel，空状态图标 |
| `src/pages/AuditLog/index.tsx` | 更新 | 全部 action tag 改为自定义 pastel 样式 |

---

## 七、设计规范约束

改版后前端代码须遵守以下约束，防止风格回退：

### 禁止

```
✗ 在组件 inline style 中使用 linear-gradient（仅 auth-bg 除外）
✗ 在组件中硬编码深色（#1E1B4B、#312E81、#4F46E5 以下亮度的紫色）
✗ Ant Design Tag 使用 color="green/blue/red" 语义色（改用自定义 pastel style）
✗ Role badge 使用 gradient 背景
✗ 标签圆角低于 20px（统一胶囊形）
```

### 必须

```
✓ 新卡片一律带 border: 1px solid #E2E8F0
✓ 所有可交互卡片添加 cursor: pointer（通过 .skill-card 或 hoverable 属性）
✓ 正文颜色使用 #64748B，标题 #0F172A，辅助 #94A3B8
✓ 新 Tag 样式：background / color / border 三元组，borderRadius: 20
✓ 按钮使用 type="primary" 交由主题配置，避免内联渐变覆盖
```

---

## 八、视觉对比速览

```
登录页
  前：全屏深紫渐变 → 白色卡片（浮于深色）
  后：浅色三段渐变背景（indigo/lavender/mint）→ 白色卡片（轻盈悬浮感）

侧边栏
  前：深靛紫渐变（如深夜 IDE）
  后：纯白 + Slate-200 边框（如 Notion、Linear）

Skill 卡片 hover
  前：顶部紫色线 + 紫色阴影
  后：顶部薄荷绿线 + 薄荷阴影（清新感）

技能详情页顶部
  前：深紫渐变 hero 区块，白字
  后：白色 info 卡片，深灰文字，配色点缀标签

统计卡片
  前：各色渐变底色（较重）
  后：对应 pastel 纯色 + 细边框（更轻）

角色/状态徽章
  前：实心渐变色块（厚重感）
  后：浅底色 + 细边框 + 深色文字（信息清晰、视觉轻）
```
