import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** Iniciales a partir del nombre: 2 letras (primera de nombre y apellido) o 1 si es una sola palabra. */
export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UserAvatarProps {
  /** Nombre de la persona; se usa para iniciales y alt. */
  name?: string | null;
  /** URL del avatar (avatar_url). Si falta, se muestran las iniciales. */
  src?: string | null;
  /** Clases para la burbuja (tamaño/forma): p.ej. "h-8 w-8". */
  className?: string;
  /** Clases para el fallback (color de fondo/texto): p.ej. "bg-primary/10 text-primary". */
  fallbackClassName?: string;
  /** Contenido de fallback personalizado (icono, "?", etc.). Si se omite, se usan las iniciales. */
  fallback?: React.ReactNode;
  /** Texto alternativo; por defecto el nombre. */
  alt?: string;
}

/**
 * Burbuja de avatar de usuario unificada para toda la app.
 * Muestra la foto (`src`) si existe; si no, cae a iniciales (o un fallback custom).
 * El tamaño y los colores se controlan con `className` y `fallbackClassName` para
 * encajar en cada contexto (topbar, tablas, tarjetas, dashboards...).
 */
export function UserAvatar({
  name,
  src,
  className,
  fallbackClassName,
  fallback,
  alt,
}: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt={alt ?? name ?? ''} /> : null}
      <AvatarFallback className={fallbackClassName}>
        {fallback ?? getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
