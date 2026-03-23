/**
 * Rasteriza logo-ph-sport-gold.svg a PNG cuadrado sin recortar el vector:
 * el logo encaja completo dentro del canvas (márgenes transparentes si hace falta).
 */
const path = require('path');
const sharp = require('sharp');

const src = path.join(__dirname, '../public/images/logo-ph-sport-gold.svg');
const outDir = path.join(__dirname, '../public/images');

async function writeContainedPng(width, height, filename) {
  await sharp(src)
    .resize(width, height, {
      fit: 'contain',
      position: 'center',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(outDir, filename));
}

(async () => {
  await writeContainedPng(180, 180, 'apple-touch-icon.png');
  await writeContainedPng(32, 32, 'logo-ph-sport-gold-32.png');
  console.log('Wrote apple-touch-icon.png (180×180) and logo-ph-sport-gold-32.png (32×32) with fit=contain.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
