'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import {
  type NotificationChannel,
  type NotificationEvent,
  type NotificationPreferences,
  type NotificationPreferencesDb,
  DEFAULT_NOTIFICATION_PREFERENCES,
  dbToUi,
  uiToDb,
} from '@/lib/utils/notification-preferences';

export type DefaultView = 'list' | 'calendar';

interface UseUserPreferencesResult {
  name: string;
  setName: (name: string) => void;
  defaultView: DefaultView;
  setDefaultView: (v: DefaultView) => void;
  preferences: NotificationPreferences;
  togglePreference: (channel: NotificationChannel, type: NotificationEvent) => void;
  saving: boolean;
  uploading: boolean;
  save: () => Promise<void>;
  /** Sube el JPEG ya recortado/comprimido. Devuelve true si tuvo éxito. */
  uploadAvatar: (blob: Blob) => Promise<boolean>;
}

/** Traduce errores de subida a un mensaje claro para el usuario (sin errores silenciosos). */
function avatarErrorMessage(error: unknown): string {
  const msg = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase();
  if (msg.includes('size') || msg.includes('payload') || msg.includes('413') || msg.includes('large')) {
    return 'La imagen es demasiado grande. Prueba con otra foto.';
  }
  if (msg.includes('mime') || msg.includes('not supported') || msg.includes('content type')) {
    return 'Formato de imagen no admitido. Usa JPG o PNG.';
  }
  if (
    msg.includes('row-level security') ||
    msg.includes('unauthorized') ||
    msg.includes('403') ||
    msg.includes('permission')
  ) {
    return 'No tienes permiso para subir el avatar. Cierra sesión, vuelve a entrar e inténtalo de nuevo.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to')) {
    return 'Error de conexión al subir el avatar. Revisa tu conexión e inténtalo de nuevo.';
  }
  return 'No se pudo actualizar el avatar. Inténtalo de nuevo.';
}

export function useUserPreferences(): UseUserPreferencesResult {
  const { user, profile, refreshSession } = useAuth();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [defaultView, setDefaultView] = useState<DefaultView>('list');
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name);
    } else if (user?.email) {
      setName(user.email.split('@')[0]);
    }

    const loadPreferences = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (data?.notification_preferences) {
        setPreferences(dbToUi(data.notification_preferences as NotificationPreferencesDb));
      }
    };

    loadPreferences();

    const storedView = localStorage.getItem('defaultView');
    if (storedView) setDefaultView(storedView as DefaultView);
  }, [profile, user, supabase]);

  const togglePreference = (channel: NotificationChannel, type: NotificationEvent) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel][type],
      },
    }));
  };

  const uploadAvatar = async (blob: Blob): Promise<boolean> => {
    if (!user) return false;

    setUploading(true);
    try {
      // El blob siempre llega como JPEG recortado/comprimido desde el diálogo.
      const filePath = `${user.id}-${Math.random().toString(36).slice(2)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { contentType: 'image/jpeg', cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshSession();
      toast.success('Avatar actualizado correctamente');
      return true;
    } catch (error) {
      logger.error('Error updating avatar:', error);
      toast.error(avatarErrorMessage(error));
      return false;
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);

    try {
      localStorage.setItem('defaultView', defaultView);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          notification_preferences: uiToDb(preferences),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshSession();
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return {
    name,
    setName,
    defaultView,
    setDefaultView,
    preferences,
    togglePreference,
    saving,
    uploading,
    save,
    uploadAvatar,
  };
}
