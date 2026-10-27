const fs = require('fs');
const content = fs.readFileSync('app/api/ai/dish-image/route.ts', 'utf8');

// Helper to extract an object from code
function extractObject(varName) {
  const reg = new RegExp(`const ${varName}: Record<string, string> = \\{([\\s\\S]*?)\\n\\};`);
  const match = content.match(reg);
  if (!match) throw new Error('Not found: ' + varName);
  const obj = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || !trimmed.includes(':')) continue;
    const parts = trimmed.split(':');
    const key = parts[0].trim().replace(/^['"]|['"]$/g, '');
    const val = parts.slice(1).join(':').trim().replace(/,$/, '').replace(/^['"]|['"]$/g, '');
    obj[key] = val;
  }
  return obj;
}

const CANONICAL_LOCAL_ASSETS = extractObject('CANONICAL_LOCAL_ASSETS');
const CANONICAL_REMOTE_PHOTOS = extractObject('CANONICAL_REMOTE_PHOTOS');

function isPureVegRestaurantName(r) { return false; }

// Extract matchDishToCanonicalKey body
const startIdx = content.indexOf('function matchDishToCanonicalKey');
const endIdx = content.indexOf('function resolveDishPhotoUrl');
const fnCode = content.substring(startIdx, endIdx);

const cleanedFn = fnCode
  .replace(/:\s*string/g, '')
  .replace(/:\s*boolean/g, '');
eval(cleanedFn);

const testDishes = [
  'special ooli bhel',
  'ooli bhel',
  'oli bhel',
  'dahi ooli bhel',
  'dahi oli bhel',
  'masala bhadanga bhel',
  'bhadanga bhel',
  'bhadang bhel',
  'loni sponge dosa',
  'sponge dosa',
  'masala dosa',
  'mysore masala dosa',
  'davangere benne dosa',
  'cheese dosa',
  'paper dosa',
  'plain dosa',
  'rava dosa',
  'set dosa',
  'onion dosa',
  'spring dosa',
  'onioun uttapa',
  'onion uttapa',
  'uttapa',
  'uttapam',
  'onion uttapam',
  'tomato uttapam',
  'mix veg uttapam'
];

for (const dish of testDishes) {
  const key = matchDishToCanonicalKey(dish, '');
  const localFile = CANONICAL_LOCAL_ASSETS[key] || 'NO LOCAL FILE';
  const remote = CANONICAL_REMOTE_PHOTOS[key] || 'NO REMOTE';
  console.log(dish.padEnd(25) + ' -> key: ' + key.padEnd(22) + ' | local: ' + localFile.padEnd(20) + ' | remote: ' + (remote.substring(0, 35) + '...'));
}
