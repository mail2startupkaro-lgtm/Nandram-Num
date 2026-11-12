/**
 * Admin Report Studio.
 *   POST { action: 'preview', ... } → calculations, accuracy checks and the editable report text
 *   POST { action: 'pdf', ... }     → the finished PDF (numbers are always recalculated on the server)
 */
import { z } from 'zod';
import { accuracyChecks } from '@/lib/admin/accuracy';
import { pdfStyleFor } from '@/lib/branding';
import { applyExpertEdits } from '@/lib/narrative/service';
import type { SectionId } from '@/lib/narrative/plan';
import { ClientInputSchema, generateNumerology, type ReportModule } from '@/lib/numerology';
import { renderReportPdf } from '@/lib/pdf/render';
import { THEMES, type ThemeId } from '@/lib/pdf/themes';
import { withAdmin } from '@/lib/server/admin';
import { json, pdfResponse, readJson, slug } from '@/lib/server/http';
import { writeNarrative } from '@/lib/server/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.object({
  action: z.enum(['preview', 'pdf']),
  input: z.unknown(),
  modules: z.array(z.enum(['dob', 'name', 'mobile', 'aadhaar', 'couple', 'complete'])).min(1).default(['complete']),
  language: z.enum(['en', 'hi', 'hinglish']).default('en'),
  theme: z.enum(Object.keys(THEMES) as [ThemeId, ...ThemeId[]]).optional(),
  asOf: isoDate.optional(),
  reportDate: isoDate.optional(),
  useAi: z.boolean().default(true),
  hiddenChapters: z.array(z.string().max(20)).max(20).default([]),
  expertNote: z.string().max(3000).optional(),
  watermark: z.string().max(40).optional(),
  sectionEdits: z.record(z.string(), z.string().max(20000)).default({}),
  reportTitle: z.string().max(120).optional(),
  serviceCode: z.string().max(40).optional(),
  branding: z.object({
    brandName: z.string().max(80), expertName: z.string().max(80), expertTitle: z.string().max(120),
    contactLine: z.string().max(200), website: z.string().max(200), bookingUrl: z.string().max(300),
  }).partial().optional(),
});

export const POST = withAdmin(async (req, user) => {
  const b = Body.parse(await readJson(req));
  const input = ClientInputSchema.parse(b.input);
  const modules = b.modules as ReportModule[];
  const result = generateNumerology(input, { asOf: b.asOf, modules });
  const narrative = await writeNarrative(result, b.language, { llm: b.useAi, ownerId: user.id });

  if (b.action === 'preview') {
    const d = result.results.dob;
    return json({
      summary: {
        clientName: result.client.commonName || result.client.fullName, dob: d.dob.iso, age: d.age, asOf: result.asOf, engineVersion: result.engineVersion,
        moolank: d.moolank, bhagyank: d.bhagyank, kua: d.kua.value, kuaGroup: d.kua.group,
        loShu: d.loShu.counts, missing: d.loShu.missing, repeated: d.loShu.repeated, personal: d.personalCycles.current,
        lifeAreas: d.lifeAreaScores,
        name: result.results.name ? { chaldean: result.results.name.chaldean.nameNumber, pythagorean: result.results.name.pythagorean.nameNumber, score: result.results.name.compatibilityScore, needsCorrection: result.results.name.needsCorrection } : null,
        mobile: result.results.mobile ? { masked: result.results.mobile.masked, total: result.results.mobile.total, score: result.results.mobile.score, verdict: result.results.mobile.verdict } : null,
        couple: result.results.couple ? { overall: result.results.couple.overall, partner: result.results.couple.partnerB.name } : null,
      },
      checks: accuracyChecks(input, result, narrative, modules),
      writer: narrative.writer === 'template' ? 'offline' : 'ai',
      sections: narrative.sections.map((s) => ({ id: s.id, title: s.title, text: s.text, warnings: s.warnings })),
    });
  }

  const final = applyExpertEdits(narrative, b.sectionEdits as Partial<Record<SectionId, string>>, true);
  const style = await pdfStyleFor(user.id, b.theme);
  const overrides = Object.fromEntries(Object.entries(b.branding ?? {}).filter(([, v]) => v && v.trim()));
  const out = await renderReportPdf({
    result, narrative: final, language: b.language, theme: style.theme,
    branding: { ...(style.branding ?? {}), ...overrides },
    watermark: b.watermark?.trim() || undefined, reportDate: b.reportDate, hiddenChapters: b.hiddenChapters, expertNote: b.expertNote,
    reportTitle: b.reportTitle?.trim() || undefined,
  });
  const filePrefix = b.reportTitle ? slug(b.reportTitle) : 'numerology-report';
  return pdfResponse(out.pdf, `${slug(result.client.commonName || result.client.fullName)}-${filePrefix}.pdf`, { 'x-page-count': String(out.pageCount) });
});
