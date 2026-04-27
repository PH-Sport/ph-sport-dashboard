import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Error',
  message = 'Ha ocurrido un error. Por favor, intenta de nuevo.',
  onRetry,
  retryLabel = 'Reintentar',
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn('border-destructive/30 bg-destructive/10', className)}>
      <CardContent className="flex h-64 items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="mt-4">
              {retryLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
