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

app.get("/api/auth/public-key", async (c) => {
  const keyPair = await getRSAKeyPair(c.env);
  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  return c.json(publicKeyJwk);
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
