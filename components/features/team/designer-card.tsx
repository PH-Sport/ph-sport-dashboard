'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/eyebrow';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import type { Design } from '@/lib/types/design';

interface DesignerWithDesigns {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  designs: Design[];
}

interface DesignerCardProps {
  designer: DesignerWithDesigns;
  onClick: () => void;
}

const OVERLOAD_THRESHOLD = 5;

/**
 * Card de diseñador — lidera con la CARGA real (pendientes), que es lo que
 * el Manager necesita para repartir. El "% completado" medía lo equivocado:
 * 1/1 entregado parecía "libre" y 2/10 parecía "atrasado".
 */
export function DesignerCard({ designer, onClick }: DesignerCardProps) {
  const designs = designer.designs;
  const total = designs.length;
  const pending = designs.filter((d) => d.status === 'BACKLOG').length;
  const delivered = designs.filter((d) => d.status === 'DELIVERED').length;
  const overloaded = pending > OVERLOAD_THRESHOLD;

  return (
    <Card
      elevation="raised"
      className="cursor-pointer hover:border-primary/40"
      onClick={onClick}
    >
      <CardContent className="space-y-4 pt-lg">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={designer.full_name}
            src={designer.avatar_url}
            className="h-10 w-10 shrink-0"
            fallbackClassName="bg-primary/10 text-primary font-semibold"
          />
          <span className="truncate text-card-title">{designer.full_name}</span>
        </div>

        {total === 0 ? (
          <p className="text-sm text-muted-foreground">Sin diseños asignados esta semana.</p>
        ) : (
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow>Pendientes</Eyebrow>
              <p
                className={cn(
                  'font-mono tabular text-4xl font-semibold leading-tight',
                  overloaded ? 'text-status-warning' : 'text-foreground'
                )}
              >
                {pending}
              </p>
            </div>
            <div className="space-y-1.5 text-right">
              {overloaded && <Badge variant="warning">Sobrecarga</Badge>}
              <p className="mono tabular text-xs text-muted-foreground">
                <span className="font-medium text-status-success">{delivered}</span> entregados ·{' '}
                {total} total
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
