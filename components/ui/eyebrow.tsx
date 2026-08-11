import { cn } from '@/lib/utils';

/**
 * Eyebrow — rótulo de sección sobre títulos/datos.
 * Tamaño/peso viven en el token `text-eyebrow` (tailwind.config): footnote de iOS,
 * caja de frase, sin tracking. Ni mono ni mayúsculas: esa era voz de terminal.
 * Color por defecto muted; sobreescribir vía className (p.ej. text-primary).
 */
export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('text-eyebrow text-muted-foreground', className)} {...props} />;
}
