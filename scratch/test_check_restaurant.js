const mysql = require('mysql2/promise');

function getRestaurantCleanName(name) {
  if (!name) return '';
  const baseName = name.split(/[,-]/)[0].trim();
  return baseName.toLowerCase()
    .replace(/\b(hotel|restaurant|pure veg|veg|cafe|stall|bhel|snacks|the|special|bar|and)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function check(name, restId) {
  const pool = mysql.createPool({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'bakasur_food_tour_1' });
  const clean = getRestaurantCleanName(name);
  
  // Search campaign_visits
  const [rows] = await pool.query(`
    SELECT COUNT(*) as visit_count
    FROM campaign_visits
    WHERE (restaurant_name LIKE ? OR restaurant_name LIKE ?)
       OR (restaurant_id > 0 AND restaurant_id = ?)
  `, [`%${clean}%`, `%${name.trim()}%`, restId || 0]);

  const count = Number(rows[0]?.visit_count || 0);
  console.log(`Checking "${name}" (clean: "${clean}", id: ${restId}): count = ${count}, isFirstVisitor = ${count === 0}`);
  await pool.end();
}

async function run() {
  await check('Cafe GoodLuck', 9);
  await check('Vaishali Restaurant', 8);
  await check('Hotel Roopali, FC Road', 12);
  await check('Random Brand New Cafe 2026', 99999);
}
run();
