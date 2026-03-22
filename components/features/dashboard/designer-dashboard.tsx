'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { Design } from '@/lib/types/design';

interface DesignerDashboardProps {
  items: Design[];
  userId: string;
}

export function DesignerDashboard({ items, userId }: DesignerDashboardProps) {
  // Filtrar solo diseños del usuario
  const myDesigns = useMemo(() => items.filter(d => d.designer_id === userId), [items, userId]);

  // KPIs minimalistas
  const activeDesigns = myDesigns.filter(d => d.status === 'BACKLOG').length;
  const completedThisWeek = myDesigns.filter(d => d.status === 'DELIVERED').length;
  
  // Próxima entrega
  const nextDeadline = useMemo(() => {
    const pending = myDesigns
      .filter(d => d.status !== 'DELIVERED')
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime());
    return pending[0];
  }, [myDesigns]);

  const hoursUntilNext = nextDeadline 
    ? (new Date(nextDeadline.deadline_at).getTime() - new Date().getTime()) / (1000 * 60 * 60)
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs Minimalistas */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Mis tareas activas"
          value={activeDesigns}
          description="Pendientes"
          variant="primary"
        />
        
        {nextDeadline ? (
          <KpiCard
            title="Próxima entrega"
            value={hoursUntilNext && hoursUntilNext > 0 ? `${Math.floor(hoursUntilNext)}h` : 'Urgente'}
            description={nextDeadline.title}
            variant={hoursUntilNext && hoursUntilNext < 24 ? 'danger' : 'default'}
            icon={Clock}
          />
        ) : (
          <KpiCard
            title="Próxima entrega"
            value="—"
            description="Sin entregas pendientes"
            variant="success"
            icon={CheckCircle2}
          />
        )}

        <KpiCard
          title="Completados esta semana"
          value={completedThisWeek}
          description="Diseños entregados"
          variant="success"
          icon={TrendingUp}
        />
      </div>

      {/* Accesos rápidos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/my-week" className="group">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    Ver Mi Semana
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Lista de trabajo completa
                  </p>
                </div>
                <Badge className="text-lg px-3 py-1">{activeDesigns}</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/designs" className="group">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    Ver Todos los Diseños
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Backlog completo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alerta si hay diseños urgentes */}
      {hoursUntilNext !== null && hoursUntilNext < 24 && hoursUntilNext > 0 && (
        <Card className="border-gold-500/50 bg-gold-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-gold-500 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Entrega urgente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {nextDeadline?.title} vence en {Math.floor(hoursUntilNext)} horas
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(nextDeadline!.deadline_at), "dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
                <Button size="sm" className="mt-3" asChild>
                  <Link href="/my-week">Ver detalles</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
