'use client';
/**
 * Free instant signature check on /signature-analysis.
 * Name + DOB (+ optional photo or drawing) → signed-name number and its harmony with the Bhagyank, first letter,
 * up to five measured signature findings and a preview score. Runs entirely in the browser – nothing is uploaded.
 * The full ranked name forms, all 11 features, corrections and the ideal signature stay in the paid report.
 */
import * as React from 'react';
import { Brush, CheckCircle2, ImageUp, Loader2, Lock, MessageCircle, PenLine, Sparkles, TriangleAlert, X } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { DrawPad } from '@/components/signature/draw-pad';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { trackEvent } from '@/lib/client/analytics';
import { analyseSample, shrink } from '@/lib/client/signature-image';
import { parseDate, todayIST, toIso } from '@/lib/numerology';
import { effectiveFeatures, engineScores, type EffectiveFeature } from '@/lib/signature/agent';
import { classifyMetrics, type SignatureMetrics } from '@/lib/signature/measure';
import { signatureNumbers, type SignatureNumbers } from '@/lib/signature/numbers';
import { cn } from '@/lib/utils';

const T = {
  en: {
    name: 'Full name', signed: 'Name as you sign it', signedHint: 'e.g. R. Sharma – leave blank if you sign the full name', dob: 'Date of birth', sample: 'Your signature (optional, for the visual check)',
    upload: 'Upload a photo', draw: 'Sign on screen', uploadHint: 'Sign on plain white paper and photograph it from above. The image stays on your device.', remove: 'Remove', use: 'Use this signature', clear: 'Clear',
    check: 'Check my signature', checking: 'Reading your signature…', preview: 'Preview score', previewNote: (img: boolean) => (img ? 'from your signature and numbers' : 'numbers only – add your signature for the visual check'),
    signedNum: 'Your signed name', vib: 'vibrates to', bh: 'With your Bhagyank', letter: 'First letter', planet: 'Your signature day',
    rel: { friend: 'Friendly', neutral: 'Neutral', enemy: 'Not friendly' } as Record<string, string>, nature: { favourable: 'Favourable', mixed: 'Mixed', unfavourable: 'Unfavourable' } as Record<string, string>,
    findings: 'What we see in your signature', better: (cur: number, best: number) => `A better way to sign your name was found for your numbers (score ${best} vs ${cur} now). It is revealed in your full report.`, bestNow: 'Your current name form is already among the best for your numbers – the full report checks the visual side in detail.',
    locked: 'In your full report', lockedItems: ['All 11 signature features with what each means for you', 'Corrections in order of priority', 'The best way to sign your name – ranked options', 'Your ideal signature, step by step, with do’s and don’ts', 'Start dates, ink colour and a 21-day practice chart', 'Personality, career and money indications'],
    book: 'Get the full analysis', wa: 'Ask on WhatsApp', nameErr: 'Please enter your name in English letters.', dobErr: 'Please enter a valid date of birth.', noInk: 'We could not find the signature in this photo – try a clearer photo on white paper.',
    privacy: 'Free and instant. Your signature is checked in your browser and is not uploaded or saved.', supports: 'Supports', watch: 'Needs attention', neutralF: 'Neutral',
  },
  hi: {
    name: 'पूरा नाम', signed: 'हस्ताक्षर में आप नाम कैसे लिखते हैं', signedHint: 'जैसे R. Sharma – पूरा नाम लिखते हैं तो खाली छोड़ें', dob: 'जन्म तिथि', sample: 'आपका हस्ताक्षर (वैकल्पिक, दृश्य जाँच के लिए)',
    upload: 'फ़ोटो अपलोड करें', draw: 'स्क्रीन पर हस्ताक्षर करें', uploadHint: 'सादे सफ़ेद काग़ज़ पर हस्ताक्षर करें और ऊपर से फ़ोटो लें। चित्र आपके डिवाइस पर ही रहता है।', remove: 'हटाएँ', use: 'यह हस्ताक्षर उपयोग करें', clear: 'साफ़ करें',
    check: 'मेरा हस्ताक्षर जाँचें', checking: 'आपका हस्ताक्षर पढ़ा जा रहा है…', preview: 'प्रारंभिक स्कोर', previewNote: (img: boolean) => (img ? 'आपके हस्ताक्षर और अंकों से' : 'केवल अंकों से – दृश्य जाँच के लिए हस्ताक्षर जोड़ें'),
    signedNum: 'आपका हस्ताक्षर-नाम', vib: 'का अंक', bh: 'भाग्यांक के साथ', letter: 'पहला अक्षर', planet: 'आपके हस्ताक्षर का दिन',
    rel: { friend: 'मित्र', neutral: 'सम', enemy: 'शत्रु' } as Record<string, string>, nature: { favourable: 'शुभ', mixed: 'मिश्रित', unfavourable: 'अशुभ' } as Record<string, string>,
    findings: 'आपके हस्ताक्षर में हमें क्या दिखा', better: (cur: number, best: number) => `आपके अंकों के लिए नाम लिखने का एक बेहतर तरीका मिला (स्कोर ${best}, अभी ${cur})। यह आपकी पूरी रिपोर्ट में बताया जाता है।`, bestNow: 'आपके नाम का वर्तमान रूप आपके अंकों के लिए पहले से अच्छे विकल्पों में है – पूरी रिपोर्ट दृश्य पक्ष की विस्तार से जाँच करती है।',
    locked: 'आपकी पूरी रिपोर्ट में', lockedItems: ['हस्ताक्षर की सभी 11 विशेषताएँ और आपके लिए उनका अर्थ', 'प्राथमिकता क्रम में सुधार', 'नाम लिखने का सबसे अच्छा तरीका – क्रमवार विकल्प', 'आपका आदर्श हस्ताक्षर, चरण-दर-चरण, करें और न करें सहित', 'आरंभ तिथियाँ, स्याही का रंग और 21 दिन का अभ्यास चार्ट', 'व्यक्तित्व, करियर और धन के संकेत'],
    book: 'पूरा विश्लेषण पाएँ', wa: 'WhatsApp पर पूछें', nameErr: 'कृपया अपना नाम अंग्रेज़ी अक्षरों में लिखें।', dobErr: 'कृपया सही जन्म तिथि दें।', noInk: 'इस फ़ोटो में हस्ताक्षर नहीं मिला – सफ़ेद काग़ज़ पर साफ़ फ़ोटो लें।',
    privacy: 'मुफ़्त और तुरंत। आपका हस्ताक्षर आपके ब्राउज़र में ही जाँचा जाता है, अपलोड या सेव नहीं होता।', supports: 'सहायक', watch: 'ध्यान दें', neutralF: 'सामान्य',
  },
};

/** Short, plain-language findings for the free check (full meanings are in the report). */
const FINDING: Record<string, Record<string, { en: string; hi: string }>> = {
  baseline: { rising: { en: 'Your signature rises – optimism and ambition.', hi: 'आपका हस्ताक्षर ऊपर उठता है – आशा और महत्वाकांक्षा।' }, straight: { en: 'Your baseline is straight – steady and practical.', hi: 'आधार रेखा सीधी है – स्थिर और व्यावहारिक।' }, falling: { en: 'Your signature falls downward – traditionally believed to pull results down.', hi: 'आपका हस्ताक्षर नीचे गिरता है – परंपरा में इसे परिणाम घटाने वाला माना जाता है।' }, wavy: { en: 'Your baseline is uneven – energy and moods may vary.', hi: 'आधार रेखा असमान है – ऊर्जा और मनोदशा बदलती रह सकती है।' } },
  underline: { through: { en: 'A line cuts through your name – traditionally considered unfavourable.', hi: 'एक रेखा आपके नाम को काटती है – परंपरा में अशुभ मानी जाती है।' }, single: { en: 'A clean underline – self-confidence and support.', hi: 'साफ़ अंडरलाइन – आत्मविश्वास और सहारा।' }, double: { en: 'A double underline – a strong need for recognition.', hi: 'दोहरी अंडरलाइन – पहचान की तीव्र इच्छा।' } },
  ending: { upward: { en: 'It ends with an upward stroke – positive expectation.', hi: 'यह ऊपर जाते स्ट्रोक पर ख़त्म होता है – सकारात्मक अपेक्षा।' }, downward: { en: 'It ends with a downward stroke – tasks may end in fatigue.', hi: 'यह नीचे जाते स्ट्रोक पर ख़त्म होता है – काम थकान में ख़त्म हो सकते हैं।' } },
  dots: { end: { en: 'A full stop after the name – believed to stop the flow.', hi: 'नाम के बाद पूर्ण विराम – प्रवाह रुकने का संकेत।' }, two: { en: 'Dots below the name – a traditional support symbol.', hi: 'नाम के नीचे बिंदु – पारंपरिक सहायक चिह्न।' } },
  first: { bold: { en: 'A bold first letter – healthy self-esteem.', hi: 'प्रमुख पहला अक्षर – स्वस्थ आत्म-सम्मान।' }, small: { en: 'A small first letter – your work may not get due credit.', hi: 'छोटा पहला अक्षर – आपके काम को उचित श्रेय न मिलना।' } },
  slant: { right: { en: 'Letters lean forward – warm and outgoing.', hi: 'अक्षर आगे झुकते हैं – आत्मीय और मिलनसार।' }, left: { en: 'Letters lean backward – reserved and private.', hi: 'अक्षर पीछे झुकते हैं – संकोची और निजी।' } },
  enclosure: { circled: { en: 'Your signature is enclosed – guarded, keeps opportunities out.', hi: 'हस्ताक्षर घेरे में है – सुरक्षात्मक, अवसरों को दूर रखता है।' } },
};
const ORDER = ['underline', 'baseline', 'dots', 'ending', 'first', 'enclosure', 'slant'];

interface Out { numbers: SignatureNumbers; score: number; hasImage: boolean; findings: EffectiveFeature[]; annotated: string | null; noInk: boolean }

export function SignatureQuickCheck({ whatsapp, priceText }: { whatsapp: string; priceText?: string }) {
  const { lang } = useApp();
  const t = T[lang];
  const [f, setF] = React.useState({ name: '', signed: '', dob: '' });
  const [mode, setMode] = React.useState<'upload' | 'draw'>('upload');
  const [img, setImg] = React.useState<{ dataUrl: string; source: 'photo' | 'drawn' } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [out, setOut] = React.useState<Out | null>(null);
  const max = toIso(todayIST());

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || !/^image\//.test(file.type)) return;
    setImg({ dataUrl: await shrink(file), source: 'photo' });
  }

  async function run(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setOut(null);
    if (!/[A-Za-z]{2,}/.test(f.name)) { setErr(t.nameErr); return; }
    let dob; try { dob = parseDate(f.dob); if (dob.year < 1900 || f.dob > max) throw new Error(); } catch { setErr(t.dobErr); return; }
    setBusy(true);
    try {
      const numbers = signatureNumbers({ fullName: f.name, signatureName: f.signed || undefined, dob, professionId: 'other' });
      let metrics: SignatureMetrics | null = null, annotated: string | null = null;
      if (img) { const a = await analyseSample(img.dataUrl, img.source); metrics = a.metrics; annotated = a.annotated; }
      const noInk = !!img && !metrics?.strokeWidth;
      const letters = (f.signed || f.name).replace(/[^A-Za-z]/g, '').length;
      const input = { fullName: f.name, dobText: f.dob, profession: '', goals: [], language: 'en' as const, observations: {}, measured: metrics?.strokeWidth ? classifyMetrics(metrics, letters) : undefined };
      const fs = effectiveFeatures(input, 0.45);
      const findings = ORDER.map((id) => fs.find((x) => x.id === id && FINDING[id]?.[x.option])).filter((x): x is EffectiveFeature => !!x).slice(0, 5);
      setOut({ numbers, score: engineScores(input, numbers, fs).overall, hasImage: !!metrics?.strokeWidth, findings, annotated, noInk });
      trackEvent('signature_check', { has_image: !!img });
      setTimeout(() => document.getElementById('sqc-out')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    } finally { setBusy(false); }
  }

  const n = out?.numbers;
  const relTone = (r: string) => (r === 'friend' ? 'text-success' : r === 'enemy' ? 'text-danger' : 'text-foreground');
  const current = n?.nameOptions.find((o) => o.current);
  return (
    <div className="glass mx-auto max-w-4xl rounded-2xl border border-gold/40 p-5 sm:p-7">
      <form onSubmit={run} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t.name} htmlFor="sqc-n" required><Input id="sqc-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} autoComplete="name" required /></Field>
          <Field label={t.signed} htmlFor="sqc-s" hint={t.signedHint}><Input id="sqc-s" value={f.signed} onChange={(e) => setF({ ...f, signed: e.target.value })} maxLength={80} /></Field>
          <Field label={t.dob} htmlFor="sqc-d" required><Input id="sqc-d" type="date" max={max} value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} required /></Field>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{t.sample}</p>
          {img ? (
            <div className="flex flex-wrap items-start gap-3"><img src={img.dataUrl} alt="" className="max-h-32 rounded-lg border border-gold/40 bg-white p-1" /><Button type="button" variant="outline" size="sm" onClick={() => { setImg(null); setOut(null); }}><X className="mr-1 h-4 w-4" />{t.remove}</Button></div>
          ) : (
            <>
              <div className="flex gap-2">{(['upload', 'draw'] as const).map((m) => <button key={m} type="button" onClick={() => setMode(m)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm', mode === m ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:bg-muted')}>{m === 'upload' ? <ImageUp className="h-4 w-4" /> : <Brush className="h-4 w-4" />}{m === 'upload' ? t.upload : t.draw}</button>)}</div>
              {mode === 'upload' ? (
                <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-gold/40 p-5 text-center text-sm hover:bg-gold/5">
                  <ImageUp className="h-7 w-7 text-gold" /><span className="text-muted-foreground">{t.uploadHint}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
                </label>
              ) : <DrawPad onDone={(d) => setImg({ dataUrl: d, source: 'drawn' })} label={t.use} clearLabel={t.clear} />}
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="gold" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}{busy ? t.checking : t.check}</Button>
          <span className="text-xs text-muted-foreground">{t.privacy}</span>
        </div>
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
      </form>

      {out && n && (
        <div id="sqc-out" className="mk-rise mt-6 space-y-5 border-t border-border/60 pt-6" aria-live="polite">
          <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
            <div className="mx-auto text-center">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" /><circle cx="60" cy="60" r="52" fill="none" stroke="hsl(43 85% 55%)" strokeWidth="10" strokeLinecap="round" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - out.score / 100)} style={{ transition: 'stroke-dashoffset 900ms ease' }} /></svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="gold-text font-serif text-4xl font-bold">{out.score}</span><span className="text-[9px] uppercase tracking-widest text-muted-foreground">{t.preview}</span></div>
              </div>
              <p className="mt-1 max-w-[10rem] text-[11px] text-muted-foreground">{t.previewNote(out.hasImage)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.signedNum}</p>
                <p className="font-serif text-lg"><b>{current?.text ?? n.signName.text}</b> {t.vib} <b className="gold-text text-2xl">{n.signName.compound}/{n.signName.single}</b></p>
                <p className="text-xs text-muted-foreground">{t.nature[n.signName.category]} · {n.signName.meaning}</p></div>
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.bh} {n.bhagyankMaster ? `${n.bhagyankMaster}/${n.bhagyank}` : n.bhagyank}</p>
                <p className={cn('font-serif text-2xl font-bold', relTone(n.signToBhagyank))}>{t.rel[n.signToBhagyank]}</p>
                <p className="text-xs text-muted-foreground">Moolank {n.moolank}: {t.rel[n.signToMoolank]}</p></div>
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.letter}</p>
                <p className="font-serif text-2xl font-bold">{n.firstLetter.letter} = {n.firstLetter.value} <span className="text-sm font-normal text-muted-foreground">({n.firstLetter.planet})</span></p>
                <p className={cn('text-xs', relTone(n.firstLetter.toBhagyank))}>{t.rel[n.firstLetter.toBhagyank]}</p></div>
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.planet}</p>
                <p className="font-serif text-2xl font-bold">{n.planet.weekday}</p><p className="text-xs text-muted-foreground">{n.planet.name}</p></div>
            </div>
          </div>

          {out.noInk && <p className="flex items-center gap-2 text-sm text-warning"><TriangleAlert className="h-4 w-4" />{t.noInk}</p>}
          {out.hasImage && (
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {out.annotated && <div className="rounded-lg border border-gold/30 bg-white p-2"><img src={out.annotated} alt="" className="max-h-52 w-full object-contain" /></div>}
              <div><p className="mb-2 font-semibold">{t.findings}</p>
                <ul className="space-y-2 text-sm">{out.findings.map((x) => { const tx = FINDING[x.id][x.option]; return (
                  <li key={x.id} className="flex gap-2">{x.impact === 'watch' ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> : x.impact === 'positive' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />}<span>{tx[lang]}</span></li>); })}
                  {!out.findings.length && <li className="text-muted-foreground">—</li>}</ul></div>
            </div>
          )}

          <p className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm">{n.bestOption && current ? t.better(current.score, n.bestOption.score) : t.bestNow}</p>

          <div className="grid gap-4 rounded-xl border-2 border-gold/40 bg-gradient-to-br from-gold/10 via-card/70 to-maroon/25 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div><p className="mb-2 font-semibold">{t.locked}</p>
              <ul className="grid gap-1.5 text-sm sm:grid-cols-2">{t.lockedItems.map((x) => <li key={x} className="flex gap-2 text-muted-foreground"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />{x}</li>)}</ul></div>
            <div className="flex flex-col gap-2">
              <a href="#book" className={buttonVariants({ variant: 'gold' })}><Sparkles className="h-4 w-4" />{t.book}{priceText ? ` · ${priceText}` : ''}</a>
              <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello Acharya ji, I checked my signature on myNumerologist.com (${f.name}) and want the full signature analysis.`)}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}><MessageCircle className="h-4 w-4" />{t.wa}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
