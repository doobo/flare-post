import JSEncrypt from 'jsencrypt'

let cachedPublicKey: { jwk: JsonWebKey; pem: string } | null = null

export async function encryptPassword(password: string): Promise<{ encrypted: string; method: 'oaep' | 'jsencrypt' }> {
  const secure = window.isSecureContext && !!window.crypto.subtle

  if (!cachedPublicKey) {
    const res = await fetch('/api/auth/public-key')
    if (!res.ok) throw new Error('Failed to retrieve public key')
    const data = await res.json()
    if (!data.jwk || !data.pem) throw new Error('Invalid public key response')
    cachedPublicKey = data as { jwk: JsonWebKey; pem: string }
  }

  const { jwk, pem } = cachedPublicKey!

  if (secure) {
    const publicKey = await window.crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true, ['encrypt']
    )
    const encoded = new TextEncoder().encode(password)
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' }, publicKey, encoded
    )
    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      method: 'oaep'
    }
  } else {
    const encrypt = new JSEncrypt()
    encrypt.setPublicKey(pem)
    const encrypted = encrypt.encryptOAEP(password)
    if (!encrypted) throw new Error('Fallback encryption failed')
    return { encrypted, method: 'jsencrypt' }
  }
}
