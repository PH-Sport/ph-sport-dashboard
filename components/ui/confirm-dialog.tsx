'use client';

import * as React from 'react';
import Image from 'next/image';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  /** URL de imagen personalizada para usar en lugar del icono del variant */
  customIcon?: string;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconClassName: 'text-red-500',
    bgClassName: 'bg-red-500/10',
    buttonVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'text-yellow-500',
    bgClassName: 'bg-yellow-500/10',
    buttonVariant: 'default' as const,
  },
  info: {
    icon: Info,
    iconClassName: 'text-blue-500',
    bgClassName: 'bg-blue-500/10',
    buttonVariant: 'default' as const,
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  customIcon,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-col items-center text-center gap-4 pb-2">
          {customIcon ? (
            <Image
              src={customIcon}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
              unoptimized={customIcon.endsWith('.svg')}
            />
          ) : (
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full',
                config.bgClassName
              )}
            >
              <Icon className={cn('h-7 w-7', config.iconClassName)} />
            </div>
          )}
          <div className="space-y-2">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-base">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Eliminando...
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
