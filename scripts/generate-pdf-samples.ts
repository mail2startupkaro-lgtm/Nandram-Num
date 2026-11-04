/** Renders sample PDFs (dummy client) for every theme and module into /samples/pdf. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { generateNumerology, verhoeffCheckDigit } from '../src/lib/numerology';
import { closeBrowser, renderReportPdf } from '../src/lib/pdf/render';
import { THEMES, type ThemeId } from '../src/lib/pdf/themes';

const base = '23456789012';
const input = {
  fullName: 'Rahul Kumar Sharma', commonName: 'Rahul Sharma', hindiName: 'राहुल शर्मा', gender: 'male', dob: '28-08-1990', profession: 'Software engineer',
  maritalStatus: 'engaged', city: 'Jaipur', state: 'Rajasthan', concerns: ['career', 'marriage', 'money'],
  mobile: '9876543210', aadhaar: base + verhoeffCheckDigit(base), aadhaarConsent: true, language: 'en',
  partner: { name: 'Priya Verma', gender: 'female', dob: '15-05-1992' },
};
const asOf = { day: 3, month: 11, year: 2026 };
mkdirSync('samples/pdf', { recursive: true });
const only = process.argv[2];

const jobs: { file: string; modules: string[]; theme: ThemeId; language?: 'en' | 'hinglish' | 'hi' }[] = [
  ...Object.keys(THEMES).map((theme) => ({ file: `complete-${theme}.pdf`, modules: ['complete'], theme: theme as ThemeId })),
  { file: 'dob-report.pdf', modules: ['dob'], theme: 'saffron-cream' },
  { file: 'name-report.pdf', modules: ['name'], theme: 'cosmic-blue' },
  { file: 'mobile-report.pdf', modules: ['mobile'], theme: 'minimal-white' },
  { file: 'aadhaar-report.pdf', modules: ['aadhaar'], theme: 'royal-gold-maroon' },
  { file: 'couple-report.pdf', modules: ['couple'], theme: 'royal-gold-maroon' },
  { file: 'complete-hinglish.pdf', modules: ['complete'], theme: 'royal-gold-maroon', language: 'hinglish' },
];
for (const j of jobs.filter((j) => !only || j.file.includes(only))) {
  const result = generateNumerology(input, { asOf, modules: j.modules as never });
  const out = await renderReportPdf({ result, theme: j.theme, language: j.language });
  writeFileSync(`samples/pdf/${j.file}`, out.pdf);
  console.log(j.file.padEnd(36), `${out.pageCount} pages`.padEnd(10), `${out.ms} ms`, JSON.stringify(out.tocPages));
}
await closeBrowser();
