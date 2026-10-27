import { db, type Restaurant } from '../lib/db';
import { haversineKm, type ScoredVerifiedRestaurant, type VerifiedRestaurant } from '../lib/verifiedRestaurants';
import { parseLocationFromQuery, resolveLocation, type ResolvedLocation, isGenericSearch, lookupGazetteer, getHubCoordinates, MAJOR_SEARCH_HUBS } from '../lib/locationResolver';
import { generateLiveMenuForRestaurant } from '../lib/liveMenu';
import { isDishRelevantToSearch, isPureVegRestaurantName } from '../lib/dishAssets';
import { pickCuisineImage, getDeterministicPlaceId } from '../lib/livePlaces';

type Coords = { lat: number; lng: number };

const VENUE_NOISE_WORDS = new Set([
  'hotel', 'restaurant', 'restaurants', 'rest', 'cafe', 'dhaba', 'canteen', 'dining',
  'hall', 'house', 'bhojanalay', 'bhojanalaya', 'khanawal', 'kitchen', 'foods', 'food',
  'joint', 'corner', 'center', 'centre', 'pure', 'veg', 'nonveg', 'non-veg', 'family',
  'bar', 'stall', 'adda', 'the', 'and', '&', 'by', 'of', 'shree', 'shri', 'sri', 'new'
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
    .replace(/([a-z])\1+/g, '$1');
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

  const locTokens = normalizeText(`${area} ${city}`).split(' ').filter(Boolean);
  const localityMatchedQueryTokens = new Set<string>();
  for (const qt of qTokens) {
    if (locTokens.some(lt => fuzzyTokenMatch(qt, lt).matches)) {
      localityMatchedQueryTokens.add(qt);
    }
  }

  const qDistinctive = qTokens.filter(t => !isVenueWord(t) && !localityMatchedQueryTokens.has(t));
  const nameDistinctive = nameTokens.filter(t => !isVenueWord(t));

  const effectiveQDistinctive = qDistinctive.length > 0 ? qDistinctive : qTokens.filter(t => !isVenueWord(t));
  const effectiveNameDistinctive = nameDistinctive.length > 0 ? nameDistinctive : nameTokens;

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

  if (effectiveQDistinctive.length > 0 && matchedDistinctiveCount === 0) {
    return { score: 0, nameScore: 0, isMatch: false };
  }

  const distinctiveRatio = effectiveQDistinctive.length > 0 ? matchedDistinctiveCount / effectiveQDistinctive.length : 0;
  const avgDistinctiveScore = totalDistinctiveScore / (matchedDistinctiveCount || 1);

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
  const finalScore = Math.min(100, Math.round(baseScore * 0.85 + venueBonus + locBonus));
  const nameScore = Math.min(100, Math.round(baseScore * 0.9 + venueBonus));

  const isMatch = distinctiveRatio >= 0.5 && finalScore >= 50;

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
      const sameId = String(existing.restaurant.swiggy_id || existing.restaurant.id) === String(s.restaurant.swiggy_id || s.restaurant.id);
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
      if (
        s.score > prev.score ||
        (s.restaurant.verification_source === 'verified_registry' && prev.restaurant.verification_source !== 'verified_registry')
      ) {
        target.delete(existingKey);
        target.set(String(s.restaurant.swiggy_id || s.restaurant.id), s);
      }
    } else {
      target.set(String(s.restaurant.swiggy_id || s.restaurant.id), s);
    }
  }
}

async function searchDbVerified(
  rawQuery: string,
  userCoords: Coords | null,
  targetLoc?: ResolvedLocation | null
): Promise<ScoredVerifiedRestaurant[]> {
  try {
    const allDb = await db.getRestaurants({ includeUnverified: false });
    const results: ScoredVerifiedRestaurant[] = [];
    const cleanQ = rawQuery.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
    const isDishQuery = cleanQ.length >= 4 && !isGenericSearch(cleanQ);

    for (const r of allDb) {
      if (r.status !== 'active') continue;

      if (targetLoc) {
        const distToTarget = haversineKm(targetLoc.lat, targetLoc.lng, r.latitude, r.longitude);
        const maxRadius = targetLoc.kind === 'area' ? 12 : 30;
        const rCity = (r.city || '').toLowerCase();
        const rArea = (r.area || '').toLowerCase();
        const locText = targetLoc.label.toLowerCase();
        const textMatch = rCity.includes(locText) || locText.includes(rCity) || rArea.includes(locText) || locText.includes(rArea);
        if (distToTarget > maxRadius && !textMatch) continue;
      }

      const { score, nameScore, isMatch } = calculateFuzzyRestaurantScore(cleanQ, r.name, r.area, r.city);

      let finalScore = score;
      let finalNameScore = nameScore;

      if (!isMatch && isDishQuery) {
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
        results.push({
          restaurant: {
            ...r,
            is_verified: 1,
            verification_source: 'verified_registry',
            cuisine: r.cuisine_tags || ['Heritage Landmark', 'Authentic Dining'],
            distanceKm: userCoords ? haversineKm(userCoords.lat, userCoords.lng, r.latitude, r.longitude) : undefined
          } as VerifiedRestaurant,
          score: finalScore,
          nameScore: finalNameScore
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

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
  const timer = setTimeout(() => controller.abort(), 1600);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BhookasurApp/3.0' },
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

      const isFoodTag = osmKey === 'amenity' && ['restaurant', 'cafe', 'fast_food', 'food_court', 'bar'].includes(osmVal);
      const hasFoodName = /(hotel|restaurant|cafe|dhaba|bhojanalay|dining|hall|canteen|bhel|misal|sweets|bakery|snacks|kitchen|paratha|biryani|dosa|thali|punjabi|khanawal|corner|eatery|mastani)/i.test(lowerName);

      if (!isFoodTag && !hasFoodName) continue;

      const [itemLon, itemLat] = f.geometry.coordinates;
      if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) continue;

      const area = String(p.suburb || p.district || p.neighbourhood || p.quarter || p.locality || p.street || '').trim();
      const city = String(p.city || p.county || p.state || 'Pune').trim();
      const street = String(p.street || '').trim();
      const address = street ? `${street}, ${area || city}` : `${area || city}, ${city}`;

      const { score, nameScore, isMatch } = calculateFuzzyRestaurantScore(query, rawName, area, city);
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
          total_visits: 1450,
          status: 'active',
          is_veg: isVeg,
          is_verified: 1,
          verification_source: 'verified_registry',
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

async function runCompleteSearchTest() {
  const pune = { lat: 18.5204, lng: 73.8567 };
  const queries = [
    'Phadke Dining Hall',
    'Durvankur Dining Hall',
    'Phadke Dining',
    'Durvankur Dinning Hall',
    'Phadkey',
    'Durwankur',
    'Badshahi Boarding',
    'Mamledar Misal Thane',
    'Vidyarthi Bhavan Bangalore'
  ];

  for (const q of queries) {
    const t0 = Date.now();
    const merged = new Map<string, ScoredVerifiedRestaurant>();

    // 1. DB search
    const dbList = await searchDbVerified(q, pune, null);
    mergeScored(merged, dbList);

    // 2. Live POI search
    const poiList = await searchLivePoiRestaurants(q, pune, pune);
    mergeScored(merged, poiList);

    const candidates = Array.from(merged.values());
    candidates.sort((a, b) => b.score - a.score);

    console.log(`\n================ Query: "${q}" (${Date.now() - t0}ms) ================`);
    console.log(`Found: ${candidates.length} spots`);
    candidates.slice(0, 3).forEach((c, idx) => {
      console.log(`  ${idx + 1}. [Score: ${c.score}] ${c.restaurant.name} (${c.restaurant.area || c.restaurant.city}) - ID: ${c.restaurant.id}`);
    });
  }
}

runCompleteSearchTest();
