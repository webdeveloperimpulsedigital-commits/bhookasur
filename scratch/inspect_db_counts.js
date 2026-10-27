const mysql = require('mysql2/promise');

async function inspectDb() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bakasur_food_tour_1',
    port: Number(process.env.MYSQL_PORT) || 3306
  });

  const [countVisits] = await pool.query('SELECT COUNT(*) as cnt FROM campaign_visits');
  console.log('campaign_visits total rows:', countVisits[0].cnt);

  const [visits] = await pool.query('SELECT * FROM campaign_visits ORDER BY id ASC');
  console.log('\ncampaign_visits entries:');
  visits.forEach(v => console.log(` - [id:${v.id}] session:${v.session_id} | ${v.restaurant_name} (${v.city}) | dish: ${v.dish_name} | (${v.latitude}, ${v.longitude})`));

  const [countRestaurants] = await pool.query('SELECT COUNT(*) as cnt FROM restaurants');
  console.log('\nrestaurants total rows:', countRestaurants[0].cnt);

  const [countDishes] = await pool.query('SELECT COUNT(*) as cnt FROM dishes');
  console.log('dishes total rows:', countDishes[0].cnt);

  const [activeRestaurants] = await pool.query("SELECT COUNT(*) as cnt FROM restaurants WHERE status = 'active'");
  console.log('active restaurants:', activeRestaurants[0].cnt);

  const [verifiedRestaurants] = await pool.query('SELECT COUNT(*) as cnt FROM restaurants WHERE is_verified = 1');
  console.log('verified restaurants:', verifiedRestaurants[0].cnt);

  // Check unique food spots and dishes in campaign_visits
  const [cvUniqueSpots] = await pool.query('SELECT COUNT(DISTINCT restaurant_name) as cnt FROM campaign_visits');
  console.log('Distinct restaurant_name in campaign_visits:', cvUniqueSpots[0].cnt);

  const [cvUniqueDishes] = await pool.query('SELECT COUNT(DISTINCT dish_name) as cnt FROM campaign_visits');
  console.log('Distinct dish_name in campaign_visits:', cvUniqueDishes[0].cnt);

  // Check unique food spots across restaurants table
  const [restWithCoords] = await pool.query('SELECT COUNT(*) as cnt FROM restaurants WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND latitude > 0');
  console.log('Restaurants with valid coordinates in DB:', restWithCoords[0].cnt);

  await pool.end();
}

inspectDb().catch(e => {
  console.error(e);
  process.exit(1);
});
