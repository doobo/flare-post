<div align="center">
  <img src="./frontend/public/flarepost-logo.svg" alt="FlarePost" width="400" />
  <p><strong>AI-Powered Content Platform — Deploy a full-featured content management system on Cloudflare Workers for free.</strong></p>
</div>

---

FlarePost is a monolithic content publishing platform built entirely on [Cloudflare Workers](https://workers.cloudflare.com/). A single Worker bundles a Vue 3 SPA frontend, Hono API backend, D1 database, KV cache, short-link system, and a full admin panel — all deployable at zero cost on Cloudflare's free tier.

Originally designed for publishing VM/VPN/cloud deals, FlarePost is a generic content platform. Use it for blogs, offer aggregators, SEO landing pages, or any Markdown-driven publishing site.

---

## ✨ Features

### 🏗️ Single-Worker Architecture
- **One Worker, everything.** Frontend SPA, REST API, admin panel, short-link redirects — all bundled in a single Cloudflare Worker deployment.
- **Edge-native.** Runs on Cloudflare's global network (330+ cities). No servers to manage.

### 📝 Content Management
- **Markdown editing** with YAML frontmatter for structured metadata (discounts, promo codes, validity dates).
- **Rich text editor** with toolbar support as an alternative.
- **Category tree** via a hierarchical dictionary system (not hardcoded).
- **Tag system** with search and filtering.
- **Autosave & draft recovery** in the admin editor.

### 🔗 Smart Link System
- **Auto-link rewriting:** External URLs in posts are automatically converted to internal redirects (`/redirect?url=...`).
- **Short link support** (`/go/:id`) with KV-cached lookups and click tracking.
- **Redirect safety page** with domain whitelist and user warning for untrusted destinations.

### 🔐 Enterprise-Grade Security
- **RSA-OAEP encryption** for login password transmission.
- **JWT authentication** (HS256, 24h expiry) for all admin operations.
- **AES-GCM encryption** for sensitive configuration values (API keys, secrets).
- **External link sanitization** — all outgoing links are intercepted and screened.

### 🎨 Admin Dashboard
- Dynamic sidebar menus (database-driven, hot-reloadable).
- Hierarchical menu/icon manager with RemixIcon picker.
- User management with CRUD.
- SEO preview panel.
- Multi-tab navigation and fullscreen mode.
- Dictionary (key-value config) manager with encrypted value support.

### ⚡ Performance & UX
- **KV-cached short links** for instant redirects.
- **Skeleton loading** and pagination on the home page.
- **Search with debounce** and text highlighting.
- **Countdown timers** for time-sensitive offers.
- **Mobile-first responsive design** with slide-out category menu.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Cloudflare Workers |
| **Framework** | [Hono](https://hono.dev/) |
| **Frontend** | Vue 3 + Vite + Tailwind CSS v4 |
| **Database** | Cloudflare D1 (SQLite) |
| **Cache** | Cloudflare KV |
| **Auth** | RSA-OAEP + JWT (HS256) |
| **Markdown** | markdown-it |
| **Local Dev** | @hono/node-server, better-sqlite3 |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────┐
│              Cloudflare Worker                  │
│                                                  │
│   ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│   │  Vue SPA  │  │ Hono API │  │ Admin Panel │  │
│   │ (Assets)  │  │  Routes  │  │   (SPA)     │  │
│   └──────────┘  └────┬─────┘  └─────────────┘  │
│                      │                           │
│   ┌──────────────────┴──────────────────────┐   │
│   │  /api/posts  /api/auth  /api/users      │   │
│   │  /api/dictionaries  /api/menus          │   │
│   └──────────────────┬──────────────────────┘   │
│                      │                           │
│   ┌──────────────────┴──────────────────────┐   │
│   │  Short Link: /go/:id  →  KV → D1       │   │
│   │  Redirect Guard: /redirect → whitelist  │   │
│   └──────────────────┬──────────────────────┘   │
│                      │                           │
├──────────────────────┼──────────────────────────┤
│                      │                           │
│          ┌───────────┴───────────┐              │
│          │     D1 (SQLite)       │              │
│          │   + KV (Cache)        │              │
│          └───────────────────────┘              │
└─────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
flarepost/
├── frontend/                  # Vue 3 SPA (Vite)
│   ├── src/
│   │   ├── components/        # NavBar, ConfirmDialog
│   │   ├── views/             # Home, PostDetail, Admin*
│   │   ├── utils/             # toast, confirm, crypto, frontmatter
│   │   ├── router.ts          # Vue Router config
│   │   ├── main.ts            # App entry
│   │   └── style.css          # Tailwind + global styles
│   ├── public/
│   │   ├── favicon.svg        # FlarePost flame icon
│   │   └── flarepost-logo.svg # Full brand logo
│   └── index.html
├── src/                       # Worker backend
│   ├── index.ts               # Worker entry point
│   ├── types.ts               # Cloudflare binding types
│   ├── hono/
│   │   └── app.ts             # Hono app + route registration
│   ├── api/
│   │   ├── auth.ts            # Login, JWT, public key
│   │   ├── posts.ts           # Post CRUD
│   │   ├── users.ts           # User management
│   │   ├── dictionaries.ts    # Key-value config
│   │   ├── menus.ts           # Dynamic sidebar menus
│   │   └── redirect.ts        # Short link + redirect guard
│   ├── security/
│   │   ├── middleware.ts       # JWT auth middleware
│   │   └── crypto.ts          # RSA, AES, hashing utilities
│   ├── node-server/           # Local dev emulation
│   │   ├── index.ts, db.ts, kv.ts, bindings.ts
│   └── node-server.ts         # Node.js dev server entry
├── schema.sql                 # D1 database schema + seed data
├── wrangler.toml              # Cloudflare Worker config
├── package.json
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

Two options:

```bash
# Option A: Wrangler full-stack emulator (recommended)
npm run dev

# Option B: Node.js + Vite dev server (hot reload frontend)
npm run dev:node
```

### 4. Deploy to Cloudflare

```bash
# Deploy to production
npm run deploy
```

You'll need to create the D1 database and KV namespace first:

```bash
wrangler d1 create flarepost-db
wrangler kv:namespace create flarepost-kv
```

Then update the IDs in `wrangler.toml`.

---

## 📡 API Overview

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/posts/` | List published posts (with search, filter, sort, pagination) |
| GET | `/api/posts/:id` | Get single post |
| GET | `/api/auth/public-key` | Get RSA public key for login |
| POST | `/api/auth/login` | Login (RSA-encrypted password) |
| GET | `/api/dictionaries/` | List dictionary items (public data) |
| GET | `/go/:id` | Short link redirect (KV-cached) |
| GET | `/redirect` | Redirect safety page |

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
| DELETE | `/api/menus/:id` | Delete menu |
| POST | `/api/dictionaries/` | Create dictionary item |
| PUT | `/api/dictionaries/:id` | Update dictionary item |
| DELETE | `/api/dictionaries/:id` | Delete dictionary item |

---

## 🗄️ Database Schema

### `posts`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Post ID |
| title | TEXT | Post title |
| content_md | TEXT | Markdown content with frontmatter |
| content_type | TEXT | `markdown` or `richtext` |
| category_id | INTEGER | Category ID |
| category | TEXT | Category display name |
| tags | TEXT | Comma-separated tags |
| status | TEXT | `published` or `draft` |
| created_at | DATETIME | Creation timestamp |

### `links` (Short Links)
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | Generated short ID |
| post_id | INTEGER | Reference to posts |
| target_url | TEXT | Destination URL |
| clicks | INTEGER | Click counter |

### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | User ID |
| username | TEXT UNIQUE | Login name |
| password_hash | TEXT | SHA-256 hash |
| role | TEXT | User role |
| created_at | DATETIME | |

### `dictionaries` (Key-Value Config)
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Item ID |
| name | TEXT | Display name |
| code | TEXT | Machine key |
| value | TEXT | Value (AES-encrypted if `type=encode`) |
| type | TEXT | `normal` or `encode` |
| parent_id | INTEGER | Tree parent |
| sort_order | INTEGER | Sort weight |

### `menus` (Dynamic Sidebar)
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Menu ID |
| menu_name | TEXT | Display name |
| menu_key | TEXT UNIQUE | Unique key |
| parent_id | INTEGER | Parent menu |
| path | TEXT | Vue Router path |
| type | TEXT | `directory`, `menu`, or `button` |
| icon | TEXT | RemixIcon class |
| status | INTEGER | 1=enabled, 0=disabled |

**Default admin:** `admin` / `admin123`

---

## 🔮 Roadmap

- [ ] JWT-based login system (✅ implemented)
- [ ] RSS feed generation
- [ ] Telegram bot push notifications
- [ ] OG image generation
- [ ] Semantic search (Cloudflare Vectorize)
- [ ] Rate limiting & anti-abuse for short links
- [ ] Comment/feedback system
- [ ] Multi-language support

---

## 📄 License

ISC License

---

## 🙌 Acknowledgments

Built on [Cloudflare Workers](https://workers.cloudflare.com/) with [Hono](https://hono.dev/), [Vue 3](https://vuejs.org/), and [Tailwind CSS](https://tailwindcss.com/).
