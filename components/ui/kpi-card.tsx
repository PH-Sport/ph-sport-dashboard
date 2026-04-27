import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function KpiCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  className,
  variant = 'default',
}: KpiCardProps) {
  const variantStyles = {
    default: 'text-primary',
    primary: 'text-[hsl(var(--status-info))]',
    success: 'text-[hsl(var(--status-success))]',
    warning: 'text-[hsl(var(--status-warning))]',
    danger: 'text-destructive',
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={cn('text-sm font-medium', variantStyles[variant])}>
            {title}
          </CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-primary">{value}</div>
        {description && (
          <p className="text-sm text-muted-foreground mt-2">{description}</p>
        )}
        {trend && (
          <div className="mt-2">
            <p
              className={cn(
                'text-xs',
                trend.isPositive
                  ? 'text-[hsl(var(--status-success))]'
                  : 'text-destructive'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value} {trend.label}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



