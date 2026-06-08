interface AuthErrorProps {
  message: string;
}

/** Mensaje de error inline para forms de auth. Devuelve null si no hay mensaje. */
export function AuthError({ message }: AuthErrorProps) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
      {message}
    </div>
  );
}
