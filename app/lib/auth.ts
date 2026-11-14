// Edge runtime compatible auth — no Buffer, no Node.js crypto
export const TOKEN_NAME = 'admin_token';
const TOKEN_EXPIRY_SECONDS = 86400; // 24 soat

function uint8ToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlToUint8(str: string): Uint8Array<ArrayBuffer> {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createToken(username: string): Promise<string> {
  const key = await getKey();
  const header = uint8ToBase64Url(
    new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  );
  const payload = uint8ToBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        sub: username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
      })
    )
  );
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const signature = uint8ToBase64Url(new Uint8Array(signatureBuffer));
  return `${header}.${payload}.${signature}`;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, signature] = parts;
    const key = await getKey();
    const data = new TextEncoder().encode(`${header}.${payload}`);
    const sigBytes = base64UrlToUint8(signature);
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes.buffer as ArrayBuffer, data);
    if (!valid) return false;

    // Muddatini tekshirish
    const payloadJson = JSON.parse(
      new TextDecoder().decode(base64UrlToUint8(payload))
    );
    const now = Math.floor(Date.now() / 1000);
    return payloadJson.exp > now;
  } catch {
    return false;
  }
}
