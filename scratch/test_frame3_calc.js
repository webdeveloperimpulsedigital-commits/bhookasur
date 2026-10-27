const { generateLiveMenuForRestaurant } = require('../lib/liveMenu');
const { isDishVeg } = require('../lib/dishAssets');

const testNames = [
  'Hotel Shivraj',
  'Hotel Sarovar',
  'Hotel Green Park',
  'George Restaurant',
  'Hotel Panchali',
  'Temptation Bar & Restaurant'
];

for (const name of testNames) {
  const restaurant = { id: 101, name, city: 'Pune', is_veg: 0 };
  const rName = restaurant.name.toLowerCase();
  
  const isNonVegRestaurant = rName.includes('non-veg') ||
    rName.includes('non veg') ||
    rName.includes('nonveg') ||
    rName.includes('mutton') ||
    rName.includes('chicken') ||
    rName.includes('meat') ||
    rName.includes('fish') ||
    rName.includes('seafood') ||
    rName.includes('prawn') ||
    rName.includes('crab') ||
    rName.includes('military') ||
    rName.includes('biryani') ||
    rName.includes('kebab') ||
    rName.includes('kabab') ||
    rName.includes('bar') ||
    rName.includes('pub') ||
    rName.includes('permit room');

  const allDishes = generateLiveMenuForRestaurant(restaurant);
  
  // Replicating Frame3DishSelection threeDishes:
  let candidates = allDishes;
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

  const top3 = sorted.slice(0, 3);
  console.log(`=== ${name} (isNonVeg=${isNonVegRestaurant}) ===`);
  console.log('Top 3 displayed cards:');
  top3.forEach((d, i) => console.log(`  ${i+1}. ${d.name} (rating=${d.rating}, pop=${d.popularity})`));
  console.log('');
}
