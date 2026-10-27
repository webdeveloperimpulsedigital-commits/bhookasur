const mysql = require('mysql2/promise');

function getRestaurantGroupKey(name) {
  if (!name) return 'unknown';
  const baseName = name.split(/[,-]/)[0].trim();
  const clean = baseName.toLowerCase()
    .replace(/\b(hotel|restaurant|pure veg|veg|cafe|stall|bhel|snacks|the|special|bar|and)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  return clean || baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
  const pool = mysql.createPool({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'bakasur_food_tour_1' });
  const [visitRows] = await pool.query(`
    SELECT cv.id, cv.session_id, cv.restaurant_id, cv.dish_id, cv.city, 
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
    ORDER BY cv.id DESC
  `);

  const visitCountMap = new Map();
  visitRows.forEach(v => {
    const restName = String(v.restaurant_name || '');
    const key = getRestaurantGroupKey(restName);
    visitCountMap.set(key, (visitCountMap.get(key) || 0) + 1);
  });

  const groupedPoints = new Map();
  visitRows.forEach(v => {
    const restName = String(v.restaurant_name || '');
    if (!restName || !v.latitude || !v.longitude) return;
    const key = getRestaurantGroupKey(restName);
    const totalVisits = visitCountMap.get(key) || 1;

    if (!groupedPoints.has(key)) {
      groupedPoints.set(key, {
        id: Number(v.id),
        name: restName,
        city: String(v.city || 'Pune'),
        latitude: Number(v.latitude),
        longitude: Number(v.longitude),
        total_visits: totalVisits,
        featured_dish: String(v.dish_name || 'Specialty Dish')
      });
    }
  });

  const combinedPoints = Array.from(groupedPoints.values());
  console.log(`Total Unique Spots: ${combinedPoints.length}`);
  combinedPoints.forEach(p => {
    console.log(`📍 ${p.name} (${p.city}) -> Total Visits: ${p.total_visits} | Dish: ${p.featured_dish}`);
  });

  await pool.end();
}
run();
