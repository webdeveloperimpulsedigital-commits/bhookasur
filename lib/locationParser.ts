/**
 * Intelligent Location & Restaurant Query Parser for Indian Food Tour
 * Accurately extracts establishment names, detects localities/neighborhoods, and maps to correct cities.
 */

export interface ParsedRestaurantQuery {
  cleanName: string;
  area: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

interface LocalityInfo {
  area: string;
  city: string;
  lat: number;
  lng: number;
}

// Comprehensive registry of Indian localities, suburbs, and neighborhoods
export const KNOWN_LOCALITIES: Record<string, LocalityInfo> = {
  // Navi Mumbai
  'ghansoli': { area: 'Ghansoli', city: 'Navi Mumbai', lat: 19.1171, lng: 73.0039 },
  'koparkhairne': { area: 'Kopar Khairne', city: 'Navi Mumbai', lat: 19.1049, lng: 73.0091 },
  'kopar khairne': { area: 'Kopar Khairne', city: 'Navi Mumbai', lat: 19.1049, lng: 73.0091 },
  'vashi': { area: 'Vashi', city: 'Navi Mumbai', lat: 19.0771, lng: 72.9986 },
  'sector 17 vashi': { area: 'Sector 17, Vashi', city: 'Navi Mumbai', lat: 19.0740, lng: 72.9990 },
  'sector 17': { area: 'Sector 17, Vashi', city: 'Navi Mumbai', lat: 19.0740, lng: 72.9990 },
  'sector 19 vashi': { area: 'Sector 19, Vashi', city: 'Navi Mumbai', lat: 19.0810, lng: 73.0030 },
  'sector 19': { area: 'Sector 19, Vashi', city: 'Navi Mumbai', lat: 19.0810, lng: 73.0030 },
  'inorbit mall vashi': { area: 'Inorbit Mall, Vashi', city: 'Navi Mumbai', lat: 19.0655, lng: 73.0016 },
  'inorbit vashi': { area: 'Inorbit Mall, Vashi', city: 'Navi Mumbai', lat: 19.0655, lng: 73.0016 },
  'palm beach road': { area: 'Palm Beach Road, Vashi', city: 'Navi Mumbai', lat: 19.0720, lng: 73.0030 },
  'palm beach': { area: 'Palm Beach Road, Vashi', city: 'Navi Mumbai', lat: 19.0720, lng: 73.0030 },
  'nerul': { area: 'Nerul', city: 'Navi Mumbai', lat: 19.0330, lng: 73.0197 },
  'belapur': { area: 'CBD Belapur', city: 'Navi Mumbai', lat: 19.0178, lng: 73.0397 },
  'cbd belapur': { area: 'CBD Belapur', city: 'Navi Mumbai', lat: 19.0178, lng: 73.0397 },
  'airoli': { area: 'Airoli', city: 'Navi Mumbai', lat: 19.1554, lng: 72.9972 },
  'rabale': { area: 'Rabale', city: 'Navi Mumbai', lat: 19.1353, lng: 73.0034 },
  'mahape': { area: 'Mahape', city: 'Navi Mumbai', lat: 19.1090, lng: 73.0230 },
  'turbhe': { area: 'Turbhe', city: 'Navi Mumbai', lat: 19.0680, lng: 73.0240 },
  'sanpada': { area: 'Sanpada', city: 'Navi Mumbai', lat: 19.0640, lng: 73.0110 },
  'juinagar': { area: 'Juinagar', city: 'Navi Mumbai', lat: 19.0520, lng: 73.0170 },
  'seawoods': { area: 'Seawoods', city: 'Navi Mumbai', lat: 19.0210, lng: 73.0180 },
  'nexus seawoods': { area: 'Seawoods Grand Central', city: 'Navi Mumbai', lat: 19.0210, lng: 73.0180 },
  'seawoods grand central': { area: 'Seawoods Grand Central', city: 'Navi Mumbai', lat: 19.0210, lng: 73.0180 },
  'kharghar': { area: 'Kharghar', city: 'Navi Mumbai', lat: 19.0434, lng: 73.0673 },
  'panvel': { area: 'Panvel', city: 'Navi Mumbai', lat: 18.9894, lng: 73.1175 },
  'kamothe': { area: 'Kamothe', city: 'Navi Mumbai', lat: 19.0250, lng: 73.0900 },
  'kalamboli': { area: 'Kalamboli', city: 'Navi Mumbai', lat: 19.0280, lng: 73.1060 },
  'ulwe': { area: 'Ulwe', city: 'Navi Mumbai', lat: 18.9760, lng: 73.0250 },
  'digha': { area: 'Digha', city: 'Navi Mumbai', lat: 19.1830, lng: 72.9960 },
  'navi mumbai': { area: 'Navi Mumbai', city: 'Navi Mumbai', lat: 19.0330, lng: 73.0297 },

  // Thane
  'thane': { area: 'Thane', city: 'Thane', lat: 19.1972, lng: 72.9722 },
  'naupada': { area: 'Naupada', city: 'Thane', lat: 19.1860, lng: 72.9750 },
  'panch pakhadi': { area: 'Panch Pakhadi', city: 'Thane', lat: 19.1920, lng: 72.9680 },
  'majiwada': { area: 'Majiwada', city: 'Thane', lat: 19.2150, lng: 72.9830 },
  'viviana mall': { area: 'Viviana Mall, Thane', city: 'Thane', lat: 19.2080, lng: 72.9720 },
  'viviana': { area: 'Viviana Mall, Thane', city: 'Thane', lat: 19.2080, lng: 72.9720 },
  'korum mall': { area: 'Korum Mall, Thane', city: 'Thane', lat: 19.2020, lng: 72.9670 },
  'korum': { area: 'Korum Mall, Thane', city: 'Thane', lat: 19.2020, lng: 72.9670 },
  'vartak nagar': { area: 'Vartak Nagar', city: 'Thane', lat: 19.2080, lng: 72.9640 },
  'ghodbunder': { area: 'Ghodbunder Road', city: 'Thane', lat: 19.2600, lng: 72.9300 },
  'kalyan': { area: 'Kalyan', city: 'Thane', lat: 19.2403, lng: 73.1305 },
  'dombivli': { area: 'Dombivli', city: 'Thane', lat: 19.2184, lng: 73.0867 },
  'dombivali': { area: 'Dombivli', city: 'Thane', lat: 19.2184, lng: 73.0867 },
  'kalwa': { area: 'Kalwa', city: 'Thane', lat: 19.1940, lng: 72.9960 },
  'mumbra': { area: 'Mumbra', city: 'Thane', lat: 19.1760, lng: 73.0220 },
  'bhiwandi': { area: 'Bhiwandi', city: 'Thane', lat: 19.2960, lng: 73.0630 },
  'mira road': { area: 'Mira Road', city: 'Thane', lat: 19.2810, lng: 72.8560 },
  'bhayandar': { area: 'Bhayandar', city: 'Thane', lat: 19.3010, lng: 72.8500 },

  // Mumbai
  'sion': { area: 'Sion', city: 'Mumbai', lat: 19.0430, lng: 72.8630 },
  'dadar': { area: 'Dadar', city: 'Mumbai', lat: 19.0178, lng: 72.8478 },
  'bandra': { area: 'Bandra', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  'bandra west': { area: 'Bandra West', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  'bandra east': { area: 'Bandra East', city: 'Mumbai', lat: 19.0630, lng: 72.8450 },
  'linking road': { area: 'Linking Road, Bandra', city: 'Mumbai', lat: 19.0620, lng: 72.8330 },
  'hill road': { area: 'Hill Road, Bandra', city: 'Mumbai', lat: 19.0550, lng: 72.8310 },
  'carter road': { area: 'Carter Road, Bandra', city: 'Mumbai', lat: 19.0680, lng: 72.8220 },
  'bandstand': { area: 'Bandstand, Bandra', city: 'Mumbai', lat: 19.0450, lng: 72.8190 },
  'bkc': { area: 'BKC, Bandra', city: 'Mumbai', lat: 19.0670, lng: 72.8680 },
  'andheri': { area: 'Andheri', city: 'Mumbai', lat: 19.1136, lng: 72.8697 },
  'andheri west': { area: 'Andheri West', city: 'Mumbai', lat: 19.1200, lng: 72.8350 },
  'andheri east': { area: 'Andheri East', city: 'Mumbai', lat: 19.1150, lng: 72.8650 },
  'lokhandwala': { area: 'Lokhandwala, Andheri', city: 'Mumbai', lat: 19.1410, lng: 72.8270 },
  'juhu': { area: 'Juhu', city: 'Mumbai', lat: 19.1075, lng: 72.8263 },
  'vile parle': { area: 'Vile Parle', city: 'Mumbai', lat: 19.1025, lng: 72.8375 },
  'santacruz': { area: 'Santacruz', city: 'Mumbai', lat: 19.0843, lng: 72.8360 },
  'malad': { area: 'Malad', city: 'Mumbai', lat: 19.1860, lng: 72.8485 },
  'infiniti mall malad': { area: 'Malad West', city: 'Mumbai', lat: 19.1840, lng: 72.8340 },
  'inorbit mall malad': { area: 'Malad West', city: 'Mumbai', lat: 19.1730, lng: 72.8350 },
  'goregaon': { area: 'Goregaon', city: 'Mumbai', lat: 19.1663, lng: 72.8526 },
  'kandivali': { area: 'Kandivali', city: 'Mumbai', lat: 19.2045, lng: 72.8522 },
  'borivali': { area: 'Borivali', city: 'Mumbai', lat: 19.2307, lng: 72.8567 },
  'dahisar': { area: 'Dahisar', city: 'Mumbai', lat: 19.2500, lng: 72.8590 },
  'kurla': { area: 'Kurla', city: 'Mumbai', lat: 19.0726, lng: 72.8845 },
  'phoenix marketcity kurla': { area: 'Kurla West', city: 'Mumbai', lat: 19.0870, lng: 72.8890 },
  'chembur': { area: 'Chembur', city: 'Mumbai', lat: 19.0622, lng: 72.8997 },
  'ghatkopar': { area: 'Ghatkopar', city: 'Mumbai', lat: 19.0860, lng: 72.9080 },
  'r city mall': { area: 'R City Mall, Ghatkopar', city: 'Mumbai', lat: 19.0980, lng: 72.9160 },
  'bhandup': { area: 'Bhandup', city: 'Mumbai', lat: 19.1438, lng: 72.9378 },
  'mulund': { area: 'Mulund', city: 'Mumbai', lat: 19.1726, lng: 72.9565 },
  'powai': { area: 'Powai', city: 'Mumbai', lat: 19.1176, lng: 72.9060 },
  'hiranandani powai': { area: 'Hiranandani, Powai', city: 'Mumbai', lat: 19.1190, lng: 72.9120 },
  'colaba': { area: 'Colaba', city: 'Mumbai', lat: 18.9222, lng: 72.8317 },
  'marine drive': { area: 'Marine Drive', city: 'Mumbai', lat: 18.9430, lng: 72.8230 },
  'marine lines': { area: 'Marine Lines', city: 'Mumbai', lat: 18.9440, lng: 72.8280 },
  'churchgate': { area: 'Churchgate', city: 'Mumbai', lat: 18.9322, lng: 72.8264 },
  'fort': { area: 'Fort', city: 'Mumbai', lat: 18.9322, lng: 72.8336 },
  'byculla': { area: 'Byculla', city: 'Mumbai', lat: 18.9750, lng: 72.8330 },
  'lower parel': { area: 'Lower Parel', city: 'Mumbai', lat: 18.9953, lng: 72.8288 },
  'high street phoenix': { area: 'Lower Parel', city: 'Mumbai', lat: 18.9953, lng: 72.8288 },
  'palladium': { area: 'Lower Parel', city: 'Mumbai', lat: 18.9953, lng: 72.8288 },
  'worli': { area: 'Worli', city: 'Mumbai', lat: 19.0160, lng: 72.8170 },
  'tardeo': { area: 'Tardeo', city: 'Mumbai', lat: 18.9680, lng: 72.8150 },
  'girgaon': { area: 'Girgaon Chowpatty', city: 'Mumbai', lat: 18.9540, lng: 72.8120 },
  'mumbai': { area: 'Mumbai', city: 'Mumbai', lat: 19.0760, lng: 72.8777 },

  // Pune
  'kothrud': { area: 'Kothrud', city: 'Pune', lat: 18.5074, lng: 73.8077 },
  'fc road': { area: 'FC Road', city: 'Pune', lat: 18.5204, lng: 73.8407 },
  'fergusson': { area: 'FC Road', city: 'Pune', lat: 18.5204, lng: 73.8407 },
  'deccan': { area: 'Deccan', city: 'Pune', lat: 18.5167, lng: 73.8415 },
  'shivajinagar': { area: 'Shivajinagar', city: 'Pune', lat: 18.5314, lng: 73.8446 },
  'jm road': { area: 'Jangali Maharaj Road', city: 'Pune', lat: 18.5245, lng: 73.8485 },
  'sb road': { area: 'SB Road', city: 'Pune', lat: 18.5310, lng: 73.8300 },
  'law college road': { area: 'Law College Road', city: 'Pune', lat: 18.5140, lng: 73.8290 },
  'karve nagar': { area: 'Karve Nagar', city: 'Pune', lat: 18.4900, lng: 73.8180 },
  'karve road': { area: 'Karve Road', city: 'Pune', lat: 18.5070, lng: 73.8290 },
  'sinhagad road': { area: 'Sinhagad Road', city: 'Pune', lat: 18.4720, lng: 73.8200 },
  'dhayari': { area: 'Dhayari', city: 'Pune', lat: 18.4480, lng: 73.8080 },
  'nanded phata': { area: 'Nanded Phata', city: 'Pune', lat: 18.4550, lng: 73.8010 },
  'warje': { area: 'Warje', city: 'Pune', lat: 18.4830, lng: 73.8030 },
  'bavdhan': { area: 'Bavdhan', city: 'Pune', lat: 18.5110, lng: 73.7740 },
  'baner': { area: 'Baner', city: 'Pune', lat: 18.5590, lng: 73.7868 },
  'balewadi': { area: 'Balewadi', city: 'Pune', lat: 18.5750, lng: 73.7720 },
  'high street balewadi': { area: 'Balewadi High Street', city: 'Pune', lat: 18.5750, lng: 73.7720 },
  'aundh': { area: 'Aundh', city: 'Pune', lat: 18.5580, lng: 73.8050 },
  'hinjewadi': { area: 'Hinjewadi', city: 'Pune', lat: 18.5910, lng: 73.7380 },
  'hinjawadi': { area: 'Hinjewadi', city: 'Pune', lat: 18.5910, lng: 73.7380 },
  'wakad': { area: 'Wakad', city: 'Pune', lat: 18.5980, lng: 73.7660 },
  'pimpri': { area: 'Pimpri', city: 'Pune', lat: 18.6270, lng: 73.8000 },
  'chinchwad': { area: 'Chinchwad', city: 'Pune', lat: 18.6290, lng: 73.7820 },
  'nigdi': { area: 'Nigdi', city: 'Pune', lat: 18.6520, lng: 73.7660 },
  'camp': { area: 'Camp', city: 'Pune', lat: 18.5140, lng: 73.8760 },
  'mg road pune': { area: 'MG Road, Camp', city: 'Pune', lat: 18.5140, lng: 73.8760 },
  'koregaon park': { area: 'Koregaon Park', city: 'Pune', lat: 18.5362, lng: 73.8940 },
  'kalyani nagar': { area: 'Kalyani Nagar', city: 'Pune', lat: 18.5490, lng: 73.9040 },
  'viman nagar': { area: 'Viman Nagar', city: 'Pune', lat: 18.5679, lng: 73.9143 },
  'phoenix mall viman nagar': { area: 'Phoenix Marketcity, Viman Nagar', city: 'Pune', lat: 18.5620, lng: 73.9168 },
  'kharadi': { area: 'Kharadi', city: 'Pune', lat: 18.5510, lng: 73.9340 },
  'hadapsar': { area: 'Hadapsar', city: 'Pune', lat: 18.5020, lng: 73.9280 },
  'magarpatta': { area: 'Magarpatta', city: 'Pune', lat: 18.5130, lng: 73.9250 },
  'seasons mall': { area: 'Seasons Mall, Magarpatta', city: 'Pune', lat: 18.5190, lng: 73.9310 },
  'amanora': { area: 'Amanora Mall, Hadapsar', city: 'Pune', lat: 18.5180, lng: 73.9340 },
  'swargate': { area: 'Swargate', city: 'Pune', lat: 18.5025, lng: 73.8570 },
  'sadashiv peth': { area: 'Sadashiv Peth', city: 'Pune', lat: 18.5123, lng: 73.8530 },
  'tilak road': { area: 'Tilak Road', city: 'Pune', lat: 18.5085, lng: 73.8560 },
  'katraj': { area: 'Katraj', city: 'Pune', lat: 18.4570, lng: 73.8670 },
  'pune': { area: 'Pune', city: 'Pune', lat: 18.5204, lng: 73.8407 },

  // Delhi / NCR
  'connaught place': { area: 'Connaught Place', city: 'Delhi', lat: 28.6315, lng: 77.2167 },
  'cp': { area: 'Connaught Place', city: 'Delhi', lat: 28.6315, lng: 77.2167 },
  'karol bagh': { area: 'Karol Bagh', city: 'Delhi', lat: 28.6514, lng: 77.1907 },
  'paharganj': { area: 'Paharganj', city: 'Delhi', lat: 28.6430, lng: 77.2140 },
  'chandni chowk': { area: 'Chandni Chowk', city: 'Delhi', lat: 28.6506, lng: 77.2303 },
  'jama masjid': { area: 'Jama Masjid', city: 'Delhi', lat: 28.6507, lng: 77.2334 },
  'lajpat nagar': { area: 'Lajpat Nagar', city: 'Delhi', lat: 28.5677, lng: 77.2433 },
  'hauz khas': { area: 'Hauz Khas', city: 'Delhi', lat: 28.5494, lng: 77.2001 },
  'saket': { area: 'Saket', city: 'Delhi', lat: 28.5244, lng: 77.2167 },
  'select citywalk': { area: 'Select Citywalk, Saket', city: 'Delhi', lat: 28.5284, lng: 77.2190 },
  'noida': { area: 'Noida', city: 'Delhi NCR', lat: 28.5355, lng: 77.3910 },
  'sector 18 noida': { area: 'Sector 18, Noida', city: 'Delhi NCR', lat: 28.5700, lng: 77.3200 },
  'gurgaon': { area: 'Gurgaon', city: 'Delhi NCR', lat: 28.4595, lng: 77.0266 },
  'cyber hub': { area: 'DLF Cyber Hub, Gurgaon', city: 'Delhi NCR', lat: 28.4950, lng: 77.0880 },
  'gurugram': { area: 'Gurugram', city: 'Delhi NCR', lat: 28.4595, lng: 77.0266 },
  'delhi': { area: 'Delhi', city: 'Delhi', lat: 28.6139, lng: 77.2090 },

  // Bengaluru
  'koramangala': { area: 'Koramangala', city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  'indiranagar': { area: 'Indiranagar', city: 'Bengaluru', lat: 12.9780, lng: 77.6400 },
  'whitefield': { area: 'Whitefield', city: 'Bengaluru', lat: 12.9698, lng: 77.7500 },
  'hsr layout': { area: 'HSR Layout', city: 'Bengaluru', lat: 12.9121, lng: 77.6446 },
  'jayanagar': { area: 'Jayanagar', city: 'Bengaluru', lat: 12.9308, lng: 77.5838 },
  'malleshwaram': { area: 'Malleshwaram', city: 'Bengaluru', lat: 12.9980, lng: 77.5710 },
  'mg road bangalore': { area: 'MG Road', city: 'Bengaluru', lat: 12.9756, lng: 77.6066 },
  'church street': { area: 'Church Street', city: 'Bengaluru', lat: 12.9745, lng: 77.6045 },
  'bengaluru': { area: 'Bengaluru', city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  'bangalore': { area: 'Bengaluru', city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },

  // Hyderabad
  'banjara hills': { area: 'Banjara Hills', city: 'Hyderabad', lat: 17.4250, lng: 78.4480 },
  'jubilee hills': { area: 'Jubilee Hills', city: 'Hyderabad', lat: 17.4319, lng: 78.4073 },
  'madhapur': { area: 'Madhapur', city: 'Hyderabad', lat: 17.4483, lng: 78.3915 },
  'hitech city': { area: 'Hitech City', city: 'Hyderabad', lat: 17.4435, lng: 78.3772 },
  'gachibowli': { area: 'Gachibowli', city: 'Hyderabad', lat: 17.4401, lng: 78.3489 },
  'charminar': { area: 'Charminar', city: 'Hyderabad', lat: 17.3616, lng: 78.4747 },
  'secunderabad': { area: 'Secunderabad', city: 'Hyderabad', lat: 17.4399, lng: 78.4983 },
  'hyderabad': { area: 'Hyderabad', city: 'Hyderabad', lat: 17.3850, lng: 78.4867 }
};

// Common typos and phonetic fixes in restaurant searches
const TYPO_MAP: [RegExp, string][] = [
  [/\btempation\b/gi, 'Temptation'],
  [/\btemptaion\b/gi, 'Temptation'],
  [/\bresturant\b/gi, 'Restaurant'],
  [/\brestaurent\b/gi, 'Restaurant'],
  [/\brestraunt\b/gi, 'Restaurant'],
  [/\brestorent\b/gi, 'Restaurant'],
  [/\bhotle\b/gi, 'Hotel'],
  [/\bhtel\b/gi, 'Hotel'],
  [/\bcafee\b/gi, 'Cafe'],
  [/\bcaffe\b/gi, 'Cafe'],
  [/\bbirani\b/gi, 'Biryani'],
  [/\bbiryani\b/gi, 'Biryani'],
  [/\bdhaba\b/gi, 'Dhaba'],
  [/\bdabba\b/gi, 'Dhaba']
];

/**
 * Parses user restaurant search query:
 * - Detects locality/city inside query string
 * - Cleans up typos (e.g. "tempation" -> "Temptation")
 * - Formats proper restaurant name (e.g. "Hotel Temptation")
 * - Returns accurate name and location without cross-city pollution (e.g. no "Ghansoli, Pune")
 */
export function parseRestaurantQuery(
  rawQuery: string,
  fallbackCity = 'Pune',
  userCoords?: { lat: number; lng: number } | null
): ParsedRestaurantQuery {
  const trimmed = (rawQuery || '').trim();
  if (!trimmed) {
    return {
      cleanName: '',
      area: fallbackCity || 'Local',
      city: fallbackCity || 'Pune',
      address: `${fallbackCity || 'Pune'}, India`,
      latitude: userCoords?.lat || 18.5204,
      longitude: userCoords?.lng || 73.8407,
      displayName: ''
    };
  }

  let lower = trimmed.toLowerCase();

  // Strip common search suffixes and noise words (e.g. from Google Suggest or speech-to-text)
  lower = lower
    .replace(/\b(contact\s*(number|no)?|phone(\s*number)?|ph\s*no|mobile(\s*number)?|timings?|hours?|photos?|images?|menu|pricing?|prices?|reviews?|rating|owner(\s*name)?|nearest|how\s*to\s*reach|railway\s*station|bus\s*stand|order\s*online)\b/gi, ' ')
    .replace(/\b(in|near|at|around|opposite|opp|behind)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let detectedLocality: LocalityInfo | null = null;

  // 1. Look for known locality matches (check multi-word phrases first)
  const sortedKeys = Object.keys(KNOWN_LOCALITIES).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lower)) {
      detectedLocality = KNOWN_LOCALITIES[key];
      // Remove locality keyword from the remaining name query
      lower = lower.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // 2. Fix typos in the remaining establishment name
  let cleanNameStr = lower;
  for (const [pattern, replacement] of TYPO_MAP) {
    cleanNameStr = cleanNameStr.replace(pattern, replacement);
  }

  // 3. Format Title Case words
  let words = cleanNameStr
    .split(/[\s,/-]+/)
    .map(w => w.trim())
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1));

  // If words are empty (e.g. user only typed the locality "ghansoli"), retain locality as name
  if (words.length === 0) {
    words = [detectedLocality?.area || trimmed];
  }

  let finalName = words.join(' ');

  // 4. Canonical Ordering: if user typed "<Name> Hotel" (e.g. "Temptation Hotel"), format nicely
  if (/^[a-zA-Z0-9\s]+\s+Hotel$/i.test(finalName)) {
    const withoutHotel = finalName.replace(/\s+hotel$/i, '').trim();
    finalName = `Hotel ${withoutHotel}`;
  }

  // 5. Determine correct Area and City
  const resolvedArea = detectedLocality
    ? detectedLocality.area
    : fallbackCity || '';

  const resolvedCity = detectedLocality
    ? detectedLocality.city
    : fallbackCity || '';

  const resolvedLat = detectedLocality
    ? detectedLocality.lat
    : userCoords?.lat || 0;

  const resolvedLng = detectedLocality
    ? detectedLocality.lng
    : userCoords?.lng || 0;

  const address =
    resolvedArea && resolvedCity && resolvedArea.toLowerCase() !== resolvedCity.toLowerCase()
      ? `${resolvedArea}, ${resolvedCity}`
      : (resolvedArea || resolvedCity || 'India');

  return {
    cleanName: finalName,
    area: resolvedArea,
    city: resolvedCity,
    address,
    latitude: resolvedLat,
    longitude: resolvedLng,
    displayName: `${finalName}, ${resolvedArea}`
  };
}

export function getDeterministicPlaceId(name: string, city: string = '', area: string = ''): number {
  let hash = 0;
  const str = `${(name || '').toLowerCase().trim()}_${(city || 'pune').toLowerCase().trim()}_${(area || '').toLowerCase().trim()}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 850000 + Math.abs(hash % 40000);
}

