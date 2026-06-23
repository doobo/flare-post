import { Hono } from "hono";
import { Bindings } from "../types";
import { decryptDictValue } from "../security/crypto";
import { getStorageAdapter } from "../storage";
import { snowflake } from "../utils/snowflake";

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

  const config = await c.env.DB.prepare(
    "SELECT * FROM upload_configs WHERE is_default = 1 AND status = 1 LIMIT 1"
  ).first<any>();

  if (!config) {
    return c.json({ success: false, error: "No default upload config. Go to Upload Configs to set one." }, 400);
  }

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

  const adapter = getStorageAdapter(config.storage_type, {
    accessKey,
    secretKey,
    refreshToken,
    uploadUrl: config.upload_url,
  });

  const fileId = snowflake.nextId();
  const ext = getMimeExtension(file.type);
  const objectName = `${fileId}.${ext}`;

  let uploadResult;
  try {
    uploadResult = await adapter.upload(file, objectName);
  } catch (e: any) {
    return c.json({ success: false, error: e.message || "Upload failed" }, 500);
  }

  const originalUrl = uploadResult.url;
  const prefix = config.proxy_prefix || '';
  const proxyUrl = `${prefix}/img/${objectName}`;
  const extConfig = uploadResult.ext_config || null;

  await c.env.DB.prepare(
    "INSERT INTO files (id, filename, file_type, file_size, mime_type, original_url, proxy_url, ext_config, upload_config_id, storage_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    fileId, file.name, ext, file.size, file.type,
    originalUrl, proxyUrl, extConfig, config.id, config.storage_type
  ).run();

  const returnUrl = config.is_proxy ? proxyUrl : originalUrl;

  return c.json({
    success: true,
    id: fileId,
    url: returnUrl,
    original_url: originalUrl,
    proxy_url: proxyUrl
  });
});

export default uploadApi;
