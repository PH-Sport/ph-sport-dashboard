/** Piezas editoriales compartidas del CONCEPTO B. */

export function SectionRule({ label, index }: { label: string; index: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-mono text-eyebrow uppercase text-primary">{index}</span>
      <span className="font-mono text-eyebrow uppercase text-muted-foreground">{label}</span>
      <span className="h-px flex-1 self-center bg-border" />
    </div>
  );
}

export function PageMast({ kicker, title }: { kicker: string; title: string }) {
  return (
    <section className="pb-xl pt-2xl">
      <p className="font-mono text-eyebrow uppercase text-muted-foreground">{kicker}</p>
      <h1 className="mt-3 font-heading text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight">
        {title}
      </h1>
    </section>
  );
}
