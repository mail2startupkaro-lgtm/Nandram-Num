import { describe, expect, it } from 'vitest';
import { countryFromHeaders, currencyForRequest, formatMoney, intlPhone, planPrice } from '@/lib/billing/currency';
import { dollarsInWords } from '@/lib/billing/invoice';

const req = (h: Record<string, string>) => new Request('https://x.test/api', { headers: h });

describe('currency', () => {
  it('detects the visitor country and picks the currency', () => {
    expect(countryFromHeaders(new Headers({ 'x-vercel-ip-country': 'us' }))).toBe('US');
    expect(countryFromHeaders(new Headers({ 'cf-ipcountry': 'XX' }))).toBeNull();
    expect(currencyForRequest(req({ 'x-vercel-ip-country': 'IN' })).currency).toBe('INR');
    expect(currencyForRequest(req({ 'x-vercel-ip-country': 'GB' })).currency).toBe('USD');
    expect(currencyForRequest(req({})).currency).toBe('INR'); // unknown (local) → ₹
    expect(currencyForRequest(req({ 'x-vercel-ip-country': 'US', cookie: 'a=1; mn_cur=INR' }))).toMatchObject({ currency: 'INR', chosen: true });
    expect(currencyForRequest(req({ 'x-vercel-ip-country': 'IN', cookie: 'mn_cur=USD' })).currency).toBe('USD');
    expect(currencyForRequest(req({ cookie: 'mn_cur=EUR' })).currency).toBe('INR');
  });

  it('prices plans in USD only when a USD price is set', () => {
    const single = { code: 'SINGLE', pricePaise: 49_900, credits: 1, features: { usdCents: 999 } };
    expect(planPrice(single, 'INR')).toMatchObject({ currency: 'INR', price: 49_900, real: 99_900, percent: 50 });
    expect(planPrice(single, 'USD')).toMatchObject({ currency: 'USD', price: 999, real: 1999, discount: 1000 });
    expect(planPrice({ ...single, features: { usdCents: 999, usdMrpCents: 2999 } }, 'USD')).toMatchObject({ real: 2999, percent: 67 });
    expect(planPrice({ ...single, features: {} }, 'USD').currency).toBe('INR');
  });

  it('formats money and words', () => {
    expect(formatMoney(1_99_900, 'INR')).toBe('₹1,999');
    expect(formatMoney(2499, 'USD')).toBe('$24.99');
    expect(formatMoney(1_234_500, 'USD')).toBe('$12,345');
    expect(dollarsInWords(123_450)).toBe('One Thousand Two Hundred Thirty Four US Dollars and Fifty Cents Only');
  });

  it('accepts international phone numbers with a country code only', () => {
    expect(intlPhone('+1 (415) 555-0123')).toBe('+14155550123');
    expect(intlPhone('0044 20 7946 0958')).toBe('+442079460958');
    expect(intlPhone('4155550123')).toBeNull();
    expect(intlPhone('+12')).toBeNull();
  });
});

describe('international helpers', () => {
  it('shows working hours in the visitor time zone', async () => {
    const { workingHoursLabel, istHourIn } = await import('@/lib/client/working-hours');
    expect(workingHoursLabel('Asia/Kolkata', false)).toBe('8 am and 10 pm IST');
    expect(istHourIn('Asia/Dubai', 8)).toBe('6:30 am');      // UTC+4
    expect(istHourIn('Europe/London', 22)).toMatch(/^(4|5):30 pm$/); // GMT / BST
    expect(workingHoursLabel('Asia/Dubai', false)).toBe('8 am and 10 pm IST (6:30 am – 8:30 pm your time)');
  });

  it('accepts international mobiles for sign-up and login', async () => {
    const { normaliseIdentifier } = await import('@/lib/auth/otp');
    expect(normaliseIdentifier('sms', '98765 43210')).toBe('+919876543210');
    expect(normaliseIdentifier('sms', '+1 (415) 555-0123')).toBe('+14155550123');
    expect(() => normaliseIdentifier('sms', '4155550123')).toThrow('INVALID_MOBILE');
    expect(() => normaliseIdentifier('sms', '+91 12345 67890')).toThrow('INVALID_MOBILE'); // invalid Indian number stays invalid
  });

  it('prices services in $ when a $ fee is set', async () => {
    const { serviceReal } = await import('@/components/services/service-price');
    expect(serviceReal({ pricePaise: 110_000, mrpPaise: 210_000, usdCents: 2900, usdMrpCents: null }, 'USD')).toBe(5499);
    expect(serviceReal({ pricePaise: 110_000, mrpPaise: null, usdCents: 2900, usdMrpCents: 5900 }, 'USD')).toBe(5900);
    expect(serviceReal({ pricePaise: 110_000, mrpPaise: null }, 'INR')).toBe(220_000);
  });
});
