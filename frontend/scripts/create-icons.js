const fs = require('fs');
const path = require('path');

// Simple PNG creator (1x1 pixel, will be scaled by browser)
function createSimplePNG(size) {
  // PNG header for a simple image
  const width = size;
  const height = size;
  
  // Create a simple black square with gold border
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#000000"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2.5}" fill="#FFD700"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/3.5}" fill="#000000"/>
    <text x="${size/2}" y="${size/2}" font-size="${size/2}" font-family="Arial" font-weight="bold" fill="#FFD700" text-anchor="middle" dominant-baseline="central">G</text>
  </svg>`;
  
  return canvas;
}

// Create icons
const publicDir = path.join(__dirname, '..', 'public');

// Create 192x192
const icon192 = createSimplePNG(192);
fs.writeFileSync(path.join(publicDir, 'icon-192x192.svg'), icon192);

// Create 512x512  
const icon512 = createSimplePNG(512);
fs.writeFileSync(path.join(publicDir, 'icon-512x512.svg'), icon512);

console.log('✅ Icons created successfully!');
console.log('📁 Location: frontend/public/');
console.log('📝 Files: icon-192x192.svg, icon-512x512.svg');
