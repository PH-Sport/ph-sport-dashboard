import { cn } from '@/lib/utils';

/**
 * Eyebrow — etiqueta técnica mono sobre títulos/datos (firma del lenguaje PHSPORT).
 * Tamaño/tracking/peso viven en el token `text-eyebrow` (tailwind.config).
 * Color por defecto muted; sobreescribir vía className (p.ej. text-primary).
 */
export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('font-mono text-eyebrow uppercase text-muted-foreground', className)}
      {...props}
    />
  );
}
