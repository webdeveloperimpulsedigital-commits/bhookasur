/**
 * Location resolution for restaurant search.
 * ------------------------------------------------------------------
 * Lets users search restaurants in ANY city/area, independent of where they are:
 *   "Prashant Corner Thane", "Mamledar Misal in Thane", "Vaishali, FC Road Pune"
 *
 * 1. parseLocationFromQuery() splits a query into { nameQuery, locationText }
 *    using explicit separators (in / at / near / comma) or a trailing known
 *    city / suburb name.
 * 2. resolveLocation() turns the location text into coordinates using the
 *    built-in gazetteer first, then OpenStreetMap Nominatim (geocoding only -
 *    restaurants themselves are always verified on Swiggy).
 *
 * The user's own location is only used as a geocoding bias and for distances.
 */

export interface ResolvedLocation {
  lat: number;
  lng: number;
  label: string;
  /** 'city' locations cover a larger radius than a specific area/locality */
  kind: 'city' | 'area';
  source: 'gazetteer' | 'nominatim';
}

// ---------------------------------------------------------------------------
// Gazetteer: major cities and frequently searched suburbs (city centres)
// ---------------------------------------------------------------------------
export const CITY_GAZETTEER: Record<string, { lat: number; lng: number; label: string }> = {
  // Maharashtra
  mumbai: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
  bombay: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
  thane: { lat: 19.2183, lng: 72.9781, label: 'Thane' },
  'navi mumbai': { lat: 19.033, lng: 73.0297, label: 'Navi Mumbai' },
  vashi: { lat: 19.0771, lng: 72.9986, label: 'Vashi, Navi Mumbai' },
  panvel: { lat: 18.9894, lng: 73.1175, label: 'Panvel' },
  kalyan: { lat: 19.2437, lng: 73.1355, label: 'Kalyan' },
  dombivli: { lat: 19.2094, lng: 73.0939, label: 'Dombivli' },
  'mira road': { lat: 19.2813, lng: 72.8561, label: 'Mira Road' },
  'vasai virar': { lat: 19.391, lng: 72.8397, label: 'Vasai-Virar' },
  virar: { lat: 19.4559, lng: 72.8114, label: 'Virar' },
  vasai: { lat: 19.3919, lng: 72.8397, label: 'Vasai' },
  bhiwandi: { lat: 19.2813, lng: 73.0483, label: 'Bhiwandi' },
  ulhasnagar: { lat: 19.2215, lng: 73.1645, label: 'Ulhasnagar' },
  lonavala: { lat: 18.7546, lng: 73.4062, label: 'Lonavala' },
  pune: { lat: 18.5204, lng: 73.8567, label: 'Pune' },
  pimpri: { lat: 18.6298, lng: 73.7997, label: 'Pimpri, Pune' },
  chinchwad: { lat: 18.6446, lng: 73.7835, label: 'Chinchwad, Pune' },
  'pimpri chinchwad': { lat: 18.6298, lng: 73.7997, label: 'Pimpri-Chinchwad' },
  hinjewadi: { lat: 18.5913, lng: 73.7389, label: 'Hinjewadi, Pune' },
  wakad: { lat: 18.5987, lng: 73.7651, label: 'Wakad, Pune' },
  'fc road': { lat: 18.5204, lng: 73.8407, label: 'FC Road, Pune' },
  'fergusson college road': { lat: 18.5204, lng: 73.8407, label: 'FC Road, Pune' },
  deccan: { lat: 18.5167, lng: 73.8415, label: 'Deccan Gymkhana, Pune' },
  kothrud: { lat: 18.5074, lng: 73.8077, label: 'Kothrud, Pune' },
  'sadashiv peth': { lat: 18.5140, lng: 73.8540, label: 'Sadashiv Peth, Pune' },
  camp: { lat: 18.5140, lng: 73.8760, label: 'Camp, Pune' },
  'koregaon park': { lat: 18.5362, lng: 73.8940, label: 'Koregaon Park, Pune' },
  'viman nagar': { lat: 18.5679, lng: 73.9143, label: 'Viman Nagar, Pune' },
  baner: { lat: 18.5590, lng: 73.7868, label: 'Baner, Pune' },
  aundh: { lat: 18.5580, lng: 73.8050, label: 'Aundh, Pune' },
  naupada: { lat: 19.1860, lng: 72.9750, label: 'Naupada, Thane' },
  'panch pakhadi': { lat: 19.1920, lng: 72.9680, label: 'Panch Pakhadi, Thane' },
  // Mumbai & MMR Suburbs
  mulund: { lat: 19.1726, lng: 72.9565, label: 'Mulund, Mumbai' },
  'mulund west': { lat: 19.1726, lng: 72.9565, label: 'Mulund West, Mumbai' },
  'mulund east': { lat: 19.1680, lng: 72.9640, label: 'Mulund East, Mumbai' },
  bhandup: { lat: 19.1450, lng: 72.9376, label: 'Bhandup, Mumbai' },
  kanjurmarg: { lat: 19.1300, lng: 72.9300, label: 'Kanjurmarg, Mumbai' },
  vikhroli: { lat: 19.1100, lng: 72.9250, label: 'Vikhroli, Mumbai' },
  ghatkopar: { lat: 19.0860, lng: 72.9080, label: 'Ghatkopar, Mumbai' },
  vidyavihar: { lat: 19.0800, lng: 72.8960, label: 'Vidyavihar, Mumbai' },
  kurla: { lat: 19.0688, lng: 72.8870, label: 'Kurla, Mumbai' },
  sion: { lat: 19.0400, lng: 72.8600, label: 'Sion, Mumbai' },
  matunga: { lat: 19.0270, lng: 72.8550, label: 'Matunga, Mumbai' },
  chembur: { lat: 19.0626, lng: 72.8997, label: 'Chembur, Mumbai' },
  govandi: { lat: 19.0550, lng: 72.9150, label: 'Govandi, Mumbai' },
  wadala: { lat: 19.0200, lng: 72.8600, label: 'Wadala, Mumbai' },
  parel: { lat: 19.0000, lng: 72.8400, label: 'Parel, Mumbai' },
  'lower parel': { lat: 18.9950, lng: 72.8300, label: 'Lower Parel, Mumbai' },
  worli: { lat: 19.0176, lng: 72.8180, label: 'Worli, Mumbai' },
  byculla: { lat: 18.9750, lng: 72.8300, label: 'Byculla, Mumbai' },
  girgaon: { lat: 18.9550, lng: 72.8200, label: 'Girgaon, Mumbai' },
  girgaum: { lat: 18.9550, lng: 72.8200, label: 'Girgaum, Mumbai' },
  'marine lines': { lat: 18.9440, lng: 72.8230, label: 'Marine Lines, Mumbai' },
  'marine drive': { lat: 18.9440, lng: 72.8230, label: 'Marine Drive, Mumbai' },
  churchgate: { lat: 18.9350, lng: 72.8270, label: 'Churchgate, Mumbai' },
  fort: { lat: 18.9330, lng: 72.8350, label: 'Fort, Mumbai' },
  'nariman point': { lat: 18.9260, lng: 72.8230, label: 'Nariman Point, Mumbai' },
  colaba: { lat: 18.9222, lng: 72.8317, label: 'Colaba, Mumbai' },
  bandra: { lat: 19.0596, lng: 72.8295, label: 'Bandra, Mumbai' },
  'bandra west': { lat: 19.0596, lng: 72.8295, label: 'Bandra West, Mumbai' },
  'bandra east': { lat: 19.0620, lng: 72.8450, label: 'Bandra East, Mumbai' },
  dadar: { lat: 19.0178, lng: 72.8478, label: 'Dadar, Mumbai' },
  'dadar west': { lat: 19.0178, lng: 72.8478, label: 'Dadar West, Mumbai' },
  andheri: { lat: 19.1136, lng: 72.8697, label: 'Andheri, Mumbai' },
  'andheri west': { lat: 19.1363, lng: 72.8277, label: 'Andheri West, Mumbai' },
  'andheri east': { lat: 19.1136, lng: 72.8697, label: 'Andheri East, Mumbai' },
  juhu: { lat: 19.1075, lng: 72.8263, label: 'Juhu, Mumbai' },
  'vile parle': { lat: 19.1000, lng: 72.8440, label: 'Vile Parle, Mumbai' },
  santacruz: { lat: 19.0800, lng: 72.8400, label: 'Santacruz, Mumbai' },
  khar: { lat: 19.0700, lng: 72.8340, label: 'Khar, Mumbai' },
  goregaon: { lat: 19.1663, lng: 72.8526, label: 'Goregaon, Mumbai' },
  malad: { lat: 19.1860, lng: 72.8485, label: 'Malad, Mumbai' },
  kandivali: { lat: 19.2050, lng: 72.8500, label: 'Kandivali, Mumbai' },
  borivali: { lat: 19.2300, lng: 72.8560, label: 'Borivali, Mumbai' },
  dahisar: { lat: 19.2550, lng: 72.8600, label: 'Dahisar, Mumbai' },
  powai: { lat: 19.1176, lng: 72.9060, label: 'Powai, Mumbai' },
  chandivali: { lat: 19.1150, lng: 72.8950, label: 'Chandivali, Mumbai' },
  bhayandar: { lat: 19.3000, lng: 72.8500, label: 'Bhayandar' },
  bhayander: { lat: 19.3000, lng: 72.8500, label: 'Bhayander' },

  // Thane Key Areas
  ghodbunder: { lat: 19.2600, lng: 72.9700, label: 'Ghodbunder, Thane' },
  'ghodbunder road': { lat: 19.2600, lng: 72.9700, label: 'Ghodbunder Road, Thane' },
  manpada: { lat: 19.2300, lng: 72.9750, label: 'Manpada, Thane' },
  'vartak nagar': { lat: 19.2100, lng: 72.9600, label: 'Vartak Nagar, Thane' },
  majiwada: { lat: 19.2150, lng: 72.9800, label: 'Majiwada, Thane' },
  kasarvadavali: { lat: 19.2700, lng: 72.9650, label: 'Kasarvadavali, Thane' },
  'wagle estate': { lat: 19.1950, lng: 72.9500, label: 'Wagle Estate, Thane' },
  kalwa: { lat: 19.1950, lng: 72.9950, label: 'Kalwa, Thane' },
  mumbra: { lat: 19.1800, lng: 73.0200, label: 'Mumbra, Thane' },
  diva: { lat: 19.1900, lng: 73.0450, label: 'Diva, Thane' },

  // Navi Mumbai Key Areas
  nerul: { lat: 19.0330, lng: 73.0150, label: 'Nerul, Navi Mumbai' },
  belapur: { lat: 19.0150, lng: 73.0380, label: 'CBD Belapur, Navi Mumbai' },
  'cbd belapur': { lat: 19.0150, lng: 73.0380, label: 'CBD Belapur, Navi Mumbai' },
  kharghar: { lat: 19.0450, lng: 73.0650, label: 'Kharghar, Navi Mumbai' },
  kamothe: { lat: 19.0200, lng: 73.0900, label: 'Kamothe, Navi Mumbai' },
  khandeshwar: { lat: 19.0050, lng: 73.1000, label: 'Khandeshwar, Navi Mumbai' },
  airoli: { lat: 19.1550, lng: 72.9980, label: 'Airoli, Navi Mumbai' },
  ghansoli: { lat: 19.1250, lng: 73.0050, label: 'Ghansoli, Navi Mumbai' },
  'kopar khairane': { lat: 19.1000, lng: 73.0050, label: 'Kopar Khairane, Navi Mumbai' },
  sanpada: { lat: 19.0650, lng: 73.0100, label: 'Sanpada, Navi Mumbai' },
  juinagar: { lat: 19.0500, lng: 73.0180, label: 'Juinagar, Navi Mumbai' },
  seawoods: { lat: 19.0200, lng: 73.0200, label: 'Seawoods, Navi Mumbai' },
  ulwe: { lat: 18.9800, lng: 73.0300, label: 'Ulwe, Navi Mumbai' },

  // Pune Key Areas
  swargate: { lat: 18.5018, lng: 73.8580, label: 'Swargate, Pune' },
  shivajinagar: { lat: 18.5314, lng: 73.8446, label: 'Shivajinagar, Pune' },
  'kalyani nagar': { lat: 18.5482, lng: 73.9030, label: 'Kalyani Nagar, Pune' },
  hadapsar: { lat: 18.5089, lng: 73.9259, label: 'Hadapsar, Pune' },
  magarpatta: { lat: 18.5158, lng: 73.9272, label: 'Magarpatta, Pune' },
  kharadi: { lat: 18.5515, lng: 73.9349, label: 'Kharadi, Pune' },
  katraj: { lat: 18.4575, lng: 73.8677, label: 'Katraj, Pune' },
  dhankawadi: { lat: 18.4682, lng: 73.8540, label: 'Dhankawadi, Pune' },
  bibwewadi: { lat: 18.4780, lng: 73.8640, label: 'Bibwewadi, Pune' },
  kondhwa: { lat: 18.4720, lng: 73.8920, label: 'Kondhwa, Pune' },
  bavdhan: { lat: 18.5120, lng: 73.7740, label: 'Bavdhan, Pune' },
  warje: { lat: 18.4820, lng: 73.8010, label: 'Warje, Pune' },
  'sinhagad road': { lat: 18.4800, lng: 73.8250, label: 'Sinhagad Road, Pune' },
  pashan: { lat: 18.5420, lng: 73.7920, label: 'Pashan, Pune' },
  ravet: { lat: 18.6650, lng: 73.7380, label: 'Ravet, Pune' },
  punawale: { lat: 18.6350, lng: 73.7450, label: 'Punawale, Pune' },
  bhosari: { lat: 18.6250, lng: 73.8450, label: 'Bhosari, Pune' },
  nigdi: { lat: 18.6550, lng: 73.7750, label: 'Nigdi, Pune' },
  akurdi: { lat: 18.6480, lng: 73.7680, label: 'Akurdi, Pune' },
  'mhatre bridge': { lat: 18.5025, lng: 73.8358, label: 'Mhatre Bridge, Pune' },
  erandwane: { lat: 18.5072, lng: 73.8315, label: 'Erandwane, Pune' },
  'karve nagar': { lat: 18.4895, lng: 73.8195, label: 'Karve Nagar, Pune' },
  karvenagar: { lat: 18.4895, lng: 73.8195, label: 'Karve Nagar, Pune' },
  'nal stop': { lat: 18.5082, lng: 73.8275, label: 'Nal Stop, Pune' },
  anandnagar: { lat: 18.4771, lng: 73.8213, label: 'Anandnagar, Pune' },
  'anand nagar': { lat: 18.4771, lng: 73.8213, label: 'Anandnagar, Pune' },
  'bajirao road': { lat: 18.5142, lng: 73.8535, label: 'Bajirao Road, Pune' },
  'tilak road': { lat: 18.5085, lng: 73.8510, label: 'Tilak Road, Pune' },
  'jm road': { lat: 18.5236, lng: 73.8478, label: 'JM Road, Pune' },
  'shaniwar peth': { lat: 18.5186, lng: 73.8548, label: 'Shaniwar Peth, Pune' },
  'narayan peth': { lat: 18.5155, lng: 73.8505, label: 'Narayan Peth, Pune' },
  dhayari: { lat: 18.4475, lng: 73.8095, label: 'Dhayari, Pune' },
  rajajinagar: { lat: 12.9982, lng: 77.5530, label: 'Rajajinagar, Bengaluru' },
  indiranagar: { lat: 12.9784, lng: 77.6408, label: 'Indiranagar, Bengaluru' },
  koramangala: { lat: 12.9352, lng: 77.6245, label: 'Koramangala, Bengaluru' },
  jayanagar: { lat: 12.9308, lng: 77.5838, label: 'Jayanagar, Bengaluru' },
  'church street': { lat: 12.9750, lng: 77.6050, label: 'Church Street, Bengaluru' },
  'brigade road': { lat: 12.9719, lng: 77.6070, label: 'Brigade Road, Bengaluru' },
  nashik: { lat: 19.9975, lng: 73.7898, label: 'Nashik' },
  nasik: { lat: 19.9975, lng: 73.7898, label: 'Nashik' },
  nagpur: { lat: 21.1458, lng: 79.0882, label: 'Nagpur' },
  aurangabad: { lat: 19.8762, lng: 75.3433, label: 'Aurangabad' },
  sambhajinagar: { lat: 19.8762, lng: 75.3433, label: 'Chhatrapati Sambhajinagar' },
  'sambhaji nagar': { lat: 19.8762, lng: 75.3433, label: 'Chhatrapati Sambhajinagar' },
  'chhatrapati sambhajinagar': { lat: 19.8762, lng: 75.3433, label: 'Chhatrapati Sambhajinagar' },
  'chhatrapati sambhaji nagar': { lat: 19.8762, lng: 75.3433, label: 'Chhatrapati Sambhajinagar' },
  kolhapur: { lat: 16.705, lng: 74.2433, label: 'Kolhapur' },
  solapur: { lat: 17.6599, lng: 75.9064, label: 'Solapur' },
  satara: { lat: 17.6805, lng: 74.0183, label: 'Satara' },
  sangli: { lat: 16.8524, lng: 74.5815, label: 'Sangli' },
  ahmednagar: { lat: 19.0952, lng: 74.7496, label: 'Ahmednagar' },
  amravati: { lat: 20.9374, lng: 77.7796, label: 'Amravati' },
  // Goa
  goa: { lat: 15.4909, lng: 73.8278, label: 'Goa' },
  panaji: { lat: 15.4909, lng: 73.8278, label: 'Panaji' },
  margao: { lat: 15.2832, lng: 73.9862, label: 'Margao' },
  calangute: { lat: 15.5439, lng: 73.7553, label: 'Calangute, Goa' },
  baga: { lat: 15.5553, lng: 73.7517, label: 'Baga, Goa' },
  candolim: { lat: 15.5178, lng: 73.7632, label: 'Candolim, Goa' },
  cavelossim: { lat: 15.1760, lng: 73.9450, label: 'Cavelossim, Goa' },
  mobor: { lat: 15.1630, lng: 73.9480, label: 'Mobor Beach, Goa' },
  assagao: { lat: 15.5900, lng: 73.7780, label: 'Assagao, Goa' },
  anjuna: { lat: 15.5733, lng: 73.7411, label: 'Anjuna, Goa' },
  vagator: { lat: 15.6028, lng: 73.7336, label: 'Vagator, Goa' },
  colva: { lat: 15.2797, lng: 73.9117, label: 'Colva, Goa' },
  benaulim: { lat: 15.2583, lng: 73.9197, label: 'Benaulim, Goa' },
  mapusa: { lat: 15.5937, lng: 73.8142, label: 'Mapusa, Goa' },
  vasco: { lat: 15.3982, lng: 73.8113, label: 'Vasco da Gama, Goa' },
  // Karnataka
  bangalore: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru' },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru' },
  mysore: { lat: 12.2958, lng: 76.6394, label: 'Mysuru' },
  mysuru: { lat: 12.2958, lng: 76.6394, label: 'Mysuru' },
  mangalore: { lat: 12.9141, lng: 74.856, label: 'Mangaluru' },
  mangaluru: { lat: 12.9141, lng: 74.856, label: 'Mangaluru' },
  udupi: { lat: 13.3409, lng: 74.7421, label: 'Udupi' },
  manipal: { lat: 13.3525, lng: 74.7868, label: 'Manipal' },
  hubli: { lat: 15.3647, lng: 75.124, label: 'Hubballi' },
  belgaum: { lat: 15.8497, lng: 74.4977, label: 'Belagavi' },
  belagavi: { lat: 15.8497, lng: 74.4977, label: 'Belagavi' },
  // Telangana / AP
  hyderabad: { lat: 17.385, lng: 78.4867, label: 'Hyderabad' },
  secunderabad: { lat: 17.4399, lng: 78.4983, label: 'Secunderabad' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, label: 'Visakhapatnam' },
  vizag: { lat: 17.6868, lng: 83.2185, label: 'Visakhapatnam' },
  vijayawada: { lat: 16.5062, lng: 80.648, label: 'Vijayawada' },
  guntur: { lat: 16.3067, lng: 80.4365, label: 'Guntur' },
  tirupati: { lat: 13.6288, lng: 79.4192, label: 'Tirupati' },
  // Tamil Nadu / Kerala / Puducherry
  chennai: { lat: 13.0827, lng: 80.2707, label: 'Chennai' },
  madras: { lat: 13.0827, lng: 80.2707, label: 'Chennai' },
  coimbatore: { lat: 11.0168, lng: 76.9558, label: 'Coimbatore' },
  madurai: { lat: 9.9252, lng: 78.1198, label: 'Madurai' },
  salem: { lat: 11.6643, lng: 78.1460, label: 'Salem' },
  trichy: { lat: 10.7905, lng: 78.7047, label: 'Tiruchirappalli' },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047, label: 'Tiruchirappalli' },
  pondicherry: { lat: 11.9416, lng: 79.8083, label: 'Puducherry' },
  puducherry: { lat: 11.9416, lng: 79.8083, label: 'Puducherry' },
  kochi: { lat: 9.9312, lng: 76.2673, label: 'Kochi' },
  cochin: { lat: 9.9312, lng: 76.2673, label: 'Kochi' },
  trivandrum: { lat: 8.5241, lng: 76.9366, label: 'Thiruvananthapuram' },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366, label: 'Thiruvananthapuram' },
  kozhikode: { lat: 11.2588, lng: 75.7804, label: 'Kozhikode' },
  calicut: { lat: 11.2588, lng: 75.7804, label: 'Kozhikode' },
  thrissur: { lat: 10.5276, lng: 76.2144, label: 'Thrissur' },
  // NCR & North
  delhi: { lat: 28.6139, lng: 77.209, label: 'Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.209, label: 'New Delhi' },
  gurgaon: { lat: 28.4595, lng: 77.0266, label: 'Gurugram' },
  gurugram: { lat: 28.4595, lng: 77.0266, label: 'Gurugram' },
  noida: { lat: 28.5355, lng: 77.391, label: 'Noida' },
  'greater noida': { lat: 28.4744, lng: 77.504, label: 'Greater Noida' },
  ghaziabad: { lat: 28.6692, lng: 77.4538, label: 'Ghaziabad' },
  faridabad: { lat: 28.4089, lng: 77.3178, label: 'Faridabad' },
  chandigarh: { lat: 30.7333, lng: 76.7794, label: 'Chandigarh' },
  mohali: { lat: 30.7046, lng: 76.7179, label: 'Mohali' },
  panchkula: { lat: 30.6942, lng: 76.8606, label: 'Panchkula' },
  punjab: { lat: 30.901, lng: 75.8573, label: 'Punjab' },
  ludhiana: { lat: 30.901, lng: 75.8573, label: 'Ludhiana' },
  amritsar: { lat: 31.634, lng: 74.8723, label: 'Amritsar' },
  jalandhar: { lat: 31.326, lng: 75.5762, label: 'Jalandhar' },
  patiala: { lat: 30.3398, lng: 76.3869, label: 'Patiala, Punjab' },
  bathinda: { lat: 30.211, lng: 74.9455, label: 'Bathinda, Punjab' },
  pathankot: { lat: 32.2686, lng: 75.6499, label: 'Pathankot, Punjab' },
  hoshiarpur: { lat: 31.5273, lng: 75.9149, label: 'Hoshiarpur, Punjab' },
  dehradun: { lat: 30.3165, lng: 78.0322, label: 'Dehradun' },
  rishikesh: { lat: 30.0869, lng: 78.2676, label: 'Rishikesh' },
  haridwar: { lat: 29.9457, lng: 78.1642, label: 'Haridwar' },
  shimla: { lat: 31.1048, lng: 77.1734, label: 'Shimla' },
  manali: { lat: 32.2432, lng: 77.1892, label: 'Manali' },
  jaipur: { lat: 26.9124, lng: 75.7873, label: 'Jaipur' },
  udaipur: { lat: 24.5854, lng: 73.7125, label: 'Udaipur' },
  jodhpur: { lat: 26.2389, lng: 73.0243, label: 'Jodhpur' },
  jaisalmer: { lat: 26.9157, lng: 70.9083, label: 'Jaisalmer' },
  bikaner: { lat: 28.0229, lng: 73.3119, label: 'Bikaner' },
  pushkar: { lat: 26.4897, lng: 74.5511, label: 'Pushkar' },
  ajmer: { lat: 26.4499, lng: 74.6399, label: 'Ajmer' },
  lucknow: { lat: 26.8467, lng: 80.9462, label: 'Lucknow' },
  kanpur: { lat: 26.4499, lng: 80.3319, label: 'Kanpur' },
  agra: { lat: 27.1767, lng: 78.0081, label: 'Agra' },
  varanasi: { lat: 25.3176, lng: 82.9739, label: 'Varanasi' },
  banaras: { lat: 25.3176, lng: 82.9739, label: 'Varanasi' },
  kashi: { lat: 25.3176, lng: 82.9739, label: 'Varanasi' },
  prayagraj: { lat: 25.4358, lng: 81.8463, label: 'Prayagraj' },
  allahabad: { lat: 25.4358, lng: 81.8463, label: 'Prayagraj' },
  mathura: { lat: 27.4924, lng: 77.6737, label: 'Mathura' },
  ayodhya: { lat: 26.7922, lng: 82.1998, label: 'Ayodhya' },
  meerut: { lat: 28.9845, lng: 77.7064, label: 'Meerut' },
  // Gujarat / MP / Central
  ahmedabad: { lat: 23.0225, lng: 72.5714, label: 'Ahmedabad' },
  gandhinagar: { lat: 23.2156, lng: 72.6369, label: 'Gandhinagar' },
  surat: { lat: 21.1702, lng: 72.8311, label: 'Surat' },
  vadodara: { lat: 22.3072, lng: 73.1812, label: 'Vadodara' },
  baroda: { lat: 22.3072, lng: 73.1812, label: 'Vadodara' },
  rajkot: { lat: 22.3039, lng: 70.8022, label: 'Rajkot' },
  indore: { lat: 22.7196, lng: 75.8577, label: 'Indore' },
  bhopal: { lat: 23.2599, lng: 77.4126, label: 'Bhopal' },
  ujjain: { lat: 23.1765, lng: 75.7885, label: 'Ujjain' },
  gwalior: { lat: 26.2183, lng: 78.1828, label: 'Gwalior' },
  jabalpur: { lat: 23.1815, lng: 79.9864, label: 'Jabalpur' },
  raipur: { lat: 21.2514, lng: 81.6296, label: 'Raipur' },
  // East & North East
  kolkata: { lat: 22.5726, lng: 88.3639, label: 'Kolkata' },
  calcutta: { lat: 22.5726, lng: 88.3639, label: 'Kolkata' },
  howrah: { lat: 22.5958, lng: 88.2636, label: 'Howrah' },
  siliguri: { lat: 26.7271, lng: 88.3953, label: 'Siliguri' },
  darjeeling: { lat: 27.0410, lng: 88.2663, label: 'Darjeeling' },
  bhubaneswar: { lat: 20.2961, lng: 85.8245, label: 'Bhubaneswar' },
  puri: { lat: 19.8135, lng: 85.8312, label: 'Puri' },
  cuttack: { lat: 20.4625, lng: 85.8828, label: 'Cuttack' },
  patna: { lat: 25.5941, lng: 85.1376, label: 'Patna' },
  ranchi: { lat: 23.3441, lng: 85.3096, label: 'Ranchi' },
  jamshedpur: { lat: 22.8046, lng: 86.2029, label: 'Jamshedpur' },
  guwahati: { lat: 26.1445, lng: 91.7362, label: 'Guwahati' },
  shillong: { lat: 25.5788, lng: 91.8933, label: 'Shillong' }
};

/** Cities searched when a restaurant name isn't found near the user and no location was typed. */
export const MAJOR_SEARCH_HUBS: string[] = [
  'mumbai', 'thane', 'navi mumbai', 'pune', 'bengaluru', 'delhi', 'gurugram', 'noida',
  'hyderabad', 'chennai', 'kolkata', 'ahmedabad', 'jaipur', 'nashik', 'nagpur', 'aurangabad',
  'sambhajinagar', 'amritsar', 'ludhiana', 'chandigarh', 'punjab', 'goa',
  'lucknow', 'indore', 'surat', 'kochi', 'varanasi', 'agra',
  'bhopal', 'vadodara', 'visakhapatnam', 'patna', 'bhubaneswar', 'dehradun'
];

const DIRECTION_SUFFIX = /\s+(west|east|north|south|w|e)$/i;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function lookupGazetteer(text: string): { lat: number; lng: number; label: string } | null {
  const key = normalize(text);
  if (!key) return null;
  if (CITY_GAZETTEER[key]) return CITY_GAZETTEER[key];
  const noDir = key.replace(DIRECTION_SUFFIX, '');
  if (noDir !== key && CITY_GAZETTEER[noDir]) {
    const base = CITY_GAZETTEER[noDir];
    return { ...base, label: `${base.label} ${key.slice(noDir.length).trim().replace(/^w$/, 'west').replace(/^e$/, 'east')}` };
  }
  return null;
}

export function getHubCoordinates(hub: string): { lat: number; lng: number; label: string } | null {
  return CITY_GAZETTEER[hub] || null;
}

// ---------------------------------------------------------------------------
// Query parsing
// ---------------------------------------------------------------------------

/** Words that, alone, mean "any restaurant / eatery" (e.g. "restaurants in Thane", "street food in Delhi", "hotels in Jaipur"). */
const GENERIC_SEARCH_WORDS = new Set([
  'restaurant', 'restaurants', 'hotel', 'hotels', 'food', 'foods', 'eat', 'eatery', 'eateries',
  'place', 'places', 'spot', 'spots', 'best', 'top', 'good', 'famous', 'popular', 'nearby',
  'near', 'me', 'the', 'a', 'some', 'any', 'all', 'cafe', 'cafes', 'dhaba', 'dhabas', 'joint', 'joints',
  'street', 'streetfood', 'stall', 'stalls', 'tapri', 'thela', 'cart', 'bhojanalay', 'bhojanalaya',
  'canteen', 'kitchen', 'chaat', 'fastfood'
]);

export function isGenericSearch(nameQuery: string): boolean {
  const tokens = normalize(nameQuery).split(' ').filter(Boolean);
  return tokens.length === 0 || tokens.every(t => GENERIC_SEARCH_WORDS.has(t));
}

export interface ParsedLocationQuery {
  nameQuery: string;
  locationText: string | null;
  /** 'explicit' = typed with in/at/near/comma; 'trailing' = recognised city name at the end */
  via: 'explicit' | 'trailing' | null;
}

export function parseLocationFromQuery(raw: string): ParsedLocationQuery {
  const query = (raw || '').trim().replace(/\s+/g, ' ');
  if (!query) return { nameQuery: '', locationText: null, via: null };

  // 1. Standalone known city / locality: "Thane", "Mumbai", "Goa", "Delhi"
  if (lookupGazetteer(query)) {
    return { nameQuery: '', locationText: query, via: 'explicit' };
  }

  // 2. Explicit separators: "X in Y", "X at Y", "X near Y", "X @ Y"
  const sep = query.match(/^(.*?)\s+(?:in|at|near|around|@)\s+(.+)$/i);
  if (sep && sep[2].trim().length >= 3) {
    return { nameQuery: sep[1].trim(), locationText: sep[2].trim(), via: 'explicit' };
  }

  // 3. Comma form: "Name, Area" or "Name, Area, City"
  const commaIdx = query.indexOf(',');
  if (commaIdx > 0) {
    const name = query.slice(0, commaIdx).trim();
    const loc = query.slice(commaIdx + 1).replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    if (name && loc.length >= 3) return { nameQuery: name, locationText: loc, via: 'explicit' };
  }

  const tokens = query.split(' ');

  // 4. Leading known city / suburb: "Thane Shree Durga", "Goa Britto", "Mumbai Bademiya"
  if (tokens.length >= 2) {
    for (let take = Math.min(3, tokens.length - 1); take >= 1; take--) {
      const head = tokens.slice(0, take).join(' ');
      if (lookupGazetteer(head)) {
        const name = tokens.slice(take).join(' ').trim();
        if (name.length >= 2) {
          return { nameQuery: name, locationText: head, via: 'explicit' };
        }
      }
    }
  }

  // 5. Trailing known city / suburb: "Prashant Corner Thane", "Mamledar Misal Thane West"
  for (let take = Math.min(4, tokens.length); take >= 1; take--) {
    const tail = tokens.slice(tokens.length - take).join(' ');
    if (lookupGazetteer(tail)) {
      const name = tokens.slice(0, tokens.length - take).join(' ').trim();
      return { nameQuery: name, locationText: tail, via: 'trailing' };
    }
  }

  return { nameQuery: query, locationText: null, via: null };
}

// ---------------------------------------------------------------------------
// Geocoding (gazetteer -> Nominatim), cached
// ---------------------------------------------------------------------------
type GeoCacheEntry = { at: number; value: ResolvedLocation | null };
const geoStore = globalThis as unknown as { __locationGeoCache?: Map<string, GeoCacheEntry> };
const geoCache: Map<string, GeoCacheEntry> = (geoStore.__locationGeoCache ??= new Map());
const GEO_TTL_MS = 24 * 60 * 60 * 1000;
const GEO_NEGATIVE_TTL_MS = 30 * 60 * 1000;
const GEO_TIMEOUT_MS = 4500;

// Nominatim usage policy: max ~1 request/second per application
let lastNominatimCall = 0;
async function nominatimThrottle() {
  const wait = lastNominatimCall + 1100 - Date.now();
  lastNominatimCall = Math.max(Date.now(), lastNominatimCall + 1100);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
}

const AREA_TYPES = new Set([
  'suburb', 'neighbourhood', 'quarter', 'residential', 'road', 'street', 'locality',
  'hamlet', 'village', 'city_district', 'borough', 'commercial', 'retail', 'amenity'
]);

// Only genuine places may become a search location. Businesses/POIs (category 'amenity',
// 'shop', 'tourism', ...) are rejected so a dish word like "misal" never turns into a location.
const PLACE_CATEGORIES = new Set(['place', 'boundary', 'highway', 'railway', 'landuse']);

async function geocodeWithNominatim(
  text: string,
  bias?: { lat: number; lng: number } | null
): Promise<ResolvedLocation | null> {
  await nominatimThrottle();
  let url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&addressdetails=0` +
    `&q=${encodeURIComponent(text)}`;
  if (bias) {
    // Prefer matches near the user (e.g. "Shaniwar Peth" -> Pune) without excluding other cities
    url += `&viewbox=${bias.lng - 1},${bias.lat + 1},${bias.lng + 1},${bias.lat - 1}&bounded=0`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'BhookasurFoodTour/1.0 (restaurant search location lookup)',
        'Accept-Language': 'en'
      },
      signal: controller.signal,
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const hits = await res.json();
    const hit = Array.isArray(hits) ? hits[0] : null;
    if (!hit || !PLACE_CATEGORIES.has(String(hit.category || ''))) return null;
    const lat = parseFloat(hit?.lat);
    const lng = parseFloat(hit?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const type = String(hit?.addresstype || hit?.type || '');
    return {
      lat,
      lng,
      label: String(hit?.name || text),
      kind: AREA_TYPES.has(type) ? 'area' : 'city',
      source: 'nominatim'
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve a typed place ("Thane", "Naupada Thane", "FC Road Pune") to coordinates. */
export async function resolveLocation(
  text: string,
  bias?: { lat: number; lng: number } | null
): Promise<ResolvedLocation | null> {
  const key = normalize(text);
  if (key.length < 3) return null;

  const gaz = lookupGazetteer(key);
  if (gaz) return { ...gaz, kind: 'city', source: 'gazetteer' };

  // "Naupada Thane" / "FC Road Pune": anchor the area lookup to the typed city
  const tokens = key.split(' ');
  let anchorCity: { lat: number; lng: number; label: string } | null = null;
  for (let take = Math.min(3, tokens.length - 1); take >= 1 && !anchorCity; take--) {
    anchorCity = lookupGazetteer(tokens.slice(tokens.length - take).join(' '));
  }
  const effectiveBias = anchorCity || bias || null;

  const biasKey = effectiveBias ? `${effectiveBias.lat.toFixed(1)},${effectiveBias.lng.toFixed(1)}` : 'none';
  const cacheKey = `${key}|${biasKey}`;
  const hit = geoCache.get(cacheKey);
  if (hit && Date.now() - hit.at < (hit.value ? GEO_TTL_MS : GEO_NEGATIVE_TTL_MS)) return hit.value;

  let value = await geocodeWithNominatim(text, effectiveBias);
  if (anchorCity) {
    const farFromCity = value && distanceKm(value.lat, value.lng, anchorCity.lat, anchorCity.lng) > 40;
    if (!value || farFromCity) {
      value = { lat: anchorCity.lat, lng: anchorCity.lng, label: anchorCity.label, kind: 'city', source: 'gazetteer' };
    }
  }
  // Network failures are retried after a short negative TTL
  geoCache.set(cacheKey, { at: Date.now(), value });
  return value;
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCityFromCoords(lat: number, lng: number, maxRadiusKm = 50): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  let bestLabel: string | null = null;
  let minD = maxRadiusKm;
  for (const item of Object.values(CITY_GAZETTEER)) {
    const d = distanceKm(lat, lng, item.lat, item.lng);
    if (d < minD) {
      minD = d;
      bestLabel = item.label.split(',')[0].trim();
    }
  }
  return bestLabel;
}

/**
 * Resolves the most accurate coordinates for a restaurant using its name, area, and city,
 * avoiding generic ISP/localhost fallback coordinates (like 18.5211, 73.8502) and adding
 * a small deterministic micro-offset when falling back to a city/area center so different
 * restaurants never stack on the exact same pin coordinate.
 */
export function resolveBestCoordsForRestaurant(
  restaurantName: string,
  area?: string | null,
  city?: string | null,
  fallbackLat?: number | null,
  fallbackLng?: number | null
): { lat: number; lng: number; city?: string; area?: string } {
  const cleanName = (restaurantName || '').trim();
  const cleanArea = (area || '').trim();
  const cleanCity = (city || '').trim();

  // Deterministic micro-offset (-0.0065 to +0.0065 deg, ~300-700m) based on restaurant name
  let hash = 2166136261;
  const seedStr = `${cleanName.toLowerCase()}|${cleanArea.toLowerCase()}|${cleanCity.toLowerCase()}`;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const u1 = ((hash >>> 0) % 1000) / 1000;
  const u2 = (((hash >>> 10) ^ (hash >>> 20)) >>> 0) % 1000 / 1000;
  const dLat = (u1 - 0.5) * 0.011;
  const dLng = (u2 - 0.5) * 0.011;

  if (cleanArea) {
    const areaGaz = lookupGazetteer(cleanArea);
    if (areaGaz) {
      return {
        lat: Number((areaGaz.lat + dLat * 0.4).toFixed(6)),
        lng: Number((areaGaz.lng + dLng * 0.4).toFixed(6)),
        city: cleanCity || areaGaz.label.split(',').pop()?.trim(),
        area: cleanArea
      };
    }
  }

  const parenMatch = cleanName.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const parenGaz = lookupGazetteer(parenMatch[1]);
    if (parenGaz) {
      return {
        lat: Number((parenGaz.lat + dLat * 0.4).toFixed(6)),
        lng: Number((parenGaz.lng + dLng * 0.4).toFixed(6)),
        city: cleanCity || parenGaz.label.split(',').pop()?.trim(),
        area: parenMatch[1].trim()
      };
    }
  }

  const normName = normalize(cleanName);
  const nameTokens = normName.split(' ').filter(Boolean);
  for (let take = Math.min(3, nameTokens.length); take >= 1; take--) {
    const tail = nameTokens.slice(nameTokens.length - take).join(' ');
    const tailGaz = lookupGazetteer(tail);
    if (tailGaz) {
      return {
        lat: Number((tailGaz.lat + dLat * 0.4).toFixed(6)),
        lng: Number((tailGaz.lng + dLng * 0.4).toFixed(6)),
        city: cleanCity || tailGaz.label.split(',').pop()?.trim(),
        area: cleanArea || tail
      };
    }
  }

  const fLat = Number(fallbackLat);
  const fLng = Number(fallbackLng);
  const hasValidFallback = Number.isFinite(fLat) && Number.isFinite(fLng) && fLat >= 6 && fLat <= 37.5 && fLng >= 68 && fLng <= 97.5;
  const isGenericFallback =
    !hasValidFallback ||
    (Math.abs(fLat - 18.5211) < 0.001 && Math.abs(fLng - 73.8502) < 0.001) ||
    (Math.abs(fLat - 18.5204) < 0.001 && Math.abs(fLng - 73.8407) < 0.001) ||
    (Math.abs(fLat - 18.5204) < 0.001 && Math.abs(fLng - 73.8567) < 0.001) ||
    (Math.abs(fLat - 19.076) < 0.001 && Math.abs(fLng - 72.8777) < 0.001);

  const cityGaz = cleanCity ? lookupGazetteer(cleanCity) : null;
  if (cityGaz) {
    const farFromCity = !hasValidFallback || distanceKm(fLat, fLng, cityGaz.lat, cityGaz.lng) > 30;
    if (isGenericFallback || farFromCity) {
      return {
        lat: Number((cityGaz.lat + dLat).toFixed(6)),
        lng: Number((cityGaz.lng + dLng).toFixed(6)),
        city: cleanCity,
        area: cleanArea
      };
    }
  }

  if (hasValidFallback) {
    if (isGenericFallback) {
      return {
        lat: Number((fLat + dLat).toFixed(6)),
        lng: Number((fLng + dLng).toFixed(6)),
        city: cleanCity || 'Pune',
        area: cleanArea
      };
    }
    return {
      lat: fLat,
      lng: fLng,
      city: cleanCity || findNearestCityFromCoords(fLat, fLng) || 'Pune',
      area: cleanArea
    };
  }

  return {
    lat: Number((18.5204 + dLat).toFixed(6)),
    lng: Number((73.8567 + dLng).toFixed(6)),
    city: cleanCity || 'Pune',
    area: cleanArea
  };

}

