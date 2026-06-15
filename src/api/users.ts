import { Hono } from "hono";
import { Bindings } from "../types";
import { authMiddleware } from "../security/middleware";
import { decryptPassword, hashPassword } from "../security/crypto";

const usersApi = new Hono<{ Bindings: Bindings }>();

usersApi.use("*", authMiddleware);

usersApi.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT id, username, email, role, created_at FROM users").all();
  return c.json(results);
});

usersApi.post("/", async (c) => {
  const { username, password, email, role } = await c.req.json();
  if (!username || !password) return c.json({ success: false, error: "Username and password are required" }, 400);

  let decryptedPwd = "";
  try {
    decryptedPwd = await decryptPassword(password, c.env);
  } catch (e) {
    console.error("Decryption failed:", e);
    return c.json({ success: false, error: "Decryption error" }, 400);
  }

  const hashedPwd = await hashPassword(decryptedPwd);
  
  try {
    await c.env.DB
      .prepare("INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)")
      .bind(username, hashedPwd, email || null, role || 'admin')
      .run();
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return c.json({ success: false, error: "Username already exists" }, 400);
    }
    return c.json({ success: false, error: "Database error" }, 500);
  }
});

usersApi.put("/:id", async (c) => {
  const id = c.req.param("id");
  const { username, password, email, role } = await c.req.json();
  
  try {
    if (password) {
      let decryptedPwd = "";
      try {
        decryptedPwd = await decryptPassword(password, c.env);
      } catch (e) {
        console.error("Decryption failed:", e);
        return c.json({ success: false, error: "Decryption error" }, 400);
      }
      const hashedPwd = await hashPassword(decryptedPwd);
      await c.env.DB
        .prepare("UPDATE users SET username = ?, password_hash = ?, email = ?, role = ? WHERE id = ?")
        .bind(username, hashedPwd, email || null, role || 'admin', id)
        .run();
    } else {
      await c.env.DB
        .prepare("UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?")
        .bind(username, email || null, role || 'admin', id)
        .run();
    }
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return c.json({ success: false, error: "Username already exists" }, 400);
    }
    return c.json({ success: false, error: "Database error" }, 500);
  }
});

usersApi.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user" as any) as any;
  
  // Prevent deleting oneself
  if (user && user.id.toString() === id) {
    return c.json({ success: false, error: "Cannot delete your own account" }, 400);
  }

  await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

export default usersApi;
