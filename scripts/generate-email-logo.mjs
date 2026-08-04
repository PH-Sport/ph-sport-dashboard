/**
 * Rasteriza logo-ph-sport-gold.svg al PNG que usan los correos.
 *
 * Los clientes de correo no renderizan SVG (Gmail entre ellos), y el
 * apple-touch-icon es el icono de la PWA —cuadrado negro—, no la marca.
 * De ahí este PNG aparte: logo dorado sobre transparente, con su proporción
 * original y al doble del tamaño de visualización para que no se vea blando
 * en pantallas retina.
 *
 * Uso: node scripts/generate-email-logo.mjs
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '../public/images/logo-ph-sport-gold.svg');
const dest = path.join(__dirname, '../public/images/logo-ph-sport-gold-240.png');

// viewBox del logo: 259.8 x 206.1
const ancho = 240;
const alto = Math.round((206.1 / 259.8) * ancho);

await sharp(src, { density: 600 })
  .resize(ancho, alto, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(dest);

const meta = await sharp(dest).metadata();
console.log(`Escrito ${path.basename(dest)} (${meta.width}x${meta.height}, alfa: ${meta.hasAlpha}).`);
