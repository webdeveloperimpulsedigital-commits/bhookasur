const mysql = require('mysql2/promise');

async function sync() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  console.log('1. Checking and updating restaurants columns...');
  const [restCols] = await pool.query('SHOW COLUMNS FROM restaurants');
  const restFieldNames = restCols.map(c => c.Field);

  if (!restFieldNames.includes('city')) {
    await pool.query('ALTER TABLE restaurants ADD COLUMN city VARCHAR(100) DEFAULT NULL');
  }
  if (!restFieldNames.includes('area')) {
    await pool.query('ALTER TABLE restaurants ADD COLUMN area VARCHAR(150) DEFAULT NULL');
  }
  if (!restFieldNames.includes('latitude')) {
    await pool.query('ALTER TABLE restaurants ADD COLUMN latitude DECIMAL(10, 8) DEFAULT 18.5204');
  }
  if (!restFieldNames.includes('longitude')) {
    await pool.query('ALTER TABLE restaurants ADD COLUMN longitude DECIMAL(11, 8) DEFAULT 73.8407');
  }
  if (!restFieldNames.includes('rating')) {
    await pool.query('ALTER TABLE restaurants ADD COLUMN rating DECIMAL(3, 2) DEFAULT 4.70');
  }
  if (!restFieldNames.includes('image')) {
    await pool.query('ALTER TABLE restaurants ADD COLUMN image VARCHAR(1000) DEFAULT NULL');
  }
  if (!restFieldNames.includes('is_campaign_active')) {
    await pool.query('ALTER TABLE restaurants ADD COLUMN is_campaign_active TINYINT(1) DEFAULT 1');
  }
  if (!restFieldNames.includes('total_visits')) {
    await pool.query('ALTER TABLE restaurants ADD COLUMN total_visits INT DEFAULT 100');
  }
  if (!restFieldNames.includes('status')) {
    await pool.query("ALTER TABLE restaurants ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active'");
  }
  if (!restFieldNames.includes('description')) {
    await pool.query('ALTER TABLE restaurants ADD COLUMN description TEXT DEFAULT NULL');
  }

  console.log('2. Checking and updating dishes columns...');
  const [dishCols] = await pool.query('SHOW COLUMNS FROM dishes');
  const dishFieldNames = dishCols.map(c => c.Field);

  if (!dishFieldNames.includes('price')) {
    await pool.query('ALTER TABLE dishes ADD COLUMN price DECIMAL(8, 2) DEFAULT 150.00');
  }
  if (!dishFieldNames.includes('image')) {
    await pool.query('ALTER TABLE dishes ADD COLUMN image VARCHAR(1000) DEFAULT NULL');
  }
  if (!dishFieldNames.includes('rating')) {
    await pool.query('ALTER TABLE dishes ADD COLUMN rating DECIMAL(3, 2) DEFAULT 4.70');
  }
  if (!dishFieldNames.includes('popularity')) {
    await pool.query('ALTER TABLE dishes ADD COLUMN popularity INT DEFAULT 95');
  }
  if (!dishFieldNames.includes('is_recommended')) {
    await pool.query('ALTER TABLE dishes ADD COLUMN is_recommended TINYINT(1) DEFAULT 1');
  }
  if (!dishFieldNames.includes('status')) {
    await pool.query("ALTER TABLE dishes ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active'");
  }

  // Update existing restaurants city from locations if location_id is present
  await pool.query(`
    UPDATE restaurants r
    JOIN locations l ON r.location_id = l.id
    SET r.city = l.name
    WHERE r.city IS NULL OR r.city = ''
  `);

  // Ensure all existing restaurants & dishes are status = 'active'
  await pool.query("UPDATE restaurants SET status = 'active' WHERE status IS NULL OR status = ''");
  await pool.query("UPDATE dishes SET status = 'active' WHERE status IS NULL OR status = ''");

  console.log('3. Verifying queries...');
  const [activeRests] = await pool.query('SELECT COUNT(*) as c FROM restaurants WHERE status = "active"');
  const [activeDishes] = await pool.query('SELECT COUNT(*) as c FROM dishes WHERE status = "active"');
  const [locCount] = await pool.query('SELECT COUNT(*) as c FROM locations');

  console.log('Active restaurants in MySQL:', activeRests[0].c);
  console.log('Active dishes in MySQL:', activeDishes[0].c);
  console.log('Locations in MySQL:', locCount[0].c);

  process.exit(0);
}

sync().catch(e => {
  console.error('Sync failed:', e);
  process.exit(1);
});
