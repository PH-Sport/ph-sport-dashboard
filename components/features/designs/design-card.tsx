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
import { cn } from '@/lib/utils';

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

/**
 * Fila de diseño — dos zonas fijas (identidad | meta + acciones).
 * Apila en móvil de forma predecible; la urgencia es el elemento dominante
 * del lado derecho, el select de estado va compacto.
 */
export function DesignCard({ design, onSelect, onStatusChange, updating, muted }: DesignCardProps) {
  return (
    <Card density="compact" className={cn(muted && 'opacity-70')}>
      <CardContent className="pt-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Zona identidad */}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => onSelect(design.id)}
                className="truncate text-left font-medium outline-none transition-colors hover:text-primary focus-visible:text-primary"
              >
                {design.title}
              </button>
              {design.player_status && (
                <PlayerStatusTag status={design.player_status} variant="compact" />
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {design.player} · {design.match_home} vs {design.match_away}
            </p>
          </div>

          {/* Zona meta + acciones */}
          <div className="flex shrink-0 flex-wrap items-center gap-3 sm:flex-nowrap">
            <span className="mono tabular flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              {format(new Date(design.deadline_at), 'dd MMM HH:mm', { locale: es })}
            </span>
            <UrgencyBadge design={design} />
            <Select
              value={design.status}
              onValueChange={(value) => onStatusChange(design, value as DesignStatus)}
              disabled={updating}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BACKLOG">{STATUS_LABELS.BACKLOG}</SelectItem>
                <SelectItem value="DELIVERED">{STATUS_LABELS.DELIVERED}</SelectItem>
              </SelectContent>
            </Select>
            {design.folder_url && (
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
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
        </div>
      </CardContent>
    </Card>
  );
}
