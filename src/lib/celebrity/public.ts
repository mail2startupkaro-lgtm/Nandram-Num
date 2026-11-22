/** Cached reads of PUBLISHED celebrity posts for the public blog (Admin publish / edit / delete clears the cache). */
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { getCelebPost, listCelebPosts, type CelebListItem, type CelebRow } from './store';

export const CELEB_TAG = 'celebrity-posts';

const loadList = unstable_cache(async () => listCelebPosts({ publishedOnly: true }), ['celeb-list-v1'], { tags: [CELEB_TAG], revalidate: 3600 });
const loadOne = unstable_cache(async (slug: string) => getCelebPost(slug, { publishedOnly: true }), ['celeb-post-v1'], { tags: [CELEB_TAG], revalidate: 3600 });

/** Published posts, newest first; [] when there is no database (build / preview). */
export async function publishedCelebPosts(): Promise<CelebListItem[]> {
  try { return await loadList(); } catch { return []; }
}
export async function publishedCelebPost(slug: string): Promise<CelebRow | null> {
  if (!/^[a-z0-9-]{3,140}$/.test(slug)) return null;
  try { return await loadOne(slug); } catch { return null; }
}

/** Call after any change so the blog, the post and the sitemap show it at once. */
export function refreshCelebPages(...slugs: (string | null | undefined)[]) {
  revalidateTag(CELEB_TAG);
  revalidatePath('/blog');
  revalidatePath('/blog/celebrity');
  for (const s of slugs) if (s) revalidatePath(`/blog/celebrity/${s}`);
}
