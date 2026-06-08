'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UsersSkeleton } from '@/components/skeletons/users-skeleton';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { CreateInvitationDialog } from '@/components/invitations/create-invitation-dialog';
import { useUsersData } from '@/lib/hooks/use-users-data';
import { UsersList } from '@/components/features/users/users-list';
import { InvitationsCard } from '@/components/features/users/invitations-card';

export default function UsersPage() {
  const { profile: currentProfile, status } = useAuth();
  const router = useRouter();
  const { users, invitations, isLoading, mutate } = useUsersData();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'INITIALIZING') return;
    if (!currentProfile || currentProfile.role !== 'ADMIN') {
      router.push('/inicio');
    }
  }, [status, currentProfile, router]);

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
      <UsersList users={users} />
      <InvitationsCard invitations={invitations} onMutate={mutate} />

      <CreateInvitationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => mutate()}
      />
    </DashboardPage>
  );
}
