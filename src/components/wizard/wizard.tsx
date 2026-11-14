'use client';
import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, FileJson, Lock, Pencil, Sparkles, Wand2 } from 'lucide-react';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Checkbox, ChipGroup, Field, Input, Select } from '@/components/ui/form';
import { Progress } from '@/components/ui/misc';
import { LIFE_CONCERNS } from '@/lib/numerology/schemas';
import { cn } from '@/lib/utils';
import { LivePreview } from './live-preview';
import { INDIAN_STATES, SAMPLE, validateStep, type Errors, type WizardState } from './state';

const today = () => new Date().toISOString().slice(0, 10);

export function Wizard({ value, onChange, onSubmit, onImport, submitting, serverError }: {
  value: WizardState; onChange: (s: WizardState) => void; onSubmit: () => void; onImport: (file: File) => void; submitting: boolean; serverError?: string | null;
}) {
  const { t } = useApp();
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [errors, setErrors] = React.useState<Errors>({});
  const fileRef = React.useRef<HTMLInputElement>(null);
  const s = value;
  const set = <K extends keyof WizardState>(k: K, v: WizardState[K]) => { onChange({ ...s, [k]: v }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };
  const total = t.steps.length;

  const go = (to: number) => {
    if (to > step) {
      for (let i = step; i < to; i++) {
        const e = validateStep(i, s, t);
        if (Object.keys(e).length) { setErrors(e); setStep(i); return; }
      }
    }
    setErrors({});
    setDir(to > step ? 1 : -1);
    setStep(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const gOpts = [{ value: 'male' as const, label: t.f.male }, { value: 'female' as const, label: t.f.female }, { value: 'other' as const, label: t.f.other }];
  const err = (k: keyof WizardState) => errors[k];
  const inv = (k: keyof WizardState) => (errors[k] ? true : undefined);

  const steps = [
    // 0 Personal
    <div key="0" className="grid gap-4 sm:grid-cols-2">
      <Field label={t.f.fullName} htmlFor="fullName" required error={err('fullName')} className="sm:col-span-2">
        <Input id="fullName" autoComplete="name" value={s.fullName} aria-invalid={inv('fullName')} onChange={(e) => set('fullName', e.target.value)} />
      </Field>
      <Field label={t.f.commonName} htmlFor="commonName" hint={t.f.commonNameHint} error={err('commonName')}>
        <Input id="commonName" value={s.commonName} onChange={(e) => set('commonName', e.target.value)} />
      </Field>
      <Field label={t.f.hindiName} htmlFor="hindiName">
        <Input id="hindiName" lang="hi" className="font-deva" value={s.hindiName} onChange={(e) => set('hindiName', e.target.value)} />
      </Field>
      <Field label={t.f.gender} required error={err('gender')} className="sm:col-span-2">
        <ChipGroup options={gOpts} value={s.gender ? [s.gender] : []} onChange={(v) => set('gender', v[0] ?? '')} />
      </Field>
      {s.gender === 'other' && (
        <Field label={t.f.kuaBasis} className="sm:col-span-2">
          <ChipGroup options={gOpts.slice(0, 2)} value={s.kuaBasis ? [s.kuaBasis] : []} onChange={(v) => set('kuaBasis', (v[0] as 'male') ?? '')} />
        </Field>
      )}
      <Field label={t.f.dob} htmlFor="dob" required error={err('dob')}>
        <Input id="dob" type="date" max={today()} min="1900-01-01" value={s.dob} aria-invalid={inv('dob')} onChange={(e) => set('dob', e.target.value)} />
      </Field>
      <Field label={t.f.tob} htmlFor="tob">
        <Input id="tob" type="time" value={s.timeOfBirth} onChange={(e) => set('timeOfBirth', e.target.value)} />
      </Field>
      <Field label={t.f.pob} htmlFor="pob" className="sm:col-span-2">
        <Input id="pob" value={s.placeOfBirth} onChange={(e) => set('placeOfBirth', e.target.value)} />
      </Field>
    </div>,

    // 1 Life details
    <div key="1" className="grid gap-4 sm:grid-cols-2">
      <Field label={t.f.marital} htmlFor="marital">
        <Select id="marital" value={s.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value as WizardState['maritalStatus'])}>
          <option value="">{t.f.select}</option>
          {(['single', 'married', 'engaged', 'divorced', 'widowed'] as const).map((m) => <option key={m} value={m}>{t.f[m]}</option>)}
        </Select>
      </Field>
      <Field label={t.f.profession} htmlFor="profession"><Input id="profession" value={s.profession} onChange={(e) => set('profession', e.target.value)} /></Field>
      <Field label={t.f.education} htmlFor="education"><Input id="education" value={s.education} onChange={(e) => set('education', e.target.value)} /></Field>
      <Field label={t.f.city} htmlFor="city"><Input id="city" autoComplete="address-level2" value={s.city} onChange={(e) => set('city', e.target.value)} /></Field>
      <Field label={t.f.state} htmlFor="state" className="sm:col-span-2">
        <Select id="state" value={s.state} onChange={(e) => set('state', e.target.value)}>
          <option value="">{t.f.select}</option>
          {INDIAN_STATES.map((st) => <option key={st}>{st}</option>)}
        </Select>
      </Field>
      <Field label={t.f.concerns} className="sm:col-span-2">
        <ChipGroup multi options={LIFE_CONCERNS.map((c) => ({ value: c, label: t.concerns[c] }))} value={s.concerns} onChange={(v) => set('concerns', v)} />
      </Field>
      <Field label={t.f.language} className="sm:col-span-2">
        <ChipGroup options={[{ value: 'en' as const, label: t.f.english }, { value: 'hi' as const, label: t.f.hindi }, { value: 'hinglish' as const, label: t.f.hinglish }]}
          value={[s.language]} onChange={(v) => set('language', v[0] ?? 'en')} />
      </Field>
    </div>,

    // 2 Numbers & Contact
    <div key="2" className="grid gap-4">
      <Field label={t.f.mobile} htmlFor="mobile" hint={t.f.mobileHint} error={err('mobile')}>
        <Input id="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={s.mobile} aria-invalid={inv('mobile')} onChange={(e) => set('mobile', e.target.value)} />
      </Field>
      <Field label={t.f.email} htmlFor="email" hint={t.f.emailHint} error={err('email')}>
        <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="client@example.com" value={s.email} aria-invalid={inv('email')} onChange={(e) => set('email', e.target.value)} />
      </Field>
      <div className="rounded-md border border-gold/30 bg-gold/5 p-4">
        <p className="mb-3 flex gap-2 text-sm"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{t.f.aadhaarNotice}</p>
        <Field label={t.f.aadhaar} htmlFor="aadhaar" error={err('aadhaar')}>
          <Input id="aadhaar" type="password" inputMode="numeric" autoComplete="off" spellCheck={false} placeholder="•••• •••• ••••" maxLength={14}
            value={s.aadhaar} aria-invalid={inv('aadhaar')} onChange={(e) => set('aadhaar', e.target.value.replace(/[^\d ]/g, ''))} />
        </Field>
        <Checkbox id="aadhaarConsent" className="mt-3" checked={s.aadhaarConsent} onChange={(v) => set('aadhaarConsent', v)} label={t.f.aadhaarConsent} />
        {err('aadhaarConsent') && <p className="mt-1 text-xs text-danger" role="alert">{err('aadhaarConsent')}</p>}
      </div>
    </div>,

    // 3 Partner
    <div key="3" className="grid gap-4 sm:grid-cols-2">
      <Checkbox id="addPartner" className="sm:col-span-2" checked={s.addPartner} onChange={(v) => set('addPartner', v)} label={t.f.addPartner} />
      {s.addPartner && <>
        <Field label={t.f.partnerName} htmlFor="pname" required error={err('partnerName')} className="sm:col-span-2">
          <Input id="pname" value={s.partnerName} aria-invalid={inv('partnerName')} onChange={(e) => set('partnerName', e.target.value)} />
        </Field>
        <Field label={t.f.partnerGender} required error={err('partnerGender')} className="sm:col-span-2">
          <ChipGroup options={gOpts} value={s.partnerGender ? [s.partnerGender] : []} onChange={(v) => set('partnerGender', v[0] ?? '')} />
        </Field>
        <Field label={t.f.partnerDob} htmlFor="pdob" required error={err('partnerDob')}>
          <Input id="pdob" type="date" max={today()} min="1900-01-01" value={s.partnerDob} aria-invalid={inv('partnerDob')} onChange={(e) => set('partnerDob', e.target.value)} />
        </Field>
        <Field label={t.f.partnerMobile} htmlFor="pmobile" error={err('partnerMobile')}>
          <Input id="pmobile" type="tel" inputMode="numeric" value={s.partnerMobile} onChange={(e) => set('partnerMobile', e.target.value)} />
        </Field>
      </>}
    </div>,

    // 4 Review
    <ReviewStep key="4" s={s} onEdit={go} />,
  ];

  return (
    <div className="container py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gold">{step + 1} / {total} · {t.steps[step]}</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{t.stepTitles[step]}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setErrors({}); onChange({ ...SAMPLE }); }}><Wand2 /> {t.btn.loadSample}</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><FileJson /> {t.btn.importJson}</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
        </div>
      </div>

      <div className="mb-6">
        <Progress value={((step + 1) / total) * 100} />
        <ol className="mt-3 hidden grid-cols-5 gap-2 text-xs sm:grid">
          {t.steps.map((label, i) => (
            <li key={label}>
              <button onClick={() => go(i)} className={cn('w-full text-left transition-colors', i === step ? 'font-semibold text-foreground' : i < step ? 'text-gold' : 'text-muted-foreground')}>
                {i + 1}. {label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="lg:order-2"><div className="lg:sticky lg:top-24"><LivePreview s={s} /></div></div>
        <div className="glass overflow-hidden rounded-lg p-5 sm:p-7 lg:order-1">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} initial={{ opacity: 0, x: 30 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 * dir }} transition={{ duration: 0.22 }}>
              {steps[step]}
            </motion.div>
          </AnimatePresence>
          {serverError && <p className="mt-4 rounded-md bg-danger/10 p-3 text-sm text-danger" role="alert">{serverError}</p>}
          <div className="mt-8 flex justify-between gap-3">
            <Button variant="outline" onClick={() => go(step - 1)} disabled={step === 0}><ArrowLeft /> {t.btn.back}</Button>
            {step < total - 1
              ? <Button onClick={() => go(step + 1)}>{t.btn.next} <ArrowRight /></Button>
              : <Button variant="gold" size="lg" disabled={submitting} onClick={() => {
                  for (let i = 0; i < total - 1; i++) { const e = validateStep(i, s, t); if (Object.keys(e).length) { setErrors(e); setStep(i); return; } }
                  onSubmit();
                }}>
                  <Sparkles className={submitting ? 'animate-spin' : ''} /> {t.btn.generate}
                </Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ s, onEdit }: { s: WizardState; onEdit: (step: number) => void }) {
  const { t } = useApp();
  const fmt = (d: string) => (d ? d.split('-').reverse().join('-') : '–');
  const masked = s.aadhaar ? `XXXX-XXXX-${s.aadhaar.replace(/\D/g, '').slice(-4)}` : '–';
  const groups: { step: number; title: string; rows: [string, string][] }[] = [
    { step: 0, title: t.steps[0], rows: [[t.f.fullName, s.fullName], [t.f.commonName, s.commonName || '–'], [t.f.hindiName, s.hindiName || '–'], [t.f.gender, s.gender ? t.f[s.gender] : '–'], [t.f.dob, fmt(s.dob)], [t.f.tob, s.timeOfBirth || '–'], [t.f.pob, s.placeOfBirth || '–']] },
    { step: 1, title: t.steps[1], rows: [[t.f.marital, s.maritalStatus ? t.f[s.maritalStatus] : '–'], [t.f.profession, s.profession || '–'], [t.f.city, [s.city, s.state].filter(Boolean).join(', ') || '–'], [t.f.concerns, s.concerns.map((c) => t.concerns[c as keyof typeof t.concerns]).join(', ') || '–'], [t.f.language, t.f[s.language === 'en' ? 'english' : s.language === 'hi' ? 'hindi' : 'hinglish']]] },
    { step: 2, title: t.steps[2], rows: [[t.f.mobile, s.mobile || '–'], [t.f.aadhaar, masked]] },
    { step: 3, title: t.steps[3], rows: s.addPartner ? [[t.f.partnerName, s.partnerName], [t.f.partnerGender, s.partnerGender ? t.f[s.partnerGender] : '–'], [t.f.partnerDob, fmt(s.partnerDob)]] : [[t.f.addPartner, '–']] },
  ];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.step} className="rounded-md border border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold">{g.title}</p>
            <Button variant="ghost" size="sm" onClick={() => onEdit(g.step)}><Pencil /> {t.btn.edit}</Button>
          </div>
          <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[200px_1fr]">
            {g.rows.map(([k, v]) => <React.Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd className="break-words">{v}</dd></React.Fragment>)}
          </dl>
        </div>
      ))}
    </div>
  );
}
