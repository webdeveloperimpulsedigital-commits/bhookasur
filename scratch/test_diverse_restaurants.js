const testRestaurants = [
  { name: 'Chinese Wok' },
  { name: 'Vaishali' },
  { name: 'Poona Guest House' },
  { name: 'Gajanan Vadapav' },
  { name: 'Katakirr' },
  { name: 'Sujata Mastani' },
  { name: 'Burger King' }
];

async function checkRest(rQuery) {
  const searchRes = await fetch(`http://localhost:3000/api/restaurants/search?q=${encodeURIComponent(rQuery.name)}`);
  const searchJson = await searchRes.json();
  if (!searchJson.data || searchJson.data.length === 0) {
    console.log(`[${rQuery.name}] Not found in search.`);
    return;
  }
  const r = searchJson.data[0];
  console.log(`\n=== [${r.name}] (ID: ${r.id}, City: ${r.city}, VegOnly: ${r.is_veg}) ===`);
  
  const dishRes = await fetch(`http://localhost:3000/api/restaurants/${r.id}/dishes`);
  const dishJson = await dishRes.json();
  console.log(`Total dishes: ${dishJson.count} (Source: ${dishJson.source})`);
  if (dishJson.count === 0) {
    console.log('No dishes available.');
    return;
  }
  console.log('Sample first 3 raw:');
  dishJson.data.slice(0, 3).forEach(d => {
    console.log(`  - ${d.name} (Veg: ${d.is_veg}, Rating: ${d.rating}, Pop: ${d.popularity}, Rec: ${d.is_recommended}, Cat: ${d.category}, Bestseller: ${d.is_bestseller})`);
  });
}

async function main() {
  for (const tr of testRestaurants) {
    await checkRest(tr);
  }
}

main().catch(console.error);
