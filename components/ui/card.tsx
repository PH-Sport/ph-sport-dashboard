'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Card — superficie mate border-led (modelo de elevación Fase 7).
 * - elevation: 'flat' (default, hairline sin sombra) | 'raised' (interactiva, shadow-raised).
 * - density: 'default' (p-lg, 24px) | 'compact' (p-md, 16px) — la heredan Header/Content/Footer.
 */

type CardDensity = 'default' | 'compact';

const CardDensityContext = React.createContext<CardDensity>('default');

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 'flat' | 'raised';
  density?: CardDensity;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation = 'flat', density = 'default', ...props }, ref) => (
    <CardDensityContext.Provider value={density}>
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-border bg-card text-card-foreground transition-colors',
          elevation === 'raised' && 'shadow-raised',
          className
        )}
        {...props}
      />
    </CardDensityContext.Provider>
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const density = React.useContext(CardDensityContext);
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          density === 'compact' ? 'p-md' : 'p-lg',
          className
        )}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-card-title leading-none', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const density = React.useContext(CardDensityContext);
    return (
      <div
        ref={ref}
        className={cn(density === 'compact' ? 'p-md' : 'p-lg', 'pt-0', className)}
        {...props}
      />
    );
  }
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const density = React.useContext(CardDensityContext);
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          density === 'compact' ? 'p-md' : 'p-lg',
          'pt-0',
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
