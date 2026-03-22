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
    color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30 border-red-200 dark:border-red-800' 
  },
  suspended: { 
    label: 'Sancionado', 
    icon: Ban, 
    color: 'text-gold-700 bg-gold-100 dark:text-gold-400 dark:bg-gold-950/40 border-gold-200 dark:border-gold-800' 
  },
  doubt: { 
    label: 'Duda', 
    icon: HelpCircle, 
    color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' 
  },
  last_minute: { 
    label: 'Última hora', 
    icon: Clock, 
    color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' 
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
