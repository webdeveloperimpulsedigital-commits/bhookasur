const mysql = require('mysql2/promise');

async function testFix() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1',
    port: 3306
  });

  const sessionId = 'bkt_sess_1789123858588_mhgdge9d060';

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

  // 1. Fetch active restaurants
  const [restRows] = await pool.query(`
    SELECT r.id, r.name, r.address, r.area, r.city,
           CAST(r.latitude AS DECIMAL(10,6)) as latitude,
           CAST(r.longitude AS DECIMAL(10,6)) as longitude,
           COALESCE(r.rating, 4.8) as rating,
           COALESCE(r.image, '') as image,
           COALESCE(r.total_visits, 1) as total_visits,
           COALESCE(
             (SELECT d.name FROM dishes d WHERE d.restaurant_id = r.id AND d.status = 'active' ORDER BY d.is_recommended DESC, d.popularity DESC LIMIT 1),
             'Specialty Dish'
           ) as featured_dish
    FROM restaurants r
    WHERE r.status = 'active' AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
    ORDER BY r.total_visits DESC
  `);

  // 2. Fetch campaign visits
  const [cvRows] = await pool.query(`
    SELECT cv.id, cv.session_id, cv.user_id, cv.restaurant_id, cv.round_number,
           COALESCE(NULLIF(cv.restaurant_name, ''), r.name) AS restaurant_name,
           COALESCE(NULLIF(cv.dish_name, ''), d.name, '') AS dish_name,
           COALESCE(NULLIF(r.city, ''), NULLIF(cv.city, ''), 'Pune') AS city,
           COALESCE(r.latitude, cv.latitude) AS latitude,
           COALESCE(r.longitude, cv.longitude) AS longitude,
           COALESCE(r.rating, 4.8) AS rating,
           COALESCE(r.image, '') AS image,
           COALESCE(r.address, '') AS address,
           cv.visited_at
    FROM campaign_visits cv
    LEFT JOIN restaurants r ON cv.restaurant_id = r.id
    LEFT JOIN dishes d ON cv.dish_id = d.id
    WHERE cv.restaurant_name IS NOT NULL AND cv.restaurant_name != ''
    ORDER BY cv.visited_at ASC, cv.id ASC
  `);

  // 3. User visits for session
  const userVisits = cvRows.filter(v => v.session_id === sessionId);
  const roundMap = new Map();
  userVisits.forEach(v => {
    const rNum = Number(v.round_number) || 1;
    roundMap.set(rNum, v);
  });

  const sortedRounds = Array.from(roundMap.entries()).sort((a, b) => a[0] - b[0]);
  const currentUserSpots = sortedRounds.map(([roundNum, v], idx) => ({
    id: Number(v.id),
    session_id: String(v.session_id || ''),
    restaurant_id: Number(v.restaurant_id || 0),
    name: String(v.restaurant_name),
    city: String(v.city || 'Pune'),
    latitude: Number(v.latitude),
    longitude: Number(v.longitude),
    rating: Number(v.rating || 4.8),
    image: String(v.image || ''),
    featured_dish: String(v.dish_name || 'Specialty Dish'),
    isCurrentUserSpot: true,
    stopNumber: idx + 1
  }));

  console.log('CurrentUserSpots:');
  currentUserSpots.forEach(s => {
    console.log(`- Stop ${s.stopNumber}: ${s.name} (restaurant_id: ${s.restaurant_id}, lat: ${s.latitude}, lng: ${s.longitude})`);
  });

  // 4. Strict 1-to-1 matching: map each user stop to exactly ONE restaurant ID
  const restIdToUserStopMap = new Map();
  const matchedUserStopNumbers = new Set();

  currentUserSpots.forEach(s => {
    let matchedRest = null;

    // Strategy 1: Match by exact restaurant_id
    if (s.restaurant_id) {
      matchedRest = restRows.find(r => Number(r.id) === Number(s.restaurant_id));
    }

    // Strategy 2: Match by exact coordinates (within 100 meters)
    if (!matchedRest && isValidCoord(s.latitude, s.longitude)) {
      matchedRest = restRows.find(r =>
        !restIdToUserStopMap.has(Number(r.id)) &&
        Math.abs(Number(r.latitude) - s.latitude) < 0.001 &&
        Math.abs(Number(r.longitude) - s.longitude) < 0.001
      );
    }

    // Strategy 3: Match by normalized name, picking the physically closest location
    if (!matchedRest) {
      const sKey = getRestaurantKey(s.name);
      const candidates = restRows.filter(r =>
        !restIdToUserStopMap.has(Number(r.id)) &&
        getRestaurantKey(String(r.name || '')) === sKey
      );
      if (candidates.length > 0) {
        if (isValidCoord(s.latitude, s.longitude)) {
          candidates.sort((a, b) =>
            distanceKm(Number(a.latitude), Number(a.longitude), s.latitude, s.longitude) -
            distanceKm(Number(b.latitude), Number(b.longitude), s.latitude, s.longitude)
          );
        }
        matchedRest = candidates[0];
      }
    }

    if (matchedRest) {
      restIdToUserStopMap.set(Number(matchedRest.id), s);
      matchedUserStopNumbers.add(s.stopNumber);
      console.log(`Matched Stop ${s.stopNumber} (${s.name}) -> restaurant ID ${matchedRest.id} (${matchedRest.name} at ${matchedRest.latitude}, ${matchedRest.longitude})`);
    } else {
      console.log(`Stop ${s.stopNumber} (${s.name}) not matched to any existing restaurant row`);
    }
  });

  // 5. Build spotsMap
  const spotsMap = new Map();
  restRows.forEach(r => {
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    if (!isValidCoord(lat, lng)) return;

    const userSpot = restIdToUserStopMap.get(Number(r.id));
    const isCurrentUserSpot = Boolean(userSpot);
    const stopNumber = userSpot?.stopNumber;

    spotsMap.set(`rest_${r.id}`, {
      id: Number(r.id),
      name: String(r.name),
      latitude: lat,
      longitude: lng,
      isCurrentUserSpot,
      stopNumber
    });
  });

  const points = Array.from(spotsMap.values());
  const stop1 = points.filter(p => p.stopNumber === 1);
  const stop2 = points.filter(p => p.stopNumber === 2);

  console.log(`\nResults in points array:`);
  console.log('Stop 1 count:', stop1.length, stop1.map(p => `${p.id}: ${p.name}`));
  console.log('Stop 2 count:', stop2.length, stop2.map(p => `${p.id}: ${p.name}`));
  console.log('Total points:', points.length);

  await pool.end();
}

testFix().catch(console.error);
