import { Hono } from "hono";
import { Bindings } from "../types";
import { authMiddleware } from "../security/middleware";
import { encryptDictValue } from "../security/crypto";

const dictionariesApi = new Hono<{ Bindings: Bindings }>();

dictionariesApi.get("/", async (c) => {
  const parentId = c.req.query("parentId");
  let query = "SELECT * FROM dictionaries ORDER BY sort_order ASC, created_at DESC";
  let params: any[] = [];
  if (parentId !== undefined) {
    query = "SELECT * FROM dictionaries WHERE parent_id = ? ORDER BY sort_order ASC, created_at DESC";
    params = [parseInt(parentId, 10)];
  }
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  // Mask value for encode items
  const masked = (results || []).map((item: any) => {
    if (item.type === 'encode' && item.value !== null) {
      return { ...item, value: '***' };
    }
    return item;
  });
  
  return c.json(masked);
});

dictionariesApi.post("/", authMiddleware, async (c) => {
  const { name, code, value, type, parent_id, sort_order, description } = await c.req.json();
  if (!name || !code) return c.json({ success: false, error: "Name and Code are required" }, 400);

  const itemType = type || 'normal';
  let valToSave = value || null;

  try {
    if (itemType === 'encode' && value) {
      valToSave = await encryptDictValue(value, c.env);
    }

    await c.env.DB
      .prepare("INSERT INTO dictionaries (name, code, value, type, parent_id, sort_order, description) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(
        name,
        code,
        valToSave,
        itemType,
        parent_id !== undefined ? parseInt(parent_id, 10) : 0,
        sort_order !== undefined ? parseInt(sort_order, 10) : 0,
        description || null
      )
      .run();
    return c.json({ success: true });
  } catch (e: any) {
    console.error("Save dictionary failed:", e);
    return c.json({ success: false, error: "Database error" }, 500);
  }
});

dictionariesApi.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const { name, code, value, type, parent_id, sort_order, description } = await c.req.json();
  if (!name || !code) return c.json({ success: false, error: "Name and Code are required" }, 400);

  const itemType = type || 'normal';
  let valToSave = value || null;

  try {
    if (itemType === 'encode') {
      if (value === '***') {
        const existing = await c.env.DB
          .prepare("SELECT value FROM dictionaries WHERE id = ?")
          .bind(id)
          .first<{ value: string }>();
        valToSave = existing ? existing.value : null;
      } else if (value) {
        valToSave = await encryptDictValue(value, c.env);
      }
    }

    await c.env.DB
      .prepare("UPDATE dictionaries SET name = ?, code = ?, value = ?, type = ?, parent_id = ?, sort_order = ?, description = ? WHERE id = ?")
      .bind(
        name,
        code,
        valToSave,
        itemType,
        parent_id !== undefined ? parseInt(parent_id, 10) : 0,
        sort_order !== undefined ? parseInt(sort_order, 10) : 0,
        description || null,
        id
      )
      .run();
    return c.json({ success: true });
  } catch (e: any) {
    console.error("Update dictionary failed:", e);
    return c.json({ success: false, error: "Database error" }, 500);
  }
});

dictionariesApi.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  try {
    await c.env.DB.prepare("DELETE FROM dictionaries WHERE id = ?").bind(id).run();
    await c.env.DB.prepare("DELETE FROM dictionaries WHERE parent_id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: "Database error" }, 500);
  }
});

export default dictionariesApi;
