const testDishes = [
  { dish: 'Special Mango Mastani', rest: 'Sujata Mastani', expected: 'mango_mastani' },
  { dish: 'Pune Special Famous Mango Mastani', rest: 'Sujata Mastani', expected: 'mango_mastani' },
  { dish: 'Sujata Special Alphonso Mango Mastani', rest: 'Sujata Mastani', expected: 'mango_mastani' },
  { dish: 'Royal Kesar Pista Dryfruit Mastani', rest: 'Sujata Mastani', expected: 'kesar_pista_mastani' },
  { dish: 'Kesar Pista Mastani', rest: '', expected: 'kesar_pista_mastani' },
  { dish: 'Chocolate Fudge Brownie Mastani', rest: 'Sujata Mastani', expected: 'chocolate_mastani' },
  { dish: 'Chocolate Brownie Mastani', rest: '', expected: 'chocolate_mastani' },
  { dish: 'Chocolate Mastani', rest: '', expected: 'chocolate_mastani' },
  { dish: 'Special Anjir Badam Mastani Glass', rest: '', expected: 'dryfruit_mastani' },
  { dish: 'Anjir Badam Mastani', rest: '', expected: 'dryfruit_mastani' },
  { dish: 'Royal Kaju Draksh Sitaphal Mastani', rest: 'Sujata Mastani', expected: 'sitaphal_mastani' },
  { dish: 'Sitaphal Mastani', rest: '', expected: 'sitaphal_mastani' },
  { dish: 'Fresh Strawberry Crush Mastani', rest: '', expected: 'strawberry_mastani' },
  { dish: 'Strawberry Mastani', rest: '', expected: 'strawberry_mastani' },
  { dish: 'Dryfruit Royal Mastani', rest: '', expected: 'dryfruit_mastani' },
  { dish: 'Rose Mastani', rest: '', expected: 'rose_mastani' },
  { dish: 'Butterscotch Mastani', rest: '', expected: 'butterscotch_mastani' },
  { dish: 'Vanilla Ice Cream', rest: '', expected: 'vanilla_ice_cream' },
  { dish: 'Chocolate Ice Cream', rest: '', expected: 'chocolate_ice_cream' },
  { dish: 'Belgian Chocolate Ice Cream', rest: '', expected: 'chocolate_ice_cream' },
  { dish: 'Alphonso Mango Ice Cream', rest: '', expected: 'mango_ice_cream' },
  { dish: 'Mango Ice Cream', rest: '', expected: 'mango_ice_cream' },
  { dish: 'Strawberry Ice Cream', rest: '', expected: 'strawberry_ice_cream' },
  { dish: 'Butterscotch Ice Cream', rest: '', expected: 'butterscotch_ice_cream' },
  { dish: 'Kesar Pista Ice Cream', rest: '', expected: 'kesar_pista_ice_cream' },
  { dish: 'Pista Ice Cream', rest: '', expected: 'pista_ice_cream' },
  { dish: 'Tender Coconut Natural Ice Cream', rest: '', expected: 'tender_coconut_ice_cream' },
  { dish: 'Sitaphal Ice Cream', rest: '', expected: 'sitaphal_ice_cream' },
  { dish: 'Black Currant Ice Cream', rest: '', expected: 'black_currant_ice_cream' },
  { dish: 'Coffee Ice Cream', rest: '', expected: 'coffee_ice_cream' },
  { dish: 'Death By Chocolate (DBC)', rest: 'Corner House', expected: 'death_by_chocolate' },
  { dish: 'Hot Fudge Ice Cream Sundae', rest: 'Corner House', expected: 'hot_fudge_sundae' },
  { dish: 'Brownie Bomb Delight', rest: 'Corner House', expected: 'death_by_chocolate' },
  { dish: 'Sizzling Brownie with Vanilla Ice Cream', rest: '', expected: 'death_by_chocolate' },
  { dish: 'Fruit Melba Sundae', rest: 'Corner House', expected: 'fruit_sundae' },
  { dish: 'Royal Shahi Falooda with Rabdi', rest: '', expected: 'falooda' },
  { dish: 'Heritage Rose Falooda with Rabdi & Kulfi', rest: '', expected: 'falooda' },
  { dish: 'Saffron Matka Kulfi on Stick', rest: '', expected: 'kulfi' },
  { dish: 'Special Malai Kulfi Falooda', rest: '', expected: 'falooda' },
];

function testMatcher(dishName, restaurantName = '') {
  const d = (dishName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const r = (restaurantName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Coffee ice cream check before beverage coffee
  if ((d.includes('coffee') || d.includes('mocha') || d.includes('espresso')) && (d.includes('ice cream') || d.includes('icecream') || d.includes('gelato') || d.includes('sundae'))) {
    return 'coffee_ice_cream';
  }

  // Mastani flavours
  if (d.includes('mastani')) {
    if (d.includes('chocolate') || d.includes('brownie') || d.includes('fudge') || d.includes('cocoa') || d.includes('dark')) return 'chocolate_mastani';
    if (d.includes('kesar') || d.includes('pista') || d.includes('pistachio') || d.includes('saffron')) return 'kesar_pista_mastani';
    if (d.includes('strawberry') || d.includes('berry')) return 'strawberry_mastani';
    if (d.includes('sitaphal') || d.includes('custard apple')) return 'sitaphal_mastani';
    if (d.includes('anjir') || d.includes('badam') || d.includes('fig') || d.includes('almond') || d.includes('dryfruit') || d.includes('dry fruit') || d.includes('kaju') || d.includes('royal')) return 'dryfruit_mastani';
    if (d.includes('rose') || d.includes('gulkand')) return 'rose_mastani';
    if (d.includes('butterscotch') || d.includes('caramel')) return 'butterscotch_mastani';
    return 'mango_mastani';
  }

  // Falooda & Kulfi
  if (d.includes('falooda') || d.includes('faluda')) return 'falooda';
  if (d.includes('kulfi') || d.includes('matka kulfi') || d.includes('malai kulfi')) return 'kulfi';

  // Sundaes & Ice cream desserts
  if (
    d.includes('death by chocolate') || d.includes('dbc') ||
    d.includes('brownie bomb') ||
    ((d.includes('brownie') || d.includes('sizzling')) && (d.includes('ice cream') || d.includes('icecream') || d.includes('vanilla') || d.includes('sundae')))
  ) {
    return 'death_by_chocolate';
  }
  if (
    d.includes('hot fudge') ||
    (d.includes('fudge') && (d.includes('sundae') || d.includes('ice cream'))) ||
    (d.includes('chocolate') && d.includes('sundae'))
  ) {
    return 'hot_fudge_sundae';
  }
  if (
    d.includes('melba') || d.includes('banana split') ||
    (d.includes('fruit') && (d.includes('sundae') || d.includes('salad')))
  ) {
    return 'fruit_sundae';
  }

  // Ice cream flavours
  if (d.includes('ice cream') || d.includes('icecream') || d.includes('gelato') || d.includes('sundae') || d.includes('scoop')) {
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

  // Restaurant fallbacks
  if (r.includes('mastani') || r.includes('sujata')) {
    if (d.includes('kesar') || d.includes('pista')) return 'kesar_pista_mastani';
    if (d.includes('chocolate') || d.includes('brownie')) return 'chocolate_mastani';
    if (d.includes('strawberry')) return 'strawberry_mastani';
    if (d.includes('sitaphal')) return 'sitaphal_mastani';
    if (d.includes('anjir') || d.includes('badam')) return 'dryfruit_mastani';
    return 'mango_mastani';
  }
  if (r.includes('ice cream') || r.includes('naturals') || r.includes('corner house') || r.includes('havmor') || r.includes('baskin') || r.includes('kulfi')) {
    if (d.includes('chocolate') || d.includes('brownie') || d.includes('dbc')) return 'death_by_chocolate';
    if (d.includes('kulfi')) return 'kulfi';
    if (d.includes('falooda')) return 'falooda';
    return 'vanilla_ice_cream';
  }

  return 'thali';
}

let pass = 0, fail = 0;
testDishes.forEach(({ dish, rest, expected }) => {
  const got = testMatcher(dish, rest);
  const ok = got === expected;
  if (ok) pass++; else fail++;
  console.log((ok ? 'PASS: ' : 'FAIL: ') + dish.padEnd(45) + ' -> ' + got.padEnd(25) + ' (expected: ' + expected + ')');
});
console.log('\nResults: ' + pass + ' passed, ' + fail + ' failed.');
