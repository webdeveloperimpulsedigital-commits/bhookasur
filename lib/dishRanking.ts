import type { Dish } from './db';
import { isDishVeg } from './dishAssets';

/**
 * Extracts a numeric rating count from diverse string or numeric formats:
 * e.g., "1.2K" -> 1200, "1K+ ratings" -> 1000, "500+" -> 500, "995" -> 995, 250 -> 250
 */
export function parseRatingCount(countVal: unknown): number {
  if (!countVal) return 0;
  if (typeof countVal === 'number') return countVal;
  const s = String(countVal).trim().toLowerCase();
  if (s.includes('k')) {
    const num = parseFloat(s.replace(/[^0-9.]/g, ''));
    return Math.round((num || 1) * 1000);
  }
  const digits = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(digits) ? 0 : digits;
}

/**
 * Identifies accompaniments, condiments, packaging, and non-meal add-ons.
 * These are disqualified from appearing as the hero plate choice ("Ab plate decide karo").
 */
export function isAccompanimentOrAddon(dishName?: string, category?: string): boolean {
  const n = (dishName || '').toLowerCase().trim();
  const c = (category || '').toLowerCase().trim();

  // Packaging / Cutlery / Bags
  if (
    n.includes('cutlery') ||
    n.includes('carry bag') ||
    n.includes('paper bag') ||
    n.includes('plastic bag') ||
    n.includes('packaging') ||
    c.includes('cutlery') ||
    c.includes('packaging')
  ) {
    return true;
  }

  // Extra dips, chutneys, sauces, pavs, gravies alone, mayo
  if (
    n.startsWith('extra ') ||
    n.includes('extra dip') ||
    n.includes('extra chutney') ||
    n.includes('extra sauce') ||
    n.includes('extra pav') ||
    n.includes('extra bhatura') ||
    n.includes('extra puri') ||
    n.includes('extra roti') ||
    n.includes('extra naan') ||
    n.includes('extra cheese') ||
    n.includes('extra mayo') ||
    n.includes('momo chutney') ||
    n.includes('schezwan dip') ||
    n.includes('mint chutney') ||
    n.includes('dip &') ||
    n.includes('& dip') ||
    c.includes('extra dip') ||
    c.includes('accompaniment') ||
    c.includes('condiment') ||
    c.includes('addon') ||
    c.includes('add-on') ||
    c.includes('side order') ||
    c.includes('sides & dips')
  ) {
    return true;
  }

  return false;
}

/**
 * Identifies plain beverages, soft drinks, teas, and bottled water.
 */
export function isBeverageItem(dishName?: string, category?: string): boolean {
  const n = (dishName || '').toLowerCase().trim();
  const c = (category || '').toLowerCase().trim();

  if (c.includes('drink') || c.includes('beverage') || c === 'tea & coffee') {
    return true;
  }

  const bevKeywords = [
    'water', 'mineral water', 'ice tea', 'iced tea', 'peach ice tea', 'lemon ice tea',
    'cold drink', 'soft drink', 'coca cola', 'coke', 'pepsi', 'sprite', 'thums up',
    'fanta', 'limca', 'soda', 'shikanji', 'aam panna', 'jaljeera', 'buttermilk', 'chaas', 'taak'
  ];

  return bevKeywords.some(kw => new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i').test(n));
}

/**
 * Determines whether a restaurant is primarily a beverage/dessert/cafe parlor,
 * where drinks, mastanis, or ice creams ARE legitimate signature items.
 */
export function isBeverageOrDessertParlor(restaurantName?: string): boolean {
  const r = (restaurantName || '').toLowerCase().trim();
  return (
    r.includes('mastani') ||
    r.includes('chai') ||
    r.includes('coffee') ||
    r.includes('tea') ||
    r.includes('cafe') ||
    r.includes('café') ||
    r.includes('juice') ||
    r.includes('shake') ||
    r.includes('ice cream') ||
    r.includes('icecream') ||
    r.includes('gelato') ||
    r.includes('falooda') ||
    r.includes('starbucks') ||
    r.includes('keventers')
  );
}

/**
 * Identifies the broad food cluster of a dish to prevent near-identical variants
 * from dominating all 3 quick-pick slots (e.g. 3 variations of noodles).
 */
export function getDishCluster(dishName?: string): string {
  const n = (dishName || '').toLowerCase().trim();
  if (n.includes('puran poli') || n.includes('puranpoli')) return 'puran_poli';
  if (n.includes('tomato omelette') || n.includes('tomato omelet') || n.includes('tomato omlet')) return 'tomato_omelette';
  if (n.includes('modak')) return 'modak';
  if (n.includes('noodle') || n.includes('chow mein') || n.includes('chowmein') || n.includes('hakka')) return 'noodles';
  if (n.includes('fried rice') || n.includes('schezwan rice') || n.includes('triple rice')) return 'fried_rice';
  if (n.includes('biryani') || n.includes('biriyani')) return 'biryani';
  if (n.includes('pulao') || n.includes('pulav')) return 'pulao';
  if (n.includes('manchurian')) return 'manchurian';
  if (n.includes('dosa') || n.includes('dosai')) return 'dosa';
  if (n.includes('idli')) return 'idli';
  if (n.includes('vada pav') || n.includes('vadapav')) return 'vada_pav';
  if (n.includes('misal')) return 'misal';
  if (n.includes('thali') || n.includes('bhojan')) return 'thali';
  if (n.includes('burger') || n.includes('whopper')) return 'burger';
  if (n.includes('pizza')) return 'pizza';
  if (n.includes('momo') || n.includes('momos') || n.includes('dimsum')) return 'momos';
  if (n.includes('pasta')) return 'pasta';
  if (n.includes('sandwich')) return 'sandwich';
  if (n.includes('mastani')) return 'mastani';
  if (n.includes('pav bhaji')) return 'pav_bhaji';
  return n.slice(0, 15);
}

/**
 * Multi-Signal Weighted Dish Scoring Algorithm
 *
 * Implements the required 4-tier ranking priority:
 * 1. Restaurant Specialties: Bestsellers, recommended/top pick flags, signature items (+60 to +115 pts).
 * 2. Popularity & Order Counts: High popularity scores, verified review volume via log scaling (0 to +65 pts).
 * 3. Ratings and Reviews: Star rating weighted with Bayesian review volume (0 to +55 pts).
 * 4. Menu Relevance: Severe disqualification for non-meal accompaniments/dips (-1000 pts)
 *    and plain bottled drinks at food restaurants (-500 pts).
 */
export function calculateDishScore(dish: Dish, restaurantName: string): number {
  const isBevVenue = isBeverageOrDessertParlor(restaurantName);

  // Severe disqualification for accompaniments / add-ons
  if (isAccompanimentOrAddon(dish.name, dish.category)) {
    return -1000;
  }

  // Deprioritize beverages for food venues so meal plates take top spots
  if (!isBevVenue && isBeverageItem(dish.name, dish.category)) {
    return -500;
  }

  let score = 0;

  // === Priority 1: Restaurant Specialties & Signatures ===
  const isBestseller = Boolean(dish.is_bestseller);
  const isRecommended = Boolean(
    dish.is_recommended === 1 ||
    (dish.category && /recommended|top pick|special|signature|bestseller/i.test(dish.category))
  );
  const hasSpecialInName = /special|signature|famous|chef|legendary|traditional/i.test(dish.name);

  if (isBestseller) score += 60;
  if (isRecommended) score += 40;
  if (hasSpecialInName) score += 15;

  // Restaurant namesake affinity: e.g. "mastani" at "Sujata Mastani", "misal" at "Katakirr Misal", "burger" at "Burger King"
  const rKeywords = ['mastani', 'misal', 'burger', 'pizza', 'dosa', 'waffle', 'biryani', 'momo', 'chaat', 'sandwich'];
  const rLower = (restaurantName || '').toLowerCase();
  const dLower = (dish.name || '').toLowerCase();
  for (const kw of rKeywords) {
    if (rLower.includes(kw) && dLower.includes(kw)) {
      score += 25;
      break;
    }
  }

  // === Priority 2: Popularity & Order Counts ===
  const pop = Number(dish.popularity) || 0;
  score += pop * 0.4; // up to 40 pts

  // === Priority 3: Ratings and Reviews ===
  const rating = Number(dish.rating) || 0;
  const ratingCount = parseRatingCount(dish.rating_count);

  if (rating > 0) {
    // Rating value (4.0 -> 24 pts, 4.5 -> 27 pts, 5.0 -> 30 pts)
    score += rating * 6;

    // Review count credibility bonus on log10 scale:
    // 1000+ reviews -> +25 pts
    // 500 reviews   -> +22.4 pts
    // 100 reviews   -> +16.7 pts
    // 10 reviews    -> +8.3 pts
    // 1 review      -> +2.5 pts
    const reviewBonus = Math.min(Math.log10(ratingCount + 1) * 8.3, 25);
    score += reviewBonus;
  } else {
    // Dish with no rating data yet
    score += 15;
  }

  return score;
}

/**
 * Selects the top restaurant-specific dishes (up to maxCount, default 3).
 *
 * Rules:
 * - Ranks strictly by the multi-signal weighted scoring algorithm.
 * - Applies cluster-based diversity normalization so top cards offer varied specialties
 *   (e.g., Noodles + Fried Rice + Manchurian) instead of 3 near-duplicate variants of the same item.
 * - If fewer than maxCount verified dishes exist (1 or 2), returns ONLY what is verified.
 * - Never invents dummy dishes or fills slots with random items.
 */
export function selectTopRestaurantDishes(
  allDishes: Dish[],
  restaurant: { name: string; is_veg?: number },
  maxCount: number = 3
): Dish[] {
  if (!allDishes || allDishes.length === 0) return [];

  // Filter out any invalid items
  const validDishes = allDishes.filter(d => Boolean(d && d.name && d.name.trim()));
  if (validDishes.length === 0) return [];

  // Calculate base score for each dish
  const scored = validDishes.map(d => ({
    dish: d,
    baseScore: calculateDishScore(d, restaurant.name),
    cluster: getDishCluster(d.name)
  })).sort((a, b) => b.baseScore - a.baseScore);

  // Filter out severely penalized items (accompaniments, irrelevant drinks)
  const pool = scored.filter(item => item.baseScore > -200);
  const activePool = pool.length > 0 ? pool : scored;

  const selected: Dish[] = [];
  const selectedClusters = new Map<string, number>();

  // Helper to get normalized name without portion/size specs
  const getNormName = (name: string) =>
    name
      .toLowerCase()
      .replace(/\s*-\s*(half|full|mini|large|medium|light\s*eaters|\d+\s*ml|\d+\s*pcs).*/i, '')
      .replace(/\(.*?\)/g, '')
      .trim();

  const seenNormNames = new Set<string>();

  // Pass 1: Select top dishes prioritizing cuisine diversity among top candidates
  for (const item of activePool) {
    if (selected.length >= maxCount) break;

    const normName = getNormName(item.dish.name);
    if (seenNormNames.has(normName)) continue;

    const clusterCount = selectedClusters.get(item.cluster) || 0;
    // If this cluster was already selected once, check if there are other high-scoring clusters available
    if (clusterCount >= 1) {
      // Look ahead: is there another distinct cluster candidate with a strong score (> baseScore - 25)?
      const otherClusterAvailable = activePool.some(
        other =>
          !seenNormNames.has(getNormName(other.dish.name)) &&
          (selectedClusters.get(other.cluster) || 0) === 0 &&
          other.baseScore >= item.baseScore - 25
      );
      if (otherClusterAvailable) {
        // Skip this duplicate cluster in Pass 1 to allow diversity
        continue;
      }
    }

    seenNormNames.add(normName);
    selectedClusters.set(item.cluster, clusterCount + 1);
    selected.push(item.dish);
  }

  // Pass 2: If diversity filter left fewer than maxCount (or menu has fewer clusters), fill with remaining top scores
  if (selected.length < maxCount) {
    for (const item of activePool) {
      if (selected.length >= maxCount) break;
      const normName = getNormName(item.dish.name);
      if (!seenNormNames.has(normName) && !selected.some(s => s.id === item.dish.id)) {
        seenNormNames.add(normName);
        selected.push(item.dish);
      }
    }
  }

  // Pass 3: If still under maxCount (e.g. only 1 or 2 distinct dishes exist), DO NOT pad with fake or random dishes!
  // Return exactly the verified items.
  return selected;
}
