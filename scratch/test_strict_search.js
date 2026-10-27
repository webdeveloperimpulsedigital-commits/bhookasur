const { isDishRelevantToSearch } = require('../lib/dishAssets');
const { searchDishesSwiggyZomato } = require('../lib/foodSearchEngine');
const { generateLiveMenuForRestaurant } = require('../lib/liveMenu');

const joshiWadewale = {
  id: 101,
  name: "Joshi Wadewale",
  area: "Shivaji Nagar",
  city: "Pune",
  is_veg: 1
};

const sardarPavBhaji = {
  id: 102,
  name: "Sardar Pav Bhaji",
  area: "Tardeo",
  city: "Mumbai",
  is_veg: 1
};

console.log('=== TEST 1: isDishRelevantToSearch function ===');

const testCases = [
  // Query, DishName, Expected
  ['Pav bhaji', 'Special Amul Butter Pav Bhaji', true],
  ['Pav bhaji', 'Sardar Special Cheese Pav Bhaji', true],
  ['Pav bhaji', 'Double Butter Masala Pav', false],
  ['Pav bhaji', 'Mumbai Street Style Tawa Pulao', false],
  ['Pav bhaji', 'Ragda Pattice Platter', false],
  ['Pav bhaji', 'Royal Mango Kulfi Falooda', false],
  ['Pav bhaji', 'Joshi Special Vada Pav', false],

  ['Cheese Pav Bhaji', 'Sardar Special Cheese Pav Bhaji', true],
  ['Cheese Pav Bhaji', 'Special Amul Butter Pav Bhaji', false],

  ['Masala Pav', 'Double Butter Masala Pav', true],
  ['Masala Pav', 'Special Amul Butter Pav Bhaji', false],

  ['Vada Pav', 'Joshi Special Vada Pav', true],
  ['Vada Pav', 'Special Legendary Vada Pav (2 Pcs)', true],
  ['Vada Pav', 'Chilled Shahi Piyush Glass', false],
  ['Vada Pav', 'Crunchy Kanda Bhaji (Khekda Bhajiya)', false],

  ['Ragda Pattice', 'Ragda Pattice Platter', true],
  ['Ragda Pattice', 'Special Ragda Puri', false],

  ['Ragda Puri', 'Special Ragda Puri', true],
  ['Ragda Puri', 'Ragda Pattice Platter', false],
  ['Ragda Puri', 'Special Pani Puri', false],

  ['Pani Puri', 'Special Pani Puri', true],
  ['Pani Puri', 'Special Ragda Puri', false],

  ['Batata Bhaji', 'Authentic Batata Bhaji', true],
  ['Batata Bhaji', 'Puri Bhaji Plate', false],
  ['Batata Bhaji', 'Crunchy Kanda Bhaji (Khekda Bhajiya)', false],

  ['Kanda Bhaji', 'Crunchy Kanda Bhaji (Khekda Bhajiya)', true],
  ['Kanda Bhaji', 'Authentic Batata Bhaji', false]
];

let failed = 0;
for (const [q, d, expected] of testCases) {
  const actual = isDishRelevantToSearch(d, q);
  if (actual !== expected) {
    console.error(`FAIL: query="${q}", dish="${d}". Expected=${expected}, Actual=${actual}`);
    failed++;
  } else {
    console.log(`PASS: query="${q}" -> dish="${d}" => ${actual}`);
  }
}

console.log(`\nisDishRelevantToSearch Tests: ${testCases.length - failed}/${testCases.length} passed.`);

console.log('\n=== TEST 2: searchDishesSwiggyZomato at Joshi Wadewale for "Pav bhaji" ===');
const joshiDishes = generateLiveMenuForRestaurant(joshiWadewale);
console.log('Joshi menu items count:', joshiDishes.length);
const pavBhajiAtJoshi = searchDishesSwiggyZomato(joshiWadewale, 'Pav bhaji', joshiDishes);
console.log('Result for "Pav bhaji" at Joshi Wadewale:', pavBhajiAtJoshi.map(d => d.name));
if (pavBhajiAtJoshi.length === 0) {
  console.log('PASS: Correctly returned 0 dishes! UI will display "Menu not available for this dish at this restaurant."');
} else {
  console.error('FAIL: Should have returned 0 dishes for Pav bhaji at Joshi Wadewale');
}

console.log('\n=== TEST 3: searchDishesSwiggyZomato at Joshi Wadewale for "Vada pav" ===');
const vadaPavAtJoshi = searchDishesSwiggyZomato(joshiWadewale, 'Vada pav', joshiDishes);
console.log('Result for "Vada pav" at Joshi Wadewale:', vadaPavAtJoshi.map(d => d.name));

console.log('\n=== TEST 4: searchDishesSwiggyZomato at Sardar Pav Bhaji for "Pav bhaji" ===');
const sardarDishes = generateLiveMenuForRestaurant(sardarPavBhaji);
const pavBhajiAtSardar = searchDishesSwiggyZomato(sardarPavBhaji, 'Pav bhaji', sardarDishes);
console.log('Result for "Pav bhaji" at Sardar Pav Bhaji:', pavBhajiAtSardar.map(d => d.name));
