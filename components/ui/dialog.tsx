import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, type MotionProps } from 'framer-motion';

import { cn } from '@/lib/utils';
import { animations, TRANSITIONS } from './animations';

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
  };

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, fullscreenOnMobile = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content asChild>
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-50 flex items-center justify-center',
          fullscreenOnMobile
            ? 'md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))] md:pt-[max(1rem,env(safe-area-inset-top))]'
            : 'p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]'
        )}
      >
        <motion.div
          ref={ref as unknown as React.Ref<HTMLDivElement>}
          className={cn(
            // max-h + scroll interno: en pantallas bajas (o con teclado) el modal no se corta
            'pointer-events-auto relative max-h-full w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-overlay',
            className
          )}
          initial={contentAnimation.initial}
          animate={contentAnimation.animate}
          exit={contentAnimation.exit}
          transition={TRANSITIONS.modal}
          {...props}
        >
          {children}
          {/* Táctil: 44px de área (p-3.5) con el icono en la MISMA posición visual
              que el compacto de escritorio (1.5+3.5 = 3+2 = 20px del borde). */}
          <DialogPrimitive.Close className="absolute right-1.5 top-1.5 rounded-lg p-3.5 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none md:right-3 md:top-3 md:p-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </motion.div>
      </div>
    </DialogPrimitive.Content>
  </DialogPortal>
));
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


