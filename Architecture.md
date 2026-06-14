Cloudflare Worker 一体化信息发布平台
一、架构模式概述
本方案采用 Cloudflare Worker 单体部署模式（Mode A），实现：
前端（Vue/React/Vite）打包进 Worker
后端 API（Hono）
D1 数据库
KV 缓存
/go 短链系统
管理后台（同一 Worker 内）
---
二、核心架构
```
Cloudflare Worker（唯一运行单元）
├── 前端 SPA（Vite build 静态资源）
├── API 层（Hono）
├── Admin 管理后台
├── /go/:id 短链跳转
└── 静态资源服务（assets）
        ↓
   D1 + KV
```
---
三、技术选型
前端
Vite + Vue3（或 React）
TailwindCSS（推荐）
Markdown 渲染：markdown-it
后端
Cloudflare Workers
Hono（路由框架）
Drizzle（可选）
数据层
Cloudflare D1（主数据库）
Cloudflare KV（缓存 + 短链加速）
---
四、部署结构
wrangler.toml
```
name = "info-platform"
main = "src/index.ts"
compatibility_date = "2026-06-14"

assets = { directory = "./dist" }

[[d1_databases]]
binding = "DB"
database_name = "info_db"

[[kv_namespaces]]
binding = "KV"
```
---
五、Worker 入口设计
```ts
import { Hono } from "hono";

const app = new Hono();

/* API */
app.get("/api/posts", async (c) => {
  return c.json([{ title: "hello world" }]);
});

/* 短链系统 */
app.get("/go/:id", async (c) => {
  const id = c.req.param("id");

  const cached = await c.env.KV.get(id);
  if (cached) return c.redirect(cached, 302);

  const data = await c.env.DB
    .prepare("SELECT target_url FROM links WHERE id=?")
    .bind(id)
    .first();

  if (!data) return c.text("Not Found", 404);

  await c.env.KV.put(id, data.target_url);

  return c.redirect(data.target_url, 302);
});

/* 前端静态资源 */
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
```
---
六、前端打包方式
1. Vite build
```
npm run build
→ dist/
```
2. Worker 自动托管
Cloudflare assets 会自动接管 dist：
index.html
js/css/js chunk
---
七、数据结构（D1）
posts
id
title
content_md
category
tags
status
created_at
---
links（短链）
id
post_id
target_url
clicks
---
八、功能模块
1. 信息发布
Markdown 编辑
API 写入 D1
2. 信息展示
前端 SPA 渲染
markdown-it 解析
3. 短链系统
/go/:id
KV 优先
D1 fallback
4. 搜索系统
LIKE 查询（MVP）
后续升级 FTS5
---
九、优势分析
✔ 极简部署
1 Worker 即完整系统
✔ 成本极低
无服务器
KV + D1 免费层可用
✔ Edge 性能
全球节点运行
✔ cloud-mail 同架构
已验证成熟模式
---
十、适用场景
VPN / VM 优惠站
导流信息站
Markdown 内容站
SEO 内容发布系统
---
十一、扩展方向
JWT 登录系统
RSS 输出
Telegram 推送
OG 图片生成
语义搜索（Vectorize）
防刷短链系统
---
十二、总结
该模式为：
> Cloudflare Worker 单体 CMS（cloud-mail 风格）
特点：
极简
高性能
易部署
极低成本