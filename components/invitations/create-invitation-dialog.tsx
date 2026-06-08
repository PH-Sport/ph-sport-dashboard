'use client';

import { useState } from 'react';
import { logger } from '@/lib/utils/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Copy, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CreateInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateInvitationDialog({ 
  open, 
  onOpenChange,
  onCreated 
}: CreateInvitationDialogProps) {
  const [role, setRole] = useState<'ADMIN' | 'DESIGNER'>('DESIGNER');
  const [creating, setCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleCreate = async () => {
    setCreating(true);

    try {
      const supabase = createClient();
      const token = generateToken();
      
      // Fixed: 7 days expiration, 1 use
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from('invitations')
        .insert({
          token,
          role,
          max_uses: 1,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        toast.error('Error al crear la invitación');
        logger.error('Error creating invitation:', error);
        setCreating(false);
        return;
      }

      setCreatedToken(token);
      
      // Auto-copy to clipboard
      const url = `${window.location.origin}/invite/${token}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('¡Invitación creada y copiada al portapapeles!');
      } catch {
        toast.success('Invitación creada');
      }
      
      onCreated();
    } catch {
      toast.error('Error al crear la invitación');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!createdToken) return;
    
    const url = `${window.location.origin}/invite/${createdToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setCreatedToken(null);
      setCopied(false);
      setRole('DESIGNER');
    }
    onOpenChange(open);
  };

  const getInviteUrl = () => {
    if (!createdToken || typeof window === 'undefined') return '';
    return `${window.location.origin}/invite/${createdToken}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {createdToken ? '¡Link creado!' : 'Nueva Invitación'}
          </DialogTitle>
          <DialogDescription>
            {createdToken 
              ? 'El link ha sido copiado al portapapeles.'
              : 'La invitación expira en 7 días y es de un solo uso.'}
          </DialogDescription>
        </DialogHeader>

        {createdToken ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input 
                value={getInviteUrl()} 
                readOnly 
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                aria-label={copied ? 'Link copiado' : 'Copiar link de invitación'}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-status-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESIGNER">Diseñador</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          {createdToken ? (
            <Button onClick={() => handleClose(false)} className="w-full">
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear y Copiar'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
