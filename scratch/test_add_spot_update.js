const http = require('http');

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const mysql = require('mysql2/promise');
  const testSession = 'test_flow_session_' + Date.now();

  console.log('Testing session:', testSession);

  // 1. Initial fetch before any visits for this session
  const map1 = await fetchJson(`http://localhost:3000/api/campaign/map?session_id=${testSession}`);
  console.log('Initial user spots count for new session:', map1.body.data.currentUserSpots.length);
  console.log('Global spots available to new session:', map1.body.data.points.length);
  console.log('Stats:', map1.body.data.stats);

  // 2. Add Stop 1
  const visit1 = await postJson('http://localhost:3000/api/campaign/visit', {
    session_id: testSession,
    restaurant_id: 11, // Hotel Roopali
    restaurant_name: 'Hotel Roopali',
    dish_name: 'Special Butter Masala Dosa',
    city: 'Pune',
    latitude: 18.5215,
    longitude: 73.8402,
    round_number: 1
  });
  console.log('Added Stop 1:', visit1.status, visit1.body.success);

  // 3. Add Stop 2
  const visit2 = await postJson('http://localhost:3000/api/campaign/visit', {
    session_id: testSession,
    restaurant_id: 12, // Wadeshwar
    restaurant_name: 'Wadeshwar',
    dish_name: 'Ghee Podi Idli',
    city: 'Pune',
    latitude: 18.5220,
    longitude: 73.8410,
    round_number: 2
  });
  console.log('Added Stop 2:', visit2.status, visit2.body.success);

  // 4. Fetch map again
  const map2 = await fetchJson(`http://localhost:3000/api/campaign/map?session_id=${testSession}`);
  console.log('Updated user spots count:', map2.body.data.currentUserSpots.length);
  console.log('User spots:', map2.body.data.currentUserSpots.map(s => `Stop ${s.stopNumber}: ${s.name} - ${s.dishName || s.featured_dish}`));
  console.log('Total map points:', map2.body.data.points.length);

  // 5. Clean up test records
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1',
    port: 3306
  });
  await pool.query('DELETE FROM campaign_visits WHERE session_id = ?', [testSession]);
  await pool.query('DELETE FROM tour_submissions WHERE session_id = ?', [testSession]);
  await pool.end();
  console.log('Cleaned up test session records.');
}

main().catch(console.error);
