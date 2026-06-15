import { Bindings } from "../types";

// Generate a random ID for short links
export const generateId = () => Math.random().toString(36).substring(2, 8);

// Helper function to hash password with SHA-256
export async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

let cachedKeyPair: { publicKey: CryptoKey; privateKey: CryptoKey } | null = null;

export async function getRSAKeyPair(env: Bindings): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
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

export async function decryptPassword(passwordBase64: string, env: Bindings): Promise<string> {
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

export function arrayBufferToPem(buffer: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

// Dictionary Encryption Helpers
let cachedDictKey: CryptoKey | null = null;

export async function getDictEncryptionKey(env: Bindings): Promise<CryptoKey> {
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

export async function encryptDictValue(plaintext: string, env: Bindings): Promise<string> {
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

export async function decryptDictValue(ciphertextBase64: string, env: Bindings): Promise<string> {
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
