import { AlertCircle, Ban, HelpCircle, Clock } from 'lucide-react';

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
