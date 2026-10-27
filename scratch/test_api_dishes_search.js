async function testApiDishesSearch() {
  // Test 1: Joshi Wadewale for Pav Bhaji
  const res1 = await fetch('http://localhost:3000/api/restaurants/1/dishes?name=Joshi%20Wadewale&q=Pav%20bhaji');
  const json1 = await res1.json();
  console.log('Test 1: Joshi Wadewale for Pav bhaji:');
  console.log(' - count:', json1.data ? json1.data.length : 'none');
  console.log(' - items:', json1.data ? json1.data.map(d => d.name) : json1);

  // Test 2: Joshi Wadewale for Vada pav
  const res2 = await fetch('http://localhost:3000/api/restaurants/1/dishes?name=Joshi%20Wadewale&q=Vada%20pav');
  const json2 = await res2.json();
  console.log('\nTest 2: Joshi Wadewale for Vada pav:');
  console.log(' - count:', json2.data ? json2.data.length : 'none');
  console.log(' - items:', json2.data ? json2.data.map(d => d.name) : json2);

  // Test 3: Sardar Pav Bhaji for Pav bhaji
  const res3 = await fetch('http://localhost:3000/api/restaurants/50/dishes?name=Sardar%20Pav%20Bhaji&q=Pav%20bhaji');
  const json3 = await res3.json();
  console.log('\nTest 3: Sardar Pav Bhaji for Pav bhaji:');
  console.log(' - count:', json3.data ? json3.data.length : 'none');
  console.log(' - items:', json3.data ? json3.data.map(d => d.name) : json3);
}

testApiDishesSearch();
