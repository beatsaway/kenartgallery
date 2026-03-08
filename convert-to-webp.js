/**
 * One-off: convert 2016 gallery JPGs to WebP 800×1024 (fit inside, letterbox with light gray).
 * Run: node convert-to-webp.js
 */
const path = require('path');
const fs = require('fs');

const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '2016', 'images');
const W = 800, H = 1024;
const FILES = [
  'pasted_images46.jpg', 'pasted_images47.jpg', 'pasted_images48.jpg', 'pasted_images49.jpg', 'pasted_images50.jpg',
  'pasted_images51.jpg', 'pasted_images52.jpg', 'pasted_images53.jpg', 'pasted_images54.jpg', 'pasted_images55.jpg'
];
const BG = { r: 224, g: 224, b: 224 };

async function run() {
  for (const f of FILES) {
    const src = path.join(IMG_DIR, f);
    const base = f.replace(/\.jpe?g$/i, '');
    const out = path.join(IMG_DIR, base + '.webp');
    if (!fs.existsSync(src)) {
      console.warn('Skip (not found):', src);
      continue;
    }
    await sharp(src)
      .resize(W, H, { fit: 'contain', background: BG })
      .webp({ quality: 85 })
      .toFile(out);
    console.log('OK:', base + '.webp');
  }
  console.log('Done.');
}

run().catch((err) => { console.error(err); process.exit(1); });
