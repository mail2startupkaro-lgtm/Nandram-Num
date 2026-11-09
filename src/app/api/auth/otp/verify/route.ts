import { json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One-time-code sign-in is switched off by the owner's decision (sign in = email/mobile + password).
 * Codes are only used inside "Forgot password" (/api/auth/reset-password), which verifies the code itself.
 * Keeping this route open would let anyone sign in – or create an account – with just a code.
 */
export async function POST() {
  return json({ error: 'GONE', issues: [{ path: 'otp', message: 'Code sign-in is no longer available. Sign in with your password or use Forgot password.' }] }, 410);
}
