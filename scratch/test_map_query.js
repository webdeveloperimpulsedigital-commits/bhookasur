const mysql = require('mysql2/promise');

async function testMapLogic() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bakasur_food_tour_1',
    port: Number(process.env.MYSQL_PORT) || 3306
  });

  // Test Case:
  // User has:
  // Prior session: 'sess_1788429722535_s1ew2n' (has Durga Cafe & Ganraj Hotel)
  // Current session: 'bkt_sess_test_active_1' (has Vaishali)
  const priorSession = 'sess_1788429722535_s1ew2n';
  const currentSession = 'bkt_sess_test_active_1';
  const testUserId = 'bkt_usr_test_999';

  // Insert a test current visit
  await pool.query(`
    INSERT INTO campaign_visits (session_id, user_id, restaurant_id, dish_id, city, latitude, longitude, restaurant_name, dish_name, round_number)
    VALUES (?, ?, 1, 101, 'Pune', 18.5204, 73.8407, 'Vaishali Restaurant', 'SPDP (Sev Potato Dahi Puri)', 1)
    ON DUPLICATE KEY UPDATE restaurant_name = VALUES(restaurant_name)
  `, [currentSession, testUserId]);

  const userSessionIds = new Set([currentSession, priorSession]);

  const [rows] = await pool.query(`
    SELECT cv.id, cv.session_id, cv.user_id, cv.restaurant_id, cv.round_number,
           COALESCE(NULLIF(cv.restaurant_name, ''), r.name) AS restaurant_name,
           COALESCE(NULLIF(cv.dish_name, ''), d.name, '') AS dish_name,
           COALESCE(NULLIF(r.city, ''), NULLIF(cv.city, ''), '') AS city,
           COALESCE(r.latitude, cv.latitude) AS latitude,
           COALESCE(r.longitude, cv.longitude) AS longitude,
           COALESCE(r.rating, 0) AS rating,
           COALESCE(r.image, '') AS image,
           COALESCE(r.address, '') AS address
    FROM campaign_visits cv
    LEFT JOIN restaurants r ON cv.restaurant_id = r.id
    LEFT JOIN dishes d ON cv.dish_id = d.id
    WHERE cv.session_id IN (?)
    ORDER BY cv.visited_at ASC, cv.id ASC
  `, [Array.from(userSessionIds)]);

  console.log(`Fetched ${rows.length} visits for user session set:`, rows.map(r => ({
    name: r.restaurant_name,
    dish: r.dish_name,
    session_id: r.session_id,
    isCurrent: r.session_id === currentSession
  })));

  // Clean up test row
  await pool.query('DELETE FROM campaign_visits WHERE session_id = ?', [currentSession]);
  await pool.end();
}

testMapLogic().catch(e => {
  console.error(e);
  process.exit(1);
});
