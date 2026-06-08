import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  icon?: LucideIcon;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const VALUE_TONE: Record<NonNullable<KpiCardProps['variant']>, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-destructive',
};

export function KpiCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  className,
  variant = 'default',
}: KpiCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </span>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />}
        </div>
        <div
          className={cn(
            'mono text-[2.75rem] font-semibold leading-none tracking-tight tabular',
            VALUE_TONE[variant]
          )}
        >
          {value}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              'text-xs font-medium',
              trend.isPositive
                ? 'text-status-success'
                : 'text-destructive'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value} {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
