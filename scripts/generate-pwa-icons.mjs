// Genera los iconos PWA (logo blanco sobre fondo negro) desde la geometría del
// logo PHSPORT. Usa `sharp` (presente vía Next). Reejecutable si cambia el arte.
//
//   node scripts/generate-pwa-icons.mjs
//
// Salida:
//   public/icons/icon-192.png, icon-512.png            (purpose: any)
//   public/icons/icon-maskable-192.png, -512.png       (purpose: maskable, con safe-zone)
//   public/images/apple-touch-icon.png                 (180x180, sobrescribe)

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// viewBox del logo (public/images/logo-ph-sport.svg): 0 0 259.8 206.1
const VB_W = 259.8;
const VB_H = 206.1;
const POLYLINES = [
  '0 206.1 58.2 206.1 57.9 145.5 158.1 45.4 112.7 0 0 0 0 52.6 76.9 52.6 0 128.7',
  '122.6 206.1 200.1 206.1 152.2 157.8 173 137.1 182.4 146.4 259.8 146.4 169.6 55.6 130.5 94.2 131.8 95.6 141.1 105.4 120.3 125.8 109.8 115.4 70.8 153.9',
];

const BG = '#000000';
const FG = '#ffffff';

/** SVG cuadrado de lado `size` px: rect negro + logo blanco centrado ocupando `frac` del lado. */
function iconSvg(size, frac) {
  const scale = (size * frac) / VB_W; // el ancho manda (logo más ancho que alto)
  const tx = (size - VB_W * scale) / 2;
  const ty = (size - VB_H * scale) / 2;
  const polys = POLYLINES.map((p) => `<polyline points="${p}"/>`).join('');
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<rect width="${size}" height="${size}" fill="${BG}"/>` +
      `<g transform="translate(${tx} ${ty}) scale(${scale})" fill="${FG}">${polys}</g>` +
      `</svg>`
  );
}

async function render(size, frac, outPath) {
  await sharp(iconSvg(size, frac), { density: 384 }).png().toFile(outPath);
  console.log('  ✓', outPath.replace(root + '\\', '').replace(root + '/', ''));
}

const iconsDir = join(root, 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

console.log('Generando iconos PWA (logo blanco sobre negro)…');
await render(192, 0.66, join(iconsDir, 'icon-192.png'));
await render(512, 0.66, join(iconsDir, 'icon-512.png'));
// maskable: logo dentro de la safe-zone (~52%) para que la máscara de Android no recorte.
await render(192, 0.52, join(iconsDir, 'icon-maskable-192.png'));
await render(512, 0.52, join(iconsDir, 'icon-maskable-512.png'));
// apple-touch-icon: iOS aplica su propia máscara squircle; ~60% va sobrado.
await render(180, 0.6, join(root, 'public', 'images', 'apple-touch-icon.png'));
console.log('Hecho.');
