/** Password hashing with scrypt (node:crypto). Format: scrypt$<salt hex>$<hash hex>. */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEYLEN = 64;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, KEYLEN, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  // Always do the work so timing doesn't reveal whether an account has a password.
  const [scheme, saltHex, hashHex] = (stored ?? '').split('$');
  const salt = Buffer.from(saltHex || '00', 'hex');
  const key = await derive(password, salt);
  if (scheme !== 'scrypt' || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  return expected.length === key.length && timingSafeEqual(expected, key);
}
