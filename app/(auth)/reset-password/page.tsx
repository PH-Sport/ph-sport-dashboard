'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { AuthHeading } from '@/components/features/auth/auth-heading';
import { AuthError } from '@/components/features/auth/auth-error';
import { AuthSuccess } from '@/components/features/auth/auth-success';
import { AuthSubmitButton } from '@/components/features/auth/auth-submit-button';
import { PasswordInput } from '@/components/features/auth/password-input';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Verifica que el usuario tiene sesión válida del enlace de reset.
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    };
    checkSession();
  }, [supabase, router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError('Error al actualizar la contraseña. Intenta de nuevo.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthSuccess
        title="¡Contraseña actualizada!"
        description="Redirigiendo al inicio de sesión..."
      />
    );
  }

  return (
    <div>
      <AuthHeading
        title="Nueva contraseña"
        subtitle="Introduce tu nueva contraseña para acceder a tu cuenta"
      />

      <form className="space-y-5" onSubmit={handleResetPassword}>
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            disabled={loading}
          />
        </div>

        <AuthError message={error} />

        <AuthSubmitButton
          loading={loading}
          loadingLabel="Actualizando..."
          disabled={!password || !confirmPassword}
        >
          Actualizar contraseña
        </AuthSubmitButton>
      </form>
    </div>
  );
}
