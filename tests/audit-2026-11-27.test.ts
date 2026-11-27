/** Regression tests for the 27 Nov security audit. */
import { afterEach, describe, expect, it } from 'vitest';
import { isVerifiedSuperAdmin } from '@/lib/auth/otp';

describe('super admin needs a verified identity', () => {
  const env = process.env.SUPER_ADMIN_EMAILS;
  afterEach(() => { process.env.SUPER_ADMIN_EMAILS = env; });
  it('an unverified email in the admin list is NOT admin (password sign-up does not verify email)', () => {
    process.env.SUPER_ADMIN_EMAILS = 'owner@example.com';
    const base = { email: 'owner@example.com', phone: '+919800000000', emailVerifiedAt: null, phoneVerifiedAt: null, role: 'customer' as const };
    expect(isVerifiedSuperAdmin(base)).toBe(false);
    expect(isVerifiedSuperAdmin({ ...base, phoneVerifiedAt: new Date() })).toBe(false); // verified phone does not prove the email
    expect(isVerifiedSuperAdmin({ ...base, emailVerifiedAt: new Date() })).toBe(true);
    expect(isVerifiedSuperAdmin({ ...base, email: 'someone@example.com', role: 'super_admin' })).toBe(true); // existing admins stay admin
  });
});

describe('Content-Security-Policy allows both payment gateways', () => {
  it('Razorpay (international) and Cashfree (India) checkout can load', async () => {
    // @ts-expect-error – plain JS config file
    const cfg = (await import('../next.config.mjs')).default as { headers: () => Promise<{ headers: { key: string; value: string }[] }[]> };
    const csp = (await cfg.headers()).flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')!.value;
    const dir = (name: string) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? '';
    expect(dir('script-src')).toContain('https://checkout.razorpay.com');
    expect(dir('frame-src')).toContain('https://api.razorpay.com');
    expect(dir('connect-src')).toContain('https://api.razorpay.com');
    expect(dir('script-src')).toContain('https://*.cashfree.com');
    expect(dir('frame-ancestors')).toBe("frame-ancestors 'none'");
  });
});
