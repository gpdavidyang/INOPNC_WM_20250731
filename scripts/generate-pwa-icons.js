const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA
const sizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Brand colors
const brandColor = '#2563eb'; // blue-600
const backgroundColor = '#ffffff';
const textColor = '#1f2937'; // gray-800

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);
  
  // Brand circle background
  const center = size / 2;
  const radius = size * 0.4;
  
  ctx.fillStyle = brandColor;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fill();
  
  // Construction helmet icon (simplified)
  const helmetSize = size * 0.3;
  const helmetX = center - helmetSize / 2;
  const helmetY = center - helmetSize / 3;
  
  ctx.fillStyle = backgroundColor;
  ctx.strokeStyle = backgroundColor;
  ctx.lineWidth = size * 0.02;
  
  // Helmet shape
  ctx.beginPath();
  ctx.arc(center, helmetY + helmetSize * 0.6, helmetSize * 0.4, Math.PI, 0);
  ctx.fill();
  
  // Helmet brim
  ctx.fillRect(center - helmetSize * 0.5, helmetY + helmetSize * 0.8, helmetSize, size * 0.03);
  
  // Add "I" letter for INOPNC
  ctx.fillStyle = backgroundColor;
  ctx.font = `bold ${size * 0.15}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('I', center, center + helmetSize * 0.2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Generate all icon sizes
sizes.forEach(({ size, name }) => {
  generateIcon(size, name);
});

// Generate favicon.ico (16x16 and 32x32)
const faviconSizes = [16, 32];
faviconSizes.forEach(size => {
  generateIcon(size, `favicon-${size}x${size}.png`);
});

// Generate apple-touch-icon
generateIcon(180, 'apple-touch-icon.png');

console.log('✅ All PWA icons generated successfully!');