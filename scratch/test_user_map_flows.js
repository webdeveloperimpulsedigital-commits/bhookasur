const assert = require('assert');

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- STARTING COMPREHENSIVE MAP DATA LOGIC TESTS ---');

  const userA_id = `test_usr_A_${Date.now()}`;
  const sessA_1 = `test_sess_A1_${Date.now()}`;
  const sessA_2 = `test_sess_A2_${Date.now()}`;

  const userB_id = `test_usr_B_${Date.now()}`;
  const sessB_1 = `test_sess_B1_${Date.now()}`;

  // -------------------------------------------------------------
  // Test 1: User A Session 1 - Stop 1 (Single Visit)
  // -------------------------------------------------------------
  console.log('\n[Test 1] User A adds Stop 1 (Vaishali Restaurant) in Session 1...');
  const res1 = await fetch(`${baseUrl}/api/campaign/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessA_1,
      user_id: userA_id,
      restaurant_id: 1,
      restaurant_name: 'Vaishali Restaurant',
      dish_id: 101,
      dish_name: 'SPDP (Sev Potato Dahi Puri)',
      city: 'Pune',
      latitude: 18.52043,
      longitude: 73.84071,
      round_number: 1
    })
  });
  const data1 = await res1.json();
  assert.strictEqual(data1.success, true, 'Visit 1 save should succeed');

  const mapRes1 = await fetch(`${baseUrl}/api/campaign/map?session_id=${sessA_1}&user_id=${userA_id}`);
  const mapData1 = await mapRes1.json();
  assert.strictEqual(mapData1.success, true);
  assert.strictEqual(mapData1.data.points.length, 1, 'Should have exactly 1 point');
  assert.strictEqual(mapData1.data.points[0].isCurrentUserSpot, true, 'Spot should be current user spot');
  assert.strictEqual(mapData1.data.points[0].stopNumber, 1, 'Stop number should be 1');
  console.log('✓ Passed: User A has 1 Blue Pin (Stop 1: Vaishali)');

  // -------------------------------------------------------------
  // Test 2: User A Session 1 - Stop 2 (Multi-stop in same session)
  // -------------------------------------------------------------
  console.log('\n[Test 2] User A adds Stop 2 (Poona Guest House) in Session 1...');
  const res2 = await fetch(`${baseUrl}/api/campaign/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessA_1,
      user_id: userA_id,
      restaurant_id: 2,
      restaurant_name: 'Poona Guest House',
      dish_id: 102,
      dish_name: 'Thalipeeth with Makkhan',
      city: 'Pune',
      latitude: 18.5140,
      longitude: 73.8540,
      round_number: 2
    })
  });
  const data2 = await res2.json();
  assert.strictEqual(data2.success, true, 'Visit 2 save should succeed');

  const mapRes2 = await fetch(`${baseUrl}/api/campaign/map?session_id=${sessA_1}&user_id=${userA_id}`);
  const mapData2 = await mapRes2.json();
  assert.strictEqual(mapData2.data.points.length, 2, 'Should have 2 points for 2 stops in same session');
  const bluePins = mapData2.data.points.filter(p => p.isCurrentUserSpot);
  assert.strictEqual(bluePins.length, 2, 'Both stops in current session must be Blue pins');
  assert.strictEqual(bluePins[0].stopNumber, 1, 'First stop should be Stop 1');
  assert.strictEqual(bluePins[1].stopNumber, 2, 'Second stop should be Stop 2');
  console.log('✓ Passed: User A has 2 Blue Pins (Stop 1: Vaishali, Stop 2: Poona Guest House)');

  // -------------------------------------------------------------
  // Test 3: User A Session 2 (New session, previous visits become Red pins)
  // -------------------------------------------------------------
  console.log('\n[Test 3] User A returns in Session 2 and adds Wadeshwar (Stop 1 of Session 2)...');
  const res3 = await fetch(`${baseUrl}/api/campaign/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessA_2,
      user_id: userA_id,
      restaurant_id: 3,
      restaurant_name: 'Wadeshwar FC Road',
      dish_id: 103,
      dish_name: 'Ghee Podi Idli',
      city: 'Pune',
      latitude: 18.5284,
      longitude: 73.8421,
      round_number: 1
    })
  });
  const data3 = await res3.json();
  assert.strictEqual(data3.success, true);

  const mapRes3 = await fetch(
    `${baseUrl}/api/campaign/map?session_id=${sessA_2}&user_id=${userA_id}&session_ids=${sessA_1},${sessA_2}`
  );
  const mapData3 = await mapRes3.json();
  assert.strictEqual(mapData3.data.points.length, 3, 'Should have 3 points (1 current + 2 historical)');

  const currentSpots = mapData3.data.points.filter(p => p.isCurrentUserSpot);
  const historicalSpots = mapData3.data.points.filter(p => !p.isCurrentUserSpot);

  assert.strictEqual(currentSpots.length, 1, 'Only 1 current session spot');
  assert.strictEqual(currentSpots[0].name, 'Wadeshwar FC Road');
  assert.strictEqual(currentSpots[0].stopNumber, 1);

  assert.strictEqual(historicalSpots.length, 2, 'Should have 2 historical spots (Red pins)');
  const histNames = historicalSpots.map(s => s.name);
  assert.ok(histNames.some(n => n.includes('Vaishali')), 'Historical should include Vaishali');
  assert.ok(histNames.some(n => n.includes('Poona Guest House')), 'Historical should include Poona Guest House');
  console.log('✓ Passed: User A has 1 Blue Pin (Current: Wadeshwar) and 2 Red Pins (Historical: Vaishali, Poona Guest House)');

  // -------------------------------------------------------------
  // Test 4: User B (Different User Isolation)
  // -------------------------------------------------------------
  console.log('\n[Test 4] User B in new session - Must NOT see User A visits...');
  const resB = await fetch(`${baseUrl}/api/campaign/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessB_1,
      user_id: userB_id,
      restaurant_id: 4,
      restaurant_name: 'Katakirr Misal',
      dish_id: 104,
      dish_name: 'Kolhapuri Teekha Misal',
      city: 'Pune',
      latitude: 18.5089,
      longitude: 73.8344,
      round_number: 1
    })
  });
  const dataB = await resB.json();
  assert.strictEqual(dataB.success, true);

  const mapResB = await fetch(`${baseUrl}/api/campaign/map?session_id=${sessB_1}&user_id=${userB_id}`);
  const mapDataB = await mapResB.json();

  assert.strictEqual(mapDataB.data.points.length, 1, 'User B must ONLY see 1 spot');
  assert.strictEqual(mapDataB.data.points[0].name, 'Katakirr Misal');
  assert.strictEqual(mapDataB.data.points[0].isCurrentUserSpot, true);

  const leakedFromUserA = mapDataB.data.points.filter(p =>
    p.name.includes('Vaishali') || p.name.includes('Poona Guest House') || p.name.includes('Wadeshwar')
  );
  assert.strictEqual(leakedFromUserA.length, 0, 'Zero points from User A should leak to User B');
  console.log('✓ Passed: User B sees ONLY Katakirr Misal (Zero data leaked from User A)');

  // -------------------------------------------------------------
  // Cleanup test records from database
  // -------------------------------------------------------------
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bakasur_food_tour_1',
    port: Number(process.env.MYSQL_PORT) || 3306
  });

  await pool.query('DELETE FROM campaign_visits WHERE session_id IN (?, ?, ?)', [sessA_1, sessA_2, sessB_1]);
  await pool.query('DELETE FROM campaign_sessions WHERE session_id IN (?, ?, ?)', [sessA_1, sessA_2, sessB_1]);
  await pool.end();

  console.log('\n--- ALL MAP DATA LOGIC TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
