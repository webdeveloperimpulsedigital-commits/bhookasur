const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processFoodImageToPurePng(inputBuffer) {
  const size = 512;
  const radius = size / 2;

  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/></svg>`
  );

  return await sharp(inputBuffer)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .modulate({ saturation: 1.15, brightness: 1.02 })
    .sharpen({ sigma: 1.1 })
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png({ quality: 90, compressionLevel: 8 })
    .toBuffer();
}

const assets = [
  'wood_fired_pizza.jpg',
  'margherita_pizza.jpg',
  'farmhouse_pizza.jpg',
  'paneer_pizza.jpg',
  'garlic_bread.jpg',
  'kfc_fried_chicken.jpg',
  'fried_chicken.jpg',
  'zinger_burger.jpg',
  'chicken_popcorn.jpg',
  'chicken_strips.jpg',
  'chicken_wings.jpg',
  'peri_peri_fries.jpg',
  'pizza.jpg'
];

async function run() {
  console.log('Testing pure circular PNG cutout generation for Pizza Fire & KFC assets...');
  let ok = 0;
  for (const asset of assets) {
    const p = path.join(process.cwd(), 'public', 'images', 'food', asset);
    const buf = fs.readFileSync(p);
    const pngBuf = await processFoodImageToPurePng(buf);
    const meta = await sharp(pngBuf).metadata();
    if (meta.format === 'png' && meta.width === 512 && meta.height === 512) {
      console.log(`[PASS] ${asset.padEnd(25)} -> 512x512 PNG (${Math.round(pngBuf.length / 1024)} KB, transparent circular cutout)`);
      ok++;
    } else {
      console.log(`[FAIL] ${asset}`);
    }
  }
  console.log(`RESULT: ${ok}/${assets.length} PASSED`);
}

run();
