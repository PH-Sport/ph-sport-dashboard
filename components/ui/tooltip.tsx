'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  // Portal: renderiza el tooltip a nivel de <body> para que escape de cualquier
  // `overflow-hidden` o contexto de apilamiento del ancestro (p. ej. la placa de
  // la sidebar, que recorta su contenido durante la animación de colapso).
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md',
        'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

type HintProps = {
  /** Texto del tooltip. Si es falsy, renderiza el hijo tal cual (passthrough). */
  label?: React.ReactNode;
  /** Único elemento disparador (botón, link, span…). */
  children: React.ReactElement;
  side?: React.ComponentPropsWithoutRef<typeof TooltipContent>['side'];
  align?: React.ComponentPropsWithoutRef<typeof TooltipContent>['align'];
  sideOffset?: number;
  className?: string;
};

/**
 * Hint — tooltip estilizado de una sola línea. Sustituye al atributo `title`
 * nativo del navegador (gris, rectangular, no estilizable) por el chip charcoal
 * de la app. Si `label` es falsy hace passthrough, así que es seguro pasar
 * valores condicionales (p. ej. `!expanded ? label : undefined`).
 *
 * Requiere un `<TooltipProvider>` antepuesto (montado en el layout raíz).
 */
function Hint({ label, children, side = 'top', align = 'center', sideOffset, className }: HintProps) {
  if (!label) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} sideOffset={sideOffset} className={className}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Hint };
