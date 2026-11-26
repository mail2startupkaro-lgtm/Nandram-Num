import { describe, expect, it } from 'vitest';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, dialCodeFor, isIndia } from '@/lib/countries';
import { intakeToPerson, personToIntake, cleanIntake } from '@/lib/reading/intake';
import { validateStep, EMPTY, toClientInput } from '@/components/wizard/state';
import { DICT } from '@/lib/i18n/dictionary';

describe('International & Country Selection', () => {
  it('correctly identifies India and foreign countries', () => {
    expect(isIndia('India')).toBe(true);
    expect(isIndia('india')).toBe(true);
    expect(isIndia('bharat')).toBe(true);
    expect(isIndia('IN')).toBe(true);
    expect(isIndia('')).toBe(true);
    expect(isIndia(undefined)).toBe(true);

    expect(isIndia('United States')).toBe(false);
    expect(isIndia('United Kingdom')).toBe(false);
    expect(isIndia('Canada')).toBe(false);
    expect(isIndia('Australia')).toBe(false);
    expect(isIndia('United Arab Emirates')).toBe(false);
  });

  it('provides country dial codes', () => {
    expect(dialCodeFor('India')).toBe('+91');
    expect(dialCodeFor('United States')).toBe('+1');
    expect(dialCodeFor('United Kingdom')).toBe('+44');
    expect(dialCodeFor('United Arab Emirates')).toBe('+971');
    expect(dialCodeFor('Australia')).toBe('+61');
  });

  it('validates foreign phone numbers when country is outside India', () => {
    const t = DICT.en;
    const foreignState = {
      ...EMPTY,
      country: 'United States',
      mobile: '+1 415 555 2671',
    };
    const errs = validateStep(2, foreignState, t);
    expect(errs.mobile).toBeUndefined();

    // Invalid phone number with too few digits
    const badState = {
      ...EMPTY,
      country: 'United States',
      mobile: '123',
    };
    const badErrs = validateStep(2, badState, t);
    expect(badErrs.mobile).toBeDefined();
  });

  it('preserves country in intakeToPerson and cleanIntake', () => {
    const details = {
      clientName: 'John Smith',
      dob: '1985-05-12',
      gender: 'male',
      country: 'United States',
      pob: 'California',
      mobile: '+14155552671',
    };
    const person = intakeToPerson('SVC_PERSONAL_REPORT', details, 'self');
    expect(person).not.toBeNull();
    expect(person?.country).toBe('United States');
    expect(person?.placeOfBirth).toBe('California');

    const intake = personToIntake('SVC_PERSONAL_REPORT', ['clientName', 'dob', 'gender', 'pob'], person);
    expect(intake.country).toBe('United States');

    const cleaned = cleanIntake(['clientName', 'dob', 'gender', 'pob'], details);
    expect(cleaned.country).toBe('United States');
  });

  it('outputs country in client input for calculation', () => {
    const s = {
      ...EMPTY,
      fullName: 'Emma Watson',
      gender: 'female' as const,
      dob: '1990-04-15',
      country: 'United Kingdom',
      city: 'London',
      state: 'Greater London',
    };
    const input = toClientInput(s);
    expect(input.country).toBe('United Kingdom');
    expect(input.city).toBe('London');
    expect(input.state).toBe('Greater London');
  });
});
