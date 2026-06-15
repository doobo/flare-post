import { verify } from "hono/jwt";
import { Context, Next } from "hono";
import { Bindings } from "../types";

export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const secret = c.env.JWT_SECRET || "default_jwt_secret_key";
    const payload = await verify(token, secret, "HS256");
    c.set("user" as any, payload);
    await next();
  } catch (e) {
    console.error("JWT verify error:", e);
    return c.json({ success: false, error: "Invalid token" }, 401);
  }
}
