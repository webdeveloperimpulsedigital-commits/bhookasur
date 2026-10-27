const mysql = require('mysql2/promise');
const fs = require('fs');

async function updateRestMetadata() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  // Read lib/db.ts to get INITIAL_RESTAURANTS
  const dbCode = fs.readFileSync('lib/db.ts', 'utf8');
  // Match restaurant objects
  const restRegex = /\{\s*name:\s*"([^"]+)",\s*description:\s*"([^"]*)",\s*address:\s*"([^"]*)",\s*area:\s*"([^"]*)",\s*city:\s*"([^"]*)",\s*latitude:\s*([\d.]+),\s*longitude:\s*([\d.]+),\s*rating:\s*([\d.]+),\s*image:\s*"([^"]*)",\s*is_campaign_active:\s*(\d+),\s*total_visits:\s*(\d+),\s*status:\s*'active'\s*\}/g;

  let match;
  let count = 0;
  while ((match = restRegex.exec(dbCode)) !== null) {
    const [, name, description, address, area, city, lat, lng, rating, image, is_campaign_active, total_visits] = match;
    
    // Find or update restaurant by name
    const [existing] = await pool.query('SELECT id FROM restaurants WHERE LOWER(name) = LOWER(?)', [name]);
    if (existing.length > 0) {
      await pool.query(
        `UPDATE restaurants 
         SET description = ?, address = ?, area = ?, city = ?, latitude = ?, longitude = ?, rating = ?, image = ?, is_campaign_active = ?, total_visits = ?, status = 'active'
         WHERE id = ?`,
        [description, address, area, city, parseFloat(lat), parseFloat(lng), parseFloat(rating), image, parseInt(is_campaign_active), parseInt(total_visits), existing[0].id]
      );
      count++;
    } else {
      // If not existing, insert it
      await pool.query(
        `INSERT INTO restaurants (location_id, name, slug, description, address, area, city, latitude, longitude, rating, image, is_campaign_active, total_visits, status)
         VALUES (8, ?, LOWER(REPLACE(?, ' ', '-')), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [name, name, description, address, area, city, parseFloat(lat), parseFloat(lng), parseFloat(rating), image, parseInt(is_campaign_active), parseInt(total_visits)]
      );
      count++;
    }
  }

  console.log(`Updated/inserted ${count} restaurants in MySQL!`);

  const [totalR] = await pool.query('SELECT COUNT(*) as c FROM restaurants WHERE status = "active"');
  console.log('Total active restaurants now:', totalR[0].c);

  process.exit(0);
}

updateRestMetadata().catch(e => {
  console.error(e);
  process.exit(1);
});
