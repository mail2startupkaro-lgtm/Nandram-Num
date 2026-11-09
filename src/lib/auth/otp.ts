/** One-time codes for email and mobile login. Codes are hashed, short-lived, attempt- and rate-limited. */
import { randomInt } from 'node:crypto';
import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { normalizeIndianMobile } from '@/lib/numerology';
import { sha256Hex } from '@/lib/security/crypto';
import { getDb, type Db } from '@/lib/db/client';
import { otpCodes, users, type User } from '@/lib/db/schema';
import { defaultSender, type Sender } from './senders';

export const OTP_TTL_MS = 10 * 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_GAP_MS = 30_000;
export const OTP_MAX_PER_HOUR = 5;
export const OTP_MAX_PER_IP_HOUR = 20;

export class AuthError extends Error { constructor(public code: string, public status = 400) { super(code); } }

export function normaliseIdentifier(channel: 'email' | 'sms', raw: string): string {
  if (channel === 'email') {
    const e = raw.trim().toLowerCase();
    if (!z.string().email().max(320).safeParse(e).success) throw new AuthError('INVALID_EMAIL');
    return e;
  }
  try { return `+91${normalizeIndianMobile(raw)}`; } catch { throw new AuthError('INVALID_MOBILE'); }
}

const pepper = () => process.env.OTP_PEPPER || process.env.ENCRYPTION_KEY || 'dev-pepper';
const idHash = (channel: string, ident: string) => sha256Hex(`${channel}:${ident}`);
const codeHash = (code: string, ih: string) => sha256Hex(`${code}:${ih}:${pepper()}`);

export async function requestOtp(channel: 'email' | 'sms', raw: string, opts: { ip?: string; sender?: Sender; brand?: string } = {}, db: Db = getDb()) {
  const ident = normaliseIdentifier(channel, raw);
  const ih = idHash(channel, ident);
  const hourAgo = new Date(Date.now() - 3_600_000);
  const recent = await db.select({ createdAt: otpCodes.createdAt }).from(otpCodes)
    .where(and(eq(otpCodes.identifierHash, ih), gte(otpCodes.createdAt, hourAgo))).orderBy(desc(otpCodes.createdAt));
  if (recent.length >= OTP_MAX_PER_HOUR) throw new AuthError('TOO_MANY_REQUESTS', 429);
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < OTP_RESEND_GAP_MS) throw new AuthError('WAIT_BEFORE_RESEND', 429);
  if (opts.ip) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(otpCodes).where(and(eq(otpCodes.ip, opts.ip), gte(otpCodes.createdAt, hourAgo)));
    if (n >= OTP_MAX_PER_IP_HOUR) throw new AuthError('TOO_MANY_REQUESTS', 429);
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  // older unused codes for this identifier stop working (below)
  const send = opts.sender ?? defaultSender(channel); // throws in production when no provider is configured
  await db.update(otpCodes).set({ consumedAt: new Date() }).where(and(eq(otpCodes.identifierHash, ih), isNull(otpCodes.consumedAt)));
  await db.insert(otpCodes).values({ channel, identifierHash: ih, codeHash: codeHash(code, ih), expiresAt: new Date(Date.now() + OTP_TTL_MS), ip: opts.ip });
  await send({ channel, to: ident, code, brand: opts.brand ?? process.env.BRAND_NAME ?? 'Numerology' });
  // SECURITY: the code is only ever shown on screen on a development machine – never on a live site,
  // otherwise anyone could reset anyone's password (including the super admin's) from "Forgot password".
  const providerMissing = channel === 'email' ? !process.env.RESEND_API_KEY : !process.env.MSG91_AUTH_KEY;
  const exposeForDev = process.env.NODE_ENV !== 'production' && (process.env.AUTH_DEV_SHOW_OTP === '1' || providerMissing);
  return { identifier: ident, ...(exposeForDev ? { devCode: code } : {}) };
}

export const superAdmins = () => (process.env.SUPER_ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
/** Mobile numbers (any Indian format) that are Super Admin – SUPER_ADMIN_MOBILES, comma-separated. */
export const superAdminMobiles = () => (process.env.SUPER_ADMIN_MOBILES ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  .flatMap((m) => { try { return [`+91${normalizeIndianMobile(m)}`]; } catch { return []; } });
export const isSuperAdmin = (email?: string | null, phone?: string | null) =>
  (!!email && superAdmins().includes(email.toLowerCase())) || (!!phone && superAdminMobiles().includes(phone));
/** "a@b.com" → email, anything else → Indian mobile. */
export const detectChannel = (raw: string): 'email' | 'sms' => (raw.includes('@') ? 'email' : 'sms');

/** Verifies the code and returns the (created if needed) user. */
export async function verifyOtp(channel: 'email' | 'sms', raw: string, code: string, opts: { name?: string } = {}, db: Db = getDb()): Promise<User> {
  const ident = normaliseIdentifier(channel, raw);
  const ih = idHash(channel, ident);
  if (!/^\d{6}$/.test(code)) throw new AuthError('INVALID_CODE');
  const [row] = await db.select().from(otpCodes).where(and(eq(otpCodes.identifierHash, ih), isNull(otpCodes.consumedAt))).orderBy(desc(otpCodes.createdAt)).limit(1);
  if (!row || row.expiresAt.getTime() < Date.now()) throw new AuthError('CODE_EXPIRED');
  if (row.attempts >= OTP_MAX_ATTEMPTS) throw new AuthError('TOO_MANY_ATTEMPTS', 429);
  if (row.codeHash !== codeHash(code, ih)) {
    await db.update(otpCodes).set({ attempts: sql`${otpCodes.attempts} + 1` }).where(eq(otpCodes.id, row.id));
    throw new AuthError(row.attempts + 1 >= OTP_MAX_ATTEMPTS ? 'TOO_MANY_ATTEMPTS' : 'WRONG_CODE', row.attempts + 1 >= OTP_MAX_ATTEMPTS ? 429 : 400);
  }
  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, row.id));
  return upsertVerifiedUser(channel === 'email' ? { email: ident } : { phone: ident }, opts.name, db);
}

export async function upsertVerifiedUser(who: { email?: string; phone?: string; googleSub?: string }, name: string | undefined, db: Db = getDb()): Promise<User> {
  const now = new Date();
  const where = who.googleSub ? eq(users.googleSub, who.googleSub) : who.email ? eq(users.email, who.email) : eq(users.phone, who.phone!);
  let [u] = await db.select().from(users).where(where).limit(1);
  if (!u && who.googleSub && who.email) [u] = await db.select().from(users).where(eq(users.email, who.email)).limit(1); // link Google to existing email account
  const isAdmin = !!who.email && superAdmins().includes(who.email);
  if (!u) {
    [u] = await db.insert(users).values({
      email: who.email, phone: who.phone, googleSub: who.googleSub, name: name?.trim().slice(0, 120) || null,
      role: isAdmin ? 'super_admin' : 'customer', emailVerifiedAt: who.email ? now : null, phoneVerifiedAt: who.phone ? now : null, lastLoginAt: now,
    }).returning();
  } else {
    [u] = await db.update(users).set({
      lastLoginAt: now, ...(who.email && !u.emailVerifiedAt ? { emailVerifiedAt: now } : {}), ...(who.phone && !u.phoneVerifiedAt ? { phoneVerifiedAt: now } : {}),
      ...(who.googleSub && !u.googleSub ? { googleSub: who.googleSub } : {}), ...(isAdmin && u.role !== 'super_admin' ? { role: 'super_admin' as const } : {}),
      ...(!u.name && name ? { name: name.trim().slice(0, 120) } : {}),
    }).where(eq(users.id, u.id)).returning();
  }
  if (u.disabledAt) throw new AuthError('ACCOUNT_DISABLED', 403);
  return u;
}
