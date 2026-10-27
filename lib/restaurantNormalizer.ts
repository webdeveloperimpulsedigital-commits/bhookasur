/**
 * Smart Restaurant Brand & Typo Normalizer
 * --------------------------------------------------------------------------
 * Solves the critical user-experience challenge:
 * When users mistype restaurant names (e.g. "mcdonld", "bawarch", "prithvy cafe",
 * "kailas parbhat", "ramashray", "vaishaly"), this engine:
 * 1. Automatically resolves the typo to the canonical official brand name.
 * 2. Generates optimized search queries for Swiggy and Zomato so live menus load.
 * 3. Categorizes unlisted street food vendors into authentic cuisines (Misal, Chaat, Dosa, etc.)
 *    so realistic dishes with real photos always load instead of generic fallback items.
 */

export interface NormalizedBrandResult {
  isResolved: boolean;
  canonicalName: string;
  searchVariations: string[];
  city?: string;
  area?: string;
  isVeg?: boolean;
  cuisineCategory?: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// 1. CANONICAL BRAND & ICONIC RESTAURANT CATALOG
// ---------------------------------------------------------------------------

interface BrandEntry {
  canonicalName: string;
  aliases: string[];
  searchTerms: string[];
  defaultCity?: string;
  defaultArea?: string;
  isVeg?: boolean;
  cuisineCategory?: string;
}

export const CANONICAL_BRANDS: BrandEntry[] = [
  // Fast Food & Global Chains
  {
    canonicalName: "McDonald's",
    aliases: ["mcdonalds", "mcdonald", "macdonald", "mcdonld", "mc donald", "mcd", "mcdonald's"],
    searchTerms: ["McDonald's", "McDonalds", "Mc Donalds"],
    isVeg: false,
    cuisineCategory: "burger_fastfood"
  },
  {
    canonicalName: "Burger King",
    aliases: ["burger king", "burgerking", "bk", "burgur king", "burger kng"],
    searchTerms: ["Burger King", "BurgerKing"],
    isVeg: false,
    cuisineCategory: "burger_fastfood"
  },
  {
    canonicalName: "KFC",
    aliases: ["kfc", "kentucky", "kentuky", "kfc chicken", "kentucky fried chicken"],
    searchTerms: ["KFC", "Kentucky Fried Chicken"],
    isVeg: false,
    cuisineCategory: "chicken_fastfood"
  },
  {
    canonicalName: "Domino's Pizza",
    aliases: ["dominos", "dominoes", "domino's", "domino", "dominos pizza"],
    searchTerms: ["Domino's Pizza", "Dominos Pizza", "Domino's"],
    isVeg: false,
    cuisineCategory: "pizza"
  },
  {
    canonicalName: "Pizza Hut",
    aliases: ["pizza hut", "pizzahut", "pizza hutt", "pizahut", "piza hut"],
    searchTerms: ["Pizza Hut", "PizzaHut"],
    isVeg: false,
    cuisineCategory: "pizza"
  },
  {
    canonicalName: "Subway",
    aliases: ["subway", "subways", "sub way", "subwey"],
    searchTerms: ["Subway", "Subway Sandwiches"],
    isVeg: false,
    cuisineCategory: "sandwich"
  },
  {
    canonicalName: "Starbucks Coffee",
    aliases: ["starbucks", "star bucks", "starbuck", "starbuks", "starbucks coffee"],
    searchTerms: ["Starbucks", "Starbucks Coffee"],
    isVeg: false,
    cuisineCategory: "cafe"
  },
  {
    canonicalName: "Wow! Momo",
    aliases: ["wow momo", "wow momos", "wow! momo", "wowmomo"],
    searchTerms: ["Wow! Momo", "Wow Momo"],
    isVeg: false,
    cuisineCategory: "chinese_momos"
  },
  {
    canonicalName: "Tibbs Frankie",
    aliases: ["tibbs frankie", "tibb's frankie", "tibbs", "tibb's", "tibbs franky"],
    searchTerms: ["Tibbs Frankie", "Tibbs"],
    isVeg: false,
    cuisineCategory: "rolls_shawarma"
  },
  {
    canonicalName: "Natural Ice Cream",
    aliases: ["natural ice cream", "naturals", "naturals ice cream", "natural icecream", "naturals icecream"],
    searchTerms: ["Natural Ice Cream", "Naturals Ice Cream", "Natural's"],
    isVeg: true,
    cuisineCategory: "desserts"
  },
  {
    canonicalName: "Apsara Ice Creams",
    aliases: ["apsara ice cream", "apsara ice creams", "apsara", "apsara kulfi"],
    searchTerms: ["Apsara Ice Creams", "Apsara Ice Cream"],
    isVeg: true,
    cuisineCategory: "desserts"
  },
  {
    canonicalName: "Haldiram's",
    aliases: ["haldiram", "haldirams", "haldiram's", "haldiram sweets"],
    searchTerms: ["Haldiram's", "Haldirams"],
    isVeg: true,
    cuisineCategory: "chaat_sweets"
  },
  {
    canonicalName: "Bikanervala",
    aliases: ["bikanervala", "bikaner", "bikanervalla", "bikaner sweets"],
    searchTerms: ["Bikanervala", "Bikaner"],
    isVeg: true,
    cuisineCategory: "chaat_sweets"
  },
  {
    canonicalName: "Chai Point",
    aliases: ["chai point", "chaipoint"],
    searchTerms: ["Chai Point"],
    isVeg: true,
    cuisineCategory: "cafe_chai"
  },
  {
    canonicalName: "Chaayos",
    aliases: ["chaayos", "chayos", "chaiyos"],
    searchTerms: ["Chaayos", "Chaayos Chai"],
    isVeg: true,
    cuisineCategory: "cafe_chai"
  },
  {
    canonicalName: "Chinese Wok",
    aliases: ["chinese wok", "wok express", "chinesewok"],
    searchTerms: ["Chinese Wok", "Wok Express"],
    isVeg: false,
    cuisineCategory: "chinese_momos"
  },
  {
    canonicalName: "Social",
    aliases: ["social", "socials", "khar social", "colaba social", "fc road social", "church street social"],
    searchTerms: ["Social", "FC Road Social", "Khar Social", "Colaba Social"],
    isVeg: false,
    cuisineCategory: "cafe"
  },

  // Mumbai Iconic Food Spots
  {
    canonicalName: "Prithvi Cafe",
    aliases: ["prithvi cafe", "prithvi", "prithvy", "prithwi", "prithvi caffe", "prithvy cafe", "prithwi cafe"],
    searchTerms: ["Prithvi Cafe", "Prithvi Theatre Cafe"],
    defaultCity: "Mumbai",
    defaultArea: "Juhu",
    isVeg: false,
    cuisineCategory: "cafe"
  },
  {
    canonicalName: "Sardar Refreshments",
    aliases: ["sardar pav bhaji", "sardar refreshments", "sardar", "sardar pavbhaji", "sardar pav bhaji tardeo"],
    searchTerms: ["Sardar Refreshments", "Sardar Pav Bhaji"],
    defaultCity: "Mumbai",
    defaultArea: "Tardeo",
    isVeg: true,
    cuisineCategory: "pav_bhaji"
  },
  {
    canonicalName: "Bademiya",
    aliases: ["bademiya", "bade miya", "bademiyan", "bademiya colaba"],
    searchTerms: ["Bademiya", "Bade Miya"],
    defaultCity: "Mumbai",
    defaultArea: "Colaba",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  },
  {
    canonicalName: "Leopold Cafe",
    aliases: ["leopold cafe", "leopold", "leopald", "leopold cafe and bar", "leopald cafe"],
    searchTerms: ["Leopold Cafe", "Leopold"],
    defaultCity: "Mumbai",
    defaultArea: "Colaba",
    isVeg: false,
    cuisineCategory: "cafe"
  },
  {
    canonicalName: "Cafe Mondegar",
    aliases: ["cafe mondegar", "mondegar", "mondys", "mondis", "cafe mondis"],
    searchTerms: ["Cafe Mondegar", "Mondegar"],
    defaultCity: "Mumbai",
    defaultArea: "Colaba",
    isVeg: false,
    cuisineCategory: "cafe"
  },
  {
    canonicalName: "Britannia & Co.",
    aliases: ["britannia", "britannia and co", "britannia co", "britannia & co", "britannia restaurant"],
    searchTerms: ["Britannia & Co.", "Britannia and Co", "Britannia Restaurant"],
    defaultCity: "Mumbai",
    defaultArea: "Ballard Estate",
    isVeg: false,
    cuisineCategory: "parsi_irani"
  },
  {
    canonicalName: "Kailash Parbat",
    aliases: ["kailash parbat", "kailas parbhat", "kailash parbhat", "kailas parbat", "kailash parbat colaba"],
    searchTerms: ["Kailash Parbat", "Kailash Parbhat"],
    defaultCity: "Mumbai",
    defaultArea: "Colaba",
    isVeg: true,
    cuisineCategory: "chaat_sweets"
  },
  {
    canonicalName: "Ram Ashraya",
    aliases: ["ram ashraya", "ram ashray", "ramashray", "ramashraya", "ram ashray matunga"],
    searchTerms: ["Ram Ashraya", "Ram Ashray"],
    defaultCity: "Mumbai",
    defaultArea: "Matunga",
    isVeg: true,
    cuisineCategory: "south_indian"
  },
  {
    canonicalName: "Mani's Lunch Home",
    aliases: ["manis lunch home", "mani's lunch home", "manis", "mani's", "manis matunga"],
    searchTerms: ["Mani's Lunch Home", "Manis Lunch Home"],
    defaultCity: "Mumbai",
    defaultArea: "Matunga",
    isVeg: true,
    cuisineCategory: "south_indian"
  },
  {
    canonicalName: "Guru Kripa",
    aliases: ["guru kripa", "gurukripa", "guru kripa samosa", "guru kripa sion"],
    searchTerms: ["Guru Kripa", "Gurukripa"],
    defaultCity: "Mumbai",
    defaultArea: "Sion",
    isVeg: true,
    cuisineCategory: "chaat_sweets"
  },
  {
    canonicalName: "Ashok Vada Pav",
    aliases: ["ashok vada pav", "ashok vadapav", "kirti college vada pav", "ashok wada pav"],
    searchTerms: ["Ashok Vada Pav", "Kirti College Vada Pav"],
    defaultCity: "Mumbai",
    defaultArea: "Dadar",
    isVeg: true,
    cuisineCategory: "vada_pav"
  },
  {
    canonicalName: "Amar Juice Centre",
    aliases: ["amar juice centre", "amar juice center", "amar juice", "amar pav bhaji"],
    searchTerms: ["Amar Juice Centre", "Amar Juice Center"],
    defaultCity: "Mumbai",
    defaultArea: "Juhu",
    isVeg: true,
    cuisineCategory: "pav_bhaji"
  },
  {
    canonicalName: "Anand Stall",
    aliases: ["anand stall", "anand dosa", "anand vada pav", "anand stall vile parle"],
    searchTerms: ["Anand Stall", "Anand Dosa Stall"],
    defaultCity: "Mumbai",
    defaultArea: "Vile Parle",
    isVeg: true,
    cuisineCategory: "south_indian"
  },
  {
    canonicalName: "Merwans Cake Stop",
    aliases: ["merwans", "merwan", "merwans cake", "merwans bakery", "merwan cake stop"],
    searchTerms: ["Merwans Cake Stop", "Merwans", "Merwan's"],
    defaultCity: "Mumbai",
    defaultArea: "Andheri",
    isVeg: false,
    cuisineCategory: "bakery"
  },
  {
    canonicalName: "Shiv Sagar",
    aliases: ["shiv sagar", "shivsagar", "hotel shiv sagar", "shiv sagar pav bhaji"],
    searchTerms: ["Shiv Sagar", "Shivsagar"],
    defaultCity: "Mumbai",
    isVeg: true,
    cuisineCategory: "fast_food"
  },
  {
    canonicalName: "Prashant Corner",
    aliases: ["prashant corner", "prashant mithai", "prashant corner thane"],
    searchTerms: ["Prashant Corner", "Prashant Sweets"],
    defaultCity: "Thane",
    isVeg: true,
    cuisineCategory: "chaat_sweets"
  },
  {
    canonicalName: "Tip Top Mithai",
    aliases: ["tip top", "tip top mithai", "tiptop", "hotel tip top", "tip top plaza"],
    searchTerms: ["Tip Top Mithai", "Tip Top", "Hotel Tip Top"],
    defaultCity: "Thane",
    isVeg: true,
    cuisineCategory: "chaat_sweets"
  },
  {
    canonicalName: "Mr. Vadya",
    aliases: [
      "mr vadya", "mr vadyaa", "mr. vadya", "mr. vadyaa", "mister vadya", "mr vadya kalwa",
      "mr vadyaa kalwa", "mr vadya thane", "mr vadyaa thane", "mr vadya kalva", "mr vadyaa kalva",
      "mr vadya vada pav", "mr vadyaa vada pav", "mr.vadya", "mr.vadyaa", "mrvadya", "mrvadyaa",
      "vadya kalwa", "vadyaa kalwa"
    ],
    searchTerms: ["Mr. Vadya", "Mr Vadya", "Mr Vadya Kalwa", "Mr Vadya Vada Pav"],
    defaultCity: "Thane",
    defaultArea: "Kalwa",
    isVeg: true,
    cuisineCategory: "vada_pav"
  },

  // Pune Iconic Food Spots
  {
    canonicalName: "Vaishali",
    aliases: ["vaishali", "vaishaly", "hotel vaishali", "vaishali fc road", "vaishali pune"],
    searchTerms: ["Vaishali", "Hotel Vaishali"],
    defaultCity: "Pune",
    defaultArea: "FC Road",
    isVeg: true,
    cuisineCategory: "south_indian"
  },
  {
    canonicalName: "Cafe Goodluck",
    aliases: ["cafe goodluck", "goodluck cafe", "good luck", "goodluck", "goodluck fc road", "cafe good luck"],
    searchTerms: ["Cafe Goodluck", "Goodluck Cafe", "Cafe Good Luck"],
    defaultCity: "Pune",
    defaultArea: "FC Road",
    isVeg: false,
    cuisineCategory: "parsi_irani"
  },
  {
    canonicalName: "Kayani Bakery",
    aliases: ["kayani bakery", "kayani", "kyani bakery", "kayani shrewsbury", "kayani camp"],
    searchTerms: ["Kayani Bakery", "Kayani"],
    defaultCity: "Pune",
    defaultArea: "Camp",
    isVeg: true,
    cuisineCategory: "bakery"
  },
  {
    canonicalName: "Marz-O-Rin",
    aliases: ["marz o rin", "marzorin", "marz-o-rin", "marz o rin camp"],
    searchTerms: ["Marz-O-Rin", "Marzorin"],
    defaultCity: "Pune",
    defaultArea: "MG Road",
    isVeg: false,
    cuisineCategory: "bakery"
  },
  {
    canonicalName: "Kata Kirr",
    aliases: ["kata kirr", "katakirr", "katakir", "kata kir", "katakirr misal", "katakirr erandwane"],
    searchTerms: ["Kata Kirr", "KataKirr Misal"],
    defaultCity: "Pune",
    defaultArea: "Erandwane",
    isVeg: true,
    cuisineCategory: "misal"
  },
  {
    canonicalName: "Bedekar Tea Stall",
    aliases: ["bedekar misal", "bedekar tea stall", "bedekar", "bedekar tea"],
    searchTerms: ["Bedekar Tea Stall", "Bedekar Misal"],
    defaultCity: "Pune",
    defaultArea: "Narayan Peth",
    isVeg: true,
    cuisineCategory: "misal"
  },
  {
    canonicalName: "Durvankur Dining Hall",
    aliases: ["durvankur dining hall", "durvankur", "durwankur", "durvankur thali"],
    searchTerms: ["Durvankur Dining Hall", "Durvankur"],
    defaultCity: "Pune",
    defaultArea: "Sadashiv Peth",
    isVeg: true,
    cuisineCategory: "thali"
  },
  {
    canonicalName: "Phadke Dining Hall",
    aliases: ["phadke dining hall", "phadke", "phadke thali", "phadake dining hall"],
    searchTerms: ["Phadke Dining Hall", "Phadke"],
    defaultCity: "Pune",
    defaultArea: "Sadashiv Peth",
    isVeg: true,
    cuisineCategory: "thali"
  },
  {
    canonicalName: "Badshahi Boarding House",
    aliases: ["badshahi boarding house", "badshahi boarding", "badshahi", "badshahi thali"],
    searchTerms: ["Badshahi Boarding House", "Badshahi"],
    defaultCity: "Pune",
    defaultArea: "Sadashiv Peth",
    isVeg: true,
    cuisineCategory: "thali"
  },
  {
    canonicalName: "Sujata Mastani",
    aliases: ["sujata mastani", "sujata", "sujatamastani", "sujata ice cream"],
    searchTerms: ["Sujata Mastani", "Sujata"],
    defaultCity: "Pune",
    isVeg: true,
    cuisineCategory: "desserts"
  },
  {
    canonicalName: "Kalyan Bhel",
    aliases: ["kalyan bhel", "kalyan bhell", "kalyan chaat"],
    searchTerms: ["Kalyan Bhel", "Kalyan"],
    defaultCity: "Pune",
    isVeg: true,
    cuisineCategory: "chaat_sweets"
  },
  {
    canonicalName: "Blue Nile",
    aliases: ["blue nile", "bluenile", "blue nile camp", "blue nile biryani"],
    searchTerms: ["Blue Nile", "Blue Nile Restaurant"],
    defaultCity: "Pune",
    defaultArea: "Camp",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  },
  {
    canonicalName: "George Restaurant",
    aliases: ["george restaurant", "george", "george camp", "george biryani"],
    searchTerms: ["George Restaurant", "George"],
    defaultCity: "Pune",
    defaultArea: "Camp",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  },
  {
    canonicalName: "Vohuman Cafe",
    aliases: ["vohuman cafe", "vohuman", "vohuman irani chai"],
    searchTerms: ["Vohuman Cafe", "Vohuman"],
    defaultCity: "Pune",
    isVeg: false,
    cuisineCategory: "parsi_irani"
  },

  // Hyderabad Iconic Food Spots
  {
    canonicalName: "Bawarchi",
    aliases: ["bawarchi", "bawarch", "bawarchi restaurant", "bawarchi biryani", "bawarchi rtc x roads"],
    searchTerms: ["Bawarchi", "Bawarchi Restaurant"],
    defaultCity: "Hyderabad",
    defaultArea: "RTC X Roads",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  },
  {
    canonicalName: "Paradise Biryani",
    aliases: ["paradise biryani", "paradise", "paradise secunderabad"],
    searchTerms: ["Paradise Biryani", "Paradise"],
    defaultCity: "Hyderabad",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  },
  {
    canonicalName: "Cafe Bahar",
    aliases: ["cafe bahar", "bahar biryani", "cafe bahar hyderguda"],
    searchTerms: ["Cafe Bahar", "Bahar"],
    defaultCity: "Hyderabad",
    defaultArea: "Hyderguda",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  },
  {
    canonicalName: "Shah Ghouse",
    aliases: ["shah ghouse", "shahghouse", "shah ghouse biryani"],
    searchTerms: ["Shah Ghouse", "Shah Ghouse Hotel"],
    defaultCity: "Hyderabad",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  },
  {
    canonicalName: "Pista House",
    aliases: ["pista house", "pistahouse", "pista house bakery"],
    searchTerms: ["Pista House"],
    defaultCity: "Hyderabad",
    isVeg: false,
    cuisineCategory: "bakery"
  },

  // Bangalore Iconic Food Spots
  {
    canonicalName: "Vidyarthi Bhavan",
    aliases: ["vidyarthi bhavan", "vidhyarthi bhavan", "vidyarthi", "vidhyarthi"],
    searchTerms: ["Vidyarthi Bhavan", "Vidyarthi"],
    defaultCity: "Bangalore",
    defaultArea: "Gandhi Bazaar",
    isVeg: true,
    cuisineCategory: "south_indian"
  },
  {
    canonicalName: "MTR (Mavalli Tiffin Room)",
    aliases: ["mtr", "mavalli tiffin room", "mtr lalbagh", "mtr bangalore"],
    searchTerms: ["MTR", "Mavalli Tiffin Room"],
    defaultCity: "Bangalore",
    defaultArea: "Lalbagh",
    isVeg: true,
    cuisineCategory: "south_indian"
  },
  {
    canonicalName: "Shri Sagar (CTR)",
    aliases: ["ctr", "shri sagar", "central tiffin room", "ctr malleshwaram"],
    searchTerms: ["Shri Sagar CTR", "CTR", "Central Tiffin Room"],
    defaultCity: "Bangalore",
    defaultArea: "Malleshwaram",
    isVeg: true,
    cuisineCategory: "south_indian"
  },
  {
    canonicalName: "Meghana Foods",
    aliases: ["meghana foods", "meghana biryani", "meghanas", "meghana"],
    searchTerms: ["Meghana Foods", "Meghana Biryani"],
    defaultCity: "Bangalore",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  },
  {
    canonicalName: "Brahmin's Coffee Bar",
    aliases: ["brahmins coffee bar", "brahmins", "brahmin's", "brahmins idli"],
    searchTerms: ["Brahmin's Coffee Bar", "Brahmins Coffee Bar"],
    defaultCity: "Bangalore",
    defaultArea: "Shankarpuram",
    isVeg: true,
    cuisineCategory: "south_indian"
  },
  {
    canonicalName: "Corner House",
    aliases: ["corner house", "corner house ice cream", "cornerhouse"],
    searchTerms: ["Corner House", "Corner House Ice Cream"],
    defaultCity: "Bangalore",
    isVeg: true,
    cuisineCategory: "desserts"
  },

  // Delhi / Kolkata / Chennai Iconic
  {
    canonicalName: "Karim's",
    aliases: ["karim's", "karims", "karim", "karims jama masjid", "hotel karim"],
    searchTerms: ["Karim's", "Karims"],
    defaultCity: "Delhi",
    defaultArea: "Jama Masjid",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  },
  {
    canonicalName: "Moti Mahal",
    aliases: ["moti mahal", "motimahal", "moti mahal daryaganj"],
    searchTerms: ["Moti Mahal", "Moti Mahal Delux"],
    defaultCity: "Delhi",
    defaultArea: "Daryaganj",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  },
  {
    canonicalName: "Peter Cat",
    aliases: ["peter cat", "petercat", "peter cat park street"],
    searchTerms: ["Peter Cat"],
    defaultCity: "Kolkata",
    defaultArea: "Park Street",
    isVeg: false,
    cuisineCategory: "cafe"
  },
  {
    canonicalName: "Flurys",
    aliases: ["flurys", "flury's", "flurys park street"],
    searchTerms: ["Flurys", "Flurys Bakery"],
    defaultCity: "Kolkata",
    defaultArea: "Park Street",
    isVeg: false,
    cuisineCategory: "bakery"
  },
  {
    canonicalName: "Arsalan",
    aliases: ["arsalan", "arsalan biryani", "arsalan park circus"],
    searchTerms: ["Arsalan", "Arsalan Biryani"],
    defaultCity: "Kolkata",
    isVeg: false,
    cuisineCategory: "mughlai_biryani"
  }
];

// ---------------------------------------------------------------------------
// 2. PHONETIC NORMALIZATION & FUZZY UTILITIES
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

export function cleanRestaurantName(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(/[(),\-&/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Phonetically normalizes common Indian and English transliteration variations:
 * e.g. ph -> f, w -> v, sh -> s, double letters -> single
 */
export function phoneticNormalize(str: string): string {
  let s = cleanRestaurantName(str);
  s = s.replace(/\b(hotel|restaurant|cafe|dhaba|pure veg|veg|family|bar)\b/g, '').trim();
  s = s.replace(/ph/g, 'f');
  s = s.replace(/w/g, 'v');
  s = s.replace(/ee/g, 'i');
  s = s.replace(/oo/g, 'u');
  s = s.replace(/sh/g, 's');
  s = s.replace(/z/g, 'j');
  s = s.replace(/(.)\1+/g, '$1'); // collapse duplicate consecutive chars (e.g. kailas -> kailas, mcdonald -> mcdonald)
  s = s.replace(/\s+/g, '');
  return s;
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = cleanRestaurantName(str1);
  const s2 = cleanRestaurantName(str2);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  const maxLen = Math.max(s1.length, s2.length);
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - (dist / maxLen));
}

export function normalizeIndianSpelling(query: string): string {
  let s = (query || '').trim();
  if (!s) return '';

  // 1. Explicit common transliteration & venue typo mappings
  s = s.replace(/\b(mr\.?)\s*vadyaa?\b/gi, 'Mr. Vadya');
  s = s.replace(/\bvadyaa\b/gi, 'vadya');
  s = s.replace(/\bvaddya\b/gi, 'vadya');
  s = s.replace(/\bkalva\b/gi, 'kalwa');

  // Venue type typos (hotel, restaurant, cafe, dhaba, mess, sweets, etc.)
  s = s.replace(/\b(hotle|hotl|hotal|hotell)\b/gi, 'hotel');
  s = s.replace(/\b(restorant|restaurent|resturent|restarent|restro|restrant)\b/gi, 'restaurant');
  s = s.replace(/\b(caffe|cafee|kafe)\b/gi, 'cafe');
  s = s.replace(/\b(dhabba|dhabaa)\b/gi, 'dhaba');
  s = s.replace(/\b(bhojanalaya|bhojnalay|bhojnalaya)\b/gi, 'bhojanalay');
  s = s.replace(/\b(khanawall?)\b/gi, 'khanawal');
  s = s.replace(/\b(sweetts?|swits?)\b/gi, 'sweets');
  s = s.replace(/\b(mithaye|mithey|mithayee)\b/gi, 'mithai');
  s = s.replace(/\b(koolfi|kulfy)\b/gi, 'kulfi');
  s = s.replace(/\b(amrutulya|amrutuly)\b/gi, 'amruttulya');

  // Food item typos
  s = s.replace(/\b(chayy?a?)\b/gi, 'chai');
  s = s.replace(/\b(dosaa|dosha)\b/gi, 'dosa');
  s = s.replace(/\b(misall|missal)\b/gi, 'misal');
  s = s.replace(/\b(paav|paaw)\b/gi, 'pav');
  s = s.replace(/\b(rotii)\b/gi, 'roti');
  s = s.replace(/\b(biryanii|biryany|briyani|biriyani|biryanni|beriyani)\b/gi, 'biryani');
  s = s.replace(/\b(panner|paneeer)\b/gi, 'paneer');
  s = s.replace(/\b(chiken|chikken)\b/gi, 'chicken');
  s = s.replace(/\b(muton)\b/gi, 'mutton');
  s = s.replace(/\b(sandwitch|sandwish)\b/gi, 'sandwich');
  s = s.replace(/\b(burgur|burgar)\b/gi, 'burger');
  s = s.replace(/\b(pizaa|piza|pizzza)\b/gi, 'pizza');
  s = s.replace(/\b(chines|chinees|chainese|chinis)\b/gi, 'chinese');
  s = s.replace(/\b(kachodi|katchori)\b/gi, 'kachori');
  s = s.replace(/\b(smosa|samossa)\b/gi, 'samosa');
  s = s.replace(/\b(bhell?)\b/gi, 'bhel');
  s = s.replace(/\b(parbhat)\b/gi, 'parbat');

  // 2. Trailing duplicate vowels (e.g. "vadyaa" -> "vadya", "dosaa" -> "dosa", "thelaa" -> "thela")
  s = s.replace(/\b([a-z]{3,})(aa|ee|oo|ii|uu)\b/gi, (match, prefix, suffix) => {
    const lower = match.toLowerCase();
    if (['naan', 'paan', 'aloo', 'puri', 'ghee', 'shree', 'coffee', 'paneer', 'toffee', 'free', 'tree', 'lassi'].includes(lower)) {
      return match;
    }
    if (lower.endsWith('shree') || lower.endsWith('coffee')) {
      return match;
    }
    return prefix + suffix.charAt(0);
  });

  return s;
}

// ---------------------------------------------------------------------------
// 3. MAIN NORMALIZATION RESOLVER
// ---------------------------------------------------------------------------

/**
 * Resolves any typed restaurant string (including severe typos) to its canonical brand
 * or generates the best search targets for Swiggy and Zomato.
 */
export function resolveRestaurantQuery(rawName: string, city?: string): NormalizedBrandResult {
  const normalizedSpelling = normalizeIndianSpelling(rawName);
  const cleanInput = cleanRestaurantName(normalizedSpelling || rawName);
  const phoneticInput = phoneticNormalize(cleanInput);

  if (!cleanInput) {
    return {
      isResolved: false,
      canonicalName: rawName,
      searchVariations: [rawName],
      confidence: 0
    };
  }

  let bestMatch: BrandEntry | null = null;
  let bestScore = 0;

  for (const brand of CANONICAL_BRANDS) {
    // 1. Exact alias match
    for (const alias of brand.aliases) {
      const cleanAlias = cleanRestaurantName(alias);
      if (cleanInput === cleanAlias || cleanInput.includes(cleanAlias) || cleanAlias.includes(cleanInput)) {
        return {
          isResolved: true,
          canonicalName: brand.canonicalName,
          searchVariations: brand.searchTerms,
          city: brand.defaultCity || city,
          area: brand.defaultArea,
          isVeg: brand.isVeg,
          cuisineCategory: brand.cuisineCategory,
          confidence: 1.0
        };
      }

      // Phonetic equivalence check (e.g. "mcdonld" vs "mcdonalds", "kailas parbhat" vs "kailash parbat")
      const phoneticAlias = phoneticNormalize(alias);
      if (phoneticInput && phoneticAlias && (phoneticInput === phoneticAlias || phoneticInput.includes(phoneticAlias) || phoneticAlias.includes(phoneticInput))) {
        return {
          isResolved: true,
          canonicalName: brand.canonicalName,
          searchVariations: brand.searchTerms,
          city: brand.defaultCity || city,
          area: brand.defaultArea,
          isVeg: brand.isVeg,
          cuisineCategory: brand.cuisineCategory,
          confidence: 0.95
        };
      }

      // Levenshtein fuzzy distance tolerance
      const sim = calculateSimilarity(cleanInput, cleanAlias);
      if (sim > bestScore && sim >= 0.70) {
        bestScore = sim;
        bestMatch = brand;
      }
    }
  }

  if (bestMatch && bestScore >= 0.70) {
    return {
      isResolved: true,
      canonicalName: bestMatch.canonicalName,
      searchVariations: bestMatch.searchTerms,
      city: bestMatch.defaultCity || city,
      area: bestMatch.defaultArea,
      isVeg: bestMatch.isVeg,
      cuisineCategory: bestMatch.cuisineCategory,
      confidence: bestScore
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Fallback: Extract meaningful search tokens for generic/unlisted spots
  // ---------------------------------------------------------------------------
  const tokens = cleanInput.split(' ').filter(t => t.length > 2 && !VENUE_NOISE_WORDS.has(t));
  const coreBrand = tokens.slice(0, 3).join(' ') || rawName;

  // Infer cuisine category from keywords
  const detectedCuisine = detectCuisineFromKeywords(cleanInput);

  const searchVars = [rawName.trim()];
  if (coreBrand && coreBrand.toLowerCase() !== rawName.toLowerCase().trim()) {
    searchVars.push(coreBrand);
  }

  return {
    isResolved: false,
    canonicalName: rawName.trim(),
    searchVariations: searchVars,
    city: city,
    cuisineCategory: detectedCuisine,
    confidence: 0.5
  };
}

// ---------------------------------------------------------------------------
// 5. CUISINE DETECTION FROM VENDOR / STALL NAME
// ---------------------------------------------------------------------------

export function detectCuisineFromKeywords(text: string): string {
  const t = text.toLowerCase();

  if (t.includes('misal') || t.includes('kat kirr') || t.includes('tarri')) return 'misal';
  if (t.includes('dosa') || t.includes('idli') || t.includes('vada') || t.includes('uttapam') || t.includes('tiffin') || t.includes('south indian') || t.includes('bhavan')) return 'south_indian';
  if (t.includes('biryani') || t.includes('pulao') || t.includes('pulav') || t.includes('dum')) return 'mughlai_biryani';
  if (t.includes('pav bhaji') || t.includes('pavbhaji') || t.includes('bhaji pav')) return 'pav_bhaji';
  if (t.includes('vada pav') || t.includes('vadapav') || t.includes('wada pav') || t.includes('batata vada') || t.includes('samosa')) return 'vada_pav';
  if (t.includes('chaat') || t.includes('bhel') || t.includes('pani puri') || t.includes('sev puri') || t.includes('dahi puri') || t.includes('ragda')) return 'chaat_sweets';
  if (t.includes('chinese') || t.includes('wok') || t.includes('noodle') || t.includes('noodles') || t.includes('momos') || t.includes('momo') || t.includes('schezwan') || t.includes('manchurian')) return 'chinese_momos';
  if (t.includes('pizza') || t.includes('burger') || t.includes('sandwich') || t.includes('fries') || t.includes('cafe') || t.includes('coffee')) return 'fast_food';
  if (t.includes('shawarma') || t.includes('shwarma') || t.includes('kebab') || t.includes('roll') || t.includes('rolls') || t.includes('frankie')) return 'rolls_shawarma';
  if (t.includes('thali') || t.includes('bhojanalay') || t.includes('khanaval') || t.includes('mess') || t.includes('rasoi')) return 'thali';
  if (t.includes('chai') || t.includes('tea') || t.includes('amruttulya') || t.includes('tapri') || t.includes('chaha')) return 'cafe_chai';
  if (t.includes('bakery') || t.includes('cake') || t.includes('pastry') || t.includes('cookies') || t.includes('bake')) return 'bakery';
  if (t.includes('ice cream') || t.includes('kulfi') || t.includes('falooda') || t.includes('juice') || t.includes('shake') || t.includes('mastani')) return 'desserts';
  if (t.includes('sweet') || t.includes('sweets') || t.includes('mithai') || t.includes('farsan')) return 'chaat_sweets';

  return 'universal';
}
