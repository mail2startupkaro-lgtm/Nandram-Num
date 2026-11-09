/** One-time-code login has been replaced by email/mobile + password (see /api/auth/login and /api/auth/signup). */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return new Response(JSON.stringify({ error: 'OTP_LOGIN_DISABLED' }), { status: 410, headers: { 'content-type': 'application/json' } });
}
