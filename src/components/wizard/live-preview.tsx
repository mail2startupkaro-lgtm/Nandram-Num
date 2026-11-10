'use client';
import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { analyseDob, analyseNameSystem, normalizeIndianMobile, reduce, digitsOf, todayIST } from '@/lib/numerology';
import { useApp } from '@/components/layout/providers';
import { NumberGrid } from '@/components/results/grid';
import type { WizardState } from './state';
import { tr } from '@/lib/i18n/hi-terms';

/** Runs the same deterministic engine in the browser for instant feedback. Aadhaar is never used here. */
export function LivePreview({ s }: { s: WizardState }) {
  const { t, lang } = useApp();
  const data = React.useMemo(() => {
    let dob: ReturnType<typeof analyseDob> | null = null;
    try { if (s.dob && s.gender) dob = analyseDob({ dob: s.dob, gender: s.gender }, { asOf: todayIST(), kuaBasis: s.kuaBasis || undefined }); } catch { dob = null; }
    let nameNo: { compound: number; single: number } | null = null;
    try { const n = s.commonName || s.fullName; if (n.replace(/[^A-Za-z]/g, '').length >= 2) nameNo = analyseNameSystem(n, 'chaldean').nameNumber; } catch { nameNo = null; }
    let mobile: { compound: number; single: number } | null = null;
    try { if (s.mobile) { const r = reduce(digitsOf(normalizeIndianMobile(s.mobile)).reduce((a, b) => a + b, 0)); mobile = { compound: r.total, single: r.value }; } } catch { mobile = null; }
    return { dob, nameNo, mobile };
  }, [s.dob, s.gender, s.kuaBasis, s.fullName, s.commonName, s.mobile]);

  const items = [
    { k: t.preview.moolank, v: data.dob?.moolank.value, sub: data.dob ? String(data.dob.moolank.compound) : undefined },
    { k: t.preview.bhagyank, v: data.dob?.bhagyank.value, sub: data.dob ? `${data.dob.bhagyank.compound}${data.dob.bhagyank.master ? ` · ${data.dob.bhagyank.master}` : ''}` : undefined },
    { k: t.preview.kua, v: data.dob?.kua.value },
    { k: t.preview.py, v: data.dob?.personalCycles.current.personalYear },
    { k: t.preview.nameNo, v: data.nameNo?.single, sub: data.nameNo ? String(data.nameNo.compound) : undefined },
    { k: t.preview.mobileTotal, v: data.mobile?.single, sub: data.mobile ? String(data.mobile.compound) : undefined },
  ];

  return (
    <div className="glass rounded-lg p-5">
      <p className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold"><Sparkles className="h-4 w-4 text-gold" />{t.preview.title}</p>
      {!data.dob && <p className="mb-4 text-sm text-muted-foreground">{t.preview.empty}</p>}
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <div key={it.k} className="rounded-md border border-gold/20 bg-background/40 p-2 text-center">
            <p className="text-[11px] text-muted-foreground">{it.k}</p>
            <AnimatePresence mode="popLayout">
              <motion.p key={String(it.v)} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="num-badge text-2xl font-bold text-gold">{it.v ?? '–'}</motion.p>
            </AnimatePresence>
            <p className="h-4 text-[10px] text-muted-foreground">{it.sub}</p>
          </div>
        ))}
      </div>
      {data.dob && (
        <div className="mt-4 flex items-center gap-4">
          <NumberGrid size="sm" cells={data.dob.loShu.cells} label={t.r.loShu} />
          <div className="space-y-1 text-xs">
            <p className="font-medium">{t.r.loShu}</p>
            <p className="text-muted-foreground">{t.r.missing}: <span className="text-foreground">{data.dob.loShu.missing.join(', ') || t.r.none}</span></p>
            <p className="text-muted-foreground">{t.r.yogs}: <span className="text-foreground">{data.dob.loShu.yogs.map((y) => tr(lang, y.name)).join(', ') || t.r.none}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
