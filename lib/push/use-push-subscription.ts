'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { logger } from '@/lib/utils/logger';
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from './vapid';

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export interface UsePushSubscriptionResult {
  /** El navegador soporta service worker + Push API + Notification. */
  isSupported: boolean;
  /** Estado del permiso del SO: 'default' | 'granted' | 'denied'. */
  permission: NotificationPermission;
  /** Este dispositivo tiene una suscripción activa. */
  isSubscribed: boolean;
  /** En iOS solo se puede pedir permiso con la app instalada (standalone). */
  canPromptOnThisDevice: boolean;
  /** Cargando el estado inicial de la suscripción. */
  loading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
}

/**
 * Gestiona la suscripción push de ESTE dispositivo: permiso del SO + registro en
 * `push_subscriptions` (vía RLS del propio usuario). No pinta nada.
 */
export function usePushSubscription(): UsePushSubscriptionResult {
  const { user } = useAuth();
  const supabase = createClient();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [canPromptOnThisDevice, setCanPrompt] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setIsSupported(supported);
    if (!supported) {
      setLoading(false);
      return;
    }
    setPermission(Notification.permission);
    setCanPrompt(!(isIOS() && !isStandalone())); // iOS: solo con la app instalada
    let active = true;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (active) setIsSubscribed(!!sub);
      } catch (error) {
        logger.warn('push getSubscription failed:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user || !VAPID_PUBLIC_KEY) return false;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // cast: TS 5.7 tipa Uint8Array como genérico y no casa con BufferSource.
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      const json = sub.toJSON();

      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
          user_agent: navigator.userAgent,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );
      if (error) {
        logger.error('push subscribe upsert failed:', error);
        return false;
      }
      setIsSubscribed(true);
      return true;
    } catch (error) {
      logger.error('push subscribe failed:', error);
      return false;
    }
  }, [user, supabase]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
    } catch (error) {
      logger.warn('push unsubscribe failed:', error);
    } finally {
      setIsSubscribed(false);
    }
  }, [supabase]);

  return {
    isSupported,
    permission,
    isSubscribed,
    canPromptOnThisDevice,
    loading,
    subscribe,
    unsubscribe,
  };
}
