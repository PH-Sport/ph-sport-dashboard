'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TRANSITIONS } from '@/components/ui/animations';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [resetSent, setResetSent] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' 
          ? 'Email o contraseña incorrectos' 
          : authError.message);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        setError('Usuario sin perfil configurado. Contacta al administrador.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (profile.role === 'ADMIN') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/my-week';
      }
    } catch {
      setError('Error al iniciar sesión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setResetSent(true);
    } catch {
      setError('Error al enviar el email. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const switchToReset = () => {
    setMode('reset');
    setError('');
    setResetSent(false);
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
    setResetSent(false);
  };

  // Reset password mode
  if (mode === 'reset') {
    return (
      <div>
        <button
          onClick={switchToLogin}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Recuperar contraseña
        </h1>
        <p className="text-muted-foreground mb-8">
          Te enviaremos un enlace para restablecer tu contraseña
        </p>

        {resetSent ? (
          <div className="p-4 border border-[hsl(var(--status-success)/0.5)] rounded-lg bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))]">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5" />
              <span className="font-medium">Email enviado</span>
            </div>
            <p className="text-sm">
              Revisa tu bandeja de entrada en <strong>{email}</strong> y sigue las instrucciones para restablecer tu contraseña.
            </p>
            <p className="text-sm mt-2 opacity-90">
              Si no lo encuentras, revisa tu carpeta de spam.
            </p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>

            {error && (
              <div className="p-3 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full h-11"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </Button>
          </form>
        )}
      </div>
    );
  }

  // Login mode
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Iniciar Sesión
      </h1>
      <p className="text-muted-foreground mb-8">
        Accede a tu cuenta de PH Sport
      </p>

      <form className="space-y-5" onSubmit={handleLogin}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <button 
              type="button" 
              onClick={switchToReset}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={showPassword ? 'visible' : 'hidden'}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={TRANSITIONS.fade}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </Button>
      </form>
    </div>
  );
}
