'use client';

import { cn } from '@/lib/utils';

interface RowSeparatorProps {
  /**
   * Sangria izquierda, medida desde el origen del propio separador.
   *
   * `'text'` (16px) para listas sin leading. Para las que lo tienen, pasa los
   * px EXACTOS a los que empieza el texto de esa lista: el separador no puede
   * deducirlos, porque salen del padding de la fila + el ancho del leading +
   * el gap, y cada lista los tiene distintos. Se miden en el sitio de llamada,
   * donde esos tres valores estan a la vista.
   *
   * Nunca va de borde a borde: eso encerraria en vez de separar (spec §3 R3).
   */
  inset?: 'text' | number;
  className?: string;
}

export function RowSeparator({ inset = 'text', className }: RowSeparatorProps) {
  return (
    <div
      aria-hidden
      // Estilo en linea y no una clase: el valor es calculado por lista, y
      // Tailwind solo genera las clases que ve escritas literalmente.
      style={typeof inset === 'number' ? { marginLeft: `${inset}px` } : undefined}
      className={cn(
        'h-px bg-border',
        inset === 'text' && 'ml-md',
        // En escritorio la separacion la siguen haciendo el hover y el espaciado.
        'md:hidden',
        className
      )}
    />
  );
}
