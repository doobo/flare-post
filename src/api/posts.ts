import { Hono } from "hono";
import { Bindings } from "../types";
import { authMiddleware } from "../security/middleware";

const postsApi = new Hono<{ Bindings: Bindings }>();

function extractEndDate(contentMd: string): string | null {
  const match = contentMd.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const yaml = match[1];
  for (const line of yaml.split(/\r?\n/)) {
    if (line.startsWith("end_date:")) {
      const val = line.slice("end_date:".length).trim();
      return val || null;
    }
  }
  return null;
}

postsApi.get("/", async (c) => {
  const q = c.req.query("q");
  const category = c.req.query("category");
  const sort = c.req.query("sort") || "latest";
  const page = parseInt(c.req.query("page") || "0");
  const limit = parseInt(c.req.query("limit") || "20");

  let conditions = ["status = 'published'"];
  let params: any[] = [];

  if (q) {
    conditions.push("(title LIKE ? OR content_md LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }

  const where = conditions.join(" AND ");

  // Count total matching posts
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM posts WHERE ${where}`
  ).bind(...params).first<any>();
  const total = countResult?.total || 0;

  // Fetch posts
  let orderBy = "created_at DESC";
  if (sort === "ending_soon") {
    orderBy = "created_at ASC";
  }

  const fetchQuery = `SELECT * FROM posts WHERE ${where} ORDER BY ${orderBy}`;
  const { results } = await c.env.DB.prepare(fetchQuery).bind(...params).all();

  let posts = (results || []).map((item: any) => ({
    ...item,
    content: item.content_md
  }));

  // For ending_soon sort, parse frontmatter and sort by end_date
  if (sort === "ending_soon") {
    posts.sort((a: any, b: any) => {
      const aEnd = extractEndDate(a.content_md);
      const bEnd = extractEndDate(b.content_md);
      if (!aEnd && !bEnd) return 0;
      if (!aEnd) return 1;
      if (!bEnd) return -1;
      return new Date(aEnd).getTime() - new Date(bEnd).getTime();
    });
  }

  // Pagination (only if page param is explicitly provided)
  if (page > 0) {
    const offset = (page - 1) * limit;
    const paginated = posts.slice(offset, offset + limit);
    return c.json({ posts: paginated, total, page, limit });
  }

  return c.json(posts);
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
    // Exclude markdown image syntax ![alt](url) — only rewrite actual links
    const linkRegex = /(?<!!)\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
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
    // Exclude markdown image syntax ![alt](url) — only rewrite actual links
    const linkRegex = /(?<!!)\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
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
