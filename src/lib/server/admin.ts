import type { User } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth/current-user';
import { withUser } from './http';

/** withUser + super_admin only. */
export function withAdmin<P = Record<string, string>>(fn: (req: Request, user: User, ctx: { params: P }) => Promise<Response>) {
  return withUser<P>(async (req, user, ctx) => { requireRole(user, 'super_admin'); return fn(req, user, ctx); });
}
