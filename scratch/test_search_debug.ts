import { searchRestaurantsAnywhere } from '../lib/restaurantSearch';

async function main() {
  const queries = [
    'Phadke Dining Hall',
    'Durvankur Dining Hall',
    'Phadke Dining',
    'Durvankur Dinning Hall',
    'Phadke',
    'Durvankur'
  ];

  for (const q of queries) {
    console.log(`\n================= Searching: "${q}" =================`);
    try {
      const res = await searchRestaurantsAnywhere(q, { lat: 18.5204, lng: 73.8567 }, { selectedCity: 'Pune' });
      console.log(`Scope: ${res.scope}, Count: ${res.data.length}, Message: ${res.message || 'none'}`);
      res.data.forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.name} (${r.area || r.city}) [${r.verification_source}] - ID: ${r.id}`);
      });
    } catch (err) {
      console.error('Search error:', err);
    }
  }
}

main().catch(console.error);
