function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[(),\-&/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const VENUE_NOISE_WORDS = new Set([
  'hotel', 'restaurant', 'restaurants', 'rest', 'cafe', 'dhaba', 'canteen', 'dining',
  'hall', 'house', 'bhojanalay', 'bhojanalaya', 'khanawal', 'kitchen', 'foods', 'food',
  'joint', 'corner', 'center', 'centre', 'pure', 'veg', 'nonveg', 'non-veg', 'family',
  'bar', 'stall', 'adda', 'the', 'and', 'by', 'of', 'shree', 'shri', 'sri', 'new'
]);

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

// Phonetic / transliteration simplifier for Indian restaurant names
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

function fuzzyTokenMatch(qToken: string, candToken: string): { matches: boolean; score: number } {
  if (qToken === candToken) return { matches: true, score: 100 };
  if (candToken.startsWith(qToken) || qToken.startsWith(candToken)) {
    const minLen = Math.min(qToken.length, candToken.length);
    const maxLen = Math.max(qToken.length, candToken.length);
    return { matches: true, score: Math.round((minLen / maxLen) * 90) };
  }
  // Check phonetic match
  const pQ = phoneticKey(qToken);
  const pC = phoneticKey(candToken);
  if (pQ === pC) return { matches: true, score: 90 };
  if (pC.startsWith(pQ) || pQ.startsWith(pC)) {
    return { matches: true, score: 85 };
  }

  // Levenshtein distance check based on token length
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

export function calculateFuzzyRestaurantScore(query: string, restaurantName: string, area: string = '', city: string = ''): {
  score: number;
  isMatch: boolean;
  reason: string;
} {
  const cleanQ = normalizeText(query);
  const cleanName = normalizeText(restaurantName);
  if (!cleanQ || !cleanName) return { score: 0, isMatch: false, reason: 'empty' };

  if (cleanQ === cleanName) return { score: 100, isMatch: true, reason: 'exact_name' };

  const qTokens = cleanQ.split(' ').filter(Boolean);
  const nameTokens = cleanName.split(' ').filter(Boolean);

  const qDistinctive = qTokens.filter(t => !VENUE_NOISE_WORDS.has(t));
  const nameDistinctive = nameTokens.filter(t => !VENUE_NOISE_WORDS.has(t));

  const effectiveQDistinctive = qDistinctive.length > 0 ? qDistinctive : qTokens;
  const effectiveNameDistinctive = nameDistinctive.length > 0 ? nameDistinctive : nameTokens;

  // Track matches of query distinctive tokens against candidate
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

  // If query had distinctive tokens (e.g. "Phadke"), and NONE matched candidate's distinctive tokens,
  // it CANNOT match simply because "Dining" or "Hall" matched!
  if (effectiveQDistinctive.length > 0 && matchedDistinctiveCount === 0) {
    return { score: 0, isMatch: false, reason: 'no_distinctive_match' };
  }

  const distinctiveRatio = matchedDistinctiveCount / effectiveQDistinctive.length;
  const avgDistinctiveScore = totalDistinctiveScore / (matchedDistinctiveCount || 1);

  // Check venue token overlap
  const qVenue = qTokens.filter(t => VENUE_NOISE_WORDS.has(t));
  const nameVenue = nameTokens.filter(t => VENUE_NOISE_WORDS.has(t));
  let venueBonus = 0;
  if (qVenue.length > 0 && nameVenue.length > 0) {
    const venueMatches = qVenue.filter(qv => nameVenue.some(nv => fuzzyTokenMatch(qv, nv).matches));
    venueBonus = (venueMatches.length / qVenue.length) * 15;
  }

  // Check locality / area / city bonus
  let locBonus = 0;
  const locTokens = normalizeText(`${area} ${city}`).split(' ').filter(Boolean);
  if (locTokens.length > 0) {
    const locMatch = qTokens.some(qt => locTokens.some(lt => fuzzyTokenMatch(qt, lt).matches));
    if (locMatch) locBonus = 10;
  }

  const baseScore = distinctiveRatio * avgDistinctiveScore;
  const finalScore = Math.min(100, Math.round(baseScore * 0.85 + venueBonus + locBonus));

  const isMatch = distinctiveRatio >= 0.5 && finalScore >= 50;

  return {
    score: finalScore,
    isMatch,
    reason: isMatch ? `matched ${matchedDistinctiveCount}/${effectiveQDistinctive.length} tokens` : 'insufficient match'
  };
}

// Test cases
const testCases = [
  { q: 'Phadke Dining Hall', r: 'Phadke Dining Hall' },
  { q: 'Phadke Dining', r: 'Phadke Dining Hall' },
  { q: 'Phadke', r: 'Phadke Dining Hall' },
  { q: 'Phadkey', r: 'Phadke Dining Hall' },
  { q: 'Fadke Dining Hall', r: 'Phadke Dining Hall' },
  { q: 'Phadke Dining Hall', r: 'Durvankur Dining Hall' }, // MUST BE FALSE!
  { q: 'Durvankur Dinning Hall', r: 'Durvankur Dining Hall' },
  { q: 'Durwankur', r: 'Durvankur Dining Hall' },
  { q: 'Durvankur Dining', r: 'Durvankur Dining Hall' },
  { q: 'Vaishali FC Road', r: 'Vaishali Restaurant', area: 'FC Road', city: 'Pune' },
  { q: 'Mamledar Misal Thane', r: 'Mamledar Misal', area: 'Naupada', city: 'Thane' },
  { q: 'Random Joint', r: 'Phadke Dining Hall' }
];

console.log('=== TEST RESULTS ===');
for (const tc of testCases) {
  const res = calculateFuzzyRestaurantScore(tc.q, tc.r, tc.area, tc.city);
  console.log(`Q: "${tc.q}" vs "${tc.r}" -> Score: ${res.score}, Match: ${res.isMatch} (${res.reason})`);
}
