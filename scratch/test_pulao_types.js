const fs = require('fs');
const path = require('path');

// Read the matching logic directly from route.ts to guarantee 100% parity
const routeFile = fs.readFileSync(path.join(__dirname, '../app/api/ai/dish-image/route.ts'), 'utf8');

// Extract CANONICAL_LOCAL_ASSETS from route.ts
const localAssetsMatch = routeFile.match(/const CANONICAL_LOCAL_ASSETS: Record<string, string> = \{([\s\S]*?)\};/);
if (!localAssetsMatch) {
  console.error('Failed to parse CANONICAL_LOCAL_ASSETS from route.ts');
  process.exit(1);
}

const CANONICAL_LOCAL_ASSETS = eval('({' + localAssetsMatch[1] + '})');

// Extract matchDishToCanonicalKey from route.ts
const funcMatch = routeFile.match(/function matchDishToCanonicalKey\([\s\S]*?\n\}/);
if (!funcMatch) {
  console.error('Failed to parse matchDishToCanonicalKey from route.ts');
  process.exit(1);
}

// Strip TypeScript types
const jsCode = funcMatch[0]
  .replace(/function matchDishToCanonicalKey\([^)]*\): string/, 'function matchDishToCanonicalKey(dishName, restaurantName)')
  .replace(/: string/g, '')
  .replace(/: Record<[^>]+>/g, '');

const matchDishToCanonicalKey = new Function('dishName', 'restaurantName', jsCode + '\nreturn matchDishToCanonicalKey(dishName, restaurantName);');

const pulaoTestCases = [
  // --- 1. VEG PULAO / PULAV VARIETIES ---
  { dish: 'Veg Pulao', expected: 'pulao' },
  { dish: 'Vegetable Pulao', expected: 'pulao' },
  { dish: 'Veg Pulav', expected: 'pulao' },
  { dish: 'Vegetable Pulav', expected: 'pulao' },
  { dish: 'Special Veg Pulao with Raita', expected: 'pulao' },
  { dish: 'Green Peas Pulao', expected: 'pulao' },
  { dish: 'Matar Pulao', expected: 'pulao' },
  { dish: 'Mutter Pulav', expected: 'pulao' },
  { dish: 'Paneer Pulao', expected: 'pulao' },
  { dish: 'Paneer Pulav', expected: 'pulao' },
  { dish: 'Paneer Tikka Pulao', expected: 'pulao' },
  { dish: 'Kashmiri Pulao', expected: 'pulao' },
  { dish: 'Kashmiri Pulav', expected: 'pulao' },
  { dish: 'Navratan Pulao', expected: 'pulao' },
  { dish: 'Corn Pulao', expected: 'pulao' },
  { dish: 'Mushroom Pulao', expected: 'pulao' },
  { dish: 'Kaju Pulao', expected: 'pulao' },
  { dish: 'Cashew Nut Pulav', expected: 'pulao' },
  { dish: 'Jeera Pulao', expected: 'pulao' },
  { dish: 'Jeera Pulav', expected: 'pulao' },
  { dish: 'Shahi Pulao', expected: 'pulao' },
  { dish: 'Masale Bhaat', expected: 'pulao' },
  { dish: 'Masala Pulav', expected: 'pulao' },

  // --- 2. TAWA PULAO VARIETIES ---
  { dish: 'Tawa Pulao', expected: 'tawa_pulao' },
  { dish: 'Tawa Pulav', expected: 'tawa_pulao' },
  { dish: 'Mumbai Tawa Pulao', expected: 'tawa_pulao' },
  { dish: 'Pav Bhaji Tawa Pulao', expected: 'tawa_pulao' },
  { dish: 'Bombay Tava Pulav', expected: 'tawa_pulao' },

  // --- 3. NON-VEG PULAO / PULAV VARIETIES ---
  { dish: 'Chicken Pulao', expected: 'chicken_pulao' },
  { dish: 'Chicken Pulav', expected: 'chicken_pulao' },
  { dish: 'Murgh Pulao', expected: 'chicken_pulao' },
  { dish: 'Mutton Pulao', expected: 'chicken_pulao' },
  { dish: 'Mutton Pulav', expected: 'chicken_pulao' },
  { dish: 'Gosht Pulao', expected: 'chicken_pulao' },
  { dish: 'Yakhni Pulao', expected: 'chicken_pulao' },
  { dish: 'Prawns Pulao', expected: 'chicken_pulao' },
  { dish: 'Fish Pulav', expected: 'chicken_pulao' },
  { dish: 'Egg Pulao', expected: 'chicken_pulao' },
  { dish: 'Anda Pulav', expected: 'chicken_pulao' },

  // --- 4. CONTRAST / REGRESSION CHECKS (Must NOT become Pulao) ---
  { dish: 'Jeera Rice', expected: 'jeera_rice' },
  { dish: 'Steamed Basmati Rice', expected: 'jeera_rice' },
  { dish: 'Curd Rice', expected: 'jeera_rice' },
  { dish: 'Moong Dal Khichdi', expected: 'jeera_rice' },
  { dish: 'Veg Fried Rice', expected: 'fried_rice' },
  { dish: 'Chicken Fried Rice', expected: 'fried_rice' },
  { dish: 'Schezwan Rice', expected: 'fried_rice' },
  { dish: 'Hyderabadi Chicken Biryani', expected: 'biryani' },
  { dish: 'Veg Dum Biryani', expected: 'biryani' },
  { dish: 'Paneer Butter Masala', expected: 'paneer_butter_masala' },
  { dish: 'Butter Chicken', expected: 'butter_chicken' }
];

console.log('====================================================');
console.log('   PULAO / PULAV COMPREHENSIVE CLASSIFICATION TEST   ');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

pulaoTestCases.forEach((tc) => {
  const resultKey = matchDishToCanonicalKey(tc.dish);
  const assetFile = CANONICAL_LOCAL_ASSETS[resultKey];
  const diskPath = assetFile ? path.join(__dirname, '../public/images/food', assetFile) : null;
  const fileExists = diskPath && fs.existsSync(diskPath);

  const isMatch = resultKey === tc.expected;
  if (isMatch && fileExists) {
    passed++;
    console.log(`[PASS] "${tc.dish}" -> ${resultKey} (${assetFile}) [File Exists: ${fs.statSync(diskPath).size} bytes]`);
  } else {
    failed++;
    console.log(`[FAIL] "${tc.dish}" -> Got "${resultKey}" (Expected: "${tc.expected}"), Asset: ${assetFile}, Exists: ${fileExists}`);
  }
});

console.log('\n====================================================');
console.log(`Summary: ${passed} PASSED, ${failed} FAILED (Total: ${pulaoTestCases.length})`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('[SUCCESS] All Pulao and Pulav dish types correctly verified!');
}
