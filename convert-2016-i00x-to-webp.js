/**
 * Convert 2016 i001–i010 PNGs to WebP 800×1024 (fit inside, letterbox with light gray).
 * Run: node convert-2016-i00x-to-webp.js
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '2016', 'images');
const W = 800, H = 1024;
const BG = { r: 224, g: 224, b: 224 };

const FILES = [];
for (let i = 1; i <= 10; i++) FILES.push('i' + String(i).padStart(3, '0') + '.png');

async function run() {
  for (const f of FILES) {
    const src = path.join(IMG_DIR, f);
    const base = f.replace(/\.png$/i, '');
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
