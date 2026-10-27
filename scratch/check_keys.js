const fs = require('fs');

const routeContent = fs.readFileSync('g:/bakasur-food-tour-v3/app/api/ai/dish-image/route.ts', 'utf8');

// Extract all keys in CANONICAL_LOCAL_ASSETS and CANONICAL_REMOTE_PHOTOS
const localMatches = routeContent.match(/CANONICAL_LOCAL_ASSETS[\s\S]*?};/)[0];
const remoteMatches = routeContent.match(/CANONICAL_REMOTE_PHOTOS[\s\S]*?};/)[0];

const knownKeys = new Set();
const keyRegex = /^\s*([a-z0-9_]+):/gm;
let m;
while ((m = keyRegex.exec(localMatches)) !== null) knownKeys.add(m[1]);
while ((m = keyRegex.exec(remoteMatches)) !== null) knownKeys.add(m[1]);

// Extract all return 'key' statements in matchDishToCanonicalKey
const funcMatch = routeContent.match(/function matchDishToCanonicalKey[\s\S]*?\n\}/)[0];
const returnRegex = /return\s+['"]([a-z0-9_]+)['"]/g;
const missing = new Set();
while ((m = returnRegex.exec(funcMatch)) !== null) {
  if (!knownKeys.has(m[1])) {
    missing.add(m[1]);
  }
}

console.log('Total known image keys:', knownKeys.size);
console.log('Missing keys returned in matchDishToCanonicalKey:', Array.from(missing));
