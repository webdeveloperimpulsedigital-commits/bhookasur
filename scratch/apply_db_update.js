const fs = require('fs');

const dbFile = 'lib/db.ts';
let code = fs.readFileSync(dbFile, 'utf8');

const targetStart = '  async getMapData(sessionId?: string) {';
const targetEnd = '  // PARTICIPANTS & USER REGISTRATION';

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find markers:', { startIndex, endIndex });
  process.exit(1);
}

const replacement = `  async getMapData(sessionId?: string) {
    let visitedPoints: any[] = [];
    let dbFoodSpots = 0;
    let dbDishes = 0;
    let dbCities = 0;
    let currentUserSpots: any[] = [];

    // Helper to normalize restaurant names for accurate visit grouping & matching
    const getRestaurantKey = (name: string): string => {
      if (!name) return 'unknown';
      const baseName = name.split(/[,-]/)[0].trim();
      const clean = baseName.toLowerCase()
        .replace(/\\b(hotel|restaurant|pure veg|veg|cafe|stall|bhel|snacks|the|special|bar|and)\\b/gi, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
      return clean || baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    try {
      const pool = getMySQLPool();
      if (pool) {
        // 1. Fetch all active restaurants from MySQL restaurants table with real coordinates & visits
        const [restRows] = await pool.query<mysql.RowDataPacket[]>(\`
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
        \`);

        // 2. Fetch real user-searched & visited restaurants from MySQL campaign_visits
        const [visitRows] = await pool.query<mysql.RowDataPacket[]>(\`
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
        \`);

        // 3. Determine current user's visited spots strictly for this session_id
        if (sessionId) {
          const userVisits = visitRows.filter(v => v.session_id === sessionId);
          // Group by round_number: for each round, take the latest visit
          const roundMap = new Map<number, any>();
          userVisits.forEach(v => {
            const roundNum = Number(v.round_number) || 1;
            roundMap.set(roundNum, v);
          });

          // Sort rounds: round 1 -> Stop 1, round 2 -> Stop 2, etc.
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

        const currentUserKeysMap = new Map<string, number>();
        currentUserSpots.forEach(s => {
          currentUserKeysMap.set(getRestaurantKey(s.name), s.stopNumber);
        });

        // 4. Calculate actual visit counts from campaign_visits per restaurant
        const visitCountMap = new Map<string, number>();
        visitRows.forEach(v => {
          const restName = String(v.restaurant_name || '');
          if (!restName) return;
          const key = getRestaurantKey(restName);
          visitCountMap.set(key, (visitCountMap.get(key) || 0) + 1);
        });

        // 5. Group into unique map pins with verified database visit counts
        const spotsMap = new Map<string, any>();

        // First, add all active restaurants from DB (existing food spots)
        restRows.forEach(r => {
          const restName = String(r.name || '');
          if (!restName || !r.latitude || !r.longitude) return;

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
          if (!restName || !v.latitude || !v.longitude) return;

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
            // Preserve user's latest stop info
            const existing = spotsMap.get(key);
            spotsMap.set(key, {
              ...existing,
              featured_dish: String(v.dish_name || existing.featured_dish),
              isCurrentUserSpot: true,
              stopNumber
            });
          }
        });

        visitedPoints = Array.from(spotsMap.values());

        // 6. Dynamic database statistics directly from MySQL
        const [[rCount]] = await pool.query<mysql.RowDataPacket[]>(\`
          SELECT COUNT(DISTINCT name) as c FROM (
            SELECT name FROM restaurants WHERE status = 'active'
            UNION
            SELECT restaurant_name as name FROM campaign_visits WHERE restaurant_name IS NOT NULL AND restaurant_name != ''
          ) as all_spots
        \`);

        const [[dCount]] = await pool.query<mysql.RowDataPacket[]>(\`
          SELECT COUNT(*) as c FROM dishes WHERE status = 'active'
        \`);

        const [[cCount]] = await pool.query<mysql.RowDataPacket[]>(\`
          SELECT COUNT(DISTINCT city) as c FROM (
            SELECT city FROM restaurants WHERE status = 'active' AND city IS NOT NULL AND city != ''
            UNION
            SELECT city FROM campaign_visits WHERE city IS NOT NULL AND city != ''
          ) as all_cities
        \`);

        dbFoodSpots = Number(rCount?.c || visitedPoints.length || 0);
        dbDishes = Number(dCount?.c || 0);
        dbCities = Number(cCount?.c || 0) || new Set(visitedPoints.map(p => p.city)).size;
      }
    } catch (err) {
      console.warn('MySQL getMapData query warning:', err);
    }

    // Fallback if MySQL pool was unavailable or returned empty
    if (visitedPoints.length === 0 && memoryStore.restaurants.length > 0) {
      visitedPoints = memoryStore.restaurants.map((r, idx) => ({
        id: r.id,
        name: r.name,
        address: r.address || '',
        city: r.city,
        latitude: r.latitude,
        longitude: r.longitude,
        rating: r.rating || 4.8,
        image: r.image || '',
        total_visits: r.total_visits || 1,
        featured_dish: 'Specialty Dish',
        isCurrentUserSpot: false,
        stopNumber: undefined
      }));
      dbFoodSpots = memoryStore.restaurants.length;
      dbDishes = memoryStore.dishes?.length || 94;
      dbCities = new Set(memoryStore.restaurants.map(r => r.city)).size;
    }

    // Sort: Current user's spots first (Stop 1, Stop 2), followed by highest visits
    visitedPoints.sort((a, b) => {
      if (a.isCurrentUserSpot && b.isCurrentUserSpot) {
        return (a.stopNumber || 1) - (b.stopNumber || 1);
      }
      if (a.isCurrentUserSpot) return -1;
      if (b.isCurrentUserSpot) return 1;
      return (b.total_visits || 0) - (a.total_visits || 0);
    });

    return {
      points: visitedPoints,
      stats: {
        foodSpots: dbFoodSpots,
        mustTryDishes: dbDishes,
        citiesCount: dbCities
      },
      currentUserPoint: currentUserSpots[0] || null,
      currentUserSpots
    };
  },

  `;

const newCode = code.slice(0, startIndex) + replacement + code.slice(endIndex);
fs.writeFileSync(dbFile, newCode, 'utf8');
console.log('lib/db.ts updated successfully!');
