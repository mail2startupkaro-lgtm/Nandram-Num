import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { LEGAL } from '@/lib/seo/site';
import { DISCLAIMER } from '@/lib/disclaimer';

export const metadata: Metadata = {
  title: 'Numerology Disclaimer',
  description: 'Numerology on myNumerologist.com is traditional guidance, not a guaranteed prediction or professional medical, legal or financial advice. Read the full disclaimer.',
  alternates: { canonical: '/disclaimer' },
};

const toSections = (pts: { h: string; p: string }[]) => pts.map((x) => ({ h: x.h, p: [x.p] }));

export default function Disclaimer() {
  const { en, hi } = DISCLAIMER;
  return <LegalPage title={en.title} updated={LEGAL.updated}
    sections={[{ h: 'Summary', p: [en.short] }, ...toSections(en.points)]}
    hi={{ title: hi.title, updated: LEGAL.updatedHi, sections: [{ h: 'सारांश', p: [hi.short] }, ...toSections(hi.points)] }} />;
}
