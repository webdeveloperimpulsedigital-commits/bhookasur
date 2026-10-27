const { generateLiveMenuForRestaurant } = require('../lib/liveMenu');
const { isDishVeg } = require('../lib/dishAssets');

function getCourseBucket(name, desc = '', cat = '') {
  const n = name.toLowerCase();
  const d = desc.toLowerCase();
  const c = cat.toLowerCase();

  if (c.includes('thali') || c.includes('combo') || n.includes('thali') || n.includes('combo') || n.includes('platter') || d.includes('thali')) {
    return 'Thalis & Combos';
  }
  if (c.includes('bread') || ((n.includes('bhakri') || n.includes('naan') || n.includes('roti') || n.includes('paratha') || n.includes('kulcha') || n.includes('chapati') || n.includes('phulka')) && !n.includes('misal') && !n.includes('vada'))) {
    return 'Indian Breads';
  }
  if (c.includes('rice') || c.includes('biryani') || n.includes('biryani') || n.includes('pulao') || n.includes('pulav') || n.includes('khichdi') || n.includes('jeera rice') || n.includes('fried rice') || (n.includes('rice') && !n.includes('bhakri')) || n.includes('bhat') || n.includes('bhaat')) {
    return 'Rice & Biryani';
  }
  if (c.includes('dessert') || c.includes('sweet') || c.includes('beverage') || c.includes('drink') || c.includes('ice cream') || c.includes('coffee') || c.includes('tea') ||
      n.includes('jamun') || n.includes('kulfi') || n.includes('falooda') || n.includes('lassi') || n.includes('mastani') || n.includes('brownie') || n.includes('cake') || n.includes('custard') || n.includes('solkadhi') || n.includes('chai') || n.includes('coffee') || n.includes('shake') || n.includes('mattha') || n.includes('sharbat') || n.includes('jalebi') || n.includes('sheera')) {
    return 'Desserts & Drinks';
  }
  if (c.includes('tandoori') || c.includes('starter') || c.includes('snack') || c.includes('street') || c.includes('chinese') || c.includes('momo') ||
      n.includes('tikka') || n.includes('kebab') || n.includes('kabab') || n.includes('lollipop') || n.includes('koliwada') || n.includes('fry') || n.includes('crispy') || n.includes('momo') || n.includes('roll') || n.includes('chaat') || n.includes('vadi') || n.includes('pakoda') || n.includes('bhajji') || n.includes('samosa') || n.includes('bhel') || n.includes('dosa') || n.includes('idli') || n.includes('vada pav') || n.includes('misal') || n.includes('sandwich') || n.includes('fries') || n.includes('spring roll') || n.includes('soup') || n.includes('noodles')) {
    return 'Starters & Snacks';
  }
  return 'Main Course';
}

function computeThreeDishes(dishes, isNonVegRestaurant) {
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

  for (const d of sorted) {
    const bucket = getCourseBucket(d.name, d.description, d.category);
    if (!usedBuckets.has(bucket)) {
      usedBuckets.add(bucket);
      chosen.push(d);
      if (chosen.length === 3) break;
    }
  }

  if (chosen.length < 3) {
    for (const d of sorted) {
      if (!chosen.some(c => c.name.toLowerCase() === d.name.toLowerCase())) {
        chosen.push(d);
        if (chosen.length === 3) break;
      }
    }
  }

  return chosen.slice(0, 3);
}

const testHotels = [
  { name: 'Hotel Sandeep', is_veg: 0 },
  { name: 'Hotel Shivraj', is_veg: 0 },
  { name: 'Hotel Shreyas', is_veg: 1 },
  { name: 'Hotel Vaishali', is_veg: 1 },
  { name: 'Hotel Nisarg', is_veg: 0 },
  { name: 'Hotel Panchali', is_veg: 0 },
  { name: 'Hotel Jagdamb', is_veg: 0 },
  { name: 'Temptation Bar & Restaurant', is_veg: 0 },
  { name: 'Hotel Sarovar', is_veg: 0 },
  { name: 'Hotel Green Park', is_veg: 0 },
  { name: 'Goodluck Cafe', is_veg: 0 },
  { name: 'George Restaurant', is_veg: 0 },
  { name: 'Hotel Rajdhani Pure Veg', is_veg: 1 },
  { name: 'Hotel Krishna Family Dining', is_veg: 0 }
];

console.log('================================================================');
console.log('   FULL HOTEL MENU & COURSE DIVERSITY VERIFICATION AUDIT   ');
console.log('================================================================\n');

for (const h of testHotels) {
  const rest = { id: 101, name: h.name, city: 'Pune', is_veg: h.is_veg };
  const allDishes = generateLiveMenuForRestaurant(rest);
  const rName = h.name.toLowerCase();
  const isNonVeg = rName.includes('bar') || rName.includes('pub') || rName.includes('biryani') || rName.includes('mutton') || rName.includes('chicken') || rName.includes('fish') || rName.includes('seafood') || rName.includes('military');
  
  const picks = computeThreeDishes(allDishes, isNonVeg);

  // Group by category
  const categories = {};
  for (const d of allDishes) {
    const bucket = getCourseBucket(d.name, d.description, d.category);
    categories[bucket] = (categories[bucket] || 0) + 1;
  }

  console.log(`🏨 Restaurant: "${h.name}" (Total Dishes: ${allDishes.length})`);
  console.log(`   📂 Categories: ${Object.entries(categories).map(([c, n]) => `${c} (${n})`).join(', ')}`);
  console.log(`   ⭐ Top 3 Picks:`);
  picks.forEach((p, i) => {
    console.log(`      ${i+1}. [${getCourseBucket(p.name, p.description, p.category)}] ${p.name} (₹${p.price})`);
  });

  // Verify course diversity (no duplicate buckets)
  const buckets = picks.map(p => getCourseBucket(p.name, p.description, p.category));
  const uniqueBuckets = new Set(buckets);
  if (buckets.length === uniqueBuckets.size) {
    console.log(`   ✅ Course Diversity: PERFECT (3 distinct courses)`);
  } else {
    console.log(`   ⚠️ Course Diversity: Note - ${buckets.join(', ')}`);
  }
  console.log('----------------------------------------------------------------\n');
}
