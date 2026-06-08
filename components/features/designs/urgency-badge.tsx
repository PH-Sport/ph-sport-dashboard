import { AlertTriangle, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Design } from '@/lib/types/design';

interface UrgencyBadgeProps {
  design: Pick<Design, 'status' | 'deadline_at'>;
}

/** Badge de urgencia según horas hasta deadline. Devuelve null para DELIVERED o sin urgencia. */
export function UrgencyBadge({ design }: UrgencyBadgeProps) {
  if (design.status === 'DELIVERED') return null;

  const hoursUntil = (new Date(design.deadline_at).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < 0) {
    return <Badge variant="destructive" className="shrink-0">Atrasado</Badge>;
  }
  if (hoursUntil < 24) {
    return (
      <Badge variant="destructive" className="shrink-0 gap-1">
        <Flame className="h-3 w-3" />
        {Math.floor(hoursUntil)}h
      </Badge>
    );
  }
  if (hoursUntil < 48) {
    return (
      <Badge variant="warning" className="shrink-0 gap-1">
        <AlertTriangle className="h-3 w-3" />
        {Math.floor(hoursUntil)}h
      </Badge>
    );
  }
  return null;
}
