const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bakasur_food_tour_1',
    port: Number(process.env.MYSQL_PORT) || 3306
  });

  const [colsV] = await pool.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campaign_visits' AND COLUMN_NAME = 'user_id'"
  );
  if (colsV.length === 0) {
    console.log('Adding user_id to campaign_visits...');
    await pool.query('ALTER TABLE campaign_visits ADD COLUMN user_id VARCHAR(100) NULL AFTER session_id');
    await pool.query('ALTER TABLE campaign_visits ADD INDEX idx_visit_user (user_id)');
  } else {
    console.log('campaign_visits already has user_id');
  }

  const [colsS] = await pool.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campaign_sessions' AND COLUMN_NAME = 'user_id'"
  );
  if (colsS.length === 0) {
    console.log('Adding user_id to campaign_sessions...');
    await pool.query('ALTER TABLE campaign_sessions ADD COLUMN user_id VARCHAR(100) NULL AFTER session_id');
    await pool.query('ALTER TABLE campaign_sessions ADD INDEX idx_sess_user (user_id)');
  } else {
    console.log('campaign_sessions already has user_id');
  }

  console.log('Schema migration check complete.');
  await pool.end();
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
