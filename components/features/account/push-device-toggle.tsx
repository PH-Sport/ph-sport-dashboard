'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Smartphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { usePushSubscription } from '@/lib/push/use-push-subscription';

/**
 * Sección "Activar en este dispositivo" de la pestaña de notificaciones. El push
 * es por-dispositivo (permiso del SO + suscripción), distinto de "qué eventos
 * quiero" (la rejilla de abajo). Adapta el mensaje a cada situación.
 */
export function PushDeviceToggle() {
  const {
    isSupported,
    isConfigured,
    permission,
    isSubscribed,
    canPromptOnThisDevice,
    loading,
    subscribe,
    unsubscribe,
  } = usePushSubscription();
  const [pending, setPending] = useState(false);

  const handleToggle = async () => {
    setPending(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast.success('Notificaciones desactivadas en este dispositivo');
      } else {
        const ok = await subscribe();
        if (ok) {
          toast.success('Notificaciones activadas en este dispositivo');
        } else if (Notification.permission === 'denied') {
          toast.error('Permiso bloqueado. Actívalo en los ajustes del navegador.');
        } else {
          toast.error('No se pudo activar. Inténtalo de nuevo.');
        }
      }
    } finally {
      setPending(false);
    }
  };

  // Mensaje contextual cuando NO se puede ofrecer el toggle.
  let unavailable: string | null = null;
  if (!loading) {
    if (!isSupported) {
      unavailable = 'Tu navegador no admite notificaciones push.';
    } else if (!isConfigured) {
      unavailable = 'Las notificaciones push aún no están configuradas en este entorno.';
    } else if (!canPromptOnThisDevice) {
      unavailable =
        'En iPhone/iPad, instala la app en tu pantalla de inicio para activar los avisos push.';
    } else if (permission === 'denied') {
      unavailable =
        'Has bloqueado las notificaciones. Actívalas en los ajustes del navegador para este sitio.';
    }
  }

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Smartphone className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium text-foreground">Avisos push en este dispositivo</h3>
            <p className="text-xs text-muted-foreground">
              Recibe las notificaciones en el móvil aunque no tengas la app abierta.
            </p>
          </div>
        </div>
        {!loading && !unavailable && (
          <Switch checked={isSubscribed} disabled={pending} onCheckedChange={handleToggle} />
        )}
      </div>
      {unavailable && <p className="mt-3 text-xs text-muted-foreground">{unavailable}</p>}
    </div>
  );
}
