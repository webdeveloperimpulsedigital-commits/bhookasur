const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  const [rows] = await pool.query(`
    SELECT r.id, r.name, r.address, r.area, r.city, 
           CAST(r.latitude AS DECIMAL(10,6)) as latitude, 
           CAST(r.longitude AS DECIMAL(10,6)) as longitude, 
           r.rating, r.image, r.total_visits,
           COALESCE(d.name, 'Specialty Dish') as featured_dish
    FROM restaurants r
    LEFT JOIN dishes d ON d.restaurant_id = r.id AND d.is_recommended = 1
    WHERE r.status = 'active'
    GROUP BY r.id
    ORDER BY r.total_visits DESC
    LIMIT 5
  `);
  console.log('Query result:', rows);

  // Check real counts
  const [[rCount]] = await pool.query('SELECT COUNT(*) as c FROM restaurants WHERE status = "active"');
  const [[dCount]] = await pool.query('SELECT COUNT(*) as c FROM dishes WHERE status = "active"');
  const [[cCount]] = await pool.query('SELECT COUNT(DISTINCT city) as c FROM restaurants WHERE city IS NOT NULL AND city != ""');
  const [[locCount]] = await pool.query('SELECT COUNT(DISTINCT name) as c FROM locations WHERE is_active = 1');

  console.log({
    realFoodSpots: rCount.c,
    realDishes: dCount.c,
    realCitiesInRestaurants: cCount.c,
    realLocations: locCount.c
  });

  process.exit(0);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
