import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { generateCelebPost, translateCelebPost } from '@/lib/celebrity/agent';
import { CelebInputError, celebNumbers } from '@/lib/celebrity/numbers';
import { PostSchema, type CelebPost } from '@/lib/celebrity/post';
import { deleteCelebPost, getCelebPostById, listCelebPosts, saveCelebPost, setCelebStatus, SlugTakenError } from '@/lib/celebrity/store';
import { refreshCelebPages } from '@/lib/celebrity/public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Saved celebrity posts (all statuses), or one post with ?id=. */
export const GET = withAdmin(async (req) => {
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (id) { const row = await getCelebPostById(id); return row ? json({ row }) : json({ error: 'NOT_FOUND' }, 404); }
  return json({ posts: await listCelebPosts() });
});

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('generate'), name: z.string().trim().min(2).max(120), dob: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date of birth') }),
  z.object({ action: z.literal('hindi'), post: PostSchema }),
  z.object({ action: z.literal('save'), id: z.number().int().positive().nullable(), status: z.enum(['draft', 'published']), post: PostSchema }),
  z.object({ action: z.literal('status'), id: z.number().int().positive(), status: z.enum(['draft', 'published']) }),
  z.object({ action: z.literal('delete'), id: z.number().int().positive() }),
]);

const placeholder = (s: string) => /\[(Add|यहाँ)[^\]]*\]/.test(s);

export const POST = withAdmin(async (req, user) => {
  const b = Body.parse(await readJson(req, 3_000_000));
  try {
    if (b.action === 'generate' || b.action === 'hindi') {
      const rl = rateLimit(`celeb:${user.id}`, 40, 60 * 60_000);
      if (!rl.ok) return tooMany(rl.retryAfter);
    }
    if (b.action === 'generate') return json(await generateCelebPost(b.name, b.dob));
    if (b.action === 'hindi') {
      const post = b.post as CelebPost;
      return json(await translateCelebPost(post));
    }
    if (b.action === 'save') {
      const post = b.post as CelebPost;
      // Numbers are always re-calculated on the server, so a published post can never carry wrong figures.
      post.numbers = celebNumbers(post.name, post.dob);
      if (b.status === 'published' && (placeholder(JSON.stringify(post.en)) || (post.hi && placeholder(JSON.stringify(post.hi))))) {
        return json({ error: 'VALIDATION', issues: [{ path: 'content', message: 'Replace the “[Add … here]” placeholder in the background section before publishing.' }] }, 422);
      }
      const row = await saveCelebPost(post, b.status, b.id);
      refreshCelebPages(row.slug);
      return json({ row });
    }
    if (b.action === 'status') {
      const row = await setCelebStatus(b.id, b.status);
      if (!row) return json({ error: 'NOT_FOUND' }, 404);
      refreshCelebPages(row.slug);
      return json({ row });
    }
    const slug = await deleteCelebPost(b.id);
    refreshCelebPages(slug);
    return json({ ok: !!slug });
  } catch (e) {
    if (e instanceof CelebInputError) return json({ error: 'VALIDATION', issues: [{ path: e.field, message: e.message }] }, 422);
    if (e instanceof SlugTakenError) return json({ error: 'SLUG_TAKEN', issues: [{ path: 'slug', message: e.message }] }, 409);
    const code = (e as { code?: string }).code;
    if (code === 'AI_FAILED' || code === 'AI_REJECTED') return json({ error: code, message: (e as Error).message }, 502);
    throw e;
  }
});
