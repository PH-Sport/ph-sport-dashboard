'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Copy, Trash2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import type { Invitation } from '@/lib/hooks/use-users-data';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  DESIGNER: 'Diseñador',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-primary/20 text-primary border-primary/30',
  DESIGNER: 'bg-secondary text-secondary-foreground border-border',
};

interface InvitationStatus {
  label: 'Activa' | 'Usada' | 'Expirada';
  color: string;
}

function getInvitationStatus(invitation: Invitation): InvitationStatus {
  const usesCount = invitation.invitation_uses?.length || 0;
  if (usesCount >= invitation.max_uses) {
    return {
      label: 'Usada',
      color: 'bg-status-success/15 text-status-success border-status-success/30',
    };
  }
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return {
      label: 'Expirada',
      color: 'bg-destructive/15 text-destructive border-destructive/30',
    };
  }
  return { label: 'Activa', color: 'bg-primary/20 text-primary border-primary/30' };
}

function getTimeRemaining(expiresAt: string | null) {
  if (!expiresAt) return 'Sin límite';
  const expires = new Date(expiresAt);
  if (expires < new Date()) return 'Expirada';
  return formatDistanceToNow(expires, { locale: es, addSuffix: true });
}

interface InvitationsCardProps {
  invitations: Invitation[];
  onMutate: () => void;
}

export function InvitationsCard({ invitations, onMutate }: InvitationsCardProps) {
  const [open, setOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getInviteUrl = (token: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/invite/${token}`;
  };

  const copyToClipboard = async (token: string, id: string) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(token));
      setCopiedId(id);
      toast.success('Link copiado');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  };

  const deleteInvitation = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('invitations').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
      return;
    }
    toast.success('Invitación eliminada');
    onMutate();
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setOpen((p) => !p)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Invitaciones pendientes {invitations.length > 0 && `(${invitations.length})`}
          </CardTitle>
          {open ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          {invitations.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay invitaciones pendientes
            </p>
          ) : (
            <div className="divide-y divide-border">
              {invitations.map((invitation) => {
                const invStatus = getInvitationStatus(invitation);
                const isActive = invStatus.label === 'Activa';
                return (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                      <Badge className={ROLE_COLORS[invitation.role]}>
                        {ROLE_LABELS[invitation.role]}
                      </Badge>
                      <Badge className={invStatus.color}>{invStatus.label}</Badge>
                      {isActive && (
                        <span className="text-sm text-muted-foreground">
                          Expira {getTimeRemaining(invitation.expires_at)}
                        </span>
                      )}
                      {invitation.invitation_uses?.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          → {invitation.invitation_uses[0].full_name} ({invitation.invitation_uses[0].email})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(invitation.token, invitation.id)}
                          aria-label={
                            copiedId === invitation.id ? 'Link copiado' : 'Copiar link de invitación'
                          }
                        >
                          {copiedId === invitation.id ? (
                            <CheckCircle className="h-4 w-4 text-status-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteInvitation(invitation.id)}
                        className="text-destructive hover:text-destructive"
                        aria-label="Eliminar invitación"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
