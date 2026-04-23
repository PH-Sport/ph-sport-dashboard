'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateDesignDialog } from './create-design-dialog';
import type { Design } from '@/lib/types/design';

interface CreateDesignButtonProps {
  /** Diseño a editar (modo edición) */
  editDesign?: Design | null;
  /** Callback cuando se crea/edita un diseño */
  onDesignCreated: () => void;
  /** Variante del botón */
  variant?: 'default' | 'outline' | 'ghost';
  /** Tamaño del botón */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Clase CSS adicional */
  className?: string;
  /** Deshabilitar acción */
  disabled?: boolean;
  /** Texto de ayuda cuando está deshabilitado */
  disabledReason?: string;
  /** Semana actualmente visible en la página (para avisar si un diseño cae fuera) */
  activeWeekStart?: Date;
  activeWeekEnd?: Date;
}

export function CreateDesignButton({
  editDesign = null,
  onDesignCreated,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  disabledReason,
  activeWeekStart,
  activeWeekEnd,
}: CreateDesignButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
        title={disabledReason}
      >
        <Plus className="mr-2 h-4 w-4" />
        {editDesign ? 'Editar Diseño' : 'Crear Diseños'}
      </Button>

      <CreateDesignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDesignCreated={onDesignCreated}
        design={editDesign}
        activeWeekStart={activeWeekStart}
        activeWeekEnd={activeWeekEnd}
      />
    </>
  );
}
