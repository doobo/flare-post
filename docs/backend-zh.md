# FlarePost 后端

> **边缘原生 REST API** — 基于 Cloudflare Workers + Hono + D1 + KV 构建。

---

## 概述

FlarePost 后端是一个 Cloudflare Worker，作为无头 CMS API 提供服务。它处理内容发布、用户认证、短链跳转、图片上传、文件管理等全部功能，运行在 Cloudflare 全球边缘网络上。

后端使用 **TypeScript** 编写，基于 **Hono** Web 框架，以 **D1（SQLite 兼容）** 为主数据库，**KV** 作为缓存层。本地开发通过 `@hono/node-server` + `better-sqlite3` 完全模拟，无需 Cloudflare 账号即可离线开发。

---

## 架构

```
┌──────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                      │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  静态资源    │  │  Hono API    │  │  图片代理         │ │
│  │  (SPA)      │  │  路由        │  │  /img/:id        │ │
│  └─────────────┘  └──────┬───────┘  └──────────────────┘ │
│                          │                                 │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │  API 模块                                           │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐   │  │
│  │  │文章  │ │认证  │ │用户  │ │菜单  │ │字典    │   │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └────────┘   │  │
│  │  ┌────────┐ ┌──────────┐ ┌───────┐ ┌────────┐    │  │
│  │  │上传    │ │上传配置  │ │文件   │ │跳转    │    │  │
│  │  └────────┘ └──────────┘ └───────┘ └────────┘    │  │
│  └───────────────────────┬────────────────────────────┘  │
│                          │                                 │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │  共享层                                             │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────┐ │  │
│  │  │ JWT 中间件 │ │ 加密模块   │ │ 存储适配器     │ │  │
│  │  │            │ │(RSA/AES)   │ │ (S3/R2/im.ge)  │ │  │
│  │  └────────────┘ └────────────┘ └────────────────┘ │  │
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

## 模块说明

### API 层 (`src/api/`)

| 模块 | 文件 | 说明 |
|------|------|------|
| **文章** | `posts.ts` | 文章增删改查，Markdown/富文本，自动链接改写，搜索分页 |
| **认证** | `auth.ts` | RSA 公钥分发，密码登录，JWT 签发 |
| **用户** | `users.ts` | 管理员用户管理（增删改查，角色控制） |
| **菜单** | `menus.ts` | 后台动态侧边栏菜单管理（层级结构，权限感知） |
| **字典** | `dictionaries.ts` | 键值配置管理，支持 AES-GCM 加密存储敏感值 |
| **跳转** | `redirect.ts` | 短链跳转（`/go/:id`）+ KV 缓存 + 点击统计；安全跳转页 + 域名白名单 |
| **上传** | `upload.ts` | 图片上传接口，使用默认存储配置 |
| **上传配置** | `uploadConfigs.ts` | 存储配置管理（im.ge、S3、R2），凭据加密存储 |
| **文件** | `files.ts` | 文件记录管理，删除时同步清理远端存储 |

### 安全层 (`src/security/`)

| 文件 | 说明 |
|------|------|
| `middleware.ts` | JWT (HS256) 验证中间件，保护管理接口 |
| `crypto.ts` | RSA 密钥对生成 & OAEP 解密；AES-256-GCM 加密/解密；SHA-256 哈希 |

### 存储适配器 (`src/storage/`)

通过统一的 `IStorageAdapter` 接口实现可插拔的存储后端：

| 文件 | 适配器 | 说明 |
|------|--------|------|
| `interface.ts` | — | 类型定义：`IStorageAdapter`、`StorageConfig`、`UploadResult`、`FileRecord` |
| `imge.ts` | **im.ge** | 免费图片托管（API Key） |
| `s3.ts` | **AWS S3** | S3 兼容存储（SigV4 签名） |
| `r2.ts` | **Cloudflare R2** | Cloudflare R2 对象存储（SigV4 签名） |

所有适配器实现：`upload(file, filename)` → `{ url, ext_config? }`，`delete(fileRecord)` → `boolean`，`getToken()` → `string | null`。

### 工具 (`src/utils/`)

| 文件 | 说明 |
|------|------|
| `snowflake.ts` | 分布式唯一 ID 生成器（Base62 雪花算法，15 字符，~100 万 ID/秒） |

### 启动与入口

| 文件 | 说明 |
|------|------|
| `src/index.ts` | Worker 入口 — 导出 Hono 应用，注册图片代理和静态资源兜底 |
| `src/hono/app.ts` | Hono 应用初始化 — 注册全部 9 个路由模块 |
| `src/types.ts` | Cloudflare Worker 绑定类型（`DB`、`KV`、`ASSETS`、`JWT_SECRET`） |

### 本地开发 (`src/node-server/`)

| 文件 | 说明 |
|------|------|
| `index.ts` | 启动 `@hono/node-server`（端口 3000），注入本地绑定 |
| `db.ts` | `LocalD1` — 封装 `better-sqlite3`，自动执行建表和种子数据 |
| `kv.ts` | `LocalKV` — 内存 `Map`，持久化到 `.kv-store.json` |
| `bindings.ts` | 中间件，向 Hono 上下文注入本地 `DB`、`KV`、`ASSETS` |

---

## 完整 API 参考

### 公共接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/posts/` | 获取已发布文章列表（支持 `?q=`、`?category=`、`?tag=`、`?sort=`、`?page=`、`?page_size=`） |
| `GET` | `/api/posts/:id` | 获取单篇文章 |
| `GET` | `/api/auth/public-key` | 获取 RSA 公钥（JWK + PEM 格式），用于登录加密 |
| `POST` | `/api/auth/login` | 登录（RSA-OAEP 加密密码），返回 JWT |
| `GET` | `/api/auth/me` | 获取当前用户信息（需 JWT） |
| `GET` | `/api/dictionaries/` | 获取字典列表（编码值脱敏） |
| `GET` | `/go/:id` | 短链跳转 — KV 缓存加速，自动统计点击 |
| `GET` | `/redirect` | 安全跳转页 — 域名白名单校验 |
| `GET` | `/img/:id(.*)` | 图片代理 — 获取原图，失败返回占位 SVG |

### 管理接口（需 JWT Bearer Token）

#### 文章
| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/posts/` | 创建文章（自动链接改写） |
| `PUT` | `/api/posts/:id` | 更新文章 |
| `DELETE` | `/api/posts/:id` | 删除文章及关联链接 |

#### 用户
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/users/` | 获取用户列表 |
| `POST` | `/api/users/` | 创建用户 |
| `PUT` | `/api/users/:id` | 更新用户 |
| `DELETE` | `/api/users/:id` | 删除用户（禁止删除自己） |

#### 菜单
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/menus/` | 获取菜单列表（支持 `?parentId=`、`?activeOnly=true`） |
| `POST` | `/api/menus/` | 创建菜单项 |
| `PUT` | `/api/menus/:id` | 更新菜单项 |
| `DELETE` | `/api/menus/:id` | 删除菜单项及子项 |

#### 字典
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/dictionaries/` | 获取字典列表 |
| `POST` | `/api/dictionaries/` | 创建字典项 |
| `PUT` | `/api/dictionaries/:id` | 更新字典项 |
| `DELETE` | `/api/dictionaries/:id` | 删除字典项及子项 |

#### 上传配置
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/upload-configs/` | 获取上传配置列表（凭据脱敏为 `***`） |
| `POST` | `/api/upload-configs/` | 创建上传配置 |
| `PUT` | `/api/upload-configs/:id` | 更新上传配置（支持 `***` 占位符保留原值） |
| `DELETE` | `/api/upload-configs/:id` | 删除上传配置（默认配置不可删除） |
| `POST` | `/api/upload-configs/:id/test-upload` | 测试指定配置的上传功能 |

#### 上传
| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/upload/image` | 上传图片（使用默认配置）。接受 multipart `image` 字段。 |

#### 文件
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/files/` | 获取文件列表（支持 `?q=`、`?config_id=`、`?file_type=`、分页） |
| `GET` | `/api/files/:id` | 获取文件详情 |
| `DELETE` | `/api/files/:id` | 删除文件记录 + 清理远端存储 |

---

## 安全模型

### 认证流程

```
客户端                       服务器
  │                          │
  │  GET /api/auth/public-key│
  │◄────────── RSA 公钥 ─────┤
  │                          │
  │  POST /api/auth/login    │
  │  { password: RSA(pwd) }  │
  │  ──────────►              │
  │                          │── RSA-OAEP 解密 → SHA-256 → 比对哈希
  │◄───────── JWT Token ─────┤
  │                          │
  │  GET /api/users (JWT)    │
  │  Authorization: Bearer.. │
  │  ──────────►              │── JWT 验证 → 处理请求
  │◄──────── 响应 ───────────┤
```

1. **密码传输：** 客户端获取 RSA 公钥，使用 RSA-OAEP 加密密码后再发送。
2. **身份验证：** 服务器用私钥解密，SHA-256 哈希后与存储的哈希值比对。
3. **会话：** 服务器签发 JWT（HS256，24 小时过期）。后续请求通过 `Authorization` 头携带。
4. **管理保护：** `src/security/middleware.ts` 中的 `authMiddleware` 在每个受保护路由上验证 JWT。

### 存储加密

- **RSA 密钥对：** 首次登录时生成，存储在 KV 中。
- **AES-GCM：** 用于加密敏感配置值（`type=encode` 字典项；上传配置中的 access_key/secret_key/refresh_token）。每次加密生成唯一 IV，与密文拼接后 Base64 编码。
- **密码存储：** SHA-256 哈希，永不存储明文。

### 链接安全

- **自动链接改写：** 文章中的外部 URL 自动改写为经过 `/redirect` 安全页面的内部链接。
- **跳转白名单：** `/redirect` 接口在跳转前验证目标域名是否在白名单内。
- **短链：** KV 缓存加速查询，点击统计支持滥用监控。

---

## 存储适配器模式

存储系统采用可插拔的适配器模式，可在不影响业务逻辑的情况下切换不同的存储后端。

### 接口定义

```typescript
interface IStorageAdapter {
  upload(file: File | Blob, filename: string): Promise<UploadResult>;
  delete(file: FileRecord): Promise<boolean>;
  getToken(): Promise<string | null>;
}

interface UploadResult {
  url: string;           // 文件公开 URL
  ext_config?: string;   // 额外配置（JSON），适配器特定
}

interface FileRecord {
  original_url: string;
  ext_config?: string | null;
}
```

### 可用适配器

| 适配器 | 类型 | 适用场景 |
|--------|------|----------|
| **im.ge** | 免费托管 | 简单的 API Key 图片托管 |
| **AWS S3** | 对象存储 | 标准 S3 兼容存储 |
| **Cloudflare R2** | 对象存储 | S3 兼容，免出口费 |

### 添加新适配器

1. 创建 `src/storage/<name>.ts`，实现 `IStorageAdapter`
2. 在 `src/storage/index.ts` 工厂中注册
3. 在上传配置 UI 中添加新的适配器类型

---

## 数据库表结构

### `posts` — 文章存储
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER PK | 自增文章 ID |
| `title` | TEXT | 文章标题 |
| `content_md` | TEXT | Markdown 全文（含 YAML frontmatter） |
| `content_type` | TEXT | `markdown` 或 `richtext` |
| `category_id` | INTEGER | 分类 ID |
| `category` | TEXT | 分类名称 |
| `tags` | TEXT | 逗号分隔的标签 |
| `status` | TEXT | `published` 或 `draft` |
| `created_at` | DATETIME | 创建时间 |

### `links` — 短链接
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PK | 短链 ID（雪花算法） |
| `post_id` | INTEGER | 关联文章 ID |
| `target_url` | TEXT | 目标 URL |
| `clicks` | INTEGER | 点击次数 |

### `redirect_logs` — 跳转审计日志
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER PK | 自增 |
| `target_url` | TEXT | 跳转目标 |
| `referer` | TEXT | HTTP Referer |
| `ip` | TEXT | 客户端 IP |
| `user_agent` | TEXT | UA 字符串 |
| `created_at` | DATETIME | 时间戳 |

### `users` — 管理员账号
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER PK | 自增用户 ID |
| `username` | TEXT UNIQUE | 登录用户名 |
| `password_hash` | TEXT | SHA-256 密码哈希 |
| `email` | TEXT | 邮箱 |
| `role` | TEXT | 角色 |
| `created_at` | DATETIME | 创建时间 |

### `dictionaries` — 键值配置
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER PK | 项 ID |
| `name` | TEXT | 显示名称 |
| `code` | TEXT | 机器码 |
| `value` | TEXT | 值（`type='encode'` 时 AES-GCM 加密） |
| `type` | TEXT | `normal` 或 `encode` |
| `parent_id` | INTEGER | 父级 ID（可空） |
| `sort_order` | INTEGER | 排序权重 |
| `description` | TEXT | 描述 |
| `created_at` | DATETIME | 创建时间 |

### `menus` — 动态后台菜单
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER PK | 菜单 ID |
| `menu_name` | TEXT | 显示名称 |
| `menu_key` | TEXT UNIQUE | 唯一标识 |
| `parent_id` | INTEGER | 父级菜单 ID |
| `path` | TEXT | Vue Router 路径 |
| `component` | TEXT | 组件名 |
| `type` | TEXT | `directory`、`menu` 或 `button` |
| `sort` | INTEGER | 排序 |
| `icon` | TEXT | RemixIcon 图标类名 |
| `class_name` | TEXT | 自定义 CSS 类 |
| `url` | TEXT | 外部链接 |
| `is_external` | INTEGER | 外部链接标记 |
| `target` | TEXT | 链接目标（`_blank` 等） |
| `permission` | TEXT | 所需权限 |
| `status` | INTEGER | 1=启用，0=禁用 |
| `hidden` | INTEGER | 可见性 |
| `redirect` | TEXT | 重定向路径 |
| `keep_alive` | INTEGER | 缓存标记 |
| `created_at` | DATETIME | 创建时间 |

### `upload_configs` — 上传配置
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER PK | 自增 |
| `name` | TEXT | 配置名称 |
| `is_default` | INTEGER | 默认配置标记 |
| `is_proxy` | INTEGER | 是否使用代理地址 |
| `proxy_prefix` | TEXT | 代理 URL 前缀 |
| `storage_type` | TEXT | `common`（im.ge）、`s3`、`r2` |
| `upload_url` | TEXT | 上传接口地址 |
| `access_key` | TEXT | AES-GCM 加密的 Access Key |
| `secret_key` | TEXT | AES-GCM 加密的 Secret Key |
| `refresh_token` | TEXT | AES-GCM 加密的 Refresh Token |
| `status` | INTEGER | 1=启用，0=禁用 |
| `sort_order` | INTEGER | 排序权重 |
| `remark` | TEXT | 备注 |
| `created_at` | DATETIME | 创建时间 |

### `files` — 文件记录
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PK | 雪花 ID |
| `filename` | TEXT | 原始文件名 |
| `file_type` | TEXT | 文件扩展名 |
| `file_size` | INTEGER | 字节大小 |
| `mime_type` | TEXT | MIME 类型 |
| `original_url` | TEXT | 上传后的 URL |
| `proxy_url` | TEXT | 代理地址（如有配置） |
| `ext_config` | TEXT | 适配器特定配置（JSON） |
| `upload_config_id` | INTEGER | 关联上传配置 |
| `storage_type` | TEXT | 存储适配器类型 |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

---

## 开发指南

### 前置条件
- Node.js 18+
- Wrangler CLI（`npm install -g wrangler`）
- Cloudflare 账号（免费版即可）

### 安装
```bash
npm install
cd frontend && npm install && cd ..
npm run db:init
```

### 本地开发
```bash
# 方式 A：Wrangler 全栈模拟
npm run dev

# 方式 B：Node.js + Vite（前端热更新）
npm run dev:node
```

本地 Node.js 服务器（`src/node-server/`）使用 `better-sqlite3` 和基于文件的 KV 持久化，完整模拟 D1 和 KV，支持完全离线开发。

### 数据库迁移
完整建表语句定义在 `schema.sql`。本地开发服务器启动时自动执行迁移（`src/node-server/db.ts`）。

### 测试
```bash
# 测试 API 接口
npx tsx scripts/test-api.ts

# 测试 JWT 认证流程
npx tsx scripts/test-jwt.ts
```

---

## 部署

```bash
# 构建前端 + 部署 Worker
npm run deploy
```

首次部署需要创建 Cloudflare 资源：
```bash
wrangler d1 create flarepost-db
wrangler kv:namespace create flarepost-kv
```

将生成的绑定 ID 填入 `wrangler.toml`，然后部署。

---

## 配置

### `wrangler.toml`
- **Worker 名称：** `flarepost`
- **D1 数据库绑定：** `DB`
- **KV 命名空间绑定：** `KV`
- **静态资源：** `./frontend/dist`（Vue SPA 构建输出）
- **JWT_SECRET：** 通过 `wrangler secret put` 设置的环境变量

---

## 依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `hono` | ^4.12.25 | Web 框架 |
| `@hono/node-server` | ^2.0.4 | 本地开发服务器 |
| `better-sqlite3` | ^12.10.1 | 本地 D1 模拟 |
| `@cloudflare/workers-types` | ^4.20260613.1 | TypeScript 类型定义 |
| `tsx` | ^4.22.4 | TypeScript 执行 |
| `wrangler` | ^4.100.0 | 部署 CLI |
| `typescript` | ^6.0.3 | 编程语言 |
