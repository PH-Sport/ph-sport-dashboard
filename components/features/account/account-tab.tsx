'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera } from 'lucide-react';
import { AvatarUploadDialog } from './avatar-upload-dialog';

interface AccountTabProps {
  name: string;
  onNameChange: (name: string) => void;
  email: string | undefined;
  role: string | undefined;
  avatarUrl: string | null | undefined;
  uploading: boolean;
  /** Sube el JPEG recortado/comprimido. Devuelve true si tuvo éxito. */
  onAvatarConfirm: (blob: Blob) => Promise<boolean>;
}

export function AccountTab({
  name,
  onNameChange,
  email,
  role,
  avatarUrl,
  uploading,
  onAvatarConfirm,
}: AccountTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Permitir volver a elegir el mismo fichero más tarde.
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen (JPG o PNG).');
      return;
    }
    setSelectedFile(file);
    setDialogOpen(true);
  };

  const handleConfirm = async (blob: Blob) => {
    const ok = await onAvatarConfirm(blob);
    if (ok) {
      setDialogOpen(false);
      setSelectedFile(null);
    }
  };

  const displayName = name || email?.split('@')[0];

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          <UserAvatar
            name={displayName}
            src={avatarUrl}
            className="h-24 w-24 border-2 border-border group-hover:border-primary transition-colors"
            fallbackClassName="text-2xl font-bold bg-primary/10 text-primary"
          />
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Haz clic para cambiar tu foto</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre Completo</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Tu nombre"
            className="bg-background border-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={email || ''}
            disabled
            className="bg-muted text-muted-foreground border-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Input
            id="role"
            value={role || 'User'}
            disabled
            className="bg-muted text-muted-foreground border-input capitalize"
          />
        </div>
      </div>

      <AvatarUploadDialog
        file={selectedFile}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedFile(null);
        }}
        onConfirm={handleConfirm}
        uploading={uploading}
      />
    </div>
  );
}
