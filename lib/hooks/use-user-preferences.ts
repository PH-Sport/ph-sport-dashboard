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
  givenName: string;
  setGivenName: (v: string) => void;
  familyName: string;
  setFamilyName: (v: string) => void;
  alias: string;
  setAlias: (v: string) => void;
  defaultView: DefaultView;
  setDefaultView: (v: DefaultView) => void;
  preferences: NotificationPreferences;
  togglePreference: (channel: NotificationChannel, type: NotificationEvent) => void;
  saving: boolean;
  uploading: boolean;
  /** True hasta que el perfil y las preferencias de notificación están cargados. */
  loading: boolean;
  save: () => Promise<void>;
  /** Sube el JPEG ya recortado/comprimido. Devuelve true si tuvo éxito. */
  uploadAvatar: (blob: Blob) => Promise<boolean>;
}

/** Extrae el nombre del objeto en el bucket `avatars` desde su URL pública. Null si no pertenece a ese bucket. */
function avatarObjectPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = '/avatars/';
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return url.slice(idx + marker.length).split('?')[0] || null;
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
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [alias, setAlias] = useState('');
  const [defaultView, setDefaultView] = useState<DefaultView>('list');
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setGivenName(profile.given_name || '');
      setFamilyName(profile.family_name || '');
      setAlias(profile.alias || '');
    } else if (user?.email) {
      setGivenName(user.email.split('@')[0]);
    }

    const loadPreferences = async () => {
      // Sin usuario aún (auth inicializando): seguimos en estado de carga.
      if (!user) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (data?.notification_preferences) {
          setPreferences(dbToUi(data.notification_preferences as NotificationPreferencesDb));
        }
      } finally {
        setLoading(false);
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
    // Foto anterior: la borraremos tras subir la nueva con éxito.
    const previousPath = avatarObjectPath(profile?.avatar_url);
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

      // Borrar la foto anterior (best-effort): el usuario es dueño de su propio fichero,
      // así que la policy de borrado lo permite. Un fallo aquí no rompe la subida.
      if (previousPath && previousPath !== filePath) {
        const { error: removeError } = await supabase.storage.from('avatars').remove([previousPath]);
        if (removeError) logger.warn('No se pudo borrar el avatar anterior:', removeError);
      }

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
          given_name: givenName.trim() || (user.email ? user.email.split('@')[0] : 'Usuario'),
          family_name: familyName.trim() || null,
          alias: alias.trim() || null,
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
    givenName,
    setGivenName,
    familyName,
    setFamilyName,
    alias,
    setAlias,
    defaultView,
    setDefaultView,
    preferences,
    togglePreference,
    saving,
    uploading,
    loading,
    save,
    uploadAvatar,
  };
}
