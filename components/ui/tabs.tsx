import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { SPRINGS } from './animations';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
      className={cn(
        // Táctil: pestañas ≥44px en móvil; md recupera la altura de escritorio
        'inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground md:h-10',
        className
      )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-raised hover:text-foreground md:py-1.5',
        className
      )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

type TabsTriggerSlidingProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  /** Quién está activo lo sabe el consumidor: Radix solo lo marca en el DOM. */
  active: boolean;
  /** Mismo id en todas las pestañas de un grupo — es lo que hace viajar la pastilla. */
  indicatorId: string;
};

/**
 * Pestaña cuyo fondo activo se desliza de una a otra en vez de aparecer y
 * desaparecer. La pastilla es un único elemento compartido por el grupo: la
 * anima `layoutId` de framer-motion, que la mueve entre destinos.
 */
const TabsTriggerSliding = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerSlidingProps
>(({ className, active, indicatorId, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    type="button"
    className={cn(
      // Sin data-[state=active]:bg-*: el fondo ya no es del botón, es la pastilla.
      'relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:py-1.5',
      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      className
    )}
    {...props}
  >
    {active && (
      <motion.span
        layoutId={indicatorId}
        transition={SPRINGS.smooth}
        className="absolute inset-0 rounded-md bg-background shadow-raised"
        aria-hidden
      />
    )}
    {/* El texto viaja por encima de la pastilla, nunca por debajo. */}
    <span className="relative z-10">{children}</span>
  </TabsPrimitive.Trigger>
));
TabsTriggerSliding.displayName = 'TabsTriggerSliding';

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsTriggerSliding, TabsContent };

