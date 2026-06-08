'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DesignCard } from '@/components/features/designs/design-card';
import type { Design, DesignStatus } from '@/lib/types/design';
import type { DeliveredWeekGroup } from '@/lib/hooks/use-my-week-data';

const INITIAL_VISIBLE_WEEKS = 2;

interface DeliveredSectionProps {
  groups: DeliveredWeekGroup[];
  totalCount: number;
  onSelect: (designId: string) => void;
  onStatusChange: (design: Design, newStatus: DesignStatus) => void;
  updatingId: string | null;
}

export function DeliveredSection({
  groups,
  totalCount,
  onSelect,
  onStatusChange,
  updatingId,
}: DeliveredSectionProps) {
  const [open, setOpen] = useState(false);
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  const visibleGroups = showAllWeeks ? groups : groups.slice(0, INITIAL_VISIBLE_WEEKS);
  const hasHiddenWeeks = groups.length > INITIAL_VISIBLE_WEEKS;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          Entregados
          <Badge variant="outline" className="font-normal">
            {totalCount}
          </Badge>
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen((prev) => {
              const next = !prev;
              if (!next) setShowAllWeeks(false);
              return next;
            });
          }}
          className="gap-1"
        >
          {open ? (
            <>
              Ocultar
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Ver
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay entregas</p>
      ) : !open ? (
        <p className="text-sm text-muted-foreground">Sección colapsada para reducir ruido visual.</p>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.key} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Semana {group.label}</h3>
              <div className="space-y-2">
                {group.items.map((design) => (
                  <DesignCard
                    key={design.id}
                    design={design}
                    onSelect={onSelect}
                    onStatusChange={onStatusChange}
                    updating={updatingId === design.id}
                    muted
                  />
                ))}
              </div>
            </div>
          ))}

          {hasHiddenWeeks && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAllWeeks((prev) => !prev)}
            >
              {showAllWeeks ? 'Ver menos semanas' : 'Ver más semanas'}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
