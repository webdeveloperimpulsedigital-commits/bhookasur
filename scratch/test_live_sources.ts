async function testLivePlaces() {
  const queries = [
    { q: 'Phadke Dining Hall', city: 'Pune', lat: 18.5204, lng: 73.8567 },
    { q: 'Durvankur Dining Hall', city: 'Pune', lat: 18.5204, lng: 73.8567 },
    { q: 'Phadke Dining', city: 'Pune', lat: 18.5204, lng: 73.8567 },
    { q: 'Badshahi Boarding', city: 'Pune', lat: 18.5204, lng: 73.8567 },
    { q: 'Prashant Corner Thane', city: 'Thane', lat: 19.186, lng: 72.975 },
    { q: 'Vidyarthi Bhavan', city: 'Bengaluru', lat: 12.943, lng: 77.57 }
  ];

  for (const item of queries) {
    console.log(`\n=== Testing for: "${item.q}" (${item.city}) ===`);
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(item.q)}&lat=${item.lat}&lon=${item.lng}&limit=5`;
    const t0 = Date.now();
    try {
      const res = await fetch(photonUrl, { headers: { 'User-Agent': 'BhookasurApp/3.0' } });
      const json = await res.json();
      console.log(`Photon (${Date.now() - t0}ms) results:`, json.features?.length);
      for (const f of json.features || []) {
        console.log(`  * ${f.properties.name} - ${f.properties.street || ''}, ${f.properties.suburb || f.properties.district || ''}, ${f.properties.city || f.properties.state || ''} [${f.geometry.coordinates}]`);
      }
    } catch (e: unknown) {
      console.error('Photon error:', (e as Error).message);
    }
  }
}

testLivePlaces();
