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
        'flex flex-col gap-6 p-6 md:p-8 mx-auto w-full',
        MAX_WIDTH_CLASS[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
