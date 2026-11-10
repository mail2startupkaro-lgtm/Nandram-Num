import { describe, expect, it } from 'vitest';
import { ContactInput, normaliseContactPhone, redactLongNumbers } from '@/lib/contact';

describe('Contact form validation', () => {
  it('normalises Indian and international mobiles', () => {
    expect(normaliseContactPhone('98765 43210')).toBe('+919876543210');
    expect(normaliseContactPhone('+91-98765-43210')).toBe('+919876543210');
    expect(normaliseContactPhone('09876543210')).toBe('+919876543210');
    expect(normaliseContactPhone('+1 415 555 0100')).toBe('+14155550100');
    expect(normaliseContactPhone('12345')).toBeNull();
    expect(normaliseContactPhone('5876543210')).toBeNull();
  });
  it('requires name, mobile, topic, message; email optional', () => {
    const ok = ContactInput.parse({ name: 'Ravi', phone: '9876543210', email: '', topic: 'service', subject: 'life_report', message: 'Need a report' });
    expect(ok.email).toBeUndefined();
    expect(() => ContactInput.parse({ name: 'Ravi', phone: '123', topic: 'service', message: 'Hello there' })).toThrow();
    expect(() => ContactInput.parse({ name: 'Ravi', phone: '9876543210', email: 'bad', topic: 'support', message: 'Hello there' })).toThrow();
    expect(() => ContactInput.parse({ name: 'Ravi', phone: '9876543210', topic: 'support', subject: 'life_report', message: 'Hello there' })).toThrow();
    expect(() => ContactInput.parse({ name: 'R', phone: '9876543210', topic: 'other', message: 'Hello there' })).toThrow();
  });
  it('masks Aadhaar-like numbers in messages', () => {
    expect(redactLongNumbers('my aadhaar 2345 6789 0123 please')).toBe('my aadhaar XXXX-XXXX-0123 please');
    expect(redactLongNumbers('call 9876543210')).toBe('call 9876543210');
  });
});
