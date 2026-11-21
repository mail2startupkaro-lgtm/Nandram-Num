import { ArrowDownRight, Circle, Eye, Feather, Gauge, Minus, MoveUpRight, PenLine, Ruler, Scaling, Space, Type } from 'lucide-react';
import { Bi } from '@/components/i18n/bi';
import { ServiceLanding, serviceMetadata } from '@/components/services/service-landing';
import { SignatureQuickCheck } from '@/components/services/signature-tools';
import { getService, isPayable } from '@/lib/billing/services';
import { formatInr } from '@/lib/billing/plans';
import { funnelWhatsapp } from '@/lib/funnel/offer';

export const metadata = serviceMetadata('signature-analysis');
export const revalidate = 300;

const FEATURES = [
  { icon: MoveUpRight, en: ['Baseline direction', 'Rising, straight or falling – your outlook and energy.'], hi: ['आधार रेखा की दिशा', 'ऊपर उठती, सीधी या गिरती – आपका दृष्टिकोण और ऊर्जा।'] },
  { icon: Feather, en: ['Slant of letters', 'Forward, upright or backward – how you relate to people.'], hi: ['अक्षरों का झुकाव', 'आगे, सीधा या पीछे – लोगों से आपका व्यवहार।'] },
  { icon: Type, en: ['First letter', 'Its size and clarity – self-esteem and credit for your work.'], hi: ['पहला अक्षर', 'उसका आकार और स्पष्टता – आत्म-सम्मान और काम का श्रेय।'] },
  { icon: Scaling, en: ['Size', 'Large, medium or small – confidence and visibility.'], hi: ['आकार', 'बड़ा, मध्यम या छोटा – आत्मविश्वास और पहचान।'] },
  { icon: Eye, en: ['Legibility', 'Readable or a scribble – openness and how others read you.'], hi: ['पठनीयता', 'पढ़ने योग्य या घसीटा – खुलापन और लोग आपको कैसे समझते हैं।'] },
  { icon: Gauge, en: ['Pen pressure', 'Heavy, medium or light – drive and stress.'], hi: ['क़लम का दबाव', 'भारी, मध्यम या हल्का – ऊर्जा और तनाव।'] },
  { icon: Minus, en: ['Underline & cutting strokes', 'Support below the name, or a line that cuts through it.'], hi: ['अंडरलाइन और काटती रेखा', 'नाम के नीचे सहारा, या नाम को काटती रेखा।'] },
  { icon: ArrowDownRight, en: ['Ending stroke', 'Upward, flat or downward – how you finish what you start.'], hi: ['अंतिम स्ट्रोक', 'ऊपर, सीधा या नीचे – आप काम कैसे पूरा करते हैं।'] },
  { icon: Circle, en: ['Dots & full stops', 'A full stop after the name, or support dots below it.'], hi: ['बिंदु और पूर्ण विराम', 'नाम के बाद पूर्ण विराम, या नीचे सहायक बिंदु।'] },
  { icon: Space, en: ['Spacing & flow', 'Connected or separated parts of the name.'], hi: ['दूरी और प्रवाह', 'नाम के हिस्से जुड़े हुए या अलग।'] },
  { icon: Ruler, en: ['Enclosure & consistency', 'A circle around the signature, and how alike your samples are.'], hi: ['घेरा और एकरूपता', 'हस्ताक्षर के चारों ओर घेरा, और आपके नमूने कितने एक जैसे हैं।'] },
  { icon: PenLine, en: ['Numerology of the signed name', 'Its number, the first letter and both with your Moolank & Bhagyank.'], hi: ['हस्ताक्षर-नाम का अंक ज्योतिष', 'उसका अंक, पहला अक्षर और दोनों का मूलांक व भाग्यांक से मेल।'] },
];

async function priceText() {
  try { const s = await getService('SVC_SIGNATURE'); return s && isPayable(s) ? formatInr(s.pricePaise) : undefined; } catch { return undefined; }
}

export default async function Page() {
  const price = await priceText();
  return (
    <ServiceLanding slug="signature-analysis">
      <section aria-labelledby="sqc-h" className="space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="Free · instant · private" hi="मुफ़्त · तुरंत · निजी" /></p>
          <h2 id="sqc-h" className="font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="Check Your Signature Now" hi="अभी अपना हस्ताक्षर जाँचें" /></h2>
          <p className="mx-auto mt-1 max-w-2xl text-muted-foreground"><Bi en="See whether the name you sign suits your date of birth, and – if you add your signature – what its baseline, strokes and ending say." hi="देखें कि आप जो नाम लिखते हैं वह आपकी जन्म तिथि के अनुकूल है या नहीं, और – हस्ताक्षर जोड़ें तो – उसकी आधार रेखा, स्ट्रोक और अंत क्या कहते हैं।" /></p>
        </div>
        <SignatureQuickCheck whatsapp={funnelWhatsapp()} priceText={price} />
      </section>

      <section aria-labelledby="feat-h" className="space-y-5">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en="Graphology × Numerology" hi="हस्तलेख विज्ञान × अंक ज्योतिष" /></p>
          <h2 id="feat-h" className="font-cinzel text-2xl font-bold sm:text-3xl"><Bi en="What We Read in Your Signature" hi="हम आपके हस्ताक्षर में क्या पढ़ते हैं" /></h2>
          <p className="mx-auto mt-1 max-w-2xl text-muted-foreground"><Bi en="Each feature is measured from your photos and read by Acharya Nandram – then matched with the numbers of the name you sign." hi="हर विशेषता आपकी फ़ोटो से मापी जाती है और आचार्य नंदराम द्वारा पढ़ी जाती है – फिर आपके लिखे नाम के अंकों से मिलाई जाती है।" /></p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((x) => (
            <div key={x.en[0]} className="glass flex gap-3 rounded-xl border border-gold/20 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold"><x.icon className="h-5 w-5" /></span>
              <div><p className="font-semibold"><Bi en={x.en[0]} hi={x.hi[0]} /></p><p className="text-sm text-muted-foreground"><Bi en={x.en[1]} hi={x.hi[1]} /></p></div>
            </div>
          ))}
        </div>
      </section>
    </ServiceLanding>
  );
}
