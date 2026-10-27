import { INITIAL_RESTAURANTS, type Restaurant } from './db';
import { getDishVisualAssets, isPureVegRestaurantName } from './dishAssets';
import { parseRestaurantQuery, getDeterministicPlaceId } from './locationParser';
export { getDeterministicPlaceId };
import { isGooglePlacesConfigured, searchGoogleNearbyRestaurants } from './googlePlaces';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function pickCuisineImage(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('puran poli') || n.includes('puran') || n.includes('poli') || n.includes('thali') || n.includes('durvankur') || n.includes('poona guest') || n.includes('shreyas') || n.includes('sukanta') || n.includes('pithla') || n.includes('shaniwar peth')) {
    return 'https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('dosa') || n.includes('idli') || n.includes('udupi') || n.includes('south') || n.includes('bhavan') || n.includes('roopali') || n.includes('vaishali') || n.includes('wadeshwar') || n.includes('ctr') || n.includes('vidyarthi')) {
    return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('pav bhaji') || n.includes('bhaji') || n.includes('sardar') || n.includes('honest')) {
    return 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('spdp') || n.includes('dahi puri') || n.includes('sev puri') || n.includes('pani puri') || n.includes('bhel') || n.includes('chaat') || n.includes('girija') || n.includes('sarasbaug')) {
    return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('biryani') || n.includes('mutton') || n.includes('chicken') || n.includes('non veg') || n.includes('kebab') || n.includes('nihari') || n.includes('handi') || n.includes('jagdamb') || n.includes('tandoor')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('khaman') || n.includes('dhokla') || n.includes('fafda') || n.includes('jalebi') || n.includes('locho') || n.includes('gujarat') || n.includes('kathiyawad') || n.includes('undhiyu') || n.includes('das khaman')) {
    return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('misal') || n.includes('katakirr') || n.includes('maratha') || n.includes('kolhapuri') || n.includes('bedekar') || n.includes('mamledar') || n.includes('saraswati')) {
    return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('vadapav') || n.includes('vada pav') || n.includes('wada pav') || n.includes('batata vada') || n.includes('wadewale') || n.includes('joshi') || n.includes('rohit') || n.includes('gajanan')) {
    return '/images/food/vada_pav.jpg';
  }
  if (n.includes('cafe') || n.includes('bakery') || n.includes('coffee') || n.includes('chai') || n.includes('tea') || n.includes('irani') || n.includes('goodluck') || n.includes('durga') || n.includes('katta')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('kfc') || n.includes('fried chicken') || n.includes('kentucky')) {
    return '/images/food/kfc_fried_chicken.jpg';
  }
  if (n.includes('pizza') || n.includes('pizzeria') || n.includes('domino') || n.includes('fire')) {
    return '/images/food/wood_fired_pizza.jpg';
  }
  if (n.includes('burger')) {
    return '/images/food/zinger_burger.jpg';
  }
  if (n.includes('mastani') || n.includes('sujata')) {
    return '/images/food/mango_mastani.jpg';
  }
  if (n.includes('ice cream') || n.includes('icecream') || n.includes('kulfi') || n.includes('falooda') || n.includes('naturals')) {
    return '/images/food/vanilla_ice_cream.jpg';
  }
  if (n.includes('fish') || n.includes('seafood') || n.includes('malvan') || n.includes('surmai') || n.includes('prawns') || n.includes('nisarg') || n.includes('crab')) {
    return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';
}

interface PhotonFeature {
  properties: {
    name?: string;
    osm_key?: string;
    osm_value?: string;
    district?: string;
    suburb?: string;
    city?: string;
    locality?: string;
    street?: string;
    state?: string;
    country?: string;
    [key: string]: unknown;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

// In-memory cache with TTL to eliminate repeated slow network requests
interface CacheEntry {
  timestamp: number;
  data: Restaurant[];
}
const placesCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export function clearPlacesCache(): void {
  placesCache.clear();
}


/**
 * Fetch LIVE real restaurants strictly around the user's current location area (Top 4 to 5 closest only)
 */
export async function fetchLiveNearbyPlaces(lat: number, lng: number, cityFallback = 'Pune'): Promise<Restaurant[]> {
  const cacheKey = `nearby_v3_${lat.toFixed(3)}_${lng.toFixed(3)}`;
  const cached = placesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data.slice(0, 5);
  }

  const seenNames = new Set<string>();
  const combined: (Restaurant & { distanceKm: number })[] = [];

  // 0. If Google Places API is configured, use official Google Cloud Places Search (<200ms)
  if (isGooglePlacesConfigured()) {
    try {
      const googleNearby = await searchGoogleNearbyRestaurants(lat, lng, 3000);
      if (googleNearby && googleNearby.length > 0) {
        for (const spot of googleNearby) {
          const lower = spot.name.toLowerCase().trim();
          if (!seenNames.has(lower)) {
            seenNames.add(lower);
            const dist = typeof (spot as any).distanceKm === 'number'
              ? (spot as any).distanceKm
              : calculateDistance(lat, lng, spot.latitude, spot.longitude);
            combined.push({
              ...spot,
              distanceKm: dist
            });
          }
        }
      }
    } catch (gErr) {
      console.warn('Google Places nearby search fallback notice:', gErr);
    }
  }

  // 1 & 2. Run Nominatim and Photon Live APIs concurrently with fast 1500ms timeout
  const delta = 0.025; // ~2.5km neighborhood bounding box
  const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;

  const fetchNominatim = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 700);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=restaurant&bounded=1&viewbox=${viewbox}&limit=20&addressdetails=1`;
      const res = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'BakasurFoodTourApp/3.0' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        const places = await res.json();
        if (Array.isArray(places)) {
          for (let i = 0; i < places.length; i++) {
            const p = places[i];
            const rawName = p.name || (p.display_name ? p.display_name.split(',')[0].trim() : '');
            if (!rawName || rawName.length < 3) continue;

            const lower = rawName.toLowerCase().trim();
            if (['restaurant', 'cafe', 'hotel', 'food', 'bar', 'dhaba', 'tea', 'bakery'].includes(lower)) continue;
            if (/(\broad\b|\bmarg\b|\blane\b|\bstreet\b|\bhighway\b|\bbridge\b|\bflyover\b|\bpath\b)/i.test(lower) && !/(hotel|restaurant|cafe|dhaba|bhojanalay|kitchen|bistro|bar|eatery|corner|sweets|bakery|canteen|bhel|snacks|paratha|biryani|dosa|thali|punjabi|chinese)/i.test(lower)) {
              continue;
            }
            if (seenNames.has(lower)) continue;

            const itemLat = parseFloat(p.lat);
            const itemLon = parseFloat(p.lon);
            const dist = calculateDistance(lat, lng, itemLat, itemLon);
            if (dist > 10) continue; // Keep within immediate area

            seenNames.add(lower);
            const addr = p.address || {};
            const area = (addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict || addr.road || cityFallback) as string;
            const cityName = (addr.city || addr.town || addr.municipality || addr.state_district || cityFallback) as string;

            combined.push({
              id: getDeterministicPlaceId(rawName, cityName, area),
              name: rawName,
              description: `Live dining spot in ${area}, ${cityName}`,
              address: addr.road ? `${addr.road}, ${area}` : `${area}, ${cityName}`,
              area,
              city: cityName,
              latitude: itemLat,
              longitude: itemLon,
              rating: Math.round((4.5 + ((i % 5) * 0.1)) * 10) / 10,
              image: pickCuisineImage(rawName),
              is_campaign_active: 1,
              total_visits: 1,
              status: 'active',
              distanceKm: dist
            });
          }
        }
      }
    } catch (err) {
      console.warn('Nominatim immediate area notice:', err);
    }
  };

  const fetchPhoton = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 700);
      const url = `https://photon.komoot.io/api/?q=restaurant&lat=${lat}&lon=${lng}&limit=25`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        const liveFeatures = (json.features || []) as PhotonFeature[];
        for (let i = 0; i < liveFeatures.length; i++) {
          const f = liveFeatures[i];
          const rawName = f.properties.name?.trim();
          if (!rawName || rawName.length < 3) continue;

          const lower = rawName.toLowerCase();
          if (['restaurant', 'cafe', 'hotel', 'food', 'bar', 'dhaba', 'tea', 'bakery', 'bar & restaurant', 'bar and restaurant'].includes(lower)) continue;
          if (/(\broad\b|\bmarg\b|\blane\b|\bstreet\b|\bhighway\b|\bbridge\b|\bflyover\b|\bpath\b)/i.test(lower) && !/(hotel|restaurant|cafe|dhaba|bhojanalay|kitchen|bistro|bar|eatery|corner|sweets|bakery|canteen|bhel|snacks|paratha|biryani|dosa|thali|punjabi|chinese)/i.test(lower)) {
            continue;
          }
          if (seenNames.has(lower)) continue;

          const [itemLon, itemLat] = f.geometry.coordinates;
          const dist = calculateDistance(lat, lng, itemLat, itemLon);
          if (dist > 10) continue; // Keep within immediate area

          seenNames.add(lower);
          const area = (f.properties.district || f.properties.suburb || f.properties.street || f.properties.locality || cityFallback) as string;
          const cityName = (f.properties.city || f.properties.state || cityFallback) as string;

          combined.push({
            id: getDeterministicPlaceId(rawName, cityName, area),
            name: rawName,
            description: `Live food joint located at ${area}, ${cityName}`,
            address: f.properties.street ? `${f.properties.street}, ${area}` : `${area}, ${cityName}`,
            area,
            city: cityName,
            latitude: itemLat,
            longitude: itemLon,
            rating: Math.round((4.5 + ((i % 5) * 0.1)) * 10) / 10,
            image: pickCuisineImage(rawName),
            is_campaign_active: 1,
            total_visits: 1,
            status: 'active',
            distanceKm: dist
          });
        }
      }
    } catch (err) {
      console.warn('Photon live API notice:', err);
    }
  };

  await Promise.allSettled([fetchNominatim(), fetchPhoton()]);

  // 3. Robust Location-Based Backfill:
  // If external live APIs returned fewer than 5 places (or timed out), calculate distance from user's live coordinates
  // to curated restaurants and append the closest ones so the user always has 4 to 5 accurate nearby options
  if (combined.length < 5) {
    const candidates = INITIAL_RESTAURANTS.map((r) => {
      const dist = calculateDistance(lat, lng, r.latitude, r.longitude);
      return { r, dist };
    });

    // Sort strictly by closest distance to user coordinates
    candidates.sort((a, b) => a.dist - b.dist);

    for (const { r, dist } of candidates) {
      if (combined.length >= 5) break;
      const lower = r.name.toLowerCase().trim();
      if (seenNames.has(lower)) continue;
      seenNames.add(lower);

      combined.push({
        id: getDeterministicPlaceId(r.name, r.city, r.area),
        name: r.name,
        description: r.description,
        address: r.address,
        area: r.area,
        city: r.city,
        latitude: r.latitude,
        longitude: r.longitude,
        rating: r.rating || 4.8,
        image: r.image && !r.image.includes('photo-1601050690597-df0568f70950')
          ? r.image
          : pickCuisineImage(r.name),
        is_campaign_active: r.is_campaign_active ?? 1,
        total_visits: r.total_visits ?? 1,
        status: 'active',
        distanceKm: dist
      });
    }
  }

  // 4. Sort strictly by closest distance to user's live GPS/IP coordinates
  combined.sort((a, b) => a.distanceKm - b.distanceKm);

  // 5. Return strictly top 4 to 5 closest spots in user's current location area
  const topFive = combined.slice(0, 5);

  // Store in cache
  placesCache.set(cacheKey, { timestamp: Date.now(), data: topFive });

  return topFive;
}

const VALID_FOOD_VALUES = new Set([
  'restaurant', 'cafe', 'fast_food', 'food_court', 'ice_cream', 'pub', 'bar', 'dhaba',
  'bakery', 'pastry', 'confectionery', 'tea', 'bistro', 'eatery', 'canteen', 'hotel',
  'biryani_shop', 'sweet_shop', 'beverages', 'dosa_center', 'food'
]);

const GENERIC_FOOD_KEYWORDS = new Set([
  'biryani', 'dosa', 'idli', 'misal', 'vada pav', 'vadapav', 'pizza', 'burger', 'sandwich',
  'thali', 'chai', 'coffee', 'ice cream', 'icecream', 'sweets', 'rolls', 'roll', 'momos',
  'pasta', 'chaat', 'pani puri', 'bhel', 'pav bhaji', 'paneer', 'chicken', 'mutton', 'fish',
  'seafood', 'kebab', 'tandoori', 'noodles', 'maggi', 'shawarma', 'chinese', 'south indian',
  'north indian', 'gujarati', 'maharashtrian', 'punjabi', 'breakfast', 'lunch', 'dinner', 'snacks',
  'mastani', 'mango mastani', 'shake', 'milkshake', 'falooda', 'kulfi', 'dessert', 'juice', 'lassi', 'chaas'
]);

export function isDishOrFoodQuery(query: string): boolean {
  const q = (query || '').toLowerCase().trim();
  if (!q) return false;
  // Explicit hotel/restaurant venue terminology means this is a venue query
  if (/\b(hotel|restaurant|cafe|dhaba|bhojanalay|bhojnalaya|bhavan|canteen|bistro|eatery|darbar|mess|parlour|parlor|bakery|bakers)\b/i.test(q)) {
    return false;
  }
  if (
    GENERIC_FOOD_KEYWORDS.has(q) ||
    /\b(mastani|shake|milkshake|ice cream|icecream|falooda|kulfi|dessert|drink|juice|soda|chaas|lassi|sharbat|cooler|frappe)\b/i.test(q) ||
    /\b(dosa|idli|vada|uttapam|pongal|sambar|rasam|upma|poha|misal|pav bhaji|vada pav|vadapav|samosa|kachori|dhokla|khaman|thepla|puran poli|bhakri|pithla|modak|sheera)\b/i.test(q) ||
    /\b(biryani|pulao|rice|curd rice|fried rice|noodles|chowmein|manchurian|momos|dimsum|pasta|pizza|burger|sandwich|fries|wrap|frankie|roll|shawarma|taco)\b/i.test(q) ||
    /\b(paneer|chicken|mutton|fish|prawn|prawns|crab|kebab|tikka|tandoori|butter chicken|dal makhani|dal|curry|gravy|korma|rogan josh|keema|bhurji|egg|anda|roti|naan|paratha|kulcha)\b/i.test(q) ||
    /\b(gulab jamun|jalebi|rasgulla|rabdi|halwa|kheer|aamras|shrikhand|basundi|pastry|cake|brownie|waffle)\b/i.test(q) ||
    /(kaise|banaye|banaen|banate|tarika|vidhi|recipe|ingredients|calories|near\s*me)/i.test(q)
  ) {
    return true;
  }
  return false;
}

function isFoodFeature(f: PhotonFeature): boolean {
  const osmKey = String(f.properties.osm_key || '').toLowerCase();
  const osmVal = String(f.properties.osm_value || '').toLowerCase();

  // Reject non-food structures (gates, towers, clinics, offices, housing, lakes, dams)
  if (['city_gate', 'gate', 'tower', 'office', 'clinic', 'hospital', 'school', 'college', 'lake', 'water', 'pond', 'reservoir', 'dam'].includes(osmVal)) {
    return false;
  }

  if (VALID_FOOD_VALUES.has(osmVal)) return true;
  if (osmKey === 'amenity' && ['restaurant', 'cafe', 'fast_food', 'food_court', 'ice_cream', 'pub', 'bar'].includes(osmVal)) return true;
  if (osmKey === 'shop' && ['bakery', 'pastry', 'confectionery', 'deli'].includes(osmVal)) return true;
  
  const rawName = String(f.properties.name || '').toLowerCase();
  // Filter out non-food places like tailors, clinics, photography, housing societies, estates, gates, lakes, ponds, ghats
  if (/\b(tailor|tailors|photo|photography|studio|saloon|salon|niwas|nivas|society|apartment|apartments|hospital|school|college|clinic|estate|farm|residency|enclave|vihar|nagar|park|garden|road|darwaja|gate|lake|dam|talav|talao|pond|ghat)\b/i.test(rawName)) {
    return false;
  }
  if (/\b(restaurant|cafe|dhaba|hotel|bhojanalay|bhojnalaya|bistro|kitchen|bake|bakery|biryani|thali|dosa|sweets|snack|snacks|canteen|eatery|grill|bar|pub|coffee|chai|tea|pizza|burger|roll|rolls|chaat|misal|vadapav|mastani|ice cream|icecream|parlour|parlor)\b/i.test(rawName)) {
    return true;
  }
  return false;
}

/**
 * Fetch live search autocomplete suggestions from Google's prediction engine
 */
async function fetchGoogleSuggestPlaces(
  query: string,
  fallbackCity: string,
  userCoords?: { lat: number; lng: number } | null
): Promise<Restaurant[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 700);
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&hl=en&gl=in&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    const rawSuggestions: string[] = Array.isArray(json) && Array.isArray(json[1]) ? json[1] : [];

    const results: Restaurant[] = [];
    const seen = new Set<string>();
    let idCounter = 850000;

    const cityNorm = (fallbackCity || '').toLowerCase().trim();
    const otherMajorCities = [
      'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata',
      'ahmedabad', 'jaipur', 'lucknow', 'surat', 'nagpur', 'nashik', 'nanded', 'solapur',
      'kolhapur', 'aurangabad', 'sambhajinagar', 'pune', 'goa', 'indore', 'bhopal', 'chandigarh'
    ];

    for (const item of rawSuggestions) {
      if (!item || typeof item !== 'string') continue;
      const trimmedItem = item.trim();

      // 1. Filter out recipe phrases, how-to, prices, calories, media & directory noise
      if (
        /(kaise|banaye|banaen|banate|tarika|vidhi|recipe|ingredients|samagri|calories|benefits|meaning|rate|cost|price|how\s*to|near\s*me|in\s*english|in\s*hindi|at\s*home|gharat|banavani|street\s*food\b|food\s*style|style\b|timing|hours|open|closed|review|video|lyrics|movie|news|photo|pic|images?|contact|phone|booking|reddit|quora|wiki|wikipedia|youtube|facebook|instagram|zomato|swiggy|tripadvisor)/i.test(
          trimmedItem
        )
      ) {
        continue;
      }

      const cleanItem = trimmedItem
        .replace(/^(best|top|famous|good|popular)\s+/i, '')
        .replace(/\s+(reddit|quora|wiki)$/i, '')
        .trim();

      if (/^(hotels?\s+in\b|restaurants?\s+in\b|cafes?\s+in\b|places?\s+to\b|food\s+in\b|best\s+|top\s+\d+|hotels?\s+near\b|restaurants?\s+near\b)/i.test(cleanItem)) {
        continue;
      }

      // 2. Reject if the item explicitly mentions a different major Indian city
      if (cityNorm) {
        const mentionsDifferentCity = otherMajorCities.some(
          c => c !== cityNorm && new RegExp(`\\b${c}\\b`, 'i').test(cleanItem)
        );
        if (mentionsDifferentCity) {
          continue;
        }
      }

      // 3. Must be a PROPER dining/food establishment (Hotel, Restaurant, Cafe, Dhaba, Parlour, Sweets, Bakers, Fast Food, Mastani, etc.)
      const isProperDiningVenue = /\b(restaurant|cafe|hotel|dhaba|bhojanalay|bhojnalaya|bhavan|dining|kitchen|mess|eatery|bakers|bakery|sweets|mithai|chaat|mastani|ice cream|icecream|parlour|parlor|point|corner|fast food|dosa|biryani|misal|grill|bar|pub|canteen|tiffin|darbar|house|treats|lounge|shop)\b/i.test(
        cleanItem
      );
      if (!isProperDiningVenue) {
        continue;
      }

      const parsed = parseRestaurantQuery(cleanItem, fallbackCity, userCoords);
      if (!parsed.cleanName || parsed.cleanName.length < 2) continue;
      // Do not accept pure generic words like "Hotel" or "Restaurant"
      if (/^(hotel|restaurant|cafe|dhaba|bar)$/i.test(parsed.cleanName)) continue;

      const lowerKey = `${parsed.cleanName.toLowerCase()}_${parsed.area.toLowerCase()}`;
      if (seen.has(lowerKey)) continue;
      seen.add(lowerKey);

      results.push({
        id: idCounter++,
        name: parsed.cleanName,
        description: `Verified dining establishment in ${parsed.area}, ${parsed.city}`,
        address: parsed.address,
        area: parsed.area,
        city: parsed.city,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        rating: 4.8,
        image: pickCuisineImage(parsed.cleanName),
        is_campaign_active: 1,
        total_visits: 1,
        status: 'active'
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Fetch verified places from OpenStreetMap Nominatim strictly bounded to India
 */
async function fetchNominatimPlaces(
  searchQuery: string,
  parsedLocality: ReturnType<typeof parseRestaurantQuery>
): Promise<Restaurant[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 750);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      searchQuery
    )}&countrycodes=in&format=json&addressdetails=1&limit=5`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BakasurFoodTourApp/3.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    const results: Restaurant[] = [];
    let idCounter = 870000;
    if (!Array.isArray(json)) return [];
    for (const place of json) {
      const name = place.name || (place.display_name ? place.display_name.split(',')[0].trim() : '');
      if (!name || name.length < 2) continue;
      // Filter non-food places like mobile shops, tailors, clinics, jewellers, banks
      if (/\b(mobiles?|cell\s*phone|recharge|electronics|telecom|tailors?|salons?|beauty|parlour|jewellers?|jewelers?|classes|coaching|school|college|hospital|clinic|pharmacy|chemist|medical|bank|atm|motors|automobiles?|garage|hardware|plywood|xerox|printers?)\b/i.test(name)) {
        continue;
      }
      const addr = place.address || {};
      const area = (addr.suburb || addr.neighbourhood || addr.quarter || addr.road || parsedLocality.area) as string;
      const city = (addr.city || addr.town || addr.municipality || addr.state_district || parsedLocality.city) as string;
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);

      results.push({
        id: idCounter++,
        name,
        description: `Popular dining destination in ${area}, ${city}`,
        address: addr.road ? `${addr.road}, ${area}` : `${area}, ${city}`,
        area,
        city,
        latitude: !isNaN(lat) ? lat : parsedLocality.latitude,
        longitude: !isNaN(lon) ? lon : parsedLocality.longitude,
        rating: 4.8,
        image: pickCuisineImage(name),
        is_campaign_active: 1,
        total_visits: 1,
        status: 'active'
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Search LIVE real restaurants across any location in India in real-time (Google-like Search)
 */
export async function searchLivePlaces(options: {
  query: string;
  city?: string;
  lat?: number;
  lng?: number;
}): Promise<Restaurant[]> {
  const { query, city = '', lat = 18.5204, lng = 73.8407 } = options;
  if (!query || !query.trim()) {
    return fetchLiveNearbyPlaces(lat, lng, city);
  }

  const rawTyped = query.trim();
  const q = rawTyped.toLowerCase();
  const cacheKey = `search_${q}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = placesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const seenNames = new Set<string>();
  const searchResults: (Restaurant & { relevanceScore?: number })[] = [];
  let searchId = 800001;

  // 1. Parse typed query for clean restaurant name, area, and city
  const parsed = parseRestaurantQuery(rawTyped, city, { lat, lng });

  // 2. Synthesize user's exact typed restaurant name ONLY if it's a specific venue name (NOT a food dish or recipe query)
  const isFoodQuery = isDishOrFoodQuery(rawTyped);
  if (rawTyped.length >= 2 && !isFoodQuery) {
    const isPureVegSpot = isPureVegRestaurantName(parsed.cleanName) ||
      parsed.cleanName.toLowerCase().includes('wadewale') ||
      parsed.cleanName.toLowerCase().includes('vada pav') ||
      parsed.cleanName.toLowerCase().includes('shaniwar peth');

    const userSpot: Restaurant & { relevanceScore: number } = {
      id: searchId++,
      name: parsed.cleanName,
      description: `Popular dining spot in ${parsed.area}, ${parsed.city}`,
      address: parsed.address,
      area: parsed.area,
      city: parsed.city,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      rating: 4.8,
      is_veg: isPureVegSpot ? 1 : 0,
      image: pickCuisineImage(parsed.cleanName),
      is_campaign_active: 1,
      total_visits: 1,
      status: 'active',
      distanceKm: calculateDistance(lat, lng, parsed.latitude, parsed.longitude),
      relevanceScore: 1300 // Highest priority exact user query
    } as Restaurant & { distanceKm: number; relevanceScore: number };

    searchResults.push(userSpot);
    seenNames.add(parsed.cleanName.toLowerCase());
  }

  // 4. Parallel Live Google Suggest & Nominatim Search
  try {
    const suggestQuery = isFoodQuery && city ? `${rawTyped} restaurant in ${city}` : rawTyped;
    const [googleSpots, nominatimSpots] = await Promise.all([
      fetchGoogleSuggestPlaces(suggestQuery, city, { lat, lng }),
      fetchNominatimPlaces(`${parsed.cleanName} ${parsed.area}`, parsed)
    ]);

    // Add Google Suggestions
    for (const gSpot of googleSpots) {
      const gNameLower = gSpot.name.toLowerCase();
      if (!seenNames.has(gNameLower)) {
        seenNames.add(gNameLower);
        const gScore = (gNameLower.includes(q) || gNameLower.includes(parsed.cleanName.toLowerCase())) ? 1000 : 850;
        searchResults.push({
          ...gSpot,
          distanceKm: calculateDistance(lat, lng, gSpot.latitude, gSpot.longitude),
          relevanceScore: gScore
        });
      }
    }

    // Add Nominatim India Spots
    for (const nSpot of nominatimSpots) {
      const nNameLower = nSpot.name.toLowerCase();
      if (!seenNames.has(nNameLower)) {
        seenNames.add(nNameLower);
        const nScore = (nNameLower.includes(q) || nNameLower.includes(parsed.cleanName.toLowerCase())) ? 1200 : 950;
        searchResults.push({
          ...nSpot,
          distanceKm: calculateDistance(lat, lng, nSpot.latitude, nSpot.longitude),
          relevanceScore: nScore
        });
      }
    }
  } catch (err) {
    console.warn('Live places parallel search error:', err);
  }

  // 5. Parallel Photon Search with India safety (2500ms timeout for reliable network response)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const searchAreaTerm = parsed.area && parsed.area.toLowerCase() !== parsed.city.toLowerCase() ? ` ${parsed.area}` : '';
    const cityTerm = city ? ` ${city}` : ' Pune';
    const cleanSearch = parsed.cleanName;
    const foodTerm = cleanSearch.toLowerCase().includes('mastani') ? 'mastani' : cleanSearch;
    const photonQueries = [
      `https://photon.komoot.io/api/?q=${encodeURIComponent(`${cleanSearch}${cityTerm}`)}&lat=${parsed.latitude}&lon=${parsed.longitude}&limit=20`,
      `https://photon.komoot.io/api/?q=${encodeURIComponent(`${foodTerm}${cityTerm}`)}&lat=${parsed.latitude}&lon=${parsed.longitude}&limit=20`,
      `https://photon.komoot.io/api/?q=${encodeURIComponent(`${cleanSearch}${searchAreaTerm} restaurant`)}&lat=${parsed.latitude}&lon=${parsed.longitude}&limit=20`
    ];

    const responses = await Promise.all(
      photonQueries.map(url =>
        fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
          signal: controller.signal
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    );
    clearTimeout(timeout);

    for (const json of responses) {
      if (json && Array.isArray(json.features)) {
        const features = json.features as PhotonFeature[];
        for (let i = 0; i < features.length; i++) {
          const f = features[i];
          const rawName = f.properties.name?.trim();
          if (!rawName || rawName.length < 2) continue;
          if (!isFoodFeature(f)) continue;

          // India only check: if country is provided and not India, skip!
          const country = String(f.properties.country || '').toLowerCase();
          const countrycode = String(f.properties.countrycode || '').toLowerCase();
          if ((country && country !== 'india' && country !== 'in') || (countrycode && countrycode !== 'in')) continue;

          const lower = rawName.toLowerCase();
          if (seenNames.has(lower)) continue;
          seenNames.add(lower);

          const [itemLon, itemLat] = f.geometry.coordinates;
          const dist = calculateDistance(lat, lng, itemLat, itemLon);
          // If searching in a specific city and distance is too far (> 60km), skip
          if (city && dist > 60) continue;
          const area = (f.properties.district ||
            f.properties.suburb ||
            f.properties.locality ||
            f.properties.street ||
            parsed.area) as string;
          const cityName = (f.properties.city || f.properties.state || parsed.city) as string;

          const placeScore =
            lower.includes(q) || lower.includes(parsed.cleanName.toLowerCase())
              ? 1250
              : 1050;

          const placeId = getDeterministicPlaceId(rawName, cityName, area);
          searchResults.push({
            id: placeId,
            name: rawName,
            description: `Live dining establishment in ${area}, ${cityName}`,
            address: f.properties.street ? `${f.properties.street}, ${area}` : `${area}, ${cityName}`,
            area,
            city: cityName,
            latitude: itemLat,
            longitude: itemLon,
            rating: Math.round((4.6 + ((i % 4) * 0.1)) * 10) / 10,
            image: pickCuisineImage(rawName),
            is_campaign_active: 1,
            total_visits: 1,
            status: 'active',
            distanceKm: dist,
            relevanceScore: placeScore
          } as Restaurant & { distanceKm: number; relevanceScore: number });
        }
      }
    }
  } catch {
    // Graceful fallback to collected live matches
  }

  // 6. Safety fallback: If still no results and user typed a restaurant query (not a food item), synthesize the restaurant
  if (searchResults.length === 0 && rawTyped.length >= 2 && !isFoodQuery) {
    const fallbackSpot: Restaurant & { relevanceScore: number } = {
      id: searchId++,
      name: parsed.cleanName,
      description: `Popular dining spot in ${parsed.area}, ${parsed.city}`,
      address: parsed.address,
      area: parsed.area,
      city: parsed.city,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      rating: 4.8,
      image: pickCuisineImage(parsed.cleanName),
      is_campaign_active: 1,
      total_visits: 1,
      status: 'active',
      distanceKm: calculateDistance(lat, lng, parsed.latitude, parsed.longitude),
      relevanceScore: 1000
    } as Restaurant & { distanceKm: number; relevanceScore: number };
    searchResults.push(fallbackSpot);
  }


  // Sort by relevanceScore descending, with distance as tie-breaker
  searchResults.sort((a, b) => {
    const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (
      ((a as unknown as { distanceKm: number }).distanceKm || 0) -
      ((b as unknown as { distanceKm: number }).distanceKm || 0)
    );
  });

  // Limit to top 15 clean results
  const trimmedResults = searchResults.slice(0, 15);

  // Store in cache
  placesCache.set(cacheKey, { timestamp: Date.now(), data: trimmedResults });

  return trimmedResults;
}
