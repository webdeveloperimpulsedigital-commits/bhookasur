const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Read route.ts
const routeContent = fs.readFileSync(path.join(__dirname, '../app/api/ai/dish-image/route.ts'), 'utf8');

// Extract CANONICAL_LOCAL_ASSETS
const localStart = routeContent.indexOf('const CANONICAL_LOCAL_ASSETS');
const localEnd = routeContent.indexOf('const CANONICAL_REMOTE_PHOTOS');
let localCode = routeContent.substring(localStart, localEnd)
  .replace('const CANONICAL_LOCAL_ASSETS: Record<string, string> =', 'const CANONICAL_LOCAL_ASSETS =');

// Extract matchDishToCanonicalKey
const fnStart = routeContent.indexOf('function matchDishToCanonicalKey');
const fnEnd = routeContent.indexOf('function resolveDishPhotoUrl');
let fnCode = routeContent.substring(fnStart, fnEnd)
  .replace(/:\s*string/g, '')
  .replace(/:\s*boolean/g, '');

const evalContext = new Function(localCode + '\n' + fnCode + '\nreturn { CANONICAL_LOCAL_ASSETS, matchDishToCanonicalKey };');
const { CANONICAL_LOCAL_ASSETS, matchDishToCanonicalKey } = evalContext();

const testItems = [
  // Mastani Varieties
  { dish: 'Special Mango Mastani', rest: 'Sujata Mastani', expectedKey: 'mango_mastani' },
  { dish: 'Sujata Famous Pure Mango Mastani', rest: 'Sujata Mastani', expectedKey: 'mango_mastani' },
  { dish: 'Pune Special Famous Mango Mastani', rest: 'Sujata Mastani', expectedKey: 'mango_mastani' },
  { dish: 'Royal Kesar Pista Dryfruit Mastani', rest: 'Sujata Mastani', expectedKey: 'kesar_pista_mastani' },
  { dish: 'Kesar Pista Mastani', rest: 'Sujata Mastani', expectedKey: 'kesar_pista_mastani' },
  { dish: 'Chocolate Fudge Brownie Mastani', rest: 'Sujata Mastani', expectedKey: 'chocolate_mastani' },
  { dish: 'Chocolate Brownie Mastani', rest: 'Sujata Mastani', expectedKey: 'chocolate_mastani' },
  { dish: 'Chocolate Mastani', rest: '', expectedKey: 'chocolate_mastani' },
  { dish: 'Fresh Strawberry Crush Mastani', rest: 'Sujata Mastani', expectedKey: 'strawberry_mastani' },
  { dish: 'Strawberry Mastani', rest: '', expectedKey: 'strawberry_mastani' },
  { dish: 'Royal Kaju Draksh Sitaphal Mastani', rest: 'Sujata Mastani', expectedKey: 'sitaphal_mastani' },
  { dish: 'Sitaphal Mastani', rest: '', expectedKey: 'sitaphal_mastani' },
  { dish: 'Special Anjir Badam Mastani Glass', rest: 'Sujata Mastani', expectedKey: 'dryfruit_mastani' },
  { dish: 'Anjir Badam Mastani', rest: '', expectedKey: 'dryfruit_mastani' },
  { dish: 'Dryfruit Royal Mastani', rest: 'Sujata Mastani', expectedKey: 'dryfruit_mastani' },
  { dish: 'Rose Mastani', rest: '', expectedKey: 'rose_mastani' },
  { dish: 'Gulkand Mastani', rest: '', expectedKey: 'rose_mastani' },
  { dish: 'Butterscotch Mastani', rest: '', expectedKey: 'butterscotch_mastani' },

  // Ice Cream Flavours & Sundaes
  { dish: 'Vanilla Ice Cream', rest: '', expectedKey: 'vanilla_ice_cream' },
  { dish: 'Chocolate Ice Cream', rest: '', expectedKey: 'chocolate_ice_cream' },
  { dish: 'Belgian Chocolate Ice Cream', rest: '', expectedKey: 'chocolate_ice_cream' },
  { dish: 'Alphonso Mango Ice Cream', rest: '', expectedKey: 'mango_ice_cream' },
  { dish: 'Fresh Strawberry Ice Cream', rest: '', expectedKey: 'strawberry_ice_cream' },
  { dish: 'Butterscotch Ice Cream', rest: '', expectedKey: 'butterscotch_ice_cream' },
  { dish: 'Royal Kesar Pista Ice Cream', rest: '', expectedKey: 'kesar_pista_ice_cream' },
  { dish: 'Pistachio Ice Cream', rest: '', expectedKey: 'pista_ice_cream' },
  { dish: 'Tender Coconut Natural Ice Cream', rest: 'Naturals', expectedKey: 'tender_coconut_ice_cream' },
  { dish: 'Sitaphal Ice Cream', rest: 'Naturals', expectedKey: 'sitaphal_ice_cream' },
  { dish: 'Black Currant Ice Cream', rest: '', expectedKey: 'black_currant_ice_cream' },
  { dish: 'Kaju Draksh Ice Cream', rest: '', expectedKey: 'kaju_draksh_ice_cream' },
  { dish: 'Coffee Ice Cream', rest: '', expectedKey: 'coffee_ice_cream' },
  { dish: 'Death By Chocolate (DBC)', rest: 'Corner House', expectedKey: 'death_by_chocolate' },
  { dish: 'Hot Fudge Ice Cream Sundae', rest: 'Corner House', expectedKey: 'hot_fudge_sundae' },
  { dish: 'Brownie Bomb Delight', rest: 'Corner House', expectedKey: 'death_by_chocolate' },
  { dish: 'Warm Sizzling Chocolate Brownie with Ice Cream', rest: '', expectedKey: 'death_by_chocolate' },
  { dish: 'Fruit Melba Sundae', rest: 'Corner House', expectedKey: 'fruit_sundae' },
  { dish: 'Royal Shahi Falooda with Rabdi', rest: '', expectedKey: 'falooda' },
  { dish: 'Heritage Rose Falooda with Rabdi & Kulfi', rest: '', expectedKey: 'falooda' },
  { dish: 'Saffron Matka Kulfi on Stick', rest: '', expectedKey: 'kulfi' },
  { dish: 'Special Malai Kulfi Falooda', rest: '', expectedKey: 'falooda' }
];

async function runAudit() {
  console.log('========================================================================================');
  console.log('   MASTANI & ICE CREAM FLAVOUR IMAGES VERIFICATION AUDIT');
  console.log('========================================================================================');

  let passed = 0;
  let failed = 0;

  for (const item of testItems) {
    const key = matchDishToCanonicalKey(item.dish, item.rest);
    const keyOk = key === item.expectedKey;
    const localAsset = CANONICAL_LOCAL_ASSETS[key];
    const assetPath = localAsset ? path.join(__dirname, '../public/images/food', localAsset) : null;
    const fileExists = assetPath && fs.existsSync(assetPath);

    let sharpOk = false;
    let imgSize = 0;
    if (fileExists) {
      try {
        const meta = await sharp(assetPath).metadata();
        sharpOk = Boolean(meta.width && meta.height);
        imgSize = fs.statSync(assetPath).size;
      } catch (err) {
        sharpOk = false;
      }
    }

    const allOk = keyOk && fileExists && sharpOk;
    if (allOk) passed++; else failed++;

    const status = allOk ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${item.dish.padEnd(46)} -> Key: ${key.padEnd(25)} -> Asset: ${localAsset ? localAsset : 'NONE'} (${Math.round(imgSize/1024)} KB)`);
  }

  console.log('========================================================================================');
  console.log(`TOTAL AUDITED: ${testItems.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================================');

  if (failed === 0) {
    console.log('ALL MASTANI AND ICE CREAM FLAVOUR IMAGES ARE FULLY RESOLVED, VERIFIED, AND 100% CORRECT!');
  } else {
    process.exit(1);
  }
}

runAudit();
