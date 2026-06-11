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
  uploadAvatar: (file: File) => Promise<void>;
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

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

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
    } catch (error) {
      logger.error('Error updating avatar:', error);
      toast.error('Error al actualizar el avatar');
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
