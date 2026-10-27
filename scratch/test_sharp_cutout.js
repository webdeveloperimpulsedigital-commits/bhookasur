const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function processFoodImageToPurePng(imageBuffer, size = 440) {
  const radius = size / 2 - 8;
  const maskSvg = Buffer.from(
    `<svg width="${size}" height="${size}">
      <defs>
        <radialGradient id="featherMask" cx="50%" cy="50%" r="50%">
          <stop offset="92%" stop-color="white" stop-opacity="1" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="url(#featherMask)" />
    </svg>`
  );

  return sharp(imageBuffer)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .modulate({ saturation: 1.15, brightness: 1.02 })
    .sharpen({ sigma: 1.2 })
    .png({ quality: 92, compressionLevel: 8 })
    .toBuffer();
}

const files = [
  'mango_mastani.jpg',
  'kesar_pista_mastani.jpg',
  'chocolate_mastani.jpg',
  'strawberry_mastani.jpg',
  'sitaphal_mastani.jpg',
  'dryfruit_mastani.jpg',
  'vanilla_ice_cream.jpg',
  'chocolate_ice_cream.jpg',
  'mango_ice_cream.jpg',
  'strawberry_ice_cream.jpg',
  'butterscotch_ice_cream.jpg',
  'kesar_pista_ice_cream.jpg',
  'tender_coconut_ice_cream.jpg',
  'sitaphal_ice_cream.jpg',
  'black_currant_ice_cream.jpg',
  'death_by_chocolate.jpg',
  'coffee_ice_cream.jpg',
  'kulfi.jpg',
  'falooda.jpg',
  'hot_fudge_sundae.jpg'
];

(async () => {
  for (const f of files) {
    const fullPath = path.join(process.cwd(), 'public', 'images', 'food', f);
    if (!fs.existsSync(fullPath)) {
      console.error('File not found:', f);
      continue;
    }
    const buf = fs.readFileSync(fullPath);
    const png = await processFoodImageToPurePng(buf);
    console.log(f + ' -> PNG OK (' + png.length + ' bytes)');
  }
})();
