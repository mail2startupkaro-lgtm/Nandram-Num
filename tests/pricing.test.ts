import { describe, expect, it } from 'vitest';
import { DEFAULT_PLANS, getPlanPrices } from '@/lib/billing/plans';

describe('Two-tier pricing calculation (Real Price vs Offer Price)', () => {
  it('calculates real price, offer price, and discounts correctly for all DEFAULT_PLANS', () => {
    for (const plan of DEFAULT_PLANS) {
      const prices = getPlanPrices(plan);

      // Offer price must equal the plan's current selling price
      expect(prices.offerPricePaise).toBe(plan.pricePaise);

      // Real price must be higher than offer price
      expect(prices.realPricePaise).toBeGreaterThan(prices.offerPricePaise);

      // Discount amount must equal real - offer
      expect(prices.discountPaise).toBe(prices.realPricePaise - prices.offerPricePaise);

      // Discount percent must be between 1 and 99
      expect(prices.discountPercent).toBeGreaterThanOrEqual(1);
      expect(prices.discountPercent).toBeLessThan(100);
    }
  });

  it('handles SINGLE plan specifically', () => {
    const single = DEFAULT_PLANS.find((p) => p.code === 'SINGLE')!;
    const prices = getPlanPrices(single);
    expect(prices.realPricePaise).toBe(99_900); // ₹999
    expect(prices.offerPricePaise).toBe(49_900); // ₹499
    expect(prices.discountPaise).toBe(50_000); // ₹500
    expect(prices.discountPercent).toBe(50); // 50%
  });

  it('handles PACK5 plan specifically', () => {
    const pack5 = DEFAULT_PLANS.find((p) => p.code === 'PACK5')!;
    const prices = getPlanPrices(pack5);
    expect(prices.realPricePaise).toBe(4_99_500); // ₹4,995
    expect(prices.offerPricePaise).toBe(1_99_900); // ₹1,999
    expect(prices.discountPaise).toBe(2_99_600); // ₹2,996
    expect(prices.discountPercent).toBe(60); // 60%
  });

  it('falls back cleanly if mrpPaise is not specified or equal/lower', () => {
    const custom = {
      code: 'TEST',
      name: 'Test Plan',
      description: 'Test',
      pricePaise: 100_00,
      intervalDays: null,
      credits: 1,
      sort: 1,
      active: true,
      features: {},
    };
    const prices = getPlanPrices(custom);
    expect(prices.offerPricePaise).toBe(100_00);
    expect(prices.realPricePaise).toBe(199_00); // psychological ₹199 fallback
    expect(prices.discountPercent).toBe(50);
  });
});
