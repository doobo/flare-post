import { Hono } from "hono";
import { sign, verify } from "hono/jwt";

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: { fetch: typeof fetch };
  JWT_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Generate a random ID for short links
const generateId = () => Math.random().toString(36).substring(2, 8);

// Helper function to hash password with SHA-256
async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
  const mapped = (results || []).map((item: any) => ({
    ...item,
    content: item.content_md
  }));
  return c.json(mapped);
});

app.get("/api/posts/:id", async (c) => {
  const id = c.req.param("id");
  const data = await c.env.DB
    .prepare("SELECT * FROM posts WHERE id = ?")
    .bind(id)
    .first();
  if (!data) return c.text("Not Found", 404);
  return c.json({
    ...data,
    content: data.content_md
  });
});

let cachedKeyPair: { publicKey: CryptoKey, privateKey: CryptoKey } | null = null;

async function getRSAKeyPair(env: Bindings): Promise<{ publicKey: CryptoKey, privateKey: CryptoKey }> {
  if (cachedKeyPair) return cachedKeyPair;

  try {
    const pubKeyStr = await env.KV.get("RSA_PUBLIC_KEY");
    const privKeyStr = await env.KV.get("RSA_PRIVATE_KEY");

    if (pubKeyStr && privKeyStr) {
      const publicKey = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(pubKeyStr),
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
      );
      const privateKey = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(privKeyStr),
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
      );
      cachedKeyPair = { publicKey, privateKey };
      return cachedKeyPair;
    }
  } catch (e) {
    console.error("Failed to load keys from KV:", e);
  }

  // Generate new key pair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  ) as CryptoKeyPair;

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

  await env.KV.put("RSA_PUBLIC_KEY", JSON.stringify(publicKeyJwk));
  await env.KV.put("RSA_PRIVATE_KEY", JSON.stringify(privateKeyJwk));

  cachedKeyPair = { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
  return cachedKeyPair;
}

async function decryptPassword(passwordBase64: string, env: Bindings): Promise<string> {
  const keyPair = await getRSAKeyPair(env);
  const encryptedBuffer = Uint8Array.from(atob(passwordBase64), char => char.charCodeAt(0));
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    keyPair.privateKey,
    encryptedBuffer
  );
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

function arrayBufferToPem(buffer: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

app.get("/api/auth/public-key", async (c) => {
  const keyPair = await getRSAKeyPair(c.env);
  const [publicKeyJwk, spkiBuffer] = await Promise.all([
    crypto.subtle.exportKey("jwk", keyPair.publicKey),
    crypto.subtle.exportKey("spki", keyPair.publicKey)
  ]);
  const pem = arrayBufferToPem(spkiBuffer);
  return c.json({ jwk: publicKeyJwk, pem });
});

app.post("/api/auth/login", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ success: false, error: "Missing credentials" }, 400);

  let decryptedPassword = "";
  try {
    decryptedPassword = await decryptPassword(password, c.env);
  } catch (e) {
    console.error("Decryption failed:", e);
    return c.json({ success: false, error: "Invalid credentials format or decryption error" }, 400);
  }

  const hashedPwd = await hashPassword(decryptedPassword);
  const user = await c.env.DB
    .prepare("SELECT id, username, role FROM users WHERE username = ? AND password_hash = ?")
    .bind(username, hashedPwd)
    .first();

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

// Auth Middleware
async function authMiddleware(c: any, next: any) {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const secret = c.env.JWT_SECRET || "default_jwt_secret_key";
    const payload = await verify(token, secret, "HS256");
    c.set("user", payload);
    await next();
  } catch (e) {
    console.error("JWT verify error:", e);
    return c.json({ success: false, error: "Invalid token" }, 401);
  }
}

app.post("/api/posts", authMiddleware, async (c) => {
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
    .all();

  const postId = postResults[0].id;
  return c.json({ success: true, id: postId });
});

app.put("/api/posts/:id", authMiddleware, async (c) => {
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


app.delete("/api/posts/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  
  // Also delete associated links
  await c.env.DB.prepare("DELETE FROM links WHERE post_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// User Management Endpoints
app.get("/api/users", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare("SELECT id, username, email, role, created_at FROM users").all();
  return c.json(results);
});

app.post("/api/users", authMiddleware, async (c) => {
  const { username, password, email, role } = await c.req.json();
  if (!username || !password) return c.json({ success: false, error: "Username and password are required" }, 400);

  let decryptedPassword = "";
  try {
    decryptedPassword = await decryptPassword(password, c.env);
  } catch (e) {
    console.error("Decryption failed:", e);
    return c.json({ success: false, error: "Decryption error" }, 400);
  }

  const hashedPwd = await hashPassword(decryptedPassword);
  
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

app.put("/api/users/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const { username, password, email, role } = await c.req.json();
  
  try {
    if (password) {
      let decryptedPassword = "";
      try {
        decryptedPassword = await decryptPassword(password, c.env);
      } catch (e) {
        console.error("Decryption failed:", e);
        return c.json({ success: false, error: "Decryption error" }, 400);
      }
      const hashedPwd = await hashPassword(decryptedPassword);
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

app.delete("/api/users/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user" as any) as any;
  
  // Prevent deleting oneself
  if (user && user.id.toString() === id) {
    return c.json({ success: false, error: "Cannot delete your own account" }, 400);
  }

  await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Dictionary Encryption Helpers
let cachedDictKey: CryptoKey | null = null;

async function getDictEncryptionKey(env: Bindings): Promise<CryptoKey> {
  if (cachedDictKey) return cachedDictKey;

  try {
    const keyStr = await env.KV.get("DICT_ENCRYPTION_KEY");
    if (keyStr) {
      const importedKey = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(keyStr),
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
      );
      cachedDictKey = importedKey;
      return importedKey;
    }
  } catch (e) {
    console.error("Failed to load dict key from KV:", e);
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  ) as CryptoKey;

  const jwk = await crypto.subtle.exportKey("jwk", key);
  await env.KV.put("DICT_ENCRYPTION_KEY", JSON.stringify(jwk));

  cachedDictKey = key;
  return key;
}

async function encryptDictValue(plaintext: string, env: Bindings): Promise<string> {
  const key = await getDictEncryptionKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptDictValue(ciphertextBase64: string, env: Bindings): Promise<string> {
  const key = await getDictEncryptionKey(env);
  const combined = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

// Dictionary Management Endpoints
app.get("/api/dictionaries", authMiddleware, async (c) => {
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

app.post("/api/dictionaries", authMiddleware, async (c) => {
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

app.put("/api/dictionaries/:id", authMiddleware, async (c) => {
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

app.delete("/api/dictionaries/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  try {
    await c.env.DB.prepare("DELETE FROM dictionaries WHERE id = ?").bind(id).run();
    await c.env.DB.prepare("DELETE FROM dictionaries WHERE parent_id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: "Database error" }, 500);
  }
});

// Menu Management Endpoints
app.get("/api/menus", authMiddleware, async (c) => {
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

app.post("/api/menus", authMiddleware, async (c) => {
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

app.put("/api/menus/:id", authMiddleware, async (c) => {
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

app.delete("/api/menus/:id", authMiddleware, async (c) => {
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

/* Security URL redirection and logging */
app.get("/redirect", async (c) => {
  const targetUrl = c.req.query("url");
  if (!targetUrl) return c.text("Missing URL parameter", 400);

  const referer = c.req.header("referer") || "";
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
  const userAgent = c.req.header("user-agent") || "";

  // Log the redirect in D1
  c.executionCtx.waitUntil(
    c.env.DB
      .prepare("INSERT INTO redirect_logs (target_url, referer, ip, user_agent) VALUES (?, ?, ?, ?)")
      .bind(targetUrl, referer, ip, userAgent)
      .run()
      .catch(console.error)
  );

  // Check whitelist
  let isWhitelisted = false;
  try {
    const parsedUrl = new URL(targetUrl);
    const host = parsedUrl.host.toLowerCase();
    const ownHost = (c.req.header("host") || "").toLowerCase();
    
    const whitelist = [
      ownHost,
      "github.com",
      "cloudflare.com",
      "google.com",
      "workers.cloudflare.com",
      "npmtrends.com",
      "npmjs.com",
      "vuejs.org",
      "vite.dev"
    ];
    
    isWhitelisted = whitelist.some(domain => host === domain || host.endsWith("." + domain));
  } catch (e) {
    return c.text("Invalid URL parameter", 400);
  }

  // Render HTML page
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>安全跳转提示 - Cloud Web</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at top, #0f172a, #020617);
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: rgba(30, 41, 59, 0.45);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 40px 30px;
      width: 100%;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      background: ${isWhitelisted ? 'rgba(79, 70, 229, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
      color: ${isWhitelisted ? '#818cf8' : '#f87171'};
    }
    h1 {
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 12px;
      color: #f1f5f9;
    }
    p {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 0 0 24px;
    }
    .url-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 12px 16px;
      font-family: monospace;
      font-size: 13px;
      color: #a5b4fc;
      word-break: break-all;
      margin-bottom: 24px;
      text-align: left;
    }
    .countdown {
      font-size: 14px;
      font-weight: 500;
      color: #818cf8;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      box-sizing: border-box;
    }
    .btn-primary {
      background: #4f46e5;
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    .btn-primary:hover {
      background: #4338ca;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: transparent;
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 12px;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.03);
      color: #f1f5f9;
    }
    .warning-text {
      color: #f87171 !important;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      ${isWhitelisted ? `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:32px; height:32px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
      ` : `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:32px; height:32px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      `}
    </div>

    <h1>${isWhitelisted ? '安全跳转提示' : '安全警告：您正在离开本站'}</h1>
    
    <p class="${isWhitelisted ? '' : 'warning-text'}">
      ${isWhitelisted 
        ? '您点击的链接是本站信任稀的域名，正在安全跳转中...' 
        : '注意！该网站不属于本站信任的域名白名单，请谨防钓鱼或欺诈，确认安全后再继续。'}
    </p>

    <div class="url-box">${targetUrl}</div>

    ${isWhitelisted ? `
    <div class="countdown" id="countdown-text">将在 <span id="secs">3</span> 秒后自动跳转...</div>
    ` : ''}

    <a href="${targetUrl}" class="btn btn-primary">立即前往</a>
    <a href="javascript:window.close();" class="btn btn-secondary">取消并返回</a>
  </div>

  <script>
    const targetUrl = ${JSON.stringify(targetUrl)};
    const isWhitelisted = ${isWhitelisted};
    
    if (isWhitelisted) {
      let count = 3;
      const interval = setInterval(() => {
        count--;
        document.getElementById('secs').textContent = count;
        if (count <= 0) {
          clearInterval(interval);
          window.location.href = targetUrl;
        }
      }, 1000);
    }
  </script>
</body>
</html>
  `;
  return c.html(html);
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
