'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Loader2, ZoomIn, ImageOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCroppedJpeg, type PixelCrop } from '@/lib/utils/image';

type Status = 'loading' | 'ready' | 'error';

interface AvatarUploadDialogProps {
  /** Fichero elegido por el usuario; null cuando no hay nada que recortar. */
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recibe el JPEG recortado/comprimido listo para subir. */
  onConfirm: (blob: Blob) => Promise<void> | void;
  /** La subida está en curso (viene del hook de preferencias). */
  uploading: boolean;
}

export function AvatarUploadDialog({
  file,
  open,
  onOpenChange,
  onConfirm,
  uploading,
}: AvatarUploadDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<PixelCrop | null>(null);
  const [processing, setProcessing] = useState(false);

  // Crear/limpiar el object URL del fichero seleccionado.
  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStatus('loading');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPixels(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_area: Area, areaPx: Area) => {
    setAreaPixels(areaPx);
  }, []);

  const handleConfirm = async () => {
    if (!imageUrl || !areaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedJpeg(imageUrl, areaPixels);
      await onConfirm(blob);
    } catch {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  const busy = processing || uploading;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // No permitir cerrar mientras se procesa/sube.
        if (busy) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajusta tu foto</DialogTitle>
          <DialogDescription>
            Arrastra y haz zoom para encuadrar tu avatar. Se guardará recortada y optimizada.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2 h-64 w-full overflow-hidden rounded-xl bg-muted">
          {imageUrl && status !== 'error' && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={() => setStatus('ready')}
            />
          )}

          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted px-6 text-center">
              <ImageOff className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                No pudimos procesar esta imagen
              </p>
              <p className="text-xs text-muted-foreground">
                Prueba con un archivo JPG o PNG (los HEIC de iPhone no son compatibles).
              </p>
            </div>
          )}
        </div>

        {status === 'ready' && (
          <div className="mt-4 flex items-center gap-3">
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom de la imagen"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
              disabled={busy}
            />
          </div>
        )}

        <DialogFooter className="mt-6 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={busy || status !== 'ready' || !areaPixels}
            className="min-w-[140px]"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo
              </>
            ) : (
              'Confirmar y subir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
