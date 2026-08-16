import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MaxWidth = 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

interface PageContainerProps {
  children: ReactNode;
  /** Tailwind max-width token. Default: '7xl'. */
  maxWidth?: MaxWidth;
  /** Override outer className when needed. */
  className?: string;
}

const MAX_WIDTH_CLASS: Record<MaxWidth, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export function PageContainer({
  children,
  maxWidth = '7xl',
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        // Móvil (<md): p-4 + holgura inferior para la MobileTabBar flotante
        // (h-14 + inset + aire) más la safe-area del home indicator.
        //
        // 6.5rem y no 5.25: es la altura del fundido inferior de la tab bar. Si
        // el contenido terminase dentro de esa franja, la última fila se leería
        // atenuada al llegar al final del scroll. Los dos valores van juntos —
        // si cambia uno, cambia el otro (ver mobile-tab-bar.tsx).
        'flex flex-col gap-4 p-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:gap-6 sm:p-6 sm:pb-[calc(env(safe-area-inset-bottom)+6.5rem)] md:p-8 md:pb-8 mx-auto w-full',
        MAX_WIDTH_CLASS[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
