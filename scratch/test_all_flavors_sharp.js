const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const routeContent = fs.readFileSync('app/api/ai/dish-image/route.ts', 'utf8');
const foodDir = path.join(process.cwd(), 'public', 'images', 'food');

const flavorsToTest = [
  // Mastani
  'Mango Mastani',
  'Special Mango Mastani',
  'Sujata Famous Pure Mango Mastani',
  'Kesar Pista Mastani',
  'Royal Kesar Pista Dryfruit Mastani',
  'Chocolate Mastani',
  'Chocolate Brownie Mastani',
  'Chocolate Fudge Brownie Mastani',
  'Strawberry Mastani',
  'Fresh Strawberry Crush Mastani',
  'Sitaphal Mastani',
  'Royal Kaju Draksh Sitaphal Mastani',
  'Dryfruit Mastani',
  'Anjir Badam Mastani',
  'Special Anjir Badam Mastani Glass',
  'Rose Mastani',
  'Butterscotch Mastani',
  'Pista Mastani',

  // Ice Cream
  'Vanilla Ice Cream',
  'Chocolate Ice Cream',
  'Belgian Chocolate Ice Cream',
  'Mango Ice Cream',
  'Alphonso Mango Ice Cream',
  'Strawberry Ice Cream',
  'Butterscotch Ice Cream',
  'Kesar Pista Ice Cream',
  'Pista Ice Cream',
  'Tender Coconut Ice Cream',
  'Tender Coconut Natural Ice Cream',
  'Sitaphal Ice Cream',
  'Black Currant Ice Cream',
  'Coffee Ice Cream',
  'Death By Chocolate',
  'DBC',
  'Hot Fudge Sundae',
  'Brownie Bomb Delight',
  'Fruit Melba Sundae',
  'Falooda',
  'Kulfi',
  'Matka Kulfi'
];

async function runTest() {
  console.log('Testing all ' + flavorsToTest.length + ' flavours...');
  let failures = 0;

  for (const flavor of flavorsToTest) {
    const d = flavor.toLowerCase();
    let key = '';

    if ((d.includes('coffee') || d.includes('mocha') || d.includes('espresso')) && (d.includes('ice cream') || d.includes('icecream') || d.includes('gelato') || d.includes('sundae'))) {
      key = 'coffee_ice_cream';
    } else if (d.includes('mastani')) {
      if (d.includes('chocolate') || d.includes('brownie') || d.includes('fudge') || d.includes('cocoa') || d.includes('dark')) key = 'chocolate_mastani';
      else if (d.includes('kesar') || d.includes('pista') || d.includes('pistachio') || d.includes('saffron')) key = 'kesar_pista_mastani';
      else if (d.includes('strawberry') || d.includes('berry')) key = 'strawberry_mastani';
      else if (d.includes('sitaphal') || d.includes('custard apple')) key = 'sitaphal_mastani';
      else if (d.includes('anjir') || d.includes('badam') || d.includes('fig') || d.includes('almond') || d.includes('dryfruit') || d.includes('dry fruit') || d.includes('kaju') || d.includes('royal')) key = 'dryfruit_mastani';
      else if (d.includes('rose') || d.includes('gulkand')) key = 'rose_mastani';
      else if (d.includes('butterscotch') || d.includes('caramel')) key = 'butterscotch_mastani';
      else key = 'mango_mastani';
    } else if (d.includes('falooda') || d.includes('faluda')) {
      key = 'falooda';
    } else if (d.includes('kulfi') || d.includes('matka kulfi') || d.includes('malai kulfi')) {
      key = 'kulfi';
    } else if (d.includes('death by chocolate') || d.includes('dbc') || d.includes('brownie bomb') || ((d.includes('brownie') || d.includes('sizzling')) && (d.includes('ice cream') || d.includes('icecream') || d.includes('vanilla') || d.includes('sundae')))) {
      key = 'death_by_chocolate';
    } else if (d.includes('hot fudge') || (d.includes('fudge') && (d.includes('sundae') || d.includes('ice cream'))) || (d.includes('chocolate') && d.includes('sundae'))) {
      key = 'hot_fudge_sundae';
    } else if (d.includes('melba') || d.includes('banana split') || (d.includes('fruit') && (d.includes('sundae') || d.includes('salad')))) {
      key = 'fruit_sundae';
    } else if (d.includes('ice cream') || d.includes('icecream') || d.includes('gelato') || d.includes('sundae') || d.includes('scoop')) {
      if (d.includes('tender coconut') || (d.includes('coconut') && (d.includes('malai') || d.includes('fresh')))) key = 'tender_coconut_ice_cream';
      else if (d.includes('sitaphal') || d.includes('custard apple')) key = 'sitaphal_ice_cream';
      else if ((d.includes('kesar') || d.includes('saffron')) && (d.includes('pista') || d.includes('pistachio'))) key = 'kesar_pista_ice_cream';
      else if (d.includes('pista') || d.includes('pistachio')) key = 'pista_ice_cream';
      else if (d.includes('mango') || d.includes('alphonso') || d.includes('aam')) key = 'mango_ice_cream';
      else if (d.includes('strawberry') || d.includes('berry') || d.includes('raspberry')) key = 'strawberry_ice_cream';
      else if (d.includes('black currant') || d.includes('blackcurrant') || d.includes('currant')) key = 'black_currant_ice_cream';
      else if (d.includes('butterscotch') || d.includes('butter scotch') || d.includes('praline') || d.includes('caramel crunch')) key = 'butterscotch_ice_cream';
      else if (d.includes('chocolate') || d.includes('choco') || d.includes('belgian') || d.includes('dark choco') || d.includes('fudge')) key = 'chocolate_ice_cream';
      else if (d.includes('coffee') || d.includes('mocha') || d.includes('espresso') || d.includes('cappuccino')) key = 'coffee_ice_cream';
      else if (d.includes('kaju') || d.includes('almond') || d.includes('draksh') || d.includes('dry fruit') || d.includes('cashew') || d.includes('nut')) key = 'kaju_draksh_ice_cream';
      else key = 'vanilla_ice_cream';
    }

    const localAssetRegex = new RegExp(key + ':\\s*[\'"]([^\'"]+)[\'"]');
    const match = routeContent.match(localAssetRegex);
    if (!match) {
      console.log('FAIL: Key not found in CANONICAL_LOCAL_ASSETS: ' + key + ' for ' + flavor);
      failures++;
      continue;
    }

    const filename = match[1];
    const filePath = path.join(foodDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log('FAIL: Missing file ' + filename + ' for ' + flavor);
      failures++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const meta = await sharp(buffer).metadata();
      console.log(`[PASS] ${flavor.padEnd(38)} -> Key: ${key.padEnd(24)} -> ${filename} (${meta.width}x${meta.height})`);
    } catch (err) {
      console.log('FAIL: Sharp error reading ' + filename + ': ' + err.message);
      failures++;
    }
  }

  console.log('====================================================');
  if (failures === 0) {
    console.log(`ALL ${flavorsToTest.length} FLAVORS VALIDATED WITH SHARP & ON-DISK ASSETS!`);
  } else {
    console.log(`TOTAL FAILURES: ${failures}`);
  }
}

runTest();
