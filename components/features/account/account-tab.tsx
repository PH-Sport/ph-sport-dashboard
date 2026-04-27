'use client';

import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2 } from 'lucide-react';

interface AccountTabProps {
  name: string;
  onNameChange: (name: string) => void;
  email: string | undefined;
  role: string | undefined;
  avatarUrl: string | null | undefined;
  uploading: boolean;
  onAvatarFile: (file: File) => void;
}

export function AccountTab({
  name,
  onNameChange,
  email,
  role,
  avatarUrl,
  uploading,
  onAvatarFile,
}: AccountTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAvatarFile(file);
  };

  const initialsFromName = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.split('@')[0].substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          <Avatar className="h-24 w-24 border-2 border-border group-hover:border-primary transition-colors">
            <AvatarImage src={avatarUrl || ''} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {initialsFromName}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
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
    </div>
  );
}
