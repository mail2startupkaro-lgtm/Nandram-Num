'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Feather, PenLine, RefreshCw } from 'lucide-react';
import type { NumerologyResult } from '@/lib/numerology';
import type { Narrative } from '@/lib/narrative/service';
import { postProcess } from '@/lib/narrative/filter';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Badge, Section } from '@/components/ui/misc';
import { Select } from '@/components/ui/form';
import { cn } from '@/lib/utils';

export function NarrativePanel({ result, narrative, onChange }: {
  result: NumerologyResult; narrative: Narrative | null; onChange: (n: Narrative | null) => void;
}) {
  const { t } = useApp();
  const [language, setLanguage] = React.useState<'en' | 'hi' | 'hinglish'>(narrative?.language ?? result.client.language ?? 'en');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [review, setReview] = React.useState(false);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  async function write() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/narrative', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result, language, expertReview: review }) });
      if (!res.ok) throw new Error(String(res.status));
      onChange(await res.json());
      setDrafts({});
    } catch {
      setError(t.err.server);
    } finally {
      setLoading(false);
    }
  }

  function saveEdit(id: string) {
    if (!narrative || drafts[id] === undefined) return;
    onChange({
      ...narrative,
      status: 'awaiting_review',
      sections: narrative.sections.map((s) => (s.id === id && drafts[id] !== s.text ? { ...s, text: postProcess(drafts[id]), source: 'expert' } : s)),
    });
    setDrafts(({ [id]: _, ...rest }) => rest);
  }

  return (
    <Section id="report" title={t.n.title} subtitle={t.n.sub} icon={<Feather className="h-5 w-5" />}>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block text-muted-foreground">{t.n.language}</span>
          <Select value={language} onChange={(e) => setLanguage(e.target.value as typeof language)} className="w-40">
            <option value="en">{t.f.english}</option><option value="hinglish">{t.f.hinglish}</option><option value="hi">{t.f.hindi}</option>
          </Select>
        </label>
        <Button variant={narrative ? 'outline' : 'gold'} onClick={write} disabled={loading}>
          {narrative ? <RefreshCw className={loading ? 'animate-spin' : ''} /> : <Feather className={loading ? 'animate-pulse' : ''} />}
          {loading ? t.n.writing : narrative ? t.n.rewrite : t.n.write}
        </Button>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={review} onChange={(e) => setReview(e.target.checked)} />
          <PenLine className="h-4 w-4 text-gold" /> {t.n.review}
        </label>
        {narrative && (
          <Badge tone={narrative.status === 'final' ? 'good' : 'warn'} className="ml-auto">
            {narrative.status === 'final' ? t.n.approved : t.n.awaiting}
          </Badge>
        )}
      </div>

      {error && <p className="mb-4 rounded-md bg-danger/10 p-3 text-sm text-danger" role="alert">{error}</p>}
      {review && <p className="mb-4 rounded-md border border-gold/30 bg-gold/5 p-3 text-xs">{t.n.reviewHint}</p>}
      {narrative?.languageFallback && <p className="mb-4 text-xs text-warning">{t.n.fallbackNote}</p>}

      {loading && !narrative && (
        <div className="space-y-3" aria-busy>
          {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-md bg-muted" />)}
        </div>
      )}

      {!narrative && !loading && <p className="text-sm text-muted-foreground">{t.n.empty}</p>}

      {narrative && (
        <article className={cn('space-y-7', loading && 'opacity-50')} lang={narrative.language === 'hi' ? 'hi' : 'en'}>
          {narrative.sections.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.6) }}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-serif text-xl font-semibold text-gold">{s.title}</h3>
                {s.source === 'expert' && <Badge tone="gold">{t.n.edited}</Badge>}
              </div>
              {review ? (
                <div className="space-y-2">
                  <textarea
                    value={drafts[s.id] ?? s.text}
                    onChange={(e) => setDrafts({ ...drafts, [s.id]: e.target.value })}
                    rows={Math.min(18, Math.max(5, Math.ceil((drafts[s.id] ?? s.text).length / 90)))}
                    className="w-full rounded-md border border-input bg-background/70 p-3 text-[15px] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {drafts[s.id] !== undefined && drafts[s.id] !== s.text && (
                    <Button size="sm" onClick={() => saveEdit(s.id)}><CheckCircle2 /> {t.btn.save}</Button>
                  )}
                </div>
              ) : (
                s.text.split(/\n\s*\n/).map((p, j) => <p key={j} className="mb-3 text-[15px] leading-relaxed text-foreground/90">{p}</p>)
              )}
            </motion.div>
          ))}
          {review && narrative.status !== 'final' && (
            <Button variant="gold" onClick={() => { onChange({ ...narrative, status: 'final' }); setReview(false); }}><CheckCircle2 /> {t.n.approve}</Button>
          )}
        </article>
      )}
    </Section>
  );
}
