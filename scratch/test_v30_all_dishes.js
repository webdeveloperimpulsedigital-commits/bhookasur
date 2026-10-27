const fs = require('fs');
const path = require('path');

// Extract matcher logic directly as in route.ts
function matchDishToCanonicalKey(dishName, restaurantName = '') {
  const d = (dishName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const r = (restaurantName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Beverages
  if (d.includes('solkadhi')) return 'solkadhi';
  if (d.includes('taak') || d.includes('mattha') || d.includes('chaas') || d.includes('buttermilk')) return 'masala_taak';
  if (/\blassi\b/.test(d)) return 'punjabi_lassi';
  if (d.includes('chai') || d.includes('tea')) return 'chai';
  if ((d.includes('coffee') || d.includes('mocha')) && (d.includes('ice cream') || d.includes('icecream') || d.includes('scoop'))) return 'coffee_ice_cream';
  if (d.includes('coffee')) return 'coffee';

  // Authentic Pune Mastani Varieties (Strictly mapped by flavor, restaurant & dish context)
  if (d.includes('mastani') || r.includes('mastani') || r.includes('sujata')) {
    if (d.includes('falooda') || d.includes('faluda')) return 'falooda';
    if (d.includes('kulfi')) return 'kulfi';
    if (d.includes('chocolate') || d.includes('brownie') || d.includes('fudge') || d.includes('cocoa') || d.includes('dark')) return 'chocolate_mastani';
    if (d.includes('kesar') || d.includes('pista') || d.includes('pistachio') || d.includes('saffron')) return 'kesar_pista_mastani';
    if (d.includes('strawberry') || d.includes('berry')) return 'strawberry_mastani';
    if (d.includes('sitaphal') || d.includes('custard apple')) return 'sitaphal_mastani';
    if (d.includes('anjir') || d.includes('badam') || d.includes('fig') || d.includes('almond') || d.includes('dryfruit') || d.includes('dry fruit') || d.includes('kaju') || d.includes('royal')) return 'dryfruit_mastani';
    if (d.includes('rose') || d.includes('gulkand')) return 'rose_mastani';
    if (d.includes('butterscotch') || d.includes('caramel')) return 'butterscotch_mastani';
    return 'mango_mastani';
  }

  // KFC, FRIED CHICKEN & FAST FOOD CHICKEN
  if (
    d.includes('kfc') ||
    d.includes('fried chicken') ||
    d.includes('crispy chicken') ||
    d.includes('chicken popcorn') ||
    d.includes('popcorn chicken') ||
    d.includes('chicken strips') ||
    d.includes('chicken tenders') ||
    d.includes('chicken bucket') ||
    d.includes('hot wings') ||
    d.includes('zinger') ||
    r.includes('kfc') ||
    r.includes('kentucky')
  ) {
    if (d.includes('zinger') || d.includes('burger')) return 'zinger_burger';
    if (d.includes('popcorn')) return 'chicken_popcorn';
    if (d.includes('strip') || d.includes('tender')) return 'chicken_strips';
    if (d.includes('wing')) return 'chicken_wings';
    if (d.includes('peri peri') && d.includes('fries')) return 'peri_peri_fries';
    if (d.includes('fries') || d.includes('french fries')) return 'fries';
    return 'kfc_fried_chicken';
  }

  // Fast food & fries
  if (d.includes('burger')) {
    if (d.includes('zinger')) return 'zinger_burger';
    if (d.includes('crispy') || d.includes('fried chicken')) return 'crispy_chicken_burger';
    return 'burger';
  }
  if (d.includes('fries') || d.includes('french fries')) {
    if (d.includes('peri') || d.includes('spicy')) return 'peri_peri_fries';
    return 'fries';
  }
  if (d.includes('garlic bread') || d.includes('breadsticks')) return 'garlic_bread';

  // PIZZA, WOOD-FIRED & ITALIAN
  if (
    d.includes('pizza') ||
    d.includes('calzone') ||
    d.includes('margherita') ||
    d.includes('margarita') ||
    d.includes('pepperoni') ||
    d.includes('flatbread') ||
    r.includes('pizza') ||
    r.includes('pizzeria') ||
    r.includes('italian')
  ) {
    if (d.includes('margherita') || d.includes('margarita') || d.includes('basil')) return 'margherita_pizza';
    if (d.includes('pepperoni')) return 'pepperoni_pizza';
    if (d.includes('paneer') || d.includes('peppy paneer')) return 'paneer_pizza';
    if (d.includes('chicken') || d.includes('bbq chicken')) return 'chicken_pizza';
    if (d.includes('farmhouse') || d.includes('supreme') || d.includes('veggie')) return 'farmhouse_pizza';
    if (d.includes('fire') || d.includes('wood') || d.includes('brick oven') || d.includes('artisan')) return 'wood_fired_pizza';
    return 'wood_fired_pizza';
  }

  // Ice Cream Flavours & Parlor Context
  const isIceCreamContext = Boolean(
    d.includes('ice cream') || d.includes('icecream') || d.includes('gelato') ||
    d.includes('sundae') || d.includes('scoop') || d.includes('tub') || d.includes('cone') ||
    r.includes('ice cream') || r.includes('naturals') || r.includes('corner house') ||
    r.includes('havmor') || r.includes('baskin') || r.includes('kawre') ||
    r.includes('cream stone') || r.includes('apsara')
  );

  if (isIceCreamContext) {
    if (d.includes('tender coconut') || (d.includes('coconut') && (d.includes('malai') || d.includes('fresh')))) return 'tender_coconut_ice_cream';
    if (d.includes('sitaphal') || d.includes('custard apple')) return 'sitaphal_ice_cream';
    if ((d.includes('kesar') || d.includes('saffron')) && (d.includes('pista') || d.includes('pistachio'))) return 'kesar_pista_ice_cream';
    if (d.includes('pista') || d.includes('pistachio')) return 'pista_ice_cream';
    if (d.includes('mango') || d.includes('alphonso') || d.includes('aam')) return 'mango_ice_cream';
    if (d.includes('strawberry') || d.includes('berry') || d.includes('raspberry')) return 'strawberry_ice_cream';
    if (d.includes('black currant') || d.includes('blackcurrant') || d.includes('currant')) return 'black_currant_ice_cream';
    if (d.includes('butterscotch') || d.includes('butter scotch') || d.includes('praline') || d.includes('caramel crunch')) return 'butterscotch_ice_cream';
    if (d.includes('chocolate') || d.includes('choco') || d.includes('belgian') || d.includes('dark choco') || d.includes('fudge')) return 'chocolate_ice_cream';
    if (d.includes('coffee') || d.includes('mocha') || d.includes('espresso') || d.includes('cappuccino')) return 'coffee_ice_cream';
    if (d.includes('kaju') || d.includes('almond') || d.includes('draksh') || d.includes('dry fruit') || d.includes('cashew') || d.includes('nut')) return 'kaju_draksh_ice_cream';
    if (d.includes('vanilla') || d.includes('plain')) return 'vanilla_ice_cream';
    return 'vanilla_ice_cream';
  }

  return 'thali';
}

const CANONICAL_LOCAL_ASSETS = {
  mango_mastani: 'mango_mastani.jpg',
  kesar_pista_mastani: 'kesar_pista_mastani.jpg',
  chocolate_mastani: 'chocolate_mastani.jpg',
  strawberry_mastani: 'strawberry_mastani.jpg',
  sitaphal_mastani: 'sitaphal_mastani.jpg',
  dryfruit_mastani: 'dryfruit_mastani.jpg',
  rose_mastani: 'rose_mastani.jpg',
  butterscotch_mastani: 'butterscotch_mastani.jpg',
  falooda: 'falooda.jpg',
  kulfi: 'kulfi.jpg',
  vanilla_ice_cream: 'vanilla_ice_cream.jpg',
  chocolate_ice_cream: 'chocolate_ice_cream.jpg',
  mango_ice_cream: 'mango_ice_cream.jpg',
  strawberry_ice_cream: 'strawberry_ice_cream.jpg',
  butterscotch_ice_cream: 'butterscotch_ice_cream.jpg',
  kesar_pista_ice_cream: 'kesar_pista_ice_cream.jpg',
  pista_ice_cream: 'kesar_pista_ice_cream.jpg',
  tender_coconut_ice_cream: 'tender_coconut_ice_cream.jpg',
  sitaphal_ice_cream: 'sitaphal_ice_cream.jpg',
  black_currant_ice_cream: 'black_currant_ice_cream.jpg',
  kaju_draksh_ice_cream: 'kaju_draksh_ice_cream.jpg',
  coffee_ice_cream: 'coffee_ice_cream.jpg',
  wood_fired_pizza: 'wood_fired_pizza.jpg',
  margherita_pizza: 'margherita_pizza.jpg',
  paneer_pizza: 'paneer_pizza.jpg',
  farmhouse_pizza: 'farmhouse_pizza.jpg',
  garlic_bread: 'garlic_bread.jpg',
  peri_peri_fries: 'peri_peri_fries.jpg',
  fries: 'fries.jpg',
  kfc_fried_chicken: 'kfc_fried_chicken.jpg',
  zinger_burger: 'zinger_burger.jpg',
  chicken_popcorn: 'chicken_popcorn.jpg',
  chicken_strips: 'chicken_strips.jpg',
  chicken_wings: 'chicken_wings.jpg'
};

const testCases = [
  // 1. Sujata Mastani
  { dish: "Sujata Famous Pure Mango Mastani", rest: "Sujata Mastani", expected: "mango_mastani" },
  { dish: "Royal Kesar Pista Dryfruit Mastani", rest: "Sujata Mastani", expected: "kesar_pista_mastani" },
  { dish: "Chocolate Fudge Brownie Mastani", rest: "Sujata Mastani", expected: "chocolate_mastani" },
  { dish: "Special Anjir Badam Mastani Glass", rest: "Sujata Mastani", expected: "dryfruit_mastani" },
  { dish: "Heritage Rose Falooda with Rabdi & Kulfi", rest: "Sujata Mastani", expected: "falooda" },
  { dish: "Sujata Special Alphonso Mango Mastani", rest: "Sujata Mastani", expected: "mango_mastani" },
  { dish: "Royal Kaju Draksh Sitaphal Mastani", rest: "Sujata Mastani", expected: "sitaphal_mastani" },
  { dish: "Kesar Pista Special Dryfruit Shake", rest: "Sujata Mastani", expected: "kesar_pista_mastani" },
  { dish: "Chocolate Brownie Mastani", rest: "Sujata Mastani", expected: "chocolate_mastani" },
  { dish: "Strawberry Mastani", rest: "Sujata Mastani", expected: "strawberry_mastani" },
  { dish: "Rose Gulkand Mastani", rest: "Sujata Mastani", expected: "rose_mastani" },
  { dish: "Butterscotch Caramel Mastani", rest: "Sujata Mastani", expected: "butterscotch_mastani" },

  // 2. Ice Cream Flavours
  { dish: "Tender Coconut Natural Ice Cream", rest: "Naturals", expected: "tender_coconut_ice_cream" },
  { dish: "Tender Coconut Scoop", rest: "Kawre Ice Cream", expected: "tender_coconut_ice_cream" },
  { dish: "Fresh Alphonso Mango Ice Cream", rest: "Naturals", expected: "mango_ice_cream" },
  { dish: "Sitaphal Ice Cream Scoop", rest: "Naturals", expected: "sitaphal_ice_cream" },
  { dish: "Kesar Pista Ice Cream", rest: "Kawre Ice Cream", expected: "kesar_pista_ice_cream" },
  { dish: "Belgian Chocolate Ice Cream", rest: "Baskin Robbins", expected: "chocolate_ice_cream" },
  { dish: "Butterscotch Ice Cream", rest: "Havmor", expected: "butterscotch_ice_cream" },
  { dish: "Black Currant Ice Cream Tub", rest: "Havmor", expected: "black_currant_ice_cream" },
  { dish: "Kaju Draksh Ice Cream", rest: "Amul Ice Cream", expected: "kaju_draksh_ice_cream" },
  { dish: "Espresso Coffee Ice Cream", rest: "Cream Stone", expected: "coffee_ice_cream" },
  { dish: "Strawberry Ice Cream Scoop", rest: "Corner House", expected: "strawberry_ice_cream" },
  { dish: "Classic Vanilla Ice Cream", rest: "Naturals", expected: "vanilla_ice_cream" },

  // 3. Pizza Fire & Wood Fired Pizzerias
  { dish: "Wood-Fired Pizza Fire Special", rest: "Pizza Fire", expected: "wood_fired_pizza" },
  { dish: "Artisanal Margherita Supreme Pizza", rest: "Pizza Fire", expected: "margherita_pizza" },
  { dish: "Fire Roasted Peppy Paneer Pizza", rest: "Pizza Fire", expected: "paneer_pizza" },
  { dish: "Cheesy Stuffed Garlic Breadsticks", rest: "Pizza Fire", expected: "garlic_bread" },
  { dish: "Peri Peri Crinkle Fries", rest: "Pizza Fire", expected: "peri_peri_fries" },

  // 4. KFC Items
  { dish: "KFC Hot & Crispy Fried Chicken (4 Pcs)", rest: "KFC", expected: "kfc_fried_chicken" },
  { dish: "KFC Classic Zinger Burger", rest: "KFC", expected: "zinger_burger" },
  { dish: "Crispy Chicken Popcorn Large", rest: "KFC", expected: "chicken_popcorn" },
  { dish: "KFC Crispy Boneless Chicken Strips (3 Pcs)", rest: "KFC", expected: "chicken_strips" },
  { dish: "Hot & Crispy Chicken Wings", rest: "KFC", expected: "chicken_wings" },
  { dish: "KFC Peri Peri Crispy Fries", rest: "KFC", expected: "peri_peri_fries" }
];

let failed = 0;
console.log('--- COMPREHENSIVE V30 MATCHER & ASSET VERIFICATION ---');

for (const t of testCases) {
  const matchedKey = matchDishToCanonicalKey(t.dish, t.rest);
  const localFileName = CANONICAL_LOCAL_ASSETS[matchedKey];
  const fileExists = localFileName && fs.existsSync(path.join(__dirname, '..', 'public', 'images', 'food', localFileName));

  if (matchedKey !== t.expected || !fileExists) {
    console.error(`FAILED: "${t.dish}" (${t.rest}) => matched: ${matchedKey} (expected: ${t.expected}) | file: ${localFileName} (exists: ${fileExists})`);
    failed++;
  } else {
    console.log(`PASS: "${t.dish}" -> [${matchedKey}] -> ${localFileName} (100% Verified)`);
  }
}

if (failed === 0) {
  console.log(`\nALL ${testCases.length} TESTS PASSED PERFECTLY! ZERO ERRORS.`);
} else {
  console.error(`\n${failed} TESTS FAILED.`);
  process.exit(1);
}
