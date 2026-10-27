const { generateLiveMenuForRestaurant, getInitialDishes } = require('../lib/liveMenu');
const { INITIAL_RESTAURANTS } = require('../lib/db');

console.log('Testing restaurants in INITIAL_RESTAURANTS and sample hotel names:\n');

const testNames = [
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

for (const name of testNames) {
  const rest = { id: 101, name, city: 'Pune', is_veg: 0 };
  const dishes = generateLiveMenuForRestaurant(rest);
  const dishNames = dishes.map(d => d.name);
  console.log(`=== ${name} (${dishes.length} dishes) ===`);
  console.log('Dishes:', dishNames.slice(0, 8).join(', ') + '...');
  const hasPulav = dishNames.filter(n => n.toLowerCase().includes('pulao') || n.toLowerCase().includes('pulav'));
  console.log('Pulao/Pulav items:', hasPulav);
  console.log('');
}
