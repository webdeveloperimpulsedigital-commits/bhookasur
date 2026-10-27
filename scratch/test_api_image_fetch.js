const fs = require('fs');
const path = require('path');

// Verify CANONICAL_LOCAL_ASSETS files exist in public/images/food/
const localAssets = [
  'sandwich.jpg',
  'fries.jpg',
  'jeera_rice.jpg',
  'fried_rice.jpg',
  'biryani.jpg',
  'pulao.jpg',
  'tawa_pulao.jpg',
  'chicken_pulao.jpg',
  'paneer_tikka.jpg',
  'tandoori_chicken.jpg',
  'chicken_lollipop.jpg',
  'fish_fry.jpg',
  'kothimbir_vadi.jpg',
  'alu_vadi.jpg',
  'sabudana_vada.jpg',
  'momos.jpg',
  'burger.jpg',
  'pizza.jpg',
  'butter_chicken.jpg',
  'chicken_curry.jpg',
  'mutton_curry.jpg',
  'mutton_thali.jpg',
  'paneer_butter_masala.jpg',
  'palak_paneer.jpg',
  'dal_makhani.jpg',
  'dal_tadka.jpg',
  'veg_kolhapuri.jpg',
  'thali.jpg'
];

console.log('=== Checking Local Image Files Existence ===');
let missingFiles = 0;
localAssets.forEach(file => {
  const p = path.join('public', 'images', 'food', file);
  if (fs.existsSync(p)) {
    const stat = fs.statSync(p);
    console.log(`✅ ${file.padEnd(25)} (${Math.round(stat.size / 1024)} KB)`);
  } else {
    console.log(`❌ ${file.padEnd(25)} MISSING!`);
    missingFiles++;
  }
});

console.log(`\nLocal assets check complete. Missing: ${missingFiles}`);
process.exit(missingFiles > 0 ? 1 : 0);
