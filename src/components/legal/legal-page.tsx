import { BiBlock } from '@/components/i18n/bi';

type Sections = { h: string; p: string[] }[];

function Body({ title, updated, sections, lang }: { title: string; updated: string; sections: Sections; lang: 'en' | 'hi' }) {
  return (
    <>
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{lang === 'hi' ? 'अंतिम अद्यतन' : 'Last updated'}: {updated}</p>
      {lang === 'hi' && <p className="rounded-md border border-gold/30 bg-gold/5 p-3 text-xs text-muted-foreground">यह हिंदी अनुवाद आपकी सुविधा के लिए है। किसी भी अंतर की स्थिति में अंग्रेज़ी संस्करण मान्य होगा।</p>}
      {sections.map((s) => (
        <section key={s.h} className="space-y-2"><h2 className="text-2xl font-semibold">{s.h}</h2>{s.p.map((p) => <p key={p} className="leading-relaxed text-foreground/90">{p}</p>)}</section>
      ))}
    </>
  );
}

/** Legal page in English and Hindi. The English text is the binding version. */
export function LegalPage({ title, updated, sections, hi }: { title: string; updated: string; sections: Sections; hi?: { title: string; updated: string; sections: Sections } }) {
  return (
    <div className="container max-w-3xl py-10 sm:py-14">
      {hi
        ? <BiBlock className="space-y-6" en={<Body title={title} updated={updated} sections={sections} lang="en" />} hi={<Body title={hi.title} updated={hi.updated} sections={hi.sections} lang="hi" />} />
        : <div className="space-y-6"><Body title={title} updated={updated} sections={sections} lang="en" /></div>}
    </div>
  );
}
