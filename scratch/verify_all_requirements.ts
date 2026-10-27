import { searchRestaurantsAnywhere } from '../lib/restaurantSearch';
import { generateLiveMenuForRestaurant } from '../lib/liveMenu';
import { isPureVegRestaurantName, isDishVeg } from '../lib/dishAssets';
import { db } from '../lib/db';

async function runVerification() {
  console.log('================================================================');
  console.log('BHOOKASUR KA FOOD TOUR: RESTAURANT SEARCH & MENU VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extraInfo: string = '') {
    if (condition) {
      console.log(`[PASS] ${testName} ${extraInfo}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  // TEST 1: Phadke Dining Hall Search
  console.log('--- 1. RESTAURANT SEARCH ACCURACY ---');
  const t0 = Date.now();
  const res1 = await searchRestaurantsAnywhere('Phadke Dining Hall', { lat: 18.5204, lng: 73.8567 }, { selectedCity: 'Pune' });
  const t1 = Date.now();
  assert(res1.data.length > 0, 'Phadke Dining Hall found in search results', `(${t1 - t0}ms, count: ${res1.data.length})`);
  assert(res1.data[0]?.name.toLowerCase().includes('phadke'), 'Top result is Phadke Dining Hall', `(Got: ${res1.data[0]?.name}, Area: ${res1.data[0]?.area})`);

  // TEST 2: Durvankur Dining Hall Search
  const t2 = Date.now();
  const res2 = await searchRestaurantsAnywhere('Durvankur Dining Hall', { lat: 18.5204, lng: 73.8567 }, { selectedCity: 'Pune' });
  const t3 = Date.now();
  assert(res2.data.length > 0, 'Durvankur Dining Hall found in search results', `(${t3 - t2}ms, count: ${res2.data.length})`);
  assert(res2.data[0]?.name.toLowerCase().includes('durvankur'), 'Top result is Durvankur Dining Hall', `(Got: ${res2.data[0]?.name}, Area: ${res2.data[0]?.area})`);

  // TEST 3: Outside Pune - Mamledar Misal Thane & Prashant Corner Thane
  const resThane = await searchRestaurantsAnywhere('Mamledar Misal Thane', null, { selectedCity: 'Pune' });
  assert(resThane.data.length > 0 && resThane.data.some(r => r.name.toLowerCase().includes('mamledar')), 'Outside location found: Mamledar Misal Thane', `(Got: ${resThane.data[0]?.name}, City: ${resThane.data[0]?.city})`);

  // TEST 4: Auto-correction: "Phadke Dining"
  console.log('\n--- 2. AUTO-CORRECTION & SPELLING VARIATIONS ---');
  const resPhadkePartial = await searchRestaurantsAnywhere('Phadke Dining', { lat: 18.5204, lng: 73.8567 }, { selectedCity: 'Pune' });
  assert(resPhadkePartial.data.length > 0 && resPhadkePartial.data[0]?.name.toLowerCase().includes('phadke'), 'Auto-correction: "Phadke Dining" -> Phadke Dining Hall', `(Top: ${resPhadkePartial.data[0]?.name})`);

  // TEST 5: Auto-correction: "Durvankur Dinning Hall" (misspelling with double 'n')
  const resDurvankurTypo = await searchRestaurantsAnywhere('Durvankur Dinning Hall', { lat: 18.5204, lng: 73.8567 }, { selectedCity: 'Pune' });
  assert(resDurvankurTypo.data.length > 0 && resDurvankurTypo.data[0]?.name.toLowerCase().includes('durvankur'), 'Auto-correction: "Durvankur Dinning Hall" -> Durvankur Dining Hall', `(Top: ${resDurvankurTypo.data[0]?.name})`);

  // TEST 6: Phonetic variation: "Phadkey"
  const resPhadkey = await searchRestaurantsAnywhere('Phadkey', { lat: 18.5204, lng: 73.8567 }, { selectedCity: 'Pune' });
  assert(resPhadkey.data.length > 0 && resPhadkey.data[0]?.name.toLowerCase().includes('phadke'), 'Phonetic variation: "Phadkey" -> Phadke Dining Hall', `(Top: ${resPhadkey.data[0]?.name})`);

  // TEST 7: Phonetic variation: "Durwankur" (w instead of v)
  const resDurwankur = await searchRestaurantsAnywhere('Durwankur', { lat: 18.5204, lng: 73.8567 }, { selectedCity: 'Pune' });
  assert(resDurwankur.data.length > 0 && resDurwankur.data[0]?.name.toLowerCase().includes('durvankur'), 'Phonetic variation: "Durwankur" -> Durvankur Dining Hall', `(Top: ${resDurwankur.data[0]?.name})`);

  // TEST 8: Distinctive token matching: Phadke vs Durvankur
  assert(resPhadkePartial.data[0]?.name.toLowerCase().includes('durvankur') === false, 'Phadke query does NOT falsely match Durvankur despite venue words (dining hall)');

  // TEST 9: Empty search query for non-existent restaurant
  const resRandom = await searchRestaurantsAnywhere('xyzzy_non_existent_joint_9999', { lat: 18.5204, lng: 73.8567 }, { selectedCity: 'Pune' });
  assert(resRandom.data.length === 0, 'Non-existent restaurant returns 0 matches');
  assert(Boolean(resRandom.message && resRandom.message.includes('No matching restaurants found')), 'Displays clear "No matching restaurants found" message', `(Message: ${resRandom.message})`);

  // TEST 10: Live Menu Generation & Authenticity
  console.log('\n--- 3. LIVE MENU GENERATION & PERFORMANCE ---');
  const phadkeRest = res1.data[0];
  const m0 = Date.now();
  const phadkeDishes = generateLiveMenuForRestaurant({
    id: phadkeRest.id,
    name: phadkeRest.name,
    description: phadkeRest.description,
    area: phadkeRest.area,
    city: phadkeRest.city,
    is_veg: phadkeRest.is_veg
  });
  const m1 = Date.now();
  assert(phadkeDishes.length >= 4, 'Phadke Dining Hall menu has authentic dishes', `(${m1 - m0}ms, count: ${phadkeDishes.length})`);
  assert(phadkeDishes.some(d => d.name.toLowerCase().includes('thali')), 'Phadke menu includes authentic Thali');
  assert(phadkeDishes.some(d => d.name.toLowerCase().includes('puran poli')), 'Phadke menu includes authentic Puran Poli');
  
  // Verify Pure Veg integrity
  const hasNonVeg = phadkeDishes.some(d => d.is_veg === 0 || !isDishVeg(d.name));
  assert(!hasNonVeg, 'Phadke Dining Hall (pure veg landmark) has ZERO non-veg dishes');

  // TEST 11: Durvankur Menu Authenticity
  const durvankurRest = res2.data[0];
  const durvankurDishes = generateLiveMenuForRestaurant({
    id: durvankurRest.id,
    name: durvankurRest.name,
    description: durvankurRest.description,
    area: durvankurRest.area,
    city: durvankurRest.city,
    is_veg: durvankurRest.is_veg
  });
  assert(durvankurDishes.length >= 4, 'Durvankur Dining Hall menu has authentic dishes', `(count: ${durvankurDishes.length})`);
  assert(durvankurDishes.some(d => d.name.toLowerCase().includes('thali')), 'Durvankur menu includes authentic Thali');
  const durvankurNonVeg = durvankurDishes.some(d => d.is_veg === 0 || !isDishVeg(d.name));
  assert(!durvankurNonVeg, 'Durvankur Dining Hall has ZERO non-veg dishes');

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
