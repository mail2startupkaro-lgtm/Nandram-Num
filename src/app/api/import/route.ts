import { generateNumerology } from '@/lib/numerology';
import { importProfiles, parseImportCsv, parseImportJson } from '@/lib/portable';
import { json, withUser } from '@/lib/server/http';
import { assertCanAddProfiles, getAccount } from '@/lib/billing/entitlements';
import { PaymentRequiredError } from '@/lib/server/http';
import { writeNarrative } from '@/lib/server/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * POST raw file body (application/json or text/csv) or multipart form with "file".
 *   ?generate=1  also create a report (numbers + narrative) for profiles imported without one (e.g. CSV rows)
 *   ?dryRun=1    validate only
 */
export const POST = withUser(async (req, user) => {
  const u = new URL(req.url);
  let text: string, name = '';
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('multipart/form-data')) {
    const f = (await req.formData()).get('file');
    if (!(f instanceof File)) return json({ error: 'VALIDATION', issues: [{ where: 'file', message: 'No file uploaded.' }] }, 422);
    if (f.size > MAX_BYTES) return json({ error: 'TOO_LARGE' }, 413);
    text = await f.text(); name = f.name;
  } else {
    text = await req.text();
    if (text.length > MAX_BYTES) return json({ error: 'TOO_LARGE' }, 413);
  }
  const isCsv = /\.csv$/i.test(name) || ct.includes('text/csv') || (!text.trimStart().startsWith('{') && !text.trimStart().startsWith('['));
  const parsed = isCsv ? parseImportCsv(text) : parseImportJson(text);
  if (u.searchParams.get('dryRun') === '1') return json({ sourceVersion: parsed.sourceVersion, valid: parsed.profiles.length, issues: parsed.issues });
  if (parsed.profiles.length > 1 && !(await getAccount(user.id)).features.bulk) throw new PaymentRequiredError('feature:bulk');
  await assertCanAddProfiles(user, parsed.profiles.length);
  const outcome = await importProfiles(user.id, parsed, {
    createReports: u.searchParams.get('generate') === '1'
      ? async (input) => { const result = generateNumerology(input); return { result, narrative: await writeNarrative(result, input.language, { ownerId: user.id }) }; }
      : undefined,
  });
  return json({ sourceVersion: parsed.sourceVersion, ...outcome }, outcome.created.length ? 201 : 422);
});
