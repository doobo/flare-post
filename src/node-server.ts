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
      CREATE TABLE IF NOT EXISTS redirect_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_url TEXT NOT NULL,
        referer TEXT,
        ip TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      VALUES (1, 'Publish', 'publish_offer', 0, '/admin', 'menu', 1, 'ri-edit-2-fill');
      INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
      VALUES (2, 'Offers', 'manage_offers', 0, '/admin/list', 'menu', 2, 'ri-menu-line');
      INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
      VALUES (3, 'Users', 'manage_users', 0, '/admin/users', 'menu', 3, 'ri-user-settings-line');
      INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
      VALUES (4, 'Dictionary', 'manage_dicts', 0, '/admin/dictionaries', 'menu', 4, 'ri-book-3-line');
      INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
      VALUES (5, 'Menus', 'manage_menus', 0, '/admin/menus', 'menu', 5, 'ri-settings-3-fill');
    `);
    
    // Automatic column migration for existing tables
    try {
      this.db.exec("ALTER TABLE dictionaries ADD COLUMN type TEXT NOT NULL DEFAULT 'normal';");
    } catch (e) {}
    try {
      this.db.exec("ALTER TABLE posts ADD COLUMN content_type TEXT NOT NULL DEFAULT 'markdown';");
    } catch (e) {}
    try {
      this.db.exec("ALTER TABLE posts ADD COLUMN category_id INTEGER DEFAULT 0;");
    } catch (e) {}
    
    // Seed default categories
    try {
      this.db.exec(`
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (100, '分类列表', 'category_list', 'normal', 0, 1);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (101, '虚拟机', 'category_list', 'normal', 100, 1);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (102, 'VPN', 'category_list', 'normal', 100, 2);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (103, '域名', 'category_list', 'normal', 100, 3);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (104, '服务器', 'category_list', 'normal', 100, 4);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (105, '网络工具', 'category_list', 'normal', 100, 5);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (106, '安全工具', 'category_list', 'normal', 100, 6);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (107, 'KVM', 'category_list', 'normal', 101, 1);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (108, 'VMware', 'category_list', 'normal', 101, 2);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (109, '商业VPN', 'category_list', 'normal', 102, 1);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (110, '自建VPN', 'category_list', 'normal', 102, 2);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (111, '注册商', 'category_list', 'normal', 103, 1);
        INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (112, 'DNS解析', 'category_list', 'normal', 103, 2);
      `);
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
