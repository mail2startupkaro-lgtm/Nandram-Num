import { afterEach, describe, it, expect } from 'vitest';
import {
  isRazorpayOrder,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  type RazorpayConfig,
} from '@/lib/billing/razorpay';
import { activeGateway } from '@/lib/billing/checkout';
import { createHmac } from 'node:crypto';

describe('Razorpay payment gateway', () => {
  const cfg: RazorpayConfig = {
    keyId: 'rzp_test_1234567890',
    keySecret: 'secret_key_abcdef123456',
    webhookSecret: 'webhook_secret_xyz789',
  };

  it('identifies razorpay order IDs correctly', () => {
    expect(isRazorpayOrder('order_abcdef123456')).toBe(true);
    expect(isRazorpayOrder('cf_abcdef123456')).toBe(false);
    expect(isRazorpayOrder('mock_abcdef123456')).toBe(false);
  });

  it('verifies client payment signature accurately', () => {
    const orderId = 'order_DA2918F39201';
    const paymentId = 'pay_98127398123';
    const validSignature = createHmac('sha256', cfg.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    expect(verifyRazorpayPaymentSignature(cfg, orderId, paymentId, validSignature)).toBe(true);
    expect(verifyRazorpayPaymentSignature(cfg, orderId, paymentId, 'invalid_signature')).toBe(false);
    expect(verifyRazorpayPaymentSignature(cfg, orderId, 'pay_wrong', validSignature)).toBe(false);
  });

  it('verifies webhook signature accurately', () => {
    const rawPayload = JSON.stringify({ event: 'order.paid', payload: { order: { entity: { id: 'order_123' } } } });
    const validSignature = createHmac('sha256', cfg.webhookSecret!)
      .update(rawPayload)
      .digest('hex');

    expect(verifyRazorpayWebhookSignature(cfg.webhookSecret!, rawPayload, validSignature)).toBe(true);
    expect(verifyRazorpayWebhookSignature(cfg.webhookSecret!, rawPayload, 'tampered_signature')).toBe(false);
  });

  it('selects active gateway based on currency and environment', () => {
    // When no keys are present in tests, falls back to mock
    const gw = activeGateway('INR');
    expect(['cashfree', 'razorpay', 'mock']).toContain(gw);
  });
});

describe('Razorpay webhook security', () => {
  const body = JSON.stringify({ event: 'order.paid', payload: { order: { entity: { id: 'order_FORGED123' } }, payment: { entity: { id: 'pay_FORGED', order_id: 'order_FORGED123' } } } });
  const post = async (headers: Record<string, string> = {}) => {
    const { POST } = await import('@/app/api/billing/razorpay/webhook/route');
    return POST(new Request('http://localhost/api/billing/razorpay/webhook', { method: 'POST', body, headers }));
  };
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it('rejects every event when no webhook secret is configured (forged "order.paid" cannot unlock an order)', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_x'; process.env.RAZORPAY_KEY_SECRET = 'sec';
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    expect((await post()).status).toBe(503);
  });

  it('rejects a bad or missing signature', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_x'; process.env.RAZORPAY_KEY_SECRET = 'sec'; process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec';
    expect((await post()).status).toBe(400);
    expect((await post({ 'x-razorpay-signature': 'deadbeef' })).status).toBe(400);
  });
});
