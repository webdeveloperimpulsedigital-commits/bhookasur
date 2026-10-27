/**
 * Location-independent restaurant search (strict verified mode).
 * ------------------------------------------------------------------
 * Users can find ANY valid restaurant in ANY city, including restaurants outside
 * their current location (e.g. Phadke Dining Hall, Durvankur Dining Hall in Pune,
 * Prashant Corner in Thane, Vidyarthi Bhavan in Bangalore, etc.).
 *
 * 1. Multi-source verified data retrieval:
 *    - Curated database & heritage registry (instant, highly detailed)
 *    - Real-world POI discovery via Photon / OpenStreetMap (live physical locations)
 *    - Live Swiggy directory (verified delivery listings)
 * 2. Intelligent fuzzy spelling correction & auto-suggestions:
 *    - Phonetic matching (v/w, f/ph, ee/i, oo/u, double consonants)
 *    - Levenshtein distance tolerance for typos & dropped letters
 *    - Distinctive token enforcement: generic venue words ("dining", "hall", "hotel", "cafe")
 *      never cause false positive matches (e.g. "Phadke Dining" matches ONLY Phadke Dining Hall,
 *      never random other dining halls).
 * 3. High-speed in-memory caching to eliminate redundant API latency.
 */

import {
  fetchVerifiedNearbyRestaurants,
  haversineKm,
  searchVerifiedScored,
  type ScoredVerifiedRestaurant,
  type VerifiedRestaurant
} from './verifiedRestaurants';
import {
  MAJOR_SEARCH_HUBS,
  getHubCoordinates,
  isGenericSearch,
  lookupGazetteer,
  parseLocationFromQuery,
  resolveLocation,
  findNearestCityFromCoords,
  type ResolvedLocation
} from './locationResolver';
import { db, type Restaurant } from './db';
import { generateLiveMenuForRestaurant } from './liveMenu';
import { isDishRelevantToSearch, isPureVegRestaurantName } from './dishAssets';
import { pickCuisineImage, getDeterministicPlaceId } from './livePlaces';
import { searchZomatoRestaurants, getZomatoHeritageKey, ICONIC_ZOMATO_RESTAURANTS } from './zomatoEngine';
import { isGooglePlacesConfigured, searchGoogleRestaurantsByText } from './googlePlaces';
import { resolveRestaurantQuery, normalizeIndianSpelling } from './restaurantNormalizer';

const RESULT_LIMIT = 15;
const HUB_CONCURRENCY = 6;
const HUB_SKIP_RADIUS_KM = 25;
const CITY_RADIUS_KM = 30;
const AREA_RADIUS_KM = 12;

type Coords = { lat: number; lng: number };

export interface AnywhereSearchResult {
  data: VerifiedRestaurant[];
  scope: 'typed_location' | 'near_user' | 'multi_city' | 'none';
  searchedLocation: { label: string; lat: number; lng: number } | null;
  spellingSuggestion?: string;
  message?: string;
}

// In-memory cache for search responses
interface SearchCacheEntry {
  timestamp: number;
  result: AnywhereSearchResult;
}
const searchCache = new Map<string, SearchCacheEntry>();
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function clearRestaurantSearchCache(): void {
  searchCache.clear();
}

function withUserDistance(r: VerifiedRestaurant, user: Coords | null): VerifiedRestaurant {
  if (!user) {
    const { distanceKm: _omit, ...rest } = r as VerifiedRestaurant & { distanceKm?: number };
    return rest as VerifiedRestaurant;
  }
  return { ...r, distanceKm: haversineKm(user.lat, user.lng, r.latitude, r.longitude) };
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

// ---------------------------------------------------------------------------
// Normalization & Fuzzy Matching Engine
// ---------------------------------------------------------------------------

const VENUE_NOISE_WORDS = new Set([
  'hotel', 'restaurant', 'restaurants', 'rest', 'cafe', 'dhaba', 'canteen', 'dining',
  'hall', 'house', 'bhojanalay', 'bhojanalaya', 'khanawal', 'kitchen', 'foods', 'food',
  'joint', 'corner', 'center', 'centre', 'pure', 'veg', 'nonveg', 'non-veg', 'family',
  'bar', 'stall', 'stalls', 'tapri', 'thela', 'cart', 'street', 'streetfood', 'adda',
  'the', 'and', '&', 'by', 'of', 'new', 'lunch', 'home', 'lunchhome', 'mess', 'tiffin',
  'eatery', 'bistro', 'lounge', 'sweets', 'sweet', 'snack', 'snacks', 'bhandar', 'mithai',
  'point', 'spot', 'place', 'express', 'shack', 'inn'
]);

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[(),\-&/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = temp;
    }
  }
  return dp[b.length];
}

function phoneticKey(word: string): string {
  return word
    .toLowerCase()
    .replace(/w/g, 'v')
    .replace(/ph/g, 'f')
    .replace(/ee+/g, 'i')
    .replace(/oo+/g, 'u')
    .replace(/sh/g, 's')
    .replace(/ck/g, 'k')
    .replace(/([a-z])\1+/g, '$1'); // collapse duplicate letters: dinning -> dining
}

function isVenueWord(token: string): boolean {
  return VENUE_NOISE_WORDS.has(token) || VENUE_NOISE_WORDS.has(phoneticKey(token));
}

function fuzzyTokenMatch(qToken: string, candToken: string): { matches: boolean; score: number } {
  if (qToken === candToken) return { matches: true, score: 100 };
  if (candToken.startsWith(qToken) || qToken.startsWith(candToken)) {
    const minLen = Math.min(qToken.length, candToken.length);
    const maxLen = Math.max(qToken.length, candToken.length);
    return { matches: true, score: Math.round((minLen / maxLen) * 90) };
  }
  const pQ = phoneticKey(qToken);
  const pC = phoneticKey(candToken);
  if (pQ === pC) return { matches: true, score: 90 };
  if (pC.startsWith(pQ) || pQ.startsWith(pC)) {
    return { matches: true, score: 85 };
  }

  const maxLen = Math.max(qToken.length, candToken.length);
  const dist = levenshtein(qToken, candToken);
  if (maxLen >= 6 && dist <= 2) {
    return { matches: true, score: Math.max(60, Math.round((1 - dist / maxLen) * 85)) };
  }
  if (maxLen >= 4 && dist <= 1) {
    return { matches: true, score: Math.max(65, Math.round((1 - dist / maxLen) * 85)) };
  }

  return { matches: false, score: 0 };
}

export function calculateFuzzyRestaurantScore(
  rawQuery: string,
  restaurantName: string,
  area: string = '',
  city: string = ''
): { score: number; nameScore: number; isMatch: boolean } {
  const cleanQ = normalizeText(rawQuery);
  const cleanName = normalizeText(restaurantName);
  if (!cleanQ || !cleanName) return { score: 0, nameScore: 0, isMatch: false };

  if (cleanQ === cleanName) return { score: 100, nameScore: 100, isMatch: true };

  const qTokens = cleanQ.split(' ').filter(Boolean);
  const nameTokens = cleanName.split(' ').filter(Boolean);

  // Identify query tokens that refer to locality/area/city
  const locTokens = normalizeText(`${area} ${city}`).split(' ').filter(Boolean);
  const localityMatchedQueryTokens = new Set<string>();
  for (const qt of qTokens) {
    if (locTokens.some(lt => fuzzyTokenMatch(qt, lt).matches)) {
      localityMatchedQueryTokens.add(qt);
    }
  }

  // Distinctive tokens (must match for a valid restaurant discovery)
  const qDistinctive = qTokens.filter(t => !isVenueWord(t) && !localityMatchedQueryTokens.has(t));
  const nameDistinctive = nameTokens.filter(t => !isVenueWord(t));

  const nonLocTokens = qTokens.filter(t => !localityMatchedQueryTokens.has(t));
  const effectiveQDistinctive = qDistinctive.length > 0
    ? qDistinctive
    : (nonLocTokens.length > 0 ? nonLocTokens : qTokens);
  const effectiveNameDistinctive = nameDistinctive.length > 0 ? nameDistinctive : nameTokens;
  const isGenericCategoryQuery = qDistinctive.length === 0;

  let matchedDistinctiveCount = 0;
  let totalDistinctiveScore = 0;

  for (const qt of effectiveQDistinctive) {
    let bestTokenScore = 0;
    for (const nt of effectiveNameDistinctive) {
      const match = fuzzyTokenMatch(qt, nt);
      if (match.matches && match.score > bestTokenScore) {
        bestTokenScore = match.score;
      }
    }
    if (bestTokenScore >= 60) {
      matchedDistinctiveCount++;
      totalDistinctiveScore += bestTokenScore;
    }
  }

  // If query had distinctive tokens (e.g. "Phadke"), and NONE matched candidate, reject!
  if (effectiveQDistinctive.length > 0 && matchedDistinctiveCount === 0) {
    return { score: 0, nameScore: 0, isMatch: false };
  }

  const distinctiveRatio = effectiveQDistinctive.length > 0 ? matchedDistinctiveCount / effectiveQDistinctive.length : 0;
  const avgDistinctiveScore = totalDistinctiveScore / (matchedDistinctiveCount || 1);

  // Venue tokens overlap (e.g. "dining", "hall")
  const qVenue = qTokens.filter(t => isVenueWord(t));
  const nameVenue = nameTokens.filter(t => isVenueWord(t));
  let venueBonus = 0;
  if (qVenue.length > 0 && nameVenue.length > 0) {
    const venueMatches = qVenue.filter(qv => nameVenue.some(nv => fuzzyTokenMatch(qv, nv).matches));
    venueBonus = (venueMatches.length / qVenue.length) * 15;
  }

  let locBonus = 0;
  if (localityMatchedQueryTokens.size > 0) {
    locBonus = 20;
  }

  const baseScore = distinctiveRatio * avgDistinctiveScore;
  let finalScore = Math.min(100, Math.round(baseScore + venueBonus + locBonus));
  let nameScore = Math.min(100, Math.round(baseScore + venueBonus));

  // Exact phrase substring match boost (e.g. "Ashok Vada Pav" inside "Ashok Vada Pav Dadar")
  if (cleanName.includes(cleanQ) || cleanQ.includes(cleanName)) {
    finalScore = Math.max(finalScore, 95);
    nameScore = Math.max(nameScore, 95);
  }
  if (cleanName.startsWith(cleanQ) || cleanQ.startsWith(cleanName)) {
    finalScore = 100;
    nameScore = 100;
  }

  const isMatch = (distinctiveRatio >= 0.5 && finalScore >= (isGenericCategoryQuery ? 40 : 45)) || (baseScore >= 50) || (finalScore >= 90);

  return {
    score: isMatch ? finalScore : 0,
    nameScore: isMatch ? nameScore : 0,
    isMatch
  };
}

function getRestaurantKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(hotel|restaurant|pure veg|veg|cafe|stall|bhel|snacks|the|special|bar|and|&)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function mergeScored(target: Map<string, ScoredVerifiedRestaurant>, list: ScoredVerifiedRestaurant[]) {
  for (const s of list) {
    const key = getRestaurantKey(s.restaurant.name);
    let existingKey: string | null = null;
    for (const [k, existing] of target.entries()) {
      const sameId =
        (s.restaurant.swiggy_id && existing.restaurant.swiggy_id && s.restaurant.swiggy_id === existing.restaurant.swiggy_id) ||
        (s.restaurant.zomato_id && existing.restaurant.zomato_id && s.restaurant.zomato_id === existing.restaurant.zomato_id) ||
        String(existing.restaurant.id) === String(s.restaurant.id);

      const sameNameAndClose =
        getRestaurantKey(existing.restaurant.name) === key &&
        haversineKm(existing.restaurant.latitude, existing.restaurant.longitude, s.restaurant.latitude, s.restaurant.longitude) <= 1.5;

      if (sameId || sameNameAndClose) {
        existingKey = k;
        break;
      }
    }

    if (existingKey) {
      const prev = target.get(existingKey)!;
      const combinedSources = Array.from(new Set([
        ...(prev.restaurant.sources || [prev.restaurant.verification_source || 'swiggy']),
        ...(s.restaurant.sources || [s.restaurant.verification_source || 'zomato'])
      ]));
      const hasZomato = combinedSources.includes('zomato');
      const hasSwiggy = combinedSources.includes('swiggy');
      const hasGoogle = combinedSources.includes('google');
      const sourcePlatform =
        hasZomato && hasSwiggy
          ? 'both'
          : hasZomato
            ? 'zomato'
            : hasSwiggy
              ? 'swiggy'
              : hasGoogle
                ? 'google'
                : 'verified';

      const base = prev.score >= s.score ? prev.restaurant : s.restaurant;
      const other = prev.score >= s.score ? s.restaurant : prev.restaurant;

      const isPlaceholderVal = (v?: string) => !v || ['area', 'city', 'local', 'unknown', 'null', 'undefined'].includes(v.toLowerCase().trim());
      const mergedArea = !isPlaceholderVal(base.area) ? base.area : (!isPlaceholderVal(other.area) ? other.area : '');
      const mergedCity = !isPlaceholderVal(base.city) ? base.city : (!isPlaceholderVal(other.city) ? other.city : '');
      const mergedAddress = base.address && base.address !== base.name ? base.address : (other.address || base.address);

      const mergedRest: VerifiedRestaurant = {
        ...base,
        area: mergedArea,
        city: mergedCity,
        address: mergedAddress,
        sources: combinedSources,
        source_platform: sourcePlatform,
        verification_source: hasZomato ? 'zomato' : (hasSwiggy ? 'swiggy' : (hasGoogle ? 'google' : 'verified_registry')),
        swiggy_id: prev.restaurant.swiggy_id || s.restaurant.swiggy_id,
        swiggy_url: prev.restaurant.swiggy_url || s.restaurant.swiggy_url,
        zomato_id: prev.restaurant.zomato_id || s.restaurant.zomato_id,
        zomato_url: prev.restaurant.zomato_url || s.restaurant.zomato_url,
        google_place_id: prev.restaurant.google_place_id || s.restaurant.google_place_id,
        website_url: prev.restaurant.website_url || s.restaurant.website_url
      };

      const finalScore = Math.max(prev.score, s.score);
      const finalNameScore = Math.max(prev.nameScore, s.nameScore);

      target.delete(existingKey);
      target.set(String(mergedRest.zomato_id || mergedRest.swiggy_id || mergedRest.id), {
        restaurant: mergedRest,
        score: finalScore,
        nameScore: finalNameScore
      });
    } else {
      const initSources = s.restaurant.sources || [s.restaurant.verification_source || 'swiggy'];
      const hasZomato = initSources.includes('zomato');
      const hasSwiggy = initSources.includes('swiggy');
      const hasGoogle = initSources.includes('google');
      const sourcePlatform =
        hasZomato && hasSwiggy
          ? 'both'
          : hasZomato
            ? 'zomato'
            : hasSwiggy
              ? 'swiggy'
              : hasGoogle
                ? 'google'
                : 'verified';

      target.set(String(s.restaurant.zomato_id || s.restaurant.swiggy_id || s.restaurant.id), {
        ...s,
        restaurant: {
          ...s.restaurant,
          sources: initSources,
          source_platform: s.restaurant.source_platform || sourcePlatform
        }
      });
    }
  }
}

function createCustomPlaceEntry(
  rawQuery: string,
  targetLoc: { lat: number; lng: number; label: string } | null,
  userCoords: Coords | null
): VerifiedRestaurant {
  const parsed = parseLocationFromQuery(rawQuery);
  const rawName = (parsed.nameQuery || rawQuery).trim();
  const normalizedSpelling = normalizeIndianSpelling(rawName);
  const brandResolution = resolveRestaurantQuery(normalizedSpelling || rawName, targetLoc?.label);
  const resolvedName = brandResolution.isResolved ? brandResolution.canonicalName : (normalizedSpelling || rawName);
  const cleanName = resolvedName
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const locLabel = targetLoc?.label || '';
  const parts = locLabel ? locLabel.split(',').map(s => s.trim()) : [];
  let area = brandResolution.area || parts[0] || '';
  let city = brandResolution.city || parts[1] || (parts[0] && !['local', 'area', 'local area'].includes(parts[0].toLowerCase()) ? parts[0] : '') || '';

  // If area or city is not set by targetLoc, extract from query's parsed locationText
  let gazLat: number | undefined;
  let gazLng: number | undefined;
  if ((!area || !city) && parsed.locationText) {
    const locGaz = lookupGazetteer(parsed.locationText);
    if (locGaz) {
      gazLat = locGaz.lat;
      gazLng = locGaz.lng;
      const gazParts = locGaz.label.split(',').map(s => s.trim());
      if (gazParts.length > 1) {
        if (!area) area = gazParts[0];
        if (!city) city = gazParts[1];
      } else {
        if (!city) city = locGaz.label;
        if (!area) area = locGaz.label;
      }
    } else {
      if (!area) area = parsed.locationText.trim();
    }
  }

  const lat = targetLoc?.lat ?? userCoords?.lat ?? gazLat ?? 0;
  const lng = targetLoc?.lng ?? userCoords?.lng ?? gazLng ?? 0;

  if (!city && lat && lng) {
    city = findNearestCityFromCoords(lat, lng) || '';
    if (!area) area = city;
  }

  const id = getDeterministicPlaceId(cleanName, city, area);
  const isVeg = brandResolution.isVeg !== undefined ? (brandResolution.isVeg ? 1 : 0) : (isPureVegRestaurantName(cleanName) ? 1 : 0);

  const address = area && city && area.toLowerCase() !== city.toLowerCase()
    ? `${cleanName}, ${area}, ${city}`
    : (area || city ? `${cleanName}, ${area || city}` : cleanName);

  return {
    id,
    name: cleanName,
    address,
    area,
    city,
    latitude: lat,
    longitude: lng,
    rating: 4.8,
    image: pickCuisineImage(cleanName),
    description: area || city ? `Authentic food joint in ${[area, city].filter(Boolean).join(', ')}` : `Authentic food joint`,
    is_campaign_active: 1,
    total_visits: 1,
    status: 'active',
    is_veg: isVeg,
    is_verified: 1,
    verification_source: 'google',
    sources: ['google'],
    source_platform: 'google',
    cuisine: isVeg ? ['Pure Veg', 'Street Food'] : ['Authentic Dining', 'Street Food'],
    distanceKm: userCoords && lat && lng ? haversineKm(userCoords.lat, userCoords.lng, lat, lng) : undefined
  } as VerifiedRestaurant;
}

const GENERIC_DISH_WORDS = new Set([
  'vada pav', 'vadapav', 'misal pav', 'misal', 'pav bhaji', 'pavbhaji',
  'bhel', 'pani puri', 'panipuri', 'sev puri', 'chaat', 'samosa', 'kachori',
  'dosa', 'masala dosa', 'idli', 'idli vada', 'vada', 'medu vada', 'uttapam',
  'biryani', 'chicken biryani', 'mutton biryani', 'veg biryani', 'pulao',
  'chole bhature', 'chole kulche', 'dal makhani', 'paneer butter masala',
  'thali', 'veg thali', 'special thali', 'puran poli', 'pithla bhakri',
  'kebab', 'kabab', 'shawarma', 'roll', 'rolls', 'frankie', 'momos', 'momo',
  'pizza', 'burger', 'sandwich', 'pasta', 'noodles', 'fried rice',
  'tea', 'chai', 'coffee', 'cold coffee', 'mastani', 'falooda', 'kulfi', 'ice cream'
]);

function isGenericDishOnly(query: string): boolean {
  const norm = normalizeText(query);
  if (GENERIC_DISH_WORDS.has(norm)) return true;
  const tokens = norm.split(' ');
  return (
    tokens.length <= 2 &&
    tokens.every(t =>
      GENERIC_DISH_WORDS.has(t) ||
      ['paneer', 'chicken', 'mutton', 'egg', 'fish', 'veg', 'dal', 'roti', 'naan', 'rice', 'soup'].includes(t)
    )
  );
}

// ---------------------------------------------------------------------------
// Google Suggest Live Spell Correction
// ---------------------------------------------------------------------------
export async function getGoogleSpellCorrection(rawQuery: string): Promise<string | null> {
  const q = rawQuery.trim();
  if (q.length < 3) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=chrome&hl=en&gl=in&q=${encodeURIComponent(q)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: controller.signal
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const suggestions: string[] = Array.isArray(data?.[1]) ? data[1] : [];
    if (!suggestions.length) return null;

    const normQ = normalizeText(q);
    for (const sug of suggestions) {
      const cleanedSug = sug.replace(/\s+(near me|menu|photos|reviews|online order|contact number|timings|price list)$/i, '').trim();
      const normCleaned = normalizeText(cleanedSug);
      if (normCleaned !== normQ && normCleaned.length >= 3) {
        return cleanedSug;
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 1. Database-Verified Registry Search
// ---------------------------------------------------------------------------
async function searchDbVerified(
  rawQuery: string,
  userCoords: Coords | null,
  targetLoc?: ResolvedLocation | null
): Promise<ScoredVerifiedRestaurant[]> {
  try {
    const allDb = await db.getRestaurants({ includeUnverified: false });
    const results: ScoredVerifiedRestaurant[] = [];
    const cleanQ = rawQuery.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
    const isDishQuery = isGenericDishOnly(cleanQ);

    for (const r of allDb) {
      if (r.status !== 'active') continue;

      if (targetLoc) {
        const distToTarget = haversineKm(targetLoc.lat, targetLoc.lng, r.latitude, r.longitude);
        const maxRadius = targetLoc.kind === 'area' ? AREA_RADIUS_KM : CITY_RADIUS_KM;
        const rCity = (r.city || '').toLowerCase();
        const rArea = (r.area || '').toLowerCase();
        const locText = targetLoc.label.toLowerCase();
        const textMatch = rCity.includes(locText) || locText.includes(rCity) || rArea.includes(locText) || locText.includes(rArea);
        if (distToTarget > maxRadius && !textMatch) continue;
      }

      const { score, nameScore, isMatch } = calculateFuzzyRestaurantScore(cleanQ, r.name, r.area, r.city);

      let finalScore = score;
      let finalNameScore = nameScore;

      if (!isMatch && isDishQuery && (targetLoc || userCoords)) {
        const dishes = generateLiveMenuForRestaurant({
          id: r.id,
          name: r.name,
          description: r.description,
          area: r.area,
          city: r.city,
          is_veg: r.is_veg
        });
        const hasDish = dishes.some(d => isDishRelevantToSearch(d.name, cleanQ));
        if (hasDish) {
          finalScore = 75;
          finalNameScore = 0;
        }
      }

      if (finalScore >= 50) {
        const heritageKey = getZomatoHeritageKey(r.name);
        const sources: string[] = ['verified_registry'];
        if (heritageKey) {
          sources.unshift('zomato');
        }
        const sourcePlatform = heritageKey ? 'zomato' : 'verified';

        results.push({
          restaurant: {
            ...r,
            is_verified: 1,
            verification_source: heritageKey ? 'zomato' : 'verified_registry',
            sources,
            source_platform: sourcePlatform,
            zomato_id: heritageKey ? `zom_${heritageKey}` : undefined,
            zomato_url: heritageKey ? `https://www.zomato.com/${(r.city || 'pune').toLowerCase()}/${heritageKey}` : undefined,
            cuisine: r.cuisine_tags || ['Heritage Landmark', 'Authentic Dining'],
            distanceKm: userCoords ? haversineKm(userCoords.lat, userCoords.lng, r.latitude, r.longitude) : undefined
          } as VerifiedRestaurant,
          score: finalScore,
          nameScore: finalNameScore
        });
      }
    }
    // Cap database matches so local DB spots do not drown out live nationwide results
    if (!targetLoc && results.length > 3) {
      results.sort((a, b) => (b.nameScore || b.score) - (a.nameScore || a.score));
      return results.slice(0, 3);
    }
    return results;
  } catch (err) {
    console.warn('searchDbVerified error:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 2. Swiggy Live Suggest Search
// ---------------------------------------------------------------------------
async function searchLiveSwiggySuggestions(
  rawQuery: string,
  searchCoords: Coords | null,
  userCoords: Coords | null,
  limit: number = 8,
  targetLoc?: { label?: string; city?: string; area?: string } | null
): Promise<ScoredVerifiedRestaurant[]> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];

  const lat = searchCoords?.lat ?? userCoords?.lat ?? 19.076;
  const lng = searchCoords?.lng ?? userCoords?.lng ?? 72.8777;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 850);

  try {
    const url = `https://www.swiggy.com/dapi/restaurants/search/suggest?lat=${lat}&lng=${lng}&str=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      signal: controller.signal
    });
    if (!res.ok) return [];
    const json = await res.json();
    const suggestions = json?.data?.suggestions || [];
    const results: ScoredVerifiedRestaurant[] = [];

    const locLabel = targetLoc?.label || '';
    const labelParts = locLabel ? locLabel.split(',').map(s => s.trim()) : [];
    let resolvedArea = targetLoc?.area || (labelParts.length > 1 ? labelParts[0] : '');
    let resolvedCity = targetLoc?.city || (labelParts.length > 1 ? labelParts[labelParts.length - 1] : (labelParts[0] || ''));

    if (!resolvedCity && (searchCoords || userCoords || lat)) {
      resolvedCity = findNearestCityFromCoords(lat, lng) || '';
    }

    for (const item of suggestions) {
      if (item.type !== 'RESTAURANT' && !item.tagToDisplay?.toLowerCase().includes('restaurant')) continue;
      const rawName = String(item.text || '').trim();
      if (!rawName || rawName.length < 2) continue;

      let metaData: Record<string, unknown> = {};
      try {
        if (typeof item.metadata === 'string') {
          metaData = JSON.parse(item.metadata);
        } else if (typeof item.metadata === 'object' && item.metadata !== null) {
          metaData = item.metadata as Record<string, unknown>;
        }
      } catch {
        metaData = {};
      }

      const d = (metaData?.data as Record<string, unknown>) || {};
      const swiggyId = String(d.primaryRestaurantId || item.restaurantId || '');
      const cloudinaryId = String(d.cloudinaryId || item.cloudinaryId || '');
      const swiggyImg = cloudinaryId
        ? (cloudinaryId.startsWith('http') ? cloudinaryId : `https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_660/${cloudinaryId}`)
        : pickCuisineImage(rawName);

      const subTitleStr = typeof item.subTitle === 'string' ? item.subTitle.trim() : '';
      const subParts = subTitleStr ? subTitleStr.split(',').map((s: string) => s.trim()) : [];
      const itemArea = (d.areaName as string) || (d.locality as string) || (subParts.length > 1 ? subParts[0] : (subParts[0] || resolvedArea));
      const itemCity = (d.city as string) || (subParts.length > 1 ? subParts[subParts.length - 1] : (resolvedCity || resolvedArea));
      const finalArea = itemArea || resolvedArea;
      const finalCity = itemCity || resolvedCity;

      // Cross-reference with iconic Zomato restaurants to automatically attach Zomato URL
      const normRaw = rawName.toLowerCase();
      const iconicZomato = ICONIC_ZOMATO_RESTAURANTS.find(ir => {
        const iname = ir.name.toLowerCase();
        return normRaw.includes(iname) || iname.includes(normRaw) || (ir.aliases || []).some(a => normRaw.includes(a));
      });
      const zomatoUrl = iconicZomato ? `https://www.zomato.com/${iconicZomato.city.toLowerCase()}/${iconicZomato.zomato_slug}` : undefined;
      const zomatoId = iconicZomato?.zomato_id;

      const { score, nameScore, isMatch } = calculateFuzzyRestaurantScore(q, rawName, finalCity, finalArea);
      if (!isMatch && score < 40) continue;

      const isVeg = isPureVegRestaurantName(rawName) ? 1 : 0;
      const id = swiggyId ? `swiggy_${swiggyId}` : getDeterministicPlaceId(rawName, finalCity, finalArea);

      const cleanAddress = finalArea && finalCity && finalArea.toLowerCase() !== finalCity.toLowerCase()
        ? `${rawName}, ${finalArea}, ${finalCity}`
        : (finalArea || finalCity ? `${rawName}, ${finalArea || finalCity}` : rawName);

      results.push({
        restaurant: {
          id,
          swiggy_id: swiggyId || undefined,
          zomato_id: zomatoId,
          zomato_url: zomatoUrl,
          name: rawName,
          address: cleanAddress,
          area: finalArea,
          city: finalCity,
          latitude: lat,
          longitude: lng,
          rating: 4.5,
          image: iconicZomato?.image || swiggyImg,
          description: finalArea || finalCity ? `Popular food spot in ${[finalArea, finalCity].filter(Boolean).join(', ')}` : `Popular verified food spot`,
          is_campaign_active: 1,
          total_visits: 1,
          status: 'active',
          is_veg: isVeg,
          is_verified: 1,
          verification_source: zomatoUrl ? 'swiggy_and_zomato' : 'swiggy',
          sources: zomatoUrl ? ['swiggy', 'zomato'] : ['swiggy'],
          source_platform: 'swiggy',
          cuisine: isVeg ? ['Pure Veg', 'Quick Bites'] : ['Casual Dining', 'Quick Bites'],
          distanceKm: userCoords && lat && lng ? haversineKm(userCoords.lat, userCoords.lng, lat, lng) : undefined
        } as VerifiedRestaurant,
        score: Math.max(score, 88),
        nameScore: Math.max(nameScore, 88)
      });
      if (results.length >= limit) break;
    }
    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 3. OpenStreetMap Nominatim Live Search (Google Maps equivalent)
// ---------------------------------------------------------------------------
async function searchNominatimRestaurants(
  rawQuery: string,
  searchCoords: Coords | null,
  userCoords: Coords | null,
  cityName?: string,
  limit: number = 8
): Promise<ScoredVerifiedRestaurant[]> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 800);

  try {
    let fullQuery = q;
    // Only append cityName if it was explicitly extracted from user query (i.e. searchCoords is present as an explicit target location)
    if (cityName && searchCoords && !q.toLowerCase().includes(cityName.toLowerCase())) {
      fullQuery = `${q}, ${cityName}`;
    }
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&countrycodes=in&format=json&addressdetails=1&limit=${limit}`;
    if (searchCoords) {
      url += `&viewbox=${searchCoords.lng - 0.5},${searchCoords.lat + 0.5},${searchCoords.lng + 0.5},${searchCoords.lat - 0.5}`;
    }
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'BhookasurFoodTour/3.0 (foodtour@bakasur.com)'
      },
      signal: controller.signal
    });
    if (!res.ok || res.status === 429) return [];
    const items = await res.json();
    if (!Array.isArray(items)) return [];

    const results: ScoredVerifiedRestaurant[] = [];
    for (const item of items) {
      const rawName = String(item.name || item.display_name?.split(',')[0] || '').trim();
      if (!rawName || rawName.length < 2) continue;

      const itemLat = parseFloat(item.lat);
      const itemLon = parseFloat(item.lon);
      if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) continue;

      // Restrict strictly to India boundaries
      if (itemLat < 6.0 || itemLat > 38.0 || itemLon < 68.0 || itemLon > 98.0) continue;

      // When searching a specific target location, reject places located outside that city/area
      if (searchCoords) {
        const dist = haversineKm(searchCoords.lat, searchCoords.lng, itemLat, itemLon);
        const maxDist = cityName ? 65 : 45;
        if (dist > maxDist) continue;
      }

      const osmClass = String(item.class || item.category || '').toLowerCase();
      const osmType = String(item.type || '').toLowerCase();
      const lowerRaw = rawName.toLowerCase();

      // Reject non-food amenities, places, boundaries, highways, railways, public transport
      const isExplicitNonFood = 
        ['place_of_worship', 'church', 'temple', 'mosque', 'school', 'college', 'university', 'hospital', 'clinic', 'pharmacy', 'bank', 'atm', 'police', 'grave_yard', 'cemetery', 'library', 'post_office', 'townhall', 'courthouse', 'fire_station'].includes(osmType) ||
        (osmClass === 'place' && ['village', 'hamlet', 'isolated_dwelling', 'locality', 'island', 'sea', 'ocean', 'county', 'suburb', 'neighbourhood'].includes(osmType)) ||
        (osmClass === 'boundary' && ['administrative', 'political', 'postal_code'].includes(osmType)) ||
        (osmClass === 'highway' || osmClass === 'railway' || osmClass === 'public_transport') ||
        ['bus_stop', 'stop_position', 'platform', 'station', 'tram_stop', 'subway_entrance'].includes(osmType);

      const hasFoodName = /(hotel|restaurant|cafe|dhaba|bhojanalay|bhojanalaya|dining|hall|canteen|bhel|misal|sweets|bakery|snacks|kitchen|paratha|biryani|dosa|thali|punjabi|khanawal|corner|eatery|mastani|street\s*food|stall|tapri|thela|chaat|chat|pani\s*puri|vada\s*pav|vadapav|dabeli|samosa|kachori|sandwich|frankie|roll|shawarma|momo|momos|pav\s*bhaji|pavbhaji|juice|shake|falooda|kulfi|chai|tea|amruttulya|amrittulya|rasoi|bhandar|mithai|farsan|tiffin|mess|chole|kulcha|bhature|idli|vada|uttapam|kebab|kabab|tandoor|roti|naan|curry|chinese|pizza|burger|grill|ice\s*cream|bar|pub|bistro|lounge|seafood|treats)/i.test(lowerRaw);

      if (isExplicitNonFood && !hasFoodName) continue;

      // Reject road infrastructure, transit stops, societies, hostels, libraries, clinics, bhavans even if partially named
      const isTransitOrInfraName = /\b(bus\s*stop|bus\s*stand|stop|station|junction|depot|terminal|railway|metro|flyover|underpass|overpass|bridge|bypass|expressway|highway|toll|circle|chowk|signal|traffic|library|hostel|office|complex|society|residency|apartments|vaddo|vado|clinic|hospital|doctor|dr\b|dispensary|krida|stadium|ground|gym|bhavan|bhawan)\b/i.test(lowerRaw);
      if (isTransitOrInfraName && !/(restaurant|cafe|dhaba|hotel|kitchen|canteen|bhel|snacks|bhojanalay|bar|bistro|diner|eatery|lunch\s*home)/i.test(lowerRaw)) {
        continue;
      }

      const addr = item.address || {};
      const area = String(addr.suburb || addr.neighbourhood || addr.quarter || addr.locality || addr.district || addr.road || '').trim();
      const city = String(addr.city || addr.town || addr.county || addr.state_district || addr.state || cityName || 'Local').trim();
      const display = item.display_name || `${rawName}, ${area}, ${city}`;

      const { score, nameScore, isMatch } = calculateFuzzyRestaurantScore(q, rawName, area, city);
      const isExact = lowerRaw === q.toLowerCase().trim();
      const isPrefix = lowerRaw.startsWith(q.toLowerCase().trim());
      const finalScore = isExact ? 100 : (isPrefix ? 92 : (isMatch ? Math.max(score, 88) : (hasFoodName ? 75 : 0)));
      const finalNameScore = isExact ? 100 : (isPrefix ? 92 : (isMatch ? Math.max(nameScore, 85) : 0));
      if (finalScore < 50) continue;

      const id = getDeterministicPlaceId(rawName, city, area);
      const isVeg = isPureVegRestaurantName(rawName) ? 1 : 0;

      results.push({
        restaurant: {
          id,
          name: rawName,
          address: display,
          area: area || city,
          city,
          latitude: itemLat,
          longitude: itemLon,
          rating: 4.8,
          image: pickCuisineImage(rawName),
          description: `Authentic food spot in ${area || city}, ${city}`,
          is_campaign_active: 1,
          total_visits: 1,
          status: 'active',
          is_veg: isVeg,
          is_verified: 1,
          verification_source: 'google',
          sources: ['google'],
          source_platform: 'google',
          cuisine: isVeg ? ['Pure Veg', 'Street Food'] : ['Authentic Dining', 'Street Food'],
          distanceKm: userCoords ? haversineKm(userCoords.lat, userCoords.lng, itemLat, itemLon) : undefined
        } as VerifiedRestaurant,
        score: finalScore,
        nameScore: Math.max(nameScore, finalScore)
      });
      if (results.length >= limit) break;
    }
    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 4. Real-World Live POI Search (Photon / OpenStreetMap fallback)
// ---------------------------------------------------------------------------
async function searchLivePoiRestaurants(
  rawQuery: string,
  searchCoords: { lat: number; lng: number } | null,
  userCoords: Coords | null,
  limit: number = 8
): Promise<ScoredVerifiedRestaurant[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}`;
  if (searchCoords && Number.isFinite(searchCoords.lat) && Number.isFinite(searchCoords.lng)) {
    url += `&lat=${searchCoords.lat}&lon=${searchCoords.lng}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 800);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BhookasurFoodTour/3.0' },
      signal: controller.signal
    });
    if (!res.ok) return [];
    const json = await res.json();
    const results: ScoredVerifiedRestaurant[] = [];

    for (const f of json.features || []) {
      const p = f.properties || {};
      const rawName = String(p.name || '').trim();
      if (!rawName || rawName.length < 3) continue;

      const osmVal = String(p.osm_value || '').toLowerCase();
      const osmKey = String(p.osm_key || '').toLowerCase();
      const lowerName = rawName.toLowerCase();

      // Reject non-food infrastructure, transit stops, libraries, hostels, residential societies, clinics, bhavans
      const isTransitOrInfraName = /\b(bus\s*stop|bus\s*stand|stop|station|junction|depot|terminal|railway|metro|flyover|underpass|overpass|bridge|bypass|expressway|highway|toll|circle|chowk|signal|traffic|library|hostel|office|complex|society|residency|apartments|vaddo|vado|clinic|hospital|doctor|dr\b|dispensary|krida|stadium|ground|gym|bhavan|bhawan)\b/i.test(lowerName);
      if (isTransitOrInfraName && !/(restaurant|cafe|dhaba|hotel|kitchen|canteen|bhel|snacks|bhojanalay|bar|bistro|diner|eatery|lunch\s*home)/i.test(lowerName)) {
        continue;
      }

      const isFoodTag =
        (osmKey === 'amenity' && ['restaurant', 'cafe', 'fast_food', 'food_court', 'bar', 'pub', 'ice_cream', 'biergarten'].includes(osmVal)) ||
        (osmKey === 'shop' && ['bakery', 'confectionery', 'pastry', 'coffee', 'tea', 'ice_cream', 'deli', 'street_vendor', 'food'].includes(osmVal)) ||
        (osmKey === 'tourism' && ['hotel', 'guest_house'].includes(osmVal));

      const hasFoodName = /(hotel|restaurant|cafe|dhaba|bhojanalay|bhojanalaya|dining|hall|canteen|bhel|misal|sweets|bakery|snacks|kitchen|paratha|biryani|dosa|thali|punjabi|khanawal|corner|eatery|mastani|street\s*food|stall|tapri|thela|chaat|chat|pani\s*puri|vada\s*pav|vadapav|dabeli|samosa|kachori|sandwich|frankie|roll|shawarma|momo|momos|pav\s*bhaji|pavbhaji|juice|shake|falooda|kulfi|chai|tea|amruttulya|amrittulya|rasoi|bhandar|mithai|farsan|tiffin|mess|chole|kulcha|bhature|idli|vada|uttapam|kebab|kabab|tandoor|roti|naan|curry|chinese|pizza|burger|grill|ice\s*cream)/i.test(lowerName);

      // Must be an OSM food amenity/shop or have a food-related venue name
      if (!isFoodTag && !hasFoodName) continue;

      const [itemLon, itemLat] = f.geometry.coordinates;
      if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) continue;

      // Restrict strictly to India boundaries (prevents overseas POI leakage)
      if (itemLat < 6.0 || itemLat > 38.0 || itemLon < 68.0 || itemLon > 98.0) continue;
      // If searching around a specific location, reject candidates beyond 40km
      if (searchCoords && Number.isFinite(searchCoords.lat) && Number.isFinite(searchCoords.lng)) {
        if (haversineKm(searchCoords.lat, searchCoords.lng, itemLat, itemLon) > 40) continue;
      }

      const allLocParts = [p.suburb, p.neighbourhood, p.quarter, p.locality, p.street, p.district, p.city, p.county, p.state].filter(Boolean);
      const allLocText = allLocParts.join(' ');
      const area = String(p.suburb || p.neighbourhood || p.quarter || p.locality || p.district || p.street || '').trim();
      const city = String(p.city || p.county || p.state || 'India').trim();
      const street = String(p.street || '').trim();
      const address = street ? `${street}, ${area || city}` : `${area || city}, ${city}`;

      const { score, nameScore, isMatch } = calculateFuzzyRestaurantScore(query, rawName, allLocText, city);
      if (!isMatch) continue;

      const id = getDeterministicPlaceId(rawName, city, area);
      const isVeg = isPureVegRestaurantName(rawName) ? 1 : 0;

      results.push({
        restaurant: {
          id,
          name: rawName,
          address,
          area: area || city,
          city,
          latitude: itemLat,
          longitude: itemLon,
          rating: 4.8,
          image: pickCuisineImage(rawName),
          description: `Authentic food joint in ${area || city}, ${city}`,
          is_campaign_active: 1,
          total_visits: 1,
          status: 'active',
          is_veg: isVeg,
          is_verified: 1,
          verification_source: 'google',
          sources: ['google'],
          source_platform: 'google',
          cuisine: isVeg ? ['Pure Veg', 'Authentic Dining'] : ['Authentic Dining'],
          distanceKm: userCoords ? haversineKm(userCoords.lat, userCoords.lng, itemLat, itemLon) : undefined
        } as VerifiedRestaurant,
        score,
        nameScore
      });
    }

    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 5. Filter & Rank Results
// ---------------------------------------------------------------------------
function filterResults(candidates: ScoredVerifiedRestaurant[], query: string): ScoredVerifiedRestaurant[] {
  const normQ = normalizeText(query);
  const parsed = parseLocationFromQuery(query);
  const nameQuery = (parsed.nameQuery || query).trim();
  const normName = normalizeText(nameQuery);

  const isDishSearch = isGenericDishOnly(normName) || isGenericDishOnly(normQ);
  const isGeneric = isGenericSearch(normName) || isGenericSearch(normQ);

  // If user searched a specific establishment name (e.g. "Hemant Lunch Home", "Prithvi Cafe", "Britto's")
  // strictly exclude candidates that do not match the distinctive keyword!
  if (!isDishSearch && !isGeneric) {
    const distinctiveTokens = normName
      .split(' ')
      .filter(t => !isVenueWord(t) && !lookupGazetteer(t) && t.length >= 2);

    if (distinctiveTokens.length > 0) {
      return candidates.filter(s => {
        const cNameNorm = normalizeText(s.restaurant.name);
        const cTokens = cNameNorm.split(' ');
        return distinctiveTokens.some(dt => {
          return cTokens.some(cnt => fuzzyTokenMatch(dt, cnt).matches);
        });
      });
    }
  }

  const hasStrongNameMatch = candidates.some(s => s.nameScore >= 60);
  if (hasStrongNameMatch) {
    return candidates.filter(s => s.nameScore >= 50);
  }

  const cleanTerm = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isKnownDishWord = /^(tea|bun|dal|veg|egg|dum|fish|crab|bhel|puri|dosa|idli|vada|soup|rice|roti|naan|curry|pizza|burger|pasta|taco|wrap|roll|chai|kathi|thali|kebab|tikka|chaat|poha|upma|misal|omelet|omelette|cheela|chilla|khichdi|pav|bhaji|mastani|kulfi|falooda|sundae|cake|pastry|momo|momos|biryani|paneer|chicken|mutton|shawarma)$/i.test(cleanTerm);

  if (cleanTerm.length < 4 && !isKnownDishWord) {
    return candidates.filter(s => s.nameScore >= 50);
  }

  return candidates;
}

function rank(list: ScoredVerifiedRestaurant[], anchor: Coords | null): VerifiedRestaurant[] {
  return list
    .slice()
    .sort((a, b) => {
      // Prioritize strong establishment name matches first
      if ((b.nameScore || 0) !== (a.nameScore || 0)) {
        return (b.nameScore || 0) - (a.nameScore || 0);
      }
      if (b.score !== a.score) return b.score - a.score;
      if (anchor) {
        const da = haversineKm(anchor.lat, anchor.lng, a.restaurant.latitude, a.restaurant.longitude);
        const db = haversineKm(anchor.lat, anchor.lng, b.restaurant.latitude, b.restaurant.longitude);
        return da - db;
      }
      return (a.restaurant.distanceKm ?? Infinity) - (b.restaurant.distanceKm ?? Infinity);
    })
    .map(s => s.restaurant)
    .slice(0, RESULT_LIMIT);
}

// ---------------------------------------------------------------------------
// Public: Location-Independent Search
// ---------------------------------------------------------------------------
export async function searchRestaurantsAnywhere(
  rawQuery: string,
  userCoords: Coords | null,
  options: { selectedCity?: string } = {}
): Promise<AnywhereSearchResult> {
  const query = (rawQuery || '').trim();
  if (query.length < 2) return { data: [], scope: 'none', searchedLocation: null };

  const cacheKey = `${query.toLowerCase()}_${userCoords?.lat != null ? userCoords.lat.toFixed(2) : 'n'}_${userCoords?.lng != null ? userCoords.lng.toFixed(2) : 'n'}_${options.selectedCity || ''}`;
  const cachedHit = searchCache.get(cacheKey);
  if (cachedHit && Date.now() - cachedHit.timestamp < SEARCH_CACHE_TTL_MS) {
    return cachedHit.result;
  }

  const merged = new Map<string, ScoredVerifiedRestaurant>();
  const parsed = parseLocationFromQuery(query);
  const targetName = (parsed.nameQuery || query).trim();

  // Fast brand normalizer & spell check concurrently
  const resolvedBrand = resolveRestaurantQuery(targetName, (options.selectedCity || parsed.locationText) || undefined);
  const normalizedQuery = normalizeIndianSpelling(targetName);

  const [googleCorrection] = await Promise.all([
    getGoogleSpellCorrection(targetName)
  ]);

  let spellingSuggestion: string | undefined = undefined;
  if (resolvedBrand.isResolved && resolvedBrand.canonicalName.toLowerCase() !== targetName.toLowerCase()) {
    spellingSuggestion = parsed.locationText ? `${resolvedBrand.canonicalName} ${parsed.locationText}` : resolvedBrand.canonicalName;
  } else if (normalizedQuery.toLowerCase() !== targetName.toLowerCase()) {
    spellingSuggestion = parsed.locationText ? `${normalizedQuery} ${parsed.locationText}` : normalizedQuery;
  } else if (googleCorrection && googleCorrection.toLowerCase() !== query.toLowerCase()) {
    spellingSuggestion = googleCorrection;
  }

  // Resolve reference coordinates: user coordinates or selected city
  const cityKey = (options.selectedCity || '').toLowerCase().trim();
  const cityGazetteer = cityKey ? lookupGazetteer(cityKey) : null;
  const defaultAnchor = userCoords || (cityGazetteer ? { lat: cityGazetteer.lat, lng: cityGazetteer.lng } : null);

  // ------------------------------------------------------------------
  // 1. Query explicitly names a location -> search AT that location
  // ------------------------------------------------------------------
  if (parsed.locationText) {
    const loc = await resolveLocation(parsed.locationText, userCoords);
    if (loc) {
      const searchedLocation = { label: loc.label, lat: loc.lat, lng: loc.lng };
      const radius = loc.kind === 'area' ? AREA_RADIUS_KM : CITY_RADIUS_KM;

      const jobs: Array<Promise<ScoredVerifiedRestaurant[]>> = [
        searchDbVerified(query, userCoords, loc),
        searchNominatimRestaurants(parsed.nameQuery || query, loc, userCoords, loc.label, 10),
        searchLiveSwiggySuggestions(parsed.nameQuery || query, loc, userCoords, 10, loc),
        searchZomatoRestaurants(parsed.nameQuery || query, { city: loc.label, lat: loc.lat, lng: loc.lng }),
        searchLivePoiRestaurants(parsed.nameQuery || query, loc, userCoords, 8)
      ];

      if (isGooglePlacesConfigured()) {
        jobs.push(searchGoogleRestaurantsByText(parsed.nameQuery ? `${parsed.nameQuery} in ${loc.label}` : query, loc, 10));
      }

      if (spellingSuggestion) {
        jobs.push(searchNominatimRestaurants(spellingSuggestion, loc, userCoords, loc.label, 6));
        jobs.push(searchLiveSwiggySuggestions(spellingSuggestion, loc, userCoords, 6, loc));
        jobs.push(searchZomatoRestaurants(spellingSuggestion, { city: loc.label, lat: loc.lat, lng: loc.lng }));
      }

      const distinctiveName = parsed.nameQuery
        .split(' ')
        .filter(t => !isVenueWord(t))
        .join(' ')
        .trim();

      if (!isGenericSearch(parsed.nameQuery)) {
        jobs.push(searchVerifiedScored(parsed.nameQuery, loc, { userCoords, maxDistanceKm: radius }));
        jobs.push(searchVerifiedScored(query, loc, { userCoords, maxDistanceKm: radius }));
        if (distinctiveName && distinctiveName !== parsed.nameQuery && distinctiveName.length >= 3) {
          jobs.push(searchVerifiedScored(distinctiveName, loc, { userCoords, maxDistanceKm: radius }));
          jobs.push(searchNominatimRestaurants(distinctiveName, loc, userCoords, loc.label, 8));
        }
      } else {
        const nearby = await fetchVerifiedNearbyRestaurants(loc.lat, loc.lng, 10);
        nearby.forEach(r => {
          merged.set(String(r.swiggy_id || r.id), {
            restaurant: withUserDistance(r, userCoords),
            score: 80,
            nameScore: 80
          });
        });
      }

      const results = await Promise.all(jobs);
      results.forEach(list => mergeScored(merged, list));

      // Fallback: If still no results around loc, also search nationwide POIs
      if (merged.size === 0) {
        const nationwide = await searchNominatimRestaurants(query, null, userCoords, undefined, 10);
        mergeScored(merged, nationwide);
      }

      const maxRad = loc.kind === 'area' ? 35 : 55;
      const targetCityLower = loc.label.toLowerCase();
      const locationFiltered = Array.from(merged.values()).filter(s => {
        const r = s.restaurant;
        const rCityLower = (r.city || '').toLowerCase();
        const rAreaLower = (r.area || '').toLowerCase();
        const textMatches = rCityLower.includes(targetCityLower) || targetCityLower.includes(rCityLower) || rAreaLower.includes(targetCityLower) || targetCityLower.includes(rAreaLower);
        if (textMatches) return true;
        if (r.latitude && r.longitude) {
          return haversineKm(loc.lat, loc.lng, r.latitude, r.longitude) <= maxRad;
        }
        return false;
      });

      const candidatesToUse = locationFiltered.length > 0 ? locationFiltered : Array.from(merged.values());
      const filtered = filterResults(candidatesToUse, query);
      let data = rank(filtered, loc);

      const targetQueryName = (parsed.nameQuery || query).trim();
      const hasExactMatch = data.some(r => {
        const rName = r.name.toLowerCase().trim();
        const qName = targetQueryName.toLowerCase();
        return rName === qName || rName.startsWith(qName);
      });

      if (!hasExactMatch && targetQueryName.length >= 2 && !isGenericSearch(targetQueryName)) {
        const custom = createCustomPlaceEntry(query, searchedLocation, userCoords);
        data = [custom, ...data];
      } else if (data.length === 0 && query.trim().length >= 2) {
        const custom = createCustomPlaceEntry(query, searchedLocation, userCoords);
        const nearby = await fetchVerifiedNearbyRestaurants(loc.lat, loc.lng, 3).catch(() => []);
        data = [custom, ...nearby.map(r => withUserDistance(r, userCoords))];
      }

      const finalResult: AnywhereSearchResult = {
        data,
        scope: 'typed_location',
        searchedLocation,
        spellingSuggestion,
        ...(data.length === 0
          ? { message: `No matching restaurants found in ${loc.label}.` }
          : {})
      };
      searchCache.set(cacheKey, { timestamp: Date.now(), result: finalResult });
      return finalResult;
    }
  }

  // ------------------------------------------------------------------
  // 2. Search Multi-Source: DB, Nominatim, Swiggy, Zomato
  // ------------------------------------------------------------------
  const queryDistinctive = query
    .split(' ')
    .filter(t => !isVenueWord(t))
    .join(' ')
    .trim();

  const locAnchor = defaultAnchor
    ? { label: cityGazetteer?.label || options.selectedCity || '', city: cityGazetteer?.label || options.selectedCity || '' }
    : null;

  const primaryJobs: Array<Promise<ScoredVerifiedRestaurant[]>> = [
    searchDbVerified(query, userCoords, null),
    searchNominatimRestaurants(query, null, userCoords, undefined, 12),
    searchLiveSwiggySuggestions(query, defaultAnchor, userCoords, 10, locAnchor),
    searchZomatoRestaurants(query, { lat: userCoords?.lat, lng: userCoords?.lng }),
    searchLivePoiRestaurants(query, defaultAnchor, userCoords, 6)
  ];

  if (isGooglePlacesConfigured()) {
    primaryJobs.push(searchGoogleRestaurantsByText(query, userCoords || defaultAnchor, 10));
  }

  if (spellingSuggestion) {
    primaryJobs.push(searchNominatimRestaurants(spellingSuggestion, null, userCoords, undefined, 8));
    primaryJobs.push(searchLiveSwiggySuggestions(spellingSuggestion, defaultAnchor, userCoords, 8, locAnchor));
    primaryJobs.push(searchZomatoRestaurants(spellingSuggestion, { lat: userCoords?.lat, lng: userCoords?.lng }));
  }

  if (queryDistinctive && queryDistinctive !== query && queryDistinctive.length >= 3) {
    primaryJobs.push(searchNominatimRestaurants(queryDistinctive, null, userCoords, undefined, 8));
    primaryJobs.push(searchLiveSwiggySuggestions(queryDistinctive, defaultAnchor, userCoords, 6, locAnchor));
    primaryJobs.push(searchZomatoRestaurants(queryDistinctive, { lat: userCoords?.lat, lng: userCoords?.lng }));
  }

  const targetAnchor = userCoords || defaultAnchor;
  if (targetAnchor) {
    primaryJobs.push(searchVerifiedScored(query, targetAnchor, { userCoords }));
    if (queryDistinctive && queryDistinctive !== query && queryDistinctive.length >= 3) {
      primaryJobs.push(searchVerifiedScored(queryDistinctive, targetAnchor, { userCoords }));
    }
  }

  const primaryResults = await Promise.all(primaryJobs);
  primaryResults.forEach(list => mergeScored(merged, list));

  let currentCandidates = filterResults(Array.from(merged.values()), query);

  // ------------------------------------------------------------------
  // 3. If fewer than 2 results found locally, search Live POIs & Zomato India-wide
  // ------------------------------------------------------------------
  if (currentCandidates.length < 2 && query.length >= 3) {
    const nationwideJobs = [
      searchNominatimRestaurants(query, null, userCoords, undefined, 10),
      searchLiveSwiggySuggestions(query, null, userCoords, 8),
      searchZomatoRestaurants(query, {})
    ];
    if (spellingSuggestion) {
      nationwideJobs.push(searchNominatimRestaurants(spellingSuggestion, null, userCoords, undefined, 8));
      nationwideJobs.push(searchLiveSwiggySuggestions(spellingSuggestion, null, userCoords, 8));
      nationwideJobs.push(searchZomatoRestaurants(spellingSuggestion, {}));
    }
    const nationwideResults = await Promise.all(nationwideJobs);
    nationwideResults.forEach(list => mergeScored(merged, list));
    currentCandidates = filterResults(Array.from(merged.values()), query);
  }

  // ------------------------------------------------------------------
  // 4. If still no matches, search major hubs
  // ------------------------------------------------------------------
  if (currentCandidates.length === 0 && query.replace(/[^a-z0-9]/gi, '').length >= 3) {
    const hubKeys: string[] = [];
    if (cityKey && lookupGazetteer(cityKey)) hubKeys.push(cityKey);
    for (const h of MAJOR_SEARCH_HUBS) if (!hubKeys.includes(h)) hubKeys.push(h);

    const hubs = hubKeys
      .map(k => getHubCoordinates(k) || lookupGazetteer(k))
      .filter((h): h is { lat: number; lng: number; label: string } => Boolean(h))
      .filter(h => !userCoords || haversineKm(userCoords.lat, userCoords.lng, h.lat, h.lng) > HUB_SKIP_RADIUS_KM)
      .slice(0, 6);

    const hubResults = await mapWithConcurrency(hubs, HUB_CONCURRENCY, hub =>
      searchVerifiedScored(query, hub, { userCoords, nameOnly: true, maxVerify: 3, maxDistanceKm: CITY_RADIUS_KM + 10 })
    );
    hubResults.forEach(list => mergeScored(merged, list));
    currentCandidates = filterResults(Array.from(merged.values()), query);
  }

  // Only use distance anchor if real GPS coordinates exist, NEVER default to Pune for global searches
  const distanceAnchor = userCoords || null;
  let data = rank(currentCandidates, distanceAnchor);

  // ------------------------------------------------------------------
  // 5. Zero-Failure Fallback: Always create a valid spot if typed query has >= 2 chars
  // ------------------------------------------------------------------
  const hasExactMatch = data.some(r => {
    const rName = r.name.toLowerCase().trim();
    const qName = query.toLowerCase().trim();
    return rName === qName || rName.startsWith(qName);
  });

  const locRef = defaultAnchor
    ? { lat: defaultAnchor.lat, lng: defaultAnchor.lng, label: (cityGazetteer?.label || 'Your City') }
    : null;

  if (!hasExactMatch && query.trim().length >= 2 && !isGenericSearch(query)) {
    const custom = createCustomPlaceEntry(query, locRef, userCoords);
    data = [custom, ...data];
  } else if (data.length === 0 && query.trim().length >= 2) {
    const custom = createCustomPlaceEntry(query, locRef, userCoords);
    const nearby = defaultAnchor ? await fetchVerifiedNearbyRestaurants(defaultAnchor.lat, defaultAnchor.lng, 3).catch(() => []) : [];
    data = [custom, ...nearby.map(r => withUserDistance(r, userCoords))];
  }

  const finalResult: AnywhereSearchResult = {
    data,
    scope: data.length > 0 ? (userCoords ? 'near_user' : 'multi_city') : 'none',
    searchedLocation: userCoords ? { label: 'Your location', ...userCoords } : null,
    spellingSuggestion,
    ...(data.length === 0
      ? { message: `No matching restaurants found for "${query}".` }
      : {})
  };

  searchCache.set(cacheKey, { timestamp: Date.now(), result: finalResult });
  return finalResult;
}

