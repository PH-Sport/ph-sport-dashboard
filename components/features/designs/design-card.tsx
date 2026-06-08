'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
import { UrgencyBadge } from './urgency-badge';
import { STATUS_LABELS } from '@/lib/types/design';
import type { Design, DesignStatus } from '@/lib/types/design';

interface DesignCardProps {
  design: Design;
  /** Click sobre el título — abre detail sheet u otra acción del padre. */
  onSelect: (designId: string) => void;
  onStatusChange: (design: Design, newStatus: DesignStatus) => void;
  /** True si esta tarjeta está siendo actualizada (deshabilita el select). */
  updating?: boolean;
  /** Estilo más sutil cuando el diseño está completado. */
  muted?: boolean;
}

export function DesignCard({ design, onSelect, onStatusChange, updating, muted }: DesignCardProps) {
  return (
    <Card className={muted ? 'opacity-75' : ''}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[200px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSelect(design.id)}
                className="text-left font-medium transition-colors hover:text-primary"
              >
                {design.title}
              </button>
              {design.player_status && <PlayerStatusTag status={design.player_status} />}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {design.player} · {design.match_home} vs {design.match_away}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(design.deadline_at), 'dd MMM HH:mm', { locale: es })}
          </div>
          <UrgencyBadge design={design} />
          <Select
            value={design.status}
            onValueChange={(value) => onStatusChange(design, value as DesignStatus)}
            disabled={updating}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BACKLOG">{STATUS_LABELS.BACKLOG}</SelectItem>
              <SelectItem value="DELIVERED">{STATUS_LABELS.DELIVERED}</SelectItem>
            </SelectContent>
          </Select>
          {design.folder_url && (
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <a
                href={design.folder_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir carpeta Drive"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
