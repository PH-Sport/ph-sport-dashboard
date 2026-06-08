'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Profile } from '@/lib/hooks/use-users-data';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  DESIGNER: 'Diseñador',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-primary/20 text-primary border-primary/30',
  DESIGNER: 'bg-secondary text-secondary-foreground border-border',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface UsersListProps {
  users: Profile[];
}

export function UsersList({ users }: UsersListProps) {
  return (
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
            <div key={user.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-sm text-primary">
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
              <Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
