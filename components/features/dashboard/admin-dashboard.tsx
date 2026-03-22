'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Users, TrendingDown, Clock, User } from 'lucide-react';
import Link from 'next/link';
import type { Design } from '@/lib/types/design';
import { useDesigners } from '@/lib/hooks/use-designers';

interface AdminDashboardProps {
  items: Design[];
  onAssign: () => void;
  assigning: boolean;
}

interface DesignerLoad {
  id: string;
  name: string;
  active: number;
  delivered: number;
}

export function AdminDashboard({ items, onAssign, assigning }: AdminDashboardProps) {
  const { designers } = useDesigners();

  // KPIs de control
  const now = new Date();
  const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  
  const atRisk = items.filter(d => {
    const deadline = new Date(d.deadline_at);
    return deadline < next48h && d.status !== 'DELIVERED';
  }).length;

  const stuckDesigns = items.filter(d => {
    const updated = new Date(d.updated_at || d.created_at || new Date());
    const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate > 48 && d.status !== 'DELIVERED' && d.status !== 'BACKLOG';
  }).length;

  const unassignedCount = items.filter(d => !d.designer_id).length;

  // Carga por diseñador
  const designerLoads = useMemo<DesignerLoad[]>(() => {
    return designers.map(designer => {
      const designerDesigns = items.filter(d => d.designer_id === designer.id);
      return {
        id: designer.id,
        name: designer.name,
        active: designerDesigns.filter(d => d.status !== 'DELIVERED').length,
        delivered: designerDesigns.filter(d => d.status === 'DELIVERED').length,
      };
    }).sort((a, b) => b.active - a.active);
  }, [items, designers]);

  const overloadedDesigners = designerLoads.filter(d => d.active > 5);
  const inactiveDesigners = designerLoads.filter(d => d.delivered === 0 && d.active === 0);

  // Diseños críticos (< 24h)
  const criticalDesigns = useMemo(() => {
    const currentTime = new Date();
    const next24h = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
    return items
      .filter(d => {
        const deadline = new Date(d.deadline_at);
        return deadline < next24h && deadline > currentTime && d.status !== 'DELIVERED';
      })
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
      .slice(0, 3);
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs de Control */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Diseños en riesgo"
          value={atRisk}
          description="No llegarán a tiempo"
          variant={atRisk > 0 ? 'danger' : 'success'}
          icon={AlertTriangle}
        />

        <KpiCard
          title="Bloqueados"
          value={stuckDesigns}
          description="Sin cambios >48h"
          variant={stuckDesigns > 0 ? 'warning' : 'success'}
          icon={Clock}
        />

        <KpiCard
          title="Sin asignar"
          value={unassignedCount}
          description="Trabajo sin dueño"
          variant={unassignedCount > 0 ? 'warning' : 'success'}
          icon={User}
        />

        <KpiCard
          title="Diseñadores activos"
          value={`${designerLoads.filter(d => d.active > 0).length}/${designers.length}`}
          description="Con trabajo asignado"
          variant="primary"
          icon={Users}
        />
      </div>

      {/* Alertas Críticas */}
      {(atRisk > 5 || overloadedDesigners.length > 0 || criticalDesigns.length > 0) && (
        <Card className="border-gold-500/50 bg-gold-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gold-600 dark:text-gold-400">
              <AlertTriangle className="h-5 w-5" />
              Alertas que requieren atención
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {atRisk > 5 && (
              <p className="text-sm">• <strong>{atRisk} diseños</strong> no llegarán a tiempo</p>
            )}
            {overloadedDesigners.length > 0 && (
              <p className="text-sm">• <strong>{overloadedDesigners.length} diseñador(es)</strong> sobrecargados ({overloadedDesigners.map(d => d.name).join(', ')})</p>
            )}
            {criticalDesigns.length > 0 && (
              <p className="text-sm">• <strong>{criticalDesigns.length} diseños críticos</strong> vencen en menos de 24h</p>
            )}
            <Button size="sm" className="mt-2" asChild>
              <Link href="/team">Ver panel de equipo</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Carga del Equipo */}
      <Card>
        <CardHeader>
          <CardTitle>Carga del Equipo</CardTitle>
          <CardDescription>Top diseñadores por trabajo activo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {designerLoads.slice(0, 5).map(designer => (
              <div key={designer.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{designer.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {designer.active} activos · {designer.delivered} completados
                    </span>
                    <Badge variant={designer.active > 5 ? 'destructive' : 'secondary'}>
                      {designer.active}
                    </Badge>
                  </div>
                </div>
                <Progress value={Math.min(100, (designer.active / 10) * 100)} className="h-2" />
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
            <Link href="/team">Ver todos los diseñadores</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Repartir diseños si hay sin asignar */}
      {unassignedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Asignaciones Pendientes</CardTitle>
            <CardDescription>{unassignedCount} diseño{unassignedCount !== 1 ? 's' : ''} sin asignar</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onAssign} disabled={assigning}>
              <Users className="mr-2 h-4 w-4" />
              {assigning ? 'Repartiendo...' : 'Repartir Diseños'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Diseñadores inactivos (si los hay) */}
      {inactiveDesigners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-yellow-500" />
              Diseñadores Inactivos
            </CardTitle>
            <CardDescription>Sin entregas ni trabajo asignado esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {inactiveDesigners.map(d => (
                <Badge key={d.id} variant="outline">{d.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
