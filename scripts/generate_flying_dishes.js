const sharp = require('sharp');
const fs = require('fs');

const dishes = [
  'biryani', 'butter_chicken', 'chole_bhature', 'dal_makhani',
  'dosa', 'keema_pav', 'misal', 'pav_bhaji', 'puran_poli', 'spdp'
];

async function createFlyingDishes() {
  const size = 90;
  const radius = 45;
  const circleSvg = Buffer.from(`
    <svg width="${size}" height="${size}">
      <circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="#fff" />
    </svg>
  `);

  for (const d of dishes) {
    const src = `public/images/eating/${d}.jpg`;
    if (!fs.existsSync(src)) continue;
    const dest = `public/images/eating/${d}_flying.png`;
    try {
      await sharp(src)
        .resize(size, size, { fit: 'cover' })
        .composite([{
          input: circleSvg,
          blend: 'dest-in'
        }])
        .png()
        .toFile(dest);
      console.log('Created', dest);
    } catch (e) {
      console.error('Error on', d, e);
    }
  }
}

createFlyingDishes();
