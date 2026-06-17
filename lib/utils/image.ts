/** Utilidades de imagen para el recorte/compresión de avatares (lado cliente). */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Carga una imagen desde una URL (object URL). Rechaza si el navegador no puede decodificarla. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo decodificar la imagen'));
    img.src = src;
  });
}

/**
 * Recorta la región `crop` (en píxeles de la imagen original), la escala a un
 * cuadrado `size`x`size` y la exporta como JPEG comprimido.
 *
 * Esto reemplaza el "rechazo por tamaño": sea cual sea el peso de la imagen de
 * entrada, la salida es siempre un JPEG pequeño (típicamente decenas de KB) que
 * encaja holgadamente bajo el límite del bucket y pasa su filtro MIME.
 */
export async function getCroppedJpeg(
  imageSrc: string,
  crop: PixelCrop,
  size = 512,
  quality = 0.85
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el lienzo de imagen');

  // Fondo blanco por si la fuente tiene transparencia (JPEG no la soporta).
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo generar la imagen recortada'));
      },
      'image/jpeg',
      quality
    );
  });
}
