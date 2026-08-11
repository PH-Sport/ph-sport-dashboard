'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { usePageTitleReporter } from '@/components/layout/page-title-context';
import { cn } from '@/lib/utils';

/** Alto de la barra en móvil (h-14). El título se da por colapsado al cruzarla. */
const HEADER_HEIGHT = 56;

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
      // Recorta el viewport por arriba con el alto de la barra: el título cuenta
      // como oculto justo al pasar bajo ella, no al salir de la pantalla.
      { rootMargin: `-${HEADER_HEIGHT}px 0px 0px 0px`, threshold: 0 }
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
      <div className="min-w-0">
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
