'use client';
/**
 * Admin → Report Generating → Celebrity numerology.
 * Name + date of birth → our engine calculates the numbers, Gemini writes the background and the reading as an
 * SEO blog post → edit → Publish to the blog (/blog/celebrity/<slug>) or Save draft, and Download PDF (English / Hindi).
 */
import * as React from 'react';
import { CheckCircle2, Circle, ExternalLink, Eye, EyeOff, FileDown, Languages, Loader2, Pencil, Save, Send, Star, Trash2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { CelebNumbersPanel } from '@/components/blog/celeb-numbers';
import { api, ApiError } from '@/lib/client/api';
import { SITE_NAME } from '@/lib/seo/site';
import { escHtml as esc, fmtDob } from '@/lib/report/blocks';
import { contentsAndGuide, endCta, extrasCss, type CoverWithExtras } from '@/lib/report/print-extras';
import { relWord } from '@/lib/celebrity/numbers';
import { hasPlaceholder, seoChecks, wordCount, type CelebContent, type CelebPost } from '@/lib/celebrity/post';
import type { CelebListItem, CelebRow } from '@/lib/celebrity/store';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'hi';
const errText = (x: unknown) => x instanceof ApiError
  ? (x.body.error === 'RATE_LIMITED' ? 'Too many requests – please wait a few minutes.' : (x.body as { message?: string }).message || x.message)
  : 'Something went wrong. Please try again.';

const Area = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn('w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed', p.className)} />;
const toParas = (s: string) => s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
const toLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const slugOk = (s: string) => /^[a-z0-9-]{3,120}$/.test(s);

// ───────────────────────── PDF (browser print → Save as PDF), with the branded cover
async function printPost(post: CelebPost, lang: Lang, by: string) {
  const w = window.open('', '_blank'); if (!w) return;
  const hi = lang === 'hi', c = (hi ? post.hi : null) ?? post.en, n = post.numbers;
  w.document.write(`<p style="font-family:Georgia,serif;padding:40px;color:#7a1f2b">${hi ? 'रिपोर्ट तैयार हो रही है…' : 'Preparing the report…'}</p>`);
  const date = new Date().toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const cover = await api<CoverWithExtras>('/api/admin/report-cover', { method: 'POST', json: {
    extras: 'celebrity', title: (hi ? 'सेलिब्रिटी अंक ज्योतिष रिपोर्ट' : 'Celebrity Numerology Report'), subtitle: (post.profile.profession || c.excerpt).slice(0, 120), clientName: post.name.slice(0, 120), preparedBy: by.slice(0, 80), lang,
    facts: [[hi ? 'जन्म तिथि' : 'Date of birth', fmtDob(post.dob, lang)], [hi ? 'मूलांक · भाग्यांक' : 'Mulank · Bhagyank', `${n.moolank.value} · ${n.bhagyank.value}`], [hi ? 'नामांक' : 'Name number', `${n.chaldean.compound}/${n.chaldean.single}`], [hi ? 'रिपोर्ट तिथि' : 'Report date', date]],
  } }).catch(() => null);
  const grid = [[4, 9, 2], [3, 5, 7], [8, 1, 6]].map((r) => `<tr>${r.map((x) => { const k = n.loShu.counts[x] ?? 0; return `<td class="${k ? 'on' : ''}">${k ? String(x).repeat(Math.min(k, 4)) : '·'}</td>`; }).join('')}</tr>`).join('');
  const L = hi
    ? { m: 'मूलांक', b: 'भाग्यांक', nm: 'नामांक', py: 'व्यक्तिगत वर्ष', rel: 'मूलांक–भाग्यांक संबंध', sc: 'नाम अनुकूलता', miss: 'अनुपस्थित अंक', faq: 'अक्सर पूछे जाने वाले प्रश्न', glance: 'अंक एक नज़र में', none: 'कोई नहीं', by: 'द्वारा तैयार', note: 'यह रिपोर्ट सार्वजनिक रूप से ज्ञात जन्म विवरण पर पारंपरिक अंक ज्योतिष से तैयार है; यह शिक्षा और मनोरंजन के लिए है, पेशेवर सलाह का विकल्प नहीं।' }
    : { m: 'Mulank', b: 'Bhagyank', nm: 'Name number', py: 'Personal year', rel: 'Mulank–Bhagyank relation', sc: 'Name compatibility', miss: 'Missing numbers', faq: 'Frequently asked questions', glance: 'Numbers at a glance', none: 'none', by: 'Prepared by', note: 'This report reads publicly known birth details through traditional numerology for education and entertainment; it does not replace professional advice.' };
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(c.h1)}</title><style>
@page{size:A4;margin:16mm 14mm}${cover ? '@page:first{margin:0}' : ''}body{font-family:Georgia,'Noto Serif Devanagari',serif;color:#2a1a10;margin:0;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}.doc{max-width:860px;margin:0 auto;padding:0 18px}
h1{color:#7a1f2b;margin:0;font-size:26px}h2{color:#7a1f2b;border-bottom:2px solid #c9a227;padding-bottom:4px;margin-top:24px;font-size:19px;break-after:avoid}p{margin:6px 0}
.head{border:3px double #c9a227;border-radius:14px;padding:20px 24px;margin:18px 0 8px;background:linear-gradient(135deg,#fffaf0,#fbf1d9)}.brand{letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:#8a6d12;margin:0 0 6px}
.k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.k div{border:1px solid #e5d3a1;border-radius:8px;padding:8px;text-align:center;background:#fff;font-size:11px}.k b{display:block;font-size:22px;color:#7a1f2b}
.g{display:flex;gap:18px;align-items:center;break-inside:avoid}.g table{border-collapse:collapse}.g td{width:44px;height:44px;border:1px solid #c9a227;text-align:center;font-weight:700;color:#bbb}.g td.on{color:#7a1f2b;background:#fbf1d9}
ul{margin:6px 0 6px 20px}.faq{break-inside:avoid;margin:8px 0}.faq b{color:#8a6d12}.tip{border-left:4px solid #c9a227;background:#fbf1d9;padding:8px 12px;border-radius:6px}
.foot{margin-top:28px;border-top:1px solid #e5d3a1;padding-top:8px;font-size:11px;color:#7a6a55}${extrasCss(cover?.extras)}${cover?.css ?? ''}</style></head><body>${cover?.html ?? ''}<main class="doc">
<div class="head"><p class="brand">${esc(SITE_NAME)} · ${hi ? 'सेलिब्रिटी अंक ज्योतिष' : 'Celebrity numerology'}</p><h1>${esc(c.h1)}</h1><p><small>${L.by} ${esc(by)} · ${date}</small></p></div>
${contentsAndGuide([L.glance, ...c.sections.map((s) => s.h2), L.faq], lang, cover?.extras)}
${c.intro.map((p) => `<p>${esc(p)}</p>`).join('')}
<h2>${L.glance}</h2><div class="k"><div>${L.m}<b>${n.moolank.value}</b></div><div>${L.b}<b>${n.bhagyank.value}</b></div><div>${L.nm}<b>${n.chaldean.compound}/${n.chaldean.single}</b></div><div>${L.py}<b>${n.personalYear.value}</b></div></div>
<div class="g"><table>${grid}</table><div><p><b>${L.rel}:</b> ${esc(relWord(n.moolankBhagyank, lang))}</p><p><b>${L.sc}:</b> ${n.nameScore}/100</p><p><b>${L.miss}:</b> ${n.loShu.missing.join(', ') || L.none}</p></div></div>
${c.sections.map((s) => `<section><h2>${esc(s.h2)}</h2>${s.paras.map((p) => `<p>${esc(p)}</p>`).join('')}${s.bullets?.length ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</section>`).join('')}
<h2>${L.faq}</h2>${c.faqs.map((f) => `<div class="faq"><b>${esc(f.q)}</b><p>${esc(f.a)}</p></div>`).join('')}
${c.conclusion ? `<p class="tip">${esc(c.conclusion)}</p>` : ''}
${endCta(cover?.extras)}
<p class="foot">${L.by} ${esc(by)} · ${esc(SITE_NAME)}. ${L.note}</p></main></body></html>`;
  w.document.open(); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 800);
}

// ───────────────────────── editor for one language version
function ContentEditor({ c, onChange, lang }: { c: CelebContent; onChange: (c: CelebContent) => void; lang: Lang }) {
  const set = (p: Partial<CelebContent>) => onChange({ ...c, ...p });
  const sec = (i: number, p: Partial<CelebContent['sections'][number]>) => set({ sections: c.sections.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const dir = lang === 'hi' ? 'Hindi' : 'English';
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={`SEO title (${c.seoTitle.length}/60)`} htmlFor={`cs-t-${lang}`}><Input id={`cs-t-${lang}`} value={c.seoTitle} maxLength={70} onChange={(e) => set({ seoTitle: e.target.value })} /></Field>
        <Field label="Focus keyword" htmlFor={`cs-k-${lang}`}><Input id={`cs-k-${lang}`} value={c.focusKeyword} onChange={(e) => set({ focusKeyword: e.target.value })} /></Field>
        <Field label={`Meta description (${c.metaDescription.length}/158)`} htmlFor={`cs-d-${lang}`} className="md:col-span-2"><Area id={`cs-d-${lang}`} rows={2} maxLength={170} value={c.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })} /></Field>
        <Field label="H1 heading" htmlFor={`cs-h-${lang}`} className="md:col-span-2"><Input id={`cs-h-${lang}`} value={c.h1} maxLength={110} onChange={(e) => set({ h1: e.target.value })} /></Field>
        <Field label="Keywords (comma separated)" htmlFor={`cs-kw-${lang}`} className="md:col-span-2"><Input id={`cs-kw-${lang}`} value={c.keywords.join(', ')} onChange={(e) => set({ keywords: e.target.value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 14) })} /></Field>
        <Field label="Excerpt (blog card)" htmlFor={`cs-x-${lang}`} className="md:col-span-2"><Area id={`cs-x-${lang}`} rows={2} maxLength={300} value={c.excerpt} onChange={(e) => set({ excerpt: e.target.value })} /></Field>
      </div>
      <Field label="Introduction (blank line between paragraphs)" htmlFor={`cs-i-${lang}`}><Area id={`cs-i-${lang}`} rows={5} value={c.intro.join('\n\n')} onChange={(e) => set({ intro: toParas(e.target.value) })} /></Field>
      {c.sections.map((s, i) => (
        <fieldset key={s.id} className="space-y-2 rounded-lg border border-gold/25 p-3">
          <legend className="px-1 text-xs uppercase tracking-wider text-muted-foreground">Section {i + 1} · {s.id}</legend>
          <Input aria-label={`Section ${i + 1} heading (${dir})`} value={s.h2} onChange={(e) => sec(i, { h2: e.target.value })} className="font-semibold" />
          <Area aria-label={`Section ${i + 1} paragraphs (${dir})`} rows={Math.min(14, 3 + s.paras.length * 2)} value={s.paras.join('\n\n')} onChange={(e) => sec(i, { paras: toParas(e.target.value) })} />
          <Area aria-label={`Section ${i + 1} bullet points (${dir})`} placeholder="Bullet points – one per line (optional)" rows={Math.max(2, (s.bullets?.length ?? 0) + 1)} value={(s.bullets ?? []).join('\n')} onChange={(e) => sec(i, { bullets: toLines(e.target.value) })} />
        </fieldset>
      ))}
      <fieldset className="space-y-2 rounded-lg border border-gold/25 p-3">
        <legend className="px-1 text-xs uppercase tracking-wider text-muted-foreground">FAQs (Google FAQ rich result)</legend>
        {c.faqs.map((f, i) => (
          <div key={i} className="grid gap-1 sm:grid-cols-[1fr_auto]">
            <Input aria-label={`Question ${i + 1}`} value={f.q} onChange={(e) => set({ faqs: c.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} className="font-medium" />
            <Button type="button" size="sm" variant="ghost" aria-label={`Remove question ${i + 1}`} onClick={() => set({ faqs: c.faqs.filter((_, j) => j !== i) })} disabled={c.faqs.length <= 2}><Trash2 className="h-4 w-4" /></Button>
            <Area aria-label={`Answer ${i + 1}`} rows={3} value={f.a} onChange={(e) => set({ faqs: c.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} className="sm:col-span-2" />
          </div>
        ))}
        {c.faqs.length < 8 && <Button type="button" size="sm" variant="outline" onClick={() => set({ faqs: [...c.faqs, { q: '', a: '' }] })}>Add question</Button>}
      </fieldset>
      <Field label="Conclusion" htmlFor={`cs-c-${lang}`}><Area id={`cs-c-${lang}`} rows={3} value={c.conclusion ?? ''} onChange={(e) => set({ conclusion: e.target.value })} /></Field>
    </div>
  );
}

function SerpPreview({ c, slug }: { c: CelebContent; slug: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 text-left dark:bg-zinc-900">
      <p className="text-xs text-[#4d5156] dark:text-zinc-400">mynumerologist.com › blog › celebrity › {slug}</p>
      <p className="mt-1 truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">{c.seoTitle}</p>
      <p className="line-clamp-2 text-sm text-[#4d5156] dark:text-zinc-400">{c.metaDescription}</p>
    </div>
  );
}

export function CelebrityStudio() {
  const [f, setF] = React.useState({ name: '', dob: '', preparedBy: 'Acharya Nandram' });
  const [busy, setBusy] = React.useState<'' | 'gen' | 'hi' | 'save' | 'list'>('');
  const [err, setErr] = React.useState('');
  const [ok, setOk] = React.useState('');
  const [post, setPost] = React.useState<CelebPost | null>(null);
  const [rowId, setRowId] = React.useState<number | null>(null);
  const [status, setStatus] = React.useState<'draft' | 'published' | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [lang, setLang] = React.useState<Lang>('en');
  const [mode, setMode] = React.useState<'preview' | 'edit'>('preview');
  const [list, setList] = React.useState<CelebListItem[] | null>(null);

  const loadList = React.useCallback(async () => {
    try { setList((await api<{ posts: CelebListItem[] }>('/api/admin/celebrity')).posts); } catch { setList([]); }
  }, []);
  React.useEffect(() => { loadList(); }, [loadList]);

  async function generate(e: React.FormEvent) {
    e.preventDefault(); setBusy('gen'); setErr(''); setOk(''); setPost(null); setWarnings([]);
    try {
      const r = await api<{ post: CelebPost; warnings: string[] }>('/api/admin/celebrity', { method: 'POST', json: { action: 'generate', name: f.name, dob: f.dob } });
      setPost(r.post); setWarnings(r.warnings); setRowId(null); setStatus(null); setLang('en'); setMode('preview');
      const clash = list?.find((x) => x.slug === r.post.slug);
      if (clash) { setRowId(clash.id); setStatus(clash.status); setWarnings((w) => [...w, `A post for this URL already exists (${clash.status}). Saving will REPLACE it with this new version.`]); }
      setTimeout(() => document.getElementById('celeb-result')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (x) { setErr(errText(x)); } finally { setBusy(''); }
  }

  async function addHindi() {
    if (!post) return;
    setBusy('hi'); setErr(''); setOk('');
    try {
      const r = await api<{ hi: CelebContent; warnings: string[] }>('/api/admin/celebrity', { method: 'POST', json: { action: 'hindi', post } });
      setPost({ ...post, hi: r.hi }); setLang('hi'); setWarnings((w) => [...w.filter((x) => !x.startsWith('Hindi numbers')), ...r.warnings]);
    } catch (x) { setErr(errText(x)); } finally { setBusy(''); }
  }

  async function save(next: 'draft' | 'published') {
    if (!post) return;
    setBusy('save'); setErr(''); setOk('');
    try {
      const r = await api<{ row: CelebRow }>('/api/admin/celebrity', { method: 'POST', json: { action: 'save', id: rowId, status: next, post } });
      setRowId(r.row.id); setStatus(r.row.status); setPost(r.row.post);
      setOk(next === 'published' ? 'Published on the blog.' : 'Saved as draft (not visible on the website).');
      loadList();
    } catch (x) { setErr(errText(x)); } finally { setBusy(''); }
  }

  async function act(item: CelebListItem, action: 'edit' | 'toggle' | 'delete' | 'pdf') {
    setErr(''); setOk('');
    try {
      if (action === 'delete') {
        if (!window.confirm(`Delete "${item.title}"? The page will be removed from the website.`)) return;
        await api('/api/admin/celebrity', { method: 'POST', json: { action: 'delete', id: item.id } });
        if (rowId === item.id) { setPost(null); setRowId(null); setStatus(null); }
        setOk('Post deleted.'); return loadList();
      }
      if (action === 'toggle') {
        const s = item.status === 'published' ? 'draft' : 'published';
        await api('/api/admin/celebrity', { method: 'POST', json: { action: 'status', id: item.id, status: s } });
        if (rowId === item.id) setStatus(s);
        setOk(s === 'published' ? 'Published on the blog.' : 'Unpublished – the page is hidden from the website.'); return loadList();
      }
      setBusy('list');
      const { row } = await api<{ row: CelebRow }>(`/api/admin/celebrity?id=${item.id}`);
      if (action === 'pdf') { await printPost(row.post, 'en', f.preparedBy || 'Acharya Nandram'); return; }
      setPost(row.post); setRowId(row.id); setStatus(row.status); setWarnings([]); setLang('en'); setMode('edit');
      setF((x) => ({ ...x, name: row.name, dob: row.dob }));
      setTimeout(() => document.getElementById('celeb-result')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (x) { setErr(errText(x)); } finally { setBusy(''); }
  }

  const c = post ? (lang === 'hi' ? post.hi : post.en) : undefined;
  const checks = post ? seoChecks(post.en, post.slug) : [];
  const placeholder = post ? hasPlaceholder(post.en) || (!!post.hi && hasPlaceholder(post.hi)) : false;
  const setC = (nc: CelebContent) => post && setPost(lang === 'hi' ? { ...post, hi: nc } : { ...post, en: nc });
  const n = post?.numbers;

  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Star className="h-6 w-6 text-gold" />Celebrity Numerology Report</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter a celebrity’s name and date of birth. The numbers (Mulank, Bhagyank, Chaldean name number, Lo Shu grid, personal year) are calculated by the website engine; Gemini AI writes the background (checked with Google Search) and the reading as an SEO-friendly blog post. Review and edit, then <b>Publish to blog</b> or <b>Download PDF</b>. Published posts appear at <code>/blog/celebrity</code>, on the blog home and in the sitemap.</p>
      </div>

      <form onSubmit={generate} className="glass grid gap-4 rounded-lg p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Celebrity name" htmlFor="cs-name" required className="lg:col-span-2"><Input id="cs-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Virat Kohli" required minLength={2} maxLength={120} /></Field>
        <Field label="Date of birth" htmlFor="cs-dob" required><Input id="cs-dob" type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} required /></Field>
        <Field label="PDF prepared by" htmlFor="cs-by"><Input id="cs-by" value={f.preparedBy} onChange={(e) => setF({ ...f, preparedBy: e.target.value })} /></Field>
        {err && <p className="text-sm text-danger sm:col-span-2 lg:col-span-4" role="alert">{err}</p>}
        {ok && <p className="text-sm text-success sm:col-span-2 lg:col-span-4" role="status">{ok}</p>}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
          <Button type="submit" variant="gold" size="lg" disabled={!!busy}>{busy === 'gen' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculating & writing… (about 30–60 s)</> : 'Calculate & write report'}</Button>
          <span className="text-xs text-muted-foreground">Use the name the celebrity is publicly known by.</span>
        </div>
      </form>

      {post && n && (
        <div id="celeb-result" className="glass space-y-5 rounded-lg p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-2xl font-semibold">{post.name}</h3>
              <p className="text-sm text-muted-foreground">{fmtDob(post.dob, 'en')} · {post.profile.profession || 'Profession not confirmed'}{post.profile.knownFor ? ` · ${post.profile.knownFor}` : ''}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge tone={post.writer === 'ai' ? 'gold' : 'warn'}>{post.writer === 'ai' ? `Written by Gemini (${post.model})` : 'Offline draft'}</Badge>
                <Badge tone={post.profile.identified ? 'good' : 'warn'}>{post.profile.identified ? 'Celebrity identified' : 'Not identified – check'}</Badge>
                <Badge>{wordCount(post.en)} words</Badge>
                {status && <Badge tone={status === 'published' ? 'good' : 'default'}>{status === 'published' ? 'Published' : 'Draft'}</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="gold" onClick={() => save('published')} disabled={!!busy || placeholder || !slugOk(post.slug)} title={placeholder ? 'Replace the [Add … here] placeholder first' : undefined}>{busy === 'save' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}{status === 'published' ? 'Update live post' : 'Publish to blog'}</Button>
              <Button type="button" variant="outline" onClick={() => save('draft')} disabled={!!busy || !slugOk(post.slug)}><Save className="mr-1 h-4 w-4" />{status === 'published' ? 'Unpublish & save draft' : 'Save draft'}</Button>
              <Button type="button" variant="outline" onClick={() => printPost(post, lang === 'hi' && post.hi ? 'hi' : 'en', f.preparedBy || 'Acharya Nandram')}><FileDown className="mr-1 h-4 w-4" />Download PDF ({lang === 'hi' && post.hi ? 'Hindi' : 'English'})</Button>
              {status === 'published' && <a href={`/blog/celebrity/${post.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1 rounded-md border border-input px-3 text-sm hover:bg-muted"><ExternalLink className="h-4 w-4" />View live</a>}
            </div>
          </div>

          {warnings.length > 0 && <ul className="space-y-1 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm">{warnings.map((w) => <li key={w} className="flex gap-2"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{w}</li>)}</ul>}
          {placeholder && <p className="rounded-md border border-danger/50 bg-danger/10 p-3 text-sm">The background section still says “[Add … here]”. Switch to <b>Edit</b> and write it before publishing.</p>}

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <Field label="Blog URL" htmlFor="cs-slug" hint={`https://www.mynumerologist.com/blog/celebrity/${post.slug}`} error={slugOk(post.slug) ? undefined : 'Lowercase letters, numbers and hyphens only'}>
                <Input id="cs-slug" value={post.slug} onChange={(e) => setPost({ ...post, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-').slice(0, 120) })} />
              </Field>
              <SerpPreview c={post.en} slug={post.slug} />
            </div>
            <div className="rounded-lg border border-gold/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">SEO checklist (English)</p>
              <ul className="space-y-1 text-sm">{checks.map((x) => <li key={x.label} className="flex gap-2">{x.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />}{x.label}</li>)}</ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
            <Select aria-label="Language version" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="w-36"><option value="en">English</option><option value="hi" disabled={!post.hi}>हिंदी{post.hi ? '' : ' (not yet)'}</option></Select>
            <Button type="button" size="sm" variant="outline" onClick={addHindi} disabled={!!busy}>{busy === 'hi' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Languages className="mr-1 h-4 w-4" />}{post.hi ? 'Re-write Hindi from English' : 'Add Hindi version'}</Button>
            <div className="ml-auto flex gap-1">
              <Button type="button" size="sm" variant={mode === 'preview' ? 'gold' : 'ghost'} onClick={() => setMode('preview')}><Eye className="mr-1 h-4 w-4" />Preview</Button>
              <Button type="button" size="sm" variant={mode === 'edit' ? 'gold' : 'ghost'} onClick={() => setMode('edit')}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
            </div>
          </div>

          {c && mode === 'edit' && <ContentEditor c={c} onChange={setC} lang={lang} />}
          {c && mode === 'preview' && (
            <article className="space-y-5" lang={lang}>
              <h1 className="font-cinzel text-3xl font-bold"><span className="gold-text">{c.h1}</span></h1>
              {c.intro.map((p, i) => <p key={i} className="text-muted-foreground">{p}</p>)}
              <CelebNumbersPanel n={n} lang={lang} />
              {c.sections.map((s) => (
                <section key={s.id} className="space-y-2">
                  <h2 className="font-serif text-xl font-bold">{s.h2}</h2>
                  {s.paras.map((p, i) => <p key={i} className="text-sm leading-relaxed">{p}</p>)}
                  {!!s.bullets?.length && <ul className="list-disc space-y-1 pl-5 text-sm">{s.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
                </section>
              ))}
              <section className="space-y-2"><h2 className="font-serif text-xl font-bold">FAQ</h2>{c.faqs.map((q) => <details key={q.q} className="rounded-md border border-border p-3"><summary className="cursor-pointer font-medium">{q.q}</summary><p className="mt-1 text-sm text-muted-foreground">{q.a}</p></details>)}</section>
              {c.conclusion && <p className="rounded-md border-l-4 border-gold bg-gold/10 p-3 text-sm">{c.conclusion}</p>}
            </article>
          )}

          {post.sources.length > 0 && (
            <details className="rounded-lg border border-border p-3 text-sm">
              <summary className="cursor-pointer font-medium">Background checked against {post.sources.length} web source{post.sources.length > 1 ? 's' : ''} (for your review – not shown on the blog)</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">{post.sources.map((s) => <li key={s.uri}><a href={s.uri} target="_blank" rel="noreferrer noopener" className="text-gold hover:underline">{s.title || s.uri}</a></li>)}</ul>
            </details>
          )}
        </div>
      )}

      <div className="glass rounded-lg p-5">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-semibold">Celebrity posts</h3><a href="/blog/celebrity" target="_blank" rel="noreferrer" className="text-sm text-gold hover:underline">Open /blog/celebrity →</a></div>
        {list === null ? <div className="h-20 animate-pulse rounded bg-muted" /> : list.length === 0 ? <p className="text-sm text-muted-foreground">No celebrity posts yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="py-2">Celebrity</th><th>M · B</th><th>Status</th><th>Hindi</th><th>Updated</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className={cn('border-b border-border/60', rowId === p.id && 'bg-gold/10')}>
                    <td className="py-2"><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">/blog/celebrity/{p.slug}</p></td>
                    <td>{p.moolank} · {p.bhagyank}</td>
                    <td><Badge tone={p.status === 'published' ? 'good' : 'default'}>{p.status}</Badge></td>
                    <td>{p.hasHindi ? 'Yes' : '–'}</td>
                    <td className="text-xs">{new Date(p.updatedAt).toLocaleDateString('en-IN')}</td>
                    <td className="space-x-1 whitespace-nowrap text-right">
                      <Button type="button" size="sm" variant="ghost" onClick={() => act(p, 'edit')} disabled={!!busy} aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4" /></Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => act(p, 'pdf')} disabled={!!busy} aria-label={`PDF of ${p.name}`}><FileDown className="h-4 w-4" /></Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => act(p, 'toggle')} disabled={!!busy} aria-label={p.status === 'published' ? `Unpublish ${p.name}` : `Publish ${p.name}`}>{p.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Send className="h-4 w-4" />}</Button>
                      {p.status === 'published' && <a href={`/blog/celebrity/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center px-2 align-middle" aria-label={`View ${p.name}`}><ExternalLink className="h-4 w-4" /></a>}
                      <Button type="button" size="sm" variant="ghost" onClick={() => act(p, 'delete')} disabled={!!busy} aria-label={`Delete ${p.name}`}><Trash2 className="h-4 w-4 text-danger" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
