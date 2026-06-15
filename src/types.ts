export type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: { fetch: typeof fetch };
  JWT_SECRET?: string;
};
