import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: { fetch: typeof fetch };
};

const app = new Hono<{ Bindings: Bindings }>();

// Generate a random ID for short links
const generateId = () => Math.random().toString(36).substring(2, 8);

// API endpoints
app.get("/api/posts", async (c) => {
  const q = c.req.query("q");
  let query = "SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC";
  let params: any[] = [];

  if (q) {
    query = "SELECT * FROM posts WHERE status = 'published' AND (title LIKE ? OR content_md LIKE ?) ORDER BY created_at DESC";
    params = [`%${q}%`, `%${q}%`];
  }

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

app.get("/api/posts/:id", async (c) => {
  const id = c.req.param("id");
  const data = await c.env.DB
    .prepare("SELECT * FROM posts WHERE id = ?")
    .bind(id)
    .first();
  if (!data) return c.text("Not Found", 404);
  return c.json(data);
});

app.post("/api/posts", async (c) => {
  // Simple authentication check
  const token = c.req.header("x-admin-token");
  if (token !== (c.env.ADMIN_TOKEN || "admin123")) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  let { title, category, tags, content_md } = body;

  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  
  const linksToInsert: { id: string, target_url: string }[] = [];
  
  let updatedContent = content_md.replace(linkRegex, (fullMatch: string, text: string, url: string) => {
    if (url.startsWith('/go/') || url.includes(c.req.header('host') || '')) return fullMatch;

    const id = generateId();
    linksToInsert.push({ id, target_url: url });
    return `[${text}](/go/${id}) \`[${url}]\``; // Added URL text display next to link
  });

  const { results: postResults } = await c.env.DB
    .prepare("INSERT INTO posts (title, content_md, category, tags) VALUES (?, ?, ?, ?) RETURNING id")
    .bind(title, updatedContent, category, tags)
    .all();

  const postId = postResults[0].id;

  for (const link of linksToInsert) {
    await c.env.DB
      .prepare("INSERT INTO links (id, post_id, target_url) VALUES (?, ?, ?)")
      .bind(link.id, postId, link.target_url)
      .run();
  }

  return c.json({ success: true, id: postId });
});

/* Short link system */
app.get("/go/:id", async (c) => {
  const id = c.req.param("id");

  const cached = await c.env.KV.get(id);
  if (cached) {
    c.executionCtx.waitUntil(
      c.env.DB.prepare("UPDATE links SET clicks = clicks + 1 WHERE id = ?").bind(id).run()
    );
    return c.redirect(cached, 302);
  }

  const data = await c.env.DB
    .prepare("SELECT target_url FROM links WHERE id=?")
    .bind(id)
    .first<{ target_url: string }>();

  if (!data) return c.text("Not Found", 404);

  await c.env.KV.put(id, data.target_url);

  c.executionCtx.waitUntil(
    c.env.DB.prepare("UPDATE links SET clicks = clicks + 1 WHERE id = ?").bind(id).run()
  );

  return c.redirect(data.target_url, 302);
});

// Catch-all for assets/frontend SPA fallback
app.get('*', async (c) => {
  let response = await c.env.ASSETS.fetch(c.req.raw);
  if (response.status === 404) {
    const url = new URL(c.req.url);
    url.pathname = '/';
    return c.env.ASSETS.fetch(new Request(url, c.req.raw));
  }
  return response;
});

export default app;
