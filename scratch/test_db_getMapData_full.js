const mysql = require('mysql2/promise');

async function testFullMapData() {
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

  // 1. Fetch all active restaurants from MySQL
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

  // 2. Fetch visits from campaign_visits
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

  // 3. Fetch visits from tour_submissions
  const [tsRows] = await pool.query(`
    SELECT ts.id, ts.session_id, ts.restaurant_id, ts.restaurant_name, ts.dish_name, ts.location_name as city,
           COALESCE(r.latitude, NULL) as latitude,
           COALESCE(r.longitude, NULL) as longitude,
           COALESCE(r.rating, 4.8) as rating,
           COALESCE(r.image, '') as image,
           COALESCE(r.address, '') as address,
           ts.created_at as visited_at
    FROM tour_submissions ts
    LEFT JOIN restaurants r ON (ts.restaurant_id = r.id OR LOWER(ts.restaurant_name) = LOWER(r.name))
    WHERE ts.restaurant_name IS NOT NULL AND ts.restaurant_name != ''
  `);

  // 4. Determine current user's spots for this sessionId
  let currentUserSpots = [];
  if (sessionId) {
    // Current user's visits in this session from campaign_visits
    const sessionCvVisits = cvRows.filter(v => v.session_id === sessionId);
    const roundMap = new Map();
    sessionCvVisits.forEach(v => {
      const rNum = Number(v.round_number) || 1;
      roundMap.set(rNum, v);
    });

    const sortedRounds = Array.from(roundMap.entries()).sort((a, b) => a[0] - b[0]);
    currentUserSpots = sortedRounds.map(([roundNum, v], idx) => ({
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
  }

  const currentUserKeysMap = new Map();
  currentUserSpots.forEach(s => {
    currentUserKeysMap.set(getRestaurantKey(s.name), s.stopNumber);
  });

  // 5. Build cumulative visit count map across campaign_visits + tour_submissions
  const visitCounts = new Map();
  const allVisits = [...cvRows, ...tsRows];
  allVisits.forEach(v => {
    const key = getRestaurantKey(v.restaurant_name);
    if (!key) return;
    visitCounts.set(key, (visitCounts.get(key) || 0) + 1);
  });

  // 6. Build spots map using restaurant ID and normalized key for unique locations
  const spotsMap = new Map();

  // First: all active restaurants from DB
  restRows.forEach(r => {
    const restName = String(r.name || '');
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    if (!restName || !isValidCoord(lat, lng)) return;

    const restIdKey = `rest_${r.id}`;
    const nameKey = getRestaurantKey(restName);

    // Check if current user visited this restaurant
    const userSpot = currentUserSpots.find(s =>
      (s.restaurant_id && s.restaurant_id === Number(r.id)) ||
      (getRestaurantKey(s.name) === nameKey)
    );

    const isCurrentUserSpot = Boolean(userSpot);
    const stopNumber = userSpot?.stopNumber;

    const additionalVisits = visitCounts.get(nameKey) || 0;
    const totalVisits = Math.max(Number(r.total_visits || 1), additionalVisits);

    let featured_dish = String(r.featured_dish || 'Specialty Dish');
    if (isCurrentUserSpot && userSpot?.featured_dish) {
      featured_dish = userSpot.featured_dish;
    }

    spotsMap.set(restIdKey, {
      id: Number(r.id),
      name: restName,
      address: String(r.address || ''),
      city: String(r.city || 'Pune'),
      latitude: lat,
      longitude: lng,
      rating: Number(r.rating || 4.8),
      image: String(r.image || ''),
      total_visits: totalVisits,
      featured_dish,
      isCurrentUserSpot,
      isHistorical: !isCurrentUserSpot,
      stopNumber
    });
  });

  // Second: any extra campaign visits with real coordinates not already in restaurants
  cvRows.forEach(v => {
    const restName = String(v.restaurant_name || '');
    const lat = Number(v.latitude);
    const lng = Number(v.longitude);
    if (!restName || !isValidCoord(lat, lng)) return;

    const nameKey = getRestaurantKey(restName);
    const alreadyExists = Array.from(spotsMap.values()).some(s =>
      (v.restaurant_id && s.id === Number(v.restaurant_id)) ||
      (getRestaurantKey(s.name) === nameKey)
    );

    if (!alreadyExists) {
      const userSpot = currentUserSpots.find(s => getRestaurantKey(s.name) === nameKey);
      const isCurrentUserSpot = Boolean(userSpot);
      const stopNumber = userSpot?.stopNumber;

      spotsMap.set(`visit_${v.id}`, {
        id: Number(v.id),
        name: restName,
        address: String(v.address || ''),
        city: String(v.city || 'Pune'),
        latitude: lat,
        longitude: lng,
        rating: Number(v.rating || 4.8),
        image: String(v.image || ''),
        total_visits: visitCounts.get(nameKey) || 1,
        featured_dish: String(v.dish_name || 'Specialty Dish'),
        isCurrentUserSpot,
        isHistorical: !isCurrentUserSpot,
        stopNumber
      });
    }
  });

  const visitedPoints = Array.from(spotsMap.values());

  // Sort: current user's spots first (Stop 1, Stop 2), then highest visits
  visitedPoints.sort((a, b) => {
    if (a.isCurrentUserSpot && b.isCurrentUserSpot) {
      return (a.stopNumber || 1) - (b.stopNumber || 1);
    }
    if (a.isCurrentUserSpot) return -1;
    if (b.isCurrentUserSpot) return 1;
    return (b.total_visits || 0) - (a.total_visits || 0);
  });

  // 7. Global aggregate queries for statistics
  const [[rCount]] = await pool.query(`
    SELECT COUNT(DISTINCT name) as c FROM (
      SELECT name FROM restaurants WHERE status = 'active'
      UNION
      SELECT restaurant_name as name FROM campaign_visits WHERE restaurant_name IS NOT NULL AND restaurant_name != ''
      UNION
      SELECT restaurant_name as name FROM tour_submissions WHERE restaurant_name IS NOT NULL AND restaurant_name != ''
    ) t
  `);

  const [[dCount]] = await pool.query(`
    SELECT COUNT(DISTINCT name) as c FROM (
      SELECT name FROM dishes WHERE status = 'active'
      UNION
      SELECT dish_name as name FROM campaign_visits WHERE dish_name IS NOT NULL AND dish_name != ''
      UNION
      SELECT dish_name as name FROM tour_submissions WHERE dish_name IS NOT NULL AND dish_name != ''
    ) t
  `);

  const [[cCount]] = await pool.query(`
    SELECT COUNT(DISTINCT city) as c FROM (
      SELECT name as city FROM locations WHERE is_active = 1
      UNION
      SELECT city FROM restaurants WHERE city IS NOT NULL AND city != ''
      UNION
      SELECT city FROM campaign_visits WHERE city IS NOT NULL AND city != ''
      UNION
      SELECT location_name as city FROM tour_submissions WHERE location_name IS NOT NULL AND location_name != ''
    ) t
  `);

  const stats = {
    foodSpots: rCount.c,
    mustTryDishes: dCount.c,
    citiesCount: cCount.c
  };

  console.log('AGGREGATE STATS:');
  console.log('Food Spots:', stats.foodSpots);
  console.log('No of Dishes:', stats.mustTryDishes);
  console.log('Cities Count:', stats.citiesCount);
  console.log('Total Map Points:', visitedPoints.length);
  console.log('Current User Spots:', currentUserSpots.length, currentUserSpots.map(s => `Stop ${s.stopNumber}: ${s.name} (${s.featured_dish})`));
  console.log('Historical Spots on Map:', visitedPoints.filter(p => !p.isCurrentUserSpot).length);

  await pool.end();
}

testFullMapData().catch(console.error);
