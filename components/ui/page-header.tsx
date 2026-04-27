import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          {Icon ? <Icon className="h-8 w-8 text-primary" aria-hidden /> : null}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle ? (
          <p className="text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}
