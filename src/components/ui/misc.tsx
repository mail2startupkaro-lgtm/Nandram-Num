'use client';
import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Badge({ className, tone = 'default', ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'default' | 'good' | 'warn' | 'bad' | 'gold' }) {
  const tones = {
    default: 'bg-muted text-foreground',
    good: 'bg-success/15 text-success',
    warn: 'bg-warning/15 text-warning',
    bad: 'bg-danger/15 text-danger',
    gold: 'bg-gold/20 text-foreground border border-gold/40',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)} {...p} />;
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className="h-full rounded-full bg-gradient-to-r from-maroon to-gold" initial={false} animate={{ width: `${value}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className }: { tabs: { value: string; label: string }[]; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={cn('inline-flex rounded-md bg-muted p-1', className)} role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn('relative rounded px-3 py-1.5 text-sm transition-colors', value === t.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
          {value === t.value && <motion.span layoutId={`tab-${tabs.map((x) => x.value).join()}`} className="absolute inset-0 rounded bg-card shadow" />}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Section({ id, title, subtitle, icon, defaultOpen = true, children }: {
  id: string; title: string; subtitle?: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <section id={id} className="glass scroll-mt-24 rounded-lg">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`${id}-body`} className="flex w-full items-center gap-3 p-5 text-left">
        {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-xl font-semibold">{title}</span>
          {subtitle && <span className="block text-sm text-muted-foreground">{subtitle}</span>}
        </span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={`${id}-body`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function Callout({ kind, title, children }: { kind: 'strength' | 'watch' | 'advice' | 'remedy'; title: string; children: React.ReactNode }) {
  const styles = {
    strength: 'border-success/40 bg-success/5',
    watch: 'border-warning/40 bg-warning/5',
    advice: 'border-gold/50 bg-gold/5',
    remedy: 'border-maroon/40 bg-maroon/5',
  };
  return (
    <div className={cn('rounded-md border-l-4 p-4', styles[kind])}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
