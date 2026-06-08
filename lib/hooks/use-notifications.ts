import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { logger } from '@/lib/utils/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  type: 'comment' | 'assignment' | 'deadline' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch latest 20 notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setNotifications(data || []);
      
      // Count unread
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (!countError) {
        setUnreadCount(count || 0);
      }
    } catch (error) {
      logger.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    // Fetch initial data
    fetchNotifications();

    // Subscribe to new notifications
    subscriptionRef.current = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and UPDATE
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (_payload) => {
          // Refresh data on any change (could be optimized with optimistic updates)
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, fetchNotifications, supabase]);

  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } catch (error) {
      logger.error('Error marking as read:', error);
      // Revert if error? (Simplification: keep optimistic state for UI responsiveness)
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user!.id)
        .eq('read', false);
    } catch (error) {
      logger.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    // Optimistic update
    const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
    } catch (error) {
      logger.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    // Optimistic update
    setNotifications([]);
    setUnreadCount(0);

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user!.id);
    } catch (error) {
      logger.error('Error deleting all notifications:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh: fetchNotifications
  };
}
