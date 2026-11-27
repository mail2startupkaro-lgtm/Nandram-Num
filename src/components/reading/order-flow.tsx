'use client';
import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronLeft, Heart, ImageUp, LogIn, MessageCircle, RefreshCw, ShieldCheck, Sparkles, UserPlus, Users, X } from 'lucide-react';
import { shrink } from '@/lib/client/signature-image';
import { useApp } from '@/components/layout/providers';
import { INDIAN_STATES } from '@/components/wizard/state';
import { Button, buttonVariants } from '@/components/ui/button';
import { ChipGroup, Field, Input, Select } from '@/components/ui/form';
import { DisclaimerNote } from '@/components/legal/disclaimer-note';
import { api, ApiError } from '@/lib/client/api';
import { confirmCashfreeOrder, loadCashfree } from '@/lib/client/cashfree';
import { confirmRazorpayPayment, openRazorpayCheckout } from '@/lib/client/razorpay';
import { useDisplayCurrency } from '@/lib/client/currency';
import { OUTSIDE_INDIA } from '@/lib/billing/currency';
import { todayIST, toIso } from '@/lib/numerology';
import { FAMILY_RELATIONS, type FamilyRelation } from '@/lib/numerology/schemas';
import type { ServiceIntakeField } from '@/lib/db/schema';
import { cleanIntake, intakeToPerson, missingIntake, personToIntake, toIsoDate, type PersonLite } from '@/lib/reading/intake';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, isIndia } from '@/lib/countries';
import type { PublicService } from '@/components/services/book-service';
import { FIELD_LABEL, FLOW, RELATION_LABEL } from './labels';
import { priceOf, SERVICE_ICON, StepBar } from './reading-picker';

type Person = PersonLite & { id: string };
interface Order { gateway: 'cashfree' | 'razorpay' | 'mock'; keyId?: string; mode: string; paymentSessionId: string; mock: boolean; orderId: string; amountPaise: number; currency?: string }
type Step = 'details' | 'account' | 'pay' | 'done';

const WHATSAPP = '918819999374';
const SIG_IMAGE_MAX = 1_400_000; // must match SIGNATURE_IMAGE_MAX on the server

const SIG_T = {
  en: { title: 'Upload your signature (one photo)', hint: 'Sign your normal signature on plain white, unruled paper and take one clear photo from straight above, in good light. JPG, PNG or WEBP.', choose: 'Choose photo', replace: 'Replace photo', remove: 'Remove', only: 'Only one photo can be uploaded – choosing another replaces this one.', optional: 'Optional – if you skip this, send the photo on WhatsApp after payment.', notImage: 'Please choose a JPG, PNG or WEBP image.', tooBig: 'This photo is too large. Please choose a photo under 15 MB.', bad: 'This photo could not be read. Please try another photo (JPG or PNG).', ready: 'Signature photo attached', received: 'Your signature photo has been received with the order.' },
  hi: { title: 'अपना हस्ताक्षर अपलोड करें (एक फ़ोटो)', hint: 'सादे सफ़ेद, बिना लाइन वाले काग़ज़ पर अपना सामान्य हस्ताक्षर करें और अच्छी रोशनी में ठीक ऊपर से एक साफ़ फ़ोटो लें। JPG, PNG या WEBP।', choose: 'फ़ोटो चुनें', replace: 'फ़ोटो बदलें', remove: 'हटाएँ', only: 'केवल एक फ़ोटो अपलोड हो सकती है – दूसरी चुनने पर यह बदल जाएगी।', optional: 'वैकल्पिक – अभी न जोड़ें तो भुगतान के बाद WhatsApp पर फ़ोटो भेजें।', notImage: 'कृपया JPG, PNG या WEBP फ़ोटो चुनें।', tooBig: 'यह फ़ोटो बहुत बड़ी है। कृपया 15 MB से छोटी फ़ोटो चुनें।', bad: 'यह फ़ोटो पढ़ी नहीं जा सकी। कृपया दूसरी फ़ोटो (JPG या PNG) आज़माएँ।', ready: 'हस्ताक्षर की फ़ोटो जुड़ गई', received: 'आपके हस्ताक्षर की फ़ोटो ऑर्डर के साथ मिल गई है।' },
};

/** Single signature photo for a Signature Analysis booking: one image only, downsized in the browser before upload. */
function SignaturePhoto({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const { lang } = useApp();
  const t = SIG_T[lang];
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const input = React.useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = ''; // one file only – any extra selection is ignored
    if (!file) return;
    setErr(null);
    if (!/^image\//.test(file.type)) { setErr(t.notImage); return; }
    if (file.size > 15 * 1024 * 1024) { setErr(t.tooBig); return; }
    setBusy(true);
    try {
      const dataUrl = await shrink(file);
      if (dataUrl.length > SIG_IMAGE_MAX) { setErr(t.tooBig); return; }
      onChange(dataUrl);
    } catch { setErr(t.bad); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-2 rounded-lg border border-gold/40 bg-gold/5 p-3">
      <p className="text-sm font-semibold">{t.title}</p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="sr-only" onChange={onFile} aria-label={t.title} />
      {value ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-start gap-3">
            <img src={value} alt={t.ready} className="max-h-40 max-w-full rounded-md border border-gold/40 bg-white object-contain p-1" />
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-1 text-xs font-medium text-success"><CheckCircle2 className="h-4 w-4" />{t.ready}</p>
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}><RefreshCw className="mr-1 h-4 w-4" />{t.replace}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(null); setErr(null); }}><X className="mr-1 h-4 w-4" />{t.remove}</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t.only}</p>
        </div>
      ) : (
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-gold/40 p-5 text-center text-sm hover:bg-gold/10 disabled:opacity-60">
          <ImageUp className="h-7 w-7 text-gold" aria-hidden />
          <span className="font-semibold">{busy ? '…' : t.choose}</span>
          <span className="text-xs text-muted-foreground">{t.hint}</span>
        </button>
      )}
      {!value && <p className="text-xs text-muted-foreground">{t.optional}</p>}
      {err && <p className="text-xs text-danger" role="alert">{err}</p>}
    </div>
  );
}

/** Steps 2–4 of "Get your reading" for a paid reading: details → account (register / sign in) → payment. */
export function OrderFlow({ code, forId, onChangeReading }: { code: string; forId?: string | null; onChangeReading: () => void }) {
  const { lang, me, refreshMe } = useApp();
  const t = FLOW[lang]; const L = FIELD_LABEL[lang];
  const usd = useDisplayCurrency() === 'USD';
  const [svc, setSvc] = React.useState<PublicService | null | undefined>(undefined);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [pick, setPick] = React.useState<string>('new'); // saved person id or 'new'
  const [relation, setRelation] = React.useState<FamilyRelation>('self');
  const [d, setD] = React.useState<Record<string, string>>({ gender: 'male', country: 'India', maritalStatus: 'married' });
  const [babyName, setBabyName] = React.useState('');
  const [partnerPick, setPartnerPick] = React.useState('');
  const [sigImage, setSigImage] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<Step>('details');
  const [personId, setPersonId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const u = me?.user;

  React.useEffect(() => {
    api<{ services: PublicService[] }>('/api/services').then((r) => setSvc(r.services.find((s) => s.code === code && s.payable) ?? null)).catch(() => setSvc(null));
  }, [code]);

  const loadPeople = React.useCallback(async (): Promise<Person[]> => {
    try { const r = await api<{ people: Person[] }>('/api/people'); setPeople(r.people); return r.people; } catch { return []; }
  }, []);

  function choose(p: Person | null, list = people) {
    const s = svc!; setError(null);
    if (!p) { setPick('new'); setRelation(list.some((x) => x.relation === 'self') ? (s.code === 'SVC_BABY_NAME' ? 'son' : 'spouse') : 'self'); setD({ gender: 'male', country: 'India', maritalStatus: 'married' }); setBabyName(''); setPartnerPick(''); return; }
    setPick(p.id); setRelation(p.relation);
    const spouse = s.intake.includes('partnerName') ? list.find((x) => x.id !== p.id && (x.relation === 'spouse' || (p.relation === 'spouse' && x.relation === 'self'))) : undefined;
    setPartnerPick(spouse?.id ?? '');
    setD((prev) => ({ gender: 'male', country: p.country || 'India', maritalStatus: prev.maritalStatus || 'married', ...personToIntake(s.code, s.intake, p, spouse ?? null) }));
    if (s.code === 'SVC_BABY_NAME') setBabyName(p.fullName);
  }

  // Signed-in customers start from their saved people ("self" pre-selected, or the first person).
  React.useEffect(() => {
    if (!u || !svc) return;
    loadPeople().then((list) => {
      if (!list.length || personId) return;
      const wanted = forId ? list.find((p) => p.id === forId) : undefined;
      const first = wanted ?? list.find((p) => p.relation === 'self') ?? list[0];
      if (wanted || svc.code !== 'SVC_BABY_NAME') choose(first, list);
    });
  }, [u?.id, svc?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  if (svc === undefined || me === null) return <div className="container max-w-3xl py-12"><div className="h-64 animate-pulse rounded-xl bg-muted/40" aria-busy="true" /></div>;
  if (!svc) return <div className="container max-w-xl py-16 text-center"><p className="mb-4 text-muted-foreground">{t.notFound}</p><Button variant="gold" onClick={onChangeReading}>{t.change}</Button></div>;

  const text = svc[lang];
  const Icon = SERVICE_ICON[svc.code] ?? Sparkles;
  const price = priceOf(svc, usd);
  const fields = svc.intake;
  const has = (k: ServiceIntakeField) => fields.includes(k);
  const sig = svc.code === 'SVC_SIGNATURE';
  const baby = svc.code === 'SVC_BABY_NAME';
  const bizFull = svc.code === 'SVC_BUSINESS_COMPLETE';
  const label = (k: ServiceIntakeField) => (bizFull && k === 'mobile' ? L.mobileBiz : bizFull && k === 'businesses' ? L.bizType : sig && k === 'currentName' ? L.signedAs : sig && k === 'questions' ? L.sigQuestions : k === 'dob' && has('parents') ? L.dobBaby : k === 'mobile' && svc.code === 'SVC_MOBILE_NUMBER' ? L.mobileMain : k === 'currentName' && svc.code === 'SVC_BUSINESS_NAME' ? L.business : k === 'questions' && has('businesses') ? L.bizQuestions : L[k]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD((x) => ({ ...x, [k]: e.target.value }));
  const spouseCandidates = people.filter((p) => p.id !== pick);

  function choosePartner(id: string) {
    setPartnerPick(id);
    const p = people.find((x) => x.id === id);
    setD((x) => ({ ...x, partnerName: p?.fullName ?? '', partnerDob: toIsoDate(p?.dob) }));
  }

  const missing = missingIntake(fields, d).length > 0 || (baby && !babyName.trim() && !d.clientName);

  /** Saves the person (new or existing) to the account – details are always kept for later readings. */
  async function savePerson(list: Person[]): Promise<string | null> {
    const base = pick !== 'new' ? list.find((p) => p.id === pick) : undefined;
    const p = intakeToPerson(svc!.code, d, relation, base ?? {}, baby ? babyName || 'Baby' : undefined);
    if (!p) return null;
    const same = !base ? list.find((x) => x.fullName.toLowerCase().replace(/[^a-z]/g, '') === p.fullName.toLowerCase().replace(/[^a-z]/g, '') && toIsoDate(x.dob) === p.dob) : undefined;
    const target = base ?? same;
    const { id: _id, ...body } = { ...(target ?? {}), ...p } as Person & { updatedAt?: string };
    delete (body as { updatedAt?: string }).updatedAt;
    const clean = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined && v !== ''));
    const r = target
      ? await api<{ person: Person }>(`/api/people/${target.id}`, { method: 'PATCH', json: clean })
      : await api<{ person: Person }>('/api/people', { method: 'POST', json: clean });
    // A partner typed in for a couple reading is also kept in the family list (as spouse of the account holder).
    if (p.partner && !partnerPick && relation === 'self') {
      const norm = (x: string) => x.toLowerCase().replace(/[^a-z]/g, '');
      const known = list.some((x) => norm(x.fullName) === norm(p.partner!.name) && toIsoDate(x.dob) === p.partner!.dob);
      if (!known) await api('/api/people', { method: 'POST', json: { relation: 'spouse', fullName: p.partner.name, gender: p.partner.gender, dob: p.partner.dob } }).catch(() => null);
    }
    return r.person.id;
  }

  async function continueFromDetails() {
    setError(null);
    if (!u) { setStep('account'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setBusy(true);
    try { setPersonId(await savePerson(people)); setStep('pay'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { setError(e instanceof ApiError && e.body.error === 'FAMILY_LIMIT' ? t.limit : t.personErr); }
    finally { setBusy(false); }
  }

  async function afterAuth() {
    await refreshMe();
    const list = await loadPeople();
    try { setPersonId(await savePerson(list)); setStep('pay'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { setError(e instanceof ApiError && e.body.error === 'FAMILY_LIMIT' ? t.limit : t.personErr); setStep('details'); }
  }

  const stepNo = step === 'details' ? 1 : step === 'account' ? 2 : 3;
  const forName = baby ? (babyName || d.clientName || 'Baby') : (d.clientName || (sig || svc.code === 'SVC_BUSINESS_NAME' ? '' : d.currentName) || '');

  return (
    <div className="container max-w-3xl py-8 sm:py-12">
      <StepBar step={step === 'done' ? 4 : stepNo} skipAccount={!!u && step !== 'account'} />
      <div className="glass mt-6 flex items-start gap-3 rounded-xl border border-gold/40 p-4">
        <Icon className="mt-0.5 h-7 w-7 shrink-0 text-gold" aria-hidden />
        <div className="min-w-0 flex-1"><h1 className="font-serif text-xl font-semibold leading-snug">{text.name}</h1><p className="text-xs text-muted-foreground">{text.delivery}</p></div>
        <div className="text-right">{price && <><p className="font-serif text-xl font-bold text-gold">{price.fee}</p>{price.mrp && <s className="text-xs text-muted-foreground">{price.mrp}</s>}</>}
          {step !== 'done' && <button type="button" onClick={onChangeReading} className="block text-xs text-gold underline-offset-2 hover:underline">{t.change}</button>}</div>
      </div>

      {step === 'details' && (
        <section className="glass mt-4 space-y-5 rounded-xl p-5 sm:p-6" aria-labelledby="det-h">
          {u && people.length > 0 && (
            <fieldset><legend className="mb-2 text-sm font-semibold">{t.forWho}</legend>
              <div className="flex flex-wrap gap-2">
                {people.map((p) => <button key={p.id} type="button" onClick={() => choose(p)} aria-pressed={pick === p.id} className={`rounded-full border px-3 py-1.5 text-sm ${pick === p.id ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:border-gold/60'}`}>{p.fullName} <span className="text-xs text-muted-foreground">· {RELATION_LABEL[p.relation][lang]}</span></button>)}
                <button type="button" onClick={() => choose(null)} aria-pressed={pick === 'new'} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${pick === 'new' ? 'border-gold bg-gold/20 font-semibold' : 'border-dashed border-border hover:border-gold/60'}`}><UserPlus className="h-4 w-4" />{t.someoneNew}</button>
              </div>
            </fieldset>
          )}
          <fieldset className="space-y-3"><legend id="det-h" className="mb-1 text-sm font-semibold">{t.detailsTitle}</legend>
            <Field label={t.relation} htmlFor="of-rel"><Select id="of-rel" value={relation} onChange={(e) => setRelation(e.target.value as FamilyRelation)}>{FAMILY_RELATIONS.map((r) => <option key={r} value={r}>{RELATION_LABEL[r][lang]}</option>)}</Select></Field>
            {baby && <Field label={t.babyName} htmlFor="of-baby"><Input id="of-baby" value={babyName} onChange={(e) => setBabyName(e.target.value)} maxLength={120} placeholder="Baby" /></Field>}
            {has('currentName') && <Field label={label('currentName')} htmlFor="of-cn" required><Input id="of-cn" value={d.currentName ?? ''} onChange={set('currentName')} maxLength={sig ? 120 : 300} /></Field>}
            {has('clientName') && <Field label={L.clientName} htmlFor="of-name" required><Input id="of-name" value={d.clientName ?? ''} onChange={set('clientName')} maxLength={120} autoComplete="name" /></Field>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={lang === 'hi' ? 'देश' : 'Country'} htmlFor="of-country">
                <Select id="of-country" value={d.country || 'India'} onChange={(e) => setD((x) => ({ ...x, country: e.target.value }))}>
                  <optgroup label={lang === 'hi' ? 'प्रमुख देश' : 'Popular Countries'}>
                    {POPULAR_COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </optgroup>
                  <optgroup label={lang === 'hi' ? 'सभी देश' : 'All Countries'}>
                    {ALL_COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </optgroup>
                </Select>
              </Field>
              {has('dob') && <Field label={label('dob')} htmlFor="of-dob" required><Input id="of-dob" type="date" min="1900-01-01" max={toIso(todayIST())} value={d.dob ?? ''} onChange={set('dob')} /></Field>}
              {has('gender') && <Field label={L.gender}><ChipGroup options={[{ value: 'male', label: L.male }, { value: 'female', label: L.female }]} value={[d.gender ?? 'male']} onChange={(v) => setD((x) => ({ ...x, gender: v[0] ?? 'male' }))} /></Field>}
              {has('maritalStatus') && (
                <Field label={L.maritalStatus} htmlFor="of-ms">
                  <Select id="of-ms" value={d.maritalStatus || 'married'} onChange={(e) => setD((x) => ({ ...x, maritalStatus: e.target.value }))}>
                    <option value="married">{lang === 'hi' ? 'विवाहित (Married)' : 'Married'}</option>
                    <option value="single">{lang === 'hi' ? 'अविवाहित (Single / Unmarried)' : 'Single / Unmarried'}</option>
                    <option value="relationship">{lang === 'hi' ? 'रिश्ते में / सगाई (In Relationship / Engaged)' : 'In Relationship / Engaged'}</option>
                    <option value="divorced">{lang === 'hi' ? 'तलाकशुदा / अलग (Divorced / Separated)' : 'Divorced / Separated'}</option>
                    <option value="widowed">{lang === 'hi' ? 'विधवा / विधुर (Widowed)' : 'Widowed'}</option>
                  </Select>
                </Field>
              )}
              {has('tob') && <Field label={L.tob} htmlFor="of-tob"><Input id="of-tob" type="time" value={d.tob ?? ''} onChange={set('tob')} /></Field>}
              {has('pob') && <Field label={label('pob')} htmlFor="of-pob" required={svc.code === 'SVC_PERSONAL_REPORT'}><Input id="of-pob" placeholder={!isIndia(d.country) ? (lang === 'hi' ? 'जैसे: New York, London, Dubai' : 'e.g. New York, London, Dubai') : (lang === 'hi' ? 'जैसे: Jaipur, Delhi, Mumbai' : 'e.g. Jaipur, Delhi, Mumbai')} value={d.pob ?? ''} onChange={set('pob')} maxLength={120} /></Field>}
              {has('mobile') && <Field label={label('mobile')} htmlFor="of-mob"><Input id="of-mob" type="tel" inputMode="tel" placeholder={!isIndia(d.country) ? '+1 555 123 4567' : '98765 43210'} value={d.mobile ?? ''} onChange={set('mobile')} maxLength={25} /></Field>}
              {has('letters') && <Field label={L.letters} htmlFor="of-let"><Input id="of-let" value={d.letters ?? ''} onChange={set('letters')} maxLength={60} /></Field>}
            </div>
            {has('partnerName') && (!has('maritalStatus') || d.maritalStatus === 'married' || d.maritalStatus === 'relationship') && (
              <div className="space-y-3 rounded-lg border border-gold/40 bg-gold/5 p-3.5">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-gold" />
                  {lang === 'hi' ? 'जीवनसाथी / पार्टनर का विवरण (Spouse / Partner Details)' : 'Spouse / Partner Details'}
                </p>
                {spouseCandidates.length > 0 && <Field label={t.partnerPick} htmlFor="of-pp"><Select id="of-pp" value={partnerPick} onChange={(e) => choosePartner(e.target.value)}><option value="">{t.partnerTyped}</option>{spouseCandidates.map((p) => <option key={p.id} value={p.id}>{p.fullName} · {RELATION_LABEL[p.relation][lang]}</option>)}</Select></Field>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={L.partnerName} htmlFor="of-pn" required>
                    <Input id="of-pn" placeholder={lang === 'hi' ? 'जीवनसाथी का पूरा नाम' : "Spouse's full name"} value={d.partnerName ?? ''} onChange={set('partnerName')} maxLength={120} />
                  </Field>
                  {has('partnerDob') && (
                    <Field label={L.partnerDob} htmlFor="of-pd" required>
                      <Input id="of-pd" type="date" min="1900-01-01" max={toIso(todayIST())} value={d.partnerDob ?? ''} onChange={set('partnerDob')} />
                    </Field>
                  )}
                </div>
              </div>
            )}
            {has('parents') && <Field label={L.parents} htmlFor="of-par"><Input id="of-par" value={d.parents ?? ''} onChange={set('parents')} maxLength={200} /></Field>}
            {has('businessName') && <Field label={L.businessName} htmlFor="of-bn" required hint={lang === 'hi' ? 'अंग्रेज़ी अक्षरों में, जैसे: Sharma Interiors' : 'In English letters, e.g. Sharma Interiors'}><textarea id="of-bn" rows={3} maxLength={400} value={d.businessName ?? ''} onChange={set('businessName')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></Field>}
            {has('launchDate') && <Field label={L.launchDate} htmlFor="of-ld"><Input id="of-ld" type="date" min="1900-01-01" max="2045-12-31" value={d.launchDate ?? ''} onChange={set('launchDate')} /></Field>}
            {has('partners') && <Field label={L.partners} htmlFor="of-pt" hint={lang === 'hi' ? 'जैसे: Arjun Mehta – 03-01-1990' : 'e.g. Arjun Mehta – 03-01-1990'}><textarea id="of-pt" rows={2} maxLength={800} value={d.partners ?? ''} onChange={set('partners')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></Field>}
            {has('brand') && <Field label={L.brand} htmlFor="of-br"><Input id="of-br" value={d.brand ?? ''} onChange={set('brand')} maxLength={400} /></Field>}
            {has('businesses') && <Field label={label('businesses')} htmlFor="of-biz" hint={lang === 'hi' ? 'जैसे: कैफ़े, कपड़े की दुकान, CA प्रैक्टिस' : 'e.g. café, clothing store, CA practice'}><Input id="of-biz" value={d.businesses ?? ''} onChange={set('businesses')} maxLength={600} /></Field>}
            {sig && <SignaturePhoto value={sigImage} onChange={setSigImage} />}
            {has('challenges') && (
              <Field label={L.challenges} htmlFor="of-ch" hint={L.challengesHint}>
                <textarea
                  id="of-ch"
                  rows={3}
                  maxLength={2500}
                  placeholder={lang === 'hi' ? 'जैसे: करियर में तरक्की नहीं हो रही, व्यापार में धन हानि, विवाह में देरी या कलह, स्वास्थ्य संबंधी कष्ट…' : 'e.g. Career stagnation, loss in business, marriage delays or discord, health issues, recurring financial loss…'}
                  value={d.challenges ?? ''}
                  onChange={set('challenges')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </Field>
            )}
            {has('questions') && (
              <Field
                label={label('questions')}
                htmlFor="of-q"
                hint={svc.code === 'SVC_PERSONAL_REPORT' ? (lang === 'hi' ? 'आचार्य नंदराम से व्यक्तिगत उत्तर हेतु अपने 3 मुख्य प्रश्न यहाँ लिखें' : 'Write up to 3 specific questions for Acharya Nandram to answer in your personal reading') : undefined}
              >
                <textarea
                  id="of-q"
                  rows={3}
                  maxLength={2000}
                  placeholder={svc.code === 'SVC_PERSONAL_REPORT' ? (lang === 'hi' ? '1. मेरे लिए कौन सा करियर या व्यवसाय सबसे अनुकूल रहेगा?\n2. मेरी पदोन्नति या विवाह की शुभ अवधि कब है?\n3. धन लाभ व रुकावटों को दूर करने के लिए कौन सा रत्न या उपाय करें?' : '1. Which career or business field will bring maximum success?\n2. What is the most auspicious period for marriage or promotion?\n3. Which gemstone or remedy will remove current obstacles?') : undefined}
                  value={d.questions ?? ''}
                  onChange={set('questions')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </Field>
            )}
          </fieldset>
          <p className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-gold" />{t.savedNote}</p>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <div className="flex justify-between gap-3"><Button variant="ghost" onClick={onChangeReading}><ChevronLeft className="h-4 w-4" />{t.back}</Button><Button variant="gold" size="lg" disabled={!!missing || busy} onClick={continueFromDetails}>{busy ? t.loading : t.next}</Button></div>
        </section>
      )}

      {step === 'account' && <AccountStep prefill={{ name: relation === 'self' ? forName : '', mobile: relation === 'self' ? d.mobile ?? '' : '' }} onBack={() => setStep('details')} onDone={afterAuth} />}

      {step === 'pay' && u && <PayStep svc={svc} details={d} forName={forName} relation={relation} personId={personId} onBack={() => setStep('details')} onDone={() => setStep('done')} sig={sig} signatureImage={sig ? sigImage : null} />}

      {step === 'done' && (
        <section className="glass mt-4 space-y-4 rounded-xl p-6 text-center" role="status">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <p className="text-xl font-semibold">{t.ok}</p>
          <p className="text-sm text-muted-foreground">{t.okText}</p>
          
          {/* Order / Report Status Queue Box */}
          <div className="mx-auto max-w-md rounded-lg border border-gold/40 bg-gold/5 p-4 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="uppercase tracking-wider text-gold">{lang === 'hi' ? 'ऑर्डर व रिपोर्ट स्थिति' : 'Order & Report Status'}</span>
              <span className="rounded bg-gold/20 px-2 py-0.5 text-gold">{lang === 'hi' ? 'क्रम में (In queue)' : 'In queue'}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lang === 'hi'
                ? 'आपका ऑर्डर आचार्य नंदराम के डिलीवरी क्रम में दर्ज हो गया है। आप इसकी प्रगति अपने खाते या प्रोफाइल में देख सकते हैं।'
                : 'Your order is recorded in the preparation queue. You can track progress and status under your Account.'}
            </p>
          </div>

          {sig && sigImage && <p className="text-sm text-success">{SIG_T[lang].received}</p>}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {sig && !sigImage && <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lang === 'hi' ? `नमस्ते, मैंने हस्ताक्षर विश्लेषण बुक किया है (${forName})। मेरे हस्ताक्षर की फ़ोटो भेज रहा/रही हूँ।` : `Hello, I have booked Signature Analysis (${forName}). Sending my signature photos.`)}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}><MessageCircle className="h-4 w-4" />{t.sigPhotos}</a>}
            <Link href="/account" className={buttonVariants({ variant: 'gold' })}>{t.account}</Link>
            <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>{lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</Link>
            <Link href="/reading" onClick={onChangeReading} className={buttonVariants({ variant: 'outline' })}>{t.another}</Link>
            <Link href="/account#family" className={buttonVariants({ variant: 'ghost' })}><Users className="h-4 w-4" />{t.family}</Link>
          </div>
        </section>
      )}
    </div>
  );
}

/** Register (or sign in) before payment, so the client's details are saved on their own account. */
function AccountStep({ prefill, onBack, onDone }: { prefill: { name: string; mobile: string }; onBack: () => void; onDone: () => Promise<void> }) {
  const { lang, t: dict } = useApp();
  const t = FLOW[lang];
  const [mode, setMode] = React.useState<'up' | 'in'>('up');
  const [f, setF] = React.useState({ name: prefill.name, email: '', mobile: prefill.mobile, password: '', confirm: '', identifier: '' });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const errText = (e: unknown) => (e instanceof ApiError ? dict.auth.errors[e.body.error ?? ''] ?? e.message : dict.auth.errors.INTERNAL);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault(); setError(null);
    if (mode === 'up' && f.password !== f.confirm) { setError(dict.auth.errors.PASSWORD_MISMATCH); return; }
    if (mode === 'up' && f.password.length < 8) { setError(dict.auth.errors.WEAK_PASSWORD); return; }
    setBusy(true);
    try {
      if (mode === 'up') await api('/api/auth/signup', { method: 'POST', json: { name: f.name.trim(), email: f.email.trim(), mobile: f.mobile.trim(), password: f.password } });
      else await api('/api/auth/login', { method: 'POST', json: { identifier: f.identifier.trim(), password: f.password } });
      await onDone();
    } catch (e) { setError(errText(e)); } finally { setBusy(false); }
  }

  return (
    <section className="glass mt-4 rounded-xl p-5 sm:p-6" aria-labelledby="acc-h">
      <h2 id="acc-h" className="font-serif text-xl font-semibold">{t.accountTitle}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t.accountSub}</p>
      <a
        href="/api/auth/google?next=/reading"
        className="mb-4 flex h-11 w-full items-center justify-center gap-3 rounded-md border border-border bg-white text-sm font-medium text-[#1f1f1f] shadow-sm hover:bg-gray-50 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
        </svg>
        {dict.auth.google}
      </a>
      <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {dict.auth.or}
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'up'} onClick={() => { setMode('up'); setError(null); }} className={`rounded-md border px-3 py-2 text-sm ${mode === 'up' ? 'border-gold bg-gold/20 font-semibold' : 'border-border'}`}><UserPlus className="mr-1 inline h-4 w-4" />{t.signUp}</button>
        <button type="button" role="tab" aria-selected={mode === 'in'} onClick={() => { setMode('in'); setError(null); }} className={`rounded-md border px-3 py-2 text-sm ${mode === 'in' ? 'border-gold bg-gold/20 font-semibold' : 'border-border'}`}><LogIn className="mr-1 inline h-4 w-4" />{t.signIn}</button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'up' ? (<>
          <Field label={t.name} htmlFor="ac-name" required><Input id="ac-name" value={f.name} onChange={set('name')} autoComplete="name" maxLength={120} required /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.email} htmlFor="ac-email" required><Input id="ac-email" type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></Field>
            <Field label={t.mobile} htmlFor="ac-mob" required><Input id="ac-mob" type="tel" inputMode="tel" value={f.mobile} onChange={set('mobile')} autoComplete="tel" placeholder="98765 43210" required /></Field>
            <Field label={t.password} htmlFor="ac-pw" required><Input id="ac-pw" type="password" value={f.password} onChange={set('password')} autoComplete="new-password" minLength={8} required /></Field>
            <Field label={t.confirm} htmlFor="ac-pw2" required><Input id="ac-pw2" type="password" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" minLength={8} required /></Field>
          </div>
        </>) : (<>
          <Field label={t.identifier} htmlFor="ac-id" required><Input id="ac-id" value={f.identifier} onChange={set('identifier')} autoComplete="username" required /></Field>
          <Field label={dict.auth.password} htmlFor="ac-pw" required><Input id="ac-pw" type="password" value={f.password} onChange={set('password')} autoComplete="current-password" required /></Field>
          <p className="text-xs"><Link href="/login?next=/reading" className="text-gold underline">{lang === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot password?'}</Link></p>
        </>)}
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <div className="flex justify-between gap-3"><Button type="button" variant="ghost" onClick={onBack}><ChevronLeft className="h-4 w-4" />{t.back}</Button><Button type="submit" variant="gold" size="lg" disabled={busy}>{busy ? t.loading : mode === 'up' ? t.createAndContinue : t.signInAndContinue}</Button></div>
      </form>
    </section>
  );
}

function PayStep({ svc, details, forName, relation, personId, onBack, onDone, sig, signatureImage }: { svc: PublicService; details: Record<string, string>; forName: string; relation: FamilyRelation; personId: string | null; onBack: () => void; onDone: () => void; sig: boolean; signatureImage?: string | null }) {
  const { lang, me, t: dict } = useApp();
  const t = FLOW[lang]; const L = FIELD_LABEL[lang];
  const u = me!.user!;
  const usd = useDisplayCurrency() === 'USD' && !!svc.usdCents;
  const isForeign = !!(details.country && !isIndia(details.country));
  const price = priceOf(svc, usd);
  const [bill, setBill] = React.useState({ name: u.name ?? '', phone: (u.phone ?? '').replace(/^\+91/, ''), state: u.billingState ?? ((usd || isForeign) ? OUTSIDE_INDIA : ''), gstin: '' });
  const abroad = usd || isForeign || bill.state === OUTSIDE_INDIA;
  const [busy, setBusy] = React.useState(false);
  const [stage, setStage] = React.useState<'form' | 'confirming' | 'fail'>('form');
  const [order, setOrder] = React.useState<Order | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const missing = !bill.state || (!u.phone && !bill.phone.trim());
  const shown = cleanIntake(svc.intake, details);
  const lab = (k: string) => (k === 'country' ? (lang === 'hi' ? 'देश' : 'Country') : k === 'mobile' && svc.code === 'SVC_BUSINESS_COMPLETE' ? L.mobileBiz : k === 'businesses' && svc.code === 'SVC_BUSINESS_COMPLETE' ? L.bizType : k === 'currentName' && sig ? L.signedAs : k === 'currentName' && svc.code === 'SVC_BUSINESS_NAME' ? L.business : k === 'dob' && svc.intake.includes('parents') ? L.dobBaby : (L as Record<string, string>)[k] ?? k).replace(/ \((optional|वैकल्पिक)\)$/, '');
  const show = (k: string, v: string) => (k === 'gender' ? (v === 'female' ? L.female : L.male) : /Dob$|^dob$/.test(k) ? v.split('-').reverse().join('-') : v);

  async function pay() {
    setBusy(true); setError(null);
    try {
      const o = await api<Order>('/api/billing/checkout', { method: 'POST', json: { planCode: svc.code, intake: shown, profileId: personId ?? undefined, billingState: bill.state, billingName: bill.name || undefined, phone: bill.phone || undefined, gstin: abroad ? undefined : bill.gstin || undefined, signatureImage: signatureImage || undefined } });
      setOrder(o);
      if (o.gateway === 'razorpay') {
        try {
          const resp = await openRazorpayCheckout({
            key: o.keyId || '',
            amount: o.amountPaise,
            currency: o.currency || (usd ? 'USD' : 'INR'),
            name: 'myNumerologist',
            description: svc.en.name,
            order_id: o.orderId,
            prefill: {
              name: bill.name || u.name || '',
              email: u.email || '',
              contact: bill.phone || u.phone || '',
            },
            theme: { color: '#d4af37' },
          });
          setStage('confirming');
          const st = await confirmRazorpayPayment(resp);
          if (st === 'paid') onDone();
          else setStage(st === 'failed' ? 'fail' : 'confirming');
        } catch (err: unknown) {
          if ((err as Error)?.message !== 'PAYMENT_CANCELLED') {
            setError(lang === 'hi' ? 'भुगतान पूरा नहीं हुआ।' : 'Payment could not be completed.');
          }
        }
        setBusy(false);
        return;
      }
      if (o.gateway === 'cashfree') {
        const Cashfree = await loadCashfree();
        const r = await Cashfree({ mode: o.mode === 'production' ? 'production' : 'sandbox' }).checkout({ paymentSessionId: o.paymentSessionId, redirectTarget: '_modal' });
        if (r.redirect) return;
        setStage('confirming');
        const st = await confirmCashfreeOrder(o.orderId);
        if (st === 'paid') onDone(); else setStage(st === 'failed' || r.error ? 'fail' : 'confirming');
      }
    } catch (e) {
      const code = e instanceof ApiError ? e.body.error ?? '' : '';
      setError(code === 'PERSON_NOT_FOUND' ? t.personNotFound : code === 'LOGIN_REQUIRED' ? t.loginRequired : e instanceof ApiError ? (dict.pricing.errors[code] ?? e.message) : dict.err.server);
    } finally { setBusy(false); }
  }

  if (stage === 'confirming') return <p className="glass mt-4 rounded-xl p-6 text-center text-sm" role="status">{t.confirming}</p>;
  return (
    <section className="glass mt-4 space-y-4 rounded-xl p-5 sm:p-6" aria-labelledby="pay-h">
      <h2 id="pay-h" className="font-serif text-xl font-semibold">{t.payTitle}</h2>
      <div className="rounded-lg border border-border/60 p-3 text-sm">
        <div className="mb-2 flex items-center justify-between gap-2"><p><span className="text-muted-foreground">{t.readingFor}:</span> <b>{forName || '—'}</b> <span className="text-xs text-muted-foreground">· {RELATION_LABEL[relation][lang]}</span></p><button type="button" onClick={onBack} className="text-xs text-gold underline-offset-2 hover:underline">{t.change2}</button></div>
        <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">{Object.entries(shown).filter(([k]) => k !== 'clientName').map(([k, v]) => <div key={k} className={['questions', 'businesses', 'businessName', 'partners', 'brand'].includes(k) ? 'sm:col-span-2' : ''}><dt className="inline text-muted-foreground">{lab(k)}: </dt><dd className="inline whitespace-pre-wrap break-words">{show(k, v)}</dd></div>)}</dl>
        {sig && signatureImage && <div className="mt-2 flex items-center gap-2"><img src={signatureImage} alt="" className="h-12 rounded border border-gold/40 bg-white p-0.5" /><span className="text-xs text-success">{SIG_T[lang].ready}</span></div>}
      </div>
      <p className="text-xs text-muted-foreground">{t.signedInAs} <b>{u.name ?? u.email ?? u.phone}</b></p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.billName} htmlFor="py-bn"><Input id="py-bn" value={bill.name} onChange={(e) => setBill({ ...bill, name: e.target.value })} maxLength={120} /></Field>
        {!u.phone && <Field label={t.phone} htmlFor="py-ph" required><Input id="py-ph" type="tel" inputMode="tel" autoComplete="tel" placeholder={abroad ? '+1 555 123 4567' : '98765 43210'} value={bill.phone} onChange={(e) => setBill({ ...bill, phone: e.target.value })} maxLength={18} /></Field>}
        <Field label={t.state} htmlFor="py-st" required><Select id="py-st" value={bill.state} onChange={(e) => setBill({ ...bill, state: e.target.value })}><option value="">{t.select}</option><option value={OUTSIDE_INDIA}>{t.outside}</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
      </div>
      <div className="flex items-center justify-between rounded-md bg-muted p-3 text-sm font-semibold"><span>{usd ? t.totalIntl : t.total}</span><span className="text-right">{price?.mrp && <s className="mr-2 font-normal text-muted-foreground">{price.mrp}</s>}{price?.fee}</span></div>
      <DisclaimerNote agree />
      {order?.mock ? (
        <div className="space-y-2 rounded-md border border-warning/40 bg-warning/10 p-3"><p className="text-xs">{t.mock}</p>
          <Button variant="gold" className="w-full" onClick={async () => { try { await api('/api/billing/mock-pay', { method: 'POST', json: { orderId: order.orderId } }); onDone(); } catch { setStage('fail'); } }}>{t.simulate}</Button></div>
      ) : (
        <Button variant="gold" size="lg" className="w-full" disabled={busy || missing} onClick={pay}>{busy ? t.paying : t.pay(price?.fee ?? '')}</Button>
      )}
      {stage === 'fail' && <p className="text-sm text-danger" role="alert">{t.failed}</p>}
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      <Button variant="ghost" onClick={onBack}><ChevronLeft className="h-4 w-4" />{t.back}</Button>
    </section>
  );
}
