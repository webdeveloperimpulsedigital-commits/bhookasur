const mysql = require('mysql2/promise');
const fs = require('fs');

async function updateDishesMetadata() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  const dbCode = fs.readFileSync('lib/db.ts', 'utf8');
  // Match dishes objects
  const dishRegex = /\{\s*restaurant_id:\s*(\d+),\s*name:\s*"([^"]+)",\s*description:\s*"([^"]*)",\s*price:\s*([\d.]+),\s*image:\s*"([^"]*)",\s*rating:\s*([\d.]+),\s*popularity:\s*(\d+),\s*is_recommended:\s*(\d+),\s*status:\s*'active'\s*\}/g;

  let match;
  let count = 0;
  while ((match = dishRegex.exec(dbCode)) !== null) {
    const [, restId, name, description, price, image, rating, popularity, is_recommended] = match;
    
    // Check if dish exists for this restaurant or by name
    const [existing] = await pool.query('SELECT id FROM dishes WHERE restaurant_id = ? AND LOWER(name) = LOWER(?)', [parseInt(restId), name]);
    if (existing.length > 0) {
      await pool.query(
        `UPDATE dishes 
         SET description = ?, price = ?, image = ?, rating = ?, popularity = ?, is_recommended = ?, status = 'active'
         WHERE id = ?`,
        [description, parseFloat(price), image, parseFloat(rating), parseInt(popularity), parseInt(is_recommended), existing[0].id]
      );
      count++;
    } else {
      // Insert dish
      await pool.query(
        `INSERT INTO dishes (restaurant_id, name, slug, description, price, image, rating, popularity, is_recommended, status)
         VALUES (?, ?, LOWER(REPLACE(?, ' ', '-')), ?, ?, ?, ?, ?, ?, 'active')`,
        [parseInt(restId), name, name, description, parseFloat(price), image, parseFloat(rating), parseInt(popularity), parseInt(is_recommended)]
      );
      count++;
    }
  }

  console.log(`Updated/inserted ${count} dishes in MySQL!`);

  const [totalD] = await pool.query('SELECT COUNT(*) as c FROM dishes WHERE status = "active"');
  console.log('Total active dishes now in MySQL:', totalD[0].c);

  process.exit(0);
}

updateDishesMetadata().catch(e => {
  console.error(e);
  process.exit(1);
});
