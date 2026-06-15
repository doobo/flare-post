import { Hono } from "hono";
import { Bindings } from "../types";
import { authMiddleware } from "../security/middleware";

const postsApi = new Hono<{ Bindings: Bindings }>();

postsApi.get("/", async (c) => {
  const q = c.req.query("q");
  let query = "SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC";
  let params: any[] = [];

  if (q) {
    query = "SELECT * FROM posts WHERE status = 'published' AND (title LIKE ? OR content_md LIKE ?) ORDER BY created_at DESC";
    params = [`%${q}%`, `%${q}%`];
  }

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  const mapped = (results || []).map((item: any) => ({
    ...item,
    content: item.content_md
  }));
  return c.json(mapped);
});

postsApi.get("/:id", async (c) => {
  const id = c.req.param("id");
  const data = await c.env.DB
    .prepare("SELECT * FROM posts WHERE id = ?")
    .bind(id)
    .first<any>();
  if (!data) return c.text("Not Found", 404);
  return c.json({
    ...data,
    content: data.content_md
  });
});

postsApi.post("/", authMiddleware, async (c) => {
  const body = await c.req.json();
  let { title, category, category_id, tags, content, content_md, content_type } = body;
  
  const finalContent = content || content_md || '';
  const finalContentType = content_type || 'markdown';
  const finalCategoryId = category_id || 0;

  let updatedContent = finalContent;
  if (finalContentType === 'markdown') {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    updatedContent = finalContent.replace(linkRegex, (fullMatch: string, text: string, url: string) => {
      if (url.startsWith('/redirect?url=') || url.includes(c.req.header('host') || '')) return fullMatch;
      return `[${text}](/redirect?url=${encodeURIComponent(url)})`;
    });
  } else {
    const htmlLinkRegex = /href="(https?:\/\/[^"]+)"/g;
    updatedContent = finalContent.replace(htmlLinkRegex, (fullMatch: string, url: string) => {
      if (url.startsWith('/redirect?url=') || url.includes(c.req.header('host') || '')) return fullMatch;
      return `href="/redirect?url=${encodeURIComponent(url)}"`;
    });
  }

  const { results: postResults } = await c.env.DB
    .prepare("INSERT INTO posts (title, content_md, content_type, category_id, category, tags) VALUES (?, ?, ?, ?, ?, ?) RETURNING id")
    .bind(title, updatedContent, finalContentType, finalCategoryId, category, tags)
    .all<any>();

  const postId = postResults[0].id;
  return c.json({ success: true, id: postId });
});

postsApi.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  let { title, category, category_id, tags, content, content_md, content_type } = body;

  const finalContent = content || content_md || '';
  const finalContentType = content_type || 'markdown';
  const finalCategoryId = category_id || 0;

  let updatedContent = finalContent;
  if (finalContentType === 'markdown') {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    updatedContent = finalContent.replace(linkRegex, (fullMatch: string, text: string, url: string) => {
      if (url.startsWith('/redirect?url=') || url.includes(c.req.header('host') || '')) return fullMatch;
      return `[${text}](/redirect?url=${encodeURIComponent(url)})`;
    });
  } else {
    const htmlLinkRegex = /href="(https?:\/\/[^"]+)"/g;
    updatedContent = finalContent.replace(htmlLinkRegex, (fullMatch: string, url: string) => {
      if (url.startsWith('/redirect?url=') || url.includes(c.req.header('host') || '')) return fullMatch;
      return `href="/redirect?url=${encodeURIComponent(url)}"`;
    });
  }

  await c.env.DB
    .prepare("UPDATE posts SET title = ?, content_md = ?, content_type = ?, category_id = ?, category = ?, tags = ? WHERE id = ?")
    .bind(title, updatedContent, finalContentType, finalCategoryId, category, tags, id)
    .run();

  // Clear old links from legacy link table
  await c.env.DB.prepare("DELETE FROM links WHERE post_id = ?").bind(id).run();

  return c.json({ success: true });
});

postsApi.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  
  // Also delete associated links
  await c.env.DB.prepare("DELETE FROM links WHERE post_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

export default postsApi;
