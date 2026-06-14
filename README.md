# Cloud-Web - 基于 Cloudflare 的信息发布平台

本项目是一个基于 Cloudflare Workers 的一体化信息发布平台，采用单体部署模式，集成了前端页面、Hono 后端 API、D1 数据库和 KV 缓存，并内置了短链系统。主要用于发布 VM、VPN 等优惠信息，支持编辑管理、信息搜索以及内部链接转发等功能。

## 功能特性

- **单 Worker 部署**：前端（SPA）、API 层（Hono）、管理后台、短链系统统一打包在一个 Cloudflare Worker 中，极简部署。
- **Markdown 支持**：后台支持 Markdown 格式编辑，前端完美渲染 Markdown 文档。
- **外部链接转内部短链**：添加外部 URL 会自动转换为内部地址（如 `/go/:id`），利用 KV 缓存和 D1 数据库实现快速跳转。
- **自适应设计**：移动端友好，同时兼容 PC 端，方便进行大量文档编辑。
- **低成本与高性能**：利用 Cloudflare 边缘网络（Edge）实现全球加速，结合免费额度的 KV 和 D1，极大地降低了运行成本。

## 技术栈

- **后端**：Cloudflare Workers, Hono
- **数据库与缓存**：Cloudflare D1, Cloudflare KV
- **前端**：Vite (Vue 3 / React) + TailwindCSS, markdown-it（用于 Markdown 渲染）
- **本地开发**：Hono Node Server, better-sqlite3

## 项目结构

```text
├── frontend/             # 前端 SPA 源码目录 (Vite)
├── src/                  # 后端 API 及 Worker 入口目录
│   ├── index.ts          # Worker 主入口
│   └── node-server.ts    # 本地 Node.js 调试服务
├── schema.sql            # D1 数据库建表语句
├── wrangler.toml         # Cloudflare Worker 配置文件
├── Architecture.md       # 项目详细技术方案文档
└── Task.md               # 项目需求与任务文档
```

## 快速开始

### 1. 安装依赖

```bash
npm install
cd frontend && npm install
```

### 2. 初始化本地数据库

执行以下命令，使用 `schema.sql` 初始化本地 D1 数据库：

```bash
npm run db:init
```

### 3. 本地开发调试

你可以使用以下命令启动本地开发环境。项目支持同时运行前端和后端的本地服务：

```bash
# 方式一：使用 Wrangler 进行本地全栈模拟
npm run dev

# 方式二：使用本地 Node.js 服务器及前端 Vite Dev Server 同时运行（需要本地 Node 环境支持）
npm run dev:node
```

### 4. 部署到 Cloudflare

构建前端静态资源，并部署 Worker 到 Cloudflare：

```bash
npm run deploy
```

## 数据表结构 (D1)

- `posts`：存储发布的文章信息，包含标题、Markdown 内容、分类、标签等。
- `links`：存储短链接映射关系，实现 `/go/:id` 的快速跳转。

更多技术细节和架构设计请参考 [Architecture.md](Architecture.md)。
