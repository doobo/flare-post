import { Hono } from "hono";
import { sign } from "hono/jwt";
import { Bindings } from "../types";
import { getRSAKeyPair, decryptPassword, hashPassword, arrayBufferToPem } from "../security/crypto";
import { authMiddleware } from "../security/middleware";

const authApi = new Hono<{ Bindings: Bindings }>();

authApi.get("/public-key", async (c) => {
  const keyPair = await getRSAKeyPair(c.env);
  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey) as JsonWebKey;
  const spkiBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey) as ArrayBuffer;
  const pem = arrayBufferToPem(spkiBuffer);
  return c.json({ jwk: publicKeyJwk, pem });
});

authApi.post("/login", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ success: false, error: "Missing credentials" }, 400);

  let decryptedPwd = "";
  try {
    decryptedPwd = await decryptPassword(password, c.env);
  } catch (e) {
    console.error("Decryption failed:", e);
    return c.json({ success: false, error: "Invalid credentials format or decryption error" }, 400);
  }

  const hashedPwd = await hashPassword(decryptedPwd);
  const user = await c.env.DB
    .prepare("SELECT id, username, role FROM users WHERE username = ? AND password_hash = ?")
    .bind(username, hashedPwd)
    .first<{ id: number; username: string; role: string }>();

  if (user) {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours
    };
    const secret = c.env.JWT_SECRET || "default_jwt_secret_key";
    const token = await sign(payload, secret);
    return c.json({ success: true, token });
  }

  return c.json({ success: false, error: "Invalid credentials" }, 401);
});

authApi.get("/me", authMiddleware, async (c) => {
  const user = c.get("user" as any) as { id: number; username: string; role: string };
  const result = await c.env.DB
    .prepare("SELECT id, username, email, role, avatar, created_at FROM users WHERE id = ?")
    .bind(user.id)
    .first<{ id: number; username: string; email: string; role: string; avatar: string; created_at: string }>();

  if (!result) return c.json({ success: false, error: "User not found" }, 404);
  return c.json({ success: true, user: result });
});

export default authApi;
