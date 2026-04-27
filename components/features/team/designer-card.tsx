'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { User, TrendingUp } from 'lucide-react';
import type { Design } from '@/lib/types/design';

interface DesignerWithDesigns {
  id: string;
  full_name: string;
  designs: Design[];
}

interface DesignerCardProps {
  designer: DesignerWithDesigns;
  onClick: () => void;
}

export function DesignerCard({ designer, onClick }: DesignerCardProps) {
  const designs = designer.designs;
  
  // Calcular métricas
  const total = designs.length;
  const pending = designs.filter(d => d.status === 'BACKLOG').length;
  const delivered = designs.filter(d => d.status === 'DELIVERED').length;
  
  // Progreso = entregados / total
  const completionRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <span className="truncate">{designer.full_name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground italic">Sin diseños asignados</p>
        ) : (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asignados:</span>
                <span className="font-medium">{total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendientes:</span>
                <span className="font-medium text-foreground">{pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entregados:</span>
                <span className="font-medium text-[hsl(var(--status-success))]">{delivered}</span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Progreso
                </span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
