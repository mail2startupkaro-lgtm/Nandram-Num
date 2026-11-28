/**
 * System-written report for every purchased service, from the booking details, in English or Hindi.
 *
 * Used by the automatic delivery (lib/server/service-delivery-run.ts): when the numerologist has not approved / uploaded
 * a report within 3 hours of payment, the system writes it with the same engines as the admin report generators and
 * puts both language versions in the client's report area.
 *
 *   Complete Life, Name Correction, Lo Shu, Couple, Personal Year → numerology engine + narrative (report PDF)
 *   Mobile number → advanced mobile + DOB report       Baby name → baby name report
 *   Destiny Matrix / Pythagorean birth chart → chart reports      Business name / Complete business → business engine
 *   Business compatibility → 1000+ category engine + analyst      Signature → measurements of the uploaded photo + analyst
 */
import { pdfStyleFor } from '@/lib/branding';
import { generateNumerology, parseDate, todayIST } from '@/lib/numerology';
import { renderHtmlDocumentPdf, renderReportPdf, decodeImageRgba } from '@/lib/pdf/render';
import { slug } from '@/lib/server/http';
import { writeNarrative } from '@/lib/server/reports';
import { AUTO_REPORTS, autoModules, canAutoGenerate, intakeToClientInput, isoDob, mobilesIn, reportTitle, SERVICE_REPORT_TITLES } from '@/lib/service-delivery';
export { canAutoGenerate, reportTitle, SERVICE_REPORT_TITLES };
import { analyseMobileAdvanced } from '@/lib/mobile-advanced/analysis';
import { renderMobileAdvancedPdf } from '@/lib/mobile-advanced/report';
import { analyseBabyName } from '@/lib/baby-name/analysis';
import { renderBabyNamePdf } from '@/lib/baby-name/report';
import { analyseDestiny, writeDestiny } from '@/lib/destiny/report';
import { analysePsychomatrix, writePsychomatrix } from '@/lib/psychomatrix/report';
import { analyseCompleteBusiness, parsePartners, splitNames, writeCompleteBusiness } from '@/lib/business/complete';
import { businessAnalytics } from '@/lib/business/engine';
import { runBusinessAgent } from '@/lib/business/agent';
import { matchCategories } from '@/lib/business/match';
import { runSignatureAgent, type SigImage } from '@/lib/signature/agent';
import { signatureNumbers } from '@/lib/signature/numbers';
import { classifyMetrics, inkColourOf, measureMultiPass, rgbaToGray, type MeasuredFeatures } from '@/lib/signature/measure';
import { renderSignatureReportPdf } from '@/lib/signature/report';
import { buildCover } from '@/lib/report/cover-server';
import { answerClientQuestions } from '@/lib/report/client-questions';
import { bizCoverRequest, bizReportHtml, chartCoverRequest, chartReportHtml, compatCoverRequest, compatReportHtml, type BizReportResult, type ChartResult } from '@/lib/report/print-html';

export type ReportLang = 'en' | 'hi';
export const REPORT_LANGS: ReportLang[] = ['en', 'hi'];
type Details = Record<string, string | undefined>;
const BY = 'Acharya Nandram';
const latin = (s?: string) => !!s && /[A-Za-z]/.test(s);
const personName = (d: Details) => (d.clientName || d.currentName || '').trim();
const gender3 = (g?: string): 'male' | 'female' | 'other' => (g === 'female' ? 'female' : g === 'other' ? 'other' : 'male');
const asOfIso = () => { const t = todayIST(); return `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`; };

export interface GeneratedReport { pdf: Uint8Array; fileName: string; pageCount: number }
export class DetailsIncompleteError extends Error { constructor() { super('DETAILS_INCOMPLETE'); } }

/** Writes the report of one order in one language. Throws DetailsIncompleteError when the details are not enough. */
export async function generateServiceReport(order: { serviceCode: string; details: Details; signatureImage?: string | null }, lang: ReportLang, account: { email?: string | null } = {}): Promise<GeneratedReport> {
  const code = order.serviceCode, d = order.details;
  if (!canAutoGenerate(code, d, { hasSignatureImage: !!order.signatureImage })) throw new DetailsIncompleteError();
  const who = personName(d) || 'client';
  const file = (name: string) => `${slug(name || 'client')}-${slug(SERVICE_REPORT_TITLES[code]?.en ?? 'numerology-report')}-${lang}.pdf`;
  const hi = lang === 'hi';
  const dob = isoDob(d.dob);
  const generatedAt = new Date().toISOString();
  // The client's own questions / problems from the booking, answered from their numbers (every report).
  const qa = await answerClientQuestions({ questions: d.questions, challenges: d.challenges, name: personName(d) || d.babyName, dob, gender: d.gender, serviceCode: code, lang }).catch(() => []);

  // Numerology engine services (Complete Life, Name Correction, Lo Shu, Couple, Personal Year)
  if (code in AUTO_REPORTS) {
    const input = intakeToClientInput(code, d, account)!;
    const spec = AUTO_REPORTS[code];
    const result = generateNumerology({ ...input, language: lang }, { modules: autoModules(code, input) });
    const narrative = await writeNarrative(result, lang, { ownerId: null });
    const style = await pdfStyleFor(null); // house branding (myNumerologist.com · Acharya Nandram)
    const out = await renderReportPdf({ result, narrative, language: lang, theme: style.theme, branding: style.branding, reportTitle: spec.title[lang], hiddenChapters: spec.hiddenChapters, questions: qa });
    return { pdf: out.pdf, fileName: file(input.fullName), pageCount: out.pageCount };
  }

  switch (code) {
    case 'SVC_MOBILE_NUMBER': {
      const [mobile, ...alternates] = mobilesIn(d);
      const result = analyseMobileAdvanced({ fullName: who, dob, gender: gender3(d.gender), mobile, alternates: alternates.slice(0, 5) });
      const { pdf, pageCount } = await renderMobileAdvancedPdf(result, { lang, preparedBy: BY, showFullNumber: true, questions: qa });
      return { pdf, fileName: file(who), pageCount: pageCount ?? 0 };
    }
    case 'SVC_BABY_NAME': {
      // Same reading of the booking as Admin → Baby name analysis.
      const parents = (d.parents ?? '').split(/\s*(?:&|,|\/|\band\b)\s*/i).map((x) => x.trim()).filter(Boolean);
      const father = d.fatherName?.trim() || parents[0] || '';
      const mother = d.motherName?.trim() || parents[1] || '';
      const surname = d.surname?.trim() || (father.split(/\s+/).length > 1 ? father.split(/\s+/).pop() ?? '' : '');
      const g = (d.gender ?? '').toLowerCase();
      const nt = d.nameType === 'formal' || d.nameType === 'nickname' ? d.nameType : 'both';
      const [p1, p2] = (d.babyName ?? '').trim().split(/\s*(?:\/|,|\(|\)|\balias\b|\bnickname\b)\s*/i).filter(Boolean);
      const cur = nt === 'nickname' ? { currentName: '', currentNickname: p1 ?? '' } : { currentName: p1 ?? '', currentNickname: nt === 'both' ? p2 ?? '' : '' };
      const result = analyseBabyName({
        dob, gender: g === 'male' || g === 'boy' ? 'boy' : g === 'female' || g === 'girl' ? 'girl' : 'any', surname, timeOfBirth: d.tob, placeOfBirth: d.pob,
        fatherName: father, motherName: mother, letters: d.letters, candidates: (d.consideredNames ?? '').split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 12),
        suggest: true, country: d.country || 'India', nameStyle: (d.nameStyle as never) || 'auto', nameFor: nt, ...cur,
      });
      const { pdf, pageCount } = await renderBabyNamePdf(result, { lang, preparedBy: BY, familyName: surname || undefined, questions: qa });
      return { pdf, fileName: file(surname ? `baby-${surname}` : 'baby'), pageCount: pageCount ?? 0 };
    }
    case 'SVC_DESTINY_MATRIX': case 'SVC_BIRTH_CHART': {
      const kind = code === 'SVC_DESTINY_MATRIX' ? 'destiny' : 'psychomatrix';
      const r: ChartResult = kind === 'destiny'
        ? (() => { const data = analyseDestiny({ name: who, dob, asOf: asOfIso() }); return { kind, name: data.name, dob: data.dob, report: { en: writeDestiny(data, 'en'), hi: writeDestiny(data, 'hi') }, generatedAt }; })()
        : (() => { const data = analysePsychomatrix({ name: who, dob }); return { kind, name: data.name, dob: data.dob, report: { en: writePsychomatrix(data, 'en'), hi: writePsychomatrix(data, 'hi') }, generatedAt }; })();
      const cover = await buildCover(chartCoverRequest(r, lang, BY));
      const out = await renderHtmlDocumentPdf(chartReportHtml(r, lang, BY, cover, qa), { title: `${r.report[lang].title} – ${r.name}`, subject: reportTitle(code, lang), language: lang });
      return { pdf: out.pdf, fileName: file(r.name), pageCount: out.pageCount };
    }
    case 'SVC_BUSINESS_NAME': case 'SVC_BUSINESS_COMPLETE': {
      const full = code === 'SVC_BUSINESS_COMPLETE';
      const data = analyseCompleteBusiness({
        owner: { name: d.clientName!.trim(), dob, gender: gender3(d.gender) }, names: splitNames(d.businessName || d.currentName || ''),
        businessType: full ? d.businesses : undefined, launchDate: full && d.launchDate ? d.launchDate : undefined,
        partners: full ? parsePartners(d.partners ?? '') : [], brandColours: full ? d.brand : undefined, businessMobile: full ? d.mobile : undefined, asOf: todayIST(),
      });
      const write = (l: ReportLang) => {
        const w = writeCompleteBusiness(data, l);
        if (full) return w;
        // Business Name service: the name chapters of the business engine, under the service's own title.
        return { ...w, title: reportTitle(code, l), subtitle: l === 'hi' ? 'नाम विश्लेषण · नाम सुधार · ब्रांड और लोगो' : 'Name analysis · Name correction · Brand & logo', sections: w.sections.filter((s) => ['overview', 'names', 'correction', 'brand', 'remedies'].includes(s.id)) };
      };
      const r: BizReportResult = { data, report: { en: write('en'), hi: write('hi') }, generatedAt };
      const cover = await buildCover(bizCoverRequest(r, lang, BY));
      const out = await renderHtmlDocumentPdf(bizReportHtml(r, lang, BY, cover, qa), { title: `${r.report[lang].title} – ${data.owner.name}`, subject: reportTitle(code, lang), language: lang });
      return { pdf: out.pdf, fileName: file(data.owner.name), pageCount: out.pageCount };
    }
    case 'SVC_BUSINESS_COMPAT': {
      const fullName = d.clientName!.trim();
      const m = matchCategories(d.businesses ?? '');
      const place = (d.pob || d.city || '').trim();
      const data = businessAnalytics({ fullName, dob: parseDate(dob), gender: gender3(d.gender), birthPlace: place || '–', businessName: d.currentName, mode: 'both', capital: 2, risk: 'medium', interests: [], shortlist: m.ids.slice(0, 20), asOf: todayIST() });
      const goals = [m.unmatched.length ? `Also considering (not in catalogue): ${m.unmatched.join(', ')}` : '', d.questions ?? ''].filter(Boolean).join('\n').slice(0, 1000);
      const ai = await runBusinessAgent({ fullName, dobText: dob, birthPlace: place, businessName: d.currentName, mode: 'business or profession', capitalLabel: 'Medium (₹5–50 lakh)', risk: 'medium', interests: [], goals: goals || undefined, language: lang }, data);
      const r = { data, ...ai, generatedAt };
      const opts = { by: BY, appendix: true, lang, meta: { dob: dob.split('-').reverse().join('-'), place, business: d.currentName } };
      const cover = await buildCover(compatCoverRequest(fullName, r, opts));
      const out = await renderHtmlDocumentPdf(compatReportHtml(fullName, r, opts, cover, qa), { title: `${reportTitle(code, lang)} – ${fullName}`, subject: reportTitle(code, lang), language: lang });
      return { pdf: out.pdf, fileName: file(fullName), pageCount: out.pageCount };
    }
    case 'SVC_SIGNATURE': {
      const image = order.signatureImage!;
      const fullName = d.clientName!.trim();
      const signatureName = latin(d.currentName) ? d.currentName!.trim() : undefined;
      const mt = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(image);
      const images: SigImage[] = mt ? [{ mediaType: mt[1] as SigImage['mediaType'], base64: mt[2] }] : [];
      // The same pixel measurements the admin screen makes in the browser, run on the uploaded photo.
      let measured: MeasuredFeatures = {}; let quality: number[] | undefined;
      try {
        const px = await decodeImageRgba(image);
        const m0 = measureMultiPass(rgbaToGray(px.rgba, px.width, px.height), { source: 'photo' });
        if (m0.strokeWidth) {
          const m = { ...m0, ink: inkColourOf(px.rgba, px.width, px.height) };
          measured = classifyMetrics(m, (signatureName || fullName).replace(/[^A-Za-z]/g, '').length);
          if (typeof m.quality?.score === 'number') quality = [Math.round(m.quality.score)];
        }
      } catch (e) { console.warn('[service-report] signature measurement skipped:', e instanceof Error ? e.message : e); }
      const numbers = signatureNumbers({ fullName, signatureName, dob: parseDate(dob), professionId: 'other', professionText: d.profession });
      const res = await runSignatureAgent({ fullName, signatureName, dobText: dob, gender: d.gender, profession: d.profession || 'Other', goals: [], concerns: d.questions?.slice(0, 1000), language: lang, images, observations: {}, measured, consistency: null, quality }, numbers);
      const { pdf, pageCount } = await renderSignatureReportPdf({
        client: { fullName, signatureName, dob, gender: d.gender, profession: d.profession || (hi ? 'अन्य' : 'Other'), goals: [], language: lang },
        preparedBy: BY, numbers, result: { analysis: res.analysis, source: res.source, scores: res.scores, features: res.features }, generatedAt, annotated: image, questions: qa,
      });
      return { pdf, fileName: file(fullName), pageCount: pageCount ?? 0 };
    }
  }
  throw new DetailsIncompleteError();
}
