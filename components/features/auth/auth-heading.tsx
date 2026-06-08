import { ReactNode } from 'react';

interface AuthHeadingProps {
  title: ReactNode;
  subtitle?: ReactNode;
}

/** Encabezado consistente para todas las páginas de auth (login, reset, invite). */
export function AuthHeading({ title, subtitle }: AuthHeadingProps) {
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>
      {subtitle ? <p className="mb-8 text-muted-foreground">{subtitle}</p> : null}
    </>
  );
}
