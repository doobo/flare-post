import { Hono } from "hono";
import { Bindings } from "../types";
import { decryptDictValue } from "../security/crypto";

const uploadApi = new Hono<{ Bindings: Bindings }>();

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

  const dict = await c.env.DB
    .prepare("SELECT value FROM dictionaries WHERE code = 'imge_api_key'")
    .first<{ value: string }>();

  if (!dict || !dict.value) {
    return c.json({ success: false, error: "im.ge API key not configured. Go to Dictionary settings to add it." }, 400);
  }

  let apiKey: string;
  try {
    apiKey = await decryptDictValue(dict.value, c.env);
  } catch (e) {
    return c.json({ success: false, error: "Failed to decrypt API key" }, 500);
  }

  const formData = new FormData();
  formData.append('image', file);

  const uploadRes = await fetch('https://im.ge/api/v1/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  const data = await uploadRes.json() as Record<string, any>;

  if (!uploadRes.ok) {
    return c.json({ success: false, error: data.error || "Upload to im.ge failed" }, 500);
  }

  const imageUrl = data.direct_url || data.cdn_url || data.url || data.data?.url || data.data?.direct_url;

  if (!imageUrl) {
    return c.json({ success: false, error: "Could not retrieve image URL from im.ge response" }, 500);
  }

  return c.json({ success: true, url: imageUrl });
});

export default uploadApi;
