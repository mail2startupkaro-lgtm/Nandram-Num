'use client';
import * as React from 'react';
import Link from 'next/link';
import { Pencil, Sparkles, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button, buttonVariants } from '@/components/ui/button';
import { ChipGroup, Field, Input, Select } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';
import { todayIST, toIso } from '@/lib/numerology';
import { FAMILY_RELATIONS, type FamilyRelation } from '@/lib/numerology/schemas';
import { toIsoDate, type PersonLite } from '@/lib/reading/intake';
import { RELATION_LABEL } from '@/components/reading/labels';

type Person = PersonLite & { id: string };
interface Form { relation: FamilyRelation; fullName: string; gender: 'male' | 'female' | 'other'; dob: string; timeOfBirth: string; placeOfBirth: string; mobile: string; signedName: string }
const EMPTY: Form = { relation: 'spouse', fullName: '', gender: 'male', dob: '', timeOfBirth: '', placeOfBirth: '', mobile: '', signedName: '' };

const T = {
  en: { title: 'My family', sub: 'People saved on your account – you and your family members. Their details are filled in automatically when you book a reading for them.', add: 'Add family member', edit: 'Edit', del: 'Remove', save: 'Save', cancel: 'Cancel', reading: 'Get a reading', none: 'No one saved yet. Your details are saved automatically when you book your first reading, or add them here.', relation: 'Relation', name: 'Full name (English letters)', gender: 'Gender', male: 'Male', female: 'Female', dob: 'Date of birth', tob: 'Time of birth (optional)', pob: 'Place of birth (optional)', mobile: 'Mobile number (optional)', signed: 'Name as signed (optional)', confirm: (n: string) => `Remove ${n}? Their saved readings will be deleted too. Paid orders are kept.`, err: 'Could not save. Please write the name in English letters (A–Z) and check the date of birth.', limit: 'You have reached the limit of saved people.', born: 'Born' },
  hi: { title: 'मेरा परिवार', sub: 'आपके खाते में सहेजे गए लोग – आप और आपके परिवार के सदस्य। उनके लिए रीडिंग बुक करते समय उनका विवरण अपने आप भर जाता है।', add: 'परिवार का सदस्य जोड़ें', edit: 'बदलें', del: 'हटाएं', save: 'सहेजें', cancel: 'रद्द करें', reading: 'रीडिंग लें', none: 'अभी कोई सहेजा नहीं गया। पहली रीडिंग बुक करने पर आपका विवरण अपने आप सहेज लिया जाता है, या यहाँ जोड़ें।', relation: 'संबंध', name: 'पूरा नाम (अंग्रेज़ी अक्षरों में)', gender: 'लिंग', male: 'पुरुष', female: 'महिला', dob: 'जन्म तिथि', tob: 'जन्म समय (वैकल्पिक)', pob: 'जन्म स्थान (वैकल्पिक)', mobile: 'मोबाइल नंबर (वैकल्पिक)', signed: 'हस्ताक्षर में नाम (वैकल्पिक)', confirm: (n: string) => `${n} को हटाएं? उनकी सहेजी गई रीडिंग भी हट जाएंगी। भुगतान किए गए ऑर्डर बने रहेंगे।`, err: 'सहेजा नहीं जा सका। कृपया नाम अंग्रेज़ी अक्षरों (A–Z) में लिखें और जन्म तिथि जाँचें।', limit: 'सहेजे गए व्यक्तियों की सीमा पूरी हो गई।', born: 'जन्म' },
};

/** "My family" on My account: the customer and family members whose details are kept for readings. */
export function FamilyPanel() {
  const { lang } = useApp();
  const t = T[lang];
  const [people, setPeople] = React.useState<Person[] | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null); // id, 'new' or null
  const [f, setF] = React.useState<Form>(EMPTY);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const load = () => api<{ people: Person[] }>('/api/people').then((r) => setPeople(r.people)).catch(() => setPeople([]));
  React.useEffect(() => { load(); }, []);

  function open(p: Person | null) {
    setError(null);
    if (!p) { setF({ ...EMPTY, relation: people?.some((x) => x.relation === 'self') ? 'spouse' : 'self' }); setEditing('new'); return; }
    setF({ relation: p.relation, fullName: p.fullName, gender: p.gender, dob: toIsoDate(p.dob), timeOfBirth: p.timeOfBirth ?? '', placeOfBirth: p.placeOfBirth ?? '', mobile: p.mobile ?? '', signedName: p.signedName ?? '' });
    setEditing(p.id);
  }
  async function save() {
    setBusy(true); setError(null);
    const body = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
    try {
      if (editing === 'new') await api('/api/people', { method: 'POST', json: body });
      else await api(`/api/people/${editing}`, { method: 'PATCH', json: body });
      setEditing(null); await load();
    } catch (e) { setError(e instanceof ApiError && e.body.error === 'FAMILY_LIMIT' ? t.limit : t.err); }
    finally { setBusy(false); }
  }
  async function remove(p: Person) {
    if (!window.confirm(t.confirm(p.fullName))) return;
    try { await api(`/api/people/${p.id}`, { method: 'DELETE' }); await load(); } catch { setError(t.err); }
  }
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const ok = /[A-Za-z]{2}/.test(f.fullName) && !!f.dob;

  return (
    <section id="family" className="glass scroll-mt-24 rounded-lg p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-xl font-semibold"><Users className="h-5 w-5 text-gold" />{t.title}</h2>
        {editing === null && <Button size="sm" variant="gold" onClick={() => open(null)}><UserPlus className="h-4 w-4" />{t.add}</Button>}</div>
      <p className="mb-4 text-sm text-muted-foreground">{t.sub}</p>
      {editing !== null && (
        <div className="mb-4 space-y-3 rounded-lg border border-gold/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.relation} htmlFor="fm-rel"><Select id="fm-rel" value={f.relation} onChange={set('relation')}>{FAMILY_RELATIONS.map((r) => <option key={r} value={r}>{RELATION_LABEL[r][lang]}</option>)}</Select></Field>
            <Field label={t.name} htmlFor="fm-name" required><Input id="fm-name" value={f.fullName} onChange={set('fullName')} maxLength={120} /></Field>
            <Field label={t.dob} htmlFor="fm-dob" required><Input id="fm-dob" type="date" min="1900-01-01" max={toIso(todayIST())} value={f.dob} onChange={set('dob')} /></Field>
            <Field label={t.gender}><ChipGroup options={[{ value: 'male', label: t.male }, { value: 'female', label: t.female }]} value={[f.gender]} onChange={(v) => setF({ ...f, gender: (v[0] as Form['gender']) ?? 'male' })} /></Field>
            <Field label={t.tob} htmlFor="fm-tob"><Input id="fm-tob" type="time" value={f.timeOfBirth} onChange={set('timeOfBirth')} /></Field>
            <Field label={t.pob} htmlFor="fm-pob"><Input id="fm-pob" value={f.placeOfBirth} onChange={set('placeOfBirth')} maxLength={120} /></Field>
            <Field label={t.mobile} htmlFor="fm-mob"><Input id="fm-mob" type="tel" inputMode="tel" value={f.mobile} onChange={set('mobile')} maxLength={20} /></Field>
            <Field label={t.signed} htmlFor="fm-sig"><Input id="fm-sig" value={f.signedName} onChange={set('signedName')} maxLength={120} /></Field>
          </div>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <div className="flex gap-2"><Button variant="gold" size="sm" disabled={!ok || busy} onClick={save}>{t.save}</Button><Button variant="ghost" size="sm" onClick={() => setEditing(null)}><X className="h-4 w-4" />{t.cancel}</Button></div>
        </div>
      )}
      {people === null ? <div className="h-16 animate-pulse rounded-md bg-muted/40" /> : people.length === 0 ? <p className="text-sm text-muted-foreground">{t.none}</p> : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {people.map((p) => (
            <li key={p.id} className="rounded-lg border border-border/60 p-3">
              <p className="font-semibold">{p.fullName} <span className="ml-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold">{RELATION_LABEL[p.relation][lang]}</span></p>
              <p className="text-xs text-muted-foreground">{t.born} {toIsoDate(p.dob).split('-').reverse().join('-')}{p.placeOfBirth ? ` · ${p.placeOfBirth}` : ''}{p.mobile ? ` · ${p.mobile}` : ''}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Link href={`/reading?for=${encodeURIComponent(p.id)}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}><Sparkles className="h-4 w-4" />{t.reading}</Link>
                <Button size="sm" variant="ghost" onClick={() => open(p)}><Pencil className="h-4 w-4" />{t.edit}</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p)} className="text-danger"><Trash2 className="h-4 w-4" />{t.del}</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing === null && error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
    </section>
  );
}
