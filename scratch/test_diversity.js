const { generateLiveMenuForRestaurant } = require('../lib/liveMenu');
const { isDishVeg } = require('../lib/dishAssets');

function getCourseBucket(name, desc = '') {
  const n = name.toLowerCase();
  const d = desc.toLowerCase();

  if (n.includes('thali') || n.includes('combo') || n.includes('platter') || d.includes('thali')) return 'Thali / Platter';
  if (n.includes('biryani') || n.includes('pulao') || n.includes('pulav') || n.includes('rice') || n.includes('khichdi') || n.includes('bhat') || n.includes('bhaat')) return 'Rice / Biryani';
  if (n.includes('naan') || n.includes('roti') || n.includes('bhakri') || n.includes('paratha') || n.includes('kulcha')) return 'Bread';
  if (n.includes('jamun') || n.includes('kulfi') || n.includes('falooda') || n.includes('lassi') || n.includes('mastani') || n.includes('brownie') || n.includes('cake') || n.includes('custard') || n.includes('solkadhi') || n.includes('chai') || n.includes('coffee') || n.includes('shake')) return 'Dessert / Beverage';
  if (n.includes('tikka') || n.includes('kebab') || n.includes('kabab') || n.includes('lollipop') || n.includes('fry') || n.includes('crispy') || n.includes('momo') || n.includes('roll') || n.includes('chaat') || n.includes('vadi') || n.includes('pakoda') || n.includes('bhajji') || n.includes('samosa') || n.includes('bhel') || n.includes('dosa') || n.includes('idli') || n.includes('sandwich') || n.includes('misal')) return 'Starter / Snack';
  return 'Main Curry';
}

function selectDiverseThreeDishes(dishes, isNonVegRestaurant) {
  let candidates = dishes;
  if (!isNonVegRestaurant) {
    const vegCandidates = candidates.filter(d => isDishVeg(d.name) && d.is_veg !== 0);
    if (vegCandidates.length >= 3) {
      candidates = vegCandidates;
    }
  }

  const sorted = [...candidates].sort((a, b) => {
    const rDiff = (b.rating || 0) - (a.rating || 0);
    if (Math.abs(rDiff) > 0.01) return rDiff;
    if ((b.is_recommended || 0) !== (a.is_recommended || 0)) {
      return (b.is_recommended || 0) - (a.is_recommended || 0);
    }
    return (b.popularity || 0) - (a.popularity || 0);
  });

  const chosen = [];
  const usedBuckets = new Set();

  // Try to pick from 3 distinct course buckets
  for (const d of sorted) {
    const bucket = getCourseBucket(d.name, d.description);
    if (!usedBuckets.has(bucket)) {
      usedBuckets.add(bucket);
      chosen.push(d);
      if (chosen.length === 3) break;
    }
  }

  // Fill up if fewer than 3
  if (chosen.length < 3) {
    for (const d of sorted) {
      if (!chosen.find(c => c.name === d.name)) {
        chosen.push(d);
        if (chosen.length === 3) break;
      }
    }
  }

  return chosen.slice(0, 3);
}

const testHotels = [
  'Hotel Sandeep',
  'Hotel Shivraj',
  'Hotel Shreyas',
  'Hotel Vaishali',
  'Hotel Nisarg',
  'Hotel Panchali',
  'Hotel Jagdamb',
  'Temptation Bar & Restaurant',
  'Hotel Sarovar',
  'Hotel Green Park',
  'Goodluck Cafe',
  'George Restaurant'
];

for (const name of testHotels) {
  const rest = { id: 101, name, city: 'Pune', is_veg: 0 };
  const allDishes = generateLiveMenuForRestaurant(rest);
  const rName = name.toLowerCase();
  const isNonVeg = rName.includes('bar') || rName.includes('pub') || rName.includes('biryani') || rName.includes('mutton') || rName.includes('chicken') || rName.includes('fish') || rName.includes('seafood') || rName.includes('military');
  
  const picks = selectDiverseThreeDishes(allDishes, isNonVeg);
  console.log(`=== ${name} (total ${allDishes.length} dishes) ===`);
  picks.forEach((p, i) => {
    console.log(`  ${i+1}. [${getCourseBucket(p.name, p.description)}] ${p.name}`);
  });
  console.log('');
}
