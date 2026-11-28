/**
 * Report headings in Title Case: the first letter of every word is a capital (owner's rule, 27 Nov 2026).
 *
 *   titleCase('What your signature shows') → 'What Your Signature Shows'
 *
 * Only lower-case first letters are raised; nothing is lowered, so "LO SHU", "CEO" and names stay as written.
 * Tokens that are not plain words are left alone: numbers ("1.5×"), e-mail / web addresses and handles
 * (myNumerologist.com, @MYNUMEROLOGIST8), abbreviations with dots ("e.g.") and brand spellings like "iPhone".
 * Hindi (Devanagari) has no capital letters and is unchanged.
 *
 * TITLE_CASE_SCRIPT applies the same rule to every heading of a rendered report page.
 */

import { HINDI_POLISH_SCRIPT } from './hindi-polish';

const SKIP = /[@/\\]|\.\p{L}|^\p{N}|^\p{Ll}+\p{Lu}/u;

/** Capitalises the first letter of every word (and of each part of a hyphenated word). */
export function titleCase(s: string): string {
  return s.replace(/\S+/g, (tok) => {
    const core = tok.replace(/^[^\p{L}\p{N}@]+/u, '');
    if (!core || SKIP.test(core)) return tok;
    return tok.replace(/(^|[-‑])([^\p{L}\p{N}]*)(\p{Ll})/gu, (_m, a: string, p: string, c: string) => a + p + c.toUpperCase());
  });
}

/**
 * Browser script that title-cases every heading of the page it runs in (returns the number of changed text nodes).
 * Written as plain JavaScript in a string, so bundlers cannot add helper calls to it: the PDF engine runs it with
 * `page.evaluate`, and the browser-printed reports add it to their print window with `withTitleCase`.
 * Headings: h1–h6 and the heading classes of the report templates. Generic classes (.serif, .ct) count only when
 * the text is short and not a sentence. Elements inside class "no-tc" are skipped. A word split over two text
 * nodes (<b>R</b>ahul) is not capitalised in the middle.
 */
export const TITLE_CASE_SCRIPT = `(function (doc) {
  var SEL = 'h1,h2,h3,h4,h5,h6,.ch-title,.kicker,.sec-h,.ttl,.toc li,.toc-row .t,.cr-t,.xs-h,.ct,.serif,[data-tc]';
  var NAMED = '.ch-title,.kicker,.sec-h,.ttl,.toc li,.toc-row .t,.cr-t,.xs-h,[data-tc]';
  var SKIP = /[@\\/\\\\]|\\.\\p{L}|^\\p{N}|^\\p{Ll}+\\p{Lu}/u;
  function word(tok) {
    var core = tok.replace(/^[^\\p{L}\\p{N}@]+/u, '');
    if (!core || SKIP.test(core)) return tok;
    return tok.replace(/(^|[-\\u2011])([^\\p{L}\\p{N}]*)(\\p{Ll})/gu, function (m, a, p, c) { return a + p + c.toUpperCase(); });
  }
  var changed = 0, done = new Set();
  var els = Array.prototype.slice.call(doc.querySelectorAll(SEL));
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (done.has(el) || el.closest('.no-tc,script,style,code,pre')) continue;
    var text = (el.textContent || '').trim();
    if (!text) continue;
    if (!/^H[1-6]$/.test(el.tagName) && !el.matches(NAMED) && (text.length > 80 || /[.!?\\u0964]$/.test(text))) continue;
    el.querySelectorAll('*').forEach(function (c) { done.add(c); });
    var walker = doc.createTreeWalker(el, 4), prev = ' ', n;
    while ((n = walker.nextNode())) {
      var data = n.data;
      if (n.parentElement && n.parentElement.closest('.no-tc,script,style,code')) { if (data) prev = data.slice(-1); continue; }
      var lead = /^\\S+/.exec(data), out;
      if (lead && /\\p{L}/u.test(prev)) out = lead[0] + data.slice(lead[0].length).replace(/\\S+/g, word);
      else out = data.replace(/\\S+/g, word);
      if (out !== data) { n.data = out; changed++; }
      if (data) prev = data.slice(-1);
    }
  }
  return changed;
})(document)`;

/** Adds the heading script (and, on Hindi pages, the Hindi clean-up) to a printable report page; runs before the print dialog opens. */
export function withTitleCase(html: string): string {
  const tag = `<script>${HINDI_POLISH_SCRIPT};${TITLE_CASE_SCRIPT};</script>`;
  return html.includes('</body>') ? html.replace(/<\/body>(?![\s\S]*<\/body>)/, `${tag}</body>`) : html + tag;
}
