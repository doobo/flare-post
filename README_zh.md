<div align="center">
  <img src="./frontend/public/flarepost-logo.svg" alt="FlarePost" width="400" />
  <p><strong>AI 驱动的内容发布平台 — 在 Cloudflare Workers 上免费部署一个全功能 CMS。</strong></p>
</div>

---

FlarePost 是一个基于 [Cloudflare Workers](https://workers.cloudflare.com/) 的单体内容发布平台。一个 Worker 同时承载了 Vue 3 前端 SPA、Hono 后端 API、D1 数据库、KV 缓存、短链系统、动态管理后台和可插拔图片存储 — 全部打包在一起，部署在 Cloudflare 免费层上，成本为零。

最初为发布 VM/VPN/云服务优惠信息而设计，FlarePost 是一套通用的内容平台。你可以用它搭建博客、优惠聚合站、SEO 落地页，或任何基于 Markdown 的内容发布站点。

> **寻找后端详情？** 参见 [docs/backend-zh.md](docs/backend-zh.md) 了解完整的后端参考文档。

---

## 🌟 产品特色

### 🏗️ 边缘原生单 Worker 架构
一个 Cloudflare Worker 同时提供 SPA、REST API、管理后台、短链跳转和图片代理。部署在 Cloudflare 全球网络（330+ 城市），无需管理服务器，成本为零。

### 📝 全功能内容管理
- **Markdown + 富文本：** 支持 YAML frontmatter 结构化元数据，也可使用富文本工具栏。
- **层级分类：** 基于字典系统的树形分类，无需硬编码。
- **标签系统：** 支持搜索、筛选和自动补全。
- **草稿恢复：** 自动保存保护正在编辑的内容。

### 🔐 企业级安全
- **RSA-OAEP 加密登录** — 密码传输全程加密。
- **JWT 认证**（HS256，24 小时过期），所有管理操作需鉴权。
- **AES-GCM 加密** 存储 API 密钥、机密等敏感配置值。
- **链接净化** — 所有外部链接通过白名单保护的重定向页面。

### 📸 可插拔图片存储
- **多后端支持：** im.ge（免费）、AWS S3、Cloudflare R2 — 无需改代码即可切换。
- **存储适配器模式** — 实现简单接口即可添加自定义后端。
- **统一文件管理** — 浏览、搜索、删除文件，同步清理远端存储。
- **图片代理**（`/img/:id`），失败时自动返回占位 SVG。

### 🔗 智能链接系统
- **自动链接改写** — 文章中的外部 URL 自动转为内部重定向。
- **短链支持**（`/go/:id`）— KV 缓存加速，含点击统计。
- **安全跳转页** — 域名白名单 + 可疑链接用户警告。

### 🎨 动态管理后台
- **数据库驱动侧边栏** — 菜单、图标、权限均在后台管理。
- **RemixIcon 图标选择器** — 可视化浏览和选择图标。
- **多标签导航 + 全屏模式**，工作更高效。
- **SEO 预览面板** — 查看内容在搜索结果中的展示效果。
- **加密字典管理器** — 安全存储 API 密钥和配置。

---

## 🧱 技术栈

| 层 | 技术 |
|-------|-----------|
| **运行时** | Cloudflare Workers |
| **Web 框架** | [Hono](https://hono.dev/) |
| **前端** | Vue 3 + Vite + Tailwind CSS v4 |
| **数据库** | Cloudflare D1 (SQLite) |
| **缓存** | Cloudflare KV |
| **认证** | RSA-OAEP + JWT (HS256) |
| **加密** | AES-256-GCM |
| **存储** | im.ge / AWS S3 / Cloudflare R2 |
| **Markdown** | markdown-it |
| **本地开发** | @hono/node-server, better-sqlite3 |

---

## 🏛️ 架构

```
┌──────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                      │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Vue SPA     │  │  Hono API    │  │  图片代理        │ │
│  │  (静态资源)  │  │  路由        │  │  /img/:id        │ │
│  └─────────────┘  └──────┬───────┘  └──────────────────┘ │
│                          │                                 │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │  API: /api/posts  /api/auth  /api/users            │  │
│  │       /api/dictionaries  /api/menus                │  │
│  │       /api/upload  /api/upload-configs  /api/files │  │
│  └───────────────────────┬────────────────────────────┘  │
│                          │                                 │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │  跳转: /go/:id → KV → D1                           │  │
│  │  安全:  /redirect → 域名白名单                     │  │
│  └───────────────────────┬────────────────────────────┘  │
│                          │                                 │
├──────────────────────────┼──────────────────────────────┤
│                          │                                 │
│             ┌────────────┴────────────┐                  │
│             │  D1 (SQLite 数据库)     │                  │
│             │  + KV (缓存层)          │                  │
│             └─────────────────────────┘                  │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
flarepost/
├── frontend/                  # Vue 3 SPA (Vite)
│   ├── src/
│   │   ├── components/        # 共享 UI 组件
│   │   ├── views/             # 首页、详情页、管理后台
│   │   ├── locales/           # 国际化 (en, zh-CN)
│   │   ├── utils/             # 工具函数
│   │   ├── router.ts          # 路由配置
│   │   └── main.ts            # 入口文件
│   ├── public/
│   │   ├── favicon.svg        # FlarePost 火焰图标
│   │   └── flarepost-logo.svg # 完整品牌 Logo
│   └── index.html
├── docs/                      # 文档
│   ├── backend.md             # 后端参考 (EN)
│   └── backend-zh.md          # 后端参考 (ZH)
├── src/                       # Worker 后端
│   ├── index.ts               # Worker 入口
│   ├── types.ts               # Cloudflare 绑定类型
│   ├── hono/
│   │   └── app.ts             # Hono 应用 + 路由注册
│   ├── api/                   # API 路由处理器
│   │   ├── auth.ts            # 登录、JWT、公钥
│   │   ├── posts.ts           # 文章增删改查
│   │   ├── users.ts           # 用户管理
│   │   ├── dictionaries.ts    # 键值配置管理
│   │   ├── menus.ts           # 动态侧边栏菜单
│   │   ├── upload.ts          # 图片上传
│   │   ├── uploadConfigs.ts   # 存储配置管理
│   │   ├── files.ts           # 文件记录管理
│   │   └── redirect.ts        # 短链 + 跳转守卫
│   ├── security/
│   │   ├── middleware.ts       # JWT 认证中间件
│   │   └── crypto.ts          # RSA、AES、哈希工具
│   ├── storage/               # 可插拔存储适配器
│   │   ├── interface.ts       # IStorageAdapter 接口
│   │   ├── index.ts           # 适配器工厂
│   │   ├── imge.ts            # im.ge 托管
│   │   ├── s3.ts              # AWS S3
│   │   └── r2.ts              # Cloudflare R2
│   ├── utils/
│   │   └── snowflake.ts       # 分布式 ID 生成器
│   ├── node-server/           # 本地开发模拟
│   │   ├── index.ts           # Node.js 服务器入口
│   │   ├── db.ts              # 本地 D1 (better-sqlite3)
│   │   ├── kv.ts              # 本地 KV (文件持久化)
│   │   └── bindings.ts        # 本地绑定中间件
│   └── node-server.ts         # 开发服务器启动器
├── schema.sql                 # D1 数据库建表 + 种子数据
├── wrangler.toml              # Cloudflare Worker 配置
├── package.json               # 后端依赖 + 脚本
└── Architecture.md            # 详细架构文档
```

---

## 🚀 快速开始

### 前置条件
- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)（`npm install -g wrangler`）
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
```bash
# 方式 A：Wrangler 全栈模拟（推荐）
npm run dev

# 方式 B：Node.js + Vite（前端热更新）
npm run dev:node
```

> **提示：** 方式 B 提供前端热更新（HMR）。Node 服务器在 `localhost:3000` 完整模拟 D1 和 KV 环境。

### 4. 部署到 Cloudflare
```bash
npm run deploy
```

首次部署需要先创建 Cloudflare 资源：
```bash
wrangler d1 create flarepost-db
wrangler kv:namespace create flarepost-kv
```

然后将生成的 ID 填入 `wrangler.toml`。

---

## 📡 API 概览

### 公共接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/posts/` | 获取已发布文章列表（搜索、筛选、排序、分页） |
| GET | `/api/posts/:id` | 获取单篇文章 |
| GET | `/api/auth/public-key` | 获取 RSA 公钥（用于登录加密） |
| POST | `/api/auth/login` | 登录（RSA 加密密码 → JWT） |
| GET | `/api/auth/me` | 获取当前用户（需 JWT） |
| GET | `/api/dictionaries/` | 获取字典项（公共数据） |
| GET | `/go/:id` | 短链跳转（KV 缓存加速） |
| GET | `/redirect` | 跳转安全页 |
| GET | `/img/:id(.*)` | 图片代理（失败返回占位图） |

### 管理接口（需 JWT 认证）

| 方法 | 路径 | 说明 |
|------|------|------|
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
| DELETE | `/api/menus/:id` | 删除菜单 + 子项 |
| POST | `/api/dictionaries/` | 创建字典项 |
| PUT | `/api/dictionaries/:id` | 更新字典项 |
| DELETE | `/api/dictionaries/:id` | 删除字典项 + 子项 |
| POST | `/api/upload/image` | 上传图片（默认配置） |
| GET | `/api/upload-configs/` | 获取上传配置列表（凭据脱敏） |
| POST | `/api/upload-configs/` | 创建上传配置 |
| PUT | `/api/upload-configs/:id` | 更新上传配置 |
| DELETE | `/api/upload-configs/:id` | 删除上传配置 |
| POST | `/api/upload-configs/:id/test-upload` | 测试上传配置 |
| GET | `/api/files/` | 获取文件列表（搜索、筛选、分页） |
| GET | `/api/files/:id` | 获取文件详情 |
| DELETE | `/api/files/:id` | 删除文件 + 存储清理 |

---

## 🗄️ 数据库表结构

### `posts` — 文章
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 文章 ID |
| title | TEXT | 标题 |
| content_md | TEXT | Markdown（含 YAML frontmatter） |
| content_type | TEXT | `markdown` 或 `richtext` |
| category_id | INTEGER | 分类 ID |
| category | TEXT | 分类名称 |
| tags | TEXT | 逗号分隔的标签 |
| status | TEXT | `published` 或 `draft` |
| created_at | DATETIME | 创建时间 |

### `links` — 短链接
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 雪花 ID |
| post_id | INTEGER | 关联文章 |
| target_url | TEXT | 目标 URL |
| clicks | INTEGER | 点击次数 |

### `users` — 管理员账号
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 用户 ID |
| username | TEXT UNIQUE | 登录名 |
| password_hash | TEXT | SHA-256 哈希 |
| email | TEXT | 邮箱 |
| role | TEXT | 角色 |
| created_at | DATETIME | 创建时间 |

### `dictionaries` — 键值配置
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 项 ID |
| name | TEXT | 显示名称 |
| code | TEXT | 机器码 |
| value | TEXT | AES-GCM 加密（`type=encode` 时） |
| type | TEXT | `normal` 或 `encode` |
| parent_id | INTEGER | 父级 ID |
| sort_order | INTEGER | 排序权重 |

### `menus` — 动态菜单
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 菜单 ID |
| menu_name | TEXT | 显示名称 |
| menu_key | TEXT UNIQUE | 唯一标识 |
| parent_id | INTEGER | 父级菜单 |
| path | TEXT | Vue 路由路径 |
| icon | TEXT | RemixIcon 图标 |
| type | TEXT | `directory`、`menu` 或 `button` |
| status | INTEGER | 1=启用，0=禁用 |

### `upload_configs` — 上传配置
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 配置 ID |
| name | TEXT | 显示名称 |
| is_default | INTEGER | 默认标记 |
| storage_type | TEXT | `common`、`s3`、`r2` |
| access_key | TEXT | AES-GCM 加密 |
| secret_key | TEXT | AES-GCM 加密 |

### `files` — 文件记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 雪花 ID |
| filename | TEXT | 原始文件名 |
| file_size | INTEGER | 字节大小 |
| original_url | TEXT | 存储 URL |
| proxy_url | TEXT | 代理 URL |
| storage_type | TEXT | 适配器类型 |

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
- [ ] 多语言内容支持

---

## 📄 开源协议

ISC License

---

## 🙌 致谢

基于 [Cloudflare Workers](https://workers.cloudflare.com/) 构建，使用 [Hono](https://hono.dev/)、[Vue 3](https://vuejs.org/) 和 [Tailwind CSS](https://tailwindcss.com/)。
