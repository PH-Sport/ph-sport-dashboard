'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  token: string;
  role: 'ADMIN' | 'DESIGNER';
  max_uses: number;
  uses: number;
  expires_at: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  DESIGNER: 'Diseñador',
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const supabase = createClient();
      
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (fetchError || !data) {
        setError('Esta invitación no existe o ha sido eliminada.');
        setLoading(false);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('Esta invitación ha expirado.');
        setLoading(false);
        return;
      }

      if (data.uses >= data.max_uses) {
        setError('Esta invitación ya ha alcanzado el límite de usos.');
        setLoading(false);
        return;
      }

      setInvitation(data);
      setLoading(false);
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    setSubmitting(true);

    try {
      const supabase = createClient();

      // FIRST: Validate the invitation is still valid before creating auth user
      const { data: isValid, error: validateError } = await supabase.rpc('validate_invitation', {
        p_invitation_id: invitation.id
      });

      if (validateError || !isValid) {
        toast.error('Esta invitación ya no es válida. Puede que haya expirado o ya fue usada.');
        setSubmitting(false);
        return;
      }

      // The invitation's role is applied server-side inside use_invitation(),
      // reading from the invitations table. We never pass role from the client.
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('Este email ya está registrado. Intenta iniciar sesión.');
        } else {
          toast.error(signUpError.message);
        }
        setSubmitting(false);
        return;
      }

      if (!authData.user) {
        toast.error('Error al crear la cuenta. Intenta de nuevo.');
        setSubmitting(false);
        return;
      }

      // Use atomic database function to validate and register the invitation use
      // This MUST succeed for the registration to be considered complete
      const { error: useError } = await supabase.rpc('use_invitation', {
        p_invitation_id: invitation.id,
        p_user_id: authData.user.id,
        p_email: email,
        p_full_name: fullName
      });

      if (useError) {
        console.error('Error using invitation:', useError);
        // The invitation was not valid - show error and abort
        // Note: The auth user was created but without a valid invitation use,
        // they won't be able to access the app (profile won't be created properly)
        toast.error(useError.message || 'Esta invitación ya no es válida');
        setSubmitting(false);
        return; // CRITICAL: Don't proceed to success
      }

      setSuccess(true);
      toast.success('¡Cuenta creada exitosamente!');

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch {
      toast.error('Error al crear la cuenta. Intenta de nuevo.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Invitación no válida
        </h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/login')} variant="outline">
          Ir al login
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          ¡Cuenta creada!
        </h1>
        <p className="text-muted-foreground">Redirigiendo al login...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Has sido invitado
      </h1>
      <p className="text-muted-foreground mb-4">
        Crea tu cuenta en PH Sport
      </p>
      <div className="mb-8">
        <Badge variant="outline" className="text-sm">
          Rol: {ROLE_LABELS[invitation?.role || 'DESIGNER']}
        </Badge>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="Tu nombre"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={submitting}
            className="h-11"
          />
        </div>

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
            disabled={submitting}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="h-11"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-11"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            'Crear Cuenta'
          )}
        </Button>
      </form>
    </div>
  );
}
