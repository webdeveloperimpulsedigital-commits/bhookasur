const { verifySwiggyRestaurant } = require('./lib/verifiedRestaurants');

async function check() {
  const result = await verifySwiggyRestaurant('326931', { lat: 18.5204, lng: 73.8567 });
  console.log('Verified:', result.verified);
  if (result.verified) {
    console.log('Profile name:', result.profile.name);
    console.log('Dishes count:', result.profile.dishes.length);
    console.log('\nSample dishes with bestseller / recommended / ratings:');
    result.profile.dishes.slice(0, 10).forEach(d => {
      console.log({
        name: d.name,
        price: d.price,
        rating: d.rating,
        popularity: d.popularity,
        is_recommended: d.is_recommended,
        is_bestseller: d.is_bestseller,
        rating_count: d.rating_count,
        category: d.category,
        image: d.image ? d.image.slice(0, 50) + '...' : 'none'
      });
    });
  }
}

check().catch(console.error);
