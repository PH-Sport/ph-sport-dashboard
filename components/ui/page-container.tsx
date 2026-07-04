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
        // Móvil: p-4 + safe-area inferior (home indicator); crece a p-6/p-8 con la pantalla
        'flex flex-col gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-6 sm:p-6 sm:pb-6 md:p-8 md:pb-8 mx-auto w-full',
        MAX_WIDTH_CLASS[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
