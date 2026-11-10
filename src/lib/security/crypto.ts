/**
 * Encryption at rest (AES-256-GCM) and secret hashing. Server-only.
 *   ENCRYPTION_KEY           base64 of 32 random bytes  (openssl rand -base64 32)
 *   ENCRYPTION_KEY_PREVIOUS  optional old key, used only for decryption during key rotation
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const DEV_KEY = createHash('sha256').update('numerology-dev-only-key-do-not-use-in-production').digest();

function keyFrom(b64: string | undefined): Buffer | null {
  if (!b64) return null;
  const k = Buffer.from(b64, 'base64');
  if (k.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes, base64 encoded');
  return k;
}

function keys(): { current: Buffer; all: Buffer[] } {
  const current = keyFrom(process.env.ENCRYPTION_KEY);
  const prev = keyFrom(process.env.ENCRYPTION_KEY_PREVIOUS);
  if (!current) {
    if (process.env.NODE_ENV === 'production') throw new Error('ENCRYPTION_KEY is required in production');
    return { current: DEV_KEY, all: [DEV_KEY] };
  }
  return { current, all: [current, ...(prev ? [prev] : [])] };
}

/** "v1.<iv>.<tag>.<ciphertext>" (base64url parts) */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', keys().current, iv);
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.');
}

export function decrypt(payload: string): string {
  const [v, iv, tag, ct] = payload.split('.');
  if (v !== 'v1' || !iv || !tag || ct === undefined) throw new Error('Unrecognised ciphertext');
  let lastErr: unknown;
  for (const key of keys().all) {
    try {
      const d = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
      d.setAuthTag(Buffer.from(tag, 'base64url'));
      return Buffer.concat([d.update(Buffer.from(ct, 'base64url')), d.final()]).toString('utf8');
    } catch (e) { lastErr = e; }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Decryption failed');
}

export const encryptJson = (v: unknown) => encrypt(JSON.stringify(v));
export const decryptJson = <T,>(s: string): T => JSON.parse(decrypt(s)) as T;

export const sha256Hex = (s: string) => createHash('sha256').update(s).digest('hex');
export const randomToken = (bytes = 24) => randomBytes(bytes).toString('base64url');

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [alg, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const got = scryptSync(pw, Buffer.from(salt, 'base64url'), expected.length, { N: 16384, r: 8, p: 1 });
  return expected.length === got.length && timingSafeEqual(expected, got);
}
