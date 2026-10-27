const { fetchSwiggyDishesViaApify } = require('../lib/apifySwiggy');

async function testAll() {
  const spots = [
    'Rohit Wadewale',
    'Vaishali',
    'KataKirr',
    'Maratha Samrat',
    'Irani Cafe',
    'Cafe Goodluck',
    'NonExistentXYZ999'
  ];

  for (const s of spots) {
    console.log(`\n--- Fetching live menu for: ${s} ---`);
    try {
      const dishes = await fetchSwiggyDishesViaApify(s, 'pune', { lat: 18.5204, lng: 73.8407 });
      console.log(`${s} dishes count: ${dishes.length}`);
      if (dishes.length > 0) {
        console.log('Sample:', dishes.slice(0, 4).map(d => `${d.name} (₹${d.price}, veg:${d.is_veg})`));
      } else {
        console.log(`${s}: NO MENU AVAILABLE!`);
      }
    } catch (err) {
      console.error(`Error for ${s}:`, err.message);
    }
  }
}

testAll();
