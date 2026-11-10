import { describe, expect, it } from 'vitest';
import { verifyPassword } from '@/lib/security/crypto';
import { verifyCashfreeWebhook } from '@/lib/billing/cashfree';

describe('Security & Hardening Tests', () => {
  it('crypto: verifyPassword does not throw TypeError on mismatched hash buffer lengths', () => {
    // Malformed/different length hash in stored password
    const malformedStored = 'scrypt$AAAA$short';
    expect(() => verifyPassword('mypassword', malformedStored)).not.toThrow();
    expect(verifyPassword('mypassword', malformedStored)).toBe(false);
  });

  it('cashfree: verifyCashfreeWebhook rejects expired/replayed timestamps in production mode', () => {
    const cfg = { appId: 'app', secretKey: 'cfsk_ma_prod_secret', mode: 'production' as const, baseUrl: 'https://api.cashfree.com/pg' };
    const body = '{"type":"PAYMENT_SUCCESS_WEBHOOK"}';
    const oldTimestamp = String(Date.now() - 30 * 60_000); // 30 minutes old
    const sig = require('node:crypto').createHmac('sha256', cfg.secretKey).update(oldTimestamp + body).digest('base64');

    // Force NODE_ENV to production for this check
    const originalEnv = process.env.NODE_ENV;
    const env = process.env as Record<string, string | undefined>;
    try {
      env.NODE_ENV = 'production';
      expect(verifyCashfreeWebhook(cfg, body, sig, oldTimestamp)).toBe(false);
    } finally {
      env.NODE_ENV = originalEnv;
    }
  });

  it('PII: detects and rejects formatted 12-digit Aadhaar patterns', () => {
    const aadhaarRegex = /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b|\b\d{12}\b/;
    expect(aadhaarRegex.test('Client aadhaar: 2345 6789 0123')).toBe(true);
    expect(aadhaarRegex.test('Client aadhaar: 2345-6789-0123')).toBe(true);
    expect(aadhaarRegex.test('Client aadhaar: 234567890123')).toBe(true);
    // Regular text should not match
    expect(aadhaarRegex.test('Client phone: 9876543210')).toBe(false);
  });
});
