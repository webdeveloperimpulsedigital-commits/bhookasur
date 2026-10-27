const mysql = require('mysql2/promise');

async function main() {
  const p = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1',
    port: 3306
  });

  const [faasos] = await p.query("SELECT id, name, area, city, latitude, longitude FROM restaurants WHERE name LIKE '%Faasos%' OR name LIKE '%Relax%' OR name LIKE '%Tiranga%'");
  console.log('Restaurants matching Faasos, Relax, Tiranga:', faasos);

  const [cv] = await p.query("SELECT id, session_id, restaurant_id, restaurant_name, latitude, longitude, round_number FROM campaign_visits WHERE restaurant_name LIKE '%Tiranga%' OR restaurant_name LIKE '%Faasos%' OR restaurant_name LIKE '%Relax%'");
  console.log('Matching campaign_visits:', cv);

  await p.end();
}

main().catch(console.error);
