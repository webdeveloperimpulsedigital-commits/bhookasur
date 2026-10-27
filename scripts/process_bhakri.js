const sharp = require('sharp');
const fs = require('fs');

const src = 'C:/Users/HP/.gemini/antigravity-ide/brain/b51c61a9-03de-4cb9-a567-c0266fe55988/bhakri_bhaji_1790085648360.jpg';

async function process() {
  if (!fs.existsSync(src)) {
    console.error('Source not found:', src);
    return;
  }

  // 1. Save high-res plate image
  await sharp(src)
    .resize(600, 600, { fit: 'cover' })
    .jpeg({ quality: 92 })
    .toFile('public/images/eating/bhakri_bhaji.jpg');

  fs.copyFileSync('public/images/eating/bhakri_bhaji.jpg', 'public/images/eating/bhakri_bhaji_dish.jpg');

  // 2. Create circular 256x256 flying dish with alpha
  const size = 256;
  const radius = 128;
  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="#fff" /></svg>`
  );

  await sharp('public/images/eating/bhakri_bhaji.jpg')
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toFile('public/images/eating/bhakri_bhaji_flying.png');

  fs.copyFileSync('public/images/eating/bhakri_bhaji_flying.png', 'public/images/eating/bhakri_bhaji_dish_flying.png');

  console.log('Successfully created bhakri_bhaji images');
}

process().catch(console.error);
