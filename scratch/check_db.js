const mysql = require('mysql2/promise');

async function check() {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'bakasur_food_tour_1'
    });
    console.log('Connected to DB');
    const [tables] = await conn.query('SHOW TABLES');
    console.log('TABLES:', tables);

    for (const t of tables) {
      const tableName = Object.values(t)[0];
      const [[cnt]] = await conn.query(`SELECT count(*) as c FROM \`${tableName}\``);
      console.log(`Table ${tableName}: ${cnt.c} rows`);
    }

    const [visits] = await conn.query('SELECT * FROM campaign_visits ORDER BY id DESC LIMIT 10');
    console.log('CAMPAIGN_VISITS sample (up to 10):', visits);

    const [participants] = await conn.query('SELECT * FROM participants ORDER BY id DESC LIMIT 10');
    console.log('PARTICIPANTS sample (up to 10):', participants);

    await conn.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
