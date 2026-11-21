'use client';
/** Free instant Pythagoras Square for the service page (lead magnet) – same engine as the admin report. */
import * as React from 'react';
import { useApp } from '@/components/layout/providers';
import { trackEvent } from '@/lib/client/analytics';
import { cellLevel, cellText, psychomatrix, type CellDigit, type Psychomatrix } from '@/lib/psychomatrix/engine';
import { CELL_LEVEL_NAME, CELLS } from '@/lib/psychomatrix/meanings';
import { psychomatrixSvg } from '@/lib/psychomatrix/svg';
import { DobForm, Upsell, useDob } from './chart-tool-parts';

export function PythagorasFree({ whatsapp }: { whatsapp: string }) {
  const { lang } = useApp();
  const hi = lang === 'hi';
  const { dob, setDob, valid } = useDob();
  const [p, setP] = React.useState<Psychomatrix | null>(null);
  const run = () => { if (!valid) return; setP(psychomatrix(dob)); trackEvent('chart_tool_run', { tool: 'pythagoras' }); };
  const shown: CellDigit[] = p ? ([1, 2, 5] as CellDigit[]) : [];
  return (
    <div className="glass space-y-6 rounded-2xl border border-gold/30 p-5 sm:p-6">
      <DobForm id="pm-free-dob" dob={dob} setDob={setDob} onSubmit={run} label={hi ? 'मेरा वर्ग बनाएँ' : 'Build my square'} hi={hi} />
      {p && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <figure className="mx-auto w-full max-w-md"><div className="overflow-hidden rounded-xl" dangerouslySetInnerHTML={{ __html: psychomatrixSvg(p, lang) }} /><figcaption className="mt-1 text-center text-xs text-muted-foreground">{hi ? 'गोले: पंक्तियों (दाएँ), स्तंभों (नीचे) और विकर्णों (कोनों) का योग' : 'Circles: totals of the rows (right), columns (below) and diagonals (corners)'}</figcaption></figure>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{hi ? 'कार्य-अंक' : 'Working numbers'}: <b className="text-foreground">{p.working.join(' · ')}</b></p>
            {shown.map((d) => (
              <div key={d} className="rounded-lg border border-gold/20 bg-background/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">{d} · {CELLS[d].name[lang]} · {CELL_LEVEL_NAME[cellLevel(p.counts[d])][lang]}</p>
                <p className="font-serif text-lg font-bold">{cellText(d, p.counts[d])}</p>
                <p className="text-sm text-muted-foreground">{CELLS[d].levels[Math.min(p.counts[d], 4)][lang]}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2">
            <Upsell hi={hi} whatsapp={whatsapp} service="Pythagorean birth chart" blur={hi ? 'ऊर्जा, रुचि, स्वास्थ्य, श्रम, भाग्य, कर्तव्य, स्मृति… उद्देश्य, परिवार, आदतें, आत्म-सम्मान, धन व घर, प्रतिभा, आध्यात्मिकता, स्वभाव की रेखाएँ।' : 'Energy, interest, health, work, luck, duty, memory… the lines of purpose, family, habits, self-esteem, money & home, talent, spirituality and temperament.'} text={hi ? 'पूरे विश्लेषण में सभी नौ गुण, आठ जीवन रेखाएँ, आपकी ताक़त और विकसित करने के सरल अभ्यास।' : 'The full analysis explains all nine qualities, the eight life lines, your strengths and simple practices for what to develop.'} />
          </div>
        </div>
      )}
    </div>
  );
}
