async function test() {
  const res = await fetch('http://localhost:3000/api/restaurants/326931/dishes');
  const json = await res.json();
  console.log('Total dishes:', json.count);
  console.log('Categories:', json.categories);
  
  console.log('\nDishes with is_bestseller = true:');
  const bestsellers = json.data.filter(d => d.is_bestseller);
  bestsellers.forEach(d => {
    console.log(`- ${d.name} | Veg: ${d.is_veg} | Rating: ${d.rating} | Count: ${d.rating_count} | Cat: ${d.category}`);
  });

  console.log('\nDishes with is_recommended = 1:');
  const recommended = json.data.filter(d => d.is_recommended === 1);
  console.log(`Count of recommended: ${recommended.length}`);
  recommended.slice(0, 10).forEach(d => {
    console.log(`- ${d.name} | Veg: ${d.is_veg} | Rating: ${d.rating} | Count: ${d.rating_count} | Cat: ${d.category} | Bestseller: ${d.is_bestseller}`);
  });

  console.log('\nDrinks / Beverages:');
  const drinks = json.data.filter(d => 
    d.category.toLowerCase().includes('drink') || 
    d.category.toLowerCase().includes('beverage') ||
    d.name.toLowerCase().includes('tea') ||
    d.name.toLowerCase().includes('water')
  );
  drinks.forEach(d => {
    console.log(`- ${d.name} | Rating: ${d.rating} | Cat: ${d.category}`);
  });
}

test().catch(console.error);
