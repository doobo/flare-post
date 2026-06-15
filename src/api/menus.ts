import { Hono } from "hono";
import { Bindings } from "../types";
import { authMiddleware } from "../security/middleware";

const menusApi = new Hono<{ Bindings: Bindings }>();

menusApi.use("*", authMiddleware);

menusApi.get("/", async (c) => {
  const parentId = c.req.query("parentId");
  const activeOnly = c.req.query("activeOnly") === "true";
  
  let query = "SELECT * FROM menus ORDER BY sort ASC, created_at DESC";
  let params: any[] = [];
  
  if (parentId !== undefined && activeOnly) {
    query = "SELECT * FROM menus WHERE parent_id = ? AND status = 1 ORDER BY sort ASC, created_at DESC";
    params = [parseInt(parentId, 10)];
  } else if (parentId !== undefined) {
    query = "SELECT * FROM menus WHERE parent_id = ? ORDER BY sort ASC, created_at DESC";
    params = [parseInt(parentId, 10)];
  } else if (activeOnly) {
    query = "SELECT * FROM menus WHERE status = 1 ORDER BY sort ASC, created_at DESC";
  }
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

menusApi.post("/", async (c) => {
  const body = await c.req.json();
  const { 
    menu_name, menu_key, parent_id, path, component, type, 
    sort, icon, class_name, url, is_external, target, 
    permission, status, hidden, redirect, keep_alive 
  } = body;
  
  if (!menu_name || !menu_key) {
    return c.json({ success: false, error: "Menu Name and Menu Key are required" }, 400);
  }
  
  try {
    await c.env.DB
      .prepare(`INSERT INTO menus (
        menu_name, menu_key, parent_id, path, component, type, 
        sort, icon, class_name, url, is_external, target, 
        permission, status, hidden, redirect, keep_alive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        menu_name,
        menu_key,
        parent_id !== undefined ? parseInt(parent_id, 10) : 0,
        path || null,
        component || null,
        type || 'menu',
        sort !== undefined ? parseInt(sort, 10) : 0,
        icon || null,
        class_name || null,
        url || null,
        is_external !== undefined ? parseInt(is_external, 10) : 0,
        target || '_self',
        permission || null,
        status !== undefined ? parseInt(status, 10) : 1,
        hidden !== undefined ? parseInt(hidden, 10) : 0,
        redirect || null,
        keep_alive !== undefined ? parseInt(keep_alive, 10) : 0
      )
      .run();
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return c.json({ success: false, error: "Menu Key already exists" }, 400);
    }
    console.error(e);
    return c.json({ success: false, error: "Database error" }, 500);
  }
});

menusApi.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { 
    menu_name, menu_key, parent_id, path, component, type, 
    sort, icon, class_name, url, is_external, target, 
    permission, status, hidden, redirect, keep_alive 
  } = body;
  
  if (!menu_name || !menu_key) {
    return c.json({ success: false, error: "Menu Name and Menu Key are required" }, 400);
  }
  
  try {
    await c.env.DB
      .prepare(`UPDATE menus SET 
        menu_name = ?, menu_key = ?, parent_id = ?, path = ?, component = ?, type = ?, 
        sort = ?, icon = ?, class_name = ?, url = ?, is_external = ?, target = ?, 
        permission = ?, status = ?, hidden = ?, redirect = ?, keep_alive = ?
        WHERE id = ?`)
      .bind(
        menu_name,
        menu_key,
        parent_id !== undefined ? parseInt(parent_id, 10) : 0,
        path || null,
        component || null,
        type || 'menu',
        sort !== undefined ? parseInt(sort, 10) : 0,
        icon || null,
        class_name || null,
        url || null,
        is_external !== undefined ? parseInt(is_external, 10) : 0,
        target || '_self',
        permission || null,
        status !== undefined ? parseInt(status, 10) : 1,
        hidden !== undefined ? parseInt(hidden, 10) : 0,
        redirect || null,
        keep_alive !== undefined ? parseInt(keep_alive, 10) : 0,
        id
      )
      .run();
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return c.json({ success: false, error: "Menu Key already exists" }, 400);
    }
    console.error(e);
    return c.json({ success: false, error: "Database error" }, 500);
  }
});

menusApi.delete("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await c.env.DB.prepare("DELETE FROM menus WHERE id = ?").bind(id).run();
    await c.env.DB.prepare("DELETE FROM menus WHERE parent_id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return c.json({ success: false, error: "Database error" }, 500);
  }
});

export default menusApi;
