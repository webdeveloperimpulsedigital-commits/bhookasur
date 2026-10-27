const mysql = require('mysql2/promise');

async function testGlobalMapData() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bakasur_food_tour_1',
    port: Number(process.env.MYSQL_PORT) || 3306
  });

  const sessionId = 'bkt_sess_1789123858588_mhgdge9d060'; // The session from user's screenshot!

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

  // 1. Fetch all active restaurants from MySQL restaurants table with real coordinates
  const [restRows] = await pool.query(`
    SELECT r.id, r.name, r.address, r.area, r.city,
           CAST(r.latitude AS DECIMAL(10,6)) as latitude,
           CAST(r.longitude AS DECIMAL(10,6)) as longitude,
           COALESCE(r.rating, 4.8) as rating,
           COALESCE(r.image, '') as image,
           COALESCE(r.total_visits, 1) as total_visits,
           COALESCE(
             (SELECT d.name FROM dishes d WHERE d.restaurant_id = r.id ORDER BY d.is_recommended DESC, d.popularity DESC LIMIT 1),
             'Specialty Dish'
           ) as featured_dish
    FROM restaurants r
    WHERE r.status = 'active' AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
    ORDER BY r.total_visits DESC
  `);

  // 2. Fetch all real user-visited restaurants from MySQL campaign_visits
  const [visitRows] = await pool.query(`
    SELECT cv.id, cv.session_id, cv.restaurant_id, cv.dish_id, cv.city, cv.round_number,
           CAST(COALESCE(cv.latitude, r.latitude, 18.5204) AS DECIMAL(10,6)) as latitude, 
           CAST(COALESCE(cv.longitude, r.longitude, 73.8407) AS DECIMAL(10,6)) as longitude, 
           cv.visited_at,
           COALESCE(cv.restaurant_name, r.name) as restaurant_name,
           COALESCE(cv.dish_name, d.name, 'Specialty Dish') as dish_name,
           COALESCE(r.rating, 4.8) as rating,
           COALESCE(r.image, '') as image
    FROM campaign_visits cv
    LEFT JOIN restaurants r ON cv.restaurant_id = r.id
    LEFT JOIN dishes d ON cv.dish_id = d.id
    WHERE cv.restaurant_name IS NOT NULL AND cv.restaurant_name != ''
    ORDER BY cv.visited_at ASC, cv.id ASC
  `);

  // 3. Current user's spots strictly for this sessionId
  let currentUserSpots = [];
  if (sessionId) {
    const userVisits = visitRows.filter(v => v.session_id === sessionId);
    const roundMap = new Map();
    userVisits.forEach(v => {
      const roundNum = Number(v.round_number) || 1;
      roundMap.set(roundNum, v);
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

  // 4. Visit count map from campaign_visits
  const visitCountMap = new Map();
  visitRows.forEach(v => {
    const restName = String(v.restaurant_name || '');
    if (!restName) return;
    const key = getRestaurantKey(restName);
    visitCountMap.set(key, (visitCountMap.get(key) || 0) + 1);
  });

  // 5. Build unique spots map
  const spotsMap = new Map();

  // First, add all active restaurants from DB (existing food spots)
  restRows.forEach(r => {
    const restName = String(r.name || '');
    if (!restName || !isValidCoord(Number(r.latitude), Number(r.longitude))) return;

    const key = getRestaurantKey(restName);
    const stopNumber = currentUserKeysMap.get(key);
    const isCurrentUserSpot = stopNumber !== undefined;
    const additionalVisits = visitCountMap.get(key) || 0;
    const totalVisits = Math.max(Number(r.total_visits || 1), additionalVisits);

    let featured_dish = String(r.featured_dish || 'Specialty Dish');
    if (isCurrentUserSpot) {
      const uSpot = currentUserSpots.find(s => s.stopNumber === stopNumber);
      if (uSpot && uSpot.featured_dish) featured_dish = uSpot.featured_dish;
    }

    spotsMap.set(key, {
      id: Number(r.id),
      name: restName,
      address: String(r.address || ''),
      city: String(r.city || 'Pune'),
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      rating: Number(r.rating || 4.8),
      image: String(r.image || ''),
      total_visits: totalVisits,
      featured_dish,
      isCurrentUserSpot,
      stopNumber
    });
  });

  // Next, include any campaign visits that might not be in restaurants table yet
  visitRows.forEach(v => {
    const restName = String(v.restaurant_name || '');
    if (!restName || !isValidCoord(Number(v.latitude), Number(v.longitude))) return;

    const key = getRestaurantKey(restName);
    const stopNumber = currentUserKeysMap.get(key);
    const isCurrentUserSpot = stopNumber !== undefined;

    if (!spotsMap.has(key)) {
      spotsMap.set(key, {
        id: Number(v.id),
        name: restName,
        address: '',
        city: String(v.city || 'Pune'),
        latitude: Number(v.latitude),
        longitude: Number(v.longitude),
        rating: Number(v.rating || 4.8),
        image: String(v.image || ''),
        total_visits: visitCountMap.get(key) || 1,
        featured_dish: String(v.dish_name || 'Specialty Dish'),
        isCurrentUserSpot,
        stopNumber
      });
    } else if (isCurrentUserSpot) {
      const existing = spotsMap.get(key);
      spotsMap.set(key, {
        ...existing,
        featured_dish: String(v.dish_name || existing.featured_dish),
        isCurrentUserSpot: true,
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

  // 6. Global statistics directly from MySQL database aggregation
  const [[rCount]] = await pool.query(`
    SELECT COUNT(DISTINCT name) as c FROM (
      SELECT name FROM restaurants WHERE status = 'active'
      UNION
      SELECT restaurant_name as name FROM campaign_visits WHERE restaurant_name IS NOT NULL AND restaurant_name != ''
    ) as all_spots
  `);

  const [[dCount]] = await pool.query(`
    SELECT COUNT(DISTINCT name) as c FROM (
      SELECT name FROM dishes WHERE status = 'active'
      UNION
      SELECT dish_name as name FROM campaign_visits WHERE dish_name IS NOT NULL AND dish_name != ''
    ) as all_dishes
  `);

  const [[cCount]] = await pool.query(`
    SELECT COUNT(DISTINCT city) as c FROM (
      SELECT name as city FROM locations WHERE is_active = 1
      UNION
      SELECT city FROM restaurants WHERE city IS NOT NULL AND city != ''
      UNION
      SELECT city FROM campaign_visits WHERE city IS NOT NULL AND city != ''
    ) as all_cities
  `);

  const stats = {
    foodSpots: rCount.c,
    mustTryDishes: dCount.c,
    citiesCount: cCount.c
  };

  console.log('STATS TO RETURN:');
  console.log('- Food Spots Count:', stats.foodSpots);
  console.log('- Dishes Count:', stats.mustTryDishes);
  console.log('- Cities Count:', stats.citiesCount);
  console.log('- Total Map Points plotted:', visitedPoints.length);
  console.log('- Current User Spots (Blue):', currentUserSpots.length, currentUserSpots.map(s => `Stop ${s.stopNumber}: ${s.name}`));
  console.log('- Historical Visited Spots (Red):', visitedPoints.filter(p => !p.isCurrentUserSpot).length);

  await pool.end();
}

testGlobalMapData().catch(e => {
  console.error(e);
  process.exit(1);
});
