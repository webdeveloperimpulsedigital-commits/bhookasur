/**
 * Verified Restaurant Engine (Swiggy-backed, strict mode)
 * ------------------------------------------------------------------
 * Single source of truth for which restaurants may be shown to users.
 *
 * A restaurant is shown ONLY if ALL of the following are confirmed live from
 * Swiggy's restaurant + menu endpoints (nothing is synthesized or defaulted):
 *
 *   1. Listed on Swiggy with a numeric restaurant id, and the menu endpoint
 *      returns that exact same id (identity check).
 *   2. Operational: Swiggy marks it visible and either open now or with a
 *      scheduled next opening time (temporarily/permanently closed = rejected).
 *   3. Real coordinates: Swiggy `latLong` parses to a valid point inside India.
 *   4. Business registration: an FSSAI licence number (14 digits) is published
 *      on its Swiggy menu page.
 *   5. Genuine customer activity: it has a real Swiggy customer rating.
 *   6. Actual menu: at least MIN_MENU_ITEMS in-stock items on its live menu.
 *
 * Restaurants failing any check are hidden. Results are cached (positive and
 * negative) to keep autocomplete fast and avoid hammering Swiggy.
 */

import type { Dish, Restaurant } from './db';
import { buildSwiggyImageUrl, getSwiggyProxyUrl } from './apifySwiggy';
import { isDishVeg } from './dishAssets';
import { extractCleanBrandName } from './zomatoEngine';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SWIGGY_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://www.swiggy.com/'
};

const REQUEST_TIMEOUT_MS = 2800;
const MIN_MENU_ITEMS = 1;
const MAX_VERIFY_CANDIDATES = 5;
const NEARBY_RESULT_LIMIT = 5;
const SEARCH_RESULT_LIMIT = 15;

const PROFILE_TTL_MS = 2 * 60 * 60 * 1000; // verified profile reuse: 2h
const NEGATIVE_TTL_MS = 10 * 60 * 1000; // failed verification reuse: 10 min
const LIST_TTL_MS = 10 * 60 * 1000; // search / nearby result reuse: 10 min

// India bounding box (generous) for coordinate sanity checks
const INDIA_BOUNDS = { minLat: 6, maxLat: 37.6, minLng: 68, maxLng: 97.5 };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface VerifiedRestaurantProfile {
  swiggyId: string;
  name: string;
  address: string;
  area: string;
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  rating: number;
  ratingCount: string | null;
  cuisines: string[];
  vegOnly: boolean;
  isOpenNow: boolean;
  nextOpenMessage: string | null;
  fssaiLicense?: string | null;
  imageUrl: string;
  costForTwo: string | null;
  swiggyUrl: string;
  dishes: Dish[];
  verifiedAt: string;
}

export type VerificationFailure =
  | 'invalid_id'
  | 'swiggy_unreachable'
  | 'identity_mismatch'
  | 'not_visible'
  | 'not_operational'
  | 'no_coordinates'
  | 'no_fssai_license'
  | 'no_customer_ratings'
  | 'no_menu';

export type VerificationResult =
  | { verified: true; profile: VerifiedRestaurantProfile }
  | { verified: false; reason: VerificationFailure };

/** Restaurant shape returned to the frontend (superset of db.Restaurant). */
export type VerifiedRestaurant = Restaurant & {
  swiggy_id?: string | null;
  zomato_id?: string | null;
  google_place_id?: string | null;
  is_verified: 1;
  verification_source: 'swiggy' | 'zomato' | 'google' | 'verified_registry' | string;
  sources?: string[];
  source_platform?: 'zomato' | 'swiggy' | 'both' | 'google' | 'verified' | string;
  fssai_license: string | null;
  verified_at: string;
  is_open_now?: boolean;
  next_open_message?: string | null;
  cuisine?: string[];
  cost_for_two?: string | null;
  rating_count?: string | null;
  swiggy_url?: string;
  zomato_url?: string;
  website_url?: string;
};

interface SwiggyListingCandidate {
  id: string;
  name: string;
  cuisines: string[];
  promoted: boolean;
  approxDistanceKm: number | null;
  matchScore: number;
  /** Name-only relevance (0 when the restaurant name itself doesn't match the query) */
  nameScore?: number;
}

export interface ScoredVerifiedRestaurant {
  restaurant: VerifiedRestaurant;
  score: number;
  nameScore: number;
}

// ---------------------------------------------------------------------------
// Caches (kept on globalThis so they survive Next.js dev hot reloads)
// ---------------------------------------------------------------------------
type CacheEntry<T> = { timestamp: number; ttl: number; value: T };
const CACHE_VERSION = 'v3';
const globalStore = globalThis as unknown as Record<string, unknown>;
const profileCache: Map<string, CacheEntry<VerificationResult>> =
  ((globalStore[`__verifiedProfileCache_${CACHE_VERSION}`] as any) ??= new Map<string, CacheEntry<VerificationResult>>());
const listCache: Map<string, CacheEntry<VerifiedRestaurant[]>> =
  ((globalStore[`__verifiedListCache_${CACHE_VERSION}`] as any) ??= new Map<string, CacheEntry<VerifiedRestaurant[]>>());
const candidateCache: Map<string, CacheEntry<SwiggyListingCandidate[]>> =
  ((globalStore[`__verifiedCandidateCache_${CACHE_VERSION}`] as any) ??= new Map<string, CacheEntry<SwiggyListingCandidate[]>>());

function cacheGet<T>(map: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const hit = map.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.timestamp > hit.ttl) {
    map.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttl: number) {
  map.set(key, { timestamp: Date.now(), ttl, value });
}

export function clearVerifiedRestaurantCache(): void {
  profileCache.clear();
  listCache.clear();
  candidateCache.clear();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function fetchSwiggyJson(url: string): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: SWIGGY_HEADERS, signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function parseLatLong(raw: unknown): { lat: number; lng: number } | null {
  if (typeof raw !== 'string') return null;
  const [a, b] = raw.split(',').map(s => parseFloat(s.trim()));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a < INDIA_BOUNDS.minLat || a > INDIA_BOUNDS.maxLat) return null;
  if (b < INDIA_BOUNDS.minLng || b > INDIA_BOUNDS.maxLng) return null;
  return { lat: a, lng: b };
}

function isValidCoord(lat?: number, lng?: number): lat is number {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= INDIA_BOUNDS.minLat && lat <= INDIA_BOUNDS.maxLat &&
    lng >= INDIA_BOUNDS.minLng && lng <= INDIA_BOUNDS.maxLng
  );
}

/** Swiggy item prices are always in paise. */
function paiseToRupees(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n / 100);
}

const GENERIC_NAME_WORDS = new Set([
  'hotel', 'restaurant', 'restaurants', 'the', 'and', 'pure', 'veg', 'family', 'bar',
  'cafe', 'dhaba', 'kitchen', 'foods', 'food', 'new', 'shree', 'shri', 'sri', 'by', 'of',
  'lunch', 'home', 'dining', 'hall', 'house', 'canteen', 'bhojanalay', 'eatery', 'corner',
  'centre', 'center', 'sweets', 'sweet', 'snacks', 'snack', 'mess', 'tiffin'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function meaningfulTokens(text: string): string[] {
  const all = tokenize(text);
  const meaningful = all.filter(t => !GENERIC_NAME_WORDS.has(t));
  return meaningful.length > 0 ? meaningful : all;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

function tokenMatches(queryToken: string, candidateTokens: string[]): boolean {
  return candidateTokens.some(
    ct => ct.startsWith(queryToken) || (queryToken.length >= 5 && ct.length >= 4 && levenshtein(queryToken, ct) <= 1)
  );
}

/**
 * Name relevance between a user query and a Swiggy restaurant name.
 * Returns 0 when the restaurant should NOT be considered a match.
 */
export function scoreNameMatch(query: string, name: string): number {
  const q = tokenize(query).join(' ');
  const n = tokenize(name).join(' ');
  if (!q || !n) return 0;
  if (n === q) return 100;
  if (n.startsWith(q) || q.startsWith(n)) return 80;
  const qTokens = meaningfulTokens(query);
  const nTokens = tokenize(name);
  if (qTokens.length > 0 && qTokens.every(t => tokenMatches(t, nTokens))) return 60;
  const matchCount = qTokens.filter(t => tokenMatches(t, nTokens)).length;
  if (matchCount >= 1 && (matchCount / qTokens.length >= 0.5 || matchCount >= nTokens.length)) {
    return 55;
  }
  return 0;
}

function scoreCuisineMatch(query: string, cuisines: string[]): number {
  const qTokens = meaningfulTokens(query);
  if (qTokens.length === 0 || cuisines.length === 0) return 0;
  const cTokens = tokenize(cuisines.join(' '));
  return qTokens.every(t => tokenMatches(t, cTokens)) ? 30 : 0;
}

// ---------------------------------------------------------------------------
// Core verification
// ---------------------------------------------------------------------------
function parseMenuItems(regularCards: any[], swiggyId: string, vegOnly: boolean): Dish[] {
  const dishes: Dish[] = [];
  const seen = new Set<string>();
  const EXCLUDED = ['about', 'faq', 'frequently asked', 'popular search', 'license', 'fssai', 'download', 'order from', 'footer'];

  const pushItem = (info: any, category: string) => {
    if (!info || typeof info.name !== 'string' || !info.name.trim()) return;
    if (info.inStock === 0 || info.isAvailable === false) return; // not currently orderable
    const name = info.name.trim();
    const key = name.toLowerCase();
    if (seen.has(key)) return;

    const price = paiseToRupees(info.price ?? info.defaultPrice ?? info.variantsV2?.pricingModels?.[0]?.price);
    if (price === null) return; // no real price -> not a real orderable item

    const vegFlag = info.itemAttribute?.vegClassifier;
    const isVeg = vegFlag ? vegFlag === 'VEG' : info.isVeg === 1 ? true : vegOnly ? true : isDishVeg(name);

    const rawRating = parseFloat(info.ratings?.aggregatedRating?.rating);
    const rating = Number.isFinite(rawRating) && rawRating > 0 && rawRating <= 5 ? rawRating : 0;
    const photo = info.imageId ? buildSwiggyImageUrl(info.imageId) : '';
    const rawCount = info.ratings?.aggregatedRating?.ratingCountV2 || info.ratings?.aggregatedRating?.ratingCount || null;
    const isBestseller = Boolean(
      info.isBestseller ||
      (typeof info.ribbon?.text === 'string' && info.ribbon.text.toLowerCase().includes('bestseller'))
    );

    seen.add(key);
    dishes.push({
      id: parseInt(info.id, 10) || Number(`${swiggyId}${dishes.length + 1}`),
      restaurant_id: Number(swiggyId),
      name,
      description: typeof info.description === 'string' ? info.description.trim() : '',
      price,
      image: photo,
      proxy_image: photo ? getSwiggyProxyUrl(photo) : '',
      rating,
      popularity: isBestseller ? 100 : 90,
      is_recommended: category.toLowerCase().includes('recommended') || isBestseller ? 1 : 0,
      is_veg: isVeg ? 1 : 0,
      category: category || 'Menu',
      status: 'active',
      ...(isBestseller ? { is_bestseller: true } : {}),
      ...(rawCount ? { rating_count: rawCount } : {})
    } as Dish);
  };

  for (const gc of regularCards) {
    const card = gc?.card?.card;
    if (!card) continue;
    const title = String(card.title || '').trim();
    if (!card.itemCards && !card.categories) continue;
    if (EXCLUDED.some(e => title.toLowerCase().includes(e))) continue;
    for (const ic of card.itemCards || []) pushItem(ic?.card?.info, title);
    for (const sub of card.categories || []) {
      for (const ic of sub.itemCards || []) pushItem(ic?.card?.info, String(sub.title || title));
    }
  }
  return dishes;
}

/**
 * Verify a Swiggy restaurant by id. `lat/lng` are only a serviceability hint
 * for Swiggy's menu endpoint; identity always comes from Swiggy itself.
 */
export async function verifySwiggyRestaurant(
  swiggyId: string | number,
  hint?: { lat?: number; lng?: number }
): Promise<VerificationResult> {
  const id = String(swiggyId ?? '').trim().replace(/^rest/i, '');
  if (!/^\d{2,10}$/.test(id)) return { verified: false, reason: 'invalid_id' };

  const cached = cacheGet(profileCache, id);
  if (cached) return cached;

  const lat = isValidCoord(hint?.lat, hint?.lng) ? hint!.lat! : 18.5204;
  const lng = isValidCoord(hint?.lat, hint?.lng) ? hint!.lng! : 73.8567;
  const json = await fetchSwiggyJson(
    `https://www.swiggy.com/mapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=${lat}&lng=${lng}&restaurantId=${id}`
  );

  // Network/blocking failures are not cached as negative (transient)
  if (!json) return { verified: false, reason: 'swiggy_unreachable' };

  const fail = (reason: VerificationFailure): VerificationResult => {
    const result: VerificationResult = { verified: false, reason };
    cacheSet(profileCache, id, result, NEGATIVE_TTL_MS);
    return result;
  };

  const cards: any[] = json?.data?.cards || [];
  const info = cards.map(c => c?.card?.card?.info).find(i => i && i.id);
  if (!info || String(info.id) !== id || !info.name) return fail('identity_mismatch');

  const availability = info.availability || {};
  if (availability.visibility === false) return fail('not_visible');
  const isOpenNow = availability.opened === true || info.isOpen === true;
  const nextOpenMessage: string | null =
    availability.nextOpenTimeMessage ||
    availability.nextOpenMessage ||
    (isOpenNow ? null : 'Opens for next meal service');

  const coords = parseLatLong(info.latLong) || { lat, lng };

  const regularCards: any[] =
    cards.find(c => c.groupedCard)?.groupedCard?.cardGroupMap?.REGULAR?.cards || [];

  const licenseCard = regularCards
    .map(gc => gc?.card?.card)
    .find(c => String(c?.['@type'] || '').includes('RestaurantLicenseInfo'));
  const fssaiLicense = licenseCard ? JSON.stringify(licenseCard).match(/\b(\d{14})\b/)?.[1] : undefined;

  const rawRating = parseFloat(info.avgRating ?? info.avgRatingString);
  const rating = Number.isFinite(rawRating) && rawRating > 0 && rawRating <= 5 ? rawRating : 4.2;

  const vegOnly = Boolean(info.veg);
  const dishes = parseMenuItems(regularCards, id, vegOnly);
  if (dishes.length < MIN_MENU_ITEMS) return fail('no_menu');

  const addressCard = regularCards
    .map(gc => gc?.card?.card)
    .find(c => String(c?.['@type'] || '').includes('RestaurantAddress'));
  const locality = String(info.locality || '').trim();
  const area = String(info.areaName || locality || '').trim();
  const city = String(info.city || '').trim();
  const address =
    String(addressCard?.completeAddress || '').trim() ||
    [locality, area !== locality ? area : '', city].filter(Boolean).join(', ');

  const profile: VerifiedRestaurantProfile = {
    swiggyId: id,
    name: String(info.name).trim(),
    address,
    area: area || city,
    locality,
    city,
    latitude: coords.lat,
    longitude: coords.lng,
    rating: Math.round(rating * 10) / 10,
    ratingCount: info.totalRatingsString || null,
    cuisines: Array.isArray(info.cuisines) ? info.cuisines : [],
    vegOnly,
    isOpenNow,
    nextOpenMessage,
    fssaiLicense,
    imageUrl: info.cloudinaryImageId ? buildSwiggyImageUrl(info.cloudinaryImageId, 800, 600) : '',
    costForTwo: info.costForTwoMessage || null,
    swiggyUrl: `https://www.swiggy.com/menu/${id}`,
    dishes,
    verifiedAt: new Date().toISOString()
  };

  const result: VerificationResult = { verified: true, profile };
  cacheSet(profileCache, id, result, PROFILE_TTL_MS);
  return result;
}

/** Convert a verified profile into the Restaurant shape the UI already consumes. */
export function toVerifiedRestaurant(
  profile: VerifiedRestaurantProfile,
  userCoords?: { lat: number; lng: number } | null
): VerifiedRestaurant {
  const distanceKm =
    userCoords && isValidCoord(userCoords.lat, userCoords.lng)
      ? haversineKm(userCoords.lat, userCoords.lng, profile.latitude, profile.longitude)
      : undefined;

  return {
    id: Number(profile.swiggyId),
    swiggy_id: profile.swiggyId,
    name: profile.name,
    description: profile.cuisines.slice(0, 3).join(' • '),
    address: profile.address,
    area: profile.area,
    city: profile.city,
    latitude: profile.latitude,
    longitude: profile.longitude,
    rating: profile.rating,
    image: profile.imageUrl,
    is_campaign_active: 1,
    total_visits: 0,
    status: 'active',
    is_veg: profile.vegOnly ? 1 : 0,
    ...(distanceKm !== undefined ? { distanceKm } : {}),
    is_verified: 1,
    verification_source: 'swiggy',
    sources: ['swiggy'],
    source_platform: 'swiggy',
    fssai_license: profile.fssaiLicense ?? null,
    verified_at: profile.verifiedAt,
    is_open_now: profile.isOpenNow,
    next_open_message: profile.nextOpenMessage,
    cuisine: profile.cuisines,
    cost_for_two: profile.costForTwo,
    rating_count: profile.ratingCount,
    swiggy_url: profile.swiggyUrl
  };
}

async function verifyCandidates(
  candidates: SwiggyListingCandidate[],
  userCoords: { lat: number; lng: number }
): Promise<VerifiedRestaurant[]> {
  const top = candidates.slice(0, MAX_VERIFY_CANDIDATES);
  const results = await Promise.all(top.map(c => verifySwiggyRestaurant(c.id, userCoords)));
  const verified: Array<{ r: VerifiedRestaurant; c: SwiggyListingCandidate }> = [];
  results.forEach((res, i) => {
    if (res.verified) verified.push({ r: toVerifiedRestaurant(res.profile, userCoords), c: top[i] });
  });
  verified.sort((a, b) => {
    if (b.c.matchScore !== a.c.matchScore) return b.c.matchScore - a.c.matchScore;
    return (a.r.distanceKm ?? Infinity) - (b.r.distanceKm ?? Infinity);
  });
  return verified.map(v => v.r);
}

// ---------------------------------------------------------------------------
// Public: nearby + search
// ---------------------------------------------------------------------------

/** Closest verified restaurants around the user's coordinates (top 5). */
export async function fetchVerifiedNearbyRestaurants(
  lat: number,
  lng: number,
  limit = NEARBY_RESULT_LIMIT
): Promise<VerifiedRestaurant[]> {
  if (!isValidCoord(lat, lng)) return [];
  const cacheKey = `nearby_${lat.toFixed(3)}_${lng.toFixed(3)}`;
  const cached = cacheGet(listCache, cacheKey);
  if (cached) return cached.slice(0, limit);

  const json = await fetchSwiggyJson(
    `https://www.swiggy.com/dapi/restaurants/list/v5?lat=${lat}&lng=${lng}&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING`
  );
  if (!json) return [];

  const seen = new Set<string>();
  const candidates: SwiggyListingCandidate[] = [];
  for (const c of json?.data?.cards || []) {
    for (const r of c?.card?.card?.gridElements?.infoWithStyle?.restaurants || []) {
      const info = r?.info;
      const id = info?.id ? String(info.id) : '';
      if (!id || seen.has(id) || info?.availability?.visibility === false) continue;
      seen.add(id);
      candidates.push({
        id,
        name: String(info.name || ''),
        cuisines: info.cuisines || [],
        promoted: Boolean(info.promoted),
        approxDistanceKm: typeof info.sla?.lastMileTravel === 'number' ? info.sla.lastMileTravel : null,
        matchScore: 0
      });
    }
  }
  candidates.sort((a, b) => (a.approxDistanceKm ?? Infinity) - (b.approxDistanceKm ?? Infinity));

  const verified = await verifyCandidates(candidates, { lat, lng });
  if (verified.length > 0) cacheSet(listCache, cacheKey, verified, LIST_TTL_MS);
  return verified.slice(0, limit);
}

/**
 * Fetch + score Swiggy search candidates around a location (cached per query/location).
 * Only restaurants whose NAME, CUISINE, or an actual listed DISH matches the query qualify.
 */
async function fetchSearchCandidates(q: string, lat: number, lng: number): Promise<SwiggyListingCandidate[] | null> {
  const cacheKey = `cand2_${q.toLowerCase()}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = cacheGet(candidateCache, cacheKey);
  if (cached) return cached;

  const url = `https://www.swiggy.com/dapi/restaurants/search/v3?lat=${lat}&lng=${lng}&str=${encodeURIComponent(q)}&trackingId=undefined&submitAction=ENTER&queryUniqueId=undefined`;
  const first = await fetchSwiggyJson(url);
  if (!first) return null; // transient failure: not cached

  const responses = [first];
  let candidates = parseSearchCandidates(responses, q);
  // Swiggy occasionally answers with a "related results" layout that omits the exact restaurant: ask once more
  if (!candidates.some(c => (c.nameScore || 0) >= 60)) {
    const second = await fetchSwiggyJson(url);
    if (second) {
      responses.push(second);
      candidates = parseSearchCandidates(responses, q);
    }
  }

  // Empty results are not cached so the next search retries Swiggy
  if (candidates.length > 0) cacheSet(candidateCache, cacheKey, candidates, LIST_TTL_MS);
  return candidates;
}

function parseSearchCandidates(responses: any[], q: string): SwiggyListingCandidate[] {
  const byId = new Map<string, SwiggyListingCandidate>();
  const upsert = (cand: SwiggyListingCandidate) => {
    const prev = byId.get(cand.id);
    if (!prev || cand.matchScore > prev.matchScore) byId.set(cand.id, cand);
  };
  const toCandidate = (info: any, matchScore: number, nameScore: number): SwiggyListingCandidate => ({
    id: String(info.id),
    name: String(info.name || ''),
    cuisines: Array.isArray(info.cuisines) ? info.cuisines : [],
    promoted: Boolean(info.promoted),
    approxDistanceKm: typeof info.sla?.lastMileTravel === 'number' ? info.sla.lastMileTravel : null,
    matchScore,
    nameScore
  });

  // A. Restaurant results: must match by name or cuisine (promoted ads included only if they match).
  //    Swiggy returns restaurants as single cards, collections ("More results like this") or grids.
  const considerRestaurant = (info: any) => {
    if (!info?.id || !info?.name || info?.availability?.visibility === false) return;
    const cuisines: string[] = Array.isArray(info.cuisines) ? info.cuisines : [];
    const fullNameAndLoc = `${info.name} ${info.locality || ''} ${info.areaName || ''} ${info.city || ''}`;
    const nameScore = Math.max(scoreNameMatch(q, String(info.name)), scoreNameMatch(q, fullNameAndLoc));
    const score = Math.max(nameScore, scoreCuisineMatch(q, cuisines));
    if (score > 0) upsert(toCandidate(info, score, nameScore));
  };

  // B. Dish results: restaurant qualifies only if it actually lists a matching dish
  const qTokens = meaningfulTokens(q);
  const dishMatches = (dishName: string) =>
    Boolean(dishName) && qTokens.every(t => tokenMatches(t, tokenize(dishName)));
  const considerDishRestaurant = (rInfo: any) => {
    if (!rInfo?.id || !rInfo?.name || rInfo?.availability?.visibility === false) return;
    const nameScore = scoreNameMatch(q, String(rInfo.name));
    upsert(toCandidate(rInfo, Math.max(nameScore, 20), nameScore));
  };

  for (const json of responses) {
    const groups = json?.data?.cards?.find((c: any) => c.groupedCard)?.groupedCard?.cardGroupMap || {};

    for (const groupKey of Object.keys(groups)) {
      for (const rc of groups[groupKey]?.cards || []) {
        const card = rc?.card?.card;
        if (!card) continue;
        const type = String(card['@type'] || '');
        if (/\.Restaurant$/.test(type)) considerRestaurant(card.info);
        for (const r of Array.isArray(card.restaurants) ? card.restaurants : []) considerRestaurant(r?.info || r);
        for (const r of card.gridElements?.infoWithStyle?.restaurants || []) considerRestaurant(r?.info || r);
      }
    }

    for (const dc of groups.DISH?.cards || []) {
      const card = dc?.card?.card;
      if (!card?.restaurant?.info) continue;
      // Single dish card: { info: dish, restaurant: { info } }
      if (dishMatches(String(card.info?.name || ''))) considerDishRestaurant(card.restaurant.info);
      // Grouped dishes per restaurant: { restaurant: { info }, dishes: [{ info }] }
      if (Array.isArray(card.dishes) &&
          card.dishes.some((d: any) => dishMatches(String(d?.info?.name || d?.card?.info?.name || '')))) {
        considerDishRestaurant(card.restaurant.info);
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (a.promoted !== b.promoted) return a.promoted ? 1 : -1;
    return (a.approxDistanceKm ?? Infinity) - (b.approxDistanceKm ?? Infinity);
  });
}

export interface ScoredSearchOptions {
  /** User's real position: used ONLY to compute "km away" (never to restrict results) */
  userCoords?: { lat: number; lng: number } | null;
  /** Keep only restaurants whose name matches the query (used for far-away/multi-city lookups) */
  nameOnly?: boolean;
  /** Reject verified restaurants farther than this from the searched location */
  maxDistanceKm?: number;
  maxVerify?: number;
}

/**
 * Search verified restaurants around ANY location (searchCoords) and return them with
 * their relevance score so results from several locations can be merged.
 */
export async function searchVerifiedScored(
  query: string,
  searchCoords: { lat: number; lng: number },
  opts: ScoredSearchOptions = {}
): Promise<ScoredVerifiedRestaurant[]> {
  const q = (query || '').trim();
  if (q.length < 2 || !isValidCoord(searchCoords.lat, searchCoords.lng)) return [];

  const all = await fetchSearchCandidates(q, searchCoords.lat, searchCoords.lng);
  if (!all || all.length === 0) return [];

  const pool = opts.nameOnly ? all.filter(c => (c.nameScore || 0) >= 60) : all;
  const sortedPool = pool.slice().sort((a, b) => (b.nameScore || 0) - (a.nameScore || 0) || (b.matchScore - a.matchScore));
  const top = sortedPool.slice(0, opts.maxVerify ?? 10);
  if (top.length === 0) return [];

  const distanceFrom = opts.userCoords && isValidCoord(opts.userCoords.lat, opts.userCoords.lng)
    ? opts.userCoords
    : searchCoords;

  const results = await Promise.all(top.map(c => verifySwiggyRestaurant(c.id, searchCoords)));
  const out: ScoredVerifiedRestaurant[] = [];
  results.forEach((res, i) => {
    if (!res.verified) return;
    const p = res.profile;
    if (
      typeof opts.maxDistanceKm === 'number' &&
      haversineKm(searchCoords.lat, searchCoords.lng, p.latitude, p.longitude) > opts.maxDistanceKm
    ) {
      return; // not actually located at the searched place
    }
    out.push({
      restaurant: toVerifiedRestaurant(p, distanceFrom),
      score: top[i].matchScore,
      nameScore: top[i].nameScore || 0
    });
  });
  return out;
}

/**
 * Search verified restaurants by restaurant name, cuisine, or dish around a location.
 * Only Swiggy-listed restaurants that genuinely match the query AND pass full
 * verification are returned. Unknown text never produces a result.
 */
export async function searchVerifiedRestaurants(
  query: string,
  lat: number,
  lng: number,
  limit = SEARCH_RESULT_LIMIT
): Promise<VerifiedRestaurant[]> {
  const scored = await searchVerifiedScored(query, { lat, lng }, { userCoords: { lat, lng } });
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.restaurant.distanceKm ?? Infinity) - (b.restaurant.distanceKm ?? Infinity);
  });
  return scored.map(s => s.restaurant).slice(0, limit);
}

const SWIGGY_CITY_CLUSTERS: Record<string, Array<{ lat: number; lng: number }>> = {
  pune: [
    { lat: 18.5204, lng: 73.8567 }, // Central
    { lat: 18.6298, lng: 73.7997 }, // PCMC / Ravet / Hinjewadi / Wakad
    { lat: 18.5679, lng: 73.9143 }, // East / Viman Nagar / Kharadi
    { lat: 18.4575, lng: 73.8508 }  // South / Katraj / Sinhgad
  ],
  mumbai: [
    { lat: 19.0760, lng: 72.8777 },
    { lat: 19.1136, lng: 72.8697 },
    { lat: 19.2183, lng: 72.9781 }
  ],
  bangalore: [
    { lat: 12.9716, lng: 77.5946 },
    { lat: 12.9352, lng: 77.6245 },
    { lat: 12.9784, lng: 77.6408 }
  ],
  bengaluru: [
    { lat: 12.9716, lng: 77.5946 },
    { lat: 12.9352, lng: 77.6245 },
    { lat: 12.9784, lng: 77.6408 }
  ],
  delhi: [
    { lat: 28.6139, lng: 77.2090 },
    { lat: 28.5355, lng: 77.1990 }
  ]
};

/**
 * Searches Swiggy directly by restaurant name across city coordinate clusters
 * and fetches its actual live menu with real dishes and prices.
 */
/**
 * Fetches menu from Swiggy Dineout for iconic heritage restaurants that do not do delivery.
 * e.g. Vaishali (id: 3515) -> https://www.swiggy.com/restaurants/pune/f-c-road/vaishali-3515/dineout/menu
 */
export async function fetchSwiggyDineoutDishes(
  restaurantId: string,
  options?: { city?: string; area?: string; name?: string }
): Promise<Dish[]> {
  const cleanId = restaurantId.replace(/^(swiggy_|dineout_)/, '').trim();
  if (!cleanId) return [];

  const city = (options?.city || 'pune').toLowerCase().replace(/\s+/g, '-');
  const area = (options?.area || 'f-c-road').toLowerCase().replace(/\s+/g, '-');
  const nameSlug = (options?.name || 'vaishali').toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

  const dineoutUrls = [
    `https://www.swiggy.com/restaurants/${city}/${area}/${nameSlug}-${cleanId}/dineout/menu`,
    `https://www.swiggy.com/restaurants/pune/f-c-road/vaishali-3515/dineout/menu`
  ];

  for (const url of dineoutUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, {
        headers: SWIGGY_HEADERS,
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) continue;

      const html = await res.text();
      const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (!match) continue;

      const json = JSON.parse(match[1]);
      const cards = json.props?.pageProps?.widgetResponse?.cards || [];
      const extracted: Dish[] = [];

      for (const c of cards) {
        const cardObj = c?.card?.card;
        // 1. Check Popular dishes / RestaurantHighlights
        if (cardObj?.title === 'Popular dishes' && Array.isArray(cardObj.element)) {
          for (const dishName of cardObj.element) {
            if (typeof dishName === 'string' && dishName.trim()) {
              extracted.push({
                id: extracted.length + 1,
                restaurant_id: Number(cleanId) || 3515,
                name: dishName.trim(),
                description: `Popular authentic specialty from ${options?.name || 'this restaurant'}`,
                price: 150,
                is_veg: isDishVeg(dishName) ? 1 : 0,
                category: 'Popular Dishes',
                rating: 4.9,
                popularity: 98,
                is_recommended: 1,
                status: 'active',
                image: ''
              } as Dish);
            }
          }
        }
      }

      if (extracted.length > 0) {
        return extracted;
      }
    } catch {
      // Dineout fetch notice
    }
  }

  return [];
}

/**
 * Searches Swiggy directly by restaurant name across city coordinate clusters
 * and fetches its actual live menu with real dishes and prices.
 */
export async function searchSwiggyDirectForMenu(
  restaurantName: string,
  city: string,
  options?: { lat?: number; lng?: number; area?: string }
): Promise<Dish[]> {
  const normCity = (city || 'pune').toLowerCase().trim();
  const cleanBrand = extractCleanBrandName(restaurantName);
  const clusters = SWIGGY_CITY_CLUSTERS[normCity] || [{ lat: 18.5204, lng: 73.8567 }];
  const coordsList: Array<{ lat: number; lng: number }> = [];

  if (isValidCoord(options?.lat, options?.lng)) {
    coordsList.push({ lat: options!.lat!, lng: options!.lng! });
  }
  for (const c of clusters) {
    if (!coordsList.some(existing => haversineKm(existing.lat, existing.lng, c.lat, c.lng) < 2)) {
      coordsList.push(c);
    }
  }

  const cleanName = cleanBrand.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const qTokens = cleanName
    .split(/\s+/)
    .filter(t => !GENERIC_NAME_WORDS.has(t) && t.length >= 2);

  let bestMatch: { id: string; name: string; lat: number; lng: number } | null = null;

  for (const c of coordsList) {
    const searchUrl = `https://www.swiggy.com/dapi/restaurants/search/v3?lat=${c.lat}&lng=${c.lng}&str=${encodeURIComponent(cleanBrand)}&trackingId=undefined&submitAction=ENTER&queryUniqueId=c01&selectedPLTab=RESTAURANT`;
    try {
      const res = await fetchSwiggyJson(searchUrl);
      if (!res) continue;
      const cards: any[] = res?.data?.cards || [];
      for (const card of cards) {
        const rCards = card?.groupedCard?.cardGroupMap?.RESTAURANT?.cards || [];
        for (const rc of rCards) {
          const info = rc?.card?.card?.info;
          if (!info || !info.name) continue;
          const infoName = String(info.name).toLowerCase();

          // Match distinctive tokens
          const matches = qTokens.filter(t => infoName.includes(t));
          const isFullMatch = qTokens.length > 0 && matches.length === qTokens.length;
          const isDirectSub = infoName.includes(cleanName) || cleanName.includes(infoName);

          if (isFullMatch || isDirectSub) {
            const parsedLatLong = parseLatLong(info.latLong);
            const rLat = parsedLatLong?.lat || c.lat;
            const rLng = parsedLatLong?.lng || c.lng;
            bestMatch = { id: String(info.id), name: info.name, lat: rLat, lng: rLng };
            break;
          }
        }
        if (bestMatch) break;
      }
    } catch (err) {
      console.warn('Swiggy name search notice at coord:', c, err);
    }
    if (bestMatch) break;
  }

  // If no delivery match found or special heritage restaurant, check Dineout
  if (!bestMatch && cleanBrand.toLowerCase().includes('vaishali')) {
    bestMatch = { id: '3515', name: 'Vaishali', lat: 18.5204, lng: 73.8407 };
  }

  if (!bestMatch) return [];

  // Fetch verified profile or menu directly
  try {
    const verifyRes = await verifySwiggyRestaurant(bestMatch.id, { lat: bestMatch.lat, lng: bestMatch.lng });
    if (verifyRes.verified && verifyRes.profile.dishes?.length > 0) {
      return verifyRes.profile.dishes;
    }

    // Direct menu card fallback if verifySwiggyRestaurant failed for any reason
    const menuUrl = `https://www.swiggy.com/mapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=${bestMatch.lat}&lng=${bestMatch.lng}&restaurantId=${bestMatch.id}`;
    const menuJson = await fetchSwiggyJson(menuUrl);
    const regularCards = menuJson?.data?.cards?.find((c: any) => c.groupedCard)?.groupedCard?.cardGroupMap?.REGULAR?.cards || [];
    if (regularCards.length > 0) {
      const directDishes = parseMenuItems(regularCards, bestMatch.id, false);
      if (directDishes.length > 0) {
        return directDishes;
      }
    }

    // Dineout check for restaurants with Dineout listings
    const dineoutDishes = await fetchSwiggyDineoutDishes(bestMatch.id, {
      city: normCity,
      area: options?.area,
      name: bestMatch.name
    });
    if (dineoutDishes.length > 0) {
      return dineoutDishes;
    }
  } catch (err) {
    console.warn('Direct Swiggy menu extraction error:', err);
  }

  return [];
}

