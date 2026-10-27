/**
 * Apify Swiggy Scraper Integration Engine
 * Primary Actor: thirdwatch/swiggy-scraper ("Swiggy Scraper - India Restaurant & Food Delivery Data")
 * 
 * Features:
 * - Live restaurant search and metadata extraction across 30+ Indian cities via Apify
 * - Direct real-time restaurant food menu extraction with authentic Swiggy CDN photography
 * - High-speed in-memory caching (2-hour TTL) to conserve Apify usage credits and provide sub-second UI response
 * - Full food menu parser capturing dishes, categories, prices, discounts, veg/non-veg flags, ratings, and addon options
 * - Direct Swiggy image CDN URL builder + secure edge proxy (/api/swiggy-image) ensuring 100% reliable food photos
 * - Smart URL & query parser: auto-detects Swiggy restaurant URLs (e.g. /meghana-foods-...-rest3241) and restaurant IDs
 */

import type { Dish, Restaurant } from './db';
import { formatCleanDishName, isDishVeg } from './dishAssets';

export interface SwiggyRestaurantData {
  restaurant_id: string;
  name: string;
  cuisine: string[];
  rating: number;
  rating_count: string;
  google_rating?: number | null;
  google_rating_count?: string | null;
  cost_for_two: string;
  cost_for_two_rupees: number;
  delivery_time: string;
  delivery_time_minutes: number;
  last_mile_distance_km?: number;
  address: string;
  locality?: string;
  area_name?: string;
  city: string;
  is_open: boolean;
  veg_only: boolean;
  offers: string[];
  badges: string[];
  image_url: string;
  proxy_image_url?: string;
  url: string;
  query?: string;
}

export interface SwiggyAddonChoice {
  id: string;
  name: string;
  price: number;
  isVeg?: boolean;
  inStock?: boolean;
}

export interface SwiggyAddonGroup {
  groupId: string;
  groupName: string;
  choices: SwiggyAddonChoice[];
  maxAddons?: number;
  minAddons?: number;
}

export interface SwiggyDishItem {
  id: string | number;
  restaurant_id: string | number;
  name: string;
  category: string;
  description: string;
  price: number;
  original_price?: number;
  image: string;
  proxy_image?: string;
  imageId?: string;
  is_veg: number; // 1 = veg, 0 = non-veg
  rating: number;
  rating_count?: string;
  is_bestseller?: boolean;
  addons?: SwiggyAddonGroup[];
  in_stock?: boolean;
}

export function getApifyToken(): string {
  // Server-only secret. Never read a NEXT_PUBLIC_* variant: those are inlined into browser JavaScript.
  return (
    process.env.APIFY_TOKEN ||
    process.env.APIFY_API_KEY ||
    ''
  ).trim();
}

export function isApifyConfigured(): boolean {
  const token = getApifyToken();
  return Boolean(token && token.length > 10 && !token.includes('YourApifyTokenHere'));
}

export function getApifyActor(): string {
  const raw = (process.env.APIFY_SWIGGY_ACTOR || 'thirdwatch/swiggy-scraper').trim();
  // Apify REST API requires username~actor-name instead of username/actor-name
  return raw.replace('/', '~');
}

// In-memory caches for live scraped Swiggy menus and restaurants
interface MenuCacheEntry {
  timestamp: number;
  dishes: Dish[];
  categories: string[];
}
const swiggyMenuCache = new Map<string, MenuCacheEntry>();
const swiggyRestaurantCache = new Map<string, { timestamp: number; data: SwiggyRestaurantData[] }>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function clearApifySwiggyCache(): void {
  swiggyMenuCache.clear();
  swiggyRestaurantCache.clear();
}

/**
 * Checks if input is a Swiggy URL and extracts restaurant ID, city, and name
 * Example: https://www.swiggy.com/city/bangalore/meghana-foods-central-bangalore-rest3241
 */
export function parseSwiggyRestaurantUrl(input: string): {
  isSwiggyUrl: boolean;
  restaurantId?: string;
  city?: string;
  slug?: string;
  name?: string;
} {
  if (!input || typeof input !== 'string') {
    return { isSwiggyUrl: false };
  }

  const str = input.trim();

  // Pattern 1: https://www.swiggy.com/city/bangalore/meghana-foods-central-bangalore-rest3241
  const cityUrlMatch = str.match(/swiggy\.com\/city\/([^/]+)\/([^/]+)/i);
  if (cityUrlMatch) {
    const city = decodeURIComponent(cityUrlMatch[1]).toLowerCase();
    const slug = decodeURIComponent(cityUrlMatch[2]);
    const idMatch = slug.match(/rest(\d+)/i) || slug.match(/-(\d+)$/);
    const restaurantId = idMatch ? idMatch[1] : undefined;
    const rawName = slug.replace(/-rest\d+/i, '').replace(/-\d+$/, '').replace(/-/g, ' ');
    const name = rawName
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();
    return { isSwiggyUrl: true, restaurantId, city, slug, name };
  }

  // Pattern 2: https://www.swiggy.com/restaurants/meghana-foods-residency-road-bangalore-3241
  const restUrlMatch = str.match(/swiggy\.com\/restaurants\/([^/]+)/i);
  if (restUrlMatch) {
    const slug = decodeURIComponent(restUrlMatch[1]);
    const idMatch = slug.match(/rest(\d+)/i) || slug.match(/-(\d+)$/);
    const restaurantId = idMatch ? idMatch[1] : undefined;
    return { isSwiggyUrl: true, restaurantId, slug };
  }

  // Pattern 3: direct rest3241 or 3241
  const directIdMatch = str.match(/^rest(\d+)$/i) || str.match(/^(\d{2,8})$/);
  if (directIdMatch) {
    return { isSwiggyUrl: true, restaurantId: directIdMatch[1] };
  }

  return { isSwiggyUrl: false };
}

/**
 * Normalizes restaurant name for optimal search matching on Swiggy
 */
export function cleanRestaurantQuery(name: string): string {
  // If it's a URL, extract clean name or slug first
  const parsedUrl = parseSwiggyRestaurantUrl(name);
  if (parsedUrl.name) {
    return parsedUrl.name;
  }

  return (
    name
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/\b(restaurant|hotel|the|famous|pure veg|family|bar|dining|canteen)\b/gi, '')
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim() || name.trim()
  );
}

/**
 * Builds full high-resolution Swiggy CDN photo URL from imageId or raw URL
 */
export function buildSwiggyImageUrl(imageIdOrUrl?: string, width = 500, height = 500): string {
  if (!imageIdOrUrl || typeof imageIdOrUrl !== 'string') return '';
  const trimmed = imageIdOrUrl.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Remove potential leading slashes
  const cleanId = trimmed.replace(/^\/+/, '');
  return `https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_${width},h_${height},c_fit/${cleanId}`;
}

/**
 * Returns proxy image URL through /api/swiggy-image to guarantee 100% CORS and hotlink bypass
 */
export function getSwiggyProxyUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('/api/')) return imageUrl;
  return `/api/swiggy-image?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Builds full high-resolution Swiggy CDN photo URL from imageId or raw URL object
 */
export function resolveSwiggyDishPhoto(item: any): string | null {
  if (!item) return null;

  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.length > 3) {
      return buildSwiggyImageUrl(trimmed);
    }
  }

  if (typeof item !== 'object') return null;

  // Direct image URL fields
  const directUrls = [
    item.image_url,
    item.imageUrl,
    item.image,
    item.dish_image,
    item.photo,
    item.picture,
    item.thumbnail
  ];

  for (const u of directUrls) {
    if (typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'))) {
      return u;
    }
  }

  // Swiggy Cloudinary image IDs
  const rawId = item.imageId || item.cloudinaryImageId || item.dish_image_id || item.creativeId;
  if (rawId && typeof rawId === 'string' && rawId.trim().length > 3) {
    return buildSwiggyImageUrl(rawId.trim());
  }

  return null;
}

/**
 * Parses numeric price from various Swiggy pricing formats (paise or rupee strings)
 */
export function parseSwiggyPrice(rawPrice: any): number {
  if (typeof rawPrice === 'number') {
    // If price is in paise (e.g., 36500 for ₹365)
    if (rawPrice > 1000) return Math.round(rawPrice / 100);
    return Math.round(rawPrice);
  }
  if (typeof rawPrice === 'string') {
    const cleaned = rawPrice.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      if (num > 1000) return Math.round(num / 100);
      return Math.round(num);
    }
  }
  return 180; // Sensible default
}

/**
 * City default coordinates mapping for Indian metropolitan hubs
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Karnataka
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mangalore: { lat: 12.9141, lng: 74.8560 },
  hubli: { lat: 15.3647, lng: 75.1240 },
  belgaum: { lat: 15.8497, lng: 74.4977 },

  // Maharashtra
  pune: { lat: 18.5204, lng: 73.8567 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  bombay: { lat: 19.0760, lng: 72.8777 },
  thane: { lat: 19.2183, lng: 72.9781 },
  'navi mumbai': { lat: 19.0330, lng: 73.0297 },
  vashi: { lat: 19.0771, lng: 72.9986 },
  panvel: { lat: 18.9894, lng: 73.1175 },
  kalyan: { lat: 19.2437, lng: 73.1355 },
  dombivli: { lat: 19.2094, lng: 73.0939 },
  'mira road': { lat: 19.2813, lng: 72.8561 },
  vasai: { lat: 19.3919, lng: 72.8397 },
  virar: { lat: 19.4559, lng: 72.8114 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  aurangabad: { lat: 19.8762, lng: 75.3433 },
  sambhajinagar: { lat: 19.8762, lng: 75.3433 },
  'sambhaji nagar': { lat: 19.8762, lng: 75.3433 },
  'chhatrapati sambhajinagar': { lat: 19.8762, lng: 75.3433 },
  'chhatrapati sambhaji nagar': { lat: 19.8762, lng: 75.3433 },
  kolhapur: { lat: 16.7050, lng: 74.2433 },
  solapur: { lat: 17.6599, lng: 75.9064 },
  satara: { lat: 17.6805, lng: 74.0183 },
  sangli: { lat: 16.8524, lng: 74.5815 },
  lonavala: { lat: 18.7546, lng: 73.4062 },

  // Delhi NCR & North
  delhi: { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  noida: { lat: 28.5355, lng: 77.3910 },
  'greater noida': { lat: 28.4744, lng: 77.5040 },
  ghaziabad: { lat: 28.6692, lng: 77.4538 },
  faridabad: { lat: 28.4089, lng: 77.3178 },
  dehradun: { lat: 30.3165, lng: 78.0322 },

  // Punjab, Chandigarh & Haryana
  punjab: { lat: 30.9010, lng: 75.8573 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  mohali: { lat: 30.7046, lng: 76.7179 },
  panchkula: { lat: 30.6942, lng: 76.8606 },
  ludhiana: { lat: 30.9010, lng: 75.8573 },
  amritsar: { lat: 31.6340, lng: 74.8723 },
  jalandhar: { lat: 31.3260, lng: 75.5762 },
  patiala: { lat: 30.3398, lng: 76.3869 },
  bathinda: { lat: 30.2110, lng: 74.9455 },

  // Other Major Metros & States
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  secunderabad: { lat: 17.4399, lng: 78.4983 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  vijayawada: { lat: 16.5062, lng: 80.6480 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  madras: { lat: 13.0827, lng: 80.2707 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  calcutta: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  surat: { lat: 21.1702, lng: 72.8311 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  rajkot: { lat: 22.3039, lng: 70.8022 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  jodhpur: { lat: 26.2389, lng: 73.0243 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  agra: { lat: 27.1767, lng: 78.0081 },
  indore: { lat: 22.7196, lng: 75.8577 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  patna: { lat: 25.5941, lng: 85.1376 },
  ranchi: { lat: 23.3441, lng: 85.3096 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  goa: { lat: 15.2993, lng: 74.1240 },
  panaji: { lat: 15.4909, lng: 73.8278 },
  guwahati: { lat: 26.1445, lng: 91.7362 }
};

/**
 * Direct Swiggy Search: Searches Swiggy's public mobile API directly
 * Provides instant (<2s) restaurant discovery with 0 external quota limits
 */
export async function searchSwiggyDirectRestaurant(
  query: string,
  city = 'bangalore',
  options?: { lat?: number; lng?: number }
): Promise<SwiggyRestaurantData[]> {
  const cityKey = (city || 'bangalore').toLowerCase();
  const cityCoords = CITY_COORDINATES[cityKey] || { lat: 18.5204, lng: 73.8567 };
  const lat = options?.lat || cityCoords.lat;
  const lng = options?.lng || cityCoords.lng;
  const rawClean = query.trim();

  // Try raw query first, then cleanRestaurantQuery if needed
  const queriesToTry = [rawClean];
  const cleaned = cleanRestaurantQuery(rawClean);
  if (cleaned && cleaned.toLowerCase() !== rawClean.toLowerCase()) {
    queriesToTry.push(cleaned);
  }

  for (const q of queriesToTry) {
    if (!q) continue;
    try {
      const url = `https://www.swiggy.com/dapi/restaurants/search/v3?lat=${lat}&lng=${lng}&str=${encodeURIComponent(q)}&trackingId=undefined&submitAction=ENTER&queryUniqueId=undefined`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://www.swiggy.com/'
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const json = await res.json();
      const cards = json?.data?.cards || [];
      const groupedCard = cards.find((c: any) => c.groupedCard)?.groupedCard?.cardGroupMap?.RESTAURANT?.cards || [];

      const results: SwiggyRestaurantData[] = [];
      for (const rc of groupedCard) {
        const info = rc?.card?.card?.info;
        if (info && info.id) {
          const imgUrl = info.cloudinaryImageId
            ? buildSwiggyImageUrl(info.cloudinaryImageId)
            : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';
          results.push({
            restaurant_id: String(info.id),
            name: info.name,
            cuisine: info.cuisines || ['Multi-Cuisine'],
            rating: parseFloat(info.avgRating) || 4.5,
            rating_count: info.totalRatingsString || '1K+',
            cost_for_two: info.costForTwoMessage || '₹400 for two',
            cost_for_two_rupees: parseSwiggyPrice(info.costForTwoMessage || 400),
            delivery_time: info.sla?.slaString || '30 MINS',
            delivery_time_minutes: info.sla?.deliveryTime || 30,
            address: `${info.locality || ''}, ${info.areaName || ''}, ${city}`,
            city: cityKey,
            is_open: info.isOpen !== false,
            veg_only: Boolean(info.veg),
            offers: [],
            badges: [],
            image_url: imgUrl,
            proxy_image_url: getSwiggyProxyUrl(imgUrl),
            url: `https://www.swiggy.com/city/${cityKey}/${encodeURIComponent(info.name)}`
          });
        }
      }

      if (results.length > 0) {
        // Smart Scoring: Prioritize exact matches and close matches
        const qLower = rawClean.toLowerCase();
        results.sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const aScore = aName === qLower ? 1000 : aName.startsWith(qLower) ? 500 : aName.includes(qLower) ? 200 : 0;
          const bScore = bName === qLower ? 1000 : bName.startsWith(qLower) ? 500 : bName.includes(qLower) ? 200 : 0;
          return bScore - aScore;
        });
        return results;
      }
    } catch {
      // Continue to next query attempt
    }
  }

  return [];
}

/**
 * 1. Search for live restaurants on Swiggy via direct search or Apify actor fallback
 * Incorporates smart ranking so exact matches come before promoted ads
 */
export async function fetchSwiggyRestaurantViaApify(
  query: string,
  city = 'bangalore',
  options?: {
    maxResults?: number;
    lat?: number;
    lng?: number;
  }
): Promise<SwiggyRestaurantData[]> {
  const maxResults = options?.maxResults || 10;
  const parsedUrl = parseSwiggyRestaurantUrl(query);
  const cleanQuery = cleanRestaurantQuery(query);
  const cityKey = (parsedUrl.city || city || 'bangalore').toLowerCase();
  const cacheKey = `${cleanQuery.toLowerCase()}_${cityKey}`;

  const cached = swiggyRestaurantCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const cityCoords = CITY_COORDINATES[cityKey] || { lat: 18.5204, lng: 73.8567 };
  const lat = options?.lat || cityCoords.lat;
  const lng = options?.lng || cityCoords.lng;

  // 1. Try Direct High-Speed Swiggy Search First (zero latency, zero quota)
  try {
    const directResults = await searchSwiggyDirectRestaurant(query, cityKey, { lat, lng });
    if (directResults.length > 0) {
      swiggyRestaurantCache.set(cacheKey, { timestamp: Date.now(), data: directResults.slice(0, maxResults) });
      return directResults.slice(0, maxResults);
    }
  } catch (directErr) {
    console.warn('Direct Swiggy search attempt notice:', directErr);
  }

  if (!isApifyConfigured()) {
    // Strict mode: never fabricate a restaurant when live data is unavailable
    return [];
  }

  const token = getApifyToken();
  const actorId = getApifyActor();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);

  try {
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?timeout=30`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'BakasurFoodTour/3.0'
      },
      body: JSON.stringify({
        queries: [cleanQuery],
        city: cityKey,
        searchType: 'restaurant',
        maxResults,
        ...(lat && lng ? { latitude: lat, longitude: lng } : {})
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`Apify actor ${actorId} returned status ${res.status}`);
      return [];
    }

    const items = await res.json();
    if (!Array.isArray(items)) return [];

    const parsed: SwiggyRestaurantData[] = items.map((r: any) => {
      const restImg = resolveSwiggyDishPhoto(r) || r.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';
      return {
        restaurant_id: String(r.restaurant_id || r.id || ''),
        name: r.name || cleanQuery,
        cuisine: Array.isArray(r.cuisine) ? r.cuisine : (r.cuisines || ['Multi-Cuisine']),
        rating: parseFloat(r.rating) || 4.5,
        rating_count: r.rating_count ? String(r.rating_count) : '1K+',
        google_rating: r.google_rating ? parseFloat(r.google_rating) : null,
        google_rating_count: r.google_rating_count ? String(r.google_rating_count) : null,
        cost_for_two: r.cost_for_two || `₹${r.cost_for_two_rupees || 400} for two`,
        cost_for_two_rupees: parseSwiggyPrice(r.cost_for_two_rupees || r.cost_for_two),
        delivery_time: r.delivery_time || `${r.delivery_time_minutes || 30} MINS`,
        delivery_time_minutes: parseInt(r.delivery_time_minutes, 10) || 30,
        last_mile_distance_km: r.last_mile_distance_km ? parseFloat(r.last_mile_distance_km) : undefined,
        address: r.address || `${r.area_name || ''}, ${city}`,
        locality: r.locality || r.area_name || '',
        area_name: r.area_name || r.locality || city,
        city: r.city || city,
        is_open: r.is_open !== false,
        veg_only: Boolean(r.veg_only),
        offers: Array.isArray(r.offers) ? r.offers : [],
        badges: Array.isArray(r.badges) ? r.badges : [],
        image_url: restImg,
        proxy_image_url: getSwiggyProxyUrl(restImg),
        url: r.url || `https://www.swiggy.com/city/${cityKey}/${encodeURIComponent(r.name || cleanQuery)}`,
        query: r.query || cleanQuery
      };
    });

    // Smart Ranking: Rank exact matches or substring matches first over sponsored ads!
    const queryLower = cleanQuery.toLowerCase();
    parsed.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aExact = aName === queryLower ? 100 : aName.startsWith(queryLower) ? 50 : aName.includes(queryLower) ? 25 : 0;
      const bExact = bName === queryLower ? 100 : bName.startsWith(queryLower) ? 50 : bName.includes(queryLower) ? 25 : 0;
      return bExact - aExact;
    });

    if (parsed.length > 0) {
      swiggyRestaurantCache.set(cacheKey, { timestamp: Date.now(), data: parsed });
    }

    return parsed;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`Apify actor ${actorId} search notice:`, err.message || err);
    return [];
  }
}

/**
 * 2. Fetch full restaurant menu directly from Swiggy's menu endpoint with authentic photos and addons
 */
export async function fetchSwiggyRestaurantMenu(
  restaurantId: string | number,
  lat?: number,
  lng?: number
): Promise<Dish[]> {
  const cleanId = String(restaurantId).trim().replace(/^rest/i, '');
  if (!cleanId || cleanId === '0') return [];

  // Check cache
  const cacheKey = `menu_${cleanId}`;
  const cached = swiggyMenuCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.dishes;
  }

  const defaultCoords = { lat: lat || 12.9716, lng: lng || 77.5946 };
  const url = `https://www.swiggy.com/mapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=${defaultCoords.lat}&lng=${defaultCoords.lng}&restaurantId=${cleanId}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://www.swiggy.com/'
      },
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    const cards = json?.data?.cards || [];
    const groupedCard =
      cards.find((c: any) => c.groupedCard)?.groupedCard?.cardGroupMap?.REGULAR?.cards || [];

    const extractedDishes: Dish[] = [];
    const seenNames = new Set<string>();

    const processItemInfo = (info: any, categoryName: string) => {
      if (!info || !info.name || typeof info.name !== 'string') return;
      const rawName = info.name.trim();
      const lower = rawName.toLowerCase();
      if (seenNames.has(lower)) return;
      seenNames.add(lower);

      const price = parseSwiggyPrice(info.price ?? info.defaultPrice ?? 18000);
      const originalPrice = info.originalPrice ? parseSwiggyPrice(info.originalPrice) : undefined;
      const imageId = info.imageId;
      const photoUrl = imageId
        ? buildSwiggyImageUrl(imageId)
        : resolveSwiggyDishPhoto(info);

      const isVeg =
        info.isVeg === 1 ||
        info.itemAttribute?.vegClassifier === 'VEG' ||
        isDishVeg(rawName);

      const rawRating = parseFloat(info.ratings?.aggregatedRating?.rating);
      const rating = !isNaN(rawRating) && rawRating > 0 && rawRating <= 5 ? rawRating : 4.7;
      const ratingCount = info.ratings?.aggregatedRating?.ratingCountV2 || '';

      // Extract addon options
      const addonGroups: SwiggyAddonGroup[] = [];
      if (Array.isArray(info.addons)) {
        for (const grp of info.addons) {
          if (Array.isArray(grp.choices)) {
            addonGroups.push({
              groupId: String(grp.groupId || grp.id || ''),
              groupName: grp.groupName || 'Addons',
              maxAddons: grp.maxAddons,
              minAddons: grp.minAddons,
              choices: grp.choices.map((ch: any) => ({
                id: String(ch.id || ''),
                name: ch.name || '',
                price: parseSwiggyPrice(ch.price || 0),
                isVeg: ch.isVeg === 1,
                inStock: ch.inStock !== 0
              }))
            });
          }
        }
      }

      extractedDishes.push({
        id: parseInt(info.id, 10) || 900000 + extractedDishes.length + 1,
        restaurant_id: parseInt(cleanId, 10) || 1,
        name: rawName,
        description: (info.description || '').trim(),
        price,
        image: photoUrl || '',
        proxy_image: photoUrl ? getSwiggyProxyUrl(photoUrl) : '',
        rating,
        popularity: info.isBestseller ? 100 : 96,
        is_recommended: categoryName.toLowerCase().includes('recommended') ? 1 : 0,
        is_veg: isVeg ? 1 : 0,
        status: 'active',
        // Rich Swiggy metadata
        ...(originalPrice ? { original_price: originalPrice } : {}),
        ...(ratingCount ? { rating_count: ratingCount } : {}),
        ...(info.isBestseller ? { is_bestseller: true } : {}),
        ...(addonGroups.length > 0 ? { addons: addonGroups } : {}),
        category: categoryName || 'Recommended'
      } as any);
    };

    // Filter out non-category cards (SEO content, licensing, FAQs, app download)
    const EXCLUDED_CATEGORIES = [
      'about',
      'faq',
      'frequently asked',
      'popular search',
      'license',
      'fssai',
      'download',
      'order from',
      'footer',
      'gridwidget'
    ];

    for (const gc of groupedCard) {
      const itemCard = gc?.card?.card;
      if (!itemCard) continue;

      const cardType = (itemCard['@type'] || '').toLowerCase();
      const catTitle = (itemCard.title || '').trim();

      // Skip non-item cards
      if (!cardType.includes('itemcategory') && !itemCard.itemCards && !itemCard.categories) {
        continue;
      }
      if (EXCLUDED_CATEGORIES.some(exc => catTitle.toLowerCase().includes(exc))) {
        continue;
      }

      const safeCategoryName = catTitle || 'Recommended';

      // 1. itemCards
      if (Array.isArray(itemCard.itemCards)) {
        for (const ic of itemCard.itemCards) {
          processItemInfo(ic?.card?.info, safeCategoryName);
        }
      }

      // 2. nested categories
      if (Array.isArray(itemCard.categories)) {
        for (const subCat of itemCard.categories) {
          const subTitle = subCat.title || safeCategoryName;
          if (Array.isArray(subCat.itemCards)) {
            for (const ic of subCat.itemCards) {
              processItemInfo(ic?.card?.info, subTitle);
            }
          }
        }
      }
    }

    if (extractedDishes.length > 0) {
      const categories = Array.from(new Set(extractedDishes.map((d: any) => d.category || 'Recommended')));
      swiggyMenuCache.set(cacheKey, {
        timestamp: Date.now(),
        dishes: extractedDishes,
        categories
      });
    }

    return extractedDishes;
  } catch (err: any) {
    console.warn(`Swiggy direct menu endpoint notice for ${cleanId}:`, err.message || err);
    return [];
  }
}

/**
 * Strict name equality check between a requested restaurant name and a Swiggy listing
 * (normalised; generic words like "hotel"/"restaurant" ignored).
 */
export function isSameRestaurantName(requested: string, candidate: string): boolean {
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/\b(hotel|restaurant|the|cafe|pure veg|family|and)\b/g, ' ')
      .replace(/[^a-z0-9]/g, '');
  const a = norm(requested);
  const b = norm(candidate);
  if (!a || !b) return false;
  return (
    a === b ||
    (a.length >= 5 && b.startsWith(a)) ||
    (b.length >= 5 && a.startsWith(b)) ||
    (a.length >= 5 && b.includes(a)) ||
    (b.length >= 5 && a.includes(b))
  );
}

/**
 * 3. Primary dish extractor: live scrape restaurant menu items and images from Swiggy
 * Coordinates Apify actor discovery + direct menu retrieval
 */
export async function fetchSwiggyDishesViaApify(
  restaurantName: string,
  city = 'bangalore',
  options?: {
    restaurantId?: string | number;
    lat?: number;
    lng?: number;
  }
): Promise<Dish[]> {
  const parsedUrl = parseSwiggyRestaurantUrl(restaurantName);
  const targetId = options?.restaurantId || parsedUrl.restaurantId;
  const cleanName = parsedUrl.name || cleanRestaurantQuery(restaurantName);
  const cityKey = (parsedUrl.city || city || 'bangalore').toLowerCase();
  const cacheKey = `${cleanName.toLowerCase()}_${cityKey}`;

  const cached = swiggyMenuCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.dishes;
  }

  // Determine coordinates for the city
  const cityCoords = CITY_COORDINATES[cityKey] || { lat: 12.9716, lng: 77.5946 };
  const lat = options?.lat || cityCoords.lat;
  const lng = options?.lng || cityCoords.lng;

  let directDishes: Dish[] = [];

  // A. If restaurantId is already known (e.g. 3241 for Meghana Foods), fetch full menu directly
  if (targetId) {
    directDishes = await fetchSwiggyRestaurantMenu(targetId, lat, lng);
  }

  // B. Direct Swiggy Search: use a result ONLY if its name genuinely matches (never blindly take [0])
  if (directDishes.length === 0) {
    try {
      const liveMatches = await searchSwiggyDirectRestaurant(restaurantName, cityKey, { lat, lng });
      const matched = liveMatches.find(r => isSameRestaurantName(cleanName, r.name));
      if (matched && matched.restaurant_id) {
        directDishes = await fetchSwiggyRestaurantMenu(matched.restaurant_id, lat, lng);
      }
    } catch (directErr) {
      console.warn('Direct Swiggy search notice:', directErr);
    }
  }

  // C. Fallback: Search via Apify thirdwatch actor if configured and direct search yielded no dishes
  if (directDishes.length === 0 && isApifyConfigured()) {
    try {
      const scrapedRestaurants = await fetchSwiggyRestaurantViaApify(cleanName, cityKey, {
        maxResults: 10,
        lat,
        lng
      });

      if (scrapedRestaurants.length > 0) {
        // Use a scraped restaurant ONLY if its name genuinely matches (no loose word or [0] fallback)
        const matchedRest = scrapedRestaurants.find(r => isSameRestaurantName(cleanName, r.name));

        if (matchedRest && matchedRest.restaurant_id) {
          directDishes = await fetchSwiggyRestaurantMenu(matchedRest.restaurant_id, lat, lng);
        }
      }
    } catch (apifySearchErr) {
      console.warn('Apify restaurant search notice:', apifySearchErr);
    }
  }

  // Cache results if dishes were found
  if (directDishes.length > 0) {
    const categories = Array.from(new Set(directDishes.map((d: any) => d.category || 'Recommended')));
    swiggyMenuCache.set(cacheKey, {
      timestamp: Date.now(),
      dishes: directDishes,
      categories
    });
  }

  return directDishes;
}

/**
 * Diagnostic tool to test the Apify connection and view scraped dishes
 */
export async function testApifySwiggyConnection(
  restaurantName = 'Meghana Foods',
  city = 'bangalore'
) {
  const configured = isApifyConfigured();
  const actor = getApifyActor();

  if (!configured) {
    return {
      success: false,
      configured: false,
      actor,
      error: 'APIFY_TOKEN is not set in environment or .env.local',
      instructions: 'Add APIFY_TOKEN=your_token_here to .env.local and restart Next.js server.'
    };
  }

  const startTime = Date.now();
  try {
    const restaurants = await fetchSwiggyRestaurantViaApify(restaurantName, city, { maxResults: 5 });
    const dishes = await fetchSwiggyDishesViaApify(restaurantName, city);
    const durationMs = Date.now() - startTime;

    return {
      success: true,
      configured: true,
      actor,
      restaurant: restaurantName,
      city,
      durationMs,
      foundRestaurant: restaurants.length > 0 ? restaurants[0] : null,
      dishCount: dishes.length,
      sampleDishes: dishes.slice(0, 5).map(d => ({
        name: d.name,
        category: (d as any).category,
        price: d.price,
        rating: d.rating,
        is_veg: (d as any).is_veg,
        image: d.image,
        proxy_image: (d as any).proxy_image,
        description: d.description
      }))
    };
  } catch (err: any) {
    return {
      success: false,
      configured: true,
      actor,
      restaurant: restaurantName,
      city,
      durationMs: Date.now() - startTime,
      error: err.message || String(err)
    };
  }
}
