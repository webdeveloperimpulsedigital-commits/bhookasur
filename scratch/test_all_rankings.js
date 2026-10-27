function parseRatingCount(countVal) {
  if (!countVal) return 0;
  if (typeof countVal === 'number') return countVal;
  const s = String(countVal).trim().toLowerCase();
  if (s.includes('k')) {
    const num = parseFloat(s.replace(/[^0-9.]/g, ''));
    return Math.round((num || 1) * 1000);
  }
  const digits = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(digits) ? 0 : digits;
}

function isAccompaniment(name, category) {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('cutlery') || n.includes('carry bag') || n.includes('paper bag') || n.includes('packaging')) return true;
  if (
    n.startsWith('extra ') ||
    n.includes('extra dip') ||
    n.includes('extra chutney') ||
    n.includes('extra sauce') ||
    n.includes('extra pav') ||
    n.includes('extra bhatura') ||
    n.includes('extra roti') ||
    n.includes('extra puri') ||
    n.includes('extra mayo') ||
    n.includes('momo chutney') ||
    c.includes('extra dip') ||
    c.includes('accompaniment') ||
    c.includes('condiment') ||
    c.includes('addon') ||
    c.includes('add-on')
  ) return true;
  return false;
}

function isDrink(name, category) {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (c.includes('drink') || c.includes('beverage')) return true;
  const bevKeywords = [
    'water', 'mineral water', 'ice tea', 'iced tea', 'peach ice tea', 'lemon ice tea',
    'cold drink', 'soft drink', 'coca cola', 'coke', 'pepsi', 'sprite', 'thums up',
    'fanta', 'soda', 'shikanji', 'aam panna', 'jaljeera'
  ];
  return bevKeywords.some(kw => new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i').test(n));
}

function isBeverageOnlyPlace(rName) {
  const r = (rName || '').toLowerCase();
  return r.includes('mastani') || r.includes('chai') || r.includes('coffee') || r.includes('tea') ||
         r.includes('cafe') || r.includes('juice') || r.includes('shake') || r.includes('ice cream');
}

function calculateDishScore(d, restaurantName) {
  const isBevVenue = isBeverageOnlyPlace(restaurantName);
  
  if (isAccompaniment(d.name, d.category)) {
    return -1000;
  }
  if (!isBevVenue && isDrink(d.name, d.category)) {
    return -500;
  }

  let score = 0;

  // 1. Restaurant Specialties & Signatures (Priority 1)
  const isBestseller = Boolean(d.is_bestseller);
  const isRecommended = Boolean(d.is_recommended === 1 || (d.category && /recommended|top pick|special|signature/i.test(d.category)));
  const hasSpecialName = /special|signature|famous|chef/i.test(d.name);

  if (isBestseller) score += 60;
  if (isRecommended) score += 40;
  if (hasSpecialName) score += 15;

  // 2. Popularity & Order Counts (Priority 2)
  const pop = Number(d.popularity) || 0;
  score += pop * 0.4;

  // 3. Ratings and Reviews (Priority 3)
  const rating = Number(d.rating) || 0;
  const ratingCount = parseRatingCount(d.rating_count);

  if (rating > 0) {
    score += rating * 6;
    const reviewBonus = Math.min(Math.log10(ratingCount + 1) * 8.3, 25);
    score += reviewBonus;
  } else {
    score += 15;
  }

  return score;
}

function selectTopDishes(allDishes, restaurantName, maxCount = 3) {
  if (!allDishes || allDishes.length === 0) return [];

  const scored = allDishes.map(d => ({
    dish: d,
    score: calculateDishScore(d, restaurantName)
  })).sort((a, b) => b.score - a.score);

  const validCandidates = scored.filter(item => item.score > -200);
  const pool = validCandidates.length > 0 ? validCandidates : scored;

  const selected = [];
  const seenNormNames = new Set();

  for (const item of pool) {
    if (selected.length >= maxCount) break;

    const norm = item.dish.name
      .toLowerCase()
      .replace(/\s*-\s*(half|full|mini|large|medium|light\s*eaters|\d+\s*ml|\d+\s*pcs).*/i, '')
      .replace(/\(.*?\)/g, '')
      .trim();

    if (!seenNormNames.has(norm)) {
      seenNormNames.add(norm);
      selected.push(item.dish);
    }
  }

  if (selected.length < maxCount) {
    for (const item of pool) {
      if (selected.length >= maxCount) break;
      if (!selected.some(s => s.id === item.dish.id)) {
        selected.push(item.dish);
      }
    }
  }

  return selected;
}

async function testAll() {
  const ids = [
    { name: 'Chinese Wok', id: 326931 },
    { name: 'Vaishali Restaurant', id: 8 },
    { name: 'Poona Guest House', id: 65 },
    { name: 'Joshi wadewale', id: 32 },
    { name: 'Katakirrr Misal', id: 395863 },
    { name: 'Sujata Mastani', id: 22501 },
    { name: 'Burger King', id: 42581 }
  ];

  for (const item of ids) {
    const res = await fetch(`http://localhost:3000/api/restaurants/${item.id}/dishes`);
    const json = await res.json();
    const top3 = selectTopDishes(json.data, item.name, 3);
    console.log(`\n========================================`);
    console.log(`TOP 3 FOR: ${item.name} (${json.count} total dishes)`);
    console.log(`========================================`);
    top3.forEach((d, idx) => {
      console.log(`  [${idx + 1}] ${d.name} | Rating: ${d.rating} | Veg: ${d.is_veg} | Cat: ${d.category} | Bestseller: ${d.is_bestseller}`);
    });
  }
}

testAll().catch(console.error);
