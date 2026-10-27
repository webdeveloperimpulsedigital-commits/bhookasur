const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brainDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/831e53c5-493a-4b4f-a1c0-2be8127d0e22';
const thaliSrc = path.join(brainDir, 'gavran_mutton_thali_1790670037816.jpg');
const keemaSrc = path.join(brainDir, 'keema_pav_1790670058567.jpg');

const thaliDest = path.join(__dirname, '../public/images/eating/gavran_mutton_thali.jpg');
const keemaDest = path.join(__dirname, '../public/images/eating/keema_pav.jpg');

const thaliFlyingDest = path.join(__dirname, '../public/images/eating/gavran_mutton_thali_flying.png');
const keemaFlyingDest = path.join(__dirname, '../public/images/eating/keema_pav_flying.png');

fs.copyFileSync(thaliSrc, thaliDest);
fs.copyFileSync(keemaSrc, keemaDest);

async function makeFlying() {
  const size = 240;
  const radius = 120;
  const circleSvg = Buffer.from(`
    <svg width="${size}" height="${size}">
      <circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="#fff" />
    </svg>
  `);

  // Thali flying
  await sharp(thaliDest)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toFile(thaliFlyingDest);

  // Keema flying
  await sharp(keemaDest)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toFile(keemaFlyingDest);

  console.log('SUCCESS: Copied and generated flying dishes!');
}

makeFlying().catch(console.error);
