import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge solo deshace conflictos entre clases que conoce, y los tokens
 * propios de este proyecto no vienen en su tabla. Sin declararlos comete dos
 * errores opuestos: borra `text-eyebrow` creyéndolo un color que compite con
 * `text-muted-foreground`, y NO deshace `shadow-raised` frente a `shadow-none`,
 * con lo que la sombra que el código creía quitada seguía pintándose.
 *
 * Lo segundo costó una regresión invisible en la fase 1 del rediseño móvil.
 * Cubierto por lib/utils/cn.test.ts.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Escala tipográfica (tailwind.config.ts → fontSize)
      'font-size': [
        { text: ['page-title', 'section', 'card-title', 'body', 'caption', 'eyebrow'] },
      ],
      // Modelo de elevación mate (tailwind.config.ts → boxShadow)
      'shadow': [{ shadow: ['raised', 'overlay'] }],
      // Superficie agrupada iOS (tailwind.config.ts → borderRadius)
      'rounded': [{ rounded: ['surface'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDefaultWeekRange(daysBack = 7, daysForward = 21) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysBack);
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + daysForward);
  return { weekStart, weekEnd, now };
}

export function formatDateTimeLocal(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}







