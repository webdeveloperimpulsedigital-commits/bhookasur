const fs = require('fs');
const path = require('path');

const routeContent = fs.readFileSync('app/api/ai/dish-image/route.ts', 'utf8');

// Extract matchDishToCanonicalKey function or test items against it
const itemsToTest = [
  // Pizza items
  'Pizza',
  'Pizza Fire',
  'Fire Pizza',
  'Wood Fired Pizza',
  'Woodfired Pizza',
  'Margherita Pizza',
  'Farmhouse Pizza',
  'Peppy Paneer Pizza',
  'Paneer Pizza',
  'Chicken Pizza',
  'Pepperoni Pizza',
  'Cheese Burst Pizza',
  'Garlic Breadsticks',
  'Cheesy Garlic Bread',

  // Fries items (in case 'Fire' was a typo for 'Fries')
  'Fries',
  'French Fries',
  'Peri Peri Fries',
  'Cheesy Fries',
  'Loaded Fries',
  'Potato Wedges',

  // KFC items
  'KFC',
  'KFC Fried Chicken',
  'KFC Hot & Crispy Fried Chicken',
  'KFC Hot & Crispy Fried Chicken (4 Pcs)',
  'Fried Chicken',
  'Crispy Fried Chicken',
  'KFC Classic Zinger Burger',
  'Zinger Burger',
  'KFC Chicken Burger',
  'Crispy Chicken Popcorn',
  'Crispy Chicken Popcorn Large',
  'Chicken Popcorn',
  'KFC Popcorn Chicken',
  'Chicken Strips',
  'Crispy Chicken Strips',
  'KFC Chicken Wings',
  'Hot Wings',
  'Chicken Bucket',
  'KFC Bucket'
];

// Let's inspect what route.ts has for these keywords
console.log('--- Checking keyword matching in app/api/ai/dish-image/route.ts ---');

// Extract CANONICAL_LOCAL_ASSETS
const localAssetMatch = routeContent.match(/const CANONICAL_LOCAL_ASSETS: Record<string, string> = \{([\s\S]*?)\};/);
const localAssets = {};
if (localAssetMatch) {
  localAssetMatch[1].split('\n').forEach(line => {
    const m = line.match(/^\s*([a-zA-Z0-9_]+):\s*['"]([^'"]+)['"]/);
    if (m) localAssets[m[1]] = m[2];
  });
}

console.log('Total local assets in CANONICAL_LOCAL_ASSETS:', Object.keys(localAssets).length);
console.log('Pizza in local assets:', localAssets['pizza']);
console.log('Burger in local assets:', localAssets['burger']);
console.log('Fries in local assets:', localAssets['fries']);
console.log('Fried Chicken in local assets:', localAssets['fried_chicken']);
console.log('Chicken Wings in local assets:', localAssets['chicken_wings']);
console.log('Chicken Popcorn in local assets:', localAssets['chicken_popcorn']);
console.log('Garlic Bread in local assets:', localAssets['garlic_bread']);
