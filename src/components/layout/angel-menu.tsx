'use client';
import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, ChevronDown, Heart, Sparkles } from 'lucide-react';
import { useApp } from './providers';

/** The 12 most-searched angel numbers (Keyword Planner, India) with a one-line meaning for the menu preview. */
const TOP: { n: string; title: string; line: string; love: string; career: string; hiTitle: string; hiLine: string; hiLove: string; hiCareer: string }[] = [
  { n: '222', title: 'Trust & balance', line: 'Things are coming together. Keep faith, stay patient and cooperate.', love: 'Harmony, commitment', career: 'Partnerships, teamwork', hiTitle: 'विश्वास और संतुलन', hiLine: 'चीज़ें अपनी जगह आ रही हैं। आस्था रखें, धैर्य रखें और सहयोग करें।', hiLove: 'सामंजस्य, प्रतिबद्धता', hiCareer: 'साझेदारी, टीमवर्क' },
  { n: '777', title: 'Spiritual awakening', line: 'You are on the right path; your inner wisdom and luck are supporting you.', love: 'Soulful bond', career: 'Research, expertise', hiTitle: 'आध्यात्मिक जागृति', hiLine: 'आप सही मार्ग पर हैं; आपका आंतरिक ज्ञान और भाग्य आपका साथ दे रहे हैं।', hiLove: 'आत्मिक बंधन', hiCareer: 'शोध, विशेषज्ञता' },
  { n: '444', title: 'Protection & stability', line: 'You are protected. The foundation you are building is solid.', love: 'Loyalty, security', career: 'Planning, property', hiTitle: 'सुरक्षा और स्थिरता', hiLine: 'आप सुरक्षित हैं। आप जो नींव बना रहे हैं वह मज़बूत है।', hiLove: 'वफ़ादारी, सुरक्षा', hiCareer: 'योजना, संपत्ति' },
  { n: '1111', title: 'Manifestation', line: 'A powerful new beginning. Your thoughts are shaping reality.', love: 'New start', career: 'Launch, leadership', hiTitle: 'मैनिफेस्टेशन', hiLine: 'एक शक्तिशाली नई शुरुआत। आपके विचार वास्तविकता बना रहे हैं।', hiLove: 'नई शुरुआत', hiCareer: 'आरंभ, नेतृत्व' },
  { n: '333', title: 'Growth & divine support', line: 'Your guides are near. Express yourself and grow.', love: 'Joy, open talk', career: 'Teaching, creative work', hiTitle: 'विकास और ईश्वरीय सहायता', hiLine: 'आपके मार्गदर्शक निकट हैं। स्वयं को व्यक्त करें और आगे बढ़ें।', hiLove: 'आनंद, खुली बातचीत', hiCareer: 'अध्यापन, रचनात्मक कार्य' },
  { n: '555', title: 'Big change', line: 'Major change is coming. Release the old and stay flexible.', love: 'New phase', career: 'New opportunity', hiTitle: 'बड़ा बदलाव', hiLine: 'बड़ा परिवर्तन आने वाला है। पुराना छोड़ें और लचीले रहें।', hiLove: 'नया दौर', hiCareer: 'नया अवसर' },
  { n: '1212', title: 'Step forward', line: 'Trust yourself and leave your comfort zone, step by step.', love: 'Balance & progress', career: 'New skills', hiTitle: 'आगे बढ़ें', hiLine: 'स्वयं पर भरोसा रखें और एक-एक कदम करके कम्फर्ट ज़ोन से बाहर निकलें।', hiLove: 'संतुलन और प्रगति', hiCareer: 'नए कौशल' },
  { n: '2222', title: 'Harmony', line: 'Everything is falling into place. Stay calm and trust the timing.', love: 'Reunion, commitment', career: 'Agreements', hiTitle: 'सामंजस्य', hiLine: 'सब कुछ अपनी जगह आ रहा है। शांत रहें और सही समय पर भरोसा रखें।', hiLove: 'पुनर्मिलन, प्रतिबद्धता', hiCareer: 'समझौते' },
  { n: '111', title: 'New beginnings', line: 'Focus your thoughts; a fresh start is ready for you.', love: 'Self-love, new start', career: 'Entrepreneurship', hiTitle: 'नई शुरुआत', hiLine: 'अपने विचारों को केंद्रित करें; नई शुरुआत आपके लिए तैयार है।', hiLove: 'आत्म-प्रेम, नई शुरुआत', hiCareer: 'उद्यमिता' },
  { n: '666', title: 'Rebalance', line: 'Not a bad omen: shift from worry to care, family and inner peace.', love: 'Restore balance', career: 'Less money stress', hiTitle: 'संतुलन फिर से साधें', hiLine: 'अशुभ नहीं: चिंता से हटकर देखभाल, परिवार और आंतरिक शांति की ओर बढ़ें।', hiLove: 'संतुलन लौटाएँ', hiCareer: 'पैसों का तनाव कम करें' },
  { n: '1010', title: 'New chapter', line: 'Spiritual growth and a supported new beginning.', love: 'Fresh start', career: 'Self-employment', hiTitle: 'नया अध्याय', hiLine: 'आध्यात्मिक विकास और सहारा पाती नई शुरुआत।', hiLove: 'नई शुरुआत', hiCareer: 'स्वरोज़गार' },
  { n: '888', title: 'Abundance', line: 'Prosperity and rewards for honest effort are on the way.', love: 'Mature commitment', career: 'Finance, growth', hiTitle: 'समृद्धि', hiLine: 'ईमानदार मेहनत का फल और संपन्नता रास्ते में है।', hiLove: 'परिपक्व प्रतिबद्धता', hiCareer: 'वित्त, वृद्धि' },
];

export function AngelMenu() {
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrap = React.useRef<HTMLDivElement>(null);
  const a = TOP[active];
  const show = () => { clearTimeout(timer.current); setOpen(true); };
  const hide = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 160); };
  const close = () => setOpen(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey); document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);

  return (
    <div ref={wrap} className="relative hidden md:block" onMouseEnter={show} onMouseLeave={hide}>
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-muted">
        {t.nav.angel}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="fixed inset-x-0 top-[65px] z-50 mx-auto w-[min(94vw,880px)] pt-2">
          <span aria-hidden className="absolute -top-4 inset-x-0 h-6" />
          <div className="mk-drop glass overflow-hidden rounded-xl border border-gold/30 bg-background/95 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-[300px_1fr]">
              <div className="border-r border-gold/20 bg-gradient-to-b from-gold/5 to-transparent p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{hi ? 'सबसे अधिक खोजे जाने वाले एंजेल नंबर' : 'Most searched angel numbers'}</p>
                <div className="grid grid-cols-3 gap-2">
                  {TOP.map((x, i) => (
                    <Link key={x.n} href={`/angel-numbers/${x.n}`} onClick={close} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}
                      className={`flex flex-col items-center rounded-lg border py-2 transition-all ${active === i ? 'border-gold bg-gold/15 shadow-[0_0_16px_hsl(var(--gold)/0.3)]' : 'border-gold/20 hover:border-gold/60'}`}>
                      <span className="gold-text font-cinzel text-xl font-bold leading-none">{x.n}</span>
                      <span className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">#{i + 1}</span>
                    </Link>
                  ))}
                </div>
                <Link href="/angel-numbers" onClick={close} className="mt-4 flex items-center gap-1 text-xs text-gold hover:underline">{hi ? 'सभी 1,400+ एंजेल नंबर' : 'All 1,400+ angel numbers'} <ArrowRight className="h-3 w-3" /></Link>
              </div>
              <div className="flex flex-col p-5">
                <div key={active} className="mk-fade">
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 shrink-0">
                      <span className="mk-spin absolute inset-0 rounded-full border border-dashed border-gold/60" />
                      <span className="mk-spin-rev absolute inset-2 rounded-full border border-gold/30" />
                      <span className="mk-pulse absolute inset-3 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a]"><span className="gold-text font-cinzel text-lg font-bold">{a.n}</span></span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-cinzel text-xl font-bold gold-text">{hi ? `एंजेल नंबर ${a.n}` : `Angel Number ${a.n}`}</h3>
                      <p className="text-sm font-medium">{hi ? a.hiTitle : a.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{hi ? a.hiLine : a.line}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-gold/20 p-2"><p className="text-[10px] uppercase tracking-widest text-gold">{hi ? 'प्रेम' : 'Love'}</p>{hi ? a.hiLove : a.love}</div>
                    <div className="rounded-lg border border-gold/20 p-2"><p className="text-[10px] uppercase tracking-widest text-gold">{hi ? 'करियर' : 'Career'}</p>{hi ? a.hiCareer : a.career}</div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-gold/25 bg-gold/5 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold"><Sparkles className="h-3 w-3" />{hi ? 'एंजेल नंबर मार्गदर्शन' : 'Angel number guidance'}</p>
                  <ul className="grid gap-1.5 text-xs">
                    <li><Link href="/angel-numbers/calculator" onClick={close} className="flex items-start gap-2 hover:text-gold"><Calculator className="mt-0.5 h-3.5 w-3.5 text-gold" /><span><b className="font-medium">{hi ? 'मेरा एंजेल नंबर खोजें' : 'Find my angel number'}</b><span className="block text-muted-foreground">{hi ? 'जन्म तिथि से आपके व्यक्तिगत एंजेल नंबर' : 'Your personal angel numbers from your date of birth'}</span></span></Link></li>
                    <li><Link href={`/angel-numbers/calculator?n=${a.n}`} onClick={close} className="flex items-start gap-2 hover:text-gold"><Sparkles className="mt-0.5 h-3.5 w-3.5 text-gold" /><span><b className="font-medium">{hi ? `क्या ${a.n} मेरी जन्म तिथि से मेल खाता है?` : `Is ${a.n} compatible with my DOB?`}</b><span className="block text-muted-foreground">{hi ? 'आपके मूलांक और भाग्यांक से अनुकूलता स्कोर' : 'Alignment score with your Mulank and Bhagyank'}</span></span></Link></li>
                    <li><Link href="/angel-numbers/calculator#couple" onClick={close} className="flex items-start gap-2 hover:text-gold"><Heart className="mt-0.5 h-3.5 w-3.5 text-gold" /><span><b className="font-medium">{hi ? 'जोड़ी का एंजेल नंबर' : 'Couple angel number'}</b><span className="block text-muted-foreground">{hi ? 'दो जन्म तिथियाँ, एक साझा अंक' : 'Two dates of birth, one shared number'}</span></span></Link></li>
                  </ul>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/angel-numbers/${a.n}`} onClick={close} className="inline-flex items-center gap-1 rounded-md border border-gold/60 px-3 py-2 text-sm font-medium hover:bg-gold/10">{hi ? `${a.n} का अर्थ` : `Meaning of ${a.n}`} <ArrowRight className="h-3.5 w-3.5" /></Link>
                  <Link href="/reading" onClick={close} className="inline-flex items-center rounded-md bg-gradient-to-r from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)] px-3 py-2 text-sm font-semibold text-[hsl(250_45%_10%)] hover:brightness-105">{hi ? 'मेरी रीडिंग पाएँ' : 'Get my reading'}</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
