/**
 * Universal AI Dish Visual Assets Generator
 * Generates dynamic AI-based pure food PNG images in real-time with ZERO background.
 * Checks the user-selected restaurant and the chosen menu item dynamically.
 */

import { withBasePath } from './basePath';

export interface DishVisualAssets {
  plateImage: string;
  flyingImage: string;
}

export function formatCleanDishName(dishName?: string, restaurantName?: string): string {
  if (!dishName) return 'Signature Dish';
  let name = dishName.trim();

  if (restaurantName) {
    const restClean = restaurantName.split(',')[0].trim();
    if (restClean) {
      const escaped = restClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Remove prepended "RestaurantName ," or "RestaurantName -"
      const prefixRegex = new RegExp(`^${escaped}\\s*[,\\-:]\\s*`, 'i');
      name = name.replace(prefixRegex, '');

      // Remove repeated "Special RestaurantName Special"
      const specRestSpec = new RegExp(`Special\\s+${escaped}\\s+Special`, 'gi');
      name = name.replace(specRestSpec, 'Special');
    }
  }

  // Remove duplicate consecutive "Special Special"
  name = name.replace(/\bSpecial\s+Special\b/gi, 'Special');

  // Clean double spaces or comma artifacts
  name = name.replace(/\s+/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '').trim();

  return name || 'Signature Dish';
}

export function isDishVeg(dishName?: string): boolean {
  if (!dishName) return true;
  const n = dishName.toLowerCase().trim();

  // 1. Tomato Omelette in Indian & Maharashtrian cuisine is 100% vegetarian (besan/tomato/coriander pancake)
  if (
    n.includes('tomato omelette') || n.includes('tomato omelet') || n.includes('tomato omlet') ||
    n.includes('veg omelette') || n.includes('veg omelet') || n.includes('vegan omelette') ||
    n.includes('besan cheela') || n.includes('cheela') || n.includes('chilla')
  ) {
    return true;
  }

  // 2. Regular omelettes without explicit vegetarian prefix are made of eggs (non-vegetarian)
  if (/\bomelet(te)?\b/i.test(n) || /\bomlet\b/i.test(n)) {
    return false;
  }

  // 3. Explicitly protected Maharashtrian vegetarian specialties with "rassa", "sukhi", "gavran" or traditional names
  if (
    n.includes('patodi rassa') || n.includes('batata rassa') || n.includes('kanda batata rassa') ||
    n.includes('kanda-batata rassa') || n.includes('vangi batata rassa') || n.includes('shev bhaji') ||
    n.includes('pithla') || n.includes('pitla') || n.includes('zunka') || n.includes('jhunka') ||
    n.includes('bharli vangi') || n.includes('vangyache bharit') || n.includes('matki usal') ||
    n.includes('moong usal') || n.includes('chawli usal') || n.includes('kala vatana') ||
    n.includes('valachi usal') || n.includes('pavta usal') || n.includes('varan bhat') ||
    n.includes('varan-bhat') || n.includes('masale bhat') || n.includes('masale bhaat') ||
    n.includes('katachi amti') || n.includes('goda amti') || n.includes('takachi kadhi') ||
    n.includes('danyachi amti') || n.includes('shengdanayachi amti') || n.includes('solkadhi') ||
    n.includes('puran poli') || n.includes('modak') || n.includes('ukadiche modak') ||
    n.includes('thalipeeth') || n.includes('kothimbir vadi') || n.includes('alu vadi') ||
    n.includes('suralichi vadi') || n.includes('shrikhand') || n.includes('amrakhand') ||
    n.includes('basundi') || n.includes('aamras') || n.includes('kharvas') ||
    n.includes('thecha') || n.includes('mirchi thecha') || n.includes('lasun chutney') ||
    n.includes('shengdana chutney') || n.includes('metkut') || n.includes('sabudana khichdi') ||
    n.includes('sabudana vada') || n.includes('upvas') || n.includes('bhagar') ||
    n.includes('ratalyacha kees') || n.includes('rajgira') || n.includes('farali pattice') ||
    n.includes('shev bhaji thali') || n.includes('matki usal thali') || n.includes('bharli vangi thali') ||
    (n.includes('gavran thali') && !n.includes('chicken') && !n.includes('mutton'))
  ) {
    return true;
  }

  // 4. Non-veg meats, eggs, poultry, seafood ALWAYS make a dish non-veg
  const meatKeywords = [
    'chicken', 'mutton', 'egg', 'eggs', 'anda', 'ande', 'fish', 'prawn', 'prawns', 'crab',
    'bombil', 'surmai', 'pomfret', 'bangda', 'kolambi', 'meat', 'gosht', 'bokud', 'bolai',
    'kombdi', 'kombadi', 'tangdi', 'lamb', 'beef', 'pork', 'bacon', 'nihari', 'paya',
    'seafood', 'duck', 'turkey', 'rawas', 'clams', 'lobster',
    'zinger', 'fried chicken', 'kfc', 'baida roti', 'boti'
  ];
  if (meatKeywords.some(kw => new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i').test(n))) {
    return false;
  }

  // 5. Vegetarian exceptions for kebabs, seekh and platters
  if (
    n.includes('veg kebab') || n.includes('veg seekh') || n.includes('hara bhara') ||
    n.includes('dahi ke') || n.includes('paneer tikka') || n.includes('mushroom tikka') ||
    n.includes('soya chaap') || n.includes('veg cutlet') || n.includes('veg platter') ||
    n.includes('veg plater')
  ) {
    return true;
  }

  // 6. Other non-veg keywords (Maharashtrian Non-Veg Curries, Rassa & Preparations)
  const otherNonVegKeywords = [
    'keema', 'kheema', 'galouti', 'seekh', 'non veg', 'non-veg', 'nonveg',
    'tandoori chicken', 'kebab', 'kabab', 'shawarma', 'tambda rassa', 'pandhra rassa',
    'sukka mutton', 'sukha mutton', 'mutton sukka', 'mutton sukha', 'chicken sukka', 'chicken sukha',
    'mutton saoji', 'chicken saoji', 'saoji mutton', 'saoji chicken',
    'mutton bhuna', 'mutton handi', 'mutton kharda', 'malvani fish', 'fish thali',
    'gavran chicken', 'tambda', 'pandhra', 'varhadi chicken', 'varhadi mutton'
  ];
  if (otherNonVegKeywords.some(kw => n.includes(kw))) {
    return false;
  }

  // 6. Explicit vegetarian identifiers
  if (
    n.includes('paneer') || n.includes('pure veg') || n.includes('veg thali') ||
    n.includes('soya') || n.includes('dal') || n.includes('aloo') || n.includes('gobi') ||
    n.includes('dosa') || n.includes('idli') || n.includes('sambar') || n.includes('vada pav') ||
    n.includes('misal') || n.includes('pav bhaji') || n.includes('hara bhara') ||
    n.includes('dahi ke') || n.includes('mushroom') || n.includes('corn') ||
    n.includes('palak') || n.includes('methi') || n.includes('matar') || n.includes('bhindi') ||
    n.includes('chole') || n.includes('rajma') || n.includes('baingan') || n.includes('kadhi') ||
    n.includes('kachori') || n.includes('samosa') || n.includes('bhel') || n.includes('poha') ||
    n.includes('upma') || n.includes('dhokla') || n.includes('khichdi') || n.includes('barfi') ||
    n.includes('katli') || n.includes('ladoo') || n.includes('jalebi') || n.includes('rasmalai') ||
    n.includes('gulab jamun') || n.includes('modak') || n.includes('puran poli') ||
    n.includes('thalipeeth') || n.includes('kothimbir') || n.includes('alu vadi') ||
    n.includes('solkadhi') || n.includes('taak') || n.includes('buttermilk') || n.includes('butter milk') ||
    n.includes('chaas') || n.includes('chhaas') || n.includes('majjiga') || n.includes('lassi') ||
    n.includes('pithla') || n.includes('pitla') || n.includes('bhakri') ||
    n.includes('bharli vangi') || n.includes('varan bhat') || n.includes('varan') ||
    n.includes('katachi amti') || n.includes('amti') || n.includes('shev bhaji') ||
    n.includes('rassa bhaji') || n.includes('sukhi bhaji') || n.includes('masala bhaat') ||
    n.includes('masale bhat') || n.includes('shrikhand') || n.includes('aamras') ||
    n.includes('kheer') || n.includes('payasam') || n.includes('puri bhaji') ||
    n.includes('poori bhaji') || n.includes('batata bhaji') ||
    n.includes('mattha') || n.includes('khamang kakdi') || n.includes('sabudana') ||
    n.includes('matki') || n.includes('usal') || n.includes('aluchi bhaji') ||
    n.includes('fadfade') || n.includes('puneri thali') || n.includes('dadpe pohe') ||
    n.includes('vada') || n.includes('wada') || n.includes('bhajji') || n.includes('bhaji') ||
    n.includes('pakoda') || n.includes('pakora') || n.includes('pattice') || n.includes('piyush') ||
    /\bveg\b/i.test(n) || /\bvegetarian\b/i.test(n)
  ) {
    return true;
  }

  return true;
}

/**
 * Universal Pure Vegetarian Restaurant Validator
 * Validates whether an establishment is strictly a vegetarian institution.
 * Prevents non-vegetarian items (like chicken or mutton) from ever appearing
 * in the menus of pure-veg heritage dining halls, sweets, or Maharashtrian cultural institutions.
 */
export function isPureVegRestaurantName(restaurantName?: string): boolean {
  if (!restaurantName) return false;
  const lower = restaurantName.toLowerCase().trim();

  // Explicit non-veg disqualifiers
  const nonVegTerms = [
    'non-veg', 'non veg', 'nonveg', 'mutton', 'chicken', 'fish', 'seafood',
    'prawn', 'crab', 'meat', 'military', 'biryani house', 'kebab', 'kabab',
    'bar', 'pub', 'permit room', 'kfc', 'burger king', 'mcdonald'
  ];
  if (nonVegTerms.some(term => lower.includes(term))) {
    return false;
  }

  // Heritage vegetarian landmarks and pure-veg institutions (Pune, Mumbai, etc.)
  const vegLandmarks = [
    'joshi wadewale', 'rohit wadewale', 'wadewale', 'wade wale', 'wada pav', 'vadapav',
    'shaniwar peth', 'sadashiv peth', 'narayan peth',
    'poona guest house', 'poona guest', 'durvankur', 'phadke', 'phadke dining', 'shreyas', 'sukanta',
    'badshahi', 'shabree', 'sujata mastani', 'sujata', 'chitale bandhu',
    'chitale', 'bedekar tea stall', 'bedekar', 'bipin snacks', 'bipin katta',
    'tilak hotel', 'tilak snacks', 'saraswati misal',
    'vaishali', 'roopali', 'hotel roopali', 'wadeshwar', 'girija pure veg',
    'ankur veg', 'visava pure veg', 'greens pure veg', 'gajanan vadapav',
    'mamledar misal', 'prashant corner', 'sardar refreshments', 'gurukripa',
    'anand stall', 'sita ram diwan chand', 'vidyarthi bhavan', 'shri sagar ctr',
    'ctr', 'mtr', 'corner house ice cream', 'k.c. das sweets', 'chutneys',
    'kaka halwai', 'bikanervala', 'haldiram'
  ];
  if (vegLandmarks.some(landmark => lower.includes(landmark))) {
    return true;
  }

  // Generic pure veg identifiers
  return (
    lower.includes('wadewale') ||
    lower.includes('wade wale') ||
    lower.includes('vada pav') ||
    lower.includes('vadapav') ||
    lower.includes('wada') ||
    lower.includes('batata vada') ||
    lower.includes('shaniwar peth') ||
    lower.includes('pure veg') ||
    lower.includes('pure-veg') ||
    (lower.includes('veg') && !lower.includes('non')) ||
    lower.includes('bhojanalay') ||
    lower.includes('bhojanalaya') ||
    lower.includes('shakahari') ||
    lower.includes('swayampakghar') ||
    lower.includes('swayampak') ||
    lower.includes('dining hall') ||
    lower.includes('dining room') ||
    lower.includes('khanawal') ||
    lower.includes('upahar') ||
    lower.includes('upahargruh') ||
    lower.includes('upahar gruh') ||
    lower.includes('nashta') ||
    lower.includes('poli bhaji') ||
    lower.includes('farsan') ||
    lower.includes('sweet mart') ||
    lower.includes('bhavan') ||
    lower.includes('udupi') ||
    lower.includes('udipi') ||
    lower.includes('dosa') ||
    lower.includes('idli') ||
    lower.includes('mithai') ||
    lower.includes('sweets') ||
    lower.includes('bhel') ||
    lower.includes('chaat') ||
    lower.includes('jain')
  );
}

/**
 * Universal Dish Visual Assets Resolver
 * Guarantees that ALL food items (searched or menu-generated) return
 * 100% pure food PNG format with NO background, dynamically generated by AI.
 * If an authentic dish photo URL exists (e.g. from Swiggy via Apify), it is passed
 * as the imgUrl source to create the cutout.
 */
export function getDishVisualAssets(dishName?: string, dishImage?: string, restaurantName?: string): DishVisualAssets {
  const cleanName = formatCleanDishName(dishName, restaurantName);

  // 1. If dishImage is already a fully formed AI endpoint URL specifically for this dish
  if (dishImage && (dishImage.startsWith('/api/ai/dish-image') || dishImage.includes('/api/ai/dish-image'))) {
    return {
      plateImage: withBasePath(dishImage),
      flyingImage: withBasePath(dishImage)
    };
  }

  let aiPngUrl = `/api/ai/dish-image?dish=${encodeURIComponent(cleanName)}&restaurant=${encodeURIComponent(restaurantName || '')}&v=v55`;
  // Forward verified remote Swiggy, Zomato CDN, Cloudinary, Google, or Unsplash dish photos
  if (
    dishImage &&
    (dishImage.startsWith('http://') || dishImage.startsWith('https://')) &&
    (
      dishImage.includes('swiggy.com') ||
      dishImage.includes('cloudinary.com') ||
      dishImage.includes('zmtcdn.com') ||
      dishImage.includes('zomato.com') ||
      dishImage.includes('googleusercontent.com') ||
      dishImage.includes('unsplash.com')
    )
  ) {
    aiPngUrl += `&imgUrl=${encodeURIComponent(dishImage)}`;
  }

  return {
    plateImage: withBasePath(aiPngUrl),
    flyingImage: withBasePath(aiPngUrl)
  };
}

export function getMatchingFlyingCutout(dishName?: string, restaurantName?: string, dishImage?: string): string {
  return getDishVisualAssets(dishName, dishImage, restaurantName).flyingImage;
}

export function getDishExactPlateImage(dishName?: string, dishImage?: string, restaurantName?: string): string {
  return getDishVisualAssets(dishName, dishImage, restaurantName).plateImage;
}

export function getDishExactFlyingImage(dishName?: string, dishImage?: string, restaurantName?: string): string {
  return getDishVisualAssets(dishName, dishImage, restaurantName).flyingImage;
}

/**
 * Universal Strict Culinary Search & Menu Matcher
 * Guarantees that dish searches strictly return dishes relevant to the searched dish,
 * matching on dish name / title identity rather than accidental ingredient mentions.
 * Prevents cross-cuisine leakage, unrelated substitutions, or dish mixing.
 */
export function isDishRelevantToSearch(dishTitle?: string, userQuery?: string): boolean {
  if (!dishTitle || !userQuery) return false;

  const clean = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const dRaw = clean(dishTitle);
  const qRaw = clean(userQuery);
  if (!dRaw || !qRaw) return false;

  const typoMap: Record<string, string> = {
    vadapav: 'vada pav',
    wada: 'vada',
    bhajiya: 'bhaji',
    bhajji: 'bhaji',
    pakoda: 'bhaji',
    pakora: 'bhaji',
    poori: 'puri',
    pavbhaji: 'pav bhaji',
    panipuri: 'pani puri',
    ragdapuri: 'ragda puri',
    shevpuri: 'sev puri',
    bhelpuri: 'bhel puri',
    pulav: 'pulao',
    biriyani: 'biryani',
    briyani: 'biryani',
    pattice: 'pattice',
    patties: 'pattice',
    plater: 'platter',
    platers: 'platter',
    bhkari: 'bhakri',
    bhakari: 'bhakri',
    sambhar: 'sambar',
    medhu: 'medu',
    vadai: 'vada',
    bhaat: 'bhat',
    masala: 'masale',
    pitla: 'pithla',
    jhunka: 'zunka',
    kombadi: 'kombdi',
    wade: 'vade',
    tamda: 'tambda',
    pandra: 'pandhra',
    chawal: 'rice',
    chaawal: 'rice',
    onioun: 'onion',
    onionn: 'onion',
    ooli: 'oli',
    ovli: 'oli',
    olya: 'oli',
    bhadanga: 'bhadang',
    bhadangaa: 'bhadang',
    uttapa: 'uttapam',
    uthappa: 'uttapam',
    oothappa: 'uttapam',
    utappa: 'uttapam',
    utpam: 'uttapam',
    dhosa: 'dosa',
    dosai: 'dosa',
    dhokal: 'dhokla',
    dhoklaa: 'dhokla',
    dhokle: 'dhokla',
    khamandhokla: 'khaman dhokla'
  };

  const normalize = (str: string) => {
    let s = str;
    for (const [k, v] of Object.entries(typoMap)) {
      s = s.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
    }
    return s.replace(/\s+/g, ' ').trim();
  };

  const d = normalize(dRaw);
  const q = normalize(qRaw);

  // === 1. Masale Bhat & Variations (Strict Isolation) ===
  const isMasaleBhatQuery =
    (q.includes('masale bhat') || (q.includes('masale') && (q.includes('bhat') || q.includes('rice')))) &&
    !q.includes('pav') && !q.includes('biryani') && !q.includes('pulao');

  if (isMasaleBhatQuery) {
    const isDishMasaleBhat =
      d.includes('masale bhat') ||
      (d.includes('masale') && (d.includes('bhat') || d.includes('rice'))) ||
      d.includes('vangi bhat') || d.includes('tondli bhat') || d.includes('matki bhat') ||
      d.includes('valache bhat') || d.includes('goda masale bhat');

    if (!isDishMasaleBhat) return false;
    // Disqualify Biryani, Pulao, Varan Bhat, or non-masale rice
    if (d.includes('biryani') || d.includes('varan') || d.includes('fried rice') || d.includes('curd rice')) {
      return false;
    }
    return true;
  }

  // === 2. Varan Bhat / Varan-Bhat-Tup ===
  const isVaranBhatQuery =
    (q.includes('varan bhat') || (q.includes('varan') && (q.includes('bhat') || q.includes('tup') || q.includes('rice')))) &&
    !q.includes('biryani');

  if (isVaranBhatQuery) {
    return (
      (d.includes('varan bhat') || (d.includes('varan') && (d.includes('bhat') || d.includes('rice') || d.includes('tup')))) &&
      !d.includes('biryani') && !d.includes('fried rice') && !d.includes('masale')
    );
  }

  // === 3. Pithla Bhakri & Zunka Bhakri ===
  const isPithlaZunkaQuery =
    q.includes('pithla') || q.includes('zunka') || (q.includes('bhakri') && !q.includes('mutton') && !q.includes('chicken'));

  if (isPithlaZunkaQuery) {
    if (q.includes('pithla') && !d.includes('pithla') && !d.includes('zunka')) return false;
    if (q.includes('zunka') && !d.includes('zunka') && !d.includes('pithla')) return false;
    return d.includes('pithla') || d.includes('zunka') || d.includes('bhakri');
  }

  // === 4. Shev Bhaji / Khandeshi Shev Bhaji ===
  const isShevBhajiQuery =
    q.includes('shev bhaji') || q.includes('sev bhaji');

  if (isShevBhajiQuery) {
    return (d.includes('shev bhaji') || d.includes('sev bhaji')) && !d.includes('pav bhaji');
  }

  // === 5. Bharli Vangi & Eggplant Preparations ===
  const isBharliVangiQuery =
    q.includes('bharli vangi') || q.includes('vangi') || q.includes('vangyache bharit');

  if (isBharliVangiQuery) {
    return d.includes('vangi') || d.includes('vangyache');
  }

  // === 6. Patodi Rassa ===
  const isPatodiRassaQuery = q.includes('patodi');
  if (isPatodiRassaQuery) {
    return d.includes('patodi');
  }

  // === 7. Kombdi Vade ===
  const isKombdiVadeQuery = q.includes('kombdi') || (q.includes('chicken') && q.includes('vade'));
  if (isKombdiVadeQuery) {
    return d.includes('kombdi') || (d.includes('chicken') && d.includes('vade'));
  }

  // === 8. Tambda / Pandhra Rassa ===
  if (q.includes('tambda')) {
    return d.includes('tambda');
  }
  if (q.includes('pandhra')) {
    return d.includes('pandhra');
  }

  // === 9. Sukha / Sukka Mutton with Bhakri ===
  const isSukhaMuttonQuery =
    (q.includes('sukha') || q.includes('sukka')) && (q.includes('mutton') || q.includes('bhakri'));

  if (isSukhaMuttonQuery) {
    return (d.includes('sukha') || d.includes('sukka')) && d.includes('mutton');
  }

  // === 10. Pav Bhaji & Variations (Strict Isolation) ===
  const isPavBhajiQuery =
    q.includes('pav bhaji') ||
    (q.includes('pav') && q.includes('bhaji') && !q.includes('masala pav') && !q.includes('vada pav') && !q.includes('misal'));

  if (isPavBhajiQuery) {
    const isDishPavBhaji =
      d.includes('pav bhaji') ||
      (d.includes('pav') && d.includes('bhaji') && !d.includes('vada pav') && !d.includes('misal pav'));

    if (!isDishPavBhaji) return false;

    // If query specifically asks for cheese pav bhaji:
    if (q.includes('cheese') && !d.includes('cheese') && !d.includes('cheesy')) {
      return false;
    }
    return true;
  }

  // === 2. Masala Pav (Distinct dish: spiced butter pav on tawa, NOT pav bhaji) ===
  const isMasalaPavQuery =
    q.includes('masala pav') || (q.includes('masala') && q.includes('pav') && !q.includes('bhaji'));

  if (isMasalaPavQuery) {
    return (
      (d.includes('masala pav') || (d.includes('masala') && d.includes('pav'))) &&
      !d.includes('pav bhaji') &&
      !d.includes('vada pav') &&
      !d.includes('misal')
    );
  }

  // === 3. Vada Pav ===
  const isVadaPavQuery =
    q.includes('vada pav') || q.includes('wada pav') || (q.includes('vada') && q.includes('pav'));

  if (isVadaPavQuery) {
    return (
      d.includes('vada pav') ||
      d.includes('wada pav') ||
      (d.includes('vada') && d.includes('pav') && !d.includes('misal') && !d.includes('bhaji'))
    );
  }

  // === 4. Pani Puri / Golgappa ===
  const isPaniPuriQuery =
    q.includes('pani puri') || q.includes('golgappa') || q.includes('puchka');

  if (isPaniPuriQuery) {
    return d.includes('pani puri') || d.includes('golgappa') || d.includes('puchka');
  }

  // === 5. Ragda Puri ===
  const isRagdaPuriQuery =
    q.includes('ragda puri') || (q.includes('ragda') && q.includes('puri'));

  if (isRagdaPuriQuery) {
    return (
      (d.includes('ragda puri') || (d.includes('ragda') && d.includes('puri'))) &&
      !d.includes('pattice') &&
      !d.includes('patties')
    );
  }

  // === 6. Ragda Pattice ===
  const isRagdaPatticeQuery =
    q.includes('ragda pattice') || q.includes('ragda patties') || q.includes('pattice') || q.includes('patties');

  if (isRagdaPatticeQuery) {
    return d.includes('pattice') || d.includes('patties') || (d.includes('ragda') && d.includes('pattice'));
  }

  // === 7. Kanda Bhaji / Onion Pakoda ===
  const isKandaBhajiQuery =
    q.includes('kanda bhaji') || q.includes('khekda bhaji') || (q.includes('kanda') && (q.includes('bhaji') || q.includes('pakoda')));

  if (isKandaBhajiQuery) {
    return (
      (d.includes('kanda') && (d.includes('bhaji') || d.includes('pakoda') || d.includes('bhajji'))) ||
      d.includes('khekda bhaji')
    );
  }

  // === 8. Batata Bhaji (Yellow sukhi sabzi, distinct from Puri Bhaji and Pav Bhaji) ===
  const isBatataBhajiQuery =
    q.includes('batata bhaji') || q.includes('batatyachi bhaji') ||
    (q.includes('batata') && q.includes('bhaji') && !q.includes('puri') && !q.includes('pav'));

  if (isBatataBhajiQuery) {
    return (
      (d.includes('batata') && (d.includes('bhaji') || d.includes('bhajji')) && !d.includes('puri') && !d.includes('pav')) ||
      d.includes('batatyachi bhaji')
    );
  }

  // === 9. Puri Bhaji ===
  const isPuriBhajiQuery =
    (q.includes('puri') || q.includes('poori')) && (q.includes('bhaji') || q.includes('bhajji') || q.includes('sagu'));

  if (isPuriBhajiQuery) {
    return (
      (d.includes('puri') || d.includes('poori')) &&
      (d.includes('bhaji') || d.includes('bhajji') || d.includes('sagu')) &&
      !d.includes('pav')
    );
  }

  // === 10. Shrikhand Puri ===
  const isShrikhandPuriQuery =
    (q.includes('shrikhand') || q.includes('amrakhand')) && (q.includes('puri') || q.includes('poori'));

  if (isShrikhandPuriQuery) {
    return (d.includes('shrikhand') || d.includes('amrakhand')) && (d.includes('puri') || d.includes('poori'));
  }

  // === 11. Misal / Misal Pav ===
  const isMisalQuery = q.includes('misal') || q.includes('katakirr');
  if (isMisalQuery) {
    return d.includes('misal') || d.includes('katakirr');
  }

  // === 12. Tomato Omelette / Veg Omelette / Besan Cheela ===
  const isTomatoOmeletteQuery =
    q.includes('tomato omelette') || q.includes('tomato omelet') || q.includes('tomato omlet') ||
    q.includes('veg omelette') || q.includes('veg omelet') || q.includes('besan cheela');
  if (isTomatoOmeletteQuery) {
    return (
      d.includes('tomato omelette') || d.includes('tomato omelet') || d.includes('tomato omlet') ||
      d.includes('veg omelette') || d.includes('veg omelet') || d.includes('besan cheela')
    );
  }

  // === 13. Buttermilk / Taak / Chaas / Mattha / Majjiga ===
  const isButtermilkQuery =
    q.includes('butter milk') || q.includes('buttermilk') || q.includes('chaas') ||
    q.includes('chhaas') || q.includes('taak') || q.includes('mattha') || q.includes('majjiga');

  if (isButtermilkQuery) {
    return (
      (
        d.includes('butter milk') || d.includes('buttermilk') || d.includes('chaas') ||
        d.includes('chhaas') || d.includes('taak') || d.includes('mattha') || d.includes('majjiga')
      ) &&
      !d.includes('pancake') && !d.includes('waffle') && !d.includes('biscuit')
    );
  }

  // === 13.5 Papad / Masala Papad / Roasted Papad ===
  const isPapadQuery =
    q.includes('papad') || q.includes('papadum') || q.includes('appalam');
  if (isPapadQuery) {
    return d.includes('papad') || d.includes('papadum') || d.includes('appalam');
  }

  // === 13.6 Kaju Masala / Kaju Curry / Kaju Bhaji ===
  const isKajuQuery = q.includes('kaju') || q.includes('cashew');
  if (isKajuQuery) {
    return d.includes('kaju') || d.includes('cashew');
  }

  // === 14. General Food Queries (Biryani, Pizza, Burger, Dosa, Idli, Pulao, Mastani, Falooda, etc.) ===
  // Direct full substring match
  if (d.includes(q)) return true;

  // Significant token match (all words with length >= 3 must appear in dish title)
  const stopWords = new Set(['special', 'plate', 'dish', 'best', 'super', 'hot', 'authentic', 'famous', 'legendary', 'the', 'and', 'with', 'for']);
  const qTokens = q.split(/\s+/).filter(t => t.length >= 3 && !stopWords.has(t));
  if (qTokens.length > 0) {
    const allTokensPresent = qTokens.every(token => d.includes(token));
    if (allTokensPresent) return true;
  }

  return false;
}

