import { signOutOtherSessions } from '@/lib/auth/account-security';
import { readCookie } from '@/lib/auth/session';
import { json, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Sign out of every other device. */
export const DELETE = withUser(async (req, user) => json({ ok: true, sessionsEnded: await signOutOtherSessions(user.id, readCookie(req) ?? null) }));
