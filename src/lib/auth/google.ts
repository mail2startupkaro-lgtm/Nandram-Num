/** Google sign-in (OAuth 2.0 authorization code + PKCE). Needs GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET. */
import { createHash } from 'node:crypto';
import { randomToken } from '@/lib/security/crypto';

export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export function googleAuthUrl(redirectUri: string) {
  const state = randomToken(16);
  const verifier = randomToken(48);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '', redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile',
    state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account',
  });
  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${q}`, state, verifier };
}

export interface GoogleProfile { sub: string; email: string; emailVerified: boolean; name?: string }

export async function exchangeGoogleCode(code: string, verifier: string, redirectUri: string, fetchImpl: typeof fetch = fetch): Promise<GoogleProfile> {
  const tokenRes = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, code_verifier: verifier, client_id: process.env.GOOGLE_CLIENT_ID ?? '', client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '', redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  });
  if (!tokenRes.ok) throw new Error(`Google token error ${tokenRes.status}`);
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error('Google token missing');
  const infoRes = await fetchImpl('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${access_token}` } });
  if (!infoRes.ok) throw new Error(`Google userinfo error ${infoRes.status}`);
  const info = (await infoRes.json()) as { sub: string; email: string; email_verified?: boolean; name?: string };
  return { sub: info.sub, email: info.email.toLowerCase(), emailVerified: !!info.email_verified, name: info.name };
}
