async function test() {
  const res = await fetch('http://localhost:3000/api/restaurants/search?q=Chinese+Wok');
  console.log('Status:', res.status, res.headers.get('content-type'));
  const data = await res.json();
  console.log('Search count:', data.count);
  const cw = data.data.find(r => r.name.toLowerCase().includes('chinese wok')) || data.data[0];
  console.log('Found restaurant:', cw ? { id: cw.id, name: cw.name, area: cw.area, city: cw.city } : null);
  
  if (cw) {
    const dishRes = await fetch(`http://localhost:3000/api/restaurants/${cw.id}/dishes`);
    const dishData = await dishRes.json();
    console.log('Dishes count:', dishData.count);
    console.log('\nTop 20 dishes in raw order:');
    dishData.data.slice(0, 20).forEach((d, i) => {
      console.log(`[${i+1}] ${d.name} | Veg: ${d.is_veg} | Rating: ${d.rating} | Pop: ${d.popularity} | Rec: ${d.is_recommended} | Cat: ${d.category} | Bestseller: ${d.is_bestseller}`);
    });

    console.log('\nSorted by rating:');
    const sortedByRating = [...dishData.data].sort((a,b) => (b.rating||0) - (a.rating||0));
    sortedByRating.slice(0, 15).forEach((d, i) => {
      console.log(`[${i+1}] ${d.name} | Veg: ${d.is_veg} | Rating: ${d.rating} | Rec: ${d.is_recommended} | Cat: ${d.category} | Bestseller: ${d.is_bestseller}`);
    });
  }
}

test().catch(console.error);
