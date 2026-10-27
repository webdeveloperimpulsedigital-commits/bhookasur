async function test() {
  const tests = [
    { name: 'Rohit Wadewale', city: 'Pune' },
    { name: 'Joshi Wadewale', city: 'Pune' },
    { name: 'Vaishali', city: 'Pune' },
    { name: 'Maratha Samrat', city: 'Pune' },
    { name: 'NonExistentSpotXYZ123', city: 'Pune' }
  ];

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const url = `http://localhost:3000/api/restaurants/${i + 10}/dishes?name=${encodeURIComponent(t.name)}&city=${encodeURIComponent(t.city)}`;
    console.log(`\nFetching: ${t.name} from ${url}`);
    const start = Date.now();
    try {
      const res = await fetch(url);
      const json = await res.json();
      console.log(`Status: ${res.status}, Time: ${Date.now() - start}ms`);
      console.log(`Source: ${json.source}, Count: ${json.count}`);
      if (json.data && json.data.length > 0) {
        console.log('Top 4 dishes:', json.data.slice(0, 4).map(d => `${d.name} (₹${d.price})`));
      } else {
        console.log('Result: MENU NOT AVAILABLE (0 dishes)');
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
    }
  }
}

test();
