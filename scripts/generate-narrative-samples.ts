/** Writes sample narratives (offline template writer, or the configured LLM if env is set) into /samples. */
import { writeFileSync } from 'node:fs';
import { generateNumerology, verhoeffCheckDigit } from '../src/lib/numerology';
import { configFromEnv, generateNarrative, providerFromConfig } from '../src/lib/narrative';

const base = '23456789012';
const result = generateNumerology({
  fullName: 'Rahul Kumar Sharma', commonName: 'Rahul Sharma', gender: 'male', dob: '28-08-1990', profession: 'Software engineer',
  maritalStatus: 'engaged', city: 'Jaipur', state: 'Rajasthan', concerns: ['career', 'marriage', 'money'],
  mobile: '9876543210', aadhaar: base + verhoeffCheckDigit(base), aadhaarConsent: true,
  partner: { name: 'Priya Verma', gender: 'female', dob: '15-05-1992' },
}, { asOf: { day: 3, month: 11, year: 2026 } });

const provider = providerFromConfig(configFromEnv());
for (const language of ['en', 'hinglish'] as const) {
  const n = await generateNarrative(result, { language, provider });
  const md = [`# Numerology Report – ${result.client.commonName}`, '', ...n.sections.flatMap((s) => [`## ${s.title}`, '', s.text, ''])].join('\n');
  writeFileSync(`samples/narrative-${language}.md`, md);
  writeFileSync(`samples/narrative-${language}.json`, JSON.stringify(n, null, 2));
  console.log(language, n.writer, n.sections.length, 'sections,', md.split(/\s+/).length, 'words');
}
