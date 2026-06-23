# FlarePost Backend

> **Edge-native REST API** — Built on Cloudflare Workers with Hono, D1, and KV.

---

## Overview

FlarePost's backend is a single Cloudflare Worker that serves as a headless CMS API. It handles content publishing, user authentication, short-link redirects, image uploads, file management, and more — all running on Cloudflare's global edge network.

The backend is written in **TypeScript** using the **Hono** web framework, with **D1 (SQLite-compatible)** as the primary database and **KV** as the caching layer. Local development is fully supported via `@hono/node-server` + `better-sqlite3`, enabling offline development without a Cloudflare account.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Cloudflare Worker                       │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Static      │  │  Hono API    │  │  Image Proxy     │ │
│  │  Assets (SPA)│  │  Router      │  │  /img/:id        │ │
│  └─────────────┘  └──────┬───────┘  └──────────────────┘ │
│                          │                                 │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │  API Modules                                        │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐   │  │
│  │  │Posts │ │ Auth │ │Users │ │Menus │ │Dicts   │   │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └────────┘   │  │
│  │  ┌────────┐ ┌──────────┐ ┌───────┐ ┌────────┐    │  │
│  │  │Upload  │ │Upload    │ │Files  │ │Redirect│    │  │
│  │  │        │ │Configs   │ │       │ │        │    │  │
│  │  └────────┘ └──────────┘ └───────┘ └────────┘    │  │
│  └───────────────────────┬────────────────────────────┘  │
│                          │                                 │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │  Shared Layers                                      │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────┐ │  │
│  │  │ JWT Auth   │ │ Crypto     │ │ Storage        │ │  │
│  │  │ Middleware  │ │ (RSA/AES)  │ │ Adapters       │ │  │
│  │  └────────────┘ └────────────┘ └────────────────┘ │  │
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

## Module Reference

### API Layer (`src/api/`)

| Module | File | Description |
|--------|------|-------------|
| **Posts** | `posts.ts` | Blog post CRUD with Markdown/rich text, auto-link rewriting, search, pagination |
| **Auth** | `auth.ts` | RSA public key distribution, password-based login, JWT token issuance |
| **Users** | `users.ts` | Admin user management (CRUD, role-based) |
| **Menus** | `menus.ts` | Dynamic admin sidebar menu management (hierarchical, permission-aware) |
| **Dictionaries** | `dictionaries.ts` | Key-value configuration store with AES-GCM encrypted value support |
| **Redirect** | `redirect.ts` | Short-link redirect (`/go/:id`) with KV cache + click tracking; safety redirect page with domain whitelist |
| **Upload** | `upload.ts` | Image upload endpoint using the default storage config (pluggable adapters) |
| **Upload Configs** | `uploadConfigs.ts` | Storage configuration management (im.ge, S3, R2); encrypted credential storage |
| **Files** | `files.ts` | File record management with storage cleanup on deletion |

### Security (`src/security/`)

| File | Description |
|------|-------------|
| `middleware.ts` | JWT (HS256) verification middleware for admin-protected routes |
| `crypto.ts` | RSA key pair generation & OAEP decryption; AES-256-GCM encrypt/decrypt; SHA-256 hashing |

### Storage Adapters (`src/storage/`)

Pluggable image/file storage backends via a common `IStorageAdapter` interface:

| File | Adapter | Description |
|------|---------|-------------|
| `interface.ts` | — | Type definitions: `IStorageAdapter`, `StorageConfig`, `UploadResult`, `FileRecord` |
| `imge.ts` | **im.ge** | Free image hosting (API key based) |
| `s3.ts` | **AWS S3** | S3-compatible storage (SigV4 signing) |
| `r2.ts` | **Cloudflare R2** | Cloudflare R2 object storage (SigV4 signing) |

All adapters implement: `upload(file, filename)` → `{ url, ext_config? }`, `delete(fileRecord)` → `boolean`, `getToken()` → `string | null`.

### Utilities (`src/utils/`)

| File | Description |
|------|-------------|
| `snowflake.ts` | Distributed unique ID generator (Base62 snowflake, 15 characters, ~1M IDs/sec) |

### Bootstrap & Entry

| File | Description |
|------|-------------|
| `src/index.ts` | Worker entry point — exports Hono app, registers image proxy and static asset fallback |
| `src/hono/app.ts` | Hono app bootstrap — registers all 9 route modules |
| `src/types.ts` | Cloudflare Worker binding types (`DB`, `KV`, `ASSETS`, `JWT_SECRET`) |

### Local Development (`src/node-server/`)

| File | Description |
|------|-------------|
| `index.ts` | Starts `@hono/node-server` on port 3000 with injected local bindings |
| `db.ts` | `LocalD1` — wraps `better-sqlite3` with full schema migration & seed data |
| `kv.ts` | `LocalKV` — in-memory `Map` persisted to `.kv-store.json` |
| `bindings.ts` | Middleware that injects local `DB`, `KV`, and `ASSETS` bindings into the Hono context |

---

## Complete API Reference

### Public Endpoints (No Auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/posts/` | List published posts. Supports `?q=`, `?category=`, `?tag=`, `?sort=`, `?page=`, `?page_size=` |
| `GET` | `/api/posts/:id` | Get a single post by ID |
| `GET` | `/api/auth/public-key` | Get RSA public key (JWK + PEM formats) for login |
| `POST` | `/api/auth/login` | Login with RSA-OAEP encrypted password, returns JWT token |
| `GET` | `/api/auth/me` | Get current user info (JWT-protected, returns user without password) |
| `GET` | `/api/dictionaries/` | List dictionary items (public data, encoded values masked) |
| `GET` | `/go/:id` | Short-link redirect — KV-cached, auto-tracks clicks |
| `GET` | `/redirect` | Redirect safety page — validates against domain whitelist |
| `GET` | `/img/:id(.*)` | Image proxy — fetches from original URL, returns placeholder SVG on miss |

### Admin Endpoints (JWT Bearer Token Required)

#### Posts
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/posts/` | Create post (auto-link rewriting applied) |
| `PUT` | `/api/posts/:id` | Update post |
| `DELETE` | `/api/posts/:id` | Delete post + associated links |

#### Users
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users/` | List all users |
| `POST` | `/api/users/` | Create user |
| `PUT` | `/api/users/:id` | Update user |
| `DELETE` | `/api/users/:id` | Delete user (self-deletion prevented) |

#### Menus
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/menus/` | List menus (supports `?parentId=`, `?activeOnly=true`) |
| `POST` | `/api/menus/` | Create menu item |
| `PUT` | `/api/menus/:id` | Update menu item |
| `DELETE` | `/api/menus/:id` | Delete menu item + children |

#### Dictionaries
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dictionaries/` | List dictionary items |
| `POST` | `/api/dictionaries/` | Create dictionary item |
| `PUT` | `/api/dictionaries/:id` | Update dictionary item |
| `DELETE` | `/api/dictionaries/:id` | Delete dictionary item + children |

#### Upload Configs
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/upload-configs/` | List upload configs (secrets masked as `***`) |
| `POST` | `/api/upload-configs/` | Create upload config |
| `PUT` | `/api/upload-configs/:id` | Update upload config (supports `***` placeholder for unchanged secrets) |
| `DELETE` | `/api/upload-configs/:id` | Delete upload config (default config cannot be deleted) |
| `POST` | `/api/upload-configs/:id/test-upload` | Test image upload with a specific config |

#### Upload
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload/image` | Upload image (uses default config). Accepts multipart `image` field. |

#### Files
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/files/` | List files (supports `?q=`, `?config_id=`, `?file_type=`, pagination) |
| `GET` | `/api/files/:id` | Get file details |
| `DELETE` | `/api/files/:id` | Delete file record + remote storage cleanup |

---

## Security Model

### Authentication Flow

```
Client                     Server
  │                          │
  │  GET /api/auth/public-key│
  │◄────────── RSA Pub Key ──┤
  │                          │
  │  POST /api/auth/login    │
  │  { password: RSA(pwd) }  │
  │  ──────────►              │
  │                          │── RSA-OAEP decrypt → SHA-256 → compare hash
  │◄───────── JWT Token ─────┤
  │                          │
  │  GET /api/users (JWT)    │
  │  Authorization: Bearer.. │
  │  ──────────►              │── JWT verify → process request
  │◄──────── Response ───────┤
```

1. **Password Transmission:** Client fetches RSA public key, encrypts the password with RSA-OAEP before sending.
2. **Authentication:** Server decrypts with the private key, hashes with SHA-256, compares against stored hash.
3. **Session:** Server issues a JWT (HS256, 24h expiry). Subsequent requests include it in the `Authorization` header.
4. **Admin Guard:** The `authMiddleware` in `src/security/middleware.ts` verifies the JWT on every protected route.

### Data-at-Rest Encryption

- **RSA Key Pair:** Generated on first login attempt, stored in KV.
- **AES-GCM:** Used to encrypt sensitive configuration values (`type=encode` dictionaries; `access_key`/`secret_key`/`refresh_token` in upload configs). Each encryption generates a unique IV, prepended to the ciphertext (base64-encoded).
- **Password Storage:** SHA-256 hashed, never stored in plaintext.

### Link Security

- **Auto-Link Rewriting:** All external URLs in post content are automatically rewritten to pass through the `/redirect` safety page.
- **Redirect Whitelist:** The `/redirect` endpoint validates destinations against a domain whitelist before proceeding.
- **Short Links:** KV-cached for fast lookups; click tracking enables abuse monitoring.

---

## Storage Adapter Pattern

The storage system uses a pluggable adapter pattern, allowing different image/file storage backends to be swapped without changing business logic.

### Interface

```typescript
interface IStorageAdapter {
  upload(file: File | Blob, filename: string): Promise<UploadResult>;
  delete(file: FileRecord): Promise<boolean>;
  getToken(): Promise<string | null>;
}

interface UploadResult {
  url: string;           // Public URL of the uploaded file
  ext_config?: string;   // Extra config (JSON), adapter-specific
}

interface FileRecord {
  original_url: string;
  ext_config?: string | null;
}
```

### Available Adapters

| Adapter | Type | Use Case |
|---------|------|----------|
| **im.ge** | Free hosting | Simple image hosting with API key |
| **AWS S3** | Object storage | Standard S3-compatible storage |
| **Cloudflare R2** | Object storage | S3-compatible, no egress fees |

### Adding a New Adapter

1. Create `src/storage/<name>.ts` implementing `IStorageAdapter`
2. Register it in `src/storage/index.ts` factory
3. Add the adapter type to the upload configs UI

---

## Database Schema

### `posts` — Content storage
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment post ID |
| `title` | TEXT | Post title |
| `content_md` | TEXT | Full Markdown content with YAML frontmatter |
| `content_type` | TEXT | `markdown` or `richtext` |
| `category_id` | INTEGER | Category reference |
| `category` | TEXT | Category display name |
| `tags` | TEXT | Comma-separated tags |
| `status` | TEXT | `published` or `draft` |
| `created_at` | DATETIME | Creation timestamp |

### `links` — Short links
| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Short link ID (snowflake) |
| `post_id` | INTEGER | Associated post ID |
| `target_url` | TEXT | Destination URL |
| `clicks` | INTEGER | Click counter |

### `redirect_logs` — Redirect audit trail
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `target_url` | TEXT | Redirect target |
| `referer` | TEXT | HTTP Referer header |
| `ip` | TEXT | Client IP |
| `user_agent` | TEXT | User agent string |
| `created_at` | DATETIME | Timestamp |

### `users` — Admin accounts
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment user ID |
| `username` | TEXT UNIQUE | Login username |
| `password_hash` | TEXT | SHA-256 hash of password |
| `email` | TEXT | Email address |
| `role` | TEXT | User role |
| `created_at` | DATETIME | Creation timestamp |

### `dictionaries` — Key-value configuration
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Item ID |
| `name` | TEXT | Display name |
| `code` | TEXT | Machine-readable key |
| `value` | TEXT | Value (AES-GCM encrypted if `type='encode'`) |
| `type` | TEXT | `normal` or `encode` |
| `parent_id` | INTEGER | Tree parent (nullable) |
| `sort_order` | INTEGER | Sort weight |
| `description` | TEXT | Description |
| `created_at` | DATETIME | Creation timestamp |

### `menus` — Dynamic admin sidebar
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Menu ID |
| `menu_name` | TEXT | Display name |
| `menu_key` | TEXT UNIQUE | Unique key |
| `parent_id` | INTEGER | Parent menu ID |
| `path` | TEXT | Vue Router path |
| `component` | TEXT | Component name |
| `type` | TEXT | `directory`, `menu`, or `button` |
| `sort` | INTEGER | Sort order |
| `icon` | TEXT | RemixIcon class name |
| `class_name` | TEXT | Custom CSS class |
| `url` | TEXT | External URL |
| `is_external` | INTEGER | External link flag |
| `target` | TEXT | Link target (`_blank`, etc.) |
| `permission` | TEXT | Required permission |
| `status` | INTEGER | 1=enabled, 0=disabled |
| `hidden` | INTEGER | Visibility flag |
| `redirect` | TEXT | Redirect path |
| `keep_alive` | INTEGER | Keep-alive flag |
| `created_at` | DATETIME | Creation timestamp |

### `upload_configs` — Storage configurations
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | Config name |
| `is_default` | INTEGER | Default config flag |
| `is_proxy` | INTEGER | Use proxy URL flag |
| `proxy_prefix` | TEXT | Proxy URL prefix |
| `storage_type` | TEXT | `common` (im.ge), `s3`, `r2` |
| `upload_url` | TEXT | Upload endpoint URL |
| `access_key` | TEXT | AES-GCM encrypted access key |
| `secret_key` | TEXT | AES-GCM encrypted secret key |
| `refresh_token` | TEXT | AES-GCM encrypted refresh token |
| `status` | INTEGER | 1=enabled, 0=disabled |
| `sort_order` | INTEGER | Sort weight |
| `remark` | TEXT | Notes |
| `created_at` | DATETIME | Creation timestamp |

### `files` — File records
| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Snowflake ID |
| `filename` | TEXT | Original filename |
| `file_type` | TEXT | File extension |
| `file_size` | INTEGER | Size in bytes |
| `mime_type` | TEXT | MIME type |
| `original_url` | TEXT | Uploaded URL |
| `proxy_url` | TEXT | Proxy URL (if configured) |
| `ext_config` | TEXT | Extra adapter-specific config (JSON) |
| `upload_config_id` | INTEGER | Reference to upload config |
| `storage_type` | TEXT | Storage adapter type |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

---

## Development

### Prerequisites
- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account (free tier works)

### Setup
```bash
npm install
cd frontend && npm install && cd ..
npm run db:init
```

### Local Development
```bash
# Option A: Wrangler full-stack emulator
npm run dev

# Option B: Node.js + Vite (hot-reload frontend)
npm run dev:node
```

The local Node.js server (`src/node-server/`) provides full D1 and KV emulation using `better-sqlite3` and file-based KV persistence, enabling offline development.

### Database Migrations
The full schema is defined in `schema.sql`. The local dev server auto-applies migrations on startup (`src/node-server/db.ts`).

### Testing
```bash
# Test API endpoints
npx tsx scripts/test-api.ts

# Test JWT auth flow
npx tsx scripts/test-jwt.ts
```

---

## Deployment

```bash
# Build frontend + deploy Worker
npm run deploy
```

First-time setup requires creating Cloudflare resources:
```bash
wrangler d1 create flarepost-db
wrangler kv:namespace create flarepost-kv
```

Update the binding IDs in `wrangler.toml`, then deploy.

---

## Configuration

### `wrangler.toml`
- **Worker name:** `flarepost`
- **D1 database binding:** `DB`
- **KV namespace binding:** `KV`
- **Assets:** `./frontend/dist` (Vue SPA build output)
- **JWT_SECRET:** Environment variable set via `wrangler secret put`

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `hono` | ^4.12.25 | Web framework |
| `@hono/node-server` | ^2.0.4 | Local dev server |
| `better-sqlite3` | ^12.10.1 | Local D1 emulation |
| `@cloudflare/workers-types` | ^4.20260613.1 | TypeScript types |
| `tsx` | ^4.22.4 | TypeScript execution |
| `wrangler` | ^4.100.0 | Deployment CLI |
| `typescript` | ^6.0.3 | Language |
