const mysql = require('mysql2/promise');

async function checkStats() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bakasur_food_tour_1',
    port: Number(process.env.MYSQL_PORT) || 3306
  });

  // 1. Total restaurants (food spots) in database with valid coords
  const [restRows] = await pool.query(`
    SELECT COUNT(DISTINCT id) as total_restaurants,
           COUNT(DISTINCT city) as total_cities
    FROM restaurants
    WHERE status = 'active'
  `);
  console.log('Active restaurants in DB:', restRows[0]);

  // 2. Total dishes in database
  const [dishRows] = await pool.query(`
    SELECT COUNT(DISTINCT d.id) as total_dishes
    FROM dishes d
    JOIN restaurants r ON d.restaurant_id = r.id
    WHERE d.status = 'active' AND r.status = 'active'
  `);
  console.log('Active dishes in DB:', dishRows[0]);

  // 3. Campaign visits
  const [cvRows] = await pool.query(`
    SELECT COUNT(DISTINCT cv.restaurant_name) as visited_spots,
           COUNT(DISTINCT cv.dish_name) as visited_dishes,
           COUNT(DISTINCT cv.session_id) as total_sessions,
           COUNT(*) as total_visits
    FROM campaign_visits cv
  `);
  console.log('Campaign visits summary:', cvRows[0]);

  // 4. Check what food spots are in campaign_visits vs restaurants
  const [allVisitsWithRest] = await pool.query(`
    SELECT cv.id, cv.session_id, cv.restaurant_name, cv.dish_name, cv.latitude, cv.longitude, cv.city,
           r.id as rest_id, r.name as rest_name, r.latitude as r_lat, r.longitude as r_lng
    FROM campaign_visits cv
    LEFT JOIN restaurants r ON cv.restaurant_id = r.id
  `);
  console.log('\nAll campaign visits:', allVisitsWithRest);

  await pool.end();
}

checkStats().catch(e => {
  console.error(e);
  process.exit(1);
});
