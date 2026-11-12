import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { CheckoutError, createCheckout } from '@/lib/billing/checkout';
import { cashfreePhone } from '@/lib/billing/cashfree';
import { currencyForRequest, intlPhone, OUTSIDE_INDIA } from '@/lib/billing/currency';
import { INDIAN_STATES } from '@/components/wizard/state';
import { clientIp, json, readJson } from '@/lib/server/http';
import { getOptionalUser } from '@/lib/auth/current-user';
import { createSession, sessionCookie } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { or } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let user = await getOptionalUser(req);
    const body = z.object({
      planCode: z.string().max(30),
      coupon: z.string().max(40).optional(),
      billingName: z.string().max(120).optional(),
      billingState: z.string().refine((s) => INDIAN_STATES.includes(s) || s === OUTSIDE_INDIA, 'Choose your state'),
      gstin: z.string().max(15).optional(),
      phone: z.string().max(20).optional(),
      email: z.string().email().optional(),
      intake: z.record(z.string(), z.string().max(2000)).optional(),
    }).parse(await readJson(req));

    const { currency } = currencyForRequest(req);
    const ip = clientIp(req);
    const rl = rateLimit(`checkout:${user ? user.id : ip}`, 20, 10 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);

    let sessionToken: string | undefined;
    const db = getDb();

    // If user is not logged in, auto-create/find account using email + mobile
    if (!user) {
      const email = body.email?.trim().toLowerCase();
      if (!email) {
        return json({ error: 'EMAIL_REQUIRED', issues: [{ path: 'email', message: 'Enter your email address to receive your report and invoice.' }] }, 400);
      }
      // Indian 10-digit mobile, or an international number with country code (+1…, +44…) for clients abroad.
      const indian = cashfreePhone(body.phone);
      const storedPhone = indian ? `+91${indian}` : intlPhone(body.phone);
      if (!storedPhone) {
        return json({ error: 'PHONE_REQUIRED', issues: [{ path: 'phone', message: 'Enter a valid mobile number (10 digits, or with country code like +1 for outside India).' }] }, 400);
      }

      // SECURITY: never sign a visitor into an account they have not proved they own. If the email or mobile
      // already belongs to an account, ask them to sign in first (otherwise anyone could take over an account
      // just by typing its email at checkout).
      const [existing] = await db.select({ id: users.id }).from(users).where(or(eq(users.email, email), eq(users.phone, storedPhone))).limit(1);
      if (existing) {
        return json({ error: 'LOGIN_REQUIRED', issues: [{ path: 'email', message: 'An account with this email or mobile already exists. Please sign in to continue.' }] }, 409);
      }
      const [created] = await db.insert(users).values({
        email,
        phone: storedPhone,
        name: body.billingName?.trim() || email.split('@')[0],
        billingState: body.billingState,
        role: 'customer',
      }).returning();
      user = created;
      sessionToken = await createSession(user.id, req.headers.get('user-agent'), db);
    }

    const order = await createCheckout(user!, { ...body, currency });
    const headers: Record<string, string> = {};
    if (sessionToken) {
      headers['set-cookie'] = sessionCookie(sessionToken);
    }
    return json(order, 201, headers);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return json({ error: 'VALIDATION', issues: e.issues }, 400);
    }
    if (e instanceof CheckoutError) {
      return json({ error: e.code }, 400);
    }
    if (e instanceof Error && e.message.startsWith('Cashfree')) {
      console.error('cashfree checkout:', e.message);
      return json({ error: 'GATEWAY_ERROR', issues: [{ path: 'gateway', message: 'The payment gateway did not accept the order. Please try again in a minute.' }] }, 502);
    }
    console.error('checkout error:', e);
    return json({ error: 'INTERNAL' }, 500);
  }
}
