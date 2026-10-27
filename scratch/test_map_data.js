const mysql = require('mysql2/promise');

async function testMapData() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  // 1. Visited spots
  const [visits] = await pool.query(`
    SELECT cv.id, cv.session_id, cv.restaurant_id, cv.dish_id, cv.city,
           CAST(cv.latitude AS DECIMAL(10,6)) as latitude,
           CAST(cv.longitude AS DECIMAL(10,6)) as longitude,
           cv.visited_at,
           COALESCE(cv.restaurant_name, r.name, 'Food Stop') as restaurant_name,
           COALESCE(cv.dish_name, d.name, 'Specialty') as dish_name
    FROM campaign_visits cv
    LEFT JOIN restaurants r ON cv.restaurant_id = r.id
    LEFT JOIN dishes d ON cv.dish_id = d.id
    ORDER BY cv.id DESC
  `);
  console.log('Total visits in DB:', visits.length);

  // 2. Active restaurants in DB
  const [restaurants] = await pool.query(`
    SELECT r.id, r.name, r.address, r.area, r.city,
           CAST(r.latitude AS DECIMAL(10,6)) as latitude,
           CAST(r.longitude AS DECIMAL(10,6)) as longitude,
           r.rating, r.image, r.total_visits,
           COALESCE(d.name, 'Famous Specialty') as featured_dish
    FROM restaurants r
    LEFT JOIN dishes d ON d.restaurant_id = r.id AND d.is_recommended = 1
    WHERE r.status = 'active'
    GROUP BY r.id
    ORDER BY r.total_visits DESC
  `);
  console.log('Total restaurants in DB:', restaurants.length);

  // 3. Real stats directly from MySQL
  const [[rCount]] = await pool.query(`
    SELECT COUNT(DISTINCT name) as c FROM (
      SELECT name FROM restaurants WHERE status = 'active'
      UNION
      SELECT restaurant_name as name FROM campaign_visits WHERE restaurant_name IS NOT NULL AND restaurant_name != ''
    ) as all_spots
  `);

  const [[dCount]] = await pool.query(`
    SELECT COUNT(DISTINCT name) as c FROM (
      SELECT name FROM dishes WHERE status = 'active'
      UNION
      SELECT dish_name as name FROM campaign_visits WHERE dish_name IS NOT NULL AND dish_name != ''
    ) as all_dishes
  `);

  const [[cCount]] = await pool.query(`
    SELECT COUNT(DISTINCT city) as c FROM (
      SELECT name as city FROM locations WHERE is_active = 1
      UNION
      SELECT city FROM restaurants WHERE city IS NOT NULL AND city != ''
      UNION
      SELECT city FROM campaign_visits WHERE city IS NOT NULL AND city != ''
    ) as all_cities
  `);

  console.log('REAL DB STATS:', {
    foodSpots: rCount.c,
    mustTryDishes: dCount.c,
    citiesCount: cCount.c
  });

  process.exit(0);
}

testMapData().catch(e => {
  console.error(e);
  process.exit(1);
});
