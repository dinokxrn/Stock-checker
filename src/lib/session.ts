export const SESSION_COOKIE_NAME = "stock_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "stock_checker_session_secret_2026_super_secure_key";

// Web Crypto HMAC helper for standard, runtime-agnostic session tokens
async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates an HMAC-signed session token valid for 30 days
 */
export async function createSessionToken(): Promise<string> {
  const payloadObj = { authenticated: true, t: Date.now() };
  const payloadJson = JSON.stringify(payloadObj);
  const enc = new TextEncoder();
  const payloadBytes = enc.encode(payloadJson);
  const payloadB64 = toBase64Url(payloadBytes);

  const key = await getCryptoKey();
  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(payloadB64) as unknown as BufferSource
  );
  const sigB64 = toBase64Url(new Uint8Array(sigBytes));

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verifies the authenticity and validity of the session token
 */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  try {
    const enc = new TextEncoder();
    const key = await getCryptoKey();
    const sigBytes = fromBase64Url(sigB64);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(payloadB64) as unknown as BufferSource
    );
    if (!isValid) return false;

    const payloadBytes = fromBase64Url(payloadB64);
    const payloadStr = new TextDecoder().decode(payloadBytes);
    const data = JSON.parse(payloadStr);

    // 30 days expiration
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    const isNotExpired = Date.now() - data.t < maxAge && Date.now() >= data.t - 60000;
    return Boolean(data.authenticated && isNotExpired);
  } catch {
    return false;
  }
}
