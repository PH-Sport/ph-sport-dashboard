'use client';

import { Loader2 } from 'lucide-react';
import { PhSportMark } from '@/components/layout/ph-sport-mark';

interface LogoutOverlayProps {
  isVisible: boolean;
}

export function LogoutOverlay({ isVisible }: LogoutOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <PhSportMark className="h-16 w-16 mb-4 text-primary animate-pulse" />
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Cerrando sesión...</span>
      </div>
    </div>
  );
}
