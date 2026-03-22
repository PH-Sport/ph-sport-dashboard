'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Calendar, ExternalLink, Edit2, X } from 'lucide-react';
import type { Design } from '@/lib/types/design';
import { STATUS_LABELS } from '@/lib/types/design';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
import { DesignDetailSheet } from '@/components/features/designs/design-detail-sheet';

interface DesignerWithDesigns {
  id: string;
  full_name: string;
  designs: Design[];
}

interface DesignerDetailSheetProps {
  designer: DesignerWithDesigns | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekLabel: string;
}

export function DesignerDetailSheet({
  designer,
  open,
  onOpenChange,
  weekLabel,
}: DesignerDetailSheetProps) {
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estado para panel de detalles superpuesto
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Agrupar por estado - Memoized para rendimiento
  const { designs, backlog, delivered } = useMemo(() => {
    const list = designer?.designs || [];
    return {
      designs: list,
      backlog: list.filter(d => d.status === 'BACKLOG'),
      delivered: list.filter(d => d.status === 'DELIVERED')
    };
  }, [designer]);

  if (!designer) return null;

  const handleEditDesign = (design: Design) => {
    setEditingDesign(design);
    setIsEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    // Aquí podríamos refrescar datos, pero por ahora cerramos
    setIsEditDialogOpen(false);
    setEditingDesign(null);
  };

  const renderDesignItem = (design: Design) => (
    <Card key={design.id} className="group cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
      setSelectedDesignId(design.id);
      setIsDetailSheetOpen(true);
    }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{design.title}</h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {design.player}
              {design.player_status && (
                <PlayerStatusTag status={design.player_status} />
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {design.match_home} vs {design.match_away}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEditDesign(design)}
              title="Editar"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {design.folder_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <a href={design.folder_url} target="_blank" rel="noopener noreferrer" title="Abrir carpeta">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <Badge status={design.status} className="text-xs">
            {STATUS_LABELS[design.status]}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(design.deadline_at), 'dd MMM HH:mm', { locale: es })}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection = (title: string, items: Design[], color: string) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className={`text-sm font-medium ${color}`}>
          {title} ({items.length})
        </h3>
        <div className="space-y-2">
          {items.map(renderDesignItem)}
        </div>
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" hideCloseButton>
          <SheetHeader className="pb-4 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="flex items-center gap-3 text-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  {designer.full_name}
                </SheetTitle>
                <SheetDescription className="mt-2">
                  Diseños asignados · {weekLabel}
                </SheetDescription>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-500/10 transition-colors group"
                title="Cerrar"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gold-400" />
              </button>
            </div>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {designs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tiene diseños asignados esta semana
              </p>
            ) : (
              <>
                {renderSection('Pendientes', backlog, 'text-gray-600 dark:text-gray-400')}
                {renderSection('Entregados', delivered, 'text-green-600 dark:text-green-400')}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {editingDesign && (
        <CreateDesignDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onDesignCreated={handleEditComplete}
          design={editingDesign}
        />
      )}

      {/* Design detail sheet - superpuesto */}
      <DesignDetailSheet
        designId={selectedDesignId}
        open={isDetailSheetOpen}
        onOpenChange={(open) => {
          setIsDetailSheetOpen(open);
          // Limpiar estado al cerrar para evitar flashes del diseño anterior
          if (!open) {
            setTimeout(() => setSelectedDesignId(null), 300); // Pequeño delay para permitir animación de salida
          }
        }}
        onDesignUpdated={() => {
          // Opcional: recargar datos del diseñador si es necesario
        }}
      />
    </>
  );
}
