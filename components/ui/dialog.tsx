import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, useDragControls, type MotionProps, type PanInfo } from 'framer-motion';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/hooks/use-is-mobile';
import { animations, SPRINGS, TRANSITIONS } from './animations';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

// Use centralized animations from animations.ts
const overlayAnimation = animations.fade;
const contentAnimation = animations.scale;

type DialogOverlayProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & MotionProps;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay asChild>
    <motion.div
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      className={cn('glass-scrim fixed inset-0 z-50', className)}
      initial={overlayAnimation.initial}
      animate={overlayAnimation.animate}
      exit={overlayAnimation.exit}
      transition={TRANSITIONS.modal}
      {...props}
    />
  </DialogPrimitive.Overlay>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
  MotionProps & {
    /** Móvil: hoja a pantalla completa (el wrapper pierde el padding y el
     * contenido puede ocupar 100dvh). En escritorio no cambia nada. */
    fullscreenOnMobile?: boolean;
    /** Móvil: bottom sheet nativa — anclada abajo, asa de arrastre y
     * swipe-para-cerrar (el cierre es asa/gesto/scrim, sin X). En escritorio
     * no cambia nada: modal centrado con X, como siempre. */
    mobileSheet?: boolean;
  };

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, fullscreenOnMobile = false, mobileSheet = false, ...props }, ref) => {
  const isMobile = useIsMobile();
  const sheetMode = mobileSheet && isMobile;
  // Pantalla completa en móvil: entra desde abajo igual que la hoja, pero sin
  // asa (no hay fondo asomando que la justifique) y conservando la X.
  const fullMode = fullscreenOnMobile && isMobile;
  const risesFromBottom = sheetMode || fullMode;
  // El arrastre solo escucha en el asa (dragControls): así el scroll interno
  // del contenido no pelea con el gesto de cierre.
  const dragControls = useDragControls();
  const closeRef = React.useRef<HTMLButtonElement>(null);

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) closeRef.current?.click();
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content asChild>
        <div
          className={cn(
            'pointer-events-none fixed inset-0 z-50 flex',
            risesFromBottom
              ? // Anclado abajo: el y:100% sale del borde inferior, no del centro.
                'items-end justify-center'
              : fullscreenOnMobile
                ? 'items-center justify-center md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))] md:pt-[max(1rem,env(safe-area-inset-top))]'
                : 'items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]'
          )}
        >
          <motion.div
            ref={ref as unknown as React.Ref<HTMLDivElement>}
            className={cn(
              // max-h + scroll interno: en pantallas bajas (o con teclado) el modal no se corta
              'pointer-events-auto relative max-h-full w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-overlay',
              className,
              // Hoja: full-bleed abajo, esquinas solo arriba, aire para el home indicator.
              // Van tras className para ganar los merges (p. ej. rounded/max-w del consumidor).
              sheetMode &&
                'max-h-[88dvh] w-full max-w-none rounded-b-none rounded-t-2xl border-x-0 border-b-0 pt-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]',
              // Pantalla completa: sin esquinas ni bordes, todo el alto real.
              fullMode && 'h-[100dvh] max-h-none w-full max-w-none rounded-none border-0'
            )}
            initial={risesFromBottom ? { y: '100%' } : contentAnimation.initial}
            animate={risesFromBottom ? { y: 0 } : contentAnimation.animate}
            exit={risesFromBottom ? { y: '100%' } : contentAnimation.exit}
            transition={risesFromBottom ? SPRINGS.smooth : TRANSITIONS.modal}
            {...props}
            drag={risesFromBottom ? 'y' : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            onDragEnd={risesFromBottom ? handleDragEnd : undefined}
            // Sin asa que agarrar, el gesto vive en la cabecera: quien la marque
            // con data-drag-handle presta su zona al arrastre.
            onPointerDown={
              fullMode
                ? (e) => {
                    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
                      dragControls.start(e);
                    }
                  }
                : undefined
            }
          >
            {sheetMode && (
              // sticky: si el contenido de la hoja scrollea, el asa no se pierde.
              <div
                className="sticky top-0 z-10 flex cursor-grab touch-none justify-center bg-card pb-2 pt-3 active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
                aria-hidden
              >
                <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
              </div>
            )}
            {children}
            {sheetMode ? (
              // Cierre programático del swipe (la hoja no lleva X: asa/gesto/scrim).
              <DialogPrimitive.Close
                ref={closeRef}
                tabIndex={-1}
                aria-hidden
                className="sr-only"
              >
                <span>Close</span>
              </DialogPrimitive.Close>
            ) : (
              /* Táctil: 44px de área (p-3.5) con el icono en la MISMA posición visual
                 que el compacto de escritorio (1.5+3.5 = 3+2 = 20px del borde). */
              /* El ref también aquí: en pantalla completa no hay Close oculto,
                 y el swipe de cierre necesita a quién llamar. */
              <DialogPrimitive.Close ref={closeRef} className="absolute right-1.5 top-1.5 rounded-lg p-3.5 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none md:right-3 md:top-3 md:p-2">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </motion.div>
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };


