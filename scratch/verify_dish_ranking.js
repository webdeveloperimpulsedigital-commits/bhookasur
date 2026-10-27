const { selectTopRestaurantDishes } = require('./lib/dishRanking');

async function test() {
  const ids = [
    { name: 'Chinese Wok', id: 326931 },
    { name: 'Vaishali Restaurant', id: 8 },
    { name: 'Poona Guest House', id: 65 },
    { name: 'Joshi wadewale', id: 32 },
    { name: 'Katakirrr Misal', id: 395863 },
    { name: 'Sujata Mastani', id: 22501 },
    { name: 'Burger King', id: 42581 }
  ];

  for (const item of ids) {
    const res = await fetch(`http://localhost:3000/api/restaurants/${item.id}/dishes`);
    const json = await res.json();
    const top3 = selectTopRestaurantDishes(json.data, { name: item.name }, 3);
    console.log(`\n========================================`);
    console.log(`TOP 3 FOR: ${item.name} (${json.count} total dishes)`);
    console.log(`========================================`);
    top3.forEach((d, idx) => {
      console.log(`  [${idx + 1}] ${d.name} | Rating: ${d.rating} | Veg: ${d.is_veg} | Cat: ${d.category} | Bestseller: ${d.is_bestseller}`);
    });
  }
}

test().catch(console.error);
