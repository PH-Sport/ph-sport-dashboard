import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { surfaceClasses, type SurfaceVariant } from '@/lib/ui/surface-variants';

interface SurfaceProps {
  /** 'grouped' = bloque tonal (grupos con significado). 'plain' = a sangre (misma fila repetida). */
  variant?: SurfaceVariant;
  /** Padding interior. Desactivalo cuando las filas de dentro ya traigan el suyo. */
  padded?: boolean;
  as?: 'div' | 'section';
  className?: string;
  children: ReactNode;
}

/**
 * Superficie de contenido (spec §8.1).
 *
 * Movil: agrupa por tono, sin borde ni sombra — el borde repetiria lo que el
 * tono ya dice. Escritorio (md:): intacto respecto a hoy.
 *
 * No lleva NUNCA glass: es capa de contenido, no funcional (spec §3 R1).
 */
export function Surface({
  variant = 'grouped',
  padded = true,
  as: Tag = 'div',
  className,
  children,
}: SurfaceProps) {
  return (
    <Tag
      className={cn(
        surfaceClasses(variant),
        // grouped: padding en movil y escritorio. plain: solo en escritorio,
        // porque en movil el padding lo pone cada fila.
        padded && (variant === 'grouped' ? 'p-md sm:p-lg' : 'md:p-lg'),
        className
      )}
    >
      {children}
    </Tag>
  );
}
