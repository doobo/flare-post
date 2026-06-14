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
    `);
  }
  prepare(query: string) {
    return {
      bind: (...params: any[]) => {
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
      }
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
  c.env = { ...c.env, ...localBindings };
  
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
