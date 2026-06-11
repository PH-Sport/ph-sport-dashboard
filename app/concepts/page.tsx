import Link from 'next/link';

/**
 * Índice de conceptos visuales — 3 direcciones para el nuevo look de PHSPORT.
 * Páginas de preview con datos de ejemplo; no tocan la app real.
 */

const CONCEPTS = [
  {
    id: 'd',
    name: 'Síntesis',
    tagline: 'A × C — la dirección elegida',
    description:
      'La distribución de cabina de la A (sidebar, triage, dos columnas, ancho aprovechado) construida con los materiales de la C (placas suaves, avatares, pills). Con todo: filtro por diseñador, vista Lista/Calendario, y los modales de crear/detalle funcionando. Miembros vive en Ajustes con cards clicables.',
    knobs: 'Sidebar rail · placas a densidad media-alta · modales glass · ancho real',
    highlight: true,
  },
  {
    id: 'a',
    name: 'Cabina',
    tagline: 'Sala de mando',
    description:
      'Rail de iconos + una sola superficie dividida por hairlines. Denso, técnico, mono tabular como protagonista. Cero cards flotantes. Para sentir la app como un puesto de control.',
    knobs: 'Rail 56px · rejilla hairline · densidad alta · dorado mínimo',
    highlight: false,
  },
  {
    id: 'b',
    name: 'Editorial',
    tagline: 'Programa de partido · descartado',
    description:
      'Sin sidebar: cabecera tipo revista, territorios de marca, tipografía gigante. Descartado: lee como newsletter, no como herramienta diaria.',
    knobs: 'Top-bar · columna asimétrica · densidad baja · Now/Next/Forever',
    highlight: false,
  },
  {
    id: 'c',
    name: 'Club',
    tagline: 'Túnel VIP',
    description:
      'Dock flotante de cristal esmerilado abajo, placas redondeadas con profundidad y el único momento de brillo Champions (halo dorado). Cálido, premium, hospitality.',
    knobs: 'Dock glass · placas elevadas · densidad media · halo Champions',
    highlight: false,
  },
];

export default function ConceptsIndex() {
  return (
    <div className="dark min-h-dvh bg-[hsl(220,14%,7%)] text-foreground antialiased">
      <main className="mx-auto max-w-3xl px-6 py-2xl">
        <p className="font-mono text-eyebrow uppercase text-primary">PHSPORT · Rediseño</p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
          Tres direcciones para el nuevo look
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Tres mini-apps navegables completas — Inicio, Semana, Diseños, Miembros y Ajustes — con
          los mismos datos, en tres lenguajes visuales genuinamente distintos. Navega cada una con
          su propio menú; el conmutador flotante te lleva a la misma página del otro concepto. Elige
          una — o mezcla: «el shell de la A con la densidad de la C» también vale.
        </p>

        <div className="mt-2xl space-y-lg">
          {CONCEPTS.map((c) => (
            <Link
              key={c.id}
              href={`/concepts/${c.id}`}
              className={
                c.highlight
                  ? 'group block rounded-2xl border border-primary/40 bg-card p-xl shadow-overlay transition-colors hover:border-primary/70'
                  : 'group block rounded-2xl border border-border bg-card p-xl transition-colors hover:border-primary/40'
              }
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  <span className="mr-3 font-mono text-base uppercase text-primary">{c.id}</span>
                  {c.name}
                  <span className="ml-3 text-base font-normal text-muted-foreground">
                    — {c.tagline}
                  </span>
                </h2>
                <span className="shrink-0 text-sm text-muted-foreground transition-colors group-hover:text-primary">
                  Abrir →
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
                {c.knobs}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-2xl border-t border-border pt-lg text-center font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground/50">
          Sin ruido · Con intención
        </p>
      </main>
    </div>
  );
}
