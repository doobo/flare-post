<div align="center">
  <img src="./frontend/public/flarepost-logo.svg" alt="FlarePost" width="400" />
  <p><strong>AI 驱动的内容发布平台 — 在 Cloudflare Workers 上免费部署一个全功能内容管理系统。</strong></p>
</div>

---

FlarePost 是一个基于 [Cloudflare Workers](https://workers.cloudflare.com/) 的单体内容发布平台。一个 Worker 同时承载了 Vue 3 前端 SPA、Hono 后端 API、D1 数据库、KV 缓存、短链系统和完整管理后台，所有功能打包在一起，部署在 Cloudflare 免费层上，成本为零。

最初为发布 VM/VPN/云服务优惠信息而设计，FlarePost 是一套通用的内容平台。你可以用它搭建博客、优惠聚合站、SEO 落地页，或任何基于 Markdown 的内容发布站点。

---

## ✨ 功能特色

### 🏗️ 单 Worker 架构
- **一个 Worker，包揽一切。** 前端 SPA、REST API、管理后台、短链跳转 — 全部打包在单个 Cloudflare Worker 中部署。
- **边缘原生。** 运行在 Cloudflare 全球网络（330+ 城市），无需管理任何服务器。

### 📝 内容管理
- **Markdown 编辑**，支持 YAML frontmatter 结构化元数据（折扣、优惠码、有效期等）。
- **富文本编辑器** 作为备选方案。
- **分类树** 通过层级字典系统管理，无需硬编码。
- **标签系统**，支持搜索和筛选。
- **自动保存与草稿恢复**，编辑不丢失。

### 🔗 智能链接系统
- **链接自动改写**：文章中的外部链接自动转为内部重定向（`/redirect?url=...`）。
- **短链支持**（`/go/:id`），基于 KV 缓存加速，含点击统计。
- **安全跳转页**，域名白名单检查，可疑链接向用户发出警告。

### 🔐 企业级安全
- **RSA-OAEP 加密** 传输登录密码。
- **JWT 认证**（HS256，24 小时过期），所有管理操作需鉴权。
- **AES-GCM 加密** 存储敏感配置值（API 密钥、机密）。
- **外部链接净化** — 所有出站链接均被拦截和审查。

### 🎨 管理后台
- 动态侧边栏菜单（数据库驱动，热重载）。
- 层级式菜单/图标管理器，内置 RemixIcon 选择器。
- 用户管理（CRUD）。
- SEO 预览面板。
- 多标签导航和全屏模式。
- 字典（键值配置）管理器，支持加密存储。

### ⚡ 性能与体验
- **KV 缓存的短链**，实现即时跳转。
- **骨架屏加载** 和分页浏览。
- **防抖搜索** 和文字高亮。
- **倒计时组件**，展示优惠剩余时间。
- **移动端优先响应式设计**，带滑出式分类菜单。

---

## 🧱 技术栈

| 层 | 技术 |
|-------|------------|
| **运行时** | Cloudflare Workers |
| **框架** | [Hono](https://hono.dev/) |
| **前端** | Vue 3 + Vite + Tailwind CSS v4 |
| **数据库** | Cloudflare D1 (SQLite) |
| **缓存** | Cloudflare KV |
| **认证** | RSA-OAEP + JWT (HS256) |
| **Markdown** | markdown-it |
| **本地开发** | @hono/node-server, better-sqlite3 |

---

## 🏛️ 架构图

```
┌─────────────────────────────────────────────────┐
│              Cloudflare Worker                  │
│                                                  │
│   ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│   │  Vue SPA  │  │ Hono API │  │ 管理后台    │  │
│   │ (静态资源) │  │  路由    │  │   (SPA)     │  │
│   └──────────┘  └────┬─────┘  └─────────────┘  │
│                      │                           │
│   ┌──────────────────┴──────────────────────┐   │
│   │  /api/posts  /api/auth  /api/users      │   │
│   │  /api/dictionaries  /api/menus          │   │
│   └──────────────────┬──────────────────────┘   │
│                      │                           │
│   ┌──────────────────┴──────────────────────┐   │
│   │  短链: /go/:id  →  KV → D1             │   │
│   │  跳转守卫: /redirect → 白名单检查       │   │
│   └──────────────────┬──────────────────────┘   │
│                      │                           │
├──────────────────────┼──────────────────────────┤
│                      │                           │
│          ┌───────────┴───────────┐              │
│          │  D1 (SQLite 数据库)   │              │
│          │   + KV (缓存)         │              │
│          └───────────────────────┘              │
└─────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
flarepost/
├── frontend/                  # Vue 3 SPA (Vite)
│   ├── src/
│   │   ├── components/        # 导航栏、确认对话框
│   │   ├── views/             # 首页、详情页、管理后台
│   │   ├── utils/             # 工具函数
│   │   ├── router.ts          # 路由配置
│   │   ├── main.ts            # 入口文件
│   │   └── style.css          # 全局样式
│   ├── public/
│   │   ├── favicon.svg        # FlarePost 火焰图标
│   │   └── flarepost-logo.svg # 完整品牌 Logo
│   └── index.html
├── src/                       # Worker 后端
│   ├── index.ts               # Worker 入口
│   ├── types.ts               # Cloudflare 绑定类型
│   ├── hono/
│   │   └── app.ts             # Hono 应用 + 路由注册
│   ├── api/
│   │   ├── auth.ts            # 登录、JWT、公钥
│   │   ├── posts.ts           # 文章 CRUD
│   │   ├── users.ts           # 用户管理
│   │   ├── dictionaries.ts    # 键值配置
│   │   ├── menus.ts           # 动态侧边栏菜单
│   │   └── redirect.ts        # 短链 + 跳转守卫
│   ├── security/
│   │   ├── middleware.ts       # JWT 认证中间件
│   │   └── crypto.ts          # RSA、AES、哈希工具
│   ├── node-server/           # 本地开发模拟
│   └── node-server.ts         # Node.js 开发服务器入口
├── schema.sql                 # D1 数据库建表 + 种子数据
├── wrangler.toml              # Cloudflare Worker 配置
├── package.json
└── Architecture.md            # 详细架构文档
```

---

## 🚀 快速开始

### 前置条件

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Cloudflare 账号（免费版即可）

### 1. 安装依赖

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. 初始化本地数据库

```bash
npm run db:init
```

### 3. 启动本地开发

两种方式：

```bash
# 方式 A：Wrangler 全栈模拟（推荐）
npm run dev

# 方式 B：Node.js + Vite 开发服务器（前端热更新）
npm run dev:node
```

### 4. 部署到 Cloudflare

```bash
# 部署到生产环境
npm run deploy
```

首次部署需要先创建 D1 数据库和 KV 命名空间：

```bash
wrangler d1 create flarepost-db
wrangler kv:namespace create flarepost-kv
```

然后将生成的 ID 填入 `wrangler.toml`。

---

## 📡 API 概览

### 公共接口

| 方法 | 路径 | 说明 |
|--------|------|------|
| GET | `/api/posts/` | 获取已发布文章列表（支持搜索、筛选、排序、分页） |
| GET | `/api/posts/:id` | 获取单篇文章 |
| GET | `/api/auth/public-key` | 获取 RSA 公钥（用于登录加密） |
| POST | `/api/auth/login` | 登录（RSA 加密密码） |
| GET | `/api/dictionaries/` | 获取字典项（公共数据） |
| GET | `/go/:id` | 短链跳转（KV 缓存加速） |
| GET | `/redirect` | 跳转安全页 |

### 管理接口（需 JWT 认证）

| 方法 | 路径 | 说明 |
|--------|------|------|
| POST | `/api/posts/` | 创建文章 |
| PUT | `/api/posts/:id` | 更新文章 |
| DELETE | `/api/posts/:id` | 删除文章 |
| GET | `/api/users/` | 获取用户列表 |
| POST | `/api/users/` | 创建用户 |
| PUT | `/api/users/:id` | 更新用户 |
| DELETE | `/api/users/:id` | 删除用户 |
| GET | `/api/menus/` | 获取菜单列表 |
| POST | `/api/menus/` | 创建菜单项 |
| PUT | `/api/menus/:id` | 更新菜单 |
| DELETE | `/api/menus/:id` | 删除菜单 |
| POST | `/api/dictionaries/` | 创建字典项 |
| PUT | `/api/dictionaries/:id` | 更新字典项 |
| DELETE | `/api/dictionaries/:id` | 删除字典项 |

---

## 🗄️ 数据库表结构

### `posts`（文章）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER PK | 文章 ID |
| title | TEXT | 标题 |
| content_md | TEXT | Markdown 内容（含 frontmatter） |
| content_type | TEXT | `markdown` 或 `richtext` |
| category_id | INTEGER | 分类 ID |
| category | TEXT | 分类名称 |
| tags | TEXT | 逗号分隔的标签 |
| status | TEXT | `published` 或 `draft` |
| created_at | DATETIME | 创建时间 |

### `links`（短链接）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | TEXT PK | 生成的短 ID |
| post_id | INTEGER | 关联文章 |
| target_url | TEXT | 目标 URL |
| clicks | INTEGER | 点击次数 |

### `users`（用户）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER PK | 用户 ID |
| username | TEXT UNIQUE | 登录名 |
| password_hash | TEXT | SHA-256 哈希 |
| role | TEXT | 角色 |
| created_at | DATETIME | 创建时间 |

### `dictionaries`（键值配置）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER PK | 项 ID |
| name | TEXT | 显示名称 |
| code | TEXT | 机器码 |
| value | TEXT | 值（`type=encode` 时 AES 加密） |
| type | TEXT | `normal` 或 `encode` |
| parent_id | INTEGER | 父级 ID（树形结构） |
| sort_order | INTEGER | 排序权重 |

### `menus`（动态菜单）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER PK | 菜单 ID |
| menu_name | TEXT | 显示名称 |
| menu_key | TEXT UNIQUE | 唯一标识 |
| parent_id | INTEGER | 父级菜单 |
| path | TEXT | Vue 路由路径 |
| type | TEXT | `directory`、`menu` 或 `button` |
| icon | TEXT | RemixIcon 图标类名 |
| status | INTEGER | 1=启用，0=禁用 |

**默认管理员：** `admin` / `admin123`

---

## 🔮 路线图

- [x] JWT 登录认证
- [ ] RSS 输出
- [ ] Telegram 推送通知
- [ ] OG 图片自动生成
- [ ] 语义搜索（Cloudflare Vectorize）
- [ ] 短链防刷与限流
- [ ] 评论/反馈系统
- [ ] 多语言支持

---

## 📄 开源协议

ISC License

---

## 🙌 致谢

基于 [Cloudflare Workers](https://workers.cloudflare.com/) 构建，使用 [Hono](https://hono.dev/)、[Vue 3](https://vuejs.org/) 和 [Tailwind CSS](https://tailwindcss.com/)。
