/**
 * Genera el logo que usan los correos: monograma blanco sobre negro.
 *
 * En comunicaciones la marca va siempre en blanco sobre negro; el dorado
 * queda reservado para acentos (decisión de Mario, 2026-08-05) — aquí lo
 * lleva la barra superior de la plantilla.
 *
 * Existe aparte de los iconos PWA por dos razones: el apple-touch-icon pesa
 * 960px para mostrarse a 96, y su margen está calculado para la máscara
 * squircle de iOS, que en un correo no aplica.
 *
 * Los clientes de correo no renderizan SVG (Gmail entre ellos), de ahí el PNG.
 *
 * Uso: node scripts/generate-email-logo.mjs
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(__dirname, '../public/images/logo-ph-sport-email-192.png');

// Geometría del logo (misma fuente que generate-pwa-icons.mjs).
const VB_W = 259.8;
const VB_H = 206.1;
const POLYLINES = [
  '0 206.1 58.2 206.1 57.9 145.5 158.1 45.4 112.7 0 0 0 0 52.6 76.9 52.6 0 128.7',
  '122.6 206.1 200.1 206.1 152.2 157.8 173 137.1 182.4 146.4 259.8 146.4 169.6 55.6 130.5 94.2 131.8 95.6 141.1 105.4 120.3 125.8 109.8 115.4 70.8 153.9',
];

// 192px = 2x el tamaño al que se muestra en el correo (96), para retina.
const SIZE = 192;
const FRAC = 0.62; // sin máscara de por medio, el logo puede respirar menos que en la PWA

const scale = (SIZE * FRAC) / VB_W;
const tx = (SIZE - VB_W * scale) / 2;
const ty = (SIZE - VB_H * scale) / 2;
const polys = POLYLINES.map((p) => `<polyline points="${p}"/>`).join('');

const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<rect width="${SIZE}" height="${SIZE}" fill="#000000"/>` +
    `<g transform="translate(${tx} ${ty}) scale(${scale})" fill="#ffffff">${polys}</g>` +
    `</svg>`
);

// El resize es necesario: con `density` alta sharp rasteriza por encima del
// tamaño declarado en el SVG (por eso apple-touch-icon.png acaba en 960px
// cuando generate-pwa-icons.mjs pide 180).
await sharp(svg, { density: 384 }).resize(SIZE, SIZE).png().toFile(dest);

const meta = await sharp(dest).metadata();
console.log(`Escrito ${path.basename(dest)} (${meta.width}x${meta.height}).`);
