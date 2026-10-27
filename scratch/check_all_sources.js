const mysql = require('mysql2/promise');

async function main() {
  const p = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1',
    port: 3306
  });

  const [[tsStats]] = await p.query('SELECT COUNT(*) as total, COUNT(DISTINCT restaurant_name) as distinct_rests, COUNT(DISTINCT dish_name) as distinct_dishes FROM tour_submissions');
  console.log('tour_submissions stats:', tsStats);

  const [[cvStats]] = await p.query('SELECT COUNT(*) as total, COUNT(DISTINCT restaurant_name) as distinct_rests, COUNT(DISTINCT dish_name) as distinct_dishes FROM campaign_visits');
  console.log('campaign_visits stats:', cvStats);

  const [[restStats]] = await p.query("SELECT COUNT(*) as total, COUNT(DISTINCT name) as distinct_rests FROM restaurants WHERE status = 'active'");
  console.log('restaurants (active) stats:', restStats);

  const [[dishStats]] = await p.query("SELECT COUNT(*) as total, COUNT(DISTINCT name) as distinct_dishes FROM dishes WHERE status = 'active'");
  console.log('dishes (active) stats:', dishStats);

  // Union of food spots across restaurants, campaign_visits, AND tour_submissions
  const [[allRests]] = await p.query(`
    SELECT COUNT(DISTINCT name) as c FROM (
      SELECT name FROM restaurants WHERE status = 'active'
      UNION
      SELECT restaurant_name as name FROM campaign_visits WHERE restaurant_name IS NOT NULL AND restaurant_name != ''
      UNION
      SELECT restaurant_name as name FROM tour_submissions WHERE restaurant_name IS NOT NULL AND restaurant_name != ''
    ) t
  `);
  console.log('Total distinct food spots across all tables:', allRests.c);

  const [[allDishes]] = await p.query(`
    SELECT COUNT(DISTINCT name) as c FROM (
      SELECT name FROM dishes WHERE status = 'active'
      UNION
      SELECT dish_name as name FROM campaign_visits WHERE dish_name IS NOT NULL AND dish_name != ''
      UNION
      SELECT dish_name as name FROM tour_submissions WHERE dish_name IS NOT NULL AND dish_name != ''
    ) t
  `);
  console.log('Total distinct dishes across all tables:', allDishes.c);

  const [allSubmissions] = await p.query(`
    SELECT ts.id, ts.session_id, ts.restaurant_id, ts.restaurant_name, ts.dish_name, ts.location_name
    FROM tour_submissions ts
    WHERE ts.restaurant_name IS NOT NULL AND ts.restaurant_name != ''
  `);

  const [rows] = await p.query("SELECT id, name, area, city, latitude, longitude FROM restaurants WHERE status = 'active'");
  console.log('Total active restaurants:', rows.length);
  const coordSet = new Set();
  const nameSet = new Set();
  rows.forEach(r => {
    coordSet.add(r.latitude + ',' + r.longitude);
    nameSet.add(r.name);
  });
  console.log('Unique coordinates:', coordSet.size);
  console.log('Unique restaurant names:', nameSet.size);

  await p.end();
}

main().catch(console.error);
