import { Hono } from "hono";
import { Bindings } from "../types";
import { authMiddleware } from "../security/middleware";

const filesApi = new Hono<{ Bindings: Bindings }>();

filesApi.use("*", authMiddleware);

filesApi.get("/", async (c) => {
  const q = c.req.query("q") || "";
  const configId = c.req.query("config_id") || "";
  const fileType = c.req.query("file_type") || "";
  const page = parseInt(c.req.query("page") || "1");
  const pageSize = parseInt(c.req.query("page_size") || "20");
  const offset = (page - 1) * pageSize;

  let sql = "SELECT * FROM files WHERE 1=1";
  const params: any[] = [];

  if (q) {
    sql += " AND (filename LIKE ? OR original_url LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (configId) {
    sql += " AND upload_config_id = ?";
    params.push(configId);
  }
  if (fileType) {
    sql += " AND file_type = ?";
    params.push(fileType);
  }

  const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as total");
  const countResult = await c.env.DB.prepare(countSql).bind(...params).first<{ total: number }>();
  const total = countResult?.total || 0;

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(pageSize, offset);

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();

  return c.json({ results, total, page, pageSize });
});

filesApi.get("/:id", async (c) => {
  const id = c.req.param("id");
  const file = await c.env.DB.prepare("SELECT * FROM files WHERE id = ?").bind(id).first();
  if (!file) return c.json({ success: false, error: "File not found" }, 404);
  return c.json(file);
});

filesApi.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM files WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

export default filesApi;
