const testDishes = [
  // --- 1. RICE ITEMS ---
  'Jeera Rice',
  'Steamed Basmati Rice',
  'Curd Rice with Tadka',
  'Moong Dal Khichdi',
  'Special Veg Pulao',
  'Veg Fried Rice',
  'Chicken Fried Rice',
  'Schezwan Fried Rice',
  'Triple Schezwan Rice',
  'Hyderabadi Chicken Dum Biryani',
  'Royal Mutton Dum Biryani',
  'Lucknowi Veg Biryani',

  // --- 2. SANDWICHES ---
  'Bombay Veg Sandwich',
  'Cheese Grilled Sandwich',
  'Veg Club Sandwich',
  'Paneer Tikka Sandwich',
  'Chicken Mayo Sandwich',
  'Grilled Corn Cheese Toast',
  'Irani Bun Maska',

  // --- 3. VEG STARTERS ---
  'Paneer Tikka',
  'Tandoori Paneer Tikka',
  'Hara Bhara Kabab',
  'Veg Seekh Kebab',
  'Dahi Ke Kabab',
  'Crispy Corn Salt and Pepper',
  'Crispy Veg Spring Roll',
  'Veg Manchurian Dry',
  'Chilli Paneer Dry',
  'Tandoori Soya Chaap',
  'Mushroom Tikka Dry',
  'French Fries',
  'Peri Peri French Fries',
  'Kothimbir Vadi',
  'Alu Vadi Plate',
  'Crispy Sabudana Vada',
  'Veg Cutlet',
  'Steamed Veg Momos',
  'Fried Corn Cheese Momos',

  // --- 4. NON-VEG STARTERS ---
  'Chicken Tikka',
  'Chicken Malai Tikka',
  'Tandoori Chicken Half',
  'Chicken Lollipop',
  'Chicken 65',
  'Chilli Chicken Dry',
  'Crispy Chicken Wings',
  'Mutton Seekh Kebab',
  'Galouti Kebab',
  'Mutton Burra Kebab',
  'Mutton Sukka Fry',
  'Surmai Rava Fry',
  'Pomfret Fry',
  'Prawns Koliwada',
  'Crispy Bombil Fry',
  'Fish Amritsari Tikka',

  // --- 5. VEG MAIN COURSE ---
  'Paneer Butter Masala',
  'Palak Paneer',
  'Dal Makhani',
  'Dal Tadka',
  'Spicy Veg Kolhapuri',

  // --- 6. NON-VEG MAIN COURSE ---
  'Butter Chicken',
  'Chicken Handi',
  'Mutton Rogan Josh',
  'Gavran Chicken Thali'
];

function matchDishToCanonicalKey(dishName, restaurantName = '') {
  const d = (dishName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const r = (restaurantName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // === 0. TRADITIONAL BEVERAGES & COOLERS ===
  if (d.includes('solkadhi') || d.includes('sol kadhi') || d.includes('kokum kadhi') || (d.includes('kokum') && !d.includes('sharbat'))) {
    return 'solkadhi';
  }
  if (d.includes('taak') || d.includes('tak') || d.includes('mattha') || d.includes('matha') || d.includes('chaas') || d.includes('chhas') || d.includes('buttermilk') || d.includes('spiced butter milk') || d.includes('masala curd') || d.includes('majjiga')) {
    return 'masala_taak';
  }
  if (/\blassi\b/.test(d) || /\blasi\b/.test(d) || (d.includes('punjabi') && (d.includes('sweet') || d.includes('curd') || d.includes('malai') || d.includes('yogurt')))) {
    return 'punjabi_lassi';
  }

  // === 1. SANDWICHES & TOASTS (Priority to prevent chicken/paneer filling misclassification) ===
  if (d.includes('sandwich') || d.includes('sandwiches') || d.includes('grilled cheese') || d.includes('bun maska') || d.includes('maska bun') || (d.includes('toast') && !d.includes('french toast') && !d.includes('garlic toast'))) {
    return 'sandwich';
  }

  // === 2. RICE & BIRYANI (Indo-Chinese Fried Rice, Biryani, Traditional Rice) ===
  // 2a. Indo-Chinese Fried Rice (Veg, Egg, Chicken, Schezwan, Triple)
  if (d.includes('fried rice') || d.includes('schezwan rice') || d.includes('triple rice') || d.includes('chinese rice') || d.includes('manchurian rice')) {
    return 'fried_rice';
  }
  // 2b. Biryani (Chicken, Mutton, Veg, Egg, Dum Biryani)
  if (d.includes('biryani') || d.includes('biriyani') || d.includes('briyani')) {
    return 'biryani';
  }
  // 2c. Traditional Indian Rice (Jeera Rice, Pulao, Khichdi, Steamed, Curd Rice, Varan Bhat)
  if (d.includes('jeera rice') || d.includes('steam rice') || d.includes('steamed rice') || d.includes('curd rice') || d.includes('khichdi') || d.includes('pulao') || d.includes('pulav') || d.includes('varan bhat') || d.includes('bhat') || d.includes('bhaat') || /\brice\b/.test(d)) {
    return 'jeera_rice';
  }

  // === 3. VEGETARIAN STARTERS & TIKKAS (Priority to prevent matching Tandoori Chicken) ===
  const isVegStarterExplicit = (
    d.includes('hara bhara') || d.includes('harabhara') ||
    d.includes('dahi ke kabab') || d.includes('dahi ke kebab') || d.includes('dahi kabab') || d.includes('dahi kebab') ||
    ((d.includes('seekh') || d.includes('kabab') || d.includes('kebab')) && (d.includes('veg') || d.includes('paneer') || d.includes('soya') || d.includes('corn') || d.includes('subz'))) ||
    d.includes('soya chaap') || d.includes('tandoori chaap') || d.includes('malai chaap') || (d.includes('chaap') && !d.includes('mutton') && !d.includes('chicken')) ||
    d.includes('mushroom tikka') || d.includes('tandoori mushroom') || d.includes('chilli mushroom') || d.includes('mushroom chilli') ||
    d.includes('paneer tikka') || d.includes('tandoori paneer') || d.includes('paneer chilli') || d.includes('chilli paneer') || d.includes('paneer 65') ||
    d.includes('crispy corn') || d.includes('corn crispy') || d.includes('baby corn') ||
    d.includes('gobi manchurian') || d.includes('veg manchurian') || d.includes('cabbage manchurian')
  );

  if (isVegStarterExplicit) {
    return 'paneer_tikka';
  }

  // Spring Rolls
  if (d.includes('spring roll') || d.includes('veg roll') || (d.includes('roll') && (d.includes('kathi') || d.includes('frankie') || d.includes('shawarma') || d.includes('wrap') || d.includes('baida roti')))) {
    return 'kathi_roll';
  }

  // Cutlets & Fried Patties
  if (d.includes('cutlet') || d.includes('veg tikki') || d.includes('aloo tikki') || d.includes('patties')) {
    return 'kothimbir_vadi';
  }

  // French Fries
  if (d.includes('fries') || d.includes('french fries') || d.includes('finger chips') || d.includes('wedges')) {
    return 'fries';
  }

  // === 4. NON-VEG SPECIALTIES & STARTERS ===
  const hasFish = (
    d.includes('fish') || d.includes('surmai') || d.includes('pomfret') ||
    d.includes('bombil') || d.includes('prawn') || d.includes('prawns') ||
    d.includes('crab') || d.includes('seafood') || d.includes('tisreo') ||
    d.includes('bangda') || d.includes('kolambi') || d.includes('rawas') ||
    d.includes('bhetki') || d.includes('chingri') || d.includes('royyala')
  );

  const hasMutton = (
    d.includes('mutton') || d.includes('gosht') || d.includes('rogan josh') ||
    d.includes('nihari') || d.includes('tambda') || d.includes('pandhra') ||
    d.includes('kheema') || d.includes('keema') || d.includes('laal maas') ||
    d.includes('goat') || d.includes('lamb')
  );

  const hasChicken = (
    d.includes('chicken') || d.includes('murgh') || d.includes('kukkad')
  );

  // Fish & Seafood Starters & Curries
  if (hasFish) {
    return 'fish_fry';
  }

  // Crispy & Fried Chicken Starters (Lollipop, Chicken 65, Chilli Chicken Dry, Wings)
  if (
    d.includes('lollipop') || d.includes('wings') ||
    (hasChicken && (d.includes('65') || d.includes('chilli') || d.includes('crispy') || d.includes('dry') || d.includes('fry') || d.includes('popcorn') || d.includes('nuggets')))
  ) {
    return 'chicken_lollipop';
  }

  // Tandoori Chicken & Non-Veg Kebabs (Tandoori, Tikka, Seekh, Burra, Galouti, Kakori)
  if (
    d.includes('tandoori chicken') || d.includes('chicken tandoori') ||
    d.includes('tandoor chicken') || d.includes('chicken tandoor') ||
    d.includes('chicken tikka') || d.includes('tikka chicken') ||
    (d.includes('tikka') && (hasChicken || !d.includes('paneer'))) ||
    d.includes('tangdi') || d.includes('reshmi') ||
    d.includes('malai tikka') || d.includes('roast chicken') ||
    d.includes('kebab') || d.includes('kabab') || d.includes('seekh') || d.includes('boti') || d.includes('burra') || d.includes('kakori') || d.includes('galouti') || d.includes('pasinda')
  ) {
    return 'tandoori_chicken';
  }

  // Non-Veg Thalis
  if (
    (d.includes('thali') || d.includes('bhojan') || d.includes('platter')) &&
    (hasMutton || hasChicken || d.includes('non veg') || d.includes('nonveg') || d.includes('gavran') || d.includes('military'))
  ) {
    return 'mutton_thali';
  }

  // Mutton Curries, Sukka, Rassa, Kheema & Gravies
  if (hasMutton) {
    return 'mutton_curry';
  }

  // Butter Chicken / Murgh Makhani
  if (d.includes('butter chicken') || d.includes('makhani chicken') || d.includes('murgh makhani')) {
    return 'butter_chicken';
  }

  // Chicken Curries, Handi, Gravies
  if (hasChicken || (d.includes('gavran') && !d.includes('pithla'))) {
    return 'chicken_curry';
  }

  // === 5. MAHARASHTRIAN SPECIALTIES & SWEETS ===
  if (d.includes('modak')) return 'modak';
  if (d.includes('shev bhaji') || d.includes('sev bhaji') || d.includes('shev curry') || d.includes('sev curry') || d.includes('sev tamatar') || d.includes('shev tamatar') || (d.includes('shev') && !d.includes('sev puri')) || d.includes('ratlami shev')) return 'shev_bhaji';
  if (d.includes('kothimbir') || d.includes('kothambir') || d.includes('coriander vadi')) return 'kothimbir_vadi';
  if (d.includes('alu vadi') || d.includes('aloo vadi') || d.includes('aluvadi') || d.includes('aloovadi') || d.includes('patra') || d.includes('colocasia')) return 'alu_vadi';
  if (d.includes('puran poli') || d.includes('puranpoli') || d.includes('puran') || d.includes('vedmi')) return 'puran_poli';
  if (d.includes('misal') || d.includes('katakirr') || d.includes('tarri pav')) return 'misal_pav';
  if (d.includes('pav bhaji') || d.includes('pavbhaji') || d.includes('bhaji pav')) return 'pav_bhaji';
  if (d.includes('vada pav') || d.includes('vadapav') || d.includes('wada pav') || d.includes('batata vada') || d.includes('batatavada') || d.includes('bombay burger')) return 'vada_pav';
  if (d.includes('sabudana') || d.includes('upvas') || d.includes('fasting')) return 'sabudana_vada';
  if (d.includes('poha') || d.includes('pohe') || d.includes('kanda poha') || d.includes('batata poha')) return 'poha';

  // === 6. PURE INDIAN BREADS ===
  if (d.includes('garlic naan') || d.includes('lasuni naan') || d.includes('lahsuni naan') || (d.includes('naan') && d.includes('garlic'))) return 'garlic_naan';
  if (d.includes('naan') || d.includes('roti') || d.includes('kulcha') || d.includes('rumali') || d.includes('roomali') || d.includes('chapati') || d.includes('chapatti') || d.includes('phulka')) return 'butter_naan';
  if (d.includes('bhakri') || d.includes('rotla') || d.includes('pithla') || d.includes('pitla') || d.includes('thecha') || d.includes('zunka') || d.includes('zhunka')) return 'bhakri';
  if (d.includes('paratha') || d.includes('parantha') || d.includes('pratha') || d.includes('thepla') || d.includes('thalipeeth') || d.includes('thali pith')) return 'paratha';
  if (d.includes('bhature') || d.includes('bhatura') || (d.includes('chole') && !d.includes('rice')) || d.includes('chhole')) return 'chole_bhature';

  // === 7. SOUTH INDIAN ===
  if (d.includes('idli') || d.includes('idly') || d.includes('thatte idli') || d.includes('rava idli')) return 'idli';
  if (d.includes('dosa') || d.includes('dosai') || d.includes('uttapam') || d.includes('oothappam') || d.includes('appam') || d.includes('pesrattu')) return 'dosa';
  if (d.includes('medu vada') || d.includes('vada sambar') || d.includes('wada sambar') || d.includes('medu vadai')) return 'idli';

  // === 8. THALIS (Veg) ===
  if (d.includes('thali') || d.includes('bhojan') || d.includes('platter') || d.includes('swayampak') || d.includes('maharaja') || d.includes('deluxe thali')) return 'thali';

  // === 9. DALS ===
  if (d.includes('dal makhani') || d.includes('makhani dal') || d.includes('dal bukhara')) return 'dal_makhani';
  if (d.includes('dal tadka') || d.includes('dal fry') || d.includes('tadka dal') || d.includes('varan') || d.includes('dal') || d.includes('daal')) return 'dal_tadka';

  // === 10. PANEER SPECIALTIES & GRAVIES ===
  if (d.includes('palak paneer') || d.includes('saag paneer') || (d.includes('paneer') && (d.includes('palak') || d.includes('saag') || d.includes('spinach')))) return 'palak_paneer';
  if (d.includes('paneer') || d.includes('panir') || d.includes('cottage cheese') || d.includes('makhani') || d.includes('makhanwala') || d.includes('lababdar') || d.includes('pasanda') || (d.includes('shahi') && !d.includes('biryani') && !d.includes('tukda') && !d.includes('phirni'))) return 'paneer_butter_masala';
  if (d.includes('kolhapuri') || d.includes('handi') || d.includes('kadai') || d.includes('mix veg') || d.includes('vangi') || d.includes('baingan') || d.includes('kaju curry') || d.includes('cashew curry') || d.includes('veg korma') || d.includes('malai kofta') || d.includes('dum aloo') || d.includes('veg curry')) return 'veg_kolhapuri';

  // === 11. SOUPS & SALADS ===
  if (d.includes('soup') || d.includes('shorba')) return 'soup';
  if (d.includes('salad') || d.includes('buddha bowl') || d.includes('protein bowl') || d.includes('quinoa') || d.includes('sprouts')) return 'salad';

  // === 12. BREAKFAST SPECIALS & EGGS ===
  if (d.includes('omelette') || d.includes('omelet') || d.includes('boiled egg') || d.includes('scrambled egg') || d.includes('egg curry') || d.includes('anda bhurji') || d.includes('egg bhurji') || d.includes('anda curry')) return 'egg_dish';
  if (d.includes('upma')) return 'poha';
  if (d.includes('waffle')) return 'waffles';
  if (d.includes('pancake') || d.includes('french toast')) return 'pancakes';

  // === 13. ITALIAN & CAFÉ MEALS ===
  if (d.includes('pasta') || d.includes('spaghetti') || d.includes('lasagna') || d.includes('mac and cheese') || d.includes('penne') || d.includes('alfredo') || d.includes('ravioli') || d.includes('arrabbiata') || d.includes('risotto') || d.includes('pesto')) return 'pasta';
  if (d.includes('nachos') || d.includes('quesadilla')) return 'nachos';
  if (d.includes('garlic bread') || d.includes('bruschetta') || d.includes('garlic toast') || d.includes('open toast') || d.includes('avocado toast')) return 'garlic_bread';
  if (d.includes('hot dog') || d.includes('hotdog')) return 'hot_dog';

  // === 14. SNACKS & FAST FOOD ===
  if (d.includes('samosa') || d.includes('samose') || d.includes('kachori') || d.includes('dhokla') || d.includes('khandvi')) return 'samosa';
  if (d.includes('pani puri') || d.includes('panipuri') || d.includes('golgappa') || d.includes('puchka') || d.includes('spdp') || d.includes('sev puri') || d.includes('dahi puri') || d.includes('bhel') || d.includes('chaat') || d.includes('papdi chaat')) return 'pani_puri';
  if (d.includes('momo') || d.includes('dimsum') || d.includes('dim sum') || d.includes('dumpling')) return 'momos';
  if (d.includes('noodle') || d.includes('chowmein') || d.includes('hakka') || d.includes('chow mein') || d.includes('chopsuey')) return 'noodles';
  if (d.includes('pizza') || d.includes('margherita') || d.includes('calzone')) return 'pizza';
  if (d.includes('burger')) return 'burger';
  if (d.includes('croissant')) return 'croissant';

  // === 15. DESSERTS & SWEETS ===
  if (d.includes('brownie')) return 'brownie';
  if (d.includes('cake') || d.includes('cheesecake') || d.includes('tiramisu') || d.includes('cupcake') || d.includes('donut') || d.includes('doughnut') || d.includes('muffin') || d.includes('churros') || d.includes('pastry')) return 'cake';
  if (d.includes('ice cream') || d.includes('gelato') || d.includes('sorbet') || d.includes('sundae')) return 'ice_cream';
  if (d.includes('jalebi') || d.includes('imarti') || d.includes('rabdi') || d.includes('rabri')) return 'jalebi';
  if (d.includes('gulab jamun') || d.includes('jamun') || d.includes('rasgulla') || d.includes('rasmalai') || d.includes('halwa') || d.includes('sheera') || d.includes('sweet') || d.includes('mithai') || d.includes('laddoo') || d.includes('laddu') || d.includes('kaju katli') || d.includes('barfi') || d.includes('peda') || d.includes('shrikhand') || d.includes('basundi')) return 'gulab_jamun';

  // === 16. BEVERAGES ===
  if (d.includes('chocolate mastani')) return 'chocolate_mastani';
  if (d.includes('mastani')) return 'mango_mastani';
  if (d.includes('mango') && d.includes('shake')) return 'mango_mastani';
  if (d.includes('smoothie') || d.includes('granola') || d.includes('fruit bowl') || d.includes('oats')) return 'smoothie';
  if (d.includes('falooda') || d.includes('kulfi')) return 'falooda';
  if (d.includes('cold coffee') || d.includes('frappe')) return 'cold_coffee';
  if (d.includes('shake') || d.includes('thick shake') || d.includes('milkshake')) return 'chocolate_mastani';
  if (d.includes('juice') || d.includes('fresh lime') || d.includes('nimbu pani') || d.includes('lemonade') || d.includes('iced tea') || d.includes('sharbat')) return 'fruit_juice';
  if (d.includes('filter coffee') || d.includes('espresso') || d.includes('cappuccino') || d.includes('latte') || d.includes('americano') || d.includes('mocha') || d.includes('flat white') || d.includes('macchiato')) return 'filter_coffee';
  if (d.includes('chai') || d.includes('tea') || d.includes('masala chai') || d.includes('green tea') || d.includes('irani chai')) return 'masala_chai';

  // Context Fallbacks
  if (r.includes('biryani')) return 'biryani';
  if (r.includes('seafood') || r.includes('fish') || r.includes('malvan') || r.includes('nisarg') || r.includes('gajalee')) return 'fish_fry';
  if (r.includes('mutton') || r.includes('military') || r.includes('maratha') || r.includes('dehati') || r.includes('surve')) return 'mutton_curry';

  return 'thali';
}

console.log('Testing Canonical Key Resolution with Improved Matcher:\n');
let issues = [];
testDishes.forEach(dish => {
  const key = matchDishToCanonicalKey(dish);
  console.log(`"${dish}" -> ${key}`);
  
  if (dish.includes('Fried Rice') && key !== 'fried_rice') {
    issues.push(`ISSUE: "${dish}" mapped to "${key}" instead of "fried_rice"!`);
  }
  if (dish.includes('Sandwich') && key !== 'sandwich') {
    issues.push(`ISSUE: "${dish}" mapped to "${key}" instead of "sandwich"!`);
  }
  if ((dish.includes('Hara Bhara Kabab') || dish.includes('Veg Seekh Kebab') || dish.includes('Dahi Ke Kabab')) && key !== 'paneer_tikka') {
    issues.push(`ISSUE: "${dish}" mapped to "${key}" (should be a veg starter: paneer_tikka)!`);
  }
  if (dish.includes('Chilli Paneer') && key !== 'paneer_tikka') {
    issues.push(`ISSUE: "${dish}" mapped to "${key}" instead of "paneer_tikka"!`);
  }
  if (dish.includes('Veg Manchurian Dry') && key !== 'paneer_tikka') {
    issues.push(`ISSUE: "${dish}" mapped to "${key}" instead of "paneer_tikka"!`);
  }
});

console.log('\n--- ISSUES FOUND ---');
if (issues.length === 0) {
  console.log('ALL PASSED! Zero issues found.');
} else {
  issues.forEach(i => console.log('❌', i));
}
