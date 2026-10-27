const fs = require('fs');

let content = fs.readFileSync('./app/api/ai/dish-image/route.ts', 'utf8');

// Strip TypeScript types simply
const fnStart = content.indexOf('function matchDishToCanonicalKey');
const fnEnd = content.indexOf('function resolveDishPhotoUrl');
let fnCode = content.substring(fnStart, fnEnd);
fnCode = fnCode.replace(/:\s*string/g, '').replace(/:\s*boolean/g, '');

const evalMatcher = new Function(fnCode + '\nreturn matchDishToCanonicalKey;');
const matcher = evalMatcher();

// Also extract CANONICAL_LOCAL_ASSETS and CANONICAL_REMOTE_PHOTOS
const localStart = content.indexOf('const CANONICAL_LOCAL_ASSETS');
const localEnd = content.indexOf('const CANONICAL_REMOTE_PHOTOS');
let localCode = content.substring(localStart, localEnd).replace('const CANONICAL_LOCAL_ASSETS: Record<string, string> =', 'const CANONICAL_LOCAL_ASSETS =');

const remoteStart = content.indexOf('const CANONICAL_REMOTE_PHOTOS');
const remoteEnd = content.indexOf('function matchDishToCanonicalKey');
let remoteCode = content.substring(remoteStart, remoteEnd).replace('const CANONICAL_REMOTE_PHOTOS: Record<string, string> =', 'const CANONICAL_REMOTE_PHOTOS =');

const evalAssets = new Function(localCode + '\n' + remoteCode + '\nreturn { CANONICAL_LOCAL_ASSETS, CANONICAL_REMOTE_PHOTOS };');
const { CANONICAL_LOCAL_ASSETS, CANONICAL_REMOTE_PHOTOS } = evalAssets();

const testDishes = [
  'Special Mango Mastani',
  'Mango Mastani',
  'Sujata Famous Pure Mango Mastani',
  'Royal Kesar Pista Dryfruit Mastani',
  'Kesar Pista Mastani',
  'Chocolate Fudge Brownie Mastani',
  'Chocolate Brownie Mastani',
  'Chocolate Mastani',
  'Special Anjir Badam Mastani Glass',
  'Anjir Badam Mastani',
  'Royal Kaju Draksh Sitaphal Mastani',
  'Sitaphal Mastani',
  'Fresh Strawberry Crush Mastani',
  'Strawberry Mastani',
  'Dryfruit Royal Mastani',
  'Rose Mastani',
  'Gulkand Mastani',
  'Butterscotch Mastani',
  'Pista Mastani',
  'Vanilla Ice Cream',
  'Chocolate Ice Cream',
  'Mango Ice Cream',
  'Strawberry Ice Cream',
  'Butterscotch Ice Cream',
  'Kesar Pista Ice Cream',
  'Pista Ice Cream',
  'Sitaphal Ice Cream',
  'Tender Coconut Natural Ice Cream',
  'Tender Coconut Ice Cream',
  'Belgian Chocolate Ice Cream',
  'Black Currant Ice Cream',
  'Kaju Draksh Ice Cream',
  'Roasted Almond Ice Cream',
  'Anjir Ice Cream',
  'Coffee Ice Cream',
  'Cotton Candy Ice Cream',
  'Natural Ice Cream',
  'Death By Chocolate (DBC)',
  'Hot Fudge Ice Cream Sundae',
  'Sundae',
  'Fruit Melba Sundae',
  'Kulfi',
  'Matka Kulfi',
  'Malai Kulfi',
  'Falooda',
  'Kulfi Falooda',
  'Rose Falooda'
];

console.log('Dish Name'.padEnd(40) + ' -> ' + 'Canonical Key'.padEnd(25) + ' -> ' + 'Source / Asset');
console.log('-'.repeat(100));

testDishes.forEach(d => {
  const key = matcher(d, 'Sujata Mastani');
  const local = CANONICAL_LOCAL_ASSETS[key];
  const remote = CANONICAL_REMOTE_PHOTOS[key];
  let src = 'MISSING!';
  if (local) {
    const exists = fs.existsSync('./public/images/food/' + local);
    src = `LOCAL: ${local} (${exists ? 'EXISTS' : 'FILE NOT FOUND!'})`;
  } else if (remote) {
    src = `REMOTE: ${remote.slice(0, 45)}...`;
  }
  console.log(d.padEnd(40) + ' -> ' + key.padEnd(25) + ' -> ' + src);
});
