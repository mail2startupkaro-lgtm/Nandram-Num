/**
 * Bilingual text for server AND client components. Both languages are rendered; CSS shows the active one
 * (html[data-lang], set before first paint), so switching is instant and there is no hydration mismatch.
 */
import * as React from 'react';

export interface BiText { en: string; hi: string }
export const bi = (en: string, hi: string): BiText => ({ en, hi });

/** Inline text: <Bi en="Lucky days" hi="शुभ दिन" /> */
export function Bi({ en, hi }: { en: React.ReactNode; hi: React.ReactNode }) {
  return (
    <>
      <span className="lang-en" lang="en">{en}</span>
      <span className="lang-hi" lang="hi">{hi}</span>
    </>
  );
}

/** Block content (paragraphs, sections, whole page bodies) in two languages. */
export function BiBlock({ en, hi, className }: { en: React.ReactNode; hi: React.ReactNode; className?: string }) {
  return (
    <>
      <div className={className ? `lang-en ${className}` : 'lang-en'} lang="en">{en}</div>
      <div className={className ? `lang-hi ${className}` : 'lang-hi'} lang="hi">{hi}</div>
    </>
  );
}

/** Renders the same tree twice, once per language: <ForLang>{(l) => <Card lang={l} />}</ForLang> */
export function ForLang({ children, className }: { children: (lang: 'en' | 'hi') => React.ReactNode; className?: string }) {
  return <BiBlock className={className} en={children('en')} hi={children('hi')} />;
}
