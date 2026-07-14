'use client';

import { useState } from 'react';
import { Bell, Check, Calendar, AlertCircle, Info, Trash2 } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hint } from '@/components/ui/tooltip';
import { useNotifications, Notification } from '@/lib/hooks/use-notifications';
import { groupNotificationsByDay } from '@/lib/utils/group-notifications';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';

export function NotificationsDropdown() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  // Borrar TODAS es destructivo e irreversible: pide confirmación siempre.
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const router = useRouter();

  const visible = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const groups = groupNotificationsByDay(visible);

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
      case 'assignment': return <Calendar className="h-4 w-4 text-primary" />;
      case 'deadline': return <AlertCircle className="h-4 w-4 text-status-warning" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderNotification = (notification: Notification) => (
    <DropdownMenuItem
      key={notification.id}
      onClick={() => handleNotificationClick(notification)}
      className={cn(
        "flex items-start gap-3 px-4 py-3 cursor-pointer group",
        !notification.read ? "bg-primary/5" : ""
      )}
    >
      <div className="mt-1 shrink-0 bg-background p-1.5 rounded-full shadow-sm border border-border">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <p className={cn("text-xs font-medium leading-none truncate", !notification.read ? "text-foreground" : "text-muted-foreground")}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
        </p>
      </div>
      <Hint label="Eliminar">
        <button
          onClick={(e) => handleDelete(e, notification.id)}
          aria-label="Eliminar notificación"
          className="-my-1.5 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-destructive/10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </button>
      </Hint>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label={
            unreadCount > 0
              ? `Notificaciones (${unreadCount} sin leer)`
              : 'Notificaciones'
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[min(20rem,calc(100vw-1.5rem))] sm:w-96 p-0 z-50"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notificaciones</h4>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary md:min-h-0 md:py-1"
              >
                <Check className="h-3.5 w-3.5" /> Leído
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  setOpen(false);
                  setConfirmClearOpen(true);
                }}
                className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive md:min-h-0 md:py-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Borrar
              </button>
            )}
          </div>
        </div>

        {/* Filtro Todo / No leídas */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
          {(['all', 'unread'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'rounded-md px-3 py-2.5 text-xs font-medium transition-colors md:px-2.5 md:py-1',
                filter === value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {value === 'all' ? 'Todo' : 'No leídas'}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[min(350px,55dvh)]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm">
                {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map(renderNotification)}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>

      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        onConfirm={() => {
          setConfirmClearOpen(false);
          void deleteAllNotifications();
        }}
        title="¿Borrar todas las notificaciones?"
        description="Se eliminarán todas tus notificaciones. Esta acción no se puede deshacer."
        confirmLabel="Borrar todas"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </DropdownMenu>
  );
}

