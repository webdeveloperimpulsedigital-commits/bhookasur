const path = require('path');
const { selectTopRestaurantDishes } = require(path.join(__dirname, '../lib/dishRanking'));

async function testTopDishes() {
  console.log('====================================================');
  console.log('TESTING RESTAURANT-SPECIFIC TOP 3 DISHES SELECTION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Chinese Wok (Live Swiggy restaurant ID 326931)
  console.log('1. Testing Chinese Wok Top 3 Dishes:');
  const cwRes = await fetch('http://localhost:3000/api/restaurants/326931/dishes');
  const cwData = await cwRes.json();
  const cwTop3 = selectTopRestaurantDishes(cwData.data, { name: 'Chinese Wok' }, 3);
  const cwTopNames = cwTop3.map(d => d.name.toLowerCase());
  
  console.log('   Top 3 Selected for Chinese Wok:', cwTop3.map(d => d.name));
  assert(cwTop3.length === 3, 'Selected exactly 3 dishes');
  assert(!cwTopNames.some(n => n.includes('ice tea') || n.includes('peach') || n.includes('lemon ice')), 'No iced teas in top 3 dishes for Chinese Wok');
  assert(!cwTopNames.some(n => n.includes('chutney') || n.includes('water')), 'No condiments/water in top 3 dishes for Chinese Wok');
  assert(cwTopNames.some(n => n.includes('noodle') || n.includes('hakka')), 'Includes Hakka Noodles in top 3');
  assert(cwTopNames.some(n => n.includes('rice') || n.includes('fried rice')), 'Includes Fried Rice in top 3');

  // 2. Vaishali Restaurant (FC Road Pune, ID 8)
  console.log('\n2. Testing Vaishali Top 3 Dishes:');
  const vRes = await fetch('http://localhost:3000/api/restaurants/8/dishes');
  const vData = await vRes.json();
  const vTop3 = selectTopRestaurantDishes(vData.data, { name: 'Vaishali Restaurant' }, 3);
  const vTopNames = vTop3.map(d => d.name.toLowerCase());
  
  console.log('   Top 3 Selected for Vaishali:', vTop3.map(d => d.name));
  assert(vTop3.length === 3, 'Selected exactly 3 dishes');
  assert(vTopNames.some(n => n.includes('tomato omelette')), 'Includes Vaishali iconic Tomato Omelette');
  assert(vTopNames.some(n => n.includes('dosa')), 'Includes Vaishali iconic Dosa');

  // 3. Poona Guest House (Heritage Maharashtrian, ID 65)
  console.log('\n3. Testing Poona Guest House Top 3 Dishes:');
  const pghRes = await fetch('http://localhost:3000/api/restaurants/65/dishes');
  const pghData = await pghRes.json();
  const pghTop3 = selectTopRestaurantDishes(pghData.data, { name: 'Poona Guest House' }, 3);
  const pghTopNames = pghTop3.map(d => d.name.toLowerCase());
  
  console.log('   Top 3 Selected for Poona Guest House:', pghTop3.map(d => d.name));
  assert(pghTop3.length === 3, 'Selected exactly 3 dishes');
  assert(pghTopNames.some(n => n.includes('thali')), 'Includes Traditional Maharashtrian Thali');
  assert(pghTopNames.some(n => n.includes('puran poli')), 'Includes Special Puran Poli Thali');

  // 4. Sujata Mastani (Beverage/Dessert specialty, ID 22501)
  console.log('\n4. Testing Sujata Mastani Top 3 Dishes:');
  const smRes = await fetch('http://localhost:3000/api/restaurants/22501/dishes');
  const smData = await smRes.json();
  const smTop3 = selectTopRestaurantDishes(smData.data, { name: 'Sujata Mastani' }, 3);
  const smTopNames = smTop3.map(d => d.name.toLowerCase());
  
  console.log('   Top 3 Selected for Sujata Mastani:', smTop3.map(d => d.name));
  assert(smTop3.length === 3, 'Selected exactly 3 dishes');
  assert(smTopNames.every(n => n.includes('mastani')), 'All top 3 dishes are Mastanis for Sujata Mastani');

  // 5. Handling Missing Data (1 or 2 dishes)
  console.log('\n5. Testing Handling of Missing Data / Small Menus:');
  const singleDish = [{ id: 101, name: 'Special Misal Pav', rating: 4.8, popularity: 95, is_recommended: 1, is_veg: 1 }];
  const topSingle = selectTopRestaurantDishes(singleDish, { name: 'Local Stall' }, 3);
  assert(topSingle.length === 1, 'Only 1 dish returned when only 1 dish verified (no fake padding)');

  const twoDishes = [
    { id: 101, name: 'Vada Pav', rating: 4.8, popularity: 95, is_recommended: 1, is_veg: 1 },
    { id: 102, name: 'Samosa Pav', rating: 4.6, popularity: 90, is_recommended: 0, is_veg: 1 }
  ];
  const topTwo = selectTopRestaurantDishes(twoDishes, { name: 'Katta' }, 3);
  assert(topTwo.length === 2, 'Only 2 dishes returned when only 2 dishes verified (no fake padding)');

  const emptyMenu = [];
  const topEmpty = selectTopRestaurantDishes(emptyMenu, { name: 'Empty Joint' }, 3);
  assert(topEmpty.length === 0, '0 dishes returned when menu empty');

  // 6. Dynamic Switching Test
  console.log('\n6. Testing Dynamic Switching Between Restaurants:');
  const cwTopIds = new Set(cwTop3.map(d => d.id));
  const vTopIds = new Set(vTop3.map(d => d.id));
  const overlap = [...cwTopIds].filter(id => vTopIds.has(id));
  assert(overlap.length === 0, 'Zero overlap between Chinese Wok dishes and Vaishali dishes (fully dynamic)');

  console.log(`\n====================================================`);
  console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) process.exit(1);
}

testTopDishes().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
