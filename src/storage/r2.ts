import { IStorageAdapter, StorageConfig, UploadResult } from "./interface";

async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const enc = new TextEncoder().encode(message);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc);
  return new Uint8Array(sig);
}

async function sha256Hex(message: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<Uint8Array> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + key), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

async function awsSign(
  method: string, url: URL, headers: Record<string, string>,
  bodyHash: string, accessKey: string, secretKey: string,
  region: string, service: string
): Promise<Record<string, string>> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
  const dateStamp = amzDate.substring(0, 8);

  headers['x-amz-date'] = amzDate;
  headers['x-amz-content-sha256'] = bodyHash;

  const canonicalUri = url.pathname;
  const canonicalQueryString = url.search.substring(1);
  const sortedHeaderKeys = Object.keys(headers).sort();
  const signedHeaders = sortedHeaderKeys.map(h => h.toLowerCase()).join(';');
  const canonicalHeaders = sortedHeaderKeys.map(h => `${h.toLowerCase()}:${headers[h]}\n`).join('');

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`;
  const canonicalRequestHash = await sha256Hex(canonicalRequest);

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  const signingKey = await getSignatureKey(secretKey, dateStamp, region, service);
  const signatureBytes = await hmacSha256(signingKey, stringToSign);
  const signature = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  headers['Authorization'] = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return headers;
}

export class R2Adapter implements IStorageAdapter {
  private config: StorageConfig;
  private endpoint: string;
  private bucket: string;

  constructor(config: StorageConfig) {
    this.config = config;

    if (config.uploadUrl) {
      const url = new URL(config.uploadUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      this.bucket = pathParts[0] || '';
      this.endpoint = `${url.protocol}//${url.hostname}`;
    } else {
      throw new Error("Upload URL is required for R2 storage");
    }
  }

  async upload(file: File | Blob, filename: string): Promise<UploadResult> {
    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error("Access Key and Secret Key are required for R2 storage");
    }

    const body = file instanceof File ? file : new File([file], filename);
    const buf = await body.arrayBuffer();
    const bodyHash = await sha256Hex(new TextDecoder().decode(buf));
    const key = filename;

    const url = new URL(`${this.endpoint}/${this.bucket}/${key}`);

    const headers: Record<string, string> = {
      'host': url.hostname,
      'content-type': body.type || 'application/octet-stream',
      'content-length': buf.byteLength.toString(),
    };

    await awsSign('PUT', url, headers, bodyHash, this.config.accessKey, this.config.secretKey, 'auto', 's3');

    const uploadRes = await fetch(url.toString(), {
      method: 'PUT',
      headers,
      body: buf
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`R2 upload failed: ${uploadRes.status} ${errText}`);
    }

    const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;
    return { url: publicUrl };
  }

  async delete(fileUrl: string): Promise<boolean> {
    if (!this.config.accessKey || !this.config.secretKey) {
      return false;
    }

    let key: string;
    try {
      const parsed = new URL(fileUrl);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0] === this.bucket) {
        key = pathParts.slice(1).join('/');
      } else {
        key = pathParts.join('/');
      }
    } catch {
      return false;
    }

    if (!key) return false;

    const url = new URL(`${this.endpoint}/${this.bucket}/${key}`);
    const bodyHash = 'e3b3c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const headers: Record<string, string> = {
      'host': url.hostname,
    };

    await awsSign('DELETE', url, headers, bodyHash, this.config.accessKey, this.config.secretKey, 'auto', 's3');

    const delRes = await fetch(url.toString(), {
      method: 'DELETE',
      headers
    });

    return delRes.ok || delRes.status === 204;
  }

  async getToken(): Promise<string | null> {
    return this.config.accessKey;
  }
}
