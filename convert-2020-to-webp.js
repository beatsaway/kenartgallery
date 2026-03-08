/**
 * Convert 2020 gallery JPGs to WebP 800×1024 with forceful resize (no aspect ratio preserved).
 * Run: node convert-2020-to-webp.js
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '2020', 'images');
const W = 800, H = 1024;

const FILES = [];
for (let i = 1; i <= 45; i++) FILES.push('pasted_images' + i + '.jpg');

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
      .resize(W, H)
      .webp({ quality: 85 })
      .toFile(out);
    console.log('OK:', base + '.webp');
  }
  console.log('Done.');
}

run().catch((err) => { console.error(err); process.exit(1); });
