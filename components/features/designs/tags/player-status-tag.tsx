import { AlertCircle, Ban, HelpCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlayerStatus = 'injured' | 'suspended' | 'doubt' | 'last_minute';

interface PlayerStatusTagProps {
  status: PlayerStatus;
  className?: string;
  variant?: 'default' | 'compact';
}

export const PLAYER_STATUS_CONFIG = {
  injured: {
    label: 'Lesionado',
    icon: AlertCircle,
    color: 'text-destructive bg-destructive/10 border-destructive/30',
  },
  suspended: {
    label: 'Sancionado',
    icon: Ban,
    color: 'text-primary bg-primary/10 border-primary/30',
  },
  doubt: {
    label: 'Duda',
    icon: HelpCircle,
    color:
      'text-status-warning bg-status-warning/10 border-status-warning/30',
  },
  last_minute: {
    label: 'Última hora',
    icon: Clock,
    color:
      'text-status-info bg-status-info/10 border-status-info/30',
  },
};

export function PlayerStatusTag({ status, className, variant = 'default' }: PlayerStatusTagProps) {
  const config = PLAYER_STATUS_CONFIG[status];
  
  if (!config) return null;

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "inline-flex items-center justify-center p-1 rounded-md border",
          config.color,
          className
        )}
        title={config.label}
      >
        <config.icon className="h-3 w-3" />
      </div>
    );
  }

  return (
    <div className={cn(
      "shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border",
      config.color,
      className
    )}>
      <config.icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}
