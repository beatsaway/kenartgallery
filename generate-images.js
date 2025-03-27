const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create 19 placeholder images
for (let i = 1; i <= 19; i++) {
    // Create a canvas
    const canvas = createCanvas(600, 800);
    const ctx = canvas.getContext('2d');

    // Fill background with a random color
    const hue = Math.random() * 360;
    ctx.fillStyle = `hsl(${hue}, 70%, 80%)`;
    ctx.fillRect(0, 0, 600, 800);

    // Add some text
    ctx.fillStyle = '#333333';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Artwork ${i}`, 300, 400);

    // Save the image
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(__dirname, 'public', 'images', `piece${i}.jpg`), buffer);
}

console.log('Generated 19 placeholder images'); 