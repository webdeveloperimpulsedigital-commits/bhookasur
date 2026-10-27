/**
 * Swiggy & Zomato-Style Intelligent Food, Restaurant, Menu & Image Search Engine
 * Handles:
 *  - Lexical, Phonetic & Typo-Tolerant Query Matching
 *  - Dual-Entity Intent Recognition (Food/Dish vs Restaurant vs Cuisine vs Locality)
 *  - Cross-Entity Relational Matching (e.g. searching "Biryani" returns top restaurants serving Biryani)
 *  - Smart Relevance Ranking with Distance & Popularity Boost
 *  - Verified High-Res Food Plate & Animated Eating Cutout Asset Mapping
 *  - 100% Reliable Fallback Pipeline (Zero broken images)
 */

import { Restaurant, Dish } from './db';
import { getDishVisualAssets, formatCleanDishName, isDishVeg, isDishRelevantToSearch } from './dishAssets';
import { generateLiveMenuForRestaurant, CUISINE_MENUS, ICONIC_RESTAURANT_DISHES } from './liveMenu';
import { parseRestaurantQuery } from './locationParser';
import { getDeterministicPlaceId } from './livePlaces';

// ============================================================================
// 1. DICTIONARIES, SYNONYMS, TYPO MAPPINGS & CUISINE TAXONOMY
// ============================================================================

export interface FoodCategory {
  id: number;
  slug: string;
  name: string;
  hindiName: string;
  icon: string;
  keywords: string[];
  signatureImage: string;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  {
    id: 1,
    slug: 'maharashtrian-thali',
    name: 'Maharashtrian Thali',
    hindiName: 'महाराष्ट्रीयन थाली',
    icon: '🍽️',
    keywords: ['thali', 'maharashtrian thali', 'gavran thali', 'bharli vangi thali', 'shev bhaji thali', 'matki usal thali', 'poli bhaji', 'amti bhat', 'varan bhat tup'],
    signatureImage: '/api/ai/dish-image?dish=Special%20Signature%20Thali%20Platter'
  },
  {
    id: 2,
    slug: 'bhaji-and-usal',
    name: 'Bhaji and Usal',
    hindiName: 'भाजी और उसळ',
    icon: '🍲',
    keywords: ['bhaji', 'usal', 'aloo chi bhaji', 'batata bhaji', 'batata rassa', 'bharli vangi', 'shev bhaji', 'pithla', 'zunka', 'patodi rassa', 'matki usal', 'moong usal', 'chawli usal', 'valachi usal'],
    signatureImage: '/api/ai/dish-image?dish=Shev%20Bhaji'
  },
  {
    id: 3,
    slug: 'rice-and-bhat',
    name: 'Rice and Bhat',
    hindiName: 'भात और खिचड़ी',
    icon: '🍚',
    keywords: ['masale bhat', 'varan bhat', 'amti bhat', 'tup bhat', 'vangi masale bhat', 'tondli bhat', 'khichdi', 'dal khichdi', 'indrayani rice', 'biryani', 'pulao'],
    signatureImage: '/api/ai/dish-image?dish=Masale%20Bhat'
  },
  {
    id: 4,
    slug: 'dal-varan-and-amti',
    name: 'Dal, Varan and Amti',
    hindiName: 'डाळ, वरण और आमटी',
    icon: '🥣',
    keywords: ['varan', 'amti', 'katachi amti', 'goda amti', 'takachi kadhi', 'danyachi amti', 'solkadhi', 'sadha varan', 'ambat varan', 'dal'],
    signatureImage: '/api/ai/dish-image?dish=Katachi%20Amti'
  },
  {
    id: 5,
    slug: 'bhakri-poli-and-roti',
    name: 'Bhakri, Poli and Roti',
    hindiName: 'भाकरी और पोळी',
    icon: '🫓',
    keywords: ['bhakri', 'jwarichi bhakri', 'bajrichi bhakri', 'nachni bhakri', 'tandulachi bhakri', 'poli', 'chapati', 'ghavan', 'thalipeeth', 'dhirde', 'puran poli', 'roti'],
    signatureImage: '/api/ai/dish-image?dish=Pithla%20Bhakri'
  },
  {
    id: 6,
    slug: 'breakfast',
    name: 'Breakfast',
    hindiName: 'नाश्ता',
    icon: '🍳',
    keywords: ['poha', 'kanda poha', 'batata poha', 'dadpe pohe', 'tarri poha', 'upma', 'sheera', 'tomato omelette', 'dosa', 'idli'],
    signatureImage: '/api/ai/dish-image?dish=Kanda%20Poha'
  },
  {
    id: 7,
    slug: 'snacks-and-farsan',
    name: 'Snacks and Farsan',
    hindiName: 'स्नैक्स और फरसाण',
    icon: '🥟',
    keywords: ['kothimbir vadi', 'alu vadi', 'suralichi vadi', 'kanda bhaji', 'batata vada', 'sabudana vada', 'chakli', 'bhakarwadi', 'samosa'],
    signatureImage: '/api/ai/dish-image?dish=Kothimbir%20Vadi'
  },
  {
    id: 8,
    slug: 'street-food-and-chaat',
    name: 'Street Food and Chaat',
    hindiName: 'स्ट्रीट फूड और चाट',
    icon: '🥪',
    keywords: ['misal pav', 'kolhapuri misal', 'puneri misal', 'vada pav', 'pav bhaji', 'cheese pav bhaji', 'masala pav', 'ragda pattice', 'pani puri', 'bhel'],
    signatureImage: '/api/ai/dish-image?dish=Misal%20Pav'
  },
  {
    id: 9,
    slug: 'chicken-mutton-and-seafood',
    name: 'Chicken, Mutton and Seafood',
    hindiName: 'नॉन-वेज आणि सीफूड',
    icon: '🍗',
    keywords: ['chicken', 'mutton', 'kombdi vade', 'gavran chicken rassa', 'tambda rassa', 'pandhra rassa', 'sukha mutton', 'mutton saoji', 'malvani fish curry', 'surmai fry', 'bangda fry', 'bombil fry'],
    signatureImage: '/api/ai/dish-image?dish=Sukha%20Mutton%20with%20Bhakri'
  },
  {
    id: 10,
    slug: 'chutney-and-sides',
    name: 'Chutney and Sides',
    hindiName: 'चटणी आणि तोंडी लावणे',
    icon: '🥗',
    keywords: ['thecha', 'mirchi thecha', 'lasun chutney', 'shengdana chutney', 'koshimbir', 'metkut', 'loncha', 'papad', 'kurdai', 'taak', 'mattha', 'chaas'],
    signatureImage: '/api/ai/dish-image?dish=Masala%20Taak'
  },
  {
    id: 11,
    slug: 'sweets-and-desserts',
    name: 'Sweets and Desserts',
    hindiName: 'मिठाई और मिष्ठान्न',
    icon: '🍨',
    keywords: ['puran poli', 'modak', 'ukadiche modak', 'shrikhand', 'amrakhand', 'basundi', 'aamras', 'kharvas', 'kheer', 'ladoo', 'mastani', 'ice cream'],
    signatureImage: '/api/ai/dish-image?dish=Puran%20Poli'
  },
  {
    id: 12,
    slug: 'upvas-special',
    name: 'Upvas Special',
    hindiName: 'उपवास स्पेशल',
    icon: '🥥',
    keywords: ['sabudana khichdi', 'sabudana vada', 'upvas thalipeeth', 'bhagar', 'varai bhat', 'danyachi amti', 'ratalyacha kees', 'rajgira', 'farali pattice'],
    signatureImage: '/api/ai/dish-image?dish=Sabudana%20Khichdi'
  },
  {
    id: 13,
    slug: 'regional-specialties',
    name: 'Regional Specialties',
    hindiName: 'प्रादेशिक वैशिष्ट्ये',
    icon: '👑',
    keywords: ['puneri misal', 'kolhapuri misal', 'tambda rassa', 'pandhra rassa', 'saoji chicken', 'saoji mutton', 'tarri poha', 'kombdi vade', 'varhadi rassa', 'khandeshi shev bhaji', 'naan qalia'],
    signatureImage: '/api/ai/dish-image?dish=Kolhapuri%20Misal'
  },
  // National & Pan-Indian Categories
  {
    id: 14,
    slug: 'north-indian-curries',
    name: 'North Indian & Mughlai',
    hindiName: 'उत्तर भारतीय और मुगलई',
    icon: '🥘',
    keywords: ['butter chicken', 'paneer butter masala', 'paneer', 'dal makhani', 'korma', 'rogan josh', 'naan', 'paratha'],
    signatureImage: '/api/ai/dish-image?dish=Butter%20Chicken'
  },
  {
    id: 15,
    slug: 'south-indian-tiffin',
    name: 'South Indian & Tiffin',
    hindiName: 'साउथ इंडियन और नाश्ता',
    icon: '🥞',
    keywords: ['dosa', 'masala dosa', 'idli', 'medu vada', 'uttapam', 'sambar', 'filter coffee'],
    signatureImage: '/api/ai/dish-image?dish=Masala%20Dosa'
  },
  {
    id: 16,
    slug: 'burgers-pizzas',
    name: 'Pizzas & Burgers',
    hindiName: 'पिज़्ज़ा और बर्गर',
    icon: '🍕',
    keywords: ['pizza', 'burger', 'pasta', 'fries', 'sandwich', 'garlic bread', 'wrap'],
    signatureImage: '/api/ai/dish-image?dish=Pizza'
  },
  {
    id: 17,
    slug: 'chinese-asian',
    name: 'Chinese & Momos',
    hindiName: 'चाइनीज और मोमोज',
    icon: '🥟',
    keywords: ['momos', 'manchurian', 'noodles', 'chilli chicken', 'fried rice', 'spring roll'],
    signatureImage: '/api/ai/dish-image?dish=Momos'
  },
  {
    id: 18,
    slug: 'chai-cafe-beverages',
    name: 'Chai, Coffee & Cafe',
    hindiName: 'चाय, कॉफी और कैफे',
    icon: '☕',
    keywords: ['bun maska', 'chai', 'tea', 'cold coffee', 'coffee', 'latte', 'cappuccino', 'frappe'],
    signatureImage: '/api/ai/dish-image?dish=Bun%20Maska'
  }
];

// Common Indian culinary spelling variations and typos mapping
export const SPELLING_TYPOS_MAP: Record<string, string> = {
  // Rice & Cumin Rice
  'geera rice': 'jeera rice',
  'geera': 'jeera',
  'zeera rice': 'jeera rice',
  'zeera': 'jeera',

  // Paratha
  'parantha': 'paratha',
  'pratha': 'paratha',
  'parata': 'paratha',
  'parathas': 'paratha',
  'paranthas': 'paratha',

  // Biryani
  'briyani': 'biryani',
  'biriyani': 'biryani',
  'biryany': 'biryani',
  'baryani': 'biryani',
  'biriani': 'biryani',
  'byriani': 'biryani',
  'pulav': 'pulao',
  'pulavv': 'pulao',

  // Chicken & Non-Veg
  'chiken': 'chicken',
  'chikn': 'chicken',
  'chikin': 'chicken',
  'chk': 'chicken',
  'murg': 'murgh',
  'kukkad': 'chicken',
  'mutton': 'mutton',
  'muton': 'mutton',
  'gosht': 'mutton',
  'kheema': 'keema',
  'qeema': 'keema',

  // Paneer
  'paner': 'paneer',
  'panner': 'paneer',
  'paneer': 'paneer',

  // Vada Pav & Street Snacks
  'vadapav': 'vada pav',
  'wada pav': 'vada pav',
  'wadapav': 'vada pav',
  'vada pao': 'vada pav',
  'wada pao': 'vada pav',
  'pavbhaji': 'pav bhaji',
  'pao bhaji': 'pav bhaji',
  'paobhaji': 'pav bhaji',
  'pao baji': 'pav bhaji',
  'bhaji pav': 'pav bhaji',
  'misal': 'misal',
  'missal': 'misal',
  'misalpav': 'misal pav',
  'missal pav': 'misal pav',
  'katakir': 'katakirr',
  'katkrr': 'katakirr',
  'samosas': 'samosa',
  'smosa': 'samosa',
  'somosa': 'samosa',
  'panipuri': 'pani puri',
  'golgappa': 'pani puri',
  'golgappe': 'pani puri',
  'puchka': 'pani puri',
  'bhel puri': 'bhel',
  'bhelpuri': 'bhel',

  // Maharashtrian Specialties
  'bhaat': 'bhat',
  'masala bhat': 'masale bhat',
  'masala bhaat': 'masale bhat',
  'masale bhaat': 'masale bhat',
  'varan bhaat': 'varan bhat',
  'pitla': 'pithla',
  'jhunka': 'zunka',
  'pithla bhakar': 'pithla bhakri',
  'zunka bhakar': 'zunka bhakri',
  'kombadi': 'kombdi',
  'kombadi vade': 'kombdi vade',
  'tamda rassa': 'tambda rassa',
  'pandra rassa': 'pandhra rassa',
  'sukka mutton': 'sukha mutton',
  'mutton sukka': 'sukha mutton',
  'shev bhaji': 'shev bhaji',
  'khandeshi shev bhaji': 'shev bhaji',
  'bharli vangi': 'bharli vangi',
  'patodi rassa': 'patodi rassa',

  // South Indian
  'dhosa': 'dosa',
  'dosai': 'dosa',
  'dhose': 'dosa',
  'idly': 'idli',
  'idle': 'idli',
  'meduvada': 'medu vada',
  'utpam': 'uttapam',
  'uttapam': 'uttapam',
  'uthappam': 'uttapam',
  'uttapa': 'uttapam',
  'uthappa': 'uttapam',
  'utappa': 'uttapam',
  'oothappam': 'uttapam',
  'oothappa': 'uttapam',
  'onioun': 'onion',
  'ooli bhel': 'oli bhel',
  'dahi ooli bhel': 'dahi bhel',
  'masala bhadanga bhel': 'bhadang bhel',
  'bhadanga bhel': 'bhadang bhel',
  'bhadanga': 'bhadang',
  'loni sponge dosa': 'sponge dosa',
  'benne dosa': 'sponge dosa',

  // Chole Bhature
  'choley': 'chole',
  'bhatura': 'bhature',
  'bature': 'bhature',
  'bhaturey': 'bhature',
  'chola bhatura': 'chole bhature',
  'chole bature': 'chole bhature',

  // Chinese & Momos
  'momo': 'momos',
  'momoes': 'momos',
  'dimsums': 'dimsum',
  'schezwan': 'schezwan',
  'shezwan': 'schezwan',
  'sehzwan': 'schezwan',
  'sezwan': 'schezwan',
  'schzwan': 'schezwan',
  'manchurian': 'manchurian',
  'manchorian': 'manchurian',
  'noodles': 'noodles',
  'nudles': 'noodles',
  'nuduls': 'noodles',
  'chowmin': 'chowmein',
  'chaumin': 'chowmein',

  // Kebabs & Tandoor
  'kabab': 'kebab',
  'kababs': 'kebab',
  'kebabs': 'kebab',
  'shwarma': 'shawarma',
  'shawrma': 'shawarma',
  'shavarma': 'shawarma',
  'lolipop': 'lollipop',
  'chiken lollipop': 'chicken lollipop',

  // Cafe & Desserts
  'cofy': 'coffee',
  'coffe': 'coffee',
  'cofee': 'coffee',
  'kafee': 'coffee',
  'chay': 'chai',
  'chaai': 'chai',
  'faluda': 'falooda',
  'faludha': 'falooda',
  'kulfy': 'kulfi',
  'mastany': 'mastani',
  'icecream': 'ice cream',
  'gulabjamun': 'gulab jamun',
  'rasgula': 'rasgulla',
  'jalebi': 'jalebi',
  'jalabi': 'jalebi',

  // Fast food
  'piza': 'pizza',
  'pizzas': 'pizza',
  'pzza': 'pizza',
  'burgar': 'burger',
  'burgur': 'burger',
  'sandwhich': 'sandwich',
  'sandwitch': 'sandwich',

  // Beverages & Buttermilk
  'buttermilk': 'butter milk',
  'butermilk': 'butter milk',
  'butter-milk': 'butter milk',
  'chhas': 'chaas',
  'chhaas': 'chaas',
  'chhash': 'chaas',
  'matha': 'mattha',
  'tak': 'taak'
};

// ============================================================================
// 2. QUERY NORMALIZER & INTENT DETECTOR
// ============================================================================

export interface QueryIntent {
  rawQuery: string;
  normalizedQuery: string;
  tokens: string[];
  isDishSearch: boolean;
  matchedCategory: FoodCategory | null;
  canonicalDishName: string | null;
  targetLocality: string | null;
  targetCity: string | null;
}

/**
 * Normalizes query string with typo correction and intent extraction
 */
export function analyzeFoodQuery(query: string, fallbackCity = 'Pune'): QueryIntent {
  const raw = (query || '').trim();
  const lower = raw.toLowerCase();

  // 1. Tokenize and normalize typos
  const rawTokens = lower
    .replace(/[^\w\s,/-]/g, ' ')
    .split(/[\s,/-]+/)
    .filter(Boolean);

  const correctedTokens: string[] = [];
  for (const t of rawTokens) {
    if (SPELLING_TYPOS_MAP[t]) {
      correctedTokens.push(...SPELLING_TYPOS_MAP[t].split(' '));
    } else {
      correctedTokens.push(t);
    }
  }

  const normalizedQuery = correctedTokens.join(' ');

  // 2. Check category matching
  let matchedCategory: FoodCategory | null = null;
  let canonicalDishName: string | null = null;

  for (const cat of FOOD_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (normalizedQuery.includes(kw) || correctedTokens.includes(kw)) {
        matchedCategory = cat;
        canonicalDishName = kw;
        break;
      }
    }
    if (matchedCategory) break;
  }

  // 3. Location detection
  const parsedLoc = parseRestaurantQuery(raw, fallbackCity, null);
  const targetLocality = parsedLoc.area !== parsedLoc.city ? parsedLoc.area : null;
  const targetCity = parsedLoc.city;

  // 4. Intent detection: Dish search vs pure restaurant search
  const isDishSearch = Boolean(matchedCategory || canonicalDishName);

  return {
    rawQuery: raw,
    normalizedQuery,
    tokens: correctedTokens,
    isDishSearch,
    matchedCategory,
    canonicalDishName,
    targetLocality,
    targetCity
  };
}

// ============================================================================
// 3. SWIGGY / ZOMATO RESTAURANT & DISH SEARCH ENGINE
// ============================================================================

export interface SearchMatchResult {
  restaurant: Restaurant;
  relevanceScore: number;
  matchType: 'exact_restaurant' | 'dish_match' | 'cuisine_match' | 'locality_match' | 'fuzzy_match';
  matchedDish?: Dish;
  highlightedDishes?: Dish[];
}

/**
 * Calculate Levenshtein Distance for fuzzy tolerance
 */
export function calculateLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/**
 * Perform Swiggy/Zomato style restaurant search
 * - If user types "Biryani": returns restaurants renowned for Biryani, highlighting their Biryani dishes
 * - If user types "Vaishali": returns Vaishali Restaurant with top rating
 * - If user types "Kothrud Misal": returns Misal spots in Kothrud
 */
export function searchRestaurantsSwiggyZomato(
  restaurants: Restaurant[],
  query: string,
  userCoords?: { lat: number; lng: number } | null,
  city = 'Pune'
): Restaurant[] {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return restaurants;
  }

  const intent = analyzeFoodQuery(trimmed, city);
  const qLower = intent.normalizedQuery;
  const tokens = intent.tokens.filter(t => !['and', 'the', 'near', 'hotel', 'restaurant', 'pure', 'veg'].includes(t));

  const results: SearchMatchResult[] = [];

  for (const rest of restaurants) {
    const rName = (rest.name || '').toLowerCase().trim();
    const rArea = (rest.area || '').toLowerCase().trim();
    const rCity = (rest.city || '').toLowerCase().trim();
    const rDesc = (rest.description || '').toLowerCase();
    const fullText = `${rName} ${rArea} ${rCity} ${rDesc}`;

    let score = 0;
    let matchType: SearchMatchResult['matchType'] = 'fuzzy_match';
    let matchedDish: Dish | undefined = undefined;

    // 1. Direct Restaurant Name Matches (Highest Priority)
    if (rName === qLower) {
      score += 2500;
      matchType = 'exact_restaurant';
    } else if (rName.startsWith(qLower)) {
      score += 2000;
      matchType = 'exact_restaurant';
    } else if (rName.includes(qLower)) {
      score += 1600;
      matchType = 'exact_restaurant';
    }

    // 2. Dish / Menu Matching (Swiggy/Zomato Dish-Level Discovery)
    // Inspect restaurant's live menu to see if it specializes in the searched food
    const liveMenu = generateLiveMenuForRestaurant(rest);
    const matchingDishesInMenu = liveMenu.filter(d => {
      const dName = d.name.toLowerCase();
      const dDesc = (d.description || '').toLowerCase();
      const dishText = `${dName} ${dDesc}`;

      if (intent.canonicalDishName && dishText.includes(intent.canonicalDishName)) {
        return true;
      }
      return tokens.some(t => t.length >= 3 && dishText.includes(t));
    });

    if (matchingDishesInMenu.length > 0) {
      matchedDish = matchingDishesInMenu[0];
      const isTopDish = matchingDishesInMenu.some(d => d.popularity >= 98);
      const dishScore = isTopDish ? 1800 : 1400;

      if (dishScore > score) {
        score = dishScore;
        matchType = 'dish_match';
      }
    }

    // 3. Category & Cuisine Relevance
    if (intent.matchedCategory) {
      for (const kw of intent.matchedCategory.keywords) {
        if (fullText.includes(kw)) {
          score += 250;
          if (matchType === 'fuzzy_match') matchType = 'cuisine_match';
        }
      }
    }

    // 4. Locality Matching
    if (intent.targetLocality && (rArea.includes(intent.targetLocality.toLowerCase()) || fullText.includes(intent.targetLocality.toLowerCase()))) {
      score += 400;
      if (matchType === 'fuzzy_match') matchType = 'locality_match';
    }

    // 5. Token Substring Matches
    for (const t of tokens) {
      if (t.length >= 2) {
        if (rName.includes(t)) score += 300;
        else if (rArea.includes(t)) score += 150;
        else if (rDesc.includes(t)) score += 80;
      }
    }

    // 6. Fuzzy Levenshtein for Typos (if no strong score yet)
    if (score < 400) {
      const words = rName.split(/[\s,/-]+/);
      for (const w of words) {
        if (Math.abs(w.length - qLower.length) <= 2) {
          const dist = calculateLevenshtein(w, qLower);
          if (dist <= 2) {
            score += Math.max(0, 500 - dist * 150);
            matchType = 'fuzzy_match';
            break;
          }
        }
      }
    }

    // 7. Distance & Rating Adjustments
    if (score > 0) {
      // Proximity boost (closer gets up to +200)
      if (typeof rest.distanceKm === 'number' && rest.distanceKm >= 0) {
        const distanceBoost = Math.max(0, 200 - Math.min(200, rest.distanceKm * 20));
        score += distanceBoost;
      }

      // Rating boost (high rated restaurants get up to +150)
      if (rest.rating) {
        score += Math.round(rest.rating * 30);
      }

      // Popularity/visits boost
      if (rest.total_visits) {
        score += Math.min(100, Math.round(rest.total_visits / 30));
      }

      // Visual Image enrichment: Ensure restaurant has verified cuisine image
      const verifiedImage = rest.image && !rest.image.includes('placeholder')
        ? rest.image
        : (intent.matchedCategory?.signatureImage || '/api/ai/dish-image?dish=Veg%20Thali');

      results.push({
        restaurant: {
          ...rest,
          image: verifiedImage
        },
        relevanceScore: score,
        matchType,
        matchedDish,
        highlightedDishes: matchingDishesInMenu.slice(0, 3)
      });
    }
  }

  // Sort strictly by Swiggy/Zomato relevance score descending
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Return the ranked restaurants
  return results.map(r => r.restaurant);
}

// ============================================================================
// 4. SWIGGY / ZOMATO DISH & MENU SEARCH ENGINE
// ============================================================================

export interface DishSearchResult {
  dish: Dish;
  score: number;
}

/**
 * Perform Swiggy/Zomato style dish search within a restaurant's menu
 * and across the culinary knowledge base
 */
export function searchDishesSwiggyZomato(
  restaurant: Restaurant,
  query: string,
  existingDishes?: Dish[]
): Dish[] {
  const trimmed = (query || '').trim();
  const baseMenu = existingDishes && existingDishes.length > 0
    ? existingDishes
    : generateLiveMenuForRestaurant(restaurant);

  if (!trimmed) {
    // Return top menu dishes sorted by rating & popularity
    return [...baseMenu].sort((a, b) => {
      const rDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(rDiff) > 0.01) return rDiff;
      return (b.popularity || 0) - (a.popularity || 0);
    });
  }

  const isPureVegRest = (restaurant.is_veg === 1) ||
    restaurant.name.toLowerCase().includes('pure veg') ||
    (restaurant.name.toLowerCase().includes('veg') && !restaurant.name.toLowerCase().includes('non-veg') && !restaurant.name.toLowerCase().includes('non veg'));

  const scored: DishSearchResult[] = [];
  const seenDishNames = new Set<string>();
  const qLower = trimmed.toLowerCase();

  // Search STRICTLY within the restaurant's authentic menu
  for (const dish of baseMenu) {
    const cleanName = formatCleanDishName(dish.name, restaurant.name);
    const lowerName = cleanName.toLowerCase().trim();
    if (seenDishNames.has(lowerName)) continue;

    // Check vegetarian filter for pure veg restaurants
    const isNonVeg = !isDishVeg(cleanName) || dish.is_veg === 0;
    if (isPureVegRest && isNonVeg) continue;

    // Strictly validate title relevance
    if (!isDishRelevantToSearch(cleanName, trimmed)) {
      continue;
    }

    seenDishNames.add(lowerName);

    let score = 1000;
    if (lowerName === qLower) score += 1500;
    else if (lowerName.startsWith(qLower)) score += 1000;
    else if (lowerName.includes(qLower)) score += 500;

    score += (dish.popularity || 90) * 2;
    score += Math.round((dish.rating || 4.5) * 40);

    const visual = getDishVisualAssets(cleanName, dish.image, restaurant.name);
    scored.push({
      dish: {
        ...dish,
        name: cleanName,
        image: visual.flyingImage || visual.plateImage
      },
      score
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.dish);
}

