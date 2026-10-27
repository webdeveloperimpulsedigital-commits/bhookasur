const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data.substring(0, 200) });
        }
      });
    }).on('error', reject);
  });
}

function fetchDishImage(dish) {
  return new Promise((resolve) => {
    const url = `http://localhost:3000/api/ai/dish-image?dish=${encodeURIComponent(dish)}`;
    http.get(url, (res) => {
      let bytes = 0;
      res.on('data', chunk => bytes += chunk.length);
      res.on('end', () => {
        resolve({
          dish,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          bytes,
          canonicalKey: res.headers['x-canonical-key']
        });
      });
    }).on('error', (err) => {
      resolve({ dish, status: 500, error: err.message });
    });
  });
}

async function runTests() {
  console.log('=== 1. VERIFYING DYNAMIC RESTAURANT MENUS ===');
  // 1. Relax Pure Veg
  const relaxRes = await fetchJson('http://localhost:3000/api/restaurants/862843/dishes?name=Relax+Pure+Veg');
  console.log(`[Relax Pure Veg] Count: ${relaxRes.body?.data?.length || 0}`);
  console.log('  Top 4 items:', relaxRes.body?.data?.slice(0, 4).map(d => `${d.name} (${d.category})`));

  // 2. Good Flippin Burgers
  const burgerRes = await fetchJson('http://localhost:3000/api/restaurants/777002/dishes?name=Good+Flippin+Burgers');
  console.log(`[Good Flippin Burgers] Count: ${burgerRes.body?.data?.length || 0}`);
  console.log('  Top 4 items:', burgerRes.body?.data?.slice(0, 4).map(d => `${d.name} (${d.category})`));

  // 3. Hotel Jagdamb
  const jagdambRes = await fetchJson('http://localhost:3000/api/restaurants/1/dishes?name=Hotel+Jagdamb&is_veg=0');
  console.log(`[Hotel Jagdamb] Count: ${jagdambRes.body?.data?.length || 0}`);
  console.log('  Top 4 items:', jagdambRes.body?.data?.slice(0, 4).map(d => `${d.name} (${d.category})`));

  // 4. Vaishali FC Road
  const vaishaliRes = await fetchJson('http://localhost:3000/api/restaurants/777003/dishes?name=Vaishali+FC+Road');
  console.log(`[Vaishali FC Road] Count: ${vaishaliRes.body?.data?.length || 0}`);
  console.log('  Top 4 items:', vaishaliRes.body?.data?.slice(0, 4).map(d => `${d.name} (${d.category})`));

  // 5. Sujata Mastani
  const sujataRes = await fetchJson('http://localhost:3000/api/restaurants/777004/dishes?name=Sujata+Mastani');
  console.log(`[Sujata Mastani] Count: ${sujataRes.body?.data?.length || 0}`);
  console.log('  Top 4 items:', sujataRes.body?.data?.slice(0, 4).map(d => `${d.name} (${d.category})`));

  console.log('\n=== 2. VERIFYING DYNAMIC SEARCH VARIETY ===');
  // Pulao search returns multiple varieties, not just 2
  const pulaoSearch = await fetchJson('http://localhost:3000/api/restaurants/862843/dishes?name=Relax+Pure+Veg&q=pulav');
  console.log(`[Search "pulav" on Relax] Count: ${pulaoSearch.body?.data?.length || 0}`);
  pulaoSearch.body?.data?.forEach(d => console.log(`  - ${d.name} (Rs ${d.price})`));

  // Biryani / Mutton search
  const muttonSearch = await fetchJson('http://localhost:3000/api/restaurants/1/dishes?name=Hotel+Jagdamb&q=mutton');
  console.log(`[Search "mutton" on Jagdamb] Count: ${muttonSearch.body?.data?.length || 0}`);
  muttonSearch.body?.data?.forEach(d => console.log(`  - ${d.name} (Rs ${d.price})`));

  console.log('\n=== 3. VERIFYING FOOD IMAGE COVERAGE FOR 15 CATEGORIES ===');
  const sampleDishes = [
    { cat: '1. Indian Street Food', dish: 'Pav Bhaji' },
    { cat: '1. Indian Street Food', dish: 'Pani Puri' },
    { cat: '2. Indian Main Course', dish: 'Paneer Butter Masala' },
    { cat: '2. Indian Main Course', dish: 'Butter Chicken' },
    { cat: '3. Rice, Biryani & Pulao', dish: 'Veg Biryani' },
    { cat: '3. Rice, Biryani & Pulao', dish: 'Chicken Biryani' },
    { cat: '3. Rice, Biryani & Pulao', dish: 'Tawa Pulao' },
    { cat: '4. Chinese & Indo-Chinese', dish: 'Veg Hakka Noodles' },
    { cat: '4. Chinese & Indo-Chinese', dish: 'Chilli Chicken' },
    { cat: '5. South Indian', dish: 'Mysore Masala Dosa' },
    { cat: '5. South Indian', dish: 'Medu Vada' },
    { cat: '6. North Indian & Breads', dish: 'Butter Garlic Naan' },
    { cat: '6. North Indian & Breads', dish: 'Aloo Paratha' },
    { cat: '7. Pizza, Pasta & Italian', dish: 'Margherita Pizza' },
    { cat: '7. Pizza, Pasta & Italian', dish: 'White Sauce Pasta' },
    { cat: '8. Burgers & Fast Food', dish: 'Crispy Chicken Burger' },
    { cat: '8. Burgers & Fast Food', dish: 'Veg Grilled Sandwich' },
    { cat: '9. Breakfast & Brunch', dish: 'Bread Omelette' },
    { cat: '9. Breakfast & Brunch', dish: 'Pancakes' },
    { cat: '10. Café Food & Snacks', dish: 'Filter Coffee' },
    { cat: '10. Café Food & Snacks', dish: 'Masala Chai' },
    { cat: '11. Desserts & Sweets', dish: 'Kaju Katli' },
    { cat: '11. Desserts & Sweets', dish: 'Kaju Barfi' },
    { cat: '11. Desserts & Sweets', dish: 'Bhakarwadi' },
    { cat: '11. Desserts & Sweets', dish: 'Motichoor Ladoo' },
    { cat: '12. Maharashtrian Specialties', dish: 'Pithla Bhakri' },
    { cat: '12. Maharashtrian Specialties', dish: 'Kothimbir Vadi' },
    { cat: '13. Tandoori & Kebabs', dish: 'Paneer Tikka' },
    { cat: '13. Tandoori & Kebabs', dish: 'Tandoori Chicken' },
    { cat: '14. Seafood', dish: 'Surmai Fish Fry' },
    { cat: '15. Healthy & Salads', dish: 'Caesar Salad' }
  ];

  for (const item of sampleDishes) {
    const res = await fetchDishImage(item.dish);
    const pass = res.status === 200 && res.contentType === 'image/png' && res.bytes > 5000;
    console.log(`  ${pass ? '✓' : '✗'} [${item.cat}] ${item.dish} -> canonical: ${res.canonicalKey}, bytes: ${res.bytes}`);
  }

  console.log('\n=== ALL VERIFICATION CHECKS COMPLETE ===');
}

runTests().catch(console.error);
