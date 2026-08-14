'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { usePageTitleReporter } from '@/components/layout/page-title-context';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: ReactNode;
  /** Optional Lucide icon component rendered next to the title. */
  icon?: LucideIcon;
  /** Optional subtitle/description shown beneath the title. */
  subtitle?: ReactNode;
  /** Right-side slot for primary actions (buttons, dropdowns, etc.). */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  icon: Icon,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const report = usePageTitleReporter();

  // Large title al estilo iOS: mientras el <h1> se ve, la barra va desnuda;
  // cuando pasa por debajo de ella, la barra recoge el testigo.
  useEffect(() => {
    const el = titleRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => report(!entry.isIntersecting),
      // El título cuenta como recogido cuando sale de la pantalla, sin recortar
      // el viewport por arriba. Antes se le descontaba el alto de la barra,
      // porque la barra empujaba el contenido y el título nacía por debajo de
      // ella. Desde que la barra flota, el título arranca DENTRO de esa franja:
      // con aquel descuento se daba por pasado nada más cargar, la barra se
      // ponía opaca al instante y el título grande no llegaba a verse nunca.
      { rootMargin: '0px', threshold: 0 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      // Al desmontar (navegación) la siguiente página arranca arriba del todo.
      report(false);
    };
  }, [report]);

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4',
        className
      )}
    >
      {/* En móvil la barra flota sobre esta fila, así que el título le cede sitio
          a la campana y al avatar: 44+44 de controles, más su gap y el padding de
          la barra, son 108px desde el borde; con el p-4 del contenedor, 96 aquí
          bastan. En md+ la barra vuelve a empujar el contenido y no hace falta. */}
      <div className="min-w-0 pr-24 md:pr-0">
        <h1
          ref={titleRef}
          className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3"
        >
          {Icon ? <Icon className="h-7 w-7 md:h-8 md:w-8 text-primary" aria-hidden /> : null}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle ? (
          <p className="text-sm md:text-base text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}
