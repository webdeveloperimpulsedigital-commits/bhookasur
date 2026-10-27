const fs = require('fs');
const content = fs.readFileSync('app/api/ai/dish-image/route.ts', 'utf8');

const keysToCheck = [
  'pizza',
  'margherita_pizza',
  'paneer_pizza',
  'chicken_pizza',
  'pepperoni_pizza',
  'veg_supreme_pizza',
  'farmhouse_pizza',
  'wood_fired_pizza',
  'garlic_bread',
  'cheese_garlic_bread',
  'fries',
  'peri_peri_fries',
  'cheesy_fries',
  'loaded_fries',
  'fried_chicken',
  'kfc_fried_chicken',
  'crispy_fried_chicken',
  'chicken_popcorn',
  'chicken_strips',
  'chicken_wings',
  'crispy_chicken_burger',
  'zinger_burger',
  'chicken_bucket'
];

// Extract CANONICAL_LOCAL_ASSETS
const localAssetMatch = content.match(/const CANONICAL_LOCAL_ASSETS: Record<string, string> = \{([\s\S]*?)\};/);
const localAssets = {};
if (localAssetMatch) {
  localAssetMatch[1].split('\n').forEach(line => {
    const m = line.match(/^\s*([a-zA-Z0-9_]+):\s*['"]([^'"]+)['"]/);
    if (m) localAssets[m[1]] = m[2];
  });
}

// Extract CANONICAL_REMOTE_PHOTOS
const remoteMatch = content.match(/const CANONICAL_REMOTE_PHOTOS: Record<string, string> = \{([\s\S]*?)\};/);
const remotePhotos = {};
if (remoteMatch) {
  remoteMatch[1].split('\n').forEach(line => {
    const m = line.match(/^\s*([a-zA-Z0-9_]+):\s*['"]([^'"]+)['"]/);
    if (m) remotePhotos[m[1]] = m[2];
  });
}

console.log('--- PIZZA, FRIES & KFC AUDIT ---');
for (const k of keysToCheck) {
  console.log(
    k.padEnd(25),
    'Local File:', (localAssets[k] || 'NONE').padEnd(25),
    'Remote URL:', remotePhotos[k] ? 'EXISTS' : 'NONE'
  );
}
