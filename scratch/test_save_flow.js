async function testSaveAndReflect() {
  const session_id = 'test_real_db_' + Date.now();
  const testSpot = {
    session_id,
    restaurant_name: 'Test Maharaja Dhaba ' + Date.now(),
    dish_name: 'Special Dal Tadka Butter ' + Date.now(),
    city: 'Nagpur',
    latitude: 21.1458,
    longitude: 79.0882
  };

  console.log('1. Posting new visit to /api/campaign/visit...');
  const res = await fetch('http://localhost:3000/api/campaign/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testSpot)
  });
  const json = await res.json();
  console.log('Visit response:', json);

  console.log('2. Fetching /api/campaign/map to see if DB stats updated dynamically...');
  const mapRes = await fetch('http://localhost:3000/api/campaign/map?session_id=' + session_id);
  const mapJson = await mapRes.json();
  console.log('Map Stats:', mapJson.data?.stats);
  console.log('Current user spot in map:', {
    name: mapJson.data?.currentUserPoint?.name,
    dish: mapJson.data?.currentUserPoint?.featured_dish,
    city: mapJson.data?.currentUserPoint?.city,
    isCurrent: mapJson.data?.currentUserPoint?.isCurrentUserSpot
  });

  // Verify directly in MySQL tables
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'bakasur_food_tour_1' });
  
  const [restInDB] = await pool.query('SELECT id, name, city FROM restaurants WHERE name = ?', [testSpot.restaurant_name]);
  console.log('Restaurant row in MySQL restaurants table:', restInDB);

  const [dishInDB] = await pool.query('SELECT id, name, restaurant_id FROM dishes WHERE name = ?', [testSpot.dish_name]);
  console.log('Dish row in MySQL dishes table:', dishInDB);

  const [locInDB] = await pool.query('SELECT id, name FROM locations WHERE name = ?', [testSpot.city]);
  console.log('Location row in MySQL locations table:', locInDB);

  const [visitInDB] = await pool.query('SELECT id, restaurant_name, dish_name, city FROM campaign_visits WHERE session_id = ?', [session_id]);
  console.log('Visit row in MySQL campaign_visits table:', visitInDB);

  const [tourInDB] = await pool.query('SELECT id, restaurant_name, dish_name, location_name FROM tour_submissions WHERE session_id = ?', [session_id]);
  console.log('Tour submission row in MySQL tour_submissions table:', tourInDB);

  process.exit(0);
}

testSaveAndReflect().catch(e => {
  console.error(e);
  process.exit(1);
});
