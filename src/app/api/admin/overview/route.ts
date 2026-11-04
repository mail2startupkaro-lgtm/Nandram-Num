import { overview } from '@/lib/admin/analytics';
import { withAdmin } from '@/lib/server/admin';
import { json } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withAdmin(async () => json(await overview()));
