/**
 * Rename gallery images to img_01.webp, img_02.webp, ... in 2016, 2020, 2025.
 * Run: node rename-to-img-xx.js
 */
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;

const tasks = [
  {
    dir: path.join(ROOT, '2016', 'images'),
    count: 10,
    oldName: function (i) { return 'i' + String(i).padStart(3, '0') + '.webp'; }
  },
  {
    dir: path.join(ROOT, '2020', 'images'),
    count: 45,
    oldName: function (i) { return 'pasted_images' + i + '.webp'; }
  },
  {
    dir: path.join(ROOT, '2025', 'images'),
    count: 19,
    oldName: function (i) { return 'piece' + i + '.webp'; }
  }
];

function run() {
  for (const t of tasks) {
    console.log('Dir:', t.dir);
    for (let i = 1; i <= t.count; i++) {
      const oldPath = path.join(t.dir, t.oldName(i));
      const newName = 'img_' + String(i).padStart(2, '0') + '.webp';
      const newPath = path.join(t.dir, newName);
      if (!fs.existsSync(oldPath)) {
        console.warn('  Skip (not found):', t.oldName(i));
        continue;
      }
      if (oldPath === newPath) continue;
      fs.renameSync(oldPath, newPath);
      console.log('  ', t.oldName(i), '->', newName);
    }
  }
  console.log('Done.');
}

run();
