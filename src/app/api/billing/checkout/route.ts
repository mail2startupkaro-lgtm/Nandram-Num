import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { CheckoutError, createCheckout } from '@/lib/billing/checkout';
import { cashfreePhone } from '@/lib/billing/cashfree';
import { INDIAN_STATES } from '@/components/wizard/state';
import { clientIp, json, readJson } from '@/lib/server/http';
import { getOptionalUser } from '@/lib/auth/current-user';
import { createSession, sessionCookie } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let user = await getOptionalUser(req);
    const body = z.object({
      planCode: z.string().max(30),
      coupon: z.string().max(40).optional(),
      billingName: z.string().max(120).optional(),
      billingState: z.string().refine((s) => INDIAN_STATES.includes(s), 'Choose your state'),
      gstin: z.string().max(15).optional(),
      phone: z.string().max(20).optional(),
      email: z.string().email().optional(),
    }).parse(await readJson(req));

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
      const phoneClean = cashfreePhone(body.phone);
      if (!phoneClean) {
        return json({ error: 'PHONE_REQUIRED', issues: [{ path: 'phone', message: 'Enter a valid 10-digit mobile number for payment.' }] }, 400);
      }

      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing) {
        user = existing;
        const patch: Partial<typeof users.$inferInsert> = {};
        if (!existing.phone && phoneClean) patch.phone = `+91${phoneClean}`;
        if (!existing.name && body.billingName) patch.name = body.billingName;
        if (!existing.billingState && body.billingState) patch.billingState = body.billingState;
        if (Object.keys(patch).length > 0) {
          await db.update(users).set(patch).where(eq(users.id, existing.id));
        }
      } else {
        const [created] = await db.insert(users).values({
          email,
          phone: `+91${phoneClean}`,
          name: body.billingName?.trim() || email.split('@')[0],
          billingState: body.billingState,
          role: 'customer',
        }).returning();
        user = created;
      }
      sessionToken = await createSession(user.id, req.headers.get('user-agent'), db);
    }

    const order = await createCheckout(user, body);
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
