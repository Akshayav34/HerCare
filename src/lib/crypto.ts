// Cryptographic utilities for secure opaque bearer tokens & SHA-256 hashing

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  throw new Error('Web Cryptography API is not available in this environment.');
}

/**
 * Generates a cryptographically strong random bearer token string (e.g. 32 bytes hex = 64 characters)
 * Uses crypto.getRandomValues for 256 bits of true cryptographic entropy.
 */
export function generateSecureToken(byteLength: number = 32): string {
  const cryptoObj = getCrypto();
  const array = new Uint8Array(byteLength);
  cryptoObj.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes the SHA-256 hex digest of a token string.
 * This is what gets stored on the server/database, so the plain bearer token is never stored in DB plaintext.
 */
export async function sha256Hash(text: string): Promise<string> {
  const cryptoObj = getCrypto();
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Anonymizes an IP or User Agent string for data minimization logs
 */
export async function anonymizeString(value: string): Promise<string> {
  if (!value) return 'unknown';
  const hash = await sha256Hash(value);
  return hash.substring(0, 16); // Only first 16 chars of hash
}
