const mysql = require('mysql2/promise');

async function cleanup() {
  const pool = mysql.createPool({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'bakasur_food_tour_1' });
  await pool.query("DELETE FROM dishes WHERE name LIKE 'Special Dal Tadka Butter%'");
  await pool.query("DELETE FROM restaurants WHERE name LIKE 'Test Maharaja Dhaba%'");
  await pool.query("DELETE FROM campaign_visits WHERE restaurant_name LIKE 'Test Maharaja Dhaba%'");
  await pool.query("DELETE FROM tour_submissions WHERE restaurant_name LIKE 'Test Maharaja Dhaba%'");
  await pool.query("DELETE FROM locations WHERE name = 'Nagpur'");
  console.log('Cleaned up test entries!');
  process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });
