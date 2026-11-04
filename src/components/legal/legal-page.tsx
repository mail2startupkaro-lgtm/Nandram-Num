export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { h: string; p: string[] }[] }) {
  return (
    <div className="container max-w-3xl space-y-6 py-10 sm:py-14">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
      <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">Template text – replace the bracketed details and have it reviewed by your lawyer before launch.</p>
      {sections.map((s) => (
        <section key={s.h} className="space-y-2"><h2 className="text-2xl font-semibold">{s.h}</h2>{s.p.map((p) => <p key={p} className="leading-relaxed text-foreground/90">{p}</p>)}</section>
      ))}
    </div>
  );
}
