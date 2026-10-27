const fs = require('fs');
const path = require('path');

const CANONICAL_LOCAL_ASSETS = {
  ragda_pattice: 'ragda_pattice.jpg',
  ragda_puri: 'ragda_puri.jpg',
  pani_puri: 'pani_puri.jpg',
  batata_bhaji: 'batata_bhaji.jpg',
  masala_pav: 'masala_pav.jpg',
  cheese_pav_bhaji: 'cheese_pav_bhaji.jpg',
  kanda_bhaji: 'kanda_bhaji.jpg',
  pav_bhaji: 'pav_bhaji.jpg',
  vada_pav: 'vada_pav.jpg'
};

const testDishes = [
  'Ragda Pattice',
  'Ragda Puri',
  'Pani Puri',
  'Batata Bhaji',
  'Masala Pav',
  'Cheese Pav Bhaji',
  'Kanda Bhaji'
];

console.log('Testing food files existence:');
for (const [key, filename] of Object.entries(CANONICAL_LOCAL_ASSETS)) {
  const p = path.join(__dirname, '..', 'public', 'images', 'food', filename);
  const exists = fs.existsSync(p);
  const size = exists ? fs.statSync(p).size : 0;
  console.log(`- ${key} -> ${filename}: exists=${exists}, size=${size} bytes`);
}
