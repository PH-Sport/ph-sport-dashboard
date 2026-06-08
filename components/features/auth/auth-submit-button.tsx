import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthSubmitButtonProps {
  loading: boolean;
  loadingLabel: string;
  children: React.ReactNode;
  disabled?: boolean;
}

/** Botón submit estándar de forms de auth, con loader integrado. */
export function AuthSubmitButton({ loading, loadingLabel, children, disabled }: AuthSubmitButtonProps) {
  return (
    <Button type="submit" disabled={loading || disabled} size="lg" className="h-11 w-full">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
