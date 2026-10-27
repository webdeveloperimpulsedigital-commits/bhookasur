import http from 'http';
import { GET as searchGET } from '../app/api/restaurants/search/route';
import { GET as dishesGET } from '../app/api/restaurants/[id]/dishes/route';

async function testApiEndpoints() {
  console.log('--- Testing API Route Handlers directly ---');

  // 1. Search Phadke Dining
  const req1 = new Request('http://localhost:3000/api/restaurants/search?q=Phadke+Dining&city=Pune');
  const res1 = await searchGET(req1);
  const data1 = await res1.json();
  console.log('Search "Phadke Dining": count =', data1.count, 'top =', data1.data[0]?.name);

  // 2. Search Durvankur Dinning Hall
  const req2 = new Request('http://localhost:3000/api/restaurants/search?q=Durvankur+Dinning+Hall&city=Pune');
  const res2 = await searchGET(req2);
  const data2 = await res2.json();
  console.log('Search "Durvankur Dinning Hall": count =', data2.count, 'top =', data2.data[0]?.name);

  // 3. Search Phadkey
  const req3 = new Request('http://localhost:3000/api/restaurants/search?q=Phadkey&city=Pune');
  const res3 = await searchGET(req3);
  const data3 = await res3.json();
  console.log('Search "Phadkey": count =', data3.count, 'top =', data3.data[0]?.name);

  // 4. Search Nonexistent
  const req4 = new Request('http://localhost:3000/api/restaurants/search?q=no_such_restaurant_12345&city=Pune');
  const res4 = await searchGET(req4);
  const data4 = await res4.json();
  console.log('Search Nonexistent: count =', data4.count, 'message =', data4.message);

  // 5. Dishes for Phadke
  const phadkeId = String(data1.data[0]?.id || 850001);
  const t0 = Date.now();
  const reqDishes1 = new Request(`http://localhost:3000/api/restaurants/${phadkeId}/dishes?name=Phadke+Dining+Hall&area=Sadashiv+Peth&city=Pune&is_veg=1`);
  const resDishes1 = await dishesGET(reqDishes1, { params: Promise.resolve({ id: phadkeId }) });
  const dishesData1 = await resDishes1.json();
  const t1 = Date.now();
  console.log(`Dishes for Phadke (${phadkeId}): count =`, dishesData1.count, `time = ${t1 - t0}ms`);
  console.log('Dishes sample:', dishesData1.data?.slice(0, 3).map((d: any) => d.name));

  // 6. Dishes for Phadke (Cached)
  const t2 = Date.now();
  const resDishesCached = await dishesGET(reqDishes1, { params: Promise.resolve({ id: phadkeId }) });
  const dishesDataCached = await resDishesCached.json();
  const t3 = Date.now();
  console.log(`Dishes for Phadke (Cached): count =`, dishesDataCached.count, `time = ${t3 - t2}ms`);

  // 7. Dishes for Durvankur
  const durvankurId = String(data2.data[0]?.id || 850002);
  const reqDishes2 = new Request(`http://localhost:3000/api/restaurants/${durvankurId}/dishes?name=Durvankur+Dining+Hall&area=Sadashiv+Peth&city=Pune&is_veg=1`);
  const resDishes2 = await dishesGET(reqDishes2, { params: Promise.resolve({ id: durvankurId }) });
  const dishesData2 = await resDishes2.json();
  console.log(`Dishes for Durvankur (${durvankurId}): count =`, dishesData2.count);
  console.log('Durvankur dishes sample:', dishesData2.data?.slice(0, 3).map((d: any) => d.name));

  if (
    data1.data[0]?.name.toLowerCase().includes('phadke') &&
    data2.data[0]?.name.toLowerCase().includes('durvankur') &&
    data3.data[0]?.name.toLowerCase().includes('phadke') &&
    data4.count === 0 &&
    dishesData1.count >= 4 &&
    dishesDataCached.count >= 4 &&
    t3 - t2 < 10
  ) {
    console.log('\n>>> ALL API ROUTE TESTS PASSED SUCCESSFULLY! <<<');
    process.exit(0);
  } else {
    console.error('\n>>> SOME CHECKS FAILED <<<');
    process.exit(1);
  }
}

testApiEndpoints().catch(err => {
  console.error('API test failed:', err);
  process.exit(1);
});
