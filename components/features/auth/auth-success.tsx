import { ReactNode } from 'react';
import { LucideIcon, CheckCircle } from 'lucide-react';

interface AuthSuccessProps {
  title: ReactNode;
  description: ReactNode;
  icon?: LucideIcon;
}

/** Pantalla de éxito centrada (cuenta creada, contraseña actualizada, etc.). */
export function AuthSuccess({ title, description, icon: Icon = CheckCircle }: AuthSuccessProps) {
  return (
    <div className="text-center py-10">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-success/15">
        <Icon className="h-8 w-8 text-status-success" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
