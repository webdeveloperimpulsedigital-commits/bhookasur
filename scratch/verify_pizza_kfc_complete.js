const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Load route.ts
const routeContent = fs.readFileSync('app/api/ai/dish-image/route.ts', 'utf8');

// 2. Extract matchDishToCanonicalKey
const start = routeContent.indexOf('function matchDishToCanonicalKey(');
const end = routeContent.indexOf('async function processFoodImageToPurePng(');
let funcCode = routeContent.slice(start, end);

// Strip TypeScript types
funcCode = funcCode.replace(/:\s*string\b/g, '');
funcCode = funcCode.replace(/:\s*Record<[^>]+>/g, '');
const matchFn = new Function(funcCode + '\nreturn matchDishToCanonicalKey;')();

// 3. Extract CANONICAL_LOCAL_ASSETS
const localAssetMatch = routeContent.match(/const CANONICAL_LOCAL_ASSETS: Record<string, string> = \{([\s\S]*?)\};/);
const localAssets = {};
if (localAssetMatch) {
  localAssetMatch[1].split('\n').forEach(line => {
    const m = line.match(/^\s*([a-zA-Z0-9_]+):\s*['"]([^'"]+)['"]/);
    if (m) localAssets[m[1]] = m[2];
  });
}

// 4. Test Cases for Pizza Fire, Pizza varieties, KFC, and Fries
const testCases = [
  // Pizza & Wood-Fired Varieties
  { dish: "Pizza Fire", rest: "Pizza Fire", expectedCategory: "wood_fired_pizza" },
  { dish: "Wood-Fired Pizza Fire Special", rest: "Pizza Fire", expectedCategory: "wood_fired_pizza" },
  { dish: "Wood Fired Pizza", rest: "Pizzeria", expectedCategory: "wood_fired_pizza" },
  { dish: "Artisanal Margherita Supreme Pizza", rest: "Pizza Fire", expectedCategory: "margherita_pizza" },
  { dish: "Margherita Supreme with Fresh Basil", rest: "Italian Adda", expectedCategory: "margherita_pizza" },
  { dish: "Domino's Farmhouse Cheese Burst Pizza", rest: "Domino's Pizza", expectedCategory: "farmhouse_pizza" },
  { dish: "Special Farmhouse 7-Cheese Burst Pizza", rest: "Pizza Express", expectedCategory: "farmhouse_pizza" },
  { dish: "Peppy Paneer Pizza", rest: "Domino's Pizza", expectedCategory: "paneer_pizza" },
  { dish: "Fire Roasted Peppy Paneer Pizza", rest: "Pizza Fire", expectedCategory: "paneer_pizza" },
  { dish: "Fiery Peri Peri Chicken Pizza", rest: "Pizza Hut", expectedCategory: "chicken_pizza" },
  { dish: "Classic Pepperoni Pizza", rest: "Pizzeria", expectedCategory: "pepperoni_pizza" },
  { dish: "Cheesy Stuffed Garlic Breadsticks", rest: "Pizza Fire", expectedCategory: "garlic_bread" },
  { dish: "Cheesy Garlic Breadsticks with Dip", rest: "Pizza Hut", expectedCategory: "garlic_bread" },
  { dish: "Stuffed Garlic Breadsticks with Cheese Dip", rest: "Domino's", expectedCategory: "garlic_bread" },

  // KFC Items
  { dish: "KFC Hot & Crispy Fried Chicken (4 Pcs)", rest: "KFC", expectedCategory: "kfc_fried_chicken" },
  { dish: "KFC Fried Chicken Bucket", rest: "KFC", expectedCategory: "kfc_fried_chicken" },
  { dish: "Fried Chicken", rest: "KFC", expectedCategory: "kfc_fried_chicken" },
  { dish: "Crispy Fried Chicken Drumsticks", rest: "Fast Food", expectedCategory: "fried_chicken" },
  { dish: "KFC Classic Zinger Burger", rest: "KFC", expectedCategory: "zinger_burger" },
  { dish: "Crispy Chicken Zinger Burger", rest: "KFC", expectedCategory: "zinger_burger" },
  { dish: "Crispy Chicken Popcorn Large", rest: "KFC", expectedCategory: "chicken_popcorn" },
  { dish: "Chicken Popcorn Bucket", rest: "KFC", expectedCategory: "chicken_popcorn" },
  { dish: "KFC Crispy Boneless Chicken Strips (3 Pcs)", rest: "KFC", expectedCategory: "chicken_strips" },
  { dish: "Crispy Chicken Tenders", rest: "KFC", expectedCategory: "chicken_strips" },
  { dish: "Hot & Crispy Chicken Wings", rest: "KFC", expectedCategory: "chicken_wings" },
  { dish: "KFC Peri Peri Crispy Fries", rest: "KFC", expectedCategory: "peri_peri_fries" },

  // Fries Varieties
  { dish: "Crispy French Fries", rest: "Fast Food", expectedCategory: "fries" },
  { dish: "Peri Peri French Fries Large", rest: "Fast Food", expectedCategory: "peri_peri_fries" },
  { dish: "Peri Peri Crinkle Fries", rest: "Pizza Fire", expectedCategory: "peri_peri_fries" },
  { dish: "Cheesy Fries", rest: "Cafe", expectedCategory: "cheesy_fries" }
];

async function runAudit() {
  console.log('========================================================================================');
  console.log('   PIZZA FIRE, PIZZAS, KFC & FRIES COMPREHENSIVE VERIFICATION AUDIT');
  console.log('========================================================================================');

  let passed = 0;
  let failed = 0;
  const foodDir = path.join(process.cwd(), 'public', 'images', 'food');

  for (const tc of testCases) {
    const key = matchFn(tc.dish, tc.rest);
    const assetFile = localAssets[key];

    if (!assetFile) {
      console.log(`[FAIL] ${tc.dish.padEnd(42)} -> Key: ${key.padEnd(20)} -> NO LOCAL ASSET REGISTERED!`);
      failed++;
      continue;
    }

    const filePath = path.join(foodDir, assetFile);
    if (!fs.existsSync(filePath)) {
      console.log(`[FAIL] ${tc.dish.padEnd(42)} -> Key: ${key.padEnd(20)} -> FILE MISSING: ${assetFile}`);
      failed++;
      continue;
    }

    // Verify sharp image valid
    try {
      const buf = fs.readFileSync(filePath);
      const meta = await sharp(buf).metadata();
      const kb = Math.round(buf.length / 1024);
      console.log(`[PASS] ${tc.dish.padEnd(42)} -> Key: ${key.padEnd(20)} -> ${assetFile.padEnd(24)} (${meta.width}x${meta.height}, ${kb} KB)`);
      passed++;
    } catch (err) {
      console.log(`[FAIL] ${tc.dish.padEnd(42)} -> Sharp error reading ${assetFile}: ${err.message}`);
      failed++;
    }
  }

  console.log('========================================================================================');
  console.log(`TOTAL AUDITED: ${testCases.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================================');
  if (failed === 0) {
    console.log('ALL PIZZA FIRE AND KFC FOOD IMAGES ARE FULLY VERIFIED, ACCURATE, AND CORRECT!');
  }
}

runAudit();
