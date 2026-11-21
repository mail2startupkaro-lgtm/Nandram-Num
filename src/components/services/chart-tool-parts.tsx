'use client';
/**
 * Shared parts of the free instant charts (Destiny Matrix, Pythagorean birth chart) on the service pages.
 */
import * as React from 'react';
import { ArrowRight, Lock, MessageCircle, Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/client/analytics';

export function useDob() {
  const [dob, setDob] = React.useState('');
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(dob) && Number(dob.slice(0, 4)) >= 1900 && dob <= new Date().toISOString().slice(0, 10);
  return { dob, setDob, valid };
}

export function DobForm({ id, dob, setDob, onSubmit, label, hi }: { id: string; dob: string; setDob: (v: string) => void; onSubmit: () => void; label: string; hi: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
      <label htmlFor={id} className="flex-1 text-sm font-medium">{hi ? 'जन्म तिथि' : 'Date of birth'}
        <input id={id} type="date" required value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} min="1900-01-01"
          className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3 text-base" />
      </label>
      <button type="submit" className="cz-btn cz-btn-primary h-11 justify-center px-5"><Sparkles className="h-4 w-4" />{label}</button>
    </form>
  );
}

export function Upsell({ hi, whatsapp, text, service, blur }: { hi: boolean; whatsapp: string; text: string; service: string; blur: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gold/40 p-5">
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none p-5 text-sm leading-7 text-muted-foreground blur-[5px]">{blur}</div>
      <div className="relative flex flex-col items-center gap-3 text-center">
        <Lock className="h-6 w-6 text-gold" />
        <p className="max-w-md font-semibold">{text}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <a href="#book" onClick={() => trackEvent('chart_tool_book', { service })} className="cz-btn cz-btn-primary h-11 px-5"><Sparkles className="h-4 w-4" />{hi ? 'पूरा विश्लेषण बुक करें' : 'Book the full analysis'}<ArrowRight className="h-4 w-4" /></a>
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Namaste Acharya ji, I want my full ${service} report.`)}`} target="_blank" rel="noopener noreferrer" className="cz-btn cz-btn-ghost h-11 px-5"><MessageCircle className="h-4 w-4 text-success" />WhatsApp</a>
        </div>
      </div>
    </div>
  );
}

