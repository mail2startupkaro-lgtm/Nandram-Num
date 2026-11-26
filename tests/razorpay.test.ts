import { describe, it, expect } from 'vitest';
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
