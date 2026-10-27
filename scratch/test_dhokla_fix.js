const http = require('http');

async function testDish(dish, restaurant) {
  const url = `http://localhost:3000/bhookasur_ka_food_tour/api/ai/dish-image?dish=${encodeURIComponent(dish)}&restaurant=${encodeURIComponent(restaurant)}&v=v47`;
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'],
          canonicalKey: res.headers['x-canonical-key'],
          dishHeader: res.headers['x-food-dish'],
          size: buffer.length
        });
      });
    }).on('error', reject);
  });
}

async function run() {
  const tests = [
    { dish: 'Plain Dhokla', restaurant: 'Prashant Corner' },
    { dish: 'White Dhokla', restaurant: 'Prashant Corner' },
    { dish: 'Khaman Dhokla', restaurant: 'Prashant Corner' },
    { dish: 'Khatta Dhokla', restaurant: 'Prashant Corner' },
    { dish: 'Jelly Strawberry (Kg)', restaurant: 'Prashant Corner' },
    { dish: 'Rasgulla (4 Nos)', restaurant: 'Prashant Corner' },
    { dish: 'Anjeer Pista Chakra (Kg)', restaurant: 'Prashant Corner' },
    { dish: 'Fafda', restaurant: 'Prashant Corner' },
    { dish: 'Khandvi', restaurant: 'Prashant Corner' },
    { dish: 'Samosa', restaurant: 'Prashant Corner' },
    { dish: 'Random Farsan Item', restaurant: 'Prashant Corner' },
    { dish: 'Random Unknown Mithai', restaurant: 'Chitale Bandhu Mithaiwale' },
    { dish: 'Special Cafe Coffee', restaurant: 'Cafe Goodluck' },
    { dish: 'Special Burger', restaurant: 'Burger King' }
  ];

  console.log('Testing Dish Image API endpoint responses...');
  for (const t of tests) {
    try {
      const res = await testDish(t.dish, t.restaurant);
      console.log(`[${res.status}] "${t.dish}" @ "${t.restaurant}" -> CanonicalKey: "${res.canonicalKey}", Content-Type: ${res.contentType}, Bytes: ${res.size}`);
    } catch (err) {
      console.error(`Error testing "${t.dish}":`, err.message);
    }
  }
}

run();
