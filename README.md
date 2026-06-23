<div align="center">
  <img src="./frontend/public/flarepost-logo.svg" alt="FlarePost" width="400" />
  <p><strong>AI-Powered Content Platform — Deploy a full-featured CMS on Cloudflare Workers for free.</strong></p>
</div>

---

FlarePost is a monolithic content platform built entirely on [Cloudflare Workers](https://workers.cloudflare.com/). A single Worker bundles a Vue 3 SPA frontend, Hono API backend, D1 database, KV cache, short-link system, dynamic admin panel, and pluggable image storage — all deployable at zero cost on Cloudflare's free tier.

Originally designed for publishing VM/VPN/cloud deals, FlarePost is a generic content platform. Use it for blogs, offer aggregators, SEO landing pages, or any Markdown-driven publishing site.

> **Looking for backend internals?** See [docs/backend.md](docs/backend.md) for the complete backend reference.

---

## 🌟 Product Highlights

### 🏗️ Edge-Native Single-Worker Architecture
One Cloudflare Worker serves your SPA, REST API, admin panel, short links, and image proxy. Deploy anywhere on Cloudflare's 330+ city global network — no servers to manage, zero ongoing cost.

### 📝 Full-Featured Content Management
- **Markdown + Rich Text:** Edit with YAML frontmatter for structured metadata, or use the rich text toolbar.
- **Hierarchical Categories:** Tree-based dictionary system — no hardcoded taxonomies.
- **Tag System:** Searchable, filterable tags with autocomplete.
- **Draft Recovery:** Autosave protects your work-in-progress.

### 🔐 Enterprise-Grade Security
- **RSA-OAEP encrypted login** — passwords never travel in plaintext.
- **JWT authentication** (HS256, 24h expiry) for all admin operations.
- **AES-GCM encryption** for API keys, secrets, and sensitive config values at rest.
- **Link sanitization** — all external links rewritten through a whitelist-protected redirect.

### 📸 Pluggable Image Storage
- **Multiple backends:** im.ge (free), AWS S3, Cloudflare R2 — swap without code changes.
- **Storage adapter pattern** — add custom backends by implementing a simple interface.
- **Unified file management** — view, search, and delete files with remote storage cleanup.
- **Image proxy** (`/img/:id`) with placeholder SVG fallback on failure.

### 🔗 Smart Link System
- **Auto-link rewriting** — external URLs automatically become internal redirects.
- **Short links** (`/go/:id`) with KV-cached lookups and click tracking.
- **Redirect safety page** — domain whitelist + user warning for untrusted destinations.

### 🎨 Dynamic Admin Dashboard
- **Database-driven sidebar** — menus, icons, and permissions managed from the admin panel itself.
- **RemixIcon picker** — visually browse and select icons.
- **Multi-tab navigation** + fullscreen mode for efficient workflow.
- **SEO preview panel** — see how your content looks in search results.
- **Encrypted dictionary manager** — store API keys and configs securely.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Cloudflare Workers |
| **Web Framework** | [Hono](https://hono.dev/) |
| **Frontend** | Vue 3 + Vite + Tailwind CSS v4 |
| **Database** | Cloudflare D1 (SQLite) |
| **Cache** | Cloudflare KV |
| **Auth** | RSA-OAEP + JWT (HS256) |
| **Encryption** | AES-256-GCM |
| **Storage** | im.ge / AWS S3 / Cloudflare R2 |
| **Markdown** | markdown-it |
| **Local Dev** | @hono/node-server, better-sqlite3 |

---

## 🏛️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                      │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Vue SPA     │  │  Hono API    │  │  Image Proxy     │ │
│  │  (Assets)    │  │  Routes      │  │  /img/:id        │ │
│  └─────────────┘  └──────┬───────┘  └──────────────────┘ │
│                          │                                 │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │  API: /api/posts  /api/auth  /api/users            │  │
│  │       /api/dictionaries  /api/menus                │  │
│  │       /api/upload  /api/upload-configs  /api/files │  │
│  └───────────────────────┬────────────────────────────┘  │
│                          │                                 │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │  Redirect: /go/:id → KV → D1                       │  │
│  │  Safety:   /redirect → domain whitelist            │  │
│  └───────────────────────┬────────────────────────────┘  │
│                          │                                 │
├──────────────────────────┼──────────────────────────────┤
│                          │                                 │
│             ┌────────────┴────────────┐                  │
│             │  D1 (SQLite Database)   │                  │
│             │  + KV (Cache Layer)     │                  │
│             └─────────────────────────┘                  │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
flarepost/
├── frontend/                  # Vue 3 SPA (Vite)
│   ├── src/
│   │   ├── components/        # Shared UI components
│   │   ├── views/             # Home, PostDetail, Admin*
│   │   ├── locales/           # i18n (en, zh-CN)
│   │   ├── utils/             # Toast, confirm, crypto, frontmatter
│   │   ├── router.ts          # Vue Router config
│   │   └── main.ts            # App entry
│   ├── public/
│   │   ├── favicon.svg        # FlarePost flame icon
│   │   └── flarepost-logo.svg # Full brand logo
│   └── index.html
├── docs/                      # Documentation
│   ├── backend.md             # Backend reference (EN)
│   └── backend-zh.md          # Backend reference (ZH)
├── src/                       # Worker backend
│   ├── index.ts               # Worker entry point
│   ├── types.ts               # Cloudflare binding types
│   ├── hono/
│   │   └── app.ts             # Hono app + route registration
│   ├── api/                   # API route handlers
│   │   ├── auth.ts            # Login, JWT, public key
│   │   ├── posts.ts           # Post CRUD
│   │   ├── users.ts           # User management
│   │   ├── dictionaries.ts    # Key-value config manager
│   │   ├── menus.ts           # Dynamic sidebar menus
│   │   ├── upload.ts          # Image upload
│   │   ├── uploadConfigs.ts   # Storage config management
│   │   ├── files.ts           # File record management
│   │   └── redirect.ts        # Short link + redirect guard
│   ├── security/
│   │   ├── middleware.ts       # JWT auth middleware
│   │   └── crypto.ts          # RSA, AES, hashing utilities
│   ├── storage/               # Pluggable storage adapters
│   │   ├── interface.ts       # IStorageAdapter interface
│   │   ├── index.ts           # Adapter factory
│   │   ├── imge.ts            # im.ge hosting
│   │   ├── s3.ts              # AWS S3
│   │   └── r2.ts              # Cloudflare R2
│   ├── utils/
│   │   └── snowflake.ts       # Distributed ID generator
│   ├── node-server/           # Local dev emulation
│   │   ├── index.ts           # Node.js server entry
│   │   ├── db.ts              # Local D1 (better-sqlite3)
│   │   ├── kv.ts              # Local KV (file-backed)
│   │   └── bindings.ts        # Local bindings middleware
│   └── node-server.ts         # Dev server launcher
├── schema.sql                 # D1 database schema + seed data
├── wrangler.toml              # Cloudflare Worker config
├── package.json               # Backend dependencies + scripts
└── Architecture.md            # Detailed architecture document
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A Cloudflare account (free tier works)

### 1. Install dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Initialize local database
```bash
npm run db:init
```

### 3. Start local development
```bash
# Option A: Wrangler full-stack emulator (recommended)
npm run dev

# Option B: Node.js + Vite (hot-reload frontend)
npm run dev:node
```

> **Note:** Option B provides frontend HMR. The Node server at `localhost:3000` fully emulates D1 and KV.

### 4. Deploy to Cloudflare
```bash
npm run deploy
```

First-time setup requires creating Cloudflare resources:
```bash
wrangler d1 create flarepost-db
wrangler kv:namespace create flarepost-kv
```

Update the binding IDs in `wrangler.toml`, then deploy.

---

## 📡 API Overview

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/posts/` | List published posts (search, filter, sort, pagination) |
| GET | `/api/posts/:id` | Get single post |
| GET | `/api/auth/public-key` | Get RSA public key for login |
| POST | `/api/auth/login` | Login (RSA-encrypted password → JWT) |
| GET | `/api/auth/me` | Get current user (JWT-protected) |
| GET | `/api/dictionaries/` | List dictionary items (public) |
| GET | `/go/:id` | Short link redirect (KV-cached) |
| GET | `/redirect` | Redirect safety page |
| GET | `/img/:id(.*)` | Image proxy with placeholder fallback |

### Admin Endpoints (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/posts/` | Create post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| GET | `/api/users/` | List users |
| POST | `/api/users/` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/menus/` | List menus |
| POST | `/api/menus/` | Create menu item |
| PUT | `/api/menus/:id` | Update menu |
| DELETE | `/api/menus/:id` | Delete menu + children |
| POST | `/api/dictionaries/` | Create dictionary item |
| PUT | `/api/dictionaries/:id` | Update dictionary item |
| DELETE | `/api/dictionaries/:id` | Delete dictionary item + children |
| POST | `/api/upload/image` | Upload image (default config) |
| GET | `/api/upload-configs/` | List upload configs (secrets masked) |
| POST | `/api/upload-configs/` | Create upload config |
| PUT | `/api/upload-configs/:id` | Update upload config |
| DELETE | `/api/upload-configs/:id` | Delete upload config |
| POST | `/api/upload-configs/:id/test-upload` | Test upload with specific config |
| GET | `/api/files/` | List files (search, filter, paginated) |
| GET | `/api/files/:id` | Get file details |
| DELETE | `/api/files/:id` | Delete file + storage cleanup |

---

## 🗄️ Database Schema

### `posts` — Content
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Post ID |
| title | TEXT | Post title |
| content_md | TEXT | Markdown with YAML frontmatter |
| content_type | TEXT | `markdown` or `richtext` |
| category_id | INTEGER | Category ID |
| category | TEXT | Category name |
| tags | TEXT | Comma-separated tags |
| status | TEXT | `published` or `draft` |
| created_at | DATETIME | Creation timestamp |

### `links` — Short Links
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | Snowflake ID |
| post_id | INTEGER | Reference to posts |
| target_url | TEXT | Destination URL |
| clicks | INTEGER | Click counter |

### `users` — Admin Accounts
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | User ID |
| username | TEXT UNIQUE | Login name |
| password_hash | TEXT | SHA-256 hash |
| email | TEXT | Email |
| role | TEXT | User role |
| created_at | DATETIME | |

### `dictionaries` — Key-Value Config
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Item ID |
| name | TEXT | Display name |
| code | TEXT | Machine key |
| value | TEXT | AES-GCM encrypted if `type=encode` |
| type | TEXT | `normal` or `encode` |
| parent_id | INTEGER | Tree parent |
| sort_order | INTEGER | Sort weight |

### `menus` — Dynamic Sidebar
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Menu ID |
| menu_name | TEXT | Display name |
| menu_key | TEXT UNIQUE | Unique key |
| parent_id | INTEGER | Parent menu |
| path | TEXT | Vue Router path |
| icon | TEXT | RemixIcon class |
| type | TEXT | `directory`, `menu`, or `button` |
| status | INTEGER | 1=enabled, 0=disabled |

### `upload_configs` — Storage Configurations
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Config ID |
| name | TEXT | Display name |
| is_default | INTEGER | Default flag |
| storage_type | TEXT | `common`, `s3`, `r2` |
| access_key | TEXT | AES-GCM encrypted |
| secret_key | TEXT | AES-GCM encrypted |

### `files` — File Records
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | Snowflake ID |
| filename | TEXT | Original name |
| file_size | INTEGER | Size in bytes |
| original_url | TEXT | Storage URL |
| proxy_url | TEXT | Proxy URL |
| storage_type | TEXT | Adapter type |

**Default admin:** `admin` / `admin123`

---

## 🔮 Roadmap

- [x] JWT login authentication
- [ ] RSS feed generation
- [ ] Telegram bot push notifications
- [ ] OG image auto-generation
- [ ] Semantic search (Cloudflare Vectorize)
- [ ] Rate limiting & anti-abuse for short links
- [ ] Comment / feedback system
- [ ] Multi-language content support

---

## 📄 License

ISC License

---

## 🙌 Acknowledgments

Built on [Cloudflare Workers](https://workers.cloudflare.com/) with [Hono](https://hono.dev/), [Vue 3](https://vuejs.org/), and [Tailwind CSS](https://tailwindcss.com/).
