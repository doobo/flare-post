import { serve } from '@hono/node-server';
import app from './index';
import Database from 'better-sqlite3';

// Emulate KV
class LocalKV {
  store = new Map<string, string>();
  async get(key: string) { return this.store.get(key) || null; }
  async put(key: string, value: string) { this.store.set(key, value); }
}

// Emulate D1
class LocalD1 {
  db: any;
  constructor(filename: string) {
    this.db = new Database(filename);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content_md TEXT NOT NULL,
        category TEXT NOT NULL,
        tags TEXT,
        status TEXT NOT NULL DEFAULT 'published',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        post_id INTEGER,
        target_url TEXT NOT NULL,
        clicks INTEGER DEFAULT 0,
        FOREIGN KEY (post_id) REFERENCES posts(id)
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO users (id, username, password_hash, email, role) 
      VALUES (1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin@example.com', 'admin');
      CREATE TABLE IF NOT EXISTS dictionaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        value TEXT,
        type TEXT NOT NULL DEFAULT 'normal',
        parent_id INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_name TEXT NOT NULL,
        menu_key TEXT UNIQUE NOT NULL,
        parent_id INTEGER NOT NULL DEFAULT 0,
        path TEXT,
        component TEXT,
        type TEXT NOT NULL DEFAULT 'menu',
        sort INTEGER NOT NULL DEFAULT 0,
        icon TEXT,
        class_name TEXT,
        url TEXT,
        is_external INTEGER NOT NULL DEFAULT 0,
        target TEXT DEFAULT '_self',
        permission TEXT,
        status INTEGER NOT NULL DEFAULT 1,
        hidden INTEGER NOT NULL DEFAULT 0,
        redirect TEXT,
        keep_alive INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      -- Insert default admin menus
      INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
      VALUES (1, 'Publish Offer', 'publish_offer', 0, '/admin', 'menu', 1, 'pencil');
      INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
      VALUES (2, 'Manage Offers', 'manage_offers', 0, '/admin/list', 'menu', 2, 'list');
      INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
      VALUES (3, 'Manage Users', 'manage_users', 0, '/admin/users', 'menu', 3, 'users');
      INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
      VALUES (4, 'Manage Dictionaries', 'manage_dicts', 0, '/admin/dictionaries', 'menu', 4, 'dict');
      INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
      VALUES (5, 'Manage Menus', 'manage_menus', 0, '/admin/menus', 'menu', 5, 'menu');
    `);
    
    // Automatic column migration for existing tables
    try {
      this.db.exec("ALTER TABLE dictionaries ADD COLUMN type TEXT NOT NULL DEFAULT 'normal';");
    } catch (e) {}
  }
  prepare(query: string) {
    const execute = (params: any[]) => {
      return {
        all: async () => {
          const stmt = this.db.prepare(query);
          const results = stmt.all(...params);
          return { results };
        },
        first: async () => {
          const stmt = this.db.prepare(query);
          const result = stmt.get(...params);
          return result || null;
        },
        run: async () => {
          const stmt = this.db.prepare(query);
          const info = stmt.run(...params);
          return { success: true, meta: { changes: info.changes } };
        }
      };
    };

    return {
      bind: (...params: any[]) => execute(params),
      all: () => execute([]).all(),
      first: () => execute([]).first(),
      run: () => execute([]).run()
    };
  }
}

const localBindings = {
  DB: new LocalD1('./local-node.db') as unknown as any,
  KV: new LocalKV() as unknown as any,
  ASSETS: {
    fetch: async (req: Request) => {
      return new Response('Not Found', { status: 404 });
    }
  }
};

import { Hono } from 'hono';

const serverApp = new Hono();

// Middleware to inject local bindings BEFORE the routes
serverApp.use('*', async (c, next) => {
  c.env = { ...(c.env as any), ...localBindings };
  
  Object.defineProperty(c, 'executionCtx', {
    value: {
      waitUntil: (p: Promise<any>) => { p.catch(console.error) },
      passThroughOnException: () => {}
    },
    writable: true,
    configurable: true
  });

  await next();
});

serverApp.route('/', app);

const port = 3000;
console.log(`Node server is running on http://localhost:${port}`);

serve({
  fetch: serverApp.fetch,
  port
});
