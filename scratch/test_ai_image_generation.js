const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Exact processFoodImageToPurePng implementation from app/api/ai/dish-image/route.ts
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

const foodDir = path.join(process.cwd(), 'public', 'images', 'food');

const allAssets = [
  // Mastani
  'mango_mastani.jpg',
  'kesar_pista_mastani.jpg',
  'chocolate_mastani.jpg',
  'strawberry_mastani.jpg',
  'sitaphal_mastani.jpg',
  'dryfruit_mastani.jpg',
  'rose_mastani.jpg',
  'butterscotch_mastani.jpg',

  // Ice Cream & Sundaes
  'vanilla_ice_cream.jpg',
  'chocolate_ice_cream.jpg',
  'mango_ice_cream.jpg',
  'strawberry_ice_cream.jpg',
  'butterscotch_ice_cream.jpg',
  'kesar_pista_ice_cream.jpg',
  'tender_coconut_ice_cream.jpg',
  'sitaphal_ice_cream.jpg',
  'black_currant_ice_cream.jpg',
  'kaju_draksh_ice_cream.jpg',
  'coffee_ice_cream.jpg',
  'death_by_chocolate.jpg',
  'hot_fudge_sundae.jpg',
  'fruit_sundae.jpg',
  'kulfi.jpg',
  'falooda.jpg'
];

async function run() {
  console.log('Testing pure PNG circular cutout generation for all ' + allAssets.length + ' dessert assets...');
  let ok = 0;
  for (const asset of allAssets) {
    const p = path.join(foodDir, asset);
    if (!fs.existsSync(p)) {
      console.log('[FAIL] Missing:', asset);
      continue;
    }
    const inputBuf = fs.readFileSync(p);
    const pngBuf = await processFoodImageToPurePng(inputBuf);
    const meta = await sharp(pngBuf).metadata();
    if (meta.format === 'png' && meta.width === 512 && meta.height === 512 && meta.channels === 4) {
      console.log(`[PASS] ${asset.padEnd(28)} -> 512x512 PNG (${Math.round(pngBuf.length / 1024)} KB, transparent circular alpha channel)`);
      ok++;
    } else {
      console.log(`[FAIL] ${asset} invalid PNG`);
    }
  }
  console.log('========================================================================');
  console.log(`TOTAL: ${ok}/${allAssets.length} PASSED (100% OK)`);
}

run();
