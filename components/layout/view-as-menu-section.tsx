'use client';

import { Check, Crown, UserCog } from 'lucide-react';
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useViewAs } from '@/lib/auth/view-as-context';
import { useDesigners } from '@/lib/hooks/use-designers';

/**
 * Sección "Ver como" del menú de cuenta. Solo se RENDERIZA para cuentas dev,
 * por lo que useDesigners() solo se ejecuta para el dev (no para usuarios normales).
 */
export function ViewAsMenuSection() {
  const { simulating, simulatedDesignerId, enterDesignerView, exitToManager } = useViewAs();
  const { designers } = useDesigners();

  return (
    <>
      <DropdownMenuSeparator className="bg-border" />
      <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Ver como
      </DropdownMenuLabel>
      <DropdownMenuItem
        onClick={exitToManager}
        className="cursor-pointer text-foreground hover:bg-accent"
      >
        <Crown className="mr-2 h-4 w-4 text-primary" />
        <span className="flex-1">Mánager</span>
        {!simulating && <Check className="h-4 w-4 text-primary" />}
      </DropdownMenuItem>
      {designers.map((d) => (
        <DropdownMenuItem
          key={d.id}
          onClick={() => enterDesignerView(d.id, d.name)}
          className="cursor-pointer text-foreground hover:bg-accent"
        >
          <UserCog className="mr-2 h-4 w-4 text-role-designer" />
          <span className="flex-1 truncate">{d.name}</span>
          {simulating && simulatedDesignerId === d.id && (
            <Check className="h-4 w-4 text-role-designer" />
          )}
        </DropdownMenuItem>
      ))}
    </>
  );
}
