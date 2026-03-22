'use client';

import { useState } from 'react';
import { Bell, Check, MessageSquare, Calendar, AlertCircle, Info, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/lib/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';

export function NotificationsDropdown() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent navigation
    await deleteNotification(notificationId);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'assignment': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'deadline': return <AlertCircle className="h-4 w-4 text-gold-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
          <h4 className="font-semibold text-sm">Notificaciones</h4>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="text-xs text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Leído
              </button>
            )}
            {notifications.length > 0 && (
              <button 
                onClick={() => deleteAllNotifications()}
                className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Borrar
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 cursor-pointer group",
                    !notification.read ? "bg-gold-50/50 dark:bg-gold-500/5" : ""
                  )}
                >
                  <div className="mt-1 shrink-0 bg-white dark:bg-zinc-800 p-1.5 rounded-full shadow-sm border border-gray-100 dark:border-white/10">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className={cn("text-xs font-medium leading-none truncate", !notification.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300")}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="mt-1 p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

