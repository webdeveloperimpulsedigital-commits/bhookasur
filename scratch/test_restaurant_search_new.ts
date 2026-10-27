import { db, type Restaurant } from '../lib/db';
import { haversineKm, type ScoredVerifiedRestaurant, type VerifiedRestaurant } from '../lib/verifiedRestaurants';
import { parseLocationFromQuery, resolveLocation, type ResolvedLocation, isGenericSearch, lookupGazetteer, getHubCoordinates, MAJOR_SEARCH_HUBS } from '../lib/locationResolver';
import { generateLiveMenuForRestaurant } from '../lib/liveMenu';
import { isDishRelevantToSearch, isPureVegRestaurantName } from '../lib/dishAssets';

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

  // Check if any query tokens match area or city
  const locTokens = normalizeText(`${area} ${city}`).split(' ').filter(Boolean);
  const localityMatchedQueryTokens = new Set<string>();
  for (const qt of qTokens) {
    if (locTokens.some(lt => fuzzyTokenMatch(qt, lt).matches)) {
      localityMatchedQueryTokens.add(qt);
    }
  }

  // Distinctive tokens are those that are NOT venue words AND NOT locality tokens
  const qDistinctive = qTokens.filter(t => !VENUE_NOISE_WORDS.has(t) && !localityMatchedQueryTokens.has(t));
  const nameDistinctive = nameTokens.filter(t => !VENUE_NOISE_WORDS.has(t));

  const effectiveQDistinctive = qDistinctive.length > 0 ? qDistinctive : qTokens.filter(t => !VENUE_NOISE_WORDS.has(t));
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

  // Critical rule: If the query had distinctive restaurant tokens (e.g. "Phadke"),
  // but NONE matched the candidate, this candidate CANNOT match merely because "Dining" or "Hall" matched!
  if (effectiveQDistinctive.length > 0 && matchedDistinctiveCount === 0) {
    return { score: 0, nameScore: 0, isMatch: false };
  }

  const distinctiveRatio = effectiveQDistinctive.length > 0 ? matchedDistinctiveCount / effectiveQDistinctive.length : 0;
  const avgDistinctiveScore = totalDistinctiveScore / (matchedDistinctiveCount || 1);

  // Venue token overlap (e.g. "dining", "hall")
  const qVenue = qTokens.filter(t => VENUE_NOISE_WORDS.has(t));
  const nameVenue = nameTokens.filter(t => VENUE_NOISE_WORDS.has(t));
  let venueBonus = 0;
  if (qVenue.length > 0 && nameVenue.length > 0) {
    const venueMatches = qVenue.filter(qv => nameVenue.some(nv => fuzzyTokenMatch(qv, nv).matches));
    venueBonus = (venueMatches.length / qVenue.length) * 15;
  }

  // Locality bonus
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

async function testMatcher() {
  const tests = [
    { q: 'Phadke Dining Hall', r: 'Phadke Dining Hall', area: 'Sadashiv Peth', city: 'Pune' },
    { q: 'Phadke Dining', r: 'Phadke Dining Hall', area: 'Sadashiv Peth', city: 'Pune' },
    { q: 'Phadke', r: 'Phadke Dining Hall', area: 'Sadashiv Peth', city: 'Pune' },
    { q: 'Phadkey', r: 'Phadke Dining Hall', area: 'Sadashiv Peth', city: 'Pune' },
    { q: 'Phadke Dining Hall', r: 'Durvankur Dining Hall', area: 'Sadashiv Peth', city: 'Pune' },
    { q: 'Durvankur Dinning Hall', r: 'Durvankur Dining Hall', area: 'Sadashiv Peth', city: 'Pune' },
    { q: 'Durwankur', r: 'Durvankur Dining Hall', area: 'Sadashiv Peth', city: 'Pune' },
    { q: 'Vaishali FC Road', r: 'Vaishali Restaurant', area: 'FC Road', city: 'Pune' },
    { q: 'Mamledar Misal in Thane', r: 'Mamledar Misal', area: 'Naupada', city: 'Thane' }
  ];

  console.log('=== TEST MATCHER RESULTS ===');
  for (const t of tests) {
    const res = calculateFuzzyRestaurantScore(t.q, t.r, t.area, t.city);
    console.log(`Query: "${t.q}" -> "${t.r}" = Score: ${res.score}, NameScore: ${res.nameScore}, Match: ${res.isMatch}`);
  }
}

testMatcher();
