import { getProfile } from '@/lib/db/repo/profiles';
import { renderInputSheetPdf } from '@/lib/pdf/sheets';
import { pdfStyleFor } from '@/lib/branding';
import { pdfResponse, slug, withUser } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const GET = withUser<{ id: string }>(async (req, user, { params }) => {
  const p = await getProfile(user.id, params.id);
  const u = new URL(req.url);
  const out = await renderInputSheetPdf(
    { input: p.input, aadhaarLast4: p.aadhaarLast4, consentAt: p.consentAt, profileId: p.id, isoDate: new Date().toISOString().slice(0, 10) },
    { ...(await pdfStyleFor(user.id, u.searchParams.get('theme'))), language: p.input.language },
  );
  return pdfResponse(out.pdf, `${slug(p.displayName)}-input-sheet.pdf`);
});
