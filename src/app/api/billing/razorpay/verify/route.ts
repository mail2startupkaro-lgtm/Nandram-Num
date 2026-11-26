import { z } from 'zod';
import { syncRazorpayOrder } from '@/lib/billing/checkout';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = z.object({
      orderId: z.string().min(1),
      paymentId: z.string().min(1),
      signature: z.string().min(1),
    }).parse(await readJson(req));

    const result = await syncRazorpayOrder(body);
    return json(result);
  } catch (e) {
    console.error('Razorpay verify error:', e);
    return json({ status: 'failed', error: e instanceof Error ? e.message : 'Unknown' }, 400);
  }
}
