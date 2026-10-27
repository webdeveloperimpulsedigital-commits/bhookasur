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
    'water', 'mineral water', 'ice tea', 'iced tea', 'cold drink', 'soft drink',
    'coke', 'pepsi', 'sprite', 'thums up', 'fanta', 'soda', 'shikanji', 'aam panna', 'jaljeera'
  ];
  return bevKeywords.some(kw => new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i').test(n));
}

function isBeverageOnlyPlace(rName) {
  const r = (rName || '').toLowerCase();
  return r.includes('mastani') || r.includes('chai') || r.includes('coffee') || r.includes('tea') ||
         r.includes('cafe') || r.includes('juice') || r.includes('shake') || r.includes('ice cream');
}

function scoreDish(d, restaurantName) {
  const isBevVenue = isBeverageOnlyPlace(restaurantName);
  
  if (isAccompaniment(d.name, d.category)) {
    return -1000;
  }
  if (!isBevVenue && isDrink(d.name, d.category)) {
    return -500;
  }

  let score = 0;
  
  // 1. Signature / Bestseller flags
  if (d.is_bestseller) score += 100;
  if (d.is_recommended || (d.category && d.category.toLowerCase() === 'recommended')) score += 50;

  // 2. Rating & Review volume
  const count = parseRatingCount(d.rating_count);
  const countBonus = Math.min(Math.log10(count + 1) * 15, 45); // up to 45 pts
  const ratingScore = (d.rating && d.rating > 0) ? (d.rating * 10) : 35; // 40-50 pts
  score += ratingScore + countBonus;

  // 3. Popularity
  if (d.popularity) score += (d.popularity * 0.3);

  // 4. Core Meal category bonus
  const cat = (d.category || '').toLowerCase();
  const n = d.name.toLowerCase();
  if (
    n.includes('noodles') || n.includes('rice') || n.includes('bowl') ||
    n.includes('manchurian') || n.includes('gravy') || n.includes('biryani') ||
    n.includes('dosa') || n.includes('thali') || n.includes('burger') || n.includes('pizza') ||
    cat.includes('main') || cat.includes('recommended') || cat.includes('starter')
  ) {
    score += 25;
  }

  return score;
}

async function run() {
  const res = await fetch('http://localhost:3000/api/restaurants/326931/dishes');
  const json = await res.json();
  const scored = json.data.map(d => ({
    ...d,
    _score: scoreDish(d, json.restaurant.name)
  })).sort((a, b) => b._score - a._score);

  console.log(`Top 10 dishes for ${json.restaurant.name}:`);
  scored.slice(0, 10).forEach((d, i) => {
    console.log(`[${i+1}] Score: ${d._score.toFixed(1)} | ${d.name} (Veg: ${d.is_veg}, Rating: ${d.rating}, Reviews: ${d.rating_count}, Bestseller: ${d.is_bestseller}, Cat: ${d.category})`);
  });
}

run().catch(console.error);
