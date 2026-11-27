import * as React from 'react';
import Image from 'next/image';
import { Bi, ForLang } from '@/components/i18n/bi';
import { CheckCircle2, ShieldAlert, Sparkles, Star } from 'lucide-react';
import { ageRange, destinyMatrix } from '@/lib/destiny/matrix';
import { destinySvg } from '@/lib/destiny/svg';
import { psychomatrix } from '@/lib/psychomatrix/engine';
import { psychomatrixSvg } from '@/lib/psychomatrix/report';

interface ReportPage {
  src?: string;
  badge?: { en: string; hi: string };
  header?: { en: string; hi: string };
  sub?: { en: string; hi: string };
  caption: { en: string; hi: string };
  renderDoc?: (hi: boolean) => React.ReactNode;
}

interface ServiceReportMeta {
  kicker: { en: string; hi: string };
  h2: { en: string; hi: string };
  desc: { en: string; hi: string };
  pages: ReportPage[];
}

const SIGNATURE_PAGES: ReportPage[] = [
  { src: '/images/signature-report/cover.webp', caption: { en: 'Cover – your signature, score and key numbers', hi: 'मुखपृष्ठ – आपका हस्ताक्षर, स्कोर और मुख्य अंक' } },
  { src: '/images/signature-report/features.webp', caption: { en: 'What your signature shows – feature by feature', hi: 'आपका हस्ताक्षर क्या दर्शाता है – हर विशेषता' } },
  { src: '/images/signature-report/numerology.webp', caption: { en: 'Numerology & the best way to sign your name', hi: 'अंक ज्योतिष और नाम लिखने का सबसे अच्छा तरीका' } },
  { src: '/images/signature-report/blueprint.webp', caption: { en: 'Your ideal signature, start dates & 21-day chart', hi: 'आपका आदर्श हस्ताक्षर, आरंभ तिथियाँ और 21 दिन का चार्ट' } },
];

const PERSONAL_PAGES: ReportPage[] = [
  { src: '/images/personal-report/cover.webp', caption: { en: 'Cover – your profile, core numbers & destiny chart', hi: 'मुखपृष्ठ – आपकी प्रोफ़ाइल, मूल अंक और भाग्य चार्ट' } },
  { src: '/images/personal-report/grid.webp', caption: { en: 'Lo Shu 3×3 Grid – energy planes, missing & repeated numbers', hi: 'लो शू ग्रिड – ऊर्जा तल, अनुपस्थित और दोहराए गए अंक' } },
  { src: '/images/personal-report/forecast.webp', caption: { en: 'Timing & Forecast – 9-year Personal Year chart & monthly cycle', hi: 'समय और भविष्यफल – 9-वर्षीय व्यक्तिगत वर्ष और मासिक चक्र' } },
  { src: '/images/personal-report/remedies.webp', caption: { en: 'Remedies & Solutions – lucky colours, days, gemstone & mantra', hi: 'व्यक्तिगत उपाय – शुभ रंग, दिन, रत्न और मंत्र' } },
];


/* ---------- Destiny Matrix & Pythagorean birth chart: page previews drawn from the real sample (Riya, 14-08-1992) ---------- */
const RIYA_DM = destinyMatrix('1992-08-14');
const RIYA_PM = psychomatrix('1992-08-14');
function MiniPage({ head, page, total, title, children }: { head: string; page: number; total: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col justify-between p-3.5 text-stone-800 sm:p-4">
      <div>
        <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
          <span className="font-semibold uppercase tracking-wider">{head}</span>
          <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">{page} / {total}</span>
        </div>
        <h4 className="mt-2 font-serif text-xs font-bold text-stone-900 sm:text-sm">{title}</h4>
        <div className="mt-2">{children}</div>
      </div>
      <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500"><span className="font-semibold text-amber-900">myNumerologist.com</span><span>{page} / {total}</span></div>
    </div>
  );
}
const Rows = ({ rows }: { rows: [string, string][] }) => (
  <div className="space-y-1 text-[8.5px]">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-2 rounded border border-stone-200 bg-white/70 px-1.5 py-1"><span className="text-stone-600">{k}</span><b className="text-right text-amber-900">{v}</b></div>)}</div>
);
const DESTINY_PAGES: ReportPage[] = [
  { caption: { en: 'Your Destiny Matrix chart – all 22-arcana points', hi: 'आपका डेस्टिनी मैट्रिक्स चार्ट – सभी 22-आर्काना बिंदु' },
    renderDoc: (hi) => <MiniPage head="Destiny Matrix" page={2} total={10} title={hi ? 'आपकी डेस्टिनी मैट्रिक्स' : 'Your Destiny Matrix'}><div dangerouslySetInnerHTML={{ __html: destinySvg(RIYA_DM, { ages: false }) }} /><p className="mt-1 text-center text-[8px] text-stone-600">Riya Sharma · 14.08.1992</p></MiniPage> },
  { caption: { en: 'Money & love channels – where money and the right partner come from', hi: 'धन और प्रेम चैनल – धन और सही साथी कहाँ से आते हैं' },
    renderDoc: (hi) => <MiniPage head={hi ? 'धन और प्रेम' : 'Money & love'} page={5} total={10} title={hi ? 'धन चैनल और प्रेम चैनल' : 'Money channel & love channel'}><Rows rows={[[hi ? 'धन-बिंदु ($)' : 'Money point ($)', `${RIYA_DM.money}`], [hi ? 'धन प्रवेश' : 'Money entry', `${RIYA_DM.c1}`], [hi ? 'प्रेम-बिंदु (♥)' : 'Love point (♥)', `${RIYA_DM.love}`], [hi ? 'संतुलन बिंदु' : 'Balance point', `${RIYA_DM.x}`], [hi ? 'कर्म-पूँछ' : 'Karmic tail', RIYA_DM.karmicTail.join('-')]]} /></MiniPage> },
  { caption: { en: 'Chakra health map – body, energy and emotions', hi: 'चक्र स्वास्थ्य मानचित्र – शरीर, ऊर्जा और भावनाएँ' },
    renderDoc: (hi) => <MiniPage head={hi ? 'स्वास्थ्य' : 'Health map'} page={7} total={10} title={hi ? 'चक्र स्वास्थ्य मानचित्र' : 'Chakra health map'}><table className="w-full border-collapse text-[8px]"><thead><tr className="bg-amber-100">{(hi ? ['चक्र', 'शरीर', 'ऊर्जा', 'भाव'] : ['Chakra', 'Body', 'Energy', 'Emotion']).map((h) => <th key={h} className="border border-stone-300 px-1 py-0.5 text-left">{h}</th>)}</tr></thead><tbody>{RIYA_DM.health.map((h) => <tr key={h.id}><td className="border border-stone-300 px-1 capitalize">{h.id}</td><td className="border border-stone-300 px-1 text-center">{h.body}</td><td className="border border-stone-300 px-1 text-center">{h.energy}</td><td className="border border-stone-300 px-1 text-center">{h.emotion}</td></tr>)}</tbody></table></MiniPage> },
  { caption: { en: 'Life timeline 0–80 – your current period and the next 10 years', hi: 'जीवन समयरेखा 0–80 – आपकी वर्तमान अवधि और अगले 10 वर्ष' },
    renderDoc: (hi) => <MiniPage head={hi ? 'समयरेखा' : 'Timeline'} page={8} total={10} title={hi ? 'अभी और अगले दस वर्ष' : 'Now and the next ten years'}><Rows rows={RIYA_DM.ages.filter((a) => a.age >= 33.75 && a.age < 43).map((a) => [ageRange(a.age), `${a.value}`] as [string, string])} /></MiniPage> },
];
const PYTH_PAGES: ReportPage[] = [
  { caption: { en: 'Your Pythagoras Square with the four working numbers', hi: 'चार कार्य-अंकों के साथ आपका पाइथागोरस वर्ग' },
    renderDoc: (hi) => <MiniPage head="Pythagoras Square" page={2} total={5} title={hi ? 'आपका पाइथागोरस वर्ग' : 'Your Pythagoras Square'}><div dangerouslySetInnerHTML={{ __html: psychomatrixSvg(RIYA_PM, hi ? 'hi' : 'en') }} /><p className="mt-1 text-center text-[8px] text-stone-600">{RIYA_PM.working.join(' · ')}</p></MiniPage> },
  { caption: { en: 'The nine qualities – with their strength', hi: 'नौ गुण – उनकी शक्ति के साथ' },
    renderDoc: (hi) => <MiniPage head={hi ? 'नौ गुण' : 'Nine qualities'} page={3} total={5} title={hi ? 'आपके गुण' : 'Your qualities'}><Rows rows={([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((d) => [`${d}`, RIYA_PM.counts[d] ? String(d).repeat(RIYA_PM.counts[d]) : '—'] as [string, string])} /></MiniPage> },
  { caption: { en: 'Eight life lines – purpose, family, money, talent…', hi: 'आठ जीवन रेखाएँ – उद्देश्य, परिवार, धन, प्रतिभा…' },
    renderDoc: (hi) => <MiniPage head={hi ? 'रेखाएँ' : 'Life lines'} page={4} total={5} title={hi ? 'पंक्तियाँ, स्तंभ, विकर्ण' : 'Rows, columns, diagonals'}><Rows rows={RIYA_PM.lines.map((l) => [l.id, `${l.total}`] as [string, string])} /></MiniPage> },
  { caption: { en: 'Strengths and what to develop – simple practices', hi: 'ताक़त और विकसित करने योग्य बातें – सरल अभ्यास' },
    renderDoc: (hi) => <MiniPage head={hi ? 'सारांश' : 'Summary'} page={5} total={5} title={hi ? 'ताक़त और विकास' : 'Strengths & growth'}><p className="text-[8.5px] leading-snug">{hi ? 'मज़बूत: चरित्र, ऊर्जा, रुचि, स्वास्थ्य, स्मृति। विकसित करें: श्रम (खाना 6) – हर सप्ताह हाथों से कुछ करें।' : 'Strong: character, energy, interest, health, memory. To develop: work (cell 6) – do something with your hands every week.'}</p></MiniPage> },
];

export const SERVICE_REPORTS: Record<string, ServiceReportMeta> = {
  'destiny-matrix-analysis': {
    kicker: { en: '10-page designed PDF with cover', hi: 'कवर के साथ 10 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Destiny Matrix Analysis', hi: 'आपके डेस्टिनी मैट्रिक्स विश्लेषण के अंदर' },
    desc: { en: 'Pages from a sample report for a fictional client (Riya, 14 Aug 1992). Every number is calculated by the same engine that prepares your report.', hi: 'एक काल्पनिक क्लाइंट (रिया, 14 अगस्त 1992) की नमूना रिपोर्ट के पृष्ठ। हर अंक उसी इंजन से निकला है जो आपकी रिपोर्ट बनाता है।' },
    pages: DESTINY_PAGES,
  },
  'pythagorean-birth-chart': {
    kicker: { en: '5-page designed PDF with cover', hi: 'कवर के साथ 5 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Pythagorean Birth Chart', hi: 'आपके पाइथागोरस जन्म चार्ट के अंदर' },
    desc: { en: 'Pages from a sample report for a fictional client (Riya, 14 Aug 1992), calculated by the same engine as your report.', hi: 'एक काल्पनिक क्लाइंट (रिया, 14 अगस्त 1992) की नमूना रिपोर्ट के पृष्ठ, उसी इंजन से जो आपकी रिपोर्ट बनाता है।' },
    pages: PYTH_PAGES,
  },
  'personal-numerology-report': {
    kicker: { en: '15+ page designed PDF', hi: '15+ पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Personal Numerology Report', hi: 'आपकी व्यक्तिगत अंक ज्योतिष रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional client. Your report is prepared personally for your own date of birth, name and questions.',
      hi: 'काल्पनिक क्लाइंट की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट आपकी जन्म तिथि, नाम और प्रश्नों के लिए स्वयं तैयार होती है।',
    },
    pages: PERSONAL_PAGES,
  },

  'name-numerology': {
    kicker: { en: '8–10 page designed PDF', hi: '8–10 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Name Numerology Report', hi: 'आपकी नाम अंक ज्योतिष रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional client. Your report is prepared for your own name, date of birth and spelling options.',
      hi: 'काल्पनिक क्लाइंट की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट आपके अपने नाम, जन्म तिथि और वर्तनी विकल्पों के लिए तैयार होती है।',
    },
    pages: [
      {
        caption: { en: 'Cover – current name compound & destiny clash check', hi: 'मुखपृष्ठ – वर्तमान नामांक और भाग्य अंक से टकराव जाँच' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Name Numerology Audit</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 1 / 8</span>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[8.5px] uppercase tracking-wider text-amber-800 font-semibold">{hi ? 'कैल्डियन पद्धति विश्लेषण' : 'Chaldean System Analysis'}</p>
                <h4 className="font-serif text-sm font-bold text-stone-900">{hi ? 'नाम सुधार एवं वर्तनी विश्लेषण' : 'Name Correction & Audit'}</h4>
                <p className="text-[9.5px] text-stone-600">Rahul Verma · DOB 26 Nov 1988</p>
              </div>

              <div className="mt-3 rounded border border-rose-300 bg-rose-50/80 p-2 text-center">
                <div className="text-[8.5px] uppercase font-bold text-rose-800">{hi ? 'वर्तमान नाम स्थिति: अशुभ' : 'Current Name: Unfavourable'}</div>
                <div className="mt-1 font-serif text-lg font-bold text-rose-950">"Rahul Verma" → 35 / 8</div>
                <p className="text-[8px] text-rose-700 mt-0.5">{hi ? 'स्कोर: 28/100 · भाग्यांक 9 का शत्रु अंक (Saturn 8 vs Mars 9)' : 'Score: 28/100 · Clashes with Bhagyank 9 (Saturn vs Mars)'}</p>
              </div>

              <div className="mt-2.5 rounded border border-stone-200 bg-white/70 p-2 text-[8.5px]">
                <p className="font-semibold text-stone-900">{hi ? 'सुधार क्यों आवश्यक है?' : 'Why is correction advised?'}</p>
                <p className="text-stone-600 text-[8px] mt-0.5 line-clamp-3">
                  {hi
                    ? '35 एक प्रतिकूल संयुक्त अंक है। यह मेहनत के बाद भी रुकावटें और देरी पैदा करता है।'
                    : 'Compound 35 reduces career rewards and creates recurring friction despite heavy effort.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Chaldean & Pythagorean Verified</span>
              <span>Page 1 / 8</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Auspicious spelling options – Chaldean compounds & scores', hi: 'शुभ वर्तनी विकल्प – कैल्डियन संयुक्त अंक और स्कोर' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Corrected Spellings</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 3 / 8</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'सुझाई गई 3 शुभ वर्तनियाँ' : '3 Auspicious Corrected Spellings'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="rounded border border-emerald-400 bg-emerald-50/90 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-emerald-950 text-xs">Raahuul Verma</span>
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 font-bold text-[8px] text-white">100 / 100</span>
                  </div>
                  <p className="text-emerald-800 text-[8px] mt-0.5">{hi ? 'योग 42 → 6 (शुक्र) · भाग्यांक 9 का परम मित्र · अत्यंत शुभ' : 'Total 42 → 6 (Venus) · Best friend of 9 · Maximum Fortune'}</p>
                </div>

                <div className="rounded border border-amber-400 bg-amber-50/90 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-amber-950 text-xs">Rahuul Verma</span>
                    <span className="rounded bg-amber-600 px-1.5 py-0.5 font-bold text-[8px] text-white">80 / 100</span>
                  </div>
                  <p className="text-amber-800 text-[8px] mt-0.5">{hi ? 'योग 41 → 5 (बुध) · अनुकूल · बुद्धि व व्यवसाय में प्रगति' : 'Total 41 → 5 (Mercury) · High growth & communication'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-emerald-700 font-semibold">{hi ? 'प्राकृतिक वर्तनी जो दस्तावेज़ों में आसान लगे' : 'Natural spelling, minimal friction'}</span>
              <span>Page 3 / 8</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Implementation guide – signature, social, email & cards', hi: 'उपयोग मार्गदर्शिका – हस्ताक्षर, ईमेल, विज़िटिंग कार्ड' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Usage Blueprint</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 5 / 8</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'नई वर्तनी का उपयोग कहाँ करें' : 'Where to Apply the Corrected Name'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="flex items-start gap-1.5 rounded bg-white/70 p-1.5 border border-stone-200">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-stone-900">{hi ? 'हस्ताक्षर एवं डिजिटल पहचान:' : 'Signature & Digital Identity:'}</span>
                    <p className="text-stone-600 text-[7.5px]">{hi ? 'ईमेल हस्ताक्षर, लिंक्डइन, सोशल मीडिया, विज़िटिंग कार्ड।' : 'Email signature, LinkedIn, cards, WhatsApp bio.'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 rounded bg-white/70 p-1.5 border border-stone-200">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-stone-900">{hi ? 'क़ानूनी दस्तावेज़ (वैकल्पिक):' : 'Legal Documents (Optional):'}</span>
                    <p className="text-stone-600 text-[7.5px]">{hi ? 'क़ानूनी बदलाव अनिवार्य नहीं है; ऊर्जा रोज़ाना उपयोग से बढ़ती है।' : 'Legal change optional; energy activates via daily usage.'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span>Zero legal hassle required</span>
              <span>Page 5 / 8</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Signature guidance & 21-day name activation chart', hi: 'हस्ताक्षर मार्गदर्शन और 21 दिन का नाम सक्रियता चार्ट' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Activation Chart</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 8 / 8</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? '21 दिवसीय नाम सक्रियण चार्ट' : '21-Day Name Activation Protocol'}</h4>

              <div className="mt-2 rounded border border-amber-800/30 bg-amber-500/10 p-2 text-center">
                <p className="text-[8px] uppercase tracking-wider text-amber-900 font-bold">{hi ? 'आरंभ दिवस: मंगलवार' : 'Auspicious Start: Tuesday'}</p>
                <p className="font-serif text-xs font-bold text-stone-900 mt-0.5">21 × {hi ? 'प्रतिदिन 27 बार लिखें' : 'Write 27 times daily'}</p>
              </div>

              {/* Mini checkbox grid */}
              <div className="mt-2 grid grid-cols-7 gap-1 text-center font-mono text-[8px]">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="rounded border border-stone-300 bg-white/80 py-1 text-stone-600">D{i + 1}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">{hi ? 'हस्ताक्षर स्ट्रोक व कोण मार्गदर्शन सहित' : 'Includes stroke angles & slant guide'}</span>
              <span>Page 8 / 8</span>
            </div>
          </div>
        ),
      },
    ],
  },

  'lo-shu-grid': {
    kicker: { en: '10–12 page designed PDF', hi: '10–12 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Lo Shu Grid Report', hi: 'आपकी लो शू ग्रिड रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional client. Your report is prepared for your exact birth date and Kua energy group.',
      hi: 'काल्पनिक क्लाइंट की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट आपकी सटीक जन्म तिथि और कुआ ऊर्जा समूह के लिए तैयार होती है।',
    },
    pages: [
      {
        caption: { en: 'Cover – 3×3 energy square, planes & Kua group', hi: 'मुखपृष्ठ – 3×3 ऊर्जा वर्ग, समतल और कुआ समूह' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Lo Shu Grid Energy Map</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 1 / 10</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2 text-center">{hi ? 'संपूर्ण लो शू ऊर्जा वर्ग' : 'Complete Lo Shu Energy Chart'}</h4>

              <div className="mx-auto mt-2 grid w-28 grid-cols-3 gap-1 rounded border-2 border-amber-800/40 bg-amber-900/10 p-1 text-center font-serif text-[11px] font-bold">
                <div className="rounded bg-amber-100 py-1">4</div>
                <div className="rounded bg-amber-200 py-1 text-amber-900">9 9</div>
                <div className="rounded bg-amber-100 py-1">2</div>
                <div className="rounded bg-stone-100/30 py-1 opacity-50">-</div>
                <div className="rounded bg-amber-200 py-1 text-amber-900">5</div>
                <div className="rounded bg-amber-200 py-1 text-amber-900">7 7</div>
                <div className="rounded bg-amber-100 py-1">8</div>
                <div className="rounded bg-amber-200 py-1 text-amber-900">1 1</div>
                <div className="rounded bg-stone-100/30 py-1 opacity-50">-</div>
              </div>
              <p className="mt-2 text-center text-[8px] text-stone-600">{hi ? 'कुआ 7 · पश्चिम समूह (West Group)' : 'Kua 7 · West Group · Metal Element'}</p>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Vedic + Chinese Lo Shu</span>
              <span>Page 1 / 10</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Planes & Arrows of Strength – Intellect & Will power', hi: 'समतल और शक्ति के तीर – बुद्धि और इच्छा-शक्ति' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Planes of Strength</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 3 / 10</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'सक्रिय ऊर्जा तीर व राज योग' : 'Active Arrows & Raj Yog'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="rounded bg-emerald-50 border border-emerald-300 p-1.5">
                  <span className="font-semibold text-emerald-950">✓ {hi ? 'बुद्धि का तीर (Arrow of Intellect 4-9-2)' : 'Arrow of Intellect (4-9-2)'}</span>
                  <p className="text-emerald-800 text-[8px] mt-0.5">{hi ? 'तीव्र बुद्धि, विश्लेषण और उत्कृष्ट स्मरण शक्ति' : 'Superb memory, planning & mental clarity'}</p>
                </div>
                <div className="rounded bg-emerald-50 border border-emerald-300 p-1.5">
                  <span className="font-semibold text-emerald-950">✓ {hi ? 'दृढ़ संकल्प का तीर (Determination 9-5-1)' : 'Arrow of Determination (9-5-1)'}</span>
                  <p className="text-emerald-800 text-[8px] mt-0.5">{hi ? 'जो काम शुरू करते हैं, पूरा करके ही छोड़ते हैं' : 'Finishes what is started, relentless persistence'}</p>
                </div>
                <div className="rounded bg-amber-50 border border-amber-300 p-1.5">
                  <span className="font-semibold text-amber-950">★ {hi ? 'सिल्वर प्रॉपर्टी योग (2-5-8)' : 'Silver Property Yog (2-5-8)'}</span>
                  <p className="text-amber-800 text-[8px] mt-0.5">{hi ? 'भूमि, संपत्ति और स्थिर धन संचय का योग' : 'Property ownership, land & financial stability'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-emerald-700 font-semibold">3 Active Planes Identified</span>
              <span>Page 3 / 10</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Missing & repeated numbers – elemental imbalances', hi: 'अनुपस्थित और दोहराए अंक – तत्वीय असंतुलन' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Elemental Analysis</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 5 / 10</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'अनुपस्थित और दोहराए गए अंक' : 'Missing & Repeating Numbers'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="rounded bg-rose-50 border border-rose-300 p-1.5">
                  <span className="font-bold text-rose-950">⚠ {hi ? 'अनुपस्थित अंक 3 (गुरु तत्व)' : 'Missing 3 (Wood / Jupiter)'}</span>
                  <p className="text-rose-800 text-[8px] mt-0.5">{hi ? 'नियोजन और बड़ों के मार्गदर्शन में कमी' : 'Long-term planning needs structured discipline'}</p>
                </div>
                <div className="rounded bg-rose-50 border border-rose-300 p-1.5">
                  <span className="font-bold text-rose-950">⚠ {hi ? 'अनुपस्थित अंक 6 (शुक्र तत्व)' : 'Missing 6 (Metal / Venus)'}</span>
                  <p className="text-rose-800 text-[8px] mt-0.5">{hi ? 'पारिवारिक सुख व भौतिक सुविधाओं के लिए उपाय' : 'Luxury and domestic comfort remedy needed'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Root Cause Diagnosed</span>
              <span>Page 5 / 10</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Vastu directions & practical remedies for missing energies', hi: 'वास्तु दिशाएँ और अनुपस्थित ऊर्जाओं के अचूक उपाय' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Vastu & Lo Shu Remedies</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 9 / 10</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'शुभ वास्तु दिशाएँ (कुआ 7)' : 'Lucky Vastu Directions (Kua 7)'}</h4>

              <div className="mt-2 grid grid-cols-2 gap-1 text-[8px]">
                <div className="rounded bg-white/70 p-1 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'सफलता:' : 'Success:'}</span>
                  <span className="text-emerald-800 block font-medium">North-West</span>
                </div>
                <div className="rounded bg-white/70 p-1 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'स्वास्थ्य:' : 'Health:'}</span>
                  <span className="text-emerald-800 block font-medium">South-West</span>
                </div>
                <div className="rounded bg-white/70 p-1 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'संबंध:' : 'Love:'}</span>
                  <span className="text-emerald-800 block font-medium">North-East</span>
                </div>
                <div className="rounded bg-white/70 p-1 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'विकास:' : 'Growth:'}</span>
                  <span className="text-emerald-800 block font-medium">West</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">100% Practical Remedies</span>
              <span>Page 9 / 10</span>
            </div>
          </div>
        ),
      },
    ],
  },

  'mobile-number-numerology': {
    kicker: { en: '6–8 page designed PDF', hi: '6–8 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Lucky Mobile Report', hi: 'आपकी शुभ मोबाइल नंबर रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional client. Your report audits your existing number and scores candidate numbers for career & wealth.',
      hi: 'काल्पनिक क्लाइंट की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट आपके वर्तमान नंबर की जाँच करती है और नए नंबरों का अनुकूलता स्कोर देती है।',
    },
    pages: [
      {
        caption: { en: 'Cover & Current Number Audit – conflict check & score', hi: 'मुखपृष्ठ एवं वर्तमान नंबर ऑडिट – टकराव जाँच और स्कोर' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Mobile Number Audit</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 1 / 6</span>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[8.5px] uppercase tracking-wider text-amber-800 font-semibold">{hi ? 'मोबाइल अंक विज्ञान विश्लेषण' : 'Phone Numerology Diagnostic'}</p>
                <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">98765 43210</h4>
                <div className="mt-1 inline-block rounded bg-rose-100 border border-rose-300 px-2 py-0.5 text-[8.5px] font-bold text-rose-900">{hi ? 'स्कोर: 36/100 · बदलाव आवश्यक' : 'Score: 36/100 · Needs Change'}</div>
              </div>

              <div className="mt-2.5 rounded border border-rose-200 bg-rose-50/70 p-2 text-[8.5px]">
                <p className="font-semibold text-rose-950">{hi ? 'टकराने वाली जोड़ियाँ (Conflict Pairs):' : 'Clashing Digit Pairs:'}</p>
                <div className="mt-1 flex gap-1 font-mono text-[8px] font-bold text-rose-800">
                  <span className="rounded bg-white px-1.5 py-0.5 border border-rose-300">98 (मंगल-शनि)</span>
                  <span className="rounded bg-white px-1.5 py-0.5 border border-rose-300">87 (शनि-केतु)</span>
                  <span className="rounded bg-white px-1.5 py-0.5 border border-rose-300">43 (राहु-गुरु)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Total Compound 45 → 9</span>
              <span>Page 1 / 6</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Auspicious totals & harmonious digit pairs for you', hi: 'आपके लिए सर्वोत्तम योग और अनुकूल अंक जोड़ियाँ' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Ideal Vibrations</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 3 / 6</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'आपके अनुकूल मोबाइल योग' : 'Ideal Totals & Auspicious Pairs'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="rounded bg-emerald-50 border border-emerald-300 p-2">
                  <span className="font-bold text-emerald-950">{hi ? 'सर्वोत्तम एकल योग (Best Totals):' : 'Best Totals for You:'}</span>
                  <p className="font-mono text-emerald-900 text-xs font-bold mt-0.5">1, 3, 5, 6, 7</p>
                </div>
                <div className="rounded bg-white/70 border border-stone-200 p-2">
                  <span className="font-semibold text-stone-900">{hi ? 'शुभ जोड़ियाँ (Prosperity Pairs):' : 'Prosperity Pairs:'}</span>
                  <p className="text-stone-700 font-mono text-[8px] mt-0.5">11, 13, 15, 33, 35, 51, 55, 56, 65</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-emerald-700 font-semibold">Matched to Bhagyank 7</span>
              <span>Page 3 / 6</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Candidate numbers scored, ranked and highlighted', hi: 'उम्मीदवार नंबरों की तुलना, स्कोर और रैंकिंग' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Number Comparison</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 4 / 6</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'आपके भेजे गए 5 नंबरों की तुलना' : 'Comparison of Shortlisted SIMs'}</h4>

              <div className="mt-2 space-y-1 text-[8px]">
                <div className="flex items-center justify-between rounded bg-emerald-100/90 border border-emerald-400 p-1.5 font-bold text-emerald-950">
                  <span>98231 55151 (Total 41/5)</span>
                  <span className="rounded bg-emerald-600 px-1 py-0.5 text-white text-[7.5px]">94 · Best</span>
                </div>
                <div className="flex items-center justify-between rounded bg-white/70 border border-stone-200 p-1.5 text-stone-700">
                  <span>98105 13355 (Total 40/4)</span>
                  <span className="text-amber-800 font-semibold">72 · Good</span>
                </div>
                <div className="flex items-center justify-between rounded bg-white/70 border border-stone-200 p-1.5 text-stone-700">
                  <span>99901 88440 (Total 43/7)</span>
                  <span className="text-rose-800 font-semibold">41 · Avoid</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-emerald-700 font-semibold">Clear Winner Selected</span>
              <span>Page 4 / 6</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Activation muhurat, first call timing & phone wallpaper', hi: 'सक्रियण मुहूर्त, पहली कॉल का समय और वॉलपेपर' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Activation Ritual</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 6 / 6</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'सिम सक्रियण एवं पहली कॉल मुहूर्त' : 'SIM Activation & Auspicious Muhurat'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="rounded bg-white/80 p-2 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'शुभ सक्रियण तिथि:' : 'Best Activation Dates:'}</span>
                  <p className="text-amber-900 font-medium text-[8px] mt-0.5">1, 5, 10, 14, 19, 23 (Wednesday / Friday)</p>
                </div>
                <div className="rounded bg-white/80 p-2 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'पहली कॉल का नियम:' : 'First Call Protocol:'}</span>
                  <p className="text-stone-600 text-[8px] mt-0.5">{hi ? 'माता-पिता या गुरु को पूर्व दिशा की ओर मुख करके पहली कॉल करें।' : 'Face East and call mother, father, or mentor first.'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Personalized Muhurat</span>
              <span>Page 6 / 6</span>
            </div>
          </div>
        ),
      },
    ],
  },

  'baby-name-numerology': {
    kicker: { en: '12–14 page designed PDF', hi: '12–14 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Baby Name Numerology Report', hi: 'आपकी शिशु नाम अंक ज्योतिष रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional baby. Your report includes 7 curated auspicious names, full Chaldean scoring and birth certificate guidance.',
      hi: 'काल्पनिक शिशु की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट में 7 शुभ नाम, पूर्ण कैल्डियन स्कोर और जन्म प्रमाण-पत्र वर्तनी शामिल हैं।',
    },
    pages: [
      {
        caption: { en: 'Celestial birth chart – Moolank 3, Bhagyank 7 & sounds', hi: 'जन्म कुंडली अंक – मूलांक 3, भाग्यांक 7 और शुभ ध्वनियाँ' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Baby Celestial Chart</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 1 / 12</span>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[8.5px] uppercase tracking-wider text-amber-800 font-semibold">{hi ? 'शिशु नामकरण संस्कार' : 'Baby Name Blessing'}</p>
                <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">{hi ? 'शिशु कन्या · जन्म तिथि: 21 मार्च 2026' : 'Baby Girl · DOB: 21 Mar 2026'}</h4>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded border border-amber-800/30 bg-amber-50 p-2">
                  <div className="text-[8px] uppercase text-stone-600">{hi ? 'मूलांक (गुरु 3)' : 'Moolank (Jupiter 3)'}</div>
                  <div className="font-serif text-lg font-bold text-amber-900">3</div>
                  <div className="text-[7.5px] text-stone-500">{hi ? 'उज्ज्वल व बुद्धिमान' : 'Bright & Creative'}</div>
                </div>
                <div className="rounded border border-amber-800/30 bg-amber-50 p-2">
                  <div className="text-[8px] uppercase text-stone-600">{hi ? 'भाग्यांक (केतु 7)' : 'Bhagyank (Ketu 7)'}</div>
                  <div className="font-serif text-lg font-bold text-amber-900">7</div>
                  <div className="text-[7.5px] text-stone-500">{hi ? 'गहराई व अंतर्ज्ञान' : 'Intuition & Depth'}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Auspicious Sounds Identified</span>
              <span>Page 1 / 12</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: '7 curated names with surname compatibility & score', hi: 'उपनाम सहित 7 चुनिंदा नाम और अनुकूलता स्कोर' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Curated Name List</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 4 / 12</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'सुझाए गए श्रेष्ठ नाम (शर्मा उपनाम सहित)' : 'Top Shortlisted Baby Names'}</h4>

              <div className="mt-2 space-y-1 text-[8px]">
                <div className="flex items-center justify-between rounded bg-emerald-50 border border-emerald-400 p-1.5 font-bold text-emerald-950">
                  <span>Anaya Sharma (25 → 7)</span>
                  <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-white">Score 88</span>
                </div>
                <div className="flex items-center justify-between rounded bg-amber-50 border border-amber-300 p-1.5 text-stone-800">
                  <span>Kiara Sharma (23 → 5)</span>
                  <span className="font-bold text-amber-900">Score 80</span>
                </div>
                <div className="flex items-center justify-between rounded bg-amber-50 border border-amber-300 p-1.5 text-stone-800">
                  <span>Diya Sharma (23 → 5)</span>
                  <span className="font-bold text-amber-900">Score 80</span>
                </div>
                <div className="flex items-center justify-between rounded bg-amber-50 border border-amber-300 p-1.5 text-stone-800">
                  <span>Ishani Sharma (32 → 5)</span>
                  <span className="font-bold text-amber-900">Score 80</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-emerald-700 font-semibold">No negative compounds</span>
              <span>Page 4 / 12</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'In-depth meaning, origin and planetary vibration of each name', hi: 'हर नाम का विस्तृत अर्थ, उत्पत्ति और ग्रहीय प्रभाव' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Name Vibration</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 7 / 12</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">"Anaya" (अनाया) – Deep Analysis</h4>

              <div className="mt-2 rounded border border-amber-900/15 bg-white/80 p-2 text-[8.5px]">
                <p className="font-semibold text-amber-900">{hi ? 'अर्थ एवं संस्कृत उत्पत्ति:' : 'Meaning & Sanskrit Origin:'}</p>
                <p className="text-stone-700 text-[8px] mt-0.5">{hi ? 'अनाया का अर्थ है "कृपामयी, अद्वितीय"। यह भाग्यांक 7 का मित्र है।' : 'Means caring, gracious, and without superior. Harmonious with 7.'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span>Cultural & Spiritual Resonance</span>
              <span>Page 7 / 12</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Birth certificate spelling, nursery colours & lucky stones', hi: 'जन्म प्रमाण-पत्र वर्तनी, शिशु कक्ष के रंग और शुभ रत्न' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Official Spelling & Colors</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 12 / 12</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'जन्म प्रमाण-पत्र वर्तनी एवं कक्ष वास्तु' : 'Birth Certificate & Nursery Guide'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="rounded bg-white/70 p-2 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'प्रमाण-पत्र पर सही वर्तनी:' : 'Exact Certificate Spelling:'}</span>
                  <p className="font-mono text-xs font-bold text-amber-900 mt-0.5">ANAYA SHARMA</p>
                </div>
                <div className="rounded bg-white/70 p-2 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'शिशु के शुभ रंग:' : 'Lucky Colors for Baby:'}</span>
                  <p className="text-emerald-800 text-[8px] mt-0.5">{hi ? 'हल्का पीला, क्रीम, हल्का हरा' : 'Soft Yellow, Cream, Gentle Green'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Lifelong Blessing</span>
              <span>Page 12 / 12</span>
            </div>
          </div>
        ),
      },
    ],
  },

  'couple-compatibility-report': {
    kicker: { en: '14–16 page designed PDF', hi: '14–16 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Couple Compatibility Report', hi: 'आपकी जोड़ी अनुकूलता रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional couple. Your report evaluates both birth charts, the 6 core life pillars, and auspicious wedding muhurats.',
      hi: 'काल्पनिक युगल की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट दोनों जन्म कुंडलियों, 6 जीवन स्तंभों और शुभ विवाह तिथियों का विश्लेषण करती है।',
    },
    pages: [
      {
        caption: { en: 'Cover – overall union harmony score (78/100) & numbers', hi: 'मुखपृष्ठ – कुल सामंजस्य स्कोर (78/100) और दोनों के अंक' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Couple Compatibility</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 1 / 14</span>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[8.5px] uppercase tracking-wider text-amber-800 font-semibold">{hi ? 'वैवाहिक एवं संबंध अनुकूलता' : 'Relationship Harmony Audit'}</p>
                <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">Riya (5/7) & Arjun (3/5)</h4>
              </div>

              <div className="mt-2 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border-4 border-amber-600 bg-amber-50 shadow-md">
                  <span className="font-serif text-lg font-bold text-amber-900">78%</span>
                </div>
                <p className="mt-1 text-[8.5px] font-bold text-emerald-800">{hi ? 'उत्कृष्ट सामंजस्य (Highly Compatible)' : 'High Compatibility · Natural Attraction'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Chaldean + Vedic Couple Audit</span>
              <span>Page 1 / 14</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: '6 Life Pillars – Love, Communication, Family, Finance, Health', hi: '6 जीवन स्तंभ – प्रेम, संवाद, परिवार, वित्त, स्वास्थ्य' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">6 Life Pillars</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 4 / 14</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'क्षेत्रवार अनुकूलता विश्लेषण' : 'Pillar Breakdown'}</h4>

              <div className="mt-2 space-y-1 text-[8px]">
                <div>
                  <div className="flex justify-between font-semibold"><span>{hi ? 'प्रेम व आकर्षण (Love):' : 'Love & Attraction:'}</span><span className="text-emerald-800">90%</span></div>
                  <div className="h-1.5 w-full rounded bg-stone-200"><div className="h-full rounded bg-emerald-600" style={{ width: '90%' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between font-semibold"><span>{hi ? 'संवाद (Communication):' : 'Communication:'}</span><span className="text-emerald-800">80%</span></div>
                  <div className="h-1.5 w-full rounded bg-stone-200"><div className="h-full rounded bg-emerald-600" style={{ width: '80%' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between font-semibold"><span>{hi ? 'पारिवारिक सुख (Family):' : 'Family Life:'}</span><span className="text-emerald-800">80%</span></div>
                  <div className="h-1.5 w-full rounded bg-stone-200"><div className="h-full rounded bg-emerald-600" style={{ width: '80%' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between font-semibold"><span>{hi ? 'वित्तीय तालमेल (Finance):' : 'Financial Sync:'}</span><span className="text-amber-800">60%</span></div>
                  <div className="h-1.5 w-full rounded bg-stone-200"><div className="h-full rounded bg-amber-600" style={{ width: '60%' }} /></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-emerald-700 font-semibold">Detailed Mutual Strengths</span>
              <span>Page 4 / 14</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Combined Lo Shu Grid – mutual energy completion & gaps', hi: 'संयुक्त लो शू ग्रिड – परस्पर ऊर्जा पूर्ति और अभाव' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Merged Lo Shu Grid</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 8 / 14</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'संयुक्त ग्रिड में परस्पर संतुलन' : 'Mutual Energy Balance'}</h4>

              <div className="mt-2 rounded bg-white/70 p-2 text-[8px] border border-stone-200">
                <p className="font-semibold text-stone-900">{hi ? 'अर्जुन रिया को क्या देते हैं:' : 'What Arjun brings to Riya:'}</p>
                <p className="text-stone-600 mt-0.5">{hi ? 'अंक 3 (योजना व विस्तार)' : 'Number 3 (Planning & Vision)'}</p>
                <p className="font-semibold text-stone-900 mt-1.5">{hi ? 'रिया अर्जुन को क्या देती हैं:' : 'What Riya brings to Arjun:'}</p>
                <p className="text-stone-600 mt-0.5">{hi ? 'अंक 2, 4, 7, 8 (धैर्य व स्थिरता)' : 'Numbers 2, 4, 7, 8 (Patience & Depth)'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Complementary Union</span>
              <span>Page 8 / 14</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Auspicious marriage years, date numbers & remedies', hi: 'शुभ विवाह वर्ष, तिथि अंक और युगल उपाय' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Marriage Muhurat</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 14 / 14</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'सर्वोत्तम विवाह मुहूर्त एवं वर्ष' : 'Best Wedding Timing & Remedies'}</h4>

              <div className="mt-2 rounded bg-amber-50 border border-amber-300 p-2 text-[8.5px]">
                <p className="font-bold text-amber-950">{hi ? 'सर्वश्रेष्ठ विवाह वर्ष: 2027' : 'Strongest Year: 2027'}</p>
                <p className="text-amber-800 text-[8px] mt-0.5">{hi ? 'दोनों साथी व्यक्तिगत वर्ष 6 (शुक्र) में होंगे · वैवाहिक जीवन हेतु सर्वोत्तम' : 'Both partners enter Personal Year 6 (Venus) · Ideal for marriage'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Harmony Blueprint</span>
              <span>Page 14 / 14</span>
            </div>
          </div>
        ),
      },
    ],
  },

  'business-name-numerology': {
    kicker: { en: '10–12 page designed PDF', hi: '10–12 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Business Name Report', hi: 'आपकी व्यवसाय नाम रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional enterprise. Your report evaluates your brand name against your founder chart and commercial industry numbers.',
      hi: 'काल्पनिक व्यवसाय की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट आपके ब्रांड नाम का संस्थापक कुंडली और उद्योग अंकों से मिलान करती है।',
    },
    pages: [
      {
        caption: { en: 'Brand Audit – proposed names scored against founder numbers', hi: 'ब्रांड ऑडिट – प्रस्तावित नामों का संस्थापक अंकों से मिलान' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Brand Name Audit</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 1 / 10</span>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[8.5px] uppercase tracking-wider text-amber-800 font-semibold">{hi ? 'व्यावसायिक ब्रांड अंक ज्योतिष' : 'Commercial Brand Numerology'}</p>
                <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">Riya Interiors vs Sharma Interiors</h4>
              </div>

              <div className="mt-2 space-y-1 text-[8px]">
                <div className="rounded bg-rose-50 border border-rose-300 p-1.5">
                  <div className="flex justify-between font-bold text-rose-950">
                    <span>Riya Interiors</span>
                    <span>35 → 8 (Avoid)</span>
                  </div>
                  <p className="text-rose-700 text-[7.5px] mt-0.5">{hi ? 'भाग्यांक 7 का शत्रु अंक · भुगतान में देरी और विवाद' : 'Clashes with founder 7 · Payment delays'}</p>
                </div>
                <div className="rounded bg-emerald-50 border border-emerald-400 p-1.5">
                  <div className="flex justify-between font-bold text-emerald-950">
                    <span>Sharma Interiors</span>
                    <span>46 → 1 (Best)</span>
                  </div>
                  <p className="text-emerald-700 text-[7.5px] mt-0.5">{hi ? 'सूर्य तत्व 1 · ब्रांड पहचान और उच्च लाभ' : 'Sun 1 vibration · Supreme brand recognition'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-emerald-700 font-semibold">100/100 Fit Selected</span>
              <span>Page 1 / 10</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Why Number 1 vibration suits this brand & leadership', hi: 'यह व्यवसाय अंक 1 (सूर्य) के अनुकूल क्यों है और लाभ' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Planet & Vibration</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 3 / 10</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'सूर्य 1 ऊर्जा का प्रभाव' : 'Sun 1 Leadership Vibration'}</h4>

              <div className="mt-2 rounded bg-amber-50 border border-amber-300 p-2 text-[8.5px]">
                <p className="font-bold text-amber-950">{hi ? 'संस्थापक से पूर्ण मित्रता:' : 'Perfect Alignment with Founder:'}</p>
                <p className="text-stone-700 text-[8px] mt-1">
                  {hi
                    ? 'अंक 1 संस्थापक के मूलांक 5 और भाग्यांक 7 दोनों का मित्र है। व्यवसाय मालिक को थकाता नहीं, बल्कि आगे बढ़ाता है।'
                    : '1 supports both Moolank 5 and Bhagyank 7, giving effortless brand authority and client trust.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Commercial Harmony</span>
              <span>Page 3 / 10</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Legal, digital & domain registration alignment', hi: 'क़ानूनी, डोमेन और सोशल मीडिया नाम तालमेल' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Digital Alignment</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 6 / 10</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'डोमेन एवं ट्रेडमार्क दिशानिर्देश' : 'Domain & Trademark Spelling'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="rounded bg-white/70 p-2 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'अनुशंसित डोमेन वर्तनी:' : 'Recommended Domain:'}</span>
                  <p className="font-mono text-emerald-800 font-bold text-[8.5px] mt-0.5">sharmainteriors.com</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span>Ready for Trademark Filing</span>
              <span>Page 6 / 10</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Brand colours, logo geometry & lucky launch muhurats', hi: 'ब्रांड रंग, लोगो ज्यामिति और शुभ उद्घाटन मुहूर्त' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Logo & Launch Muhurat</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 10 / 10</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'ब्रांड रंग व लॉन्च मुहूर्त' : 'Brand Palette & Launch Dates'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="rounded bg-white/70 p-2 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'ब्रांड रंग (Sun & Mercury):' : 'Brand Colors:'}</span>
                  <p className="text-amber-900 font-medium text-[8px] mt-0.5">{hi ? 'सुनहरा, गहरा नारंगी, हल्का हरा' : 'Gold, Deep Orange & Forest Green'}</p>
                </div>
                <div className="rounded bg-white/70 p-2 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'उद्घाटन मुहूर्त तिथियाँ:' : 'Launch Muhurat Dates:'}</span>
                  <p className="text-emerald-800 font-medium text-[8px] mt-0.5">1, 10, 19, 28 (Dates adding to 1)</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Complete Commercial Shield</span>
              <span>Page 10 / 10</span>
            </div>
          </div>
        ),
      },
    ],
  },

  'business-numerology-report': {
    kicker: { en: '18–20 page designed PDF', hi: '18–20 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Complete Business Report', hi: 'आपकी संपूर्ण व्यवसाय अंक ज्योतिष रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional enterprise. Your report includes multi-partner compatibility, 3-year financial forecasts, and CEO office vastu.',
      hi: 'काल्पनिक उद्यम की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट में साझेदार अनुकूलता, 3-वर्षीय वित्तीय चक्र और सीईओ कार्यालय वास्तु शामिल हैं।',
    },
    pages: [
      {
        caption: { en: 'Executive Scorecard – business health 84/100 & Sun 1 vibration', hi: 'कार्यकारी स्कोरकार्ड – व्यवसाय स्वास्थ्य 84/100 और सूर्य 1 प्रभाव' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Complete Business Audit</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 1 / 18</span>
              </div>
              <div className="mt-2 text-center">
                <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">{hi ? 'संपूर्ण व्यवसाय अंक ज्योतिष रिपोर्ट' : 'Complete Business Numerology Report'}</h4>
                <p className="text-[8.5px] text-stone-600">Sharma Interiors · Est. 2024</p>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5 text-center">
                <div className="rounded border border-amber-400 bg-amber-50 p-1.5">
                  <div className="text-[7.5px] uppercase text-stone-600">{hi ? 'समग्र व्यवसाय स्कोर' : 'Overall Health'}</div>
                  <div className="font-serif text-lg font-bold text-amber-900">84 / 100</div>
                </div>
                <div className="rounded border border-emerald-400 bg-emerald-50 p-1.5">
                  <div className="text-[7.5px] uppercase text-stone-600">{hi ? 'ब्रांड अंक' : 'Brand Total'}</div>
                  <div className="font-serif text-lg font-bold text-emerald-900">46 / 1</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Corporate Numerology</span>
              <span>Page 1 / 18</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Multi-Partner Compatibility – roles, equity & decision power', hi: 'साझेदार अनुकूलता – भूमिकाएँ, हिस्सेदारी और निर्णय शक्ति' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Partner Harmony</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 5 / 18</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'साझेदार तालमेल एवं भूमिका विभाजन' : 'Partner Compatibility & Roles'}</h4>

              <div className="mt-2 rounded bg-white/70 p-2 text-[8px] border border-stone-200">
                <div className="flex justify-between font-bold text-stone-900">
                  <span>Arjun Mehta (3 / 5)</span>
                  <span className="text-emerald-800">Harmony 78%</span>
                </div>
                <p className="text-stone-600 text-[7.5px] mt-1">{hi ? 'सर्वश्रेष्ठ भूमिका: मार्केटिंग, विस्तार एवं बिक्री।' : 'Best role: Business development, marketing & client pitch.'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-emerald-700 font-semibold">Conflict-free Equity Model</span>
              <span>Page 5 / 18</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: '3-Year Growth Cycles – 2026 Customers, 2027 R&D, 2028 Harvest', hi: '3-वर्षीय चक्र – 2026 ग्राहक, 2027 शोध, 2028 भारी लाभ' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">3-Year Growth Cycles</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 9 / 18</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'व्यावसायिक चक्र पूर्वानुमान' : 'Business Financial Cycle'}</h4>

              <div className="mt-2 space-y-1 text-[8px]">
                <div className="flex justify-between rounded bg-emerald-50 p-1.5 border border-emerald-300">
                  <span className="font-bold text-emerald-950">2026 (Year 6)</span>
                  <span className="text-emerald-800">{hi ? 'ग्राहक व विस्तार · स्कोर 72' : 'Clients & Service · Score 72'}</span>
                </div>
                <div className="flex justify-between rounded bg-amber-50 p-1.5 border border-amber-300">
                  <span className="font-bold text-amber-950">2027 (Year 7)</span>
                  <span className="text-amber-800">{hi ? 'शोध व योजना · स्कोर 50' : 'R&D & Consolidation · Score 50'}</span>
                </div>
                <div className="flex justify-between rounded bg-emerald-50 p-1.5 border border-emerald-300">
                  <span className="font-bold text-emerald-950">2028 (Year 8)</span>
                  <span className="text-emerald-800">{hi ? 'भारी मुनाफ़ा व निवेश · स्कोर 71' : 'Harvest & Big Profits · Score 71'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Strategic Roadmap</span>
              <span>Page 9 / 18</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'CEO office vastu, founder seating direction & brand geometry', hi: 'सीईओ कार्यालय वास्तु, बैठने की दिशा और शुभ लोगो' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">CEO Office Vastu</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 16 / 18</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'सीईओ बैठने की दिशा एवं लोगो ज्यामिति' : 'CEO Seating & Mark Geometry'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="rounded bg-white/70 p-2 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'कुर्सी का मुख (Founder Facing):' : 'Founder Seating Direction:'}</span>
                  <p className="text-emerald-800 font-medium text-[8px] mt-0.5">North-West (Success & Leadership)</p>
                </div>
                <div className="rounded bg-white/70 p-2 border border-stone-200">
                  <span className="font-semibold text-stone-900">{hi ? 'लोगो संरचना (Logo Shape):' : 'Auspicious Logo Geometry:'}</span>
                  <p className="text-stone-600 text-[8px] mt-0.5">{hi ? 'सूर्य-किरण या पूर्ण गोलाकार (Sun Burst / Circular Mark)' : 'Circular / Sun-burst emblem in bold typography'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Enterprise Protection</span>
              <span>Page 16 / 18</span>
            </div>
          </div>
        ),
      },
    ],
  },

  'business-compatibility-numerology': {
    kicker: { en: '12–14 page designed PDF', hi: '12–14 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Business Compatibility Report', hi: 'आपकी व्यवसाय अनुकूलता रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional founder. Your report screens 1,335 business sectors and pinpoints the businesses where your numbers give you natural advantages.',
      hi: 'काल्पनिक संस्थापक की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट 1,335 व्यावसायिक क्षेत्रों की जाँच करती है और आपके अंकों के सबसे अनुकूल काम बताती है।',
    },
    pages: [
      {
        caption: { en: 'Entrepreneur Archetype – core commercial strengths & sectors', hi: 'व्यावसायिक स्वभाव – मूल व्यापारिक ताक़त और क्षेत्र' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Business Personality</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 1 / 12</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'आपका व्यावसायिक व्यक्तित्व' : 'Founder Entrepreneur Profile'}</h4>

              <div className="mt-2 space-y-1 text-[8px]">
                <div className="rounded bg-emerald-50 border border-emerald-300 p-1.5">
                  <span className="font-bold text-emerald-950">Technology & Media</span>
                  <span className="float-right font-bold text-emerald-800">88 / 100</span>
                  <p className="text-stone-600 text-[7px] mt-0.5">{hi ? 'सर्वोत्तम क्षेत्र (Top Sector)' : 'Primary power sector'}</p>
                </div>
                <div className="rounded bg-white/70 border border-stone-200 p-1.5">
                  <span className="font-bold text-stone-900">Trade & Retail</span>
                  <span className="float-right font-bold text-amber-800">87 / 100</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Bhagyank 7 + Moolank 5</span>
              <span>Page 1 / 12</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: '1,335 Business Index – top ranking models for your chart', hi: '1,335 व्यवसायों की सूची – आपकी कुंडली के शीर्ष व्यवसाय' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Sector Match Index</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 4 / 12</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? '1,335 व्यवसायों में शीर्ष 3 मेल' : 'Top 3 of 1,335 Businesses'}</h4>

              <div className="mt-2 space-y-1 text-[8px]">
                <div className="flex items-center justify-between rounded bg-emerald-50 p-1.5 border border-emerald-400 font-bold text-emerald-950">
                  <span>1. Online Reputation Mgmt</span>
                  <span className="rounded bg-emerald-600 px-1 py-0.5 text-white">89 / 100</span>
                </div>
                <div className="flex items-center justify-between rounded bg-white/70 p-1.5 border border-stone-200 text-stone-800">
                  <span>2. LED Lights Trading</span>
                  <span className="font-bold text-amber-900">87 / 100</span>
                </div>
                <div className="flex items-center justify-between rounded bg-white/70 p-1.5 border border-stone-200 text-stone-800">
                  <span>3. Solar Panel Dealership</span>
                  <span className="font-bold text-amber-900">87 / 100</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-emerald-700 font-semibold">Exhaustive Database</span>
              <span>Page 4 / 12</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Candidate businesses evaluated – fit, rank & capital budget', hi: 'आपके विचाराधीन व्यवसायों की जाँच – स्थान, जोखिम और पूँजी' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Candidate Evaluation</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 7 / 12</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'आपके विचाराधीन व्यवसाय' : 'Evaluation of Your Ideas'}</h4>

              <div className="mt-2 space-y-1 text-[8px]">
                <div className="rounded bg-emerald-50 p-1.5 border border-emerald-300">
                  <div className="flex justify-between font-bold text-emerald-950">
                    <span>Digital Marketing Agency</span>
                    <span>77 · Rank #190</span>
                  </div>
                  <p className="text-emerald-800 text-[7px] mt-0.5">{hi ? 'अत्यंत अनुकूल · तुरंत शुरू कर सकते हैं' : 'Highly compatible · High margin'}</p>
                </div>
                <div className="rounded bg-rose-50 p-1.5 border border-rose-300">
                  <div className="flex justify-between font-bold text-rose-950">
                    <span>Petrol Pump</span>
                    <span>39 · Rank #1,325</span>
                  </div>
                  <p className="text-rose-800 text-[7px] mt-0.5">{hi ? 'सलाह नहीं · 8 व 9 आधारित · भारी नुकसान का जोखिम' : 'Not advised · Heavy 8/9 clash'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-rose-700 font-semibold">Prevents costly capital mistakes</span>
              <span>Page 7 / 12</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Timing & launch strategy – personal year 5 window & dates', hi: 'शुरुआत की रणनीति – व्यक्तिगत वर्ष 5 की अवधि और तारीखें' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Launch Window</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 12 / 12</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'व्यवसाय आरंभ का शुभ समय' : 'When to Launch Your Venture'}</h4>

              <div className="mt-2 rounded bg-amber-50 p-2 border border-amber-300 text-[8.5px]">
                <p className="font-bold text-amber-950">{hi ? 'व्यक्तिगत वर्ष 5 (2026-2027):' : 'Personal Year 5 Window:'}</p>
                <p className="text-stone-700 text-[8px] mt-0.5">{hi ? 'बदलाव और नए उपक्रम शुरू करने का सबसे शक्तिशाली वर्ष।' : 'Best year to launch new ventures and expand market reach.'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Action Plan Included</span>
              <span>Page 12 / 12</span>
            </div>
          </div>
        ),
      },
    ],
  },

  'personal-year-consultancy': {
    kicker: { en: '10–12 page designed PDF', hi: '10–12 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Personal Year Report', hi: 'आपकी व्यक्तिगत वर्ष रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional client. Your report maps your personal year theme, month-by-month personal vibrations and critical decision dates.',
      hi: 'काल्पनिक क्लाइंट की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट आपके वर्ष के मुख्य विषय, माह-दर-माह ऊर्जा और महत्वपूर्ण निर्णय तिथियों का नक्शा बनाती है।',
    },
    pages: [
      {
        caption: { en: 'Annual Theme & Ruling Energy – personal year 5 (freedom & change)', hi: 'वार्षिक विषय एवं ऊर्जा – व्यक्तिगत वर्ष 5 (बदलाव और प्रगति)' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Annual Forecast</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 1 / 10</span>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[8.5px] uppercase tracking-wider text-amber-800 font-semibold">{hi ? 'व्यक्तिगत वर्ष परामर्श' : 'Annual Life Roadmap'}</p>
                <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">{hi ? 'व्यक्तिगत वर्ष 5 (बुध तत्व)' : 'Personal Year 5 (Mercury)'}</h4>
                <p className="text-[8px] text-stone-500 mt-0.5">14 Aug 2026 – 13 Aug 2027</p>
              </div>

              <div className="mt-2.5 rounded bg-amber-50 p-2 border border-amber-300 text-[8.5px]">
                <p className="font-bold text-amber-950">{hi ? 'वर्ष का मूल विषय: बदलाव और नए द्वार' : 'Yearly Theme: Transformation'}</p>
                <p className="text-stone-700 text-[8px] mt-0.5">
                  {hi
                    ? 'यह वर्ष यात्रा, नए संपर्क और साहसिक निर्णयों का है। योजनाबद्ध जोखिम लाभ देंगे।'
                    : 'A year of rapid change, exciting contacts and mobility. Planned bold moves bring high rewards.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Next Year: Year 6 (Family)</span>
              <span>Page 1 / 10</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Month-by-month calendar roadmap for all 12 months', hi: 'सभी 12 महीनों का माह-दर-माह व्यक्तिगत कैलेंडर' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">12-Month Calendar</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 4 / 10</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'माह-दर-माह ऊर्जा व रणनीति' : 'Month-by-Month Vibrations'}</h4>

              <div className="mt-2 grid grid-cols-2 gap-1 text-[8px]">
                <div className="rounded bg-white/70 p-1.5 border border-stone-200">
                  <div className="font-bold text-stone-900">Nov 2026 · 7</div>
                  <p className="text-stone-600 text-[7px]">{hi ? 'रुकें, समीक्षा करें' : 'Pause & Reflect'}</p>
                </div>
                <div className="rounded bg-emerald-50 p-1.5 border border-emerald-300">
                  <div className="font-bold text-emerald-950">Dec 2026 · 8</div>
                  <p className="text-emerald-800 text-[7px]">{hi ? 'धन व करियर में ज़ोर' : 'Money & Career Push'}</p>
                </div>
                <div className="rounded bg-white/70 p-1.5 border border-stone-200">
                  <div className="font-bold text-stone-900">Jan 2027 · 6</div>
                  <p className="text-stone-600 text-[7px]">{hi ? 'परिवार व घर के कार्य' : 'Home & Family'}</p>
                </div>
                <div className="rounded bg-emerald-50 p-1.5 border border-emerald-300">
                  <div className="font-bold text-emerald-950">May 2027 · 1</div>
                  <p className="text-emerald-800 text-[7px]">{hi ? 'शुरुआत का सर्वोत्तम माह' : 'Best Launch Month'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-emerald-700 font-semibold">12-Month Detailed Guide</span>
              <span>Page 4 / 10</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Critical decision windows – contract signing, job & money', hi: 'महत्वपूर्ण निर्णय तिथियाँ – अनुबंध, नौकरी बदलाव और निवेश' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Decision Windows</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 7 / 10</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'हस्ताक्षर व निवेश की शुभ तिथियाँ' : 'Favourable Dates for Decisions'}</h4>

              <div className="mt-2 rounded bg-white/70 p-2 border border-stone-200 text-[8.5px]">
                <p className="font-semibold text-stone-900">{hi ? '1 व 5 योग वाली तिथियाँ:' : 'Dates Adding to 1 or 5:'}</p>
                <p className="font-mono text-emerald-800 text-[8px] font-bold mt-1">1, 5, 10, 14, 19, 23, 28</p>
                <p className="text-stone-600 text-[7.5px] mt-1">{hi ? 'अनुबंध हस्ताक्षर, नई नौकरी और संपत्ति ख़रीद के लिए शुभ।' : 'Ideal for signing agreements and major financial steps.'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Direct Answers Included</span>
              <span>Page 7 / 10</span>
            </div>
          </div>
        ),
      },
      {
        caption: { en: 'Protective annual remedies – lucky colours, days & mantras', hi: 'वर्ष के सुरक्षा उपाय – शुभ रंग, दिन, मंत्र और दान' },
        renderDoc: (hi) => (
          <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 text-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 text-[9px] text-amber-900/80">
                <span className="font-semibold tracking-wider uppercase">Annual Remedies</span>
                <span className="rounded bg-amber-900/10 px-1.5 py-0.5 font-mono text-[8px]">Page 10 / 10</span>
              </div>
              <h4 className="font-serif text-xs font-bold text-stone-900 mt-2">{hi ? 'व्यक्तिगत वर्ष 5 सुरक्षा उपाय' : 'Annual Remedies for Smooth Growth'}</h4>

              <div className="mt-2 space-y-1.5 text-[8.5px]">
                <div className="rounded bg-white/70 p-1.5 border border-stone-200 flex justify-between">
                  <span className="font-semibold text-stone-900">{hi ? 'शुभ रंग:' : 'Colors:'}</span>
                  <span className="text-emerald-800 font-medium">Green, Emerald</span>
                </div>
                <div className="rounded bg-white/70 p-1.5 border border-stone-200 flex justify-between">
                  <span className="font-semibold text-stone-900">{hi ? 'शुभ वार:' : 'Day:'}</span>
                  <span className="text-emerald-800 font-medium">Wednesday</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 text-[8px] text-stone-500">
              <span className="text-amber-900 font-semibold">Acharya Nandram Guidance</span>
              <span>Page 10 / 10</span>
            </div>
          </div>
        ),
      },
    ],
  },

  'signature-analysis': {
    kicker: { en: '6–7 page designed PDF', hi: '6–7 पृष्ठ की डिज़ाइन की हुई PDF' },
    h2: { en: 'Inside Your Signature Report', hi: 'आपकी हस्ताक्षर रिपोर्ट के अंदर' },
    desc: {
      en: 'Pages from a sample report for a fictional client. Your report is prepared for your own signature, name and date of birth.',
      hi: 'एक काल्पनिक क्लाइंट की नमूना रिपोर्ट के पृष्ठ। आपकी रिपोर्ट आपके अपने हस्ताक्षर, नाम और जन्म तिथि के लिए तैयार होती है।',
    },
    pages: SIGNATURE_PAGES,
  },
};

export function InsideReportSection({ slug }: { slug: string }) {
  const meta = SERVICE_REPORTS[slug] ?? SERVICE_REPORTS['personal-numerology-report'];

  return (
    <section id="inside-report" aria-labelledby="inside-report-h" className="scroll-mt-20 space-y-5">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          <Bi en={meta.kicker.en} hi={meta.kicker.hi} />
        </p>
        <h2 id="inside-report-h" className="mt-1 font-cinzel text-2xl font-bold sm:text-3xl">
          <Bi en={meta.h2.en} hi={meta.h2.hi} />
        </h2>
        <p className="mx-auto mt-1 max-w-2xl text-muted-foreground">
          <Bi en={meta.desc.en} hi={meta.desc.hi} />
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {meta.pages.map((p, idx) => (
          <figure key={idx} className="space-y-2 group">
            <div className="cz-report-page relative aspect-[1/1.414] overflow-hidden rounded-xl border border-gold/40 bg-[#fdfbf7] text-stone-900 shadow-xl transition-all">
              {p.src ? (
                <Image
                  src={p.src}
                  alt={p.caption.en}
                  width={600}
                  height={849}
                  className="h-full w-full object-cover"
                  sizes="(min-width:1024px) 25vw, 50vw"
                />
              ) : (
                <ForLang className="h-full w-full">
                  {(l) => (p.renderDoc ? p.renderDoc(l === 'hi') : null)}
                </ForLang>
              )}

              {/* Subtle gold hover overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gold/0 transition-colors group-hover:bg-gold/5" />
            </div>
            <figcaption className="text-center text-xs text-muted-foreground leading-snug">
              <Bi en={p.caption.en} hi={p.caption.hi} />
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
