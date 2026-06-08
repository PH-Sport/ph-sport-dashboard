'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsersSkeleton } from '@/components/skeletons/users-skeleton';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Copy, 
  Trash2, 
  CheckCircle,
  Users,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreateInvitationDialog } from '@/components/invitations/create-invitation-dialog';
import { useUsersData, type Invitation } from '@/lib/hooks/use-users-data';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  DESIGNER: 'Diseñador',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-primary/20 text-primary border-primary/30',
  DESIGNER: 'bg-secondary text-secondary-foreground border-border',
};

export default function UsersPage() {
  const { profile: currentProfile, status } = useAuth();
  const router = useRouter();
  const { users, invitations, isLoading, mutate } = useUsersData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showInvitations, setShowInvitations] = useState(true);

  // Redirect non-admins
  useEffect(() => {
    if (status === 'INITIALIZING') return;
    
    if (!currentProfile || currentProfile.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, currentProfile, router]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
    // Revalidate SWR cache
    mutate();
  };

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return 'Sin límite';
    const expires = new Date(expiresAt);
    if (expires < new Date()) return 'Expirada';
    return formatDistanceToNow(expires, { locale: es, addSuffix: true });
  };

  const getInvitationStatus = (invitation: Invitation) => {
    const usesCount = invitation.invitation_uses?.length || 0;
    if (usesCount >= invitation.max_uses) {
      return {
        label: 'Usada',
        color:
          'bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.3)]',
      };
    }
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return {
        label: 'Expirada',
        color: 'bg-destructive/15 text-destructive border-destructive/30',
      };
    }
    return { label: 'Activa', color: 'bg-primary/20 text-primary border-primary/30' };
  };

  // Only show skeleton on initial load (no cached data yet)
  const showSkeleton = (isLoading && users.length === 0) || status === 'INITIALIZING';

  if (status !== 'INITIALIZING' && (!currentProfile || currentProfile.role !== 'ADMIN')) {
    return null;
  }

  return (
    <DashboardPage
      title="Usuarios"
      subtitle="Gestiona el equipo de PH Sport"
      loading={showSkeleton}
      skeleton={<UsersSkeleton />}
      maxWidth="4xl"
      actions={
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invitar Usuario
        </Button>
      }
    >
      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Equipo ({users.length})
          </CardTitle>
          <CardDescription>Miembros activos del equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-3 gap-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Desde {formatDistanceToNow(new Date(user.created_at), { locale: es, addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge className={ROLE_COLORS[user.role]}>
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations (Collapsible) */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setShowInvitations(!showInvitations)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Invitaciones pendientes {invitations.length > 0 && `(${invitations.length})`}
            </CardTitle>
            {showInvitations ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {showInvitations && (
          <CardContent>
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
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
                      className="flex items-center justify-between py-3 gap-4"
                    >
                      <div className="flex items-center gap-3 flex-wrap flex-1">
                        <Badge className={ROLE_COLORS[invitation.role]}>
                          {ROLE_LABELS[invitation.role]}
                        </Badge>
                        <Badge className={invStatus.color}>
                          {invStatus.label}
                        </Badge>
                        {isActive && (
                          <span className="text-sm text-muted-foreground">
                            Expira {getTimeRemaining(invitation.expires_at)}
                          </span>
                        )}
                        {/* Show who used this invitation */}
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
                          >
                            {copiedId === invitation.id ? (
                              <CheckCircle className="h-4 w-4 text-[hsl(var(--status-success))]" />
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

      <CreateInvitationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => mutate()}
      />
    </DashboardPage>
  );
}
