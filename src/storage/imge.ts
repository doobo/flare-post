import { IStorageAdapter, StorageConfig, UploadResult } from "./interface";

function extractCodeFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.replace(/\/+$/, '').split('/').filter(Boolean);

    if (segments.length >= 2) {
      const secondLast = segments[segments.length - 2];
      if (/^[a-zA-Z0-9_-]{4,}$/.test(secondLast)) return secondLast;
    }

    const path = parsed.pathname.replace(/\/+$/, '');
    const patterns = [
      /\/images\/([a-zA-Z0-9_-]+)\.[a-zA-Z0-9]+$/,
      /\/i\/([a-zA-Z0-9_-]+)$/,
      /\/view\/([a-zA-Z0-9_-]+)$/,
    ];

    for (const p of patterns) {
      const m = path.match(p);
      if (m) return m[1];
    }

    const last = segments.pop() || '';
    const cleaned = last.replace(/\.\w+$/, '');
    if (/^[a-zA-Z0-9_-]{4,}$/.test(cleaned)) return cleaned;

    return null;
  } catch {
    return null;
  }
}

export class ImGeAdapter implements IStorageAdapter {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async upload(file: File | Blob, filename: string): Promise<UploadResult> {
    if (!this.config.accessKey) {
      throw new Error("Access Key is required for im.ge storage");
    }

    const formData = new FormData();
    formData.append('image', file);

    const uploadRes = await fetch('https://im.ge/api/v1/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessKey}`
      },
      body: formData
    });

    const body = await uploadRes.json() as Record<string, any>;

    if (!uploadRes.ok) {
      throw new Error(body.error || "Upload to im.ge failed");
    }

    const result = body.data || body;
    const url = result.direct_url || result.cdn_url || result.url || result.short_url ||
                result.viewer_url || result.seo_url ||
                body.data?.url || body.data?.direct_url;

    if (!url) {
      throw new Error("Could not retrieve image URL from im.ge response");
    }

    return { url };
  }

  async delete(fileUrl: string): Promise<boolean> {
    if (!this.config.accessKey) return false;

    const code = extractCodeFromUrl(fileUrl);
    if (!code) return false;

    try {
      const res = await fetch(`https://im.ge/api/v1/images/${code}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.accessKey}`
        }
      });

      return res.ok;
    } catch {
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    return this.config.accessKey;
  }
}
