const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  const [fks] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'bakasur_food_tour_1' AND REFERENCED_TABLE_NAME IS NOT NULL
  `);
  console.log('Foreign keys:', fks);

  const [locs] = await pool.query('SELECT * FROM locations');
  console.log('Locations count:', locs.length, locs);

  const [rests] = await pool.query('SELECT id, location_id, name, slug FROM restaurants LIMIT 10');
  console.log('Restaurants sample:', rests);

  process.exit(0);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
