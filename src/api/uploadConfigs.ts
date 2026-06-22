import { Hono } from "hono";
import { Bindings } from "../types";
import { authMiddleware } from "../security/middleware";
import { encryptDictValue, decryptDictValue } from "../security/crypto";

const uploadConfigsApi = new Hono<{ Bindings: Bindings }>();

uploadConfigsApi.use("*", authMiddleware);

uploadConfigsApi.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM upload_configs ORDER BY sort_order ASC, id ASC"
  ).all();
  const masked = (results || []).map((item: any) => ({
    ...item,
    access_key: item.access_key ? '***' : null,
    secret_key: item.secret_key ? '***' : null,
    refresh_token: item.refresh_token ? '***' : null,
  }));
  return c.json(masked);
});

uploadConfigsApi.post("/", async (c) => {
  const body = await c.req.json();
  let { name, is_default, is_proxy, proxy_prefix, storage_type, upload_url, access_key, secret_key, refresh_token, status, sort_order, remark } = body;

  if (!name) return c.json({ success: false, error: "Name is required" }, 400);

  if (is_default) {
    await c.env.DB.prepare("UPDATE upload_configs SET is_default = 0 WHERE is_default = 1").run();
  }

  try {
    if (access_key) access_key = await encryptDictValue(access_key, c.env);
    if (secret_key) secret_key = await encryptDictValue(secret_key, c.env);
    if (refresh_token) refresh_token = await encryptDictValue(refresh_token, c.env);
  } catch (e) {
    return c.json({ success: false, error: "Failed to encrypt credentials" }, 500);
  }

  const { success } = await c.env.DB.prepare(
    "INSERT INTO upload_configs (name, is_default, is_proxy, proxy_prefix, storage_type, upload_url, access_key, secret_key, refresh_token, status, sort_order, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    name, is_default ? 1 : 0, is_proxy ? 1 : 0, proxy_prefix || null, storage_type || 'common',
    upload_url || null, access_key || null, secret_key || null, refresh_token || null,
    status ? 1 : 0, sort_order ?? 0, remark || null
  ).run();

  return c.json({ success });
});

uploadConfigsApi.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  let { name, is_default, is_proxy, proxy_prefix, storage_type, upload_url, access_key, secret_key, refresh_token, status, sort_order, remark } = body;

  if (is_default) {
    await c.env.DB.prepare("UPDATE upload_configs SET is_default = 0 WHERE is_default = 1").run();
  }

  const verifyDecryptable = async (val: string | null): Promise<boolean> => {
    if (!val) return true;
    try {
      await decryptDictValue(val, c.env);
      return true;
    } catch {
      return false;
    }
  };

  try {
    if (access_key) {
      if (access_key === '***') {
        const existing = await c.env.DB.prepare("SELECT access_key FROM upload_configs WHERE id = ?").bind(id).first<{ access_key: string }>();
        if (existing?.access_key && !(await verifyDecryptable(existing.access_key))) {
          return c.json({ success: false, error: "Stored Access Key cannot be decrypted. Please re-enter the actual Access Key instead of '***'." }, 400);
        }
        access_key = existing?.access_key || null;
      } else {
        access_key = await encryptDictValue(access_key, c.env);
      }
    }
    if (secret_key) {
      if (secret_key === '***') {
        const existing = await c.env.DB.prepare("SELECT secret_key FROM upload_configs WHERE id = ?").bind(id).first<{ secret_key: string }>();
        if (existing?.secret_key && !(await verifyDecryptable(existing.secret_key))) {
          return c.json({ success: false, error: "Stored Secret Key cannot be decrypted. Please re-enter the actual Secret Key instead of '***'." }, 400);
        }
        secret_key = existing?.secret_key || null;
      } else {
        secret_key = await encryptDictValue(secret_key, c.env);
      }
    }
    if (refresh_token) {
      if (refresh_token === '***') {
        const existing = await c.env.DB.prepare("SELECT refresh_token FROM upload_configs WHERE id = ?").bind(id).first<{ refresh_token: string }>();
        if (existing?.refresh_token && !(await verifyDecryptable(existing.refresh_token))) {
          return c.json({ success: false, error: "Stored Refresh Token cannot be decrypted. Please re-enter the actual Refresh Token instead of '***'." }, 400);
        }
        refresh_token = existing?.refresh_token || null;
      } else {
        refresh_token = await encryptDictValue(refresh_token, c.env);
      }
    }
  } catch (e) {
    return c.json({ success: false, error: "Failed to encrypt credentials" }, 500);
  }

  await c.env.DB.prepare(
    "UPDATE upload_configs SET name=?, is_default=?, is_proxy=?, proxy_prefix=?, storage_type=?, upload_url=?, access_key=?, secret_key=?, refresh_token=?, status=?, sort_order=?, remark=? WHERE id=?"
  ).bind(
    name, is_default ? 1 : 0, is_proxy ? 1 : 0, proxy_prefix || null, storage_type || 'common',
    upload_url || null, access_key || null, secret_key || null, refresh_token || null,
    status ? 1 : 0, sort_order ?? 0, remark || null, id
  ).run();

  return c.json({ success: true });
});

uploadConfigsApi.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const config = await c.env.DB.prepare("SELECT is_default FROM upload_configs WHERE id = ?").bind(id).first<{ is_default: number }>();
  if (config?.is_default) {
    return c.json({ success: false, error: "Cannot delete the default config" }, 400);
  }
  await c.env.DB.prepare("DELETE FROM upload_configs WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

const getMimeExtension = (mime: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/bmp': 'bmp',
  };
  return map[mime] || 'bin';
};

uploadConfigsApi.post("/:id/test-upload", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  const file = body['image'] as File;

  if (!file) {
    return c.json({ success: false, error: "No image file uploaded" }, 400);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: "Unsupported file type" }, 400);
  }

  if (file.size > 100 * 1024 * 1024) {
    return c.json({ success: false, error: "File too large. Maximum 100MB" }, 400);
  }

  const config = await c.env.DB.prepare("SELECT * FROM upload_configs WHERE id = ?").bind(id).first<any>();
  if (!config) {
    return c.json({ success: false, error: "Upload config not found" }, 404);
  }

  let accessKey = config.access_key || null;
  let secretKey = config.secret_key || null;
  let refreshToken = config.refresh_token || null;

  try {
    if (accessKey) accessKey = await decryptDictValue(accessKey, c.env);
    if (secretKey) secretKey = await decryptDictValue(secretKey, c.env);
    if (refreshToken) refreshToken = await decryptDictValue(refreshToken, c.env);
  } catch (e) {
    return c.json({ success: false, error: "Failed to decrypt credentials. Please re-save the config credentials." }, 500);
  }

  let originalUrl = "";

  if (config.storage_type === 'common') {
    if (!accessKey) {
      return c.json({ success: false, error: "Access Key is required for common storage type." }, 400);
    }

    const formData = new FormData();
    formData.append('image', file);

    const uploadRes = await fetch('https://im.ge/api/v1/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessKey}` },
      body: formData
    });

    const data = await uploadRes.json() as Record<string, any>;

    if (!uploadRes.ok) {
      return c.json({ success: false, error: data.error || "Upload to im.ge failed" }, 500);
    }

    originalUrl = data.direct_url || data.cdn_url || data.url || data.data?.url || data.data?.direct_url;

    if (!originalUrl) {
      return c.json({ success: false, error: "Could not retrieve image URL from im.ge response" }, 500);
    }
  } else if (config.upload_url) {
    if (!accessKey) {
      return c.json({ success: false, error: "Access Key is required for custom storage." }, 400);
    }

    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    headers['X-Access-Key'] = accessKey;
    if (secretKey) headers['X-Secret-Key'] = secretKey;
    if (refreshToken) headers['X-Refresh-Token'] = refreshToken;

    const uploadRes = await fetch(config.upload_url, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await uploadRes.json() as Record<string, any>;

    if (!uploadRes.ok) {
      return c.json({ success: false, error: data.error || "Upload to custom endpoint failed" }, 500);
    }

    originalUrl = data.url || data.direct_url || data.data?.url;
    if (!originalUrl) {
      return c.json({ success: false, error: "Could not retrieve image URL from response" }, 500);
    }
  } else {
    return c.json({ success: false, error: "Upload config has no upload URL" }, 400);
  }

  const ext = getMimeExtension(file.type);
  const prefix = config.proxy_prefix || '';
  const proxyUrl = `${prefix}/img/${file.name}.${ext}`;

  const { success } = await c.env.DB.prepare(
    "INSERT INTO files (filename, file_type, file_size, mime_type, original_url, proxy_url, upload_config_id, storage_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    file.name, ext, file.size, file.type,
    originalUrl, proxyUrl, config.id, config.storage_type
  ).run();

  if (!success) {
    return c.json({ success: false, error: "Failed to save file record" }, 500);
  }

  const inserted = await c.env.DB.prepare(
    "SELECT id FROM files WHERE original_url = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(originalUrl).first<{ id: number }>();

  const finalProxyUrl = inserted ? `${prefix}/img/${inserted.id}.${ext}` : proxyUrl;

  if (inserted) {
    await c.env.DB.prepare("UPDATE files SET proxy_url = ? WHERE id = ?").bind(finalProxyUrl, inserted.id).run();
  }

  const returnUrl = config.is_proxy ? finalProxyUrl : originalUrl;

  return c.json({ success: true, url: returnUrl, original_url: originalUrl, proxy_url: finalProxyUrl, file_id: inserted?.id });
});

export default uploadConfigsApi;
