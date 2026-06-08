import { PhSportMark } from '@/components/layout/ph-sport-mark';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen">
      {/* Form panel — cream warm, form centrado vertical */}
      <div className="flex flex-1 flex-col justify-center bg-background px-8 py-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>

      {/* Brand panel — Charcoal Authority editorial, oculto en mobile */}
      <aside className="relative hidden overflow-hidden bg-panel text-panel-foreground lg:flex lg:flex-1">
        {/* Monograma como elemento arquitectónico de fondo (cropado abajo-derecha).
            Acento dorado al 8% — el "metal cepillado sutil" de la guía de marca. */}
        <PhSportMark
          decorative
          className="pointer-events-none absolute -bottom-16 -right-20 h-[78%] w-auto text-primary/[0.07]"
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="mono text-[11px] font-medium uppercase tracking-[0.32em] text-panel-foreground/70">
              PHSPORT — Career Performance Agency
            </span>
          </div>

          {/* Statement editorial — headline + apoyo */}
          <div className="flex max-w-xl flex-col gap-5">
            <h2 className="font-heading text-[clamp(2.75rem,5vw,4rem)] font-semibold leading-[0.96] tracking-[-0.02em] text-panel-foreground">
              Sin ruido.
              <br />
              Con intención.
            </h2>
            <p className="max-w-sm text-base leading-relaxed text-panel-foreground/65">
              Cada paso cuenta. Decisiones que duran.
            </p>
          </div>

          {/* Footer mono — tagline + año */}
          <div className="flex items-end justify-between">
            <span className="mono text-[10px] font-medium uppercase tracking-[0.32em] text-panel-foreground/50">
              Now. Next. Forever.
            </span>
            <span className="mono tabular text-[10px] font-medium uppercase tracking-[0.32em] text-panel-foreground/50">
              © {year}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

