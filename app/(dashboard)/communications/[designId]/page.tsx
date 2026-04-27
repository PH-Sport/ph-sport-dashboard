'use client';

/**
 * Full-screen chat view for design conversations.
 * 
 * NOTE: This page has some duplicated logic with CommentsSection component
 * (edit handlers, submit handlers, etc.). The duplication exists because:
 * - This page has a unique full-screen chat layout with scroll behavior
 * - CommentsSection is a modular component for embedding in other contexts
 * 
 * TODO: Consider extracting shared logic into a custom hook if this grows further.
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader } from '@/components/ui/loader';
import { ErrorState } from '@/components/ui/error-state';
import { 
  ArrowLeft, 
  ExternalLink, 
  Send, 
  Trash2,
  Pencil,
  Check,
  X,
  Calendar,
  User,
  Palette
} from 'lucide-react';
import { useComments, Comment } from '@/lib/hooks/use-comments';
import { useAuth } from '@/lib/auth/auth-context';
import { useDesigners } from '@/lib/hooks/use-designers';
import { STATUS_LABELS } from '@/lib/types/design';
import type { Design } from '@/lib/types/design';
import { cn } from '@/lib/utils';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const designId = params.designId as string;
  
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  
  const { comments, loading: commentsLoading, addComment, deleteComment, editComment, canEdit, markViewed } = useComments(designId);
  const { user, profile } = useAuth();
  const { designers } = useDesigners();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load design info
  useEffect(() => {
    if (!designId) {
      setError('ID de diseño no proporcionado');
      setLoading(false);
      return;
    }

    fetch(`/api/designs/${designId}`)
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404) throw new Error('Diseño no encontrado');
          throw new Error('Error al cargar diseño');
        }
        return r.json();
      })
      .then((data) => setDesign(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error desconocido'))
      .finally(() => setLoading(false));
  }, [designId]);

  // Auto-scroll and mark as read
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (comments.length > 0 && user) {
      markViewed(user.id);
    }
  }, [comments, user, markViewed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSending(true);
    try {
      await addComment(newComment, user.id, profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : undefined);
      setNewComment('');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('¿Estás seguro de eliminar este comentario?')) {
      await deleteComment(commentId);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    
    setSaving(true);
    try {
      const success = await editComment(editingId, editContent.trim());
      if (success) {
        setEditingId(null);
        setEditContent('');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader message="Cargando conversación..." />
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="p-6">
        <ErrorState
          title="Error al cargar conversación"
          message={error || 'Diseño no encontrado'}
          onRetry={() => router.refresh()}
        />
      </div>
    );
  }

  const designer = design.designer_id 
    ? designers.find((u) => u.id === design.designer_id)
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6 max-w-5xl mx-auto">
      {/* Compact Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 pb-4 border-b border-border">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/communications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Actividad
          </Link>
        </Button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-foreground truncate">
              {design.title}
            </h1>
            <Badge status={design.status}>{STATUS_LABELS[design.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {design.player} • {design.match_home} vs {design.match_away}
          </p>
        </div>

        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={`/designs?open=${designId}`}>
            <Palette className="mr-2 h-4 w-4" />
            Ver diseño
            <ExternalLink className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </div>

      {/* Design Quick Info */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span>Entrega: {format(new Date(design.deadline_at), "dd MMM yyyy, HH:mm", { locale: es })}</span>
        </div>
        {designer && (
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{designer.name}</span>
          </div>
        )}
      </div>

      {/* Chat Container - Expands to fill remaining space */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            Conversación
            <span className="text-muted-foreground font-normal text-sm">
              ({comments.length} mensaje{comments.length !== 1 ? 's' : ''})
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {/* Messages List - Scrollable */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {commentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg mb-2">No hay mensajes aún</p>
                <p className="text-sm">¡Sé el primero en comentar!</p>
              </div>
            ) : (
              comments.map((comment) => {
                const isOwn = comment.user_id === user?.id;
                const isAdmin = profile?.role === 'ADMIN';
                const canDelete = isOwn || isAdmin;
                const canEditThis = user ? canEdit(comment, user.id) : false;
                const isEditing = editingId === comment.id;
                const wasEdited = comment.updated_at && comment.updated_at !== comment.created_at;

                return (
                  <div key={comment.id} className={cn("flex gap-3", isOwn ? "flex-row-reverse" : "")}>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={comment.user?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {comment.user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={cn(
                      "group relative max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                      isOwn 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted text-foreground rounded-tl-sm"
                    )}>
                      <div className="flex justify-between items-start gap-3 mb-1">
                        <span className={cn(
                          "font-semibold text-xs",
                          isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                          {comment.user?.full_name}
                        </span>
                        {!isEditing && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEditThis && (
                              <button
                                onClick={() => handleStartEdit(comment)}
                                className="hover:text-primary"
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                onClick={() => handleDelete(comment.id)}
                                className="hover:text-destructive"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px] text-foreground bg-background resize-none text-sm"
                            autoFocus
                          />
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="h-7 px-2"
                            >
                              <X className="h-3 w-3 mr-1" /> Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={saving || !editContent.trim()}
                              className="h-7 px-2"
                            >
                              {saving ? <Loader className="h-3 w-3" /> : <Check className="h-3 w-3 mr-1" />} Guardar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {comment.content}
                        </p>
                      )}
                      
                      <span className={cn(
                        "text-[11px] mt-2 block text-right",
                        isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                      )}>
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                        {wasEdited && <span className="ml-1">(editado)</span>}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area - Fixed at bottom */}
          <form onSubmit={handleSubmit} className="flex gap-3 items-end p-4 border-t border-border bg-background/50">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="min-h-[44px] max-h-[120px] resize-none py-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newComment.trim() || sending}
              className="shrink-0 h-11 w-11"
            >
              {sending ? <Loader className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
