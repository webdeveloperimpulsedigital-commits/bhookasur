export interface AreaInfo {
  id: string;
  name: string;
  displayName: string;
  city: string;
  latitude: number;
  longitude: number;
  popularSpotsCount: number;
  popularLandmarks: string[];
  description: string;
  distanceKm?: number;
}

export const PUNE_AREAS: AreaInfo[] = [
  {
    id: "nanded_phata",
    name: "Nanded Phata",
    displayName: "Nanded Phata / Nanded City",
    city: "Pune",
    latitude: 18.4550,
    longitude: 73.8010,
    popularSpotsCount: 6,
    popularLandmarks: ["Nanded City Destination Center", "Sinhagad Road Toll Naka", "Hotel Jagdamb", "Dhayari Phata"],
    description: "South-West Pune food corridor famous for spicy Gavran chicken, mutton thalis & misal joints"
  },
  {
    id: "sinhagad_road",
    name: "Sinhagad Road",
    displayName: "Sinhagad Road / Vadgaon Budruk",
    city: "Pune",
    latitude: 18.4720,
    longitude: 73.8200,
    popularSpotsCount: 7,
    popularLandmarks: ["Vadgaon Chowk", "Anand Nagar", "Pu La Deshpande Garden", "Manik Baug"],
    description: "Bustling food street famous for authentic Maharashtrian thalis, street bhel & family restaurants"
  },
  {
    id: "dhayari_narhe",
    name: "Dhayari & Narhe",
    displayName: "Dhayari / Narhe / Ambegaon",
    city: "Pune",
    latitude: 18.4480,
    longitude: 73.8150,
    popularSpotsCount: 5,
    popularLandmarks: ["Dhayari Gaon", "Navale Bridge", "JSPM Narhe"],
    description: "Thriving residential neighborhood with spicy Kolhapuri misal, dhabas & snacks"
  },
  {
    id: "warje_karve",
    name: "Warje & Karve Nagar",
    displayName: "Warje / Karve Nagar",
    city: "Pune",
    latitude: 18.4830,
    longitude: 73.8030,
    popularSpotsCount: 6,
    popularLandmarks: ["Warje Flyover", "Cummins College Road", "Shivraj Hotel", "Kakade City"],
    description: "Popular youth & family hub known for Raavan Thali, coastal seafood & street food"
  },
  {
    id: "kothrud",
    name: "Kothrud",
    displayName: "Kothrud / Karve Road / Paud Road",
    city: "Pune",
    latitude: 18.5074,
    longitude: 73.8077,
    popularSpotsCount: 8,
    popularLandmarks: ["Bipin Snacks", "Katta Cafe", "Joshi Wadewale", "Vanaz Corner", "MIT College"],
    description: "Thriving food paradise with iconic Maharashtrian street snacks, thalipeeth & misal"
  },
  {
    id: "narayan_peth",
    name: "Narayan Peth",
    displayName: "Narayan Peth / Appa Balwant Chowk",
    city: "Pune",
    latitude: 18.5170,
    longitude: 73.8520,
    popularSpotsCount: 7,
    popularLandmarks: ["Bedekar Tea Stall (Misal)", "Appa Balwant Chowk", "Laxmi Road", "Kelkar Museum"],
    description: "Historic heart of Pune famous for authentic Puneri spicy Misal, snacks & traditional thalis"
  },
  {
    id: "shukrawar_peth",
    name: "Shukrawar Peth",
    displayName: "Shukrawar Peth / Subhash Nagar",
    city: "Pune",
    latitude: 18.5085,
    longitude: 73.8560,
    popularSpotsCount: 6,
    popularLandmarks: ["Tilak Road Food Market", "Baji Rao Road Sweets", "Subhash Nagar"],
    description: "Vibrant traditional marketplace famous for Tilak Misal, sweet marts & street chaupati"
  },
  {
    id: "fc_road",
    name: "FC Road",
    displayName: "FC Road, Shivajinagar",
    city: "Pune",
    latitude: 18.5204,
    longitude: 73.8407,
    popularSpotsCount: 9,
    popularLandmarks: ["Vaishali", "Wadeshwar", "Roopali", "Fergusson College"],
    description: "Iconic student & food street with legendary South Indian tiffins, dosas & cafes"
  },
  {
    id: "deccan",
    name: "Deccan Gymkhana",
    displayName: "Deccan Gymkhana, FC Road",
    city: "Pune",
    latitude: 18.5167,
    longitude: 73.8415,
    popularSpotsCount: 7,
    popularLandmarks: ["Cafe Goodluck", "Chitale Bandhu", "Deccan Corner", "Z-Bridge"],
    description: "Heart of Pune's culinary heritage, Irani chai, bun maska & keema"
  },
  {
    id: "sadashiv_peth",
    name: "Sadashiv Peth",
    displayName: "Sadashiv Peth, Tilak Road",
    city: "Pune",
    latitude: 18.5123,
    longitude: 73.8530,
    popularSpotsCount: 6,
    popularLandmarks: ["Sujata Mastani", "SPDP Spots", "Tilak Road Khau Galli", "Poona Guest House"],
    description: "Traditional Puneri food hub famous for original Sujata Mastani thick shakes & SPDP"
  },
  {
    id: "camp",
    name: "Camp / MG Road",
    displayName: "Camp, East Street / MG Road",
    city: "Pune",
    latitude: 18.5140,
    longitude: 73.8760,
    popularSpotsCount: 8,
    popularLandmarks: ["Kayani Bakery", "George Restaurant", "Marz-O-Rin", "Blue Nile"],
    description: "Colonial-era food district famous for Shrewsbury biscuits, biryani & parsi bakes"
  },
  {
    id: "koregaon_park",
    name: "Koregaon Park (KP)",
    displayName: "Koregaon Park, North Main Road",
    city: "Pune",
    latitude: 18.5362,
    longitude: 73.8940,
    popularSpotsCount: 8,
    popularLandmarks: ["German Bakery", "Malaka Spice", "Osho Lane Cafes", "Effingut"],
    description: "Trendy cosmopolitan enclave with artisanal cafes, bakeries & world cuisine"
  },
  {
    id: "viman_nagar",
    name: "Viman Nagar",
    displayName: "Viman Nagar, Datta Mandir Chowk",
    city: "Pune",
    latitude: 18.5679,
    longitude: 73.9143,
    popularSpotsCount: 7,
    popularLandmarks: ["Irani Cafe", "Cafe Peter", "Phoenix Marketcity Hub"],
    description: "Vibrant modern youth hub with fusion bistros, street food & Irani cafes"
  },
  {
    id: "baner",
    name: "Baner & Balewadi",
    displayName: "Baner / Balewadi High Street",
    city: "Pune",
    latitude: 18.5590,
    longitude: 73.7868,
    popularSpotsCount: 7,
    popularLandmarks: ["The Urban Foundry", "Balewadi High Street", "Bavdhan Corner"],
    description: "Bustling nightlife & gourmet dining strip with global eateries & microbreweries"
  },
  {
    id: "aundh",
    name: "Aundh",
    displayName: "Aundh / DP Road",
    city: "Pune",
    latitude: 18.5580,
    longitude: 73.8070,
    popularSpotsCount: 5,
    popularLandmarks: ["DP Road Khau Galli", "Westend Mall Hub", "Bremen Chowk"],
    description: "Cosmopolitan food strip with bakeries, North Indian dhabas & South Indian tiffins"
  },
  {
    id: "swargate",
    name: "Swargate & Sarasbaug",
    displayName: "Swargate / Sarasbaug Chaupati",
    city: "Pune",
    latitude: 18.5018,
    longitude: 73.8586,
    popularSpotsCount: 6,
    popularLandmarks: ["Sarasbaug Chaupati Bhel", "Peshwe Park Pav Bhaji", "Swargate Chowk"],
    description: "Classic street chaupati famous for SPDP, Bhelpuri, Kulfi & Pav Bhaji"
  },
  {
    id: "katraj",
    name: "Katraj & Bibwewadi",
    displayName: "Katraj / Bibwewadi",
    city: "Pune",
    latitude: 18.4575,
    longitude: 73.8677,
    popularSpotsCount: 6,
    popularLandmarks: ["Katraj Dairy", "Katakirr Misal Katraj", "ISCKON Chowk"],
    description: "Famous for Katraj special thick shakes, fiery spicy Kolhapuri Misal & dhabas"
  },
  {
    id: "hinjawadi_wakad",
    name: "Hinjawadi & Wakad",
    displayName: "Hinjawadi / Wakad",
    city: "Pune",
    latitude: 18.5913,
    longitude: 73.7389,
    popularSpotsCount: 6,
    popularLandmarks: ["Hinjawadi Phase 1", "Wakad Dutta Mandir", "Bhujbal Chowk", "Mezza9"],
    description: "IT corridor bustling with late-night food trucks, spicy dhabas & biryani joints"
  },
  {
    id: "hadapsar",
    name: "Hadapsar & Magarpatta",
    displayName: "Hadapsar / Magarpatta City",
    city: "Pune",
    latitude: 18.5089,
    longitude: 73.9260,
    popularSpotsCount: 5,
    popularLandmarks: ["Magarpatta Destination Center", "Seasons Mall Food Court", "Gadital"],
    description: "Eastern IT & family hub with grand biryani centers, multicuisine bistros & street bites"
  }
];

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
