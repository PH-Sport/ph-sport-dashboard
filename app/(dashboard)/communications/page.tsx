'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAllComments } from '@/lib/hooks/use-all-comments';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Activity, ChevronRight, Clock, MessageCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CommunicationsSkeleton } from '@/components/skeletons/communications-skeleton';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { EmptyState } from '@/components/ui/empty-state';

export default function CommunicationsPage() {
  const { conversations, loading } = useAllComments();
  const [search, setSearch] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);

  const filtered = conversations.filter(c => {
    const matchesSearch = c.designTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.player.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterUnread ? c.unreadCount > 0 : true;
    return matchesSearch && matchesFilter;
  });

  // Contar no leídos totales
  const totalUnread = conversations.filter(c => c.unreadCount > 0).length;

  // Only show skeleton on initial load (no cached data yet)
  const showSkeleton = loading && conversations.length === 0;

  return (
    <DashboardPage
      title="Actividad"
      icon={Activity}
      subtitle="Conversaciones y actualizaciones del equipo"
      loading={showSkeleton}
      skeleton={<CommunicationsSkeleton />}
      actions={
        <>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar diseño, jugador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={filterUnread ? "default" : "outline"}
            onClick={() => setFilterUnread(!filterUnread)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">No leídos</span>
            {filterUnread && totalUnread > 0 && (
              <Badge variant="secondary" className="ml-1">
                {totalUnread}
              </Badge>
            )}
          </Button>
        </>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{conversations.length}</p>
              <p className="text-sm text-muted-foreground">Conversaciones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalUnread}</p>
              <p className="text-sm text-muted-foreground">Sin leer</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(conversations.map(c => c.lastMessage?.author).filter(Boolean)).size}
              </p>
              <p className="text-sm text-muted-foreground">Participantes activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          title={search ? "No se encontraron resultados" : "No hay conversaciones"}
          description={search ? "Intenta con otros términos de búsqueda" : "Los comentarios en diseños aparecerán aquí"}
          actionLabel={search ? "Limpiar búsqueda" : undefined}
          onAction={search ? () => setSearch('') : undefined}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Conversaciones Recientes</CardTitle>
            <CardDescription>
              {filtered.length} conversación{filtered.length !== 1 ? 'es' : ''} con actividad
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((conv) => (
                <Link
                  key={conv.designId}
                  href={`/communications/${conv.designId}`}
                  className={cn(
                    "group flex items-start justify-between gap-4 p-4 hover:bg-accent transition-colors",
                    conv.unreadCount > 0 && "bg-primary/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn(
                        "font-medium truncate",
                        conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {conv.designTitle}
                      </h3>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="shrink-0">
                          {conv.unreadCount} nuevo{conv.unreadCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                      <span className="font-medium bg-muted px-2 py-0.5 rounded">
                        {conv.player}
                      </span>
                      <span>•</span>
                      <span>{conv.match}</span>
                    </div>

                    {conv.lastMessage && (
                      <div className="bg-muted rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-primary text-xs">
                            {conv.lastMessage.author}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">
                          {conv.lastMessage.content}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardPage>
  );
}
