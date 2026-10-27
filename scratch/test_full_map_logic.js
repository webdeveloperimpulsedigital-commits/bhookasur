const mysql = require('mysql2/promise');

async function testFullMapLogic() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bakasur_food_tour_1',
    port: Number(process.env.MYSQL_PORT) || 3306
  });

  // Helper functions
  const getRestaurantKey = (name) => {
    if (!name) return 'unknown';
    const baseName = name.split(/[,-]/)[0].trim();
    const clean = baseName.toLowerCase()
      .replace(/\b(hotel|restaurant|pure veg|veg|cafe|stall|bhel|snacks|the|special|bar|and)\b/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
    return clean || baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const isValidCoord = (lat, lng) =>
    Number.isFinite(lat) && Number.isFinite(lng) && lat >= 6 && lat <= 37.5 && lng >= 68 && lng <= 97.5;

  const distanceKm = (lat1, lng1, lat2, lng2) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Test session scenarios:
  // Scenario A: User with 1 historical session ('sess_1788429722535_s1ew2n') and current session ('bkt_test_curr_sess_A')
  const currentSessionId = 'bkt_test_curr_sess_A';
  const historySessionId = 'sess_1788429722535_s1ew2n';
  const testUserId = 'bkt_usr_test_user_A';

  // Add 2 stops for current session
  await pool.query(`
    INSERT INTO campaign_visits (session_id, user_id, restaurant_id, dish_id, city, latitude, longitude, restaurant_name, dish_name, round_number)
    VALUES (?, ?, 85, 70455, 'Pune', 18.459599, 73.785661, 'Dominos Pizza Karve Road', 'Cheese Burst Pizza', 1)
  `, [currentSessionId, testUserId]);

  await pool.query(`
    INSERT INTO campaign_visits (session_id, user_id, restaurant_id, dish_id, city, latitude, longitude, restaurant_name, dish_name, round_number)
    VALUES (?, ?, 86, 22189, 'Pune', 18.455066, 73.792121, 'Faasos Wraps Pune', 'Paneer Tikka Roll', 2)
  `, [currentSessionId, testUserId]);

  const userSessionIds = new Set([currentSessionId, historySessionId]);

  const [rows] = await pool.query(`
    SELECT cv.id, cv.session_id, cv.user_id, cv.restaurant_id, cv.round_number,
           COALESCE(NULLIF(cv.restaurant_name, ''), r.name) AS restaurant_name,
           COALESCE(NULLIF(cv.dish_name, ''), d.name, '') AS dish_name,
           COALESCE(NULLIF(r.city, ''), NULLIF(cv.city, ''), '') AS city,
           COALESCE(r.latitude, cv.latitude) AS latitude,
           COALESCE(r.longitude, cv.longitude) AS longitude,
           COALESCE(r.rating, 0) AS rating,
           COALESCE(r.image, '') AS image,
           COALESCE(r.address, '') AS address,
           cv.visited_at
    FROM campaign_visits cv
    LEFT JOIN restaurants r ON cv.restaurant_id = r.id
    LEFT JOIN dishes d ON cv.dish_id = d.id
    WHERE (? IS NOT NULL AND cv.user_id = ?) OR (cv.session_id IN (?))
    ORDER BY cv.visited_at ASC, cv.id ASC
  `, [testUserId, testUserId, Array.from(userSessionIds)]);

  const visitRows = rows.map(v => ({
    id: Number(v.id),
    session_id: String(v.session_id || ''),
    restaurant_id: Number(v.restaurant_id || 0),
    restaurant_name: String(v.restaurant_name || '').trim(),
    dish_name: String(v.dish_name || '').trim(),
    city: String(v.city || '').trim(),
    latitude: Number(v.latitude),
    longitude: Number(v.longitude),
    rating: Number(v.rating || 0),
    image: String(v.image || ''),
    address: String(v.address || ''),
    round_number: Number(v.round_number) || 1
  }));

  const plottable = visitRows.filter(v => v.restaurant_name && isValidCoord(v.latitude, v.longitude));

  const spots = [];
  const findSpot = (name, lat, lng) => {
    const key = getRestaurantKey(name);
    return spots.find(s => s._key === key && distanceKm(s.latitude, s.longitude, lat, lng) <= 1);
  };

  plottable.forEach(v => {
    let spot = findSpot(v.restaurant_name, v.latitude, v.longitude);
    if (!spot) {
      spot = {
        id: v.restaurant_id || v.id,
        name: v.restaurant_name,
        address: v.address,
        city: v.city,
        latitude: v.latitude,
        longitude: v.longitude,
        rating: v.rating,
        image: v.image,
        total_visits: 0,
        featured_dish: '',
        isCurrentUserSpot: false,
        isHistorical: false,
        stopNumber: undefined,
        _key: getRestaurantKey(v.restaurant_name),
        _visitIds: new Set(),
        _dishes: new Set()
      };
      spots.push(spot);
    }
    spot._visitIds.add(v.id);
    spot.total_visits = spot._visitIds.size;
    if (v.dish_name) {
      spot.featured_dish = v.dish_name;
      spot._dishes.add(v.dish_name.toLowerCase());
    }
  });

  // Current session stops
  const roundMap = new Map();
  plottable.filter(v => v.session_id === currentSessionId).forEach(v => roundMap.set(v.round_number, v));
  const sortedRounds = Array.from(roundMap.entries()).sort((a, b) => a[0] - b[0]);
  const currentUserSpots = sortedRounds.map(([, v], idx) => {
    const spot = findSpot(v.restaurant_name, v.latitude, v.longitude);
    return {
      id: Number(v.id),
      session_id: v.session_id,
      restaurant_id: v.restaurant_id,
      name: v.restaurant_name,
      city: v.city,
      latitude: spot ? spot.latitude : v.latitude,
      longitude: spot ? spot.longitude : v.longitude,
      featured_dish: v.dish_name,
      isCurrentUserSpot: true,
      stopNumber: idx + 1
    };
  });

  currentUserSpots.forEach(u => {
    const spot = findSpot(u.name, u.latitude, u.longitude);
    if (spot) {
      spot.isCurrentUserSpot = true;
      spot.isHistorical = false;
      if (spot.stopNumber === undefined) spot.stopNumber = u.stopNumber;
      if (u.featured_dish) spot.featured_dish = u.featured_dish;
    }
  });

  spots.forEach(s => {
    if (!s.isCurrentUserSpot) {
      s.isHistorical = true;
    }
  });

  console.log('Resulting Map Points:');
  spots.forEach(s => {
    console.log(`- [${s.isCurrentUserSpot ? 'BLUE PIN (Current Stop ' + s.stopNumber + ')' : 'RED PIN (Historical)'}] ${s.name} (${s.city}) - Dish: ${s.featured_dish} - Total Visits: ${s.total_visits}`);
  });

  // Cleanup
  await pool.query('DELETE FROM campaign_visits WHERE session_id = ?', [currentSessionId]);
  await pool.end();
}

testFullMapLogic().catch(e => {
  console.error(e);
  process.exit(1);
});
