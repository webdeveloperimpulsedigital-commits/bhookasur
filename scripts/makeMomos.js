const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = 'C:/Users/HP/.gemini/antigravity-ide/brain/d192247e-2743-4538-aa6e-8ffa6611949e/momos_dish_1789556903828.jpg';
const destJpg = path.join(__dirname, '../public/images/eating/momos_dish.jpg');
const destPng = path.join(__dirname, '../public/images/eating/momos_dish_flying.png');

fs.copyFileSync(src, destJpg);

async function run() {
  const size = 500;
  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
  );
  await sharp(destJpg)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toFile(destPng);
  console.log('Successfully created momos assets!');
}

run().catch(console.error);
