const sharp = require('sharp');
const size = 300;
const svg = Buffer.from(
  `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#fff"/></svg>`
);

sharp('public/images/eating/pani_puri_dish.jpg')
  .resize(size, size, { fit: 'cover' })
  .composite([{ input: svg, blend: 'dest-in' }])
  .png()
  .toFile('public/images/eating/pani_puri_dish_flying.png')
  .then(() => console.log('Successfully created pani_puri_dish_flying.png'))
  .catch(console.error);
