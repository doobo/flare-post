import { Hono } from "hono";
import { Bindings } from "../types";
import { decryptDictValue } from "../security/crypto";

const uploadApi = new Hono<{ Bindings: Bindings }>();

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

uploadApi.post("/image", async (c) => {
  const body = await c.req.parseBody();
  const file = body['image'] as File;

  if (!file) {
    return c.json({ success: false, error: "No image file uploaded" }, 400);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, AVIF, BMP" }, 400);
  }

  if (file.size > 100 * 1024 * 1024) {
    return c.json({ success: false, error: "File too large. Maximum 100MB" }, 400);
  }

  // Get default upload config
  const config = await c.env.DB.prepare(
    "SELECT * FROM upload_configs WHERE is_default = 1 AND status = 1 LIMIT 1"
  ).first<any>();

  if (!config) {
    return c.json({ success: false, error: "No default upload config. Go to Upload Configs to set one." }, 400);
  }

  // Decrypt credentials from config
  let accessKey = config.access_key || null;
  let secretKey = config.secret_key || null;
  let refreshToken = config.refresh_token || null;

  try {
    if (accessKey) accessKey = await decryptDictValue(accessKey, c.env);
    if (secretKey) secretKey = await decryptDictValue(secretKey, c.env);
    if (refreshToken) refreshToken = await decryptDictValue(refreshToken, c.env);
  } catch (e) {
    return c.json({ success: false, error: "Failed to decrypt credentials. Please re-save the upload config credentials." }, 500);
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
      headers: {
        'Authorization': `Bearer ${accessKey}`
      },
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

  return c.json({ success: true, url: returnUrl, original_url: originalUrl, proxy_url: finalProxyUrl });
});

export default uploadApi;
