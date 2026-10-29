import mysql from 'mysql2/promise';
import { verifySwiggyRestaurant } from './verifiedRestaurants';
import { formatCleanDishName, isPureVegRestaurantName } from './dishAssets';
import { resolveBestCoordsForRestaurant } from './locationResolver';

// Types
export interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  rating: number;
  image: string;
  is_campaign_active: number;
  total_visits: number;
  status: 'active' | 'inactive';
  is_veg?: number;
  distanceKm?: number;
  created_at?: string;
  cuisine_tags?: string[];
  updated_at?: string;
  // Verification metadata (strict verified mode)
  swiggy_id?: string | null;
  zomato_id?: string | null;
  zomato_url?: string | null;
  is_verified?: number;
  verification_source?: string | null;
  fssai_license?: string | null;
  verified_at?: string | null;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  hindiName?: string;
  icon?: string;
  signatureImage?: string;
}

export interface RestaurantMenu {
  id: number;
  restaurant_id: number;
  name: string;
  is_active: number;
  dishes?: Dish[];
}

export interface Dish {
  id: number;
  restaurant_id: number;
  menu_id?: number;
  category_id?: number;
  category?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  flying_image?: string;
  rating: number;
  popularity: number;
  is_recommended: number;
  is_veg?: number;
  is_bestseller?: boolean;
  rating_count?: number | string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface BakasurVideo {
  id: number;
  restaurant_id: number | null;
  dish_id: number | null;
  stage: string; // 'intro' | 'stage_1' | 'stage_2' | 'stage_3' | 'acidity' | 'generic'
  stage_number: number;
  video_url: string;
  thumbnail: string | null;
  duration: number;
  meter_percentage: number;
  message: string;
  cta_text: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CampaignSession {
  id: number;
  session_id: string;
  user_id?: string | null;
  user_location: string | null;
  latitude: number | null;
  longitude: number | null;
  restaurant_id: number | null;
  dish_id: number | null;
  current_stage: string;
  current_step?: string;
  step_count?: number;
  food_meter_percentage: number;
  aur_khilo_clicks: number;
  video_completed: number;
  map_visited: number;
  form_submitted: number;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignVisit {
  id: number;
  session_id: string;
  user_id?: string;
  restaurant_id: number;
  restaurant_name?: string;
  dish_id: number | null;
  dish_name?: string;
  city: string;
  latitude: number;
  longitude: number;
  visited_at: string;
  round_number?: number;
}

export interface Participant {
  id: number;
  session_id: string;
  participation_id: string;
  name: string;
  mobile: string;
  email: string;
  city: string;
  restaurant_id?: number | null;
  restaurant_name?: string;
  dish_id?: number | null;
  dish_name?: string;
  consent: number;
  terms_accepted: number;
  created_at: string;
}

export interface UserJourneyStep {
  id: number;
  session_id: string;
  step_number: number;
  step_name: string;
  step_title?: string;
  metadata?: Record<string, unknown> | null;
  user_location?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}


// Initial Sample Seed Data (5 Restaurants per city, 5 Dishes per restaurant)
export const INITIAL_RESTAURANTS: Omit<Restaurant, 'id'>[] = [
  // Pune (1-18)
  { name: "Hotel Jagdamb", description: "Sinhagad Road & Nanded Phata's legendary non-veg paradise famous for authentic spicy Gavran chicken handi, mutton thali, and Tambda-Pandhra rassa.", address: "Near Toll Naka, Sinhagad Road, Nanded Phata", area: "Nanded Phata", city: "Pune", latitude: 18.4550, longitude: 73.8010, rating: 4.8, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Girija Pure Veg & Bhel", description: "Sinhagad Road's iconic family dining hub celebrated for special Matki Bhel, SPDP, authentic Maharashtrian thalis, and pav bhaji.", address: "Anand Nagar, Sinhagad Road", area: "Sinhagad Road", city: "Pune", latitude: 18.4720, longitude: 73.8200, rating: 4.7, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Ankur Veg", description: "Sinhagad Road & Hingne landmark famous for pure veg Punjabi delicacies, crispy dosas, and special Pav Bhaji.", address: "Sinhagad Road, Hingne Khurd, Pune", area: "Sinhagad Road", city: "Pune", latitude: 18.4720, longitude: 73.8210, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Hotel Jagdamb", description: "Legendary non-veg feast paradise famous for special mutton thali, gavran chicken handi, and unlimited rassa.", address: "Pune-Bangalore Highway, Khed Shivapur", area: "Khed Shivapur", city: "Pune", latitude: 18.3560, longitude: 73.8560, rating: 4.9, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Hotel Abhiruchi", description: "Sinhagad Road landmark near Vadgaon bridge famous for rich North Indian curries, spicy Kolhapuri handi, and tandoor.", address: "Near Abhiruchi Mall, Sinhagad Road, Vadgaon", area: "Sinhagad Road", city: "Pune", latitude: 18.4680, longitude: 73.8150, rating: 4.7, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Saraswati Misal & Snacks", description: "Dhayari & Nanded Phata landmark serving fiery Kolhapuri rassa misal with crispy farsan, onion, and fresh toasted pav.", address: "Dhayari Phata, Nanded Phata Corner", area: "Nanded Phata", city: "Pune", latitude: 18.4530, longitude: 73.8040, rating: 4.8, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Bipin Snacks & Katta", description: "Kothrud's beloved breakfast institution famous for traditional Thalipeeth with white butter, Sabudana Vada, and Kothimbir Vadi.", address: "Karve Road, Kothrud Stand", area: "Kothrud", city: "Pune", latitude: 18.5074, longitude: 73.8077, rating: 4.8, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Katta Cafe", description: "Kothrud youth hotspot famous for thick creamy Cold Coffee, Cheese Grill Sandwiches, and loaded spicy Maggi.", address: "Near MIT College, Paud Road, Kothrud", area: "Kothrud", city: "Pune", latitude: 18.5050, longitude: 73.8090, rating: 4.7, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Bedekar Tea Stall", description: "Narayan Peth's historic 1948 heritage eatery renowned for authentic Puneri spicy Misal served with bread slices and fresh Poha Laddoo.", address: "418, Narayan Peth, Munjabacha Bol", area: "Narayan Peth", city: "Pune", latitude: 18.5170, longitude: 73.8520, rating: 4.8, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Tilak Hotel", description: "Shukrawar Peth & Tilak Road classic destination famous for spicy Puneri Misal Pav, crispy Batata Vadas, and ginger tea.", address: "Tilak Road, Shukrawar Peth", area: "Shukrawar Peth", city: "Pune", latitude: 18.5085, longitude: 73.8560, rating: 4.7, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Hotel Panchali", description: "Jangali Maharaj Road's iconic multi-cuisine family landmark near Balgandharva, famous for authentic Maharashtrian thalis, Punjabi curries, Biryani, and sizzlers.", address: "1222/4, Jangali Maharaj Road, Shivajinagar", area: "Jangali Maharaj Road", city: "Pune", latitude: 18.5245, longitude: 73.8485, rating: 4.8, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Hotel Roopali", description: "Iconic FC Road garden restaurant serving legendary butter set dosas, crispy veg cutlets, and aromatic South Indian filter coffee since 1953.", address: "FC Road, Shivajinagar", area: "FC Road", city: "Pune", latitude: 18.5215, longitude: 73.8402, rating: 4.8, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Vaishali Restaurant", description: "Legendary South Indian haven famous for iconic dosas, filter coffee, and vibrant Pune food culture since 1971.", address: "1218/1, FC Road, Shivajinagar", area: "FC Road", city: "Pune", latitude: 18.5204, longitude: 73.8407, rating: 4.8, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Cafe Goodluck", description: "Iconic Irani cafe serving buttery bun maska, double egg keema, and aromatic Irani chai since 1935.", address: "Deccan Gymkhana, FC Road", area: "Deccan", city: "Pune", latitude: 18.5167, longitude: 73.8415, rating: 4.7, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Sujata Mastani", description: "Pune's original ice-cream thick shake destination since 1953, famous for rich Mango & Dryfruit Mastani.", address: "Sadashiv Peth, Laxmi Road", area: "Sadashiv Peth", city: "Pune", latitude: 18.5123, longitude: 73.8530, rating: 4.9, image: "/images/food/mango_mastani.jpg", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Poona Guest House", description: "Historic 1935 Maharashtrian cultural thali pioneer in Sadashiv Peth serving Puran Poli, Ukdiche Modak & traditional delicacies.", address: "100 Laxmi Road, Sadashiv Peth", area: "Sadashiv Peth", city: "Pune", latitude: 18.5140, longitude: 73.8540, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "George Restaurant", description: "Camp's legendary Mughlai & tandoor hub famous for aromatic mutton biryani, butter chicken, and seekh kebabs.", address: "2436, East Street, Camp", area: "Camp", city: "Pune", latitude: 18.5140, longitude: 73.8760, rating: 4.6, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Kayani Bakery & Cafe", description: "World-famous Parsi bakery celebrating century-old recipes of Shrewsbury biscuits & mawa cakes.", address: "6, East Street, Camp", area: "Camp", city: "Pune", latitude: 18.5155, longitude: 73.8772, rating: 4.8, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "German Bakery", description: "Koregaon Park's cultural icon serving artisanal baked goods, apple strudel, keema pav, and signature teas.", address: "292 North Main Road, Koregaon Park", area: "Koregaon Park", city: "Pune", latitude: 18.5362, longitude: 73.8940, rating: 4.7, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Irani Cafe", description: "Viman Nagar's bustling youth cafe famous for Bun Maska, Keema Ghotala, and authentic Irani Chai.", address: "Datta Mandir Chowk, Viman Nagar", area: "Viman Nagar", city: "Pune", latitude: 18.5679, longitude: 73.9143, rating: 4.7, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "The Urban Foundry", description: "Balewadi High Street favorite combining industrial chic ambiance with creative Indian fusion bar bites & tandoor.", address: "Balewadi High Street, Baner", area: "Baner", city: "Pune", latitude: 18.5590, longitude: 73.7868, rating: 4.8, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Shivraj Hotel", description: "Warje & Karve Nagar hotspot world-famous for massive Raavan Thali, Bullet Thali, and spicy Kolhapuri mutton.", address: "Warje Flyover, Sinhagad Road Extension", area: "Warje & Karve Nagar", city: "Pune", latitude: 18.4830, longitude: 73.8030, rating: 4.8, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Wadeshwar", description: "FC Road & Law College Road landmark renowned for crispy butter Ghee Pudi Dosa, Molgapodi Idli, and filter coffee.", address: "FC Road & Law College Road", area: "FC Road", city: "Pune", latitude: 18.5220, longitude: 73.8400, rating: 4.8, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Durvankur Dining Hall", description: "Tilak Road's legendary unlimited Maharashtrian feast featuring Puran Poli, spiced Amti, and Ukdiche Modak.", address: "Tilak Road, Sadashiv Peth", area: "Sadashiv Peth", city: "Pune", latitude: 18.5080, longitude: 73.8540, rating: 4.9, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Phadke Dining Hall", description: "Sadashiv Peth's historic 1930s Maharashtrian khanawal celebrated for authentic unlimited home-style thali, Puran Poli, Masale Bhaat, and Aamti.", address: "1785, Khajina Vihir Chowk, Krantiveer Vasudev Phadke Path, Sadashiv Peth", area: "Sadashiv Peth", city: "Pune", latitude: 18.5086, longitude: 73.8513, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Badshahi Boarding House", description: "Sadashiv Peth's heritage 1934 boarding house serving authentic homely Maharashtrian vegetarian meals, Puran Poli, and Varan Bhaat.", address: "Tilak Road, Sadashiv Peth", area: "Sadashiv Peth", city: "Pune", latitude: 18.5090, longitude: 73.8530, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Shreyas Dining Hall", description: "Apte Road's heritage Maharashtrian cultural thali hub famous for delicate Kadhi, Puri Bhaji, and Aamras in season.", address: "Apte Road, Deccan Gymkhana", area: "Deccan", city: "Pune", latitude: 18.5195, longitude: 73.8430, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Sukanta Thali", description: "Deccan Gymkhana's royal vegetarian thali destination famous for 25+ unlimited Rajasthani & Gujarati delicacies.", address: "Near Z-Bridge, Deccan Gymkhana", area: "Deccan", city: "Pune", latitude: 18.5175, longitude: 73.8420, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Hotel Nisarg Seafood", description: "Nal Stop & Karve Road's ultimate coastal seafood destination famous for Surmai Fry, Crab Masala, and fresh Solkadhi.", address: "Karve Road, Near Nal Stop", area: "Kothrud", city: "Pune", latitude: 18.5070, longitude: 73.8290, rating: 4.9, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "SP's Biryani House", description: "Tilak Road's beloved non-veg legend famous for authentic Sajuk Tupatli Dum Biryani and spicy mutton rassa.", address: "1472, Sadashiv Peth, Tilak Road", area: "Sadashiv Peth", city: "Pune", latitude: 18.5078, longitude: 73.8525, rating: 4.8, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Durga Cafe", description: "Paud Road & MIT Kothrud's youth sensation world-famous for thick cold coffee and spicy egg bhurji pav.", address: "Paud Road, Near MIT College, Kothrud", area: "Kothrud", city: "Pune", latitude: 18.5060, longitude: 73.8110, rating: 4.7, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Blue Nile Restaurant", description: "Camp & Bund Garden landmark renowned for classic Irani Mutton Dum Biryani, Chelo Kebab, and Tandoori chicken.", address: "4 Bund Garden Road, Camp", area: "Camp", city: "Pune", latitude: 18.5280, longitude: 73.8740, rating: 4.7, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Marz-O-Rin", description: "MG Road Camp's 1965 heritage bakery famous for shredded chicken sandwiches, apple juice, and macaroni bake.", address: "Bakthiar Plaza, 6 MG Road, Camp", area: "Camp", city: "Pune", latitude: 18.5170, longitude: 73.8780, rating: 4.8, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Burger (King Burger)", description: "East Street Camp's cult burger haven famous for massive King Burgers, Crispy Fries, and iced tea.", address: "East Street, Camp", area: "Camp", city: "Pune", latitude: 18.5145, longitude: 73.8765, rating: 4.8, image: "/images/food/zinger_burger.jpg", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Dorabjee & Sons", description: "Historic 1878 Parsi culinary treasure in Camp serving Dhansak, Patra Ni Machhi, and Mutton Cutlets.", address: "Dastur Meher Road, Camp", area: "Camp", city: "Pune", latitude: 18.5150, longitude: 73.8750, rating: 4.7, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Le Plaisir", description: "Prabhat Road & Deccan's celebrated bistro famous for artisanal desserts, macaroons, crepe suzette, and roast chicken.", address: "Prabhat Road, Deccan", area: "Deccan", city: "Pune", latitude: 18.5120, longitude: 73.8390, rating: 4.9, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Malaka Spice", description: "Koregaon Park's premier Southeast Asian eatery famous for spicy Thai curry, Vietnamese rolls, and top crafts.", address: "Lane 5, North Main Road, Koregaon Park", area: "Koregaon Park", city: "Pune", latitude: 18.5380, longitude: 73.8960, rating: 4.8, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Shabree Maharashtrian Restaurant", description: "FC Road's authentic Maharashtrian dine-in famous for Pithla Bhakri, Bharli Vangi, and sweet Gulab Jamun.", address: "FC Road, Shivajinagar", area: "FC Road", city: "Pune", latitude: 18.5208, longitude: 73.8405, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Chaitanya Paranthas", description: "FC Road's North Indian hotspot famous for 40+ varieties of giant stuffed butter parathas and dal makhani.", address: "FC Road, Shivajinagar", area: "FC Road", city: "Pune", latitude: 18.5225, longitude: 73.8398, rating: 4.7, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Visava Pure Veg Family Restaurant", description: "Sinhagad Road family favorite known for delicious Punjabi paneer handi, butter naan, and crispy starters.", address: "Near Pu La Deshpande Garden, Sinhagad Road", area: "Sinhagad Road", city: "Pune", latitude: 18.4820, longitude: 73.8310, rating: 4.7, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Greens Pure Veg", description: "Aundh landmark popular for multi-cuisine Indian, North Indian, tandoori starters, and signature sizzling brownies.", address: "ITI Road, Aundh", area: "Aundh", city: "Pune", latitude: 18.5580, longitude: 73.8050, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Tiranga Bhuvan Non-Veg", description: "Swargate & Paud Road iconic spice hub famous for spicy Dum Biryani, Gavran chicken, and Aalni soup.", address: "Paud Road / Swargate Corner", area: "Swargate", city: "Pune", latitude: 18.5025, longitude: 73.8570, rating: 4.8, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Hotel Sonali Non-Veg", description: "Hadapsar & Magarpatta meat lover's destination famous for Kolhapuri chicken handi and crisp bajra bhakri.", address: "Pune-Solapur Road, Hadapsar", area: "Hadapsar", city: "Pune", latitude: 18.5020, longitude: 73.9280, rating: 4.7, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Mezza9 Family Restaurant", description: "Hinjewadi IT hub's top dining destination for North Indian curries, kebabs, and live sizzlers.", address: "Hinjewadi Phase 1, Near Infosys", area: "Hinjewadi", city: "Pune", latitude: 18.5910, longitude: 73.7380, rating: 4.8, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Chitale Bandhu Mithaiwale", description: "Historic 1950 Bajirao Road institution world-famous for crunchy Bakarwadi, Mango Barfi, and Shrikhand.", address: "777, Sadashiv Peth, Bajirao Road", area: "Sadashiv Peth", city: "Pune", latitude: 18.5135, longitude: 73.8535, rating: 4.9, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Joshi Wadewale", description: "Pune's legendary 1989 Maharashtrian pure-veg snack landmark in Shaniwar Peth famous for piping hot Vada Pav, Misal Pav, and Kothimbir Vadi.", address: "Near Shaniwar Wada, Appa Balwant Chowk, Shaniwar Peth", area: "Shaniwar Peth", city: "Pune", latitude: 18.5195, longitude: 73.8553, rating: 4.9, image: "/images/food/vada_pav.jpg", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Rohit Wadewale", description: "Pune's beloved pure-veg snack chain celebrated for Classic Vada Pav, Ulta Vada Pav, Cheese Vada Pav, and Misal Pav.", address: "Near Alka Talkies, Sadashiv Peth / Deccan", area: "Sadashiv Peth", city: "Pune", latitude: 18.5145, longitude: 73.8495, rating: 4.8, image: "/images/food/vada_pav.jpg", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },


  // Thane & Mumbai Metropolitan Area
  { name: "Gajanan Vadapav", description: "Thane's world-famous 1978 legendary institution celebrated for hot crispy Batata Vada served with signature yellow besan chutney & fried chillies.", address: "Chhatrapati Shivaji Path, Naupada, Thane West", area: "Naupada", city: "Thane", latitude: 19.1860, longitude: 72.9750, rating: 4.9, image: "/api/ai/dish-image?dish=Vada%20Pav", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Mamledar Misal", description: "Thane's iconic spicy Misal landmark at Zilla Parishad since 1946, famous for fiery tarri misal, crispy farsan, and cold chaas.", address: "Opposite Zilla Parishad, Naupada, Thane West", area: "Naupada", city: "Thane", latitude: 19.1870, longitude: 72.9760, rating: 4.8, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Prashant Corner", description: "Thane's celebrated heritage sweets and snack destination famous for special Puran Poli, Kaju Katli, and savory chaat.", address: "Mahavir Millenium, Panch Pakhadi, Thane West", area: "Panch Pakhadi", city: "Thane", latitude: 19.1920, longitude: 72.9680, rating: 4.9, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Hitchki Thane", description: "Viviana Mall's premier resto-bar known for Bollywood nostalgia, creative fusion dishes, and vibrant nightlife.", address: "Viviana Mall, Eastern Express Highway, Thane West", area: "Thane West", city: "Thane", latitude: 19.2080, longitude: 72.9720, rating: 4.8, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Hotel Panchali", description: "Thane West station road favorite known for authentic Maharashtrian, North Indian, and coastal seafood curries.", address: "Gokhale Road, Naupada, Thane West", area: "Naupada", city: "Thane", latitude: 19.1850, longitude: 72.9740, rating: 4.7, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },

  // Mumbai (19-23)
  { name: "Leopold Cafe & Bar", description: "Historic Mumbai landmark serving hearty Iranian, Continental, and Indian bites with vibrant heritage energy.", address: "Colaba Causeway, Apollo Bandar", area: "Colaba", city: "Mumbai", latitude: 18.9222, longitude: 72.8317, rating: 4.6, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Bademiya Street Kebabs", description: "Colaba's legendary late-night charcoal tandoor destination famous for spicy Baida Roti and juicy Seekh Rolls.", address: "Tulloch Road, Behind Taj Hotel, Colaba", area: "Colaba", city: "Mumbai", latitude: 18.9215, longitude: 72.8322, rating: 4.7, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Sardar Refreshments", description: "Mumbai's butter king serving legendary Pav Bhaji with floating slabs of pure Amul butter.", address: "166, Tardeo Road, Junction, Tardeo", area: "Tardeo", city: "Mumbai", latitude: 18.9680, longitude: 72.8150, rating: 4.8, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Kyani & Co. Irani Cafe", description: "Historic 119-year-old Irani bakery serving classic Keema Pav, Bun Maska, and Caramel Custard.", address: "Jer Mahal Estate, Marine Lines", area: "Marine Lines", city: "Mumbai", latitude: 18.9440, longitude: 72.8280, rating: 4.6, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Gurukripa", description: "Sion's legendary 1975 landmark famous for golden crispy Samosas, Chole Bhature, Dahi Samosa, and Gulab Jamun.", address: "40, Guru Kripa Building, Road 24, Sion West", area: "Sion", city: "Mumbai", latitude: 19.0430, longitude: 72.8630, rating: 4.9, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Anand Stall & Dosa", description: "Vile Parle street food icon famous for Cheese Burst Vada Pav, Jinny Dosa, and Schezwan rolls.", address: "Opposite Mithibai College, Vile Parle West", area: "Vile Parle", city: "Mumbai", latitude: 19.1025, longitude: 72.8375, rating: 4.7, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },

  // Delhi (24-28)
  { name: "Karim's Historic Mughlai", description: "Centuries of royal Mughlai legacy serving royal kebabs, rich mutton korma, and heavenly biryanis near Jama Masjid.", address: "16, Gali Kababian, Jama Masjid", area: "Old Delhi", city: "Delhi", latitude: 28.6507, longitude: 77.2334, rating: 4.7, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Aslam Butter Chicken", description: "Old Delhi's butter mountain sensation where tandoori chicken is bathed in melted butter and curd.", address: "540, Matia Mahal Road, Jama Masjid", area: "Jama Masjid", city: "Delhi", latitude: 28.6515, longitude: 77.2340, rating: 4.8, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Leopold Cafe & Bar", description: "Colaba's iconic 1871 heritage multi-cuisine cafe famous for spicy keema pav and roast chicken.", address: "Shahid Bhagat Singh Road, Colaba Causeway", area: "Colaba", city: "Mumbai", latitude: 18.9220, longitude: 72.8310, rating: 4.7, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Bademiya", description: "Mumbai's legendary late-night charcoal kebab destination behind Taj Hotel serving melt-in-mouth rolls.", address: "Tulloch Road, Apollo Bunder, Colaba", area: "Colaba", city: "Mumbai", latitude: 18.9215, longitude: 72.8330, rating: 4.8, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Sardar Refreshments", description: "Mumbai's butter king serving legendary Pav Bhaji with floating slabs of pure Amul butter.", address: "166, Tardeo Road, Junction, Tardeo", area: "Tardeo", city: "Mumbai", latitude: 18.9680, longitude: 72.8150, rating: 4.8, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Kyani & Co.", description: "Marine Lines 1904 oldest operating Irani bakery famous for bun maska, mawa cake, and keema ghotala.", address: "Jermahal Estate, 657, JSS Road, Marine Lines", area: "Marine Lines", city: "Mumbai", latitude: 18.9430, longitude: 72.8270, rating: 4.7, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Anand Stall", description: "Vile Parle street sensation opposite Mithibai College famous for Cheese Burst Vada Pav & Dosa.", address: "Gulmohar Cross Road 9, Vile Parle West", area: "Vile Parle", city: "Mumbai", latitude: 19.1030, longitude: 72.8370, rating: 4.8, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Karim's Old Delhi", description: "Historic 1913 Mughal royal culinary institution near Jama Masjid world-famous for Mutton Burra and Nihari.", address: "16, Gali Kababian, Jama Masjid", area: "Jama Masjid", city: "Delhi", latitude: 28.6507, longitude: 77.2334, rating: 4.9, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Aslam Butter Chicken", description: "Jama Masjid's viral wonder serving tandoori roasted chicken submerged in creamy molten spiced butter.", address: "Matia Mahal Road, Jama Masjid", area: "Jama Masjid", city: "Delhi", latitude: 28.6515, longitude: 77.2340, rating: 4.8, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Sita Ram Diwan Chand", description: "Paharganj's 1950 legend serving world-famous crispy paneer-stuffed Chole Bhature with tangy pickle.", address: "2243, Rajguru Marg, Chuna Mandi, Paharganj", area: "Paharganj", city: "Delhi", latitude: 28.6430, longitude: 77.2140, rating: 4.9, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Gulati Restaurant", description: "Pandara Road's elite dining establishment legendary for rich Butter Chicken and Creamy Dal Makhani.", address: "6, Pandara Road Market", area: "Pandara Road", city: "Delhi", latitude: 28.6065, longitude: 77.2365, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Al Jawahar", description: "Jama Masjid's beloved heritage kitchen celebrated for rich Mutton Korma, Mutton Nihari, and Sheermal.", address: "Opposite Gate 1, Jama Masjid", area: "Jama Masjid", city: "Delhi", latitude: 28.6508, longitude: 77.2330, rating: 4.8, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Vidyarthi Bhavan", description: "Gandhi Bazaar 1943 heritage institution famous for thick crispy golden Butter Masala Dosa.", address: "32, Gandhi Bazaar Main Road, Basavanagudi", area: "Basavanagudi", city: "Bengaluru", latitude: 12.9430, longitude: 77.5700, rating: 4.9, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Shri Sagar CTR", description: "Malleshwaram's 1920s legend renowned for crispy Benne Masala Dosa with generous white butter.", address: "7th Cross Road, Margosa Road, Malleshwaram", area: "Malleshwaram", city: "Bengaluru", latitude: 12.9980, longitude: 77.5710, rating: 4.9, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "MTR (Mavalli Tiffin Room)", description: "Lalbagh's 1924 historic brand that invented Rava Idli, served with piping hot pure ghee and Filter Coffee.", address: "14, Lal Bagh Main Road, Sampangi Rama Nagar", area: "Lalbagh", city: "Bengaluru", latitude: 12.9550, longitude: 77.5860, rating: 4.9, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Nagarjuna Restaurant", description: "Residency Road's spicy Andhra culinary bastion famous for unlimited banana leaf meals and fiery chicken sholay.", address: "44/1, Residency Road", area: "Residency Road", city: "Bengaluru", latitude: 12.9720, longitude: 77.6080, rating: 4.8, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Corner House Ice Cream", description: "Bengaluru's legendary dessert chain home of the iconic 'Death By Chocolate' (DBC).", address: "Residency Road & Indiranagar", area: "Indiranagar", city: "Bengaluru", latitude: 12.9780, longitude: 77.6400, rating: 4.9, image: "/images/food/death_by_chocolate.jpg", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Peter Cat", description: "Park Street's 1975 legendary culinary institution famous for the iconic Chelo Kebab with poached egg and butter rice.", address: "18A, Park Street, Park Street area", area: "Park Street", city: "Kolkata", latitude: 22.5530, longitude: 88.3520, rating: 4.9, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Arsalan", description: "Park Circus culinary crown famous for Kolkata Dum Biryani with melt-in-mouth potato and mutton chaap.", address: "191, Marina Park Circus, 7 Point", area: "Park Circus", city: "Kolkata", latitude: 22.5440, longitude: 88.3650, rating: 4.9, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Nizam's", description: "New Market 1932 heritage kitchen: the birthplace of original Kathi Rolls with succulent mutton kebabs.", address: "23/24, Hogg Street, New Market Area", area: "New Market", city: "Kolkata", latitude: 22.5600, longitude: 88.3530, rating: 4.8, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Flurys", description: "Park Street's 1927 European tea-room famous for English breakfast, rum balls, and heritage pastries.", address: "18, Park Street", area: "Park Street", city: "Kolkata", latitude: 22.5535, longitude: 88.3515, rating: 4.7, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "K.C. Das Sweets", description: "Esplanade's 1866 historic confectioner: the inventor of Rossogolla and Rasmalai in Bengal.", address: "11A, Esplanade East, Peerless Mansion", area: "Esplanade", city: "Kolkata", latitude: 22.5660, longitude: 88.3520, rating: 4.8, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Paradise Biryani", description: "Secunderabad's 1953 iconic world-famous Dum Biryani landmark served with rich mirchi ka salan.", address: "SD Road, Paradise Circle, Secunderabad", area: "Secunderabad", city: "Hyderabad", latitude: 17.4420, longitude: 78.4870, rating: 4.8, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Bawarchi", description: "RTC X Roads double masala mutton biryani sensation known for dark roast spices and tender mutton.", address: "RTC X Roads, Chikkadpally", area: "Chikkadpally", city: "Hyderabad", latitude: 17.4040, longitude: 78.4980, rating: 4.9, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Shah Ghouse Cafe", description: "Tolichowki and Charminar hotspot world-famous for royal Mutton Haleem, Biryani, and Paya Nahari.", address: "Opposite Mandar, Tolichowki", area: "Tolichowki", city: "Hyderabad", latitude: 17.4000, longitude: 78.4100, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 0 },
  { name: "Chutneys", description: "Banjara Hills and Nagarjuna Circle haven famous for Guntur Idli served with 7 different artisanal chutneys.", address: "Road No 3, Banjara Hills", area: "Banjara Hills", city: "Hyderabad", latitude: 17.4250, longitude: 78.4480, rating: 4.8, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Karachi Bakery", description: "Mozamjahi Market 1953 legacy bakery celebrated for hand-baked Fruit Biscuits, Cashew Cookies & Plum Cake.", address: "MJ Market, Nampally", area: "MJ Market", city: "Hyderabad", latitude: 17.3820, longitude: 78.4750, rating: 4.8, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Agashiye", description: "The House of MG's celebrated rooftop Gujarati thali experience serving 20+ heritage regional dishes.", address: "The House of MG, Opp. Sidi Saiyyed Mosque, Gheekanta", area: "Lal Darwaja", city: "Ahmedabad", latitude: 23.0280, longitude: 72.5800, rating: 4.9, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active', is_veg: 1 },
  { name: "Manek Chowk Food Street", description: "Ahmedabad's legendary night food paradise famous for Gwalior Dosa, Chocolate Cheese Sandwich, and Ashrafi Kulfi.", address: "Manek Chowk, Old City, Danapidth", area: "Manek Chowk", city: "Ahmedabad", latitude: 23.0225, longitude: 72.5870, rating: 4.8, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Honest Pav Bhaji & Street Food", description: "Gujarat's beloved food chain famous for rich Spiced Butter Pav Bhaji, Pulav, and Grilled Sandwiches.", address: "Panchvati Circle, CG Road, Navrangpura", area: "Navrangpura", city: "Ahmedabad", latitude: 23.0330, longitude: 72.5600, rating: 4.7, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Das Khaman", description: "Old city 1922 legend renowned for spongy Sev Khaman, Tamtam Khaman, and sweet-sour green chutneys.", address: "Shop 2, Trade Centre, Near Stadium Circle, Navrangpura", area: "Navrangpura", city: "Ahmedabad", latitude: 23.0410, longitude: 72.5640, rating: 4.8, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Laxmi Ghatiya Rath", description: "Celebrated destination for blistering hot Bhavnagari Gathiya, Papdi, and spicy papaya sambharo.", address: "Nehrunagar Cross Roads, Ambawadi", area: "Ambawadi", city: "Ahmedabad", latitude: 23.0210, longitude: 72.5400, rating: 4.7, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Rawat Mishthan Bhandar", description: "Jaipur's world-famous heritage sweet shop legendary for blistering hot spicy Pyaaz Kachori and Mawa Kachori.", address: "Opposite Polovictory Cinema, Station Road", area: "Sindhi Camp", city: "Jaipur", latitude: 26.9210, longitude: 75.7980, rating: 4.9, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "LMB (Laxmi Mishthan Bhandar)", description: "Johari Bazaar 1727 royal confectioner famous for Rajasthani Royal Thali, Paneer Ghevar, and Dal Baati Churma.", address: "Johari Bazar, Biseswarji", area: "Johari Bazaar", city: "Jaipur", latitude: 26.9200, longitude: 75.8270, rating: 4.8, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Chokhi Dhani Ethnic Resort", description: "World-renowned Rajasthani village experience serving authentic wood-fired Dal Baati Churma with pure ghee.", address: "12 Miles Tonk Road, Goner Mod Flyover", area: "Tonk Road", city: "Jaipur", latitude: 26.7670, longitude: 75.8340, rating: 4.9, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Pandit Kulfi", description: "Hawa Mahal landmark serving authentic saffron pistachio matka kulfi and rabdi falooda since 1946.", address: "Sirah Deori Bazar, Opposite Hawa Mahal", area: "Hawa Mahal", city: "Jaipur", latitude: 26.9240, longitude: 75.8270, rating: 4.7, image: "/images/food/kulfi.jpg", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Gulab Ji Chaiwale", description: "MI Road morning institution famous for special butter bun maska and spiced cardamom masala chai.", address: "Ganpati Plaza, MI Road", area: "MI Road", city: "Jaipur", latitude: 26.9180, longitude: 75.8010, rating: 4.8, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Chhappan Dukan", description: "56 iconic street food stalls serving spicy Garadu, Khopra Patties, Egg Banjo, and Johny Hot Dog.", address: "New Palasia", area: "New Palasia", city: "Indore", latitude: 22.7240, longitude: 75.8840, rating: 4.9, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Sarafa Night Food Market", description: "Indore's world-famous midnight jewelry street turning into culinary hub for Bhutte Ka Kees and Garadu.", address: "Sarafa Bazar, Rajwada", area: "Rajwada", city: "Indore", latitude: 22.7180, longitude: 75.8550, rating: 4.9, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Vijay Chaat House", description: "Sarafa Bazaar 1969 institution famous for crisp Khopra Patties served with sweet-tangy chutney.", address: "Sarafa Bazar, Near Rajwada Palace", area: "Rajwada", city: "Indore", latitude: 22.7190, longitude: 75.8560, rating: 4.8, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Joshi Dahi Bada House", description: "Sarafa market showman known for flying dahi vadas caught with one hand and topped with 5 secret spices.", address: "24, Bada Sarafa", area: "Sarafa", city: "Indore", latitude: 22.7175, longitude: 75.8545, rating: 4.9, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Apna Sweets", description: "Indore's sweet and snack giant famous for Indori Poha Jalebi with Sev, and Namkeen platters.", address: "Bhawarkua Main Road", area: "Bhawarkua", city: "Indore", latitude: 22.6920, longitude: 75.8670, rating: 4.7, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Britto's Baga Beach", description: "Baga beach 1965 shack legend famous for Fresh Butter Garlic Jumbo Crab, Prawn Curry, and Pork Vindaloo.", address: "House No. 7/171, Saunta Vaddo, Baga Beach", area: "Baga", city: "Goa", latitude: 15.5560, longitude: 73.7515, rating: 4.8, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Fisherman's Wharf", description: "Salcette riverside destination serving authentic Goan Prawn Balchão, Kingfish Rava Fry, and Bebinca.", address: "Mobor Beach, Cavelossim", area: "Cavelossim", city: "Goa", latitude: 15.1760, longitude: 73.9450, rating: 4.9, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Vinayak Family Restaurant", description: "Assagao's beloved local hideout world-famous for the richest Goan Fish Thali with Fried Chonak & Tisreo.", address: "Main Road, Boutique, Assagao", area: "Assagao", city: "Goa", latitude: 15.5900, longitude: 73.7780, rating: 4.9, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Gunpowder", description: "Assagao heritage villa serving exquisite South Indian coastal food: Kerala beef fry, appams, and Malabar fish curry.", address: "Saanto Vaddo, Assagao", area: "Assagao", city: "Goa", latitude: 15.5920, longitude: 73.7760, rating: 4.8, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Ritz Classic Panjim", description: "Panaji's premier seafood institution celebrated for legendary Goan Fish Thali with Fried Surmai and Tisreo.", address: "18th June Road, Panaji", area: "Panaji", city: "Goa", latitude: 15.4980, longitude: 73.8270, rating: 4.9, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Tunday Kababi", description: "Historic 1905 Aminabad institution world-famous for 160-spice melt-in-mouth Galouti Kebabs & Mughlai Parathas.", address: "168/6, Nazirabad Rd, Khayali Ganj, Aminabad", area: "Aminabad", city: "Lucknow", latitude: 26.8490, longitude: 80.9250, rating: 4.9, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", is_campaign_active: 1, total_visits: 1, status: 'active' },

  // Indore & Madhya Pradesh
  { name: "Sarafa Night Food Market", description: "Indore's world-famous midnight jewelry street turning into culinary hub for Bhutte Ka Kees and Garadu.", address: "Sarafa Bazar, Rajwada", area: "Rajwada", city: "Indore", latitude: 22.7180, longitude: 75.8550, rating: 4.9, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },
  { name: "Chhappan Dukan (56 Shops)", description: "Indore's iconic 56-shop food lane celebrating Johnny Hot Dog, Vijay Chaat Khopra Patties, and Shikanji.", address: "56 Dukan, New Palasia", area: "New Palasia", city: "Indore", latitude: 22.7240, longitude: 75.8820, rating: 4.8, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80", is_campaign_active: 1, total_visits: 1, status: 'active' },

];

export const INITIAL_DISHES: Omit<Dish, 'id'>[] = [
  // 1. Hotel Jagdamb - Nanded Phata (rest_id: 1)
  { restaurant_id: 1, name: "Special Gavran Mutton Thali", description: "Authentic spicy Gavran lamb thali with slow-cooked mutton sukka, Tambda rassa, Pandhra rassa, indrayani rice & hot jowar bhakri.", price: 420.00, image: "/images/food/mutton_curry.jpg", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 1, name: "Kala Masala Chicken Handi", description: "Tender country chicken simmered in traditional roasted black spices and coconut gravy on charcoal.", price: 380.00, image: "/images/food/chicken_curry.jpg", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 1, name: "Spicy Mutton Sukka & Bhakri", description: "Dry-roasted tender mutton pieces tossed with fried onions, crushed garlic, and Kolhapuri red chilli paste.", price: 340.00, image: "/images/food/mutton_curry.jpg", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 1, name: "Tambda & Pandhra Rassa Bowl", description: "Twin fiery red mutton broth and aromatic white coconut-sesame broth to boost stamina.", price: 120.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 1, name: "Ukad Handi Chicken Thali", description: "Mildly spiced country chicken cooked in its own golden juices with hot steamed bhakri and thecha.", price: 360.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.8, popularity: 92, is_recommended: 1, status: 'active' },

  // 2. Girija Pure Veg & Bhel - Sinhagad Road (rest_id: 2)
  { restaurant_id: 2, name: "Girija Special Matki Bhel", description: "Crisp puffed rice tossed with sprouted matki, fiery green thecha, sweet tamarind chutney, and nylon sev.", price: 90.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 2, name: "Special SPDP (Sev Potato Dahi Puri)", description: "Crispy puris bursting with spiced potatoes, chilled sweet curd, tangy chutneys, and a mountain of sev.", price: 110.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 2, name: "Maharashtrian Pithla Bhakri Thali", description: "Comforting spiced gram flour pithla served hot with fresh roasted jowar bhakri, thecha, and onions.", price: 180.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 2, name: "Special Amul Butter Pav Bhaji", description: "Mashed spiced vegetable curry loaded with rich butter, served with soft toasted ladi pavs.", price: 160.00, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 2, name: "Fresh Chilled Sugarcane Juice", description: "Freshly crushed sugarcane juice infused with ginger, lemon, and fresh mint leaves.", price: 40.00, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 88, is_recommended: 1, status: 'active' },

  // 3. Saraswati Misal & Snacks - Nanded Phata (rest_id: 3)
  { restaurant_id: 3, name: "Fiery Kolhapuri Rassa Misal", description: "Extra spicy sprouted bean misal drenched in blazing red spicy tarri gravy, served with toasted pav & lemon.", price: 120.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 3, name: "Puneri Matki Misal Pav", description: "Authentic Puneri style misal with poha base, spicy sprouted matki, mixed farsan, and extra rassa cup.", price: 110.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 3, name: "Crispy Batata Vada Sambar (2 Pcs)", description: "Golden fried spiced potato fritters served with hot spicy lentil sambar and green mint chutney.", price: 70.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 3, name: "Extra Tarri Farsan Bowl Combo", description: "Extra serving of fiery red oil cut (tarri) with premium spicy Kolhapuri farsan mix.", price: 50.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 3, name: "Chilled Solkadhi Glass", description: "Traditional soothing pink drink made from fresh coconut milk, kokum agal, green chilli, and garlic.", price: 45.00, image: "/images/food/solkadhi.jpg", rating: 4.9, popularity: 97, is_recommended: 1, status: 'active' },

  // 4. Bipin Snacks & Katta - Kothrud (rest_id: 4)
  { restaurant_id: 4, name: "Traditional Thalipeeth with Loni", description: "Multi-grain roasted flatbread spiced with onion and coriander, topped with fresh white loni butter.", price: 110.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 4, name: "Crispy Sabudana Vada (2 Pcs)", description: "Crispy sago and roasted peanut patties served with sweet spiced curd chutney.", price: 80.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 4, name: "Steamed Kothimbir Vadi Fry", description: "Fresh coriander and gram flour savory cakes steamed and shallow-fried till super crisp.", price: 90.00, image: "/images/food/kothimbir_vadi.jpg", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 4, name: "Puneri Kanda Poha Supreme", description: "Fluffy flattened rice tempered with mustard seeds, turmeric, peanuts, and freshly grated coconut.", price: 50.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 4, name: "Fresh Kokum Sharbat", description: "Sweet and tangy digestive cooler infused with roasted cumin and rock salt.", price: 40.00, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 89, is_recommended: 1, status: 'active' },

  // 5. Katta Cafe - Kothrud (rest_id: 5)
  { restaurant_id: 5, name: "Famous Katta Special Cold Coffee", description: "Thick creamy frothed cold coffee topped with cocoa dust and chocolate syrup drizzle.", price: 70.00, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 5, name: "Cheese Corn Grill Sandwich", description: "Golden toasted jumbo sandwich stuffed with sweet corn, capsicum, and molten cheese blend.", price: 140.00, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 5, name: "Schezwan Double Masala Maggi", description: "Wok-tossed spicy noodles loaded with vegetables, Schezwan chili paste, and extra cheese.", price: 100.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 5, name: "Peri Peri French Fries Large", description: "Crispy golden potato fries seasoned with fiery African peri peri spice rub.", price: 110.00, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 90, is_recommended: 1, status: 'active' },
  { restaurant_id: 5, name: "Chocolate Brownie Shake", description: "Thick chocolate ice cream shake blended with rich fudgy brownies and chocolate chips.", price: 130.00, image: "/images/food/chocolate_mastani.jpg", rating: 4.8, popularity: 92, is_recommended: 1, status: 'active' },

  // 6. Bedekar Tea Stall - Narayan Peth (rest_id: 6)
  { restaurant_id: 6, name: "Historic Bedekar Puneri Misal", description: "Pune's legendary spicy misal prepared with secret family spice blend, served with soft bread slices & lemon.", price: 120.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 6, name: "Fresh Poha Laddoo (2 Pcs)", description: "Traditional sweet flattened rice laddoos rolled with roasted nuts, ghee, and jaggery.", price: 60.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 6, name: "Special Puneri Masala Chai", description: "Piping hot aromatic tea brewed with ginger, lemongrass, and freshly ground spices.", price: 30.00, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 6, name: "Crispy Spiced Farsan Plate", description: "Crunchy signature sev, gathiya, and spiced fried lentils accompaniment.", price: 50.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 6, name: "Upma Sheera Duo", description: "Savory semolina upma paired with golden saffron sheera.", price: 90.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 88, is_recommended: 1, status: 'active' },

  // 7. Tilak Hotel - Shukrawar Peth (rest_id: 7)
  { restaurant_id: 7, name: "Tilak Road Special Misal Pav", description: "Classic spicy Shukrawar Peth misal with crunchy farsan, diced onions, and buttery toasted pav.", price: 110.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 7, name: "Crispy Batata Vada Sambar", description: "Two deep-fried golden spiced potato balls served with flavorful aromatic sambar.", price: 65.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 7, name: "Kanda Bhajji (Pakoda) Plate", description: "Crispy sliced onion fritters deep fried in seasoned gram flour batter, served with spicy chutney.", price: 70.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 7, name: "Sabudana Khichdi with Curd", description: "Fasting delicacy of tapioca pearls roasted with crunchy peanuts, green chillies, and cumin.", price: 80.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 90, is_recommended: 1, status: 'active' },
  { restaurant_id: 7, name: "Special Adrak Wali Chai", description: "Strong boiled milk tea infused with freshly crushed ginger root.", price: 25.00, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },

  // 8. Vaishali Restaurant - FC Road (rest_id: 8)
  { restaurant_id: 8, name: "Special Vaishali Tomato Omelette", description: "FC Road's iconic golden chickpea-flour pancake prepared with chopped fresh ripe tomatoes, green chilies and coriander, served with crisp buttered toast.", price: 150.00, image: "/images/food/tomato_omelette.jpg", rating: 5.0, popularity: 100, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 8, name: "Special Cheese Tomato Omelette", description: "Vaishali's famous savory tomato besan pancake smothered in melted Amul cheese, served with hot buttered toast.", price: 180.00, image: "/images/food/tomato_omelette.jpg", rating: 4.9, popularity: 99, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 8, name: "Mysore Masala Dosa", description: "Crispy fermented crepe smeared with spicy fiery red garlic chutney, filled with spiced potato mash and laden with pure ghee.", price: 160.00, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 8, name: "SPDP (Sev Potato Dahi Puri)", description: "Crunchy puris filled with spiced potatoes, chilled sweet curd, tangy tamarind chutney, and mountain of crisp sev.", price: 130.00, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 8, name: "Filter Coffee Supreme", description: "Aromatic South Indian chicory blend frothed to perfection in traditional stainless steel tumbler.", price: 60.00, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 8, name: "Special Cheese Onion Dosa", description: "Thick crispy dosa loaded with finely chopped red onions, green chillies, and grated Amul cheese.", price: 180.00, image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 8, name: "Upma Sheera Twin Combo", description: "Savory roasted semolina upma served alongside velvety golden pineapple sheera dripping with ghee.", price: 110.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 89, is_recommended: 1, status: 'active' },

  // 9. Cafe Goodluck - Deccan (rest_id: 9)
  { restaurant_id: 9, name: "Bun Maska & Irani Chai", description: "Soft fresh bun slathered with dollops of salted butter served with piping hot cardamom Irani tea.", price: 70.00, image: "/api/ai/dish-image?dish=Bun%20Maska", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 9, name: "Spicy Mutton Keema Pav", description: "Slow-cooked minced mutton cooked in whole aromatic spices topped with fresh mint & buttered ladi pav.", price: 260.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 9, name: "Chicken Baida Roti", description: "Crispy shallow-fried stuffed flatbread layered with spiced chicken minced and scrambled egg.", price: 220.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 9, name: "Special Irani Mawa Cake", description: "Traditional rich cardamom and nutmeg scented sponge cake baked to golden perfection.", price: 50.00, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 9, name: "Double Cheese Omelette Pav", description: "Fluffy 3-egg omelette loaded with melted cheese slices, green chillies, served with hot toasted pav.", price: 140.00, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 91, is_recommended: 1, status: 'active' },

  // 10. Sujata Mastani - Sadashiv Peth (rest_id: 10)
  { restaurant_id: 10, name: "Special Mango Mastani", description: "Pune's iconic thick Alphonso mango shake crowned with rich vanilla ice cream, cherry, and almonds.", price: 150.00, image: "/images/food/mango_mastani.jpg", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 10, name: "Dryfruit Royal Mastani", description: "Creamy cashew nut & saffron thick shake topped with roasted pistachios, raisins, and kulfi scoop.", price: 180.00, image: "/images/food/dryfruit_mastani.jpg", rating: 4.9, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 10, name: "Chocolate Brownie Mastani", description: "Rich Dutch chocolate shake loaded with crumbled gooey brownie and dark chocolate fudge sauce.", price: 170.00, image: "/images/food/chocolate_mastani.jpg", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 10, name: "Kesar Pista Special Shake", description: "Aromatic Kashmiri saffron thick milk blend topped with generous crushed green pistachios.", price: 160.00, image: "/images/food/kesar_pista_mastani.jpg", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 10, name: "Fresh Strawberry Crush Mastani", description: "Real Mahabaleshwar strawberry pulp blended into thick ice cream shake with fresh berry toppings.", price: 140.00, image: "/images/food/strawberry_mastani.jpg", rating: 4.8, popularity: 93, is_recommended: 1, status: 'active' },

  // 11. Poona Guest House - Sadashiv Peth (rest_id: 11)
  { restaurant_id: 11, name: "Traditional Puneri Thali", description: "Heritage Maharashtrian feast featuring Puran Poli, Katachi Amti, Koshimbir, Batata Bhaji, Varan Bhaat & pure ghee.", price: 280.00, image: "/images/food/thali.jpg", rating: 4.9, popularity: 98, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Fresh Shrikhand Puri Plate (4 Pcs)", description: "Creamy saffron and cardamom-infused hung curd shrikhand served with 4 puffed golden wheat puris.", price: 160.00, image: "/images/food/shrikhand_puri.jpg", rating: 5.0, popularity: 100, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Authentic Maharashtrian Puri Bhaji", description: "4 Crispy golden puffed puris served with aromatic yellow batata sukhi bhaji, lemon and green thecha.", price: 130.00, image: "/images/food/puri_bhaji.jpg", rating: 4.9, popularity: 99, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Traditional Kheer with Saffron & Dry Fruits", description: "Slow-cooked rich creamy milk kheer infused with Kashmiri saffron, cardamom, cashews, almonds & pistachios.", price: 90.00, image: "/images/food/kheer.jpg", rating: 4.9, popularity: 98, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Pure Alphonso Aamras Puri Platter", description: "Seasonal heritage special: pure Alphonso mango pulp served with 4 fluffy hot puris.", price: 210.00, image: "/images/food/aamras_puri.jpg", rating: 5.0, popularity: 100, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Garma Garam Pithla Bhakri with Thecha & Kanda", description: "Hot comforting besan pithla served with piping hot roasted jowar bhakri, spicy thecha and fresh onions.", price: 160.00, image: "/images/food/pithla_bhakri.jpg", rating: 5.0, popularity: 99, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Authentic Bharli Vangi with Jowar Bhakri", description: "Spiced baby brinjals simmered in rich roasted peanut and sesame goda gravy.", price: 190.00, image: "/images/food/bharli_vangi.jpg", rating: 4.8, popularity: 97, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Indrayani Varan Bhat with Pure Desi Ghee", description: "Steaming aromatic soft rice topped with yellow lentil varan, fresh lemon & pure desi ghee.", price: 130.00, image: "/images/food/varan_bhat.jpg", rating: 4.8, popularity: 96, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Authentic Bhajani Thalipeeth with White Loni Butter", description: "Crispy multigrain roasted flatbread prepared from traditional bhajani flour, served with fresh white butter.", price: 120.00, image: "/images/food/thalipeeth.jpg", rating: 4.9, popularity: 98, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Steamed Ukdiche Modak (2 Pcs)", description: "Hot steamed rice-flour dumplings filled with grated coconut and jaggery, drenched in pure ghee.", price: 120.00, image: "/images/food/modak.jpg", rating: 5.0, popularity: 100, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Puran Poli with Ghee (2 Pcs)", description: "Sweet golden flatbreads stuffed with cardamom-infused Bengal gram and jaggery.", price: 140.00, image: "/images/food/puran_poli.jpg", rating: 4.9, popularity: 96, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Kothimbir Vadi Platter", description: "Crispy steamed and shallow-fried coriander diamond cakes served with spicy chutney.", price: 90.00, image: "/images/food/kothimbir_vadi.jpg", rating: 4.7, popularity: 92, is_recommended: 1, is_veg: 1, status: 'active' },
  { restaurant_id: 11, name: "Chilled Spiced Mattha Glass", description: "Puneri buttermilk seasoned with ginger, green chillies, fresh coriander, and roasted cumin.", price: 40.00, image: "/images/food/masala_taak.jpg", rating: 4.8, popularity: 94, is_recommended: 1, is_veg: 1, status: 'active' },

  // 12. George Restaurant - Camp (rest_id: 12)
  { restaurant_id: 12, name: "Special Mutton Dum Biryani", description: "Long grain Basmati rice layered with succulent saffron-marinated mutton, caramelized onions & ghee.", price: 380.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 12, name: "Butter Tandoori Chicken Full", description: "Whole tandoori roasted chicken basted in spiced yoghurt marinade and charred over live charcoal.", price: 460.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.7, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 12, name: "Juicy Chicken Seekh Kebab", description: "Spiced minced chicken skewers grilled to perfection in clay oven served with mint chutney.", price: 290.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 12, name: "Butter Garlic Naan & Mutton Gravy", description: "Fluffy tandoori naan brushed with garlic butter served with slow-cooked spicy mutton gravy.", price: 340.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 12, name: "Heritage Caramel Custard", description: "Silky smooth baked egg custard with rich golden burnt sugar caramel sauce.", price: 120.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 90, is_recommended: 1, status: 'active' },

  // 13. Kayani Bakery - Camp (rest_id: 13)
  { restaurant_id: 13, name: "Shrewsbury Biscuits Pack", description: "World-famous rich buttery shortbread cookies crafted with secret Parsi heritage recipe.", price: 240.00, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 13, name: "Special Mawa Cake Slices", description: "Dense, moist sponge cake infused with caramelized mawa (khoya) and freshly ground cardamom.", price: 180.00, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 13, name: "Crispy Ginger Biscuits", description: "Crunchy tea-time cookies infused with freshly grated spicy ginger and brown sugar.", price: 160.00, image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 13, name: "Rich Fruit Wine Cake", description: "Festive dense loaf cake loaded with rum-soaked raisins, candied peel, and tutty-fruity.", price: 290.00, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 13, name: "Cheese Papadi Salted Crunch", description: "Savory crispy cheese-flavored bites cooked to golden perfection.", price: 130.00, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 88, is_recommended: 1, status: 'active' },

  // 14. German Bakery - Koregaon Park (rest_id: 14)
  { restaurant_id: 14, name: "Classic German Apple Strudel", description: "Flaky baked pastry filled with warm spiced apples, cinnamon, and raisins served with vanilla cream.", price: 220.00, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 14, name: "Spicy Keema Pav Special", description: "Slow braised mutton keema topped with fresh onions and butter toasted ladi pavs.", price: 280.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 14, name: "Red Velvet Cream Cheese Pastry", description: "Velvety cocoa sponge layered with rich cream cheese frosting and raspberry sauce.", price: 180.00, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 14, name: "Iced Caramel Macchiato", description: "Espresso layered with chilled milk, vanilla syrup, and buttery caramel drizzle.", price: 160.00, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 14, name: "Cheesy Mushroom & Spinach Quiche", description: "Savory shortcrust pastry tart filled with sautéed mushrooms, garlic spinach, and melted cheese.", price: 190.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 89, is_recommended: 1, status: 'active' },

  // 15. Irani Cafe - Viman Nagar (rest_id: 15)
  { restaurant_id: 15, name: "Bun Maska & Irani Chai", description: "Crusty bun stuffed with whipped salted butter paired with sweet spiced cardamom tea.", price: 75.00, image: "/api/ai/dish-image?dish=Bun%20Maska", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 15, name: "Mutton Keema Ghotala", description: "Spiced minced mutton scrambled together with two sunny eggs, green chillies & pav.", price: 290.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 15, name: "Chicken Cheese Roll", description: "Flaky tawa paratha rolled with tandoori chicken chunks and melted cheese.", price: 180.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 15, name: "Classic Irani Bun Omelette", description: "Fluffy 2-egg spiced omelette folded inside a fresh buttery soft bun.", price: 120.00, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 90, is_recommended: 1, status: 'active' },
  { restaurant_id: 15, name: "Parsi Baked Custard", description: "Traditional baked pudding flavored with nutmeg, cardamom, and roasted charoli nuts.", price: 110.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },

  // 16. The Urban Foundry - Baner (rest_id: 16)
  { restaurant_id: 16, name: "Soya Chaap Tikka Makhani", description: "Tender soya chaap chunks tossed in clay oven spices, served with creamy tomato makhani dip.", price: 340.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 16, name: "Bacon Naan & Dal Makhani", description: "Crispy stuffed cheese & bacon naan served with rich overnight slow-cooked dal makhani.", price: 420.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 16, name: "Kundapur Chicken Ghee Roast", description: "Mangalorean style fiery roasted chicken tossed in Byadgi chillies and pure country ghee.", price: 390.00, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 16, name: "Malabar Parotta & Mutton Sukka", description: "Layered flaky parottas served with spiced bone-in mutton sukka and coconut gravy.", price: 440.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 16, name: "Filter Kaapi Tiramisu", description: "South Indian filter coffee infused mascarpone mousse layered with sponge.", price: 260.00, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },

  // 17. Shivraj Hotel - Warje & Karve Nagar (rest_id: 17)
  { restaurant_id: 17, name: "World Famous Raavan Mutton Thali", description: "Giant 8kg non-veg feast platter with mutton chops, kheema, chicken handi, 5 rassas, bhakri & biryani.", price: 990.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 17, name: "Bullet Chicken Special Thali", description: "Spicy country chicken handi, chicken sukka, tambda rassa, pandhra rassa, rice & hot jowar bhakri.", price: 390.00, image: "/images/food/chicken_curry.jpg", rating: 4.8, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 17, name: "Tandoori Surmai Fish Fry", description: "Fresh kingfish steak coated in Kolhapuri spices and rawa fried crisp in pure coconut oil.", price: 480.00, image: "/images/food/fish_fry.jpg", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 17, name: "Fiery Kolhapuri Tambda Rassa Bowl", description: "Blazing red mutton broth simmered with whole local spices, cloves, and fiery red chili.", price: 100.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 17, name: "Hot Jowar Bhakri with Thecha (2 Pcs)", description: "Hand-patted fresh jowar flatbreads served with roasted green chili garlic thecha.", price: 60.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },

  // 18. Sarasbaug Chaupati Bhel - Swargate (rest_id: 18)
  { restaurant_id: 18, name: "Sarasbaug Special SPDP", description: "Pune's favorite evening chaat: crispy puris packed with potato, chilled yogurt, date-tamarind chutney & sev.", price: 90.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 18, name: "Oli Bhel with Raw Mango", description: "Puffed rice tossed with sweet-tangy chutney, chopped raw mango slices, onion, and crisp sev.", price: 80.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 18, name: "Amul Butter Pav Bhaji", description: "Tawa sizzled mashed vegetable curry with huge butter slab and hot toasted pavs.", price: 150.00, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 18, name: "Ragda Patties Double", description: "Two golden potato patties bathed in spiced white pea ragda curry with coriander garnish.", price: 90.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 18, name: "Special Malai Kulfi Falooda", description: "Creamy pistachios kulfi slices served over sweet rose vermicelli falooda and sabja seeds.", price: 120.00, image: "/images/food/falooda.jpg", rating: 4.9, popularity: 97, is_recommended: 1, status: 'active' },

  // 19. Leopold Cafe & Bar - Mumbai (rest_id: 19)
  { restaurant_id: 19, name: "Leopold Special Chicken Stroganoff", description: "Tender chicken strips cooked in rich creamy mushroom and herb paprika sauce over herb buttered rice.", price: 490.00, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 19, name: "Spicy Keema Pav", description: "Slow-braised spiced minced mutton topped with fresh onions and butter-toasted ladi pavs.", price: 340.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 19, name: "Tandoori Chicken Tikka Platter", description: "Smokey chargrilled chicken chunks marinated in hung curd, Kashmiri chilli & garam masala.", price: 420.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 19, name: "Spicy Buff Chilli Fry", description: "Classic Mumbai pub bite featuring sliced meat tossed with green chillies, garlic & dark soy.", price: 380.00, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 90, is_recommended: 1, status: 'active' },
  { restaurant_id: 19, name: "Beer Battered Fish & Chips", description: "Crispy fried Kolkata bhetki fillets served with seasoned french fries & house tartar sauce.", price: 510.00, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },

  // 20. Bademiya - Mumbai (rest_id: 20)
  { restaurant_id: 20, name: "Special Chicken Baida Roti", description: "Layered crispy paratha stuffed with egg scrambled chicken keema, fried on flat iron tawa.", price: 250.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 20, name: "Mutton Seekh Kebab Roll", description: "Charcoal-grilled minced mutton seekh wrapped in roomali roti with sliced onions & lemon.", price: 280.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 20, name: "Chicken Bhuna Roll", description: "Slow-roasted chicken cooked in thick onion tomato gravy, rolled in hot butter paratha.", price: 260.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 20, name: "Juicy Mutton Boti Kebab", description: "Tender boneless mutton cubes marinated in papaya & tandoori spices, cooked on skewers.", price: 360.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 20, name: "Rumali Roti & Mutton Korma Combo", description: "Paper-thin soft rumali roti served with rich, aromatic slow-cooked mutton gravy.", price: 390.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },

  // 21. Sardar Refreshments - Mumbai (rest_id: 21)
  { restaurant_id: 21, name: "Extra Butter Pav Bhaji", description: "Mashed spiced vegetable curry floating under half slab of pure Amul butter, served with butter pav.", price: 210.00, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 21, name: "Special Cheese Pav Bhaji", description: "Rich pav bhaji smothered with mountain of grated Processed cheese and melted butter.", price: 250.00, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 21, name: "Masala Pav Double", description: "Toasted soft ladi pavs slathered with spicy garlic onion bhaji gravy and butter.", price: 140.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 21, name: "Amul Butter Garlic Toast", description: "Thick crispy bread slices toasted in garlic herb butter with a crunchy crust.", price: 110.00, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 89, is_recommended: 1, status: 'active' },
  { restaurant_id: 21, name: "Fresh Chilled Mosambi Juice", description: "Freshly squeezed sweet lime juice served ice cold to cut through the buttery feast.", price: 90.00, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },

  // 22. Kyani & Co. - Mumbai (rest_id: 22)
  { restaurant_id: 22, name: "Mutton Keema Ghotala", description: "Iconic Irani keema scrambled together with two sunny eggs, green chillies & buttered pav.", price: 270.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 22, name: "Bun Maska & Special Irani Chai", description: "Fresh crusty bun loaded with Amul butter, paired with spiced sweet cardamom tea.", price: 80.00, image: "/api/ai/dish-image?dish=Bun%20Maska", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 22, name: "Irani Cheese Mushroom Omelette", description: "Fluffy 3-egg omelette folded over sauteed garlic mushrooms and melted cheddar.", price: 160.00, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 22, name: "Heritage Caramel Custard", description: "Legendary silky smooth egg custard baked with dark caramelized sugar glaze.", price: 110.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 22, name: "Sailor's Cinnamon Apple Pie", description: "Flaky baked pastry crust filled with spiced stewed apples and raisins.", price: 130.00, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 89, is_recommended: 1, status: 'active' },

  // 23. Anand Stall - Mumbai (rest_id: 23)
  { restaurant_id: 23, name: "Cheese Burst Vada Pav", description: "Spicy potato vada stuffed with mozzarella cheese, fried in gram batter, served in butter pav.", price: 90.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 23, name: "Schezwan Jinny Dosa", description: "Thin crispy dosa chopped on tawa with vegetables, cheese, paneer, and fiery Schezwan sauce.", price: 210.00, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 23, name: "Paneer Cheese Grill Sandwich", description: "3-layer jumbo toast sandwich filled with spiced paneer, veggies, and oozing cheese.", price: 180.00, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 23, name: "Special Chocolate Cheese Dosa", description: "Sweet dessert dosa smeared with Nutella chocolate spread and grated processed cheese.", price: 190.00, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 90, is_recommended: 1, status: 'active' },
  { restaurant_id: 23, name: "Schezwan Butter Bhel", description: "Crispy puffed rice tossed with Schezwan sauce, peanuts, sev, and melted butter.", price: 120.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },

  // 24. Karim's - Delhi (rest_id: 24)
  { restaurant_id: 24, name: "Royal Mutton Burra Kebab", description: "Charcoal-tandoor smoked juicy mutton chops marinated in secret royal Mughal spices.", price: 520.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 24, name: "Shahi Mutton Korma", description: "Slow-simmered rich gravy infused with brown onions, whole spices, and rich kewra essence.", price: 440.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 24, name: "Mutton Dum Biryani Royal", description: "Saffron infused Basmati rice cooked with tender marinated mutton in traditional sealed handi.", price: 460.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 24, name: "Flaky Tandoori Khamiri Roti", description: "Leavened thick tandoori flatbread baked in traditional clay oven.", price: 50.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 24, name: "Shahi Phirni in Clay Pot", description: "Chilled ground rice pudding flavored with saffron, cardamom, and silver leaf.", price: 120.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 93, is_recommended: 1, status: 'active' },

  // 25. Aslam Butter Chicken - Delhi (rest_id: 25)
  { restaurant_id: 25, name: "Special Dahi Butter Chicken", description: "Tandoori chicken roasted in tandoor, tossed in rich curd, secret spices, and molten butter stream.", price: 480.00, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 25, name: "Seekh Kebab Butter Bath", description: "Charcoal grilled mutton seekh kebabs dipped in melted Amul butter and spiced yogurt.", price: 360.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 25, name: "Tandoori Fish Tikka Fry", description: "Fresh river fish marinated in carom seeds, ginger garlic & mustard oil, grilled crisp.", price: 440.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 25, name: "Soft Rumali Roti", description: "Ultra-thin, soft hand-tossed flatbread baked over inverted tawa bowl.", price: 30.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 90, is_recommended: 1, status: 'active' },
  { restaurant_id: 25, name: "Special Mint Chutney & Onion Salad", description: "Tangy coriander-mint yogurt dip served with lemon spiced onion rings.", price: 50.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.5, popularity: 87, is_recommended: 1, status: 'active' },

  // 26. Sita Ram Diwan Chand - Delhi (rest_id: 26)
  { restaurant_id: 26, name: "Paneer Stuffed Chole Bhature", description: "Puffed golden bhaturas stuffed with grated paneer, served with spicy tangy chickpea curry & pickle.", price: 160.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 26, name: "Special Malai Meethi Lassi", description: "Thick creamy yogurt drink topped with thick layer of fresh malai and rose syrup.", price: 90.00, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 26, name: "Crispy Aloo Tikki Chaat", description: "Shallow-fried spiced potato patty topped with chickpeas, sweet curd, tamarind & mint chutney.", price: 120.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 26, name: "Amritsari Paneer Kulcha", description: "Crispy tandoori kulcha stuffed with spiced cottage cheese and herbs, served with chole.", price: 150.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 26, name: "Hot Desi Ghee Gulab Jamun", description: "Soft melt-in-mouth milk solid dumplings soaked in cardamom sugar syrup.", price: 70.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 95, is_recommended: 1, status: 'active' },

  // 27. Gulati - Delhi (rest_id: 27)
  { restaurant_id: 27, name: "Famous Creamy Dal Makhani", description: "Black lentils slow-cooked overnight over charcoal, finished with white butter and fresh cream.", price: 390.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 27, name: "Murgh Malai Tikka Supreme", description: "Boneless chicken chunks marinated in cream, cheese, cashews and cardamom, charcoal grilled.", price: 460.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 27, name: "Melt-In-Mouth Kakori Kebab", description: "Royal Awadhi minced lamb kebabs infused with 52 secret spices, melting effortlessly on palate.", price: 510.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 27, name: "Butter Garlic Naan", description: "Refined flour tandoori naan coated with minced garlic, coriander, and pure Amul butter.", price: 110.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 27, name: "Kesar Zafrani Phirni", description: "Chilled rice pudding garnished with pistachios, almonds, saffron threads, served in earthenware.", price: 140.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 93, is_recommended: 1, status: 'active' },

  // 28. Al Jawahar - Delhi (rest_id: 28)
  { restaurant_id: 28, name: "Special Mutton Nihari", description: "Slow-braised mutton shanks stewed overnight in fragrant whole spice broth & bone marrow.", price: 440.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 28, name: "Chicken Changezi Special", description: "Fried chicken cooked in tangy, milk-cream onion tomato gravy with green chillies.", price: 420.00, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 28, name: "Gurda Kaleji Tawa Fry", description: "Fresh mutton kidney & liver tossed on iron tawa with crushed pepper, onions, and lemon.", price: 360.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 90, is_recommended: 1, status: 'active' },
  { restaurant_id: 28, name: "Sweet Saffron Sheermal Roti", description: "Traditional Mughlai flatbread made with milk, ghee, and saffron baked in tandoor.", price: 70.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 28, name: "Zafrani Kheer Pot", description: "Thick milk rice kheer infused with saffron, raisins, and crushed dry fruits.", price: 110.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 92, is_recommended: 1, status: 'active' },

  // 29. Vidyarthi Bhavan - Bengaluru (rest_id: 29)
  { restaurant_id: 29, name: "Crispy Golden Butter Masala Dosa", description: "Signature thick yet crunchy dosa with golden exterior, soft interior, loaded with pure country butter.", price: 90.00, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 29, name: "Fluffy Sambar Vada (2 Pcs)", description: "Golden fried lentil donuts soaked in steaming hot aromatic vegetable sambar.", price: 70.00, image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 29, name: "Chow Chow Bath (Upma + Kesari)", description: "Savory kara bath paired with sweet saffron pineapple kesari bath served with coconut chutney.", price: 100.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 29, name: "Plain Rava Masala Dosa", description: "Lacy semolina dosa sprinkled with cumin, green chillies & roasted cashews.", price: 95.00, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 29, name: "Degree Filter Coffee", description: "Authentic Karnataka filter kaapi frothed with boiling thick milk in traditional steel glass.", price: 35.00, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },

  // 30. Shri Sagar CTR - Bengaluru (rest_id: 30)
  { restaurant_id: 30, name: "Benne Masala Dosa", description: "Malleshwaram's legendary extra crispy dosa cooked with generous dollops of fresh white butter.", price: 95.00, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 30, name: "Fluffy Poori Sagu (3 Pcs)", description: "Golden puffed wheat pooris served with spiced potato & mixed vegetable sagu gravy.", price: 85.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 30, name: "Crispy Maddur Vada (2 Pcs)", description: "Crunchy onion, semolina & rice flour fritter flavored with curry leaves & green chillies.", price: 60.00, image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 30, name: "Pineapple Kesari Bath", description: "Melting semolina sweet cooked in pure ghee with fresh pineapple chunks & cashews.", price: 65.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 30, name: "Strong Filter Kaapi", description: "Freshly brewed South Indian coffee decoction poured high for thick foam froth.", price: 35.00, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 97, is_recommended: 1, status: 'active' },

  // 31. MTR - Bengaluru (rest_id: 31)
  { restaurant_id: 31, name: "Signature Rava Idli with Ghee", description: "The dish invented by MTR during WWII: steamed semolina cake topped with cashew & pure ghee.", price: 110.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 31, name: "MTR Masala Dosa", description: "Thick golden dosa made with traditional batter recipe, served with potato sagu & ghee.", price: 120.00, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 31, name: "Bisi Bele Bath with Raitha", description: "Rice and lentils cooked together with veggies, tamarind, aromatic spices & ghee.", price: 130.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 31, name: "Chandrahara Heritage Dessert", description: "MTR's exclusive sweet delicacy of deep fried flour folds soaked in thickened sweetened milk.", price: 140.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 31, name: "Royal Filter Coffee", description: "Handcrafted Chicory filter coffee served in heavy silver-nickel cup.", price: 50.00, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },

  // 32. Nagarjuna - Bengaluru (rest_id: 32)
  { restaurant_id: 32, name: "Unlimited Andhra Banana Leaf Meal", description: "Authentic spicy Andhra feast with rice, pappu, sambar, rasam, gongura chutney & ghee.", price: 290.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 32, name: "Fiery Guntur Chicken Fry", description: "Chicken morsels tossed with roasted Guntur red chillies, curry leaves & garlic.", price: 340.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.9, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 32, name: "Andhra Mutton Biryani", description: "Spicy Seema-style long grain biryani cooked with tender lamb pieces & green chillies.", price: 420.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 32, name: "Shallow Fried Royyala (Prawn) Vepudu", description: "Fresh sea prawns sautéed with Andhra spice masala mix & roasted coconut.", price: 460.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 32, name: "Chilled Majjiga (Spiced Buttermilk)", description: "Refreshing churned curd flavored with ginger, coriander & mustard seeds tempering.", price: 60.00, image: "/images/food/masala_taak.jpg", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },

  // 33. Corner House - Bengaluru (rest_id: 33)
  { restaurant_id: 33, name: "Death By Chocolate (DBC)", description: "The world famous dessert: layers of vanilla ice cream, rich chocolate cake, peanuts & piping hot fudge.", price: 320.00, image: "/images/food/death_by_chocolate.jpg", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 33, name: "Hot Fudge Ice Cream Sundae", description: "Three scoops of vanilla ice cream drenched in thick house-made dark chocolate fudge.", price: 210.00, image: "/images/food/hot_fudge_sundae.jpg", rating: 4.9, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 33, name: "Brownie Bomb Delight", description: "Warm gooey walnut brownie served with vanilla ice cream and hot fudge chocolate.", price: 240.00, image: "/images/food/death_by_chocolate.jpg", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 33, name: "Fruit Melba Sundae", description: "Fresh seasonal fruit salad topped with strawberry, vanilla scoops & berry sauce.", price: 230.00, image: "/images/food/strawberry_ice_cream.jpg", rating: 4.7, popularity: 90, is_recommended: 1, status: 'active' },
  { restaurant_id: 33, name: "Thick Chocolate Malt Shake", description: "Super thick blended ice cream shake loaded with malted chocolate powder.", price: 180.00, image: "/images/food/chocolate_mastani.jpg", rating: 4.8, popularity: 92, is_recommended: 1, status: 'active' },

  // 34. Peter Cat - Kolkata (rest_id: 34)
  { restaurant_id: 34, name: "Famous Chelo Kebab Sizzler", description: "Kolkata's iconic dish: buttered rice topped with poached egg, grilled chicken & mutton kebabs on sizzling plate.", price: 540.00, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 34, name: "Chicken Steak Sizzler in Brown Sauce", description: "Juicy chicken breast steak served with mashed potatoes, buttered veggies & rich pepper sauce.", price: 520.00, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 34, name: "Mutton Seekh Kebab Platter", description: "Spiced minced lamb charcoal grilled kebabs served with mint chutney and fresh lime.", price: 460.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 34, name: "Butter Rice & Poached Egg", description: "Fragrant long-grain Basmati rice tossed with pure butter and crowned with soft poached egg.", price: 210.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 89, is_recommended: 1, status: 'active' },
  { restaurant_id: 34, name: "Heritage Peach Melba Dessert", description: "Classic dessert of poached peaches, vanilla ice cream, and raspberry puree drizzle.", price: 260.00, image: "/images/food/fruit_sundae.jpg", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },

  // 35. Arsalan - Kolkata (rest_id: 35)
  { restaurant_id: 35, name: "Kolkata Mutton Special Biryani", description: "Fragrant saffron rice cooked with tender mutton shank, spiced potato & boiled egg.", price: 380.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 35, name: "Rich Royal Chicken Chaap", description: "Slow-roasted chicken leg marinated in cashew, poppy seed, and ghee gravy on flat tawa.", price: 290.00, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 35, name: "Mutton Pasinda Kebab", description: "Tender flattened lamb escalopes marinated in papaya and aromatic spices, shallow fried.", price: 390.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 35, name: "Special Firni in Clay Earthenware", description: "Chilled ground rice pudding flavored with kewra water, rose, and green pistachios.", price: 110.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 35, name: "Shahi Tukda Dessert", description: "Fried bread slices soaked in saffron rabri condensed milk, topped with almonds.", price: 130.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },

  // 36. Nizam's - Kolkata (rest_id: 36)
  { restaurant_id: 36, name: "Original Mutton Kathi Roll", description: "The authentic birthplace roll: tandoori mutton kebabs rolled inside layered paratha with onions.", price: 190.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 36, name: "Double Egg Chicken Kathi Roll", description: "Flaky paratha coated with two eggs, filled with charcoal grilled chicken tikka & green chillies.", price: 180.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 36, name: "Special Mutton Tikka Kebab", description: "Succulent cubes of lamb marinated in ginger garlic and tandoori masala, skewered.", price: 290.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 36, name: "Spicy Brain Masala Fry", description: "Traditional Mughlai goat brain cooked with tomatoes, onions, and fiery crushed black pepper.", price: 270.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 89, is_recommended: 1, status: 'active' },
  { restaurant_id: 36, name: "Hot Paratha with Mutton Curry", description: "Flaky ghee paratha served with traditional slow-cooked Kolkata mutton curry.", price: 310.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },

  // 37. Bhojohori Manna - Kolkata (rest_id: 37)
  { restaurant_id: 37, name: "Authentic Kosha Mangsho", description: "Rich, dark, slow-roasted mutton cooked in mustard oil with whole spices and potatoes.", price: 390.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 37, name: "Gold Chingri Malaikari", description: "Jumbo tiger prawns cooked in silky tender coconut milk curry infused with green cardamom.", price: 480.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 37, name: "Bhetki Macher Paturi", description: "Kolkata Bhetki fish fillet marinated in mustard & poppy seed paste, wrapped in banana leaf & steamed.", price: 420.00, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 37, name: "Fluffy Luchi & Hing Alur Dom", description: "Puffed deep-fried refined flour luchis served with asafoetida spiced potato curry.", price: 160.00, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 37, name: "Traditional Sweet Mishti Doi", description: "Authentic caramelized sweetened curd fermented in earthen clay pot.", price: 80.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },

  // 38. Flurys - Kolkata (rest_id: 38)
  { restaurant_id: 38, name: "Heritage Full English Breakfast", description: "Eggs to order, chicken sausages, baked beans, grilled tomatoes, hash browns & butter toast.", price: 490.00, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 38, name: "Famous Flurys Rum Balls", description: "Rich chocolate truffle balls infused with dark rum and sponge crumbs, rolled in sprinkles.", price: 120.00, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 38, name: "Chocolate Cube Layered Pastry", description: "Dense cocoa layer cake coated in glossy dark chocolate ganache glaze.", price: 160.00, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 95, is_recommended: 1, status: 'active' },
  { restaurant_id: 38, name: "Puff Pastry Chicken Patties", description: "Flaky golden puff pastry stuffed with creamy spiced minced chicken filling.", price: 90.00, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 38, name: "Darjeeling First Flush Tea", description: "Aromatic champagne of teas brewed from single estate Darjeeling tea leaves.", price: 140.00, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 92, is_recommended: 1, status: 'active' },

  // 39. Paradise - Hyderabad (rest_id: 39)
  { restaurant_id: 39, name: "Special Hyderabadi Dum Biryani", description: "World-famous long grain Basmati rice cooked with saffron, spiced tender lamb & ghee.", price: 390.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 39, name: "Tangy Mirchi Ka Salan", description: "Traditional Hyderabadi curry made with large green chillies, sesame seeds, peanuts & tamarind.", price: 140.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 4.5, popularity: 90, is_recommended: 1, status: 'active' },
  { restaurant_id: 39, name: "Chicken Reshmi Kebab", description: "Melt in mouth chicken breast kebabs marinated in cashew cream & egg white.", price: 340.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.7, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 39, name: "Double Ka Meetha", description: "Nizami dessert of fried bread crostini soaked in saffron cardamom rabri milk with nuts.", price: 130.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 39, name: "Qubani Ka Meetha with Cream", description: "Royal stewed Turkish apricot sweet dessert served with thick fresh dollop of cream.", price: 150.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },

  // 40. Hotel Shadab - Hyderabad (rest_id: 40)
  { restaurant_id: 40, name: "Charminar Special Mutton Dum Biryani", description: "Authentic Old City Biryani loaded with marinated mutton, saffron rice, and fried onions.", price: 380.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 40, name: "Slow-Cooked Mutton Zabaan Nihari", description: "Traditional Old City breakfast delicacy of tender meat stewed overnight in bone broth.", price: 360.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 40, name: "Crispy Hyderabadi Chicken 65", description: "Spicy deep-fried chicken cubes tossed in yogurt, curry leaves, garlic, and fiery red chili.", price: 290.00, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 40, name: "Flaky Charminar Sheermal Roti", description: "Saffron and ghee flavored leavened sweet flatbread baked on iron tawa.", price: 60.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 40, name: "Rich Shahi Phirni in Clay Pot", description: "Slow-cooked rice and almond milk pudding chilled in terracotta cup.", price: 90.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 93, is_recommended: 1, status: 'active' },

  // 41. Bawarchi - Hyderabad (rest_id: 41)
  { restaurant_id: 41, name: "Original Bawarchi Mutton Biryani", description: "RTC X Roads double masala mutton biryani bursting with dark spices and caramelized onions.", price: 370.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 41, name: "Spicy Tangdi Kebab (4 Pcs)", description: "Chicken drumsticks marinated in rich tandoori spices and grilled over live coals.", price: 340.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.7, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 41, name: "Special Chicken Boti Kebab", description: "Charcoal grilled boneless chicken chunks basted in butter and lemon.", price: 320.00, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", rating: 4.6, popularity: 91, is_recommended: 1, status: 'active' },
  { restaurant_id: 41, name: "Butter Rumali Roti Combo", description: "Two soft rumali rotis served with rich chicken masala gravy.", price: 210.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 41, name: "Double Ka Meetha Royal", description: "Traditional fried bread pudding baked in sweetened saffron milk.", price: 110.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 93, is_recommended: 1, status: 'active' },

  // 42. Shah Ghouse - Hyderabad (rest_id: 42)
  { restaurant_id: 42, name: "Royal Hyderabadi Mutton Haleem", description: "Slow-cooked stew of pounded meat, lentils, wheat, ghee, fried onions, cashews, and rose petals.", price: 320.00, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", rating: 5.0, popularity: 100, is_recommended: 1, status: 'active' },
  { restaurant_id: 42, name: "Special Shah Ghouse Mutton Biryani", description: "Long-grain fragrant rice cooked with aromatic herbs and tender saffron mutton.", price: 390.00, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' },
  { restaurant_id: 42, name: "Crispy Tala Hua Gosht", description: "Pan-fried crispy mutton cubes seasoned with green chillies, curry leaves & black pepper.", price: 360.00, image: "/api/ai/dish-image?dish=Tandoori%20Chicken", rating: 4.8, popularity: 96, is_recommended: 1, status: 'active' },
  { restaurant_id: 42, name: "Tandoori Roti with Mutton Marag", description: "Spicy thin mutton bone soup served with hot tandoori rotis.", price: 280.00, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 92, is_recommended: 1, status: 'active' },
  { restaurant_id: 42, name: "Shahi Apricot Qubani Delight", description: "Stewed dried apricots garnished with cream and roasted almond kernels.", price: 140.00, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 94, is_recommended: 1, status: 'active' },

  // 43. Chutneys - Hyderabad (rest_id: 43)
  { restaurant_id: 43, name: "Guntur Steamed Idli (4 Pcs)", description: "Soft steaming idlis tossed in fiery Guntur podi and pure ghee, served with 7 chutneys.", price: 160.00, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 97, is_recommended: 1, status: 'active' },
  { restaurant_id: 43, name: "Babai Hotel Butter Dosa", description: "Thick soft white dosa topped with white butter chunk and fragrant podi powder.", price: 180.00, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 98, is_recommended: 1, status: 'active' },
  { restaurant_id: 43, name: "7 Signature Chutney Platter", description: "Platter of coconut, peanut, ginger, tomato, mint, coriander, and garlic chutneys.", price: 120.00, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", rating: 4.7, popularity: 94, is_recommended: 1, status: 'active' },
  { restaurant_id: 43, name: "MLA Pesarattu with Upma", description: "Healthy green gram crepe stuffed with spicy semolina upma, cooked with ghee.", price: 190.00, image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80", rating: 4.8, popularity: 93, is_recommended: 1, status: 'active' },
  { restaurant_id: 43, name: "South Indian Filter Coffee", description: "Traditional strong chicory coffee brewed fresh and served frothy.", price: 50.00, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", rating: 4.9, popularity: 99, is_recommended: 1, status: 'active' }
];

export const INITIAL_VIDEOS: Omit<BakasurVideo, 'id'>[] = [
  {
    restaurant_id: null,
    dish_id: null,
    stage: "intro",
    stage_number: 0,
    video_url: "/uploads/videos/1.mp4",
    thumbnail: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
    duration: 12,
    meter_percentage: 0,
    message: "Main hoon Bakasur! Meri bhookh ka koi ant nahi! Chal mujhe koi zabardast jagah le chal!",
    cta_text: "🚀 START THE FOOD TOUR",
    status: 'active'
  },
  {
    restaurant_id: null,
    dish_id: null,
    stage: "stage_1",
    stage_number: 1,
    video_url: "/uploads/videos/1.mp4",
    thumbnail: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
    duration: 15,
    meter_percentage: 20,
    message: "Waah! Pehla niwala toh zabardast tha! Par Bakasur ka pet abhi khaali hai... Aur Khilo!",
    cta_text: "🍽️ AUR KHILO",
    status: 'active'
  },
  {
    restaurant_id: null,
    dish_id: null,
    stage: "stage_2",
    stage_number: 2,
    video_url: "/uploads/videos/2%201.mp4",
    thumbnail: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
    duration: 16,
    meter_percentage: 45,
    message: "Maza aa raha hai! Lekin Bakasur ko roko mat! Plate par plate aane do... Aur Khilo!",
    cta_text: "🍽️ AUR KHILO",
    status: 'active'
  },
  {
    restaurant_id: null,
    dish_id: null,
    stage: "stage_3",
    stage_number: 3,
    video_url: "/uploads/videos/3%201.mp4",
    thumbnail: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    duration: 18,
    meter_percentage: 85,
    message: "Arre baap re... Itna saara masaledaar khana! Mera pet toh ab pathar ho gaya!",
    cta_text: "💥 FINAL BITE",
    status: 'active'
  },
  {
    restaurant_id: null,
    dish_id: null,
    stage: "acidity",
    stage_number: 4,
    video_url: "/uploads/videos/3%201.mp4",
    thumbnail: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
    duration: 14,
    meter_percentage: 100,
    message: "Aah! Seene mein jalan aur bhari-pan! Bakasur bhi thak gaya... Bakasur Ko Gastrium Do!",
    cta_text: "💊 GASTRIUM MOMENT",
    status: 'active'
  }
];

// In-Memory Storage Engine with File-sync or memory state (fallback if MySQL is offline)
class MemoryStore {
  restaurants: Restaurant[] = [];
  dishes: Dish[] = [];
  videos: BakasurVideo[] = [];
  sessions: Map<string, CampaignSession> = new Map();
  visits: CampaignVisit[] = [];
  participants: Participant[] = [];
  journeySteps: UserJourneyStep[] = [];
  configs: Record<string, string> = {
    "stage_1_percent": "20",
    "stage_2_percent": "45",
    "stage_3_percent": "85",
    "gastrium_message": "Bakasur Ko Gastrium Do - Instant Acidity & Gas Relief",
    "campaign_title": "Bakasur Ka Food Tour"
  };

  private nextRestId = 1;
  private nextDishId = 1;
  private nextVideoId = 1;
  private nextVisitId = 1;
  private nextPartId = 1;
  private nextJourneyId = 1;

  constructor() {
    this.seed();
  }

  seed() {
    this.nextRestId = 1;
    this.nextDishId = 1;
    this.nextVideoId = 1;
    this.nextJourneyId = 1;
    this.journeySteps = [];
    this.restaurants = INITIAL_RESTAURANTS.map((r) => ({
      ...r,
      id: this.nextRestId++,
      is_verified: 1,
      verification_source: 'verified_registry'
    } as Restaurant));
    this.dishes = INITIAL_DISHES.map((d) => ({ ...d, id: this.nextDishId++ } as Dish));
    this.videos = INITIAL_VIDEOS.map(v => ({ ...v, id: this.nextVideoId++ }));

    // Real live storage only: No fake visits or participants seeded
    this.visits = [];
    this.participants = [];
  }
}

// Global Singletons
const globalForDB = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
  memoryStore?: MemoryStore;
  dbType?: 'mysql' | 'memory';
  verificationSchemaReady?: Promise<boolean>;
};

const memoryStore = globalForDB.memoryStore || new MemoryStore();
if (process.env.NODE_ENV !== 'production') globalForDB.memoryStore = memoryStore;

// Initialize MySQL pool if configured
function getMySQLConfig() {
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'bakasur_food_tour_1';
  const port = parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10);

  return { host, user, password, database, port };
}

let mysqlConnectionAttempted = false;
let isMySQLHealthy = false;
let lastMySQLFailTime = 0;
const MYSQL_RETRY_INTERVAL_MS = 30000;

export function getMySQLPool(): mysql.Pool | null {
  if (Date.now() - lastMySQLFailTime < MYSQL_RETRY_INTERVAL_MS) {
    return null;
  }
  if (globalForDB.mysqlPool) return globalForDB.mysqlPool;
  try {
    const config = getMySQLConfig();
    const pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000
    });
    globalForDB.mysqlPool = pool;
    return pool;
  } catch {
    lastMySQLFailTime = Date.now();
    return null;
  }
}

export async function testMySQLConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const pool = getMySQLPool();
    if (!pool) throw new Error("Could not initialize MySQL pool");

    await pool.query('SELECT 1 as val');
    isMySQLHealthy = true;
    const config = getMySQLConfig();
    return { success: true, message: `Connected to MySQL database "${config.database}" at ${config.host}:${config.port}` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    isMySQLHealthy = false;
    return { success: false, message: `MySQL Connection Failed: ${errorMsg}` };
  }
}

export function getDatabaseStatus() {
  return {
    engine: isMySQLHealthy ? 'MySQL' : 'Local Smart Engine (MySQL Schema Ready)',
    isMySQLHealthy,
    config: {
      host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
      database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'bakasur_food_tour_1',
      user: process.env.MYSQL_USER || process.env.DB_USER || 'root'
    }
  };
}

// ==========================================================
// RESTAURANT VERIFICATION SCHEMA (auto-migration, idempotent)
// ==========================================================
// Adds verification columns to `restaurants`. Existing rows default to
// is_verified = 0 (kept for history/admin review, hidden from users).
const VERIFICATION_COLUMNS: Array<{ name: string; ddl: string }> = [
  { name: 'swiggy_id', ddl: 'ADD COLUMN `swiggy_id` varchar(32) DEFAULT NULL' },
  { name: 'verification_source', ddl: 'ADD COLUMN `verification_source` varchar(32) DEFAULT NULL' },
  { name: 'fssai_license', ddl: 'ADD COLUMN `fssai_license` varchar(20) DEFAULT NULL' },
  { name: 'is_verified', ddl: 'ADD COLUMN `is_verified` tinyint(1) NOT NULL DEFAULT 0' },
  { name: 'verified_at', ddl: 'ADD COLUMN `verified_at` timestamp NULL DEFAULT NULL' }
];

export async function ensureRestaurantVerificationSchema(pool: mysql.Pool): Promise<boolean> {
  if (!globalForDB.verificationSchemaReady) {
    globalForDB.verificationSchemaReady = (async () => {
      try {
        const [cols] = await pool.query<mysql.RowDataPacket[]>(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'restaurants'`
        );
        const existing = new Set(cols.map(c => String(c.COLUMN_NAME).toLowerCase()));
        const missing = VERIFICATION_COLUMNS.filter(c => !existing.has(c.name));
        if (missing.length > 0) {
          await pool.query(`ALTER TABLE restaurants ${missing.map(c => c.ddl).join(', ')}`);
        }
        const [idx] = await pool.query<mysql.RowDataPacket[]>(
          `SHOW INDEX FROM restaurants WHERE Key_name = 'idx_restaurants_swiggy'`
        );
        if (!idx || idx.length === 0) {
          await pool.query('ALTER TABLE restaurants ADD INDEX `idx_restaurants_swiggy` (`swiggy_id`)');
        }

        // Auto-ensure user_id column on campaign_visits for user-scoped visit tracking
        const [visitCols] = await pool.query<mysql.RowDataPacket[]>(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campaign_visits' AND COLUMN_NAME = 'user_id'`
        );
        if (!visitCols || visitCols.length === 0) {
          await pool.query('ALTER TABLE campaign_visits ADD COLUMN `user_id` VARCHAR(100) NULL AFTER `session_id`');
          await pool.query('ALTER TABLE campaign_visits ADD INDEX `idx_visit_user` (`user_id`)').catch(() => { });
        }

        // Auto-ensure user_id column on campaign_sessions
        const [sessCols] = await pool.query<mysql.RowDataPacket[]>(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campaign_sessions' AND COLUMN_NAME = 'user_id'`
        );
        if (!sessCols || sessCols.length === 0) {
          await pool.query('ALTER TABLE campaign_sessions ADD COLUMN `user_id` VARCHAR(100) NULL AFTER `session_id`');
          await pool.query('ALTER TABLE campaign_sessions ADD INDEX `idx_sess_user` (`user_id`)').catch(() => { });
        }

        return true;
      } catch (err) {
        console.warn('Restaurant verification schema migration notice:', err instanceof Error ? err.message : err);
        globalForDB.verificationSchemaReady = undefined; // retry on next call
        return false;
      }
    })();
  }
  return globalForDB.verificationSchemaReady;
}

// ==========================================================
// DB SERVICE METHODS (Universal Abstracted API)
// ==========================================================

export const db = {
  // RESTAURANTS
  // User-facing callers get verified restaurants only; admin passes includeUnverified.
  async getRestaurants(options?: { city?: string; area?: string; search?: string; limit?: number; includeUnverified?: boolean }) {
    try {
      const pool = getMySQLPool();
      if (pool) {
        await ensureRestaurantVerificationSchema(pool);
        let sql = 'SELECT * FROM restaurants WHERE status = "active"';
        if (!options?.includeUnverified) {
          sql += ' AND is_verified = 1';
        }
        const params: unknown[] = [];
        if (options?.city && options.city !== 'All') {
          sql += ' AND LOWER(city) = LOWER(?)';
          params.push(options.city);
        }
        if (options?.search && options.search.trim()) {
          const rawQ = options.search.trim().toLowerCase();
          const cleanTokens = rawQ
            .replace(/\b(hotel|restaurant|resturant|restro|cafe|dhaba|pure\s+veg|veg|bar|stall|the|and|&)\b/gi, ' ')
            .split(/\s+/)
            .map(t => t.trim())
            .filter(t => t.length >= 2);

          const primaryToken = cleanTokens[0] || rawQ;
          const term = `%${rawQ}%`;
          const tokenTerm = `%${primaryToken}%`;

          sql += ' AND (LOWER(name) LIKE ? OR LOWER(area) LIKE ? OR LOWER(description) LIKE ? OR LOWER(address) LIKE ? OR LOWER(name) LIKE ?)';
          params.push(term, term, term, term, tokenTerm);
          sql += ` ORDER BY (CASE WHEN LOWER(name) LIKE ? THEN 1 WHEN LOWER(name) LIKE ? THEN 2 ELSE 3 END), total_visits DESC, rating DESC`;
          params.push(term, tokenTerm);
        } else if (options?.area && options.area !== 'All' && options.area !== 'All Areas') {
          sql += ' AND (LOWER(area) LIKE ? OR LOWER(address) LIKE ?)';
          const aTerm = `%${options.area.toLowerCase().trim()}%`;
          params.push(aTerm, aTerm);
          sql += ' ORDER BY total_visits DESC, rating DESC';
        } else {
          sql += ' ORDER BY total_visits DESC, rating DESC';
        }
        if (options?.limit) {
          sql += ' LIMIT ?';
          params.push(options.limit);
        }
        const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, params);
        if (rows && rows.length > 0) {
          return rows.map(r => ({
            id: Number(r.id),
            name: String(r.name),
            city: String(r.city),
            address: String(r.address || ''),
            area: String(r.area || ''),
            latitude: Number(r.latitude || 0),
            longitude: Number(r.longitude || 0),
            rating: Number(r.rating || 4.5),
            image: String(r.image || ''),
            description: String(r.description || ''),
            is_campaign_active: Number(r.is_campaign_active ?? 1),
            total_visits: Number(r.total_visits || 0),
            status: (r.status || 'active') as 'active' | 'inactive',
            swiggy_id: r.swiggy_id ? String(r.swiggy_id) : null,
            is_verified: Number(r.is_verified || 0),
            verification_source: r.verification_source ? String(r.verification_source) : null,
            fssai_license: r.fssai_license ? String(r.fssai_license) : null,
            verified_at: r.verified_at ? new Date(r.verified_at).toISOString() : null,
            is_veg: r.is_veg !== undefined && r.is_veg !== null ? Number(r.is_veg) : (isPureVegRestaurantName(String(r.name)) ? 1 : 0),
            cuisine_tags: (r.cuisine_tags as string[]) || []
          }));
        }
        return [];
      }
    } catch (err) {
      lastMySQLFailTime = Date.now();
      console.warn('MySQL getRestaurants fallback to memoryStore');
    }

    let list = [...memoryStore.restaurants].filter(
      r => r.status === 'active' && (options?.includeUnverified || r.is_verified === 1)
    );

    if (options?.city && options.city !== 'All') {
      list = list.filter(r => r.city.toLowerCase() === options.city?.toLowerCase());
    }

    // If searching, ignore area constraint to allow finding spots anywhere in the city
    if (options?.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();

      const normalize = (str: string) => {
        return str.toLowerCase()
          .replace(/ruplai|rupali|roopali/g, 'roopali')
          .replace(/ishan|ishaan/g, 'ishan')
          .replace(/jagdamb|jagadamb|jagadamba/g, 'jagdamb')
          .replace(/vaishali|vishali/g, 'vaishali')
          .replace(/bedekar|bedkar/g, 'bedekar')
          .replace(/katakirr|katakir/g, 'katakirr')
          .replace(/goodluck|good\s*luck/g, 'goodluck')
          .replace(/sujata|sujatha/g, 'sujata');
      };

      const normalizedQuery = normalize(q);
      const rawWords = q.split(/\s+/).filter(w => w.length > 0);
      const noiseWords = new Set(['hotel', 'restaurant', 'cafe', 'dhaba', 'house', 'bar', 'spot', 'corner', 'center']);
      const significantWords = rawWords.filter(w => !noiseWords.has(w));
      const searchTokens = (significantWords.length > 0 ? significantWords : rawWords).map(w => normalize(w));

      list = list.filter(r => {
        const fullText = normalize(`${r.name} ${r.area} ${r.city} ${r.address} ${r.description}`);
        const rName = normalize(r.name);
        if (fullText.includes(normalizedQuery) || rName.includes(normalizedQuery)) return true;

        // Name match has highest priority
        const nameHasToken = searchTokens.some(token => rName.includes(token));
        if (nameHasToken) return true;

        // If not in name, only accept if non-food brand words match (avoids matching Panchali for Behrouz Biryani)
        const nonFoodTokens = searchTokens.filter(t => !['biryani', 'pizza', 'burger', 'dosa', 'chai', 'misal', 'thali', 'momo', 'sandwich', 'special'].includes(t));
        if (nonFoodTokens.length > 0) {
          return nonFoodTokens.some(token => fullText.includes(token));
        }

        return searchTokens.some(token => fullText.includes(token));
      });

      // Sort by name relevance first!
      list.sort((a, b) => {
        const aName = normalize(a.name);
        const bName = normalize(b.name);
        const aExact = aName.includes(normalizedQuery) ? 2 : (searchTokens.some(t => aName.includes(t)) ? 1 : 0);
        const bExact = bName.includes(normalizedQuery) ? 2 : (searchTokens.some(t => bName.includes(t)) ? 1 : 0);
        if (aExact !== bExact) return bExact - aExact;
        return (b.total_visits || 0) - (a.total_visits || 0);
      });
    } else if (options?.area && options.area !== 'All' && options.area !== 'All Areas') {
      const a = options.area.toLowerCase().trim();
      const filtered = list.filter(r =>
        r.area.toLowerCase().includes(a) ||
        a.includes(r.area.toLowerCase()) ||
        r.address.toLowerCase().includes(a) ||
        r.name.toLowerCase().includes(a)
      );
      if (filtered.length > 0) {
        list = filtered;
      }
    }

    if (options?.limit) {
      list = list.slice(0, options.limit);
    }

    return list;
  },

  async getRestaurantById(id: number) {
    try {
      const pool = getMySQLPool();
      if (pool) {
        await ensureRestaurantVerificationSchema(pool);
        const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM restaurants WHERE id = ?', [id]);
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: Number(r.id),
            name: String(r.name),
            city: String(r.city),
            address: String(r.address || ''),
            area: String(r.area || ''),
            latitude: Number(r.latitude || 0),
            longitude: Number(r.longitude || 0),
            rating: Number(r.rating || 4.5),
            image: String(r.image || ''),
            description: String(r.description || ''),
            is_campaign_active: Number(r.is_campaign_active ?? 1),
            total_visits: Number(r.total_visits || 0),
            status: (r.status || 'active') as 'active' | 'inactive',
            swiggy_id: r.swiggy_id ? String(r.swiggy_id) : null,
            is_verified: Number(r.is_verified ?? 1),
            verification_source: r.verification_source ? String(r.verification_source) : 'verified_registry',
            fssai_license: r.fssai_license ? String(r.fssai_license) : null,
            verified_at: r.verified_at ? new Date(r.verified_at).toISOString() : null,
            is_veg: r.is_veg !== undefined && r.is_veg !== null ? Number(r.is_veg) : (isPureVegRestaurantName(String(r.name)) ? 1 : 0)
          };
        }
      }
    } catch { }
    return memoryStore.restaurants.find(r => r.id === id) || null;
  },

  async createRestaurant(data: Omit<Restaurant, 'id'>) {
    const id = memoryStore.restaurants.length ? Math.max(...memoryStore.restaurants.map(r => r.id)) + 1 : 1;
    const newRest: Restaurant = { ...data, id };
    memoryStore.restaurants.push(newRest);

    try {
      const pool = getMySQLPool();
      if (pool) {
        const [result] = await pool.query<mysql.ResultSetHeader>(
          `INSERT INTO restaurants (name, description, address, area, city, latitude, longitude, rating, image, is_campaign_active, total_visits, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.name,
            data.description || '',
            data.address,
            data.area || data.city,
            data.city,
            data.latitude || 18.5204,
            data.longitude || 73.8407,
            data.rating || 4.5,
            data.image || '',
            data.is_campaign_active ?? 1,
            data.total_visits || 0,
            data.status || 'active'
          ]
        );
        if (result.insertId) {
          newRest.id = result.insertId;
        }
      }
    } catch (err) {
      console.warn('MySQL createRestaurant warning:', err);
    }

    return newRest;
  },

  async updateRestaurant(id: number, data: Partial<Restaurant>) {
    const idx = memoryStore.restaurants.findIndex(r => r.id === id);
    if (idx !== -1) {
      memoryStore.restaurants[idx] = { ...memoryStore.restaurants[idx], ...data, updated_at: new Date().toISOString() };
    }
    try {
      const pool = getMySQLPool();
      if (pool) {
        const fields: string[] = [];
        const values: unknown[] = [];
        for (const [k, v] of Object.entries(data)) {
          if (k !== 'id') {
            fields.push(`${k} = ?`);
            values.push(v);
          }
        }
        if (fields.length > 0) {
          values.push(id);
          await pool.query(`UPDATE restaurants SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
        }
      }
    } catch { }
    return idx !== -1 ? memoryStore.restaurants[idx] : null;
  },

  async deleteRestaurant(id: number) {
    const idx = memoryStore.restaurants.findIndex(r => r.id === id);
    if (idx !== -1) {
      memoryStore.restaurants.splice(idx, 1);
      memoryStore.dishes = memoryStore.dishes.filter(d => d.restaurant_id !== id);
    }
    try {
      const pool = getMySQLPool();
      if (pool) {
        await pool.query('DELETE FROM dishes WHERE restaurant_id = ?', [id]);
        await pool.query('DELETE FROM restaurants WHERE id = ?', [id]);
      }
    } catch { }
    return true;
  },

  // DISHES
  async getAllDishes(options?: { restaurantId?: number; search?: string }) {
    try {
      const pool = getMySQLPool();
      if (pool) {
        let sql = 'SELECT * FROM dishes WHERE status = "active"';
        const params: unknown[] = [];
        if (options?.restaurantId) {
          sql += ' AND restaurant_id = ?';
          params.push(options.restaurantId);
        }
        if (options?.search) {
          sql += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)';
          const term = `%${options.search.toLowerCase()}%`;
          params.push(term, term);
        }
        sql += ' ORDER BY popularity DESC, rating DESC';
        const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, params);
        if (rows && rows.length > 0) {
          return rows.map(d => ({
            id: Number(d.id),
            restaurant_id: Number(d.restaurant_id),
            name: String(d.name),
            description: String(d.description || ''),
            price: Number(d.price || 0),
            image: String(d.image || ''),
            rating: Number(d.rating || 4.5),
            popularity: Number(d.popularity || 0),
            is_recommended: Number(d.is_recommended ?? 1),
            status: (d.status || 'active') as 'active' | 'inactive'
          }));
        }
      }
    } catch (err) {
      console.warn('MySQL getAllDishes fallback:', err);
    }

    let list = [...memoryStore.dishes].filter(d => d.status === 'active');
    if (options?.restaurantId) {
      list = list.filter(d => d.restaurant_id === options.restaurantId);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.popularity - a.popularity);
  },

  async getDishesByRestaurant(restaurantId: number, options?: { search?: string }): Promise<Dish[]> {
    try {
      const pool = getMySQLPool();
      if (pool) {
        let sql = 'SELECT * FROM dishes WHERE restaurant_id = ? AND status = "active"';
        const params: unknown[] = [restaurantId];
        if (options?.search) {
          sql += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)';
          const term = `%${options.search.toLowerCase()}%`;
          params.push(term, term);
        }
        sql += ' ORDER BY popularity DESC, rating DESC';
        const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, params);
        if (rows && rows.length > 0) {
          return rows.map(d => ({
            id: Number(d.id),
            restaurant_id: Number(d.restaurant_id),
            name: String(d.name),
            description: String(d.description || ''),
            price: Number(d.price || 0),
            image: String(d.image || ''),
            rating: Number(d.rating || 4.5),
            popularity: Number(d.popularity || 0),
            is_recommended: Number(d.is_recommended ?? 1),
            status: (d.status || 'active') as 'active' | 'inactive'
          }));
        }
      }
    } catch { }

    if (memoryStore.dishes.length === 0) {
      memoryStore.seed();
    }
    let list = memoryStore.dishes.filter(d => d.restaurant_id === restaurantId && d.status === 'active');
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.popularity - a.popularity);
  },

  async getDishById(id: number) {
    try {
      const pool = getMySQLPool();
      if (pool) {
        const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM dishes WHERE id = ?', [id]);
        if (rows && rows.length > 0) {
          const d = rows[0];
          return {
            id: Number(d.id),
            restaurant_id: Number(d.restaurant_id),
            name: String(d.name),
            description: String(d.description || ''),
            price: Number(d.price || 0),
            image: String(d.image || ''),
            rating: Number(d.rating || 4.5),
            popularity: Number(d.popularity || 0),
            is_recommended: Number(d.is_recommended ?? 1),
            status: (d.status || 'active') as 'active' | 'inactive'
          };
        }
      }
    } catch { }
    return memoryStore.dishes.find(d => d.id === id) || null;
  },

  async getCategories(): Promise<Category[]> {
    return [
      { id: 1, slug: 'biryani-rice', name: 'Biryani & Rice', hindiName: 'बिरयानी और चावल', icon: '🍚', signatureImage: '/api/ai/dish-image?dish=Biryani' },
      { id: 2, slug: 'north-indian-curries', name: 'North Indian & Mughlai', hindiName: 'उत्तर भारतीय और मुगलई', icon: '🥘', signatureImage: '/api/ai/dish-image?dish=Butter%20Chicken' },
      { id: 3, slug: 'maharashtrian-local', name: 'Maharashtrian Special', hindiName: 'महाराष्ट्रीयन स्पेशल', icon: '🍲', signatureImage: '/api/ai/dish-image?dish=Misal%20Pav' },
      { id: 4, slug: 'street-food-chaat', name: 'Street Food & Chaat', hindiName: 'स्ट्रीट फूड और चाट', icon: '🥪', signatureImage: '/api/ai/dish-image?dish=Vada%20Pav' },
      { id: 5, slug: 'south-indian-tiffin', name: 'South Indian & Tiffin', hindiName: 'साउथ इंडियन और नाश्ता', icon: '🥞', signatureImage: '/api/ai/dish-image?dish=Masala%20Dosa' },
      { id: 6, slug: 'kebabs-tandoori', name: 'Kebabs & Tandoor', hindiName: 'कबाब और तंदूरी', icon: '🍢', signatureImage: '/api/ai/dish-image?dish=Tandoori%20Chicken' },
      { id: 7, slug: 'chinese-asian', name: 'Chinese & Momos', hindiName: 'चाइनीज और मोमोज', icon: '🥟', signatureImage: '/api/ai/dish-image?dish=Momos' },
      { id: 8, slug: 'burgers-pizzas', name: 'Pizzas & Burgers', hindiName: 'पिज़्ज़ा और बर्गर', icon: '🍕', signatureImage: '/api/ai/dish-image?dish=Pizza' },
      { id: 9, slug: 'chai-cafe-beverages', name: 'Chai, Coffee & Cafe', hindiName: 'चाय, कॉफी और कैफे', icon: '☕', signatureImage: '/api/ai/dish-image?dish=Bun%20Maska' },
      { id: 10, slug: 'desserts-sweets', name: 'Desserts & Sweets', hindiName: 'मिठाई और आइसक्रीम', icon: '🍨', signatureImage: '/api/ai/dish-image?dish=Falooda' },
      { id: 11, slug: 'coastal-seafood', name: 'Coastal & Seafood', hindiName: 'सीफूड और फिश', icon: '🐟', signatureImage: '/api/ai/dish-image?dish=Seafood' },
      { id: 12, slug: 'traditional-thali', name: 'Grand Indian Thalis', hindiName: 'शाही थाली', icon: '🍽️', signatureImage: '/api/ai/dish-image?dish=Veg%20Thali' }
    ];
  },

  async getMenusByRestaurant(restaurantId: number): Promise<RestaurantMenu[]> {
    const dishes = await this.getDishesByRestaurant(restaurantId);
    return [
      {
        id: restaurantId * 10 + 1,
        restaurant_id: restaurantId,
        name: 'Recommended Signature Menu',
        is_active: 1,
        dishes: dishes.filter(d => d.is_recommended)
      },
      {
        id: restaurantId * 10 + 2,
        restaurant_id: restaurantId,
        name: 'Full Restaurant Menu',
        is_active: 1,
        dishes
      }
    ];
  },

  async createDish(data: Omit<Dish, 'id'>) {
    const id = memoryStore.dishes.length ? Math.max(...memoryStore.dishes.map(d => d.id)) + 1 : 1;
    const newDish: Dish = { ...data, id };
    memoryStore.dishes.push(newDish);

    try {
      const pool = getMySQLPool();
      if (pool) {
        const [result] = await pool.query<mysql.ResultSetHeader>(
          `INSERT INTO dishes (restaurant_id, name, description, price, image, rating, popularity, is_recommended, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.restaurant_id,
            data.name,
            data.description || '',
            data.price || 0,
            data.image || '',
            data.rating || 4.5,
            data.popularity || 90,
            data.is_recommended ?? 1,
            data.status || 'active'
          ]
        );
        if (result.insertId) {
          newDish.id = result.insertId;
        }
      }
    } catch (err) {
      console.warn('MySQL createDish warning:', err);
    }

    return newDish;
  },

  async updateDish(id: number, data: Partial<Dish>) {
    const idx = memoryStore.dishes.findIndex(d => d.id === id);
    if (idx !== -1) {
      memoryStore.dishes[idx] = { ...memoryStore.dishes[idx], ...data, updated_at: new Date().toISOString() };
    }
    try {
      const pool = getMySQLPool();
      if (pool) {
        const fields: string[] = [];
        const values: unknown[] = [];
        for (const [k, v] of Object.entries(data)) {
          if (k !== 'id') {
            fields.push(`${k} = ?`);
            values.push(v);
          }
        }
        if (fields.length > 0) {
          values.push(id);
          await pool.query(`UPDATE dishes SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
        }
      }
    } catch { }
    return idx !== -1 ? memoryStore.dishes[idx] : null;
  },

  async deleteDish(id: number) {
    const idx = memoryStore.dishes.findIndex(d => d.id === id);
    if (idx !== -1) {
      memoryStore.dishes.splice(idx, 1);
    }
    try {
      const pool = getMySQLPool();
      if (pool) {
        await pool.query('DELETE FROM dishes WHERE id = ?', [id]);
      }
    } catch { }
    return true;
  },

  // VIDEOS & CAMPAIGN STAGES
  async getBakasurVideos(restaurantId?: number | null, dishId?: number | null) {
    try {
      const pool = getMySQLPool();
      if (pool) {
        const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM bakasur_videos WHERE status = "active" ORDER BY stage_number ASC, id ASC');
        if (rows && rows.length > 0) {
          const all = rows.map(v => ({
            id: Number(v.id),
            restaurant_id: v.restaurant_id ? Number(v.restaurant_id) : undefined,
            dish_id: v.dish_id ? Number(v.dish_id) : undefined,
            stage: String(v.stage),
            stage_number: Number(v.stage_number || 1),
            video_url: String(v.video_url),
            thumbnail: v.thumbnail ? String(v.thumbnail) : undefined,
            duration: Number(v.duration || 15),
            meter_percentage: Number(v.meter_percentage || 20),
            message: String(v.message || ''),
            cta_text: v.cta_text ? String(v.cta_text) : '🍽️ AUR KHILO',
            status: (v.status || 'active') as 'active' | 'inactive'
          }));

          if (restaurantId && dishId) {
            const spec = all.filter(v => v.restaurant_id === restaurantId && v.dish_id === dishId);
            if (spec.length > 0) return spec;
          }
          if (restaurantId) {
            const restVideos = all.filter(v => v.restaurant_id === restaurantId && !v.dish_id);
            if (restVideos.length > 0) return restVideos;
          }
          return all.filter(v => (!v.restaurant_id && !v.dish_id) || v.stage === 'generic');
        }
      }
    } catch { }

    // 1. Look for specific restaurant + dish videos
    if (restaurantId && dishId) {
      const specific = memoryStore.videos.filter(v => v.restaurant_id === restaurantId && v.dish_id === dishId && v.status === 'active');
      if (specific.length > 0) return specific;
    }

    // 2. Look for specific restaurant videos
    if (restaurantId) {
      const restVideos = memoryStore.videos.filter(v => v.restaurant_id === restaurantId && !v.dish_id && v.status === 'active');
      if (restVideos.length > 0) return restVideos;
    }

    // 3. Fallback to generic stage videos
    return memoryStore.videos.filter(v => (!v.restaurant_id && !v.dish_id) || v.stage === 'generic');
  },

  async getAllVideos() {
    try {
      const pool = getMySQLPool();
      if (pool) {
        const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM bakasur_videos ORDER BY stage_number ASC, id ASC');
        if (rows && rows.length > 0) {
          return rows.map(v => ({
            id: Number(v.id),
            restaurant_id: v.restaurant_id ? Number(v.restaurant_id) : undefined,
            dish_id: v.dish_id ? Number(v.dish_id) : undefined,
            stage: String(v.stage),
            stage_number: Number(v.stage_number || 1),
            video_url: String(v.video_url),
            thumbnail: v.thumbnail ? String(v.thumbnail) : undefined,
            duration: Number(v.duration || 15),
            meter_percentage: Number(v.meter_percentage || 20),
            message: String(v.message || ''),
            cta_text: v.cta_text ? String(v.cta_text) : '🍽️ AUR KHILO',
            status: (v.status || 'active') as 'active' | 'inactive'
          }));
        }
      }
    } catch { }
    return memoryStore.videos;
  },

  async createVideo(data: Omit<BakasurVideo, 'id'>) {
    const id = memoryStore.videos.length ? Math.max(...memoryStore.videos.map(v => v.id)) + 1 : 1;
    const newVideo: BakasurVideo = { ...data, id };
    memoryStore.videos.push(newVideo);

    try {
      const pool = getMySQLPool();
      if (pool) {
        const [result] = await pool.query<mysql.ResultSetHeader>(
          `INSERT INTO bakasur_videos (restaurant_id, dish_id, stage, stage_number, video_url, thumbnail, duration, meter_percentage, message, cta_text, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.restaurant_id || null,
            data.dish_id || null,
            data.stage,
            data.stage_number || 1,
            data.video_url,
            data.thumbnail || null,
            data.duration || 15,
            data.meter_percentage || 20,
            data.message,
            data.cta_text || '🍽️ AUR KHILO',
            data.status || 'active'
          ]
        );
        if (result.insertId) {
          newVideo.id = result.insertId;
        }
      }
    } catch (err) {
      console.warn('MySQL createVideo warning:', err);
    }

    return newVideo;
  },

  async updateVideo(id: number, data: Partial<BakasurVideo>) {
    const idx = memoryStore.videos.findIndex(v => v.id === id);
    if (idx !== -1) {
      memoryStore.videos[idx] = { ...memoryStore.videos[idx], ...data, updated_at: new Date().toISOString() };
    }
    try {
      const pool = getMySQLPool();
      if (pool) {
        const fields: string[] = [];
        const values: unknown[] = [];
        for (const [k, v] of Object.entries(data)) {
          if (k !== 'id') {
            fields.push(`${k} = ?`);
            values.push(v);
          }
        }
        if (fields.length > 0) {
          values.push(id);
          await pool.query(`UPDATE bakasur_videos SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
        }
      }
    } catch { }
    return idx !== -1 ? memoryStore.videos[idx] : null;
  },

  async deleteVideo(id: number) {
    const idx = memoryStore.videos.findIndex(v => v.id === id);
    if (idx !== -1) {
      memoryStore.videos.splice(idx, 1);
    }
    try {
      const pool = getMySQLPool();
      if (pool) {
        await pool.query('DELETE FROM bakasur_videos WHERE id = ?', [id]);
      }
    } catch { }
    return true;
  },

  // SESSIONS & USER JOURNEYS
  async getSession(sessionId: string): Promise<CampaignSession | null> {
    return memoryStore.sessions.get(sessionId) || null;
  },

  async createOrUpdateSession(data: Partial<CampaignSession> & { session_id: string }): Promise<CampaignSession> {
    const existing = memoryStore.sessions.get(data.session_id);
    const session: CampaignSession = {
      id: existing ? existing.id : memoryStore.sessions.size + 1,
      session_id: data.session_id,
      user_id: data.user_id ?? existing?.user_id ?? null,
      user_location: data.user_location ?? existing?.user_location ?? null,
      latitude: data.latitude ?? existing?.latitude ?? null,
      longitude: data.longitude ?? existing?.longitude ?? null,
      restaurant_id: data.restaurant_id ?? existing?.restaurant_id ?? null,
      dish_id: data.dish_id ?? existing?.dish_id ?? null,
      current_stage: data.current_stage ?? existing?.current_stage ?? 'stage_1',
      current_step: data.current_step ?? existing?.current_step ?? 'start',
      step_count: data.step_count ?? existing?.step_count ?? 1,
      food_meter_percentage: data.food_meter_percentage ?? existing?.food_meter_percentage ?? 20,
      aur_khilo_clicks: data.aur_khilo_clicks ?? existing?.aur_khilo_clicks ?? 0,
      video_completed: data.video_completed ?? existing?.video_completed ?? 0,
      map_visited: data.map_visited ?? existing?.map_visited ?? 0,
      form_submitted: data.form_submitted ?? existing?.form_submitted ?? 0,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.sessions.set(data.session_id, session);

    // Persist to MySQL
    try {
      const pool = getMySQLPool();
      if (pool) {
        await pool.query(
          `INSERT INTO campaign_sessions (session_id, user_id, user_location, latitude, longitude, restaurant_id, dish_id, current_stage, current_step, food_meter_percentage, aur_khilo_clicks, map_visited, form_submitted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             user_id = COALESCE(VALUES(user_id), user_id),
             user_location = COALESCE(VALUES(user_location), user_location),
             latitude = COALESCE(VALUES(latitude), latitude),
             longitude = COALESCE(VALUES(longitude), longitude),
             restaurant_id = COALESCE(VALUES(restaurant_id), restaurant_id),
             dish_id = COALESCE(VALUES(dish_id), dish_id),
             current_stage = VALUES(current_stage),
             current_step = VALUES(current_step),
             food_meter_percentage = COALESCE(VALUES(food_meter_percentage), food_meter_percentage),
             aur_khilo_clicks = COALESCE(VALUES(aur_khilo_clicks), aur_khilo_clicks),
             map_visited = GREATEST(COALESCE(VALUES(map_visited), 0), map_visited),
             form_submitted = GREATEST(COALESCE(VALUES(form_submitted), 0), form_submitted),
             updated_at = CURRENT_TIMESTAMP`,
          [
            session.session_id,
            session.user_id || null,
            session.user_location,
            session.latitude,
            session.longitude,
            session.restaurant_id,
            session.dish_id,
            session.current_stage,
            session.current_step || 'start',
            session.food_meter_percentage,
            session.aur_khilo_clicks,
            session.map_visited || 0,
            session.form_submitted || 0
          ]
        );
      }
    } catch (err) {
      console.warn('MySQL createOrUpdateSession warning:', err instanceof Error ? err.message : String(err));
    }

    return session;
  },

  async logJourneyStep(data: {
    session_id: string;
    step_name: string;
    step_title?: string;
    step_number?: number;
    metadata?: Record<string, unknown> | null;
    user_location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    restaurant_id?: number | null;
    dish_id?: number | null;
    food_meter_percentage?: number;
    ip_address?: string | null;
    user_agent?: string | null;
  }): Promise<UserJourneyStep> {
    const existingSteps = memoryStore.journeySteps.filter(s => s.session_id === data.session_id);
    const stepNumber = data.step_number && data.step_number > 0 ? data.step_number : existingSteps.length + 1;

    const step: UserJourneyStep = {
      id: memoryStore.journeySteps.length + 1,
      session_id: data.session_id,
      step_number: stepNumber,
      step_name: data.step_name,
      step_title: data.step_title || data.step_name.replace(/_/g, ' ').toUpperCase(),
      metadata: data.metadata || null,
      user_location: data.user_location || null,
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      created_at: new Date().toISOString()
    };

    memoryStore.journeySteps.push(step);

    // Update session state in memoryStore
    const existingSess = memoryStore.sessions.get(data.session_id);
    const updatedSess: CampaignSession = {
      id: existingSess ? existingSess.id : memoryStore.sessions.size + 1,
      session_id: data.session_id,
      user_location: data.user_location ?? existingSess?.user_location ?? null,
      latitude: data.latitude ?? existingSess?.latitude ?? null,
      longitude: data.longitude ?? existingSess?.longitude ?? null,
      restaurant_id: data.restaurant_id ?? existingSess?.restaurant_id ?? null,
      dish_id: data.dish_id ?? existingSess?.dish_id ?? null,
      current_stage: data.step_name,
      current_step: data.step_name,
      step_count: existingSteps.length + 1,
      food_meter_percentage: data.food_meter_percentage ?? existingSess?.food_meter_percentage ?? 20,
      aur_khilo_clicks: existingSess?.aur_khilo_clicks ?? 0,
      video_completed: existingSess?.video_completed ?? 0,
      map_visited: data.step_name === 'map' ? 1 : (existingSess?.map_visited ?? 0),
      form_submitted: data.step_name === 'pass' || data.step_name === 'contest_submitted' ? 1 : (existingSess?.form_submitted ?? 0),
      created_at: existingSess?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.sessions.set(data.session_id, updatedSess);

    // Persist to MySQL if available (non-blocking)
    try {
      const pool = getMySQLPool();
      if (pool) {
        await pool.query(
          `INSERT INTO campaign_sessions (session_id, user_location, latitude, longitude, restaurant_id, dish_id, current_stage, food_meter_percentage)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             user_location = COALESCE(VALUES(user_location), user_location),
             latitude = COALESCE(VALUES(latitude), latitude),
             longitude = COALESCE(VALUES(longitude), longitude),
             restaurant_id = COALESCE(VALUES(restaurant_id), restaurant_id),
             dish_id = COALESCE(VALUES(dish_id), dish_id),
             current_stage = VALUES(current_stage),
             food_meter_percentage = COALESCE(VALUES(food_meter_percentage), food_meter_percentage),
             updated_at = CURRENT_TIMESTAMP`,
          [
            data.session_id,
            data.user_location || null,
            data.latitude || null,
            data.longitude || null,
            data.restaurant_id || null,
            data.dish_id || null,
            data.step_name,
            data.food_meter_percentage || 20
          ]
        );

        await pool.query(
          `INSERT INTO user_journey_steps (session_id, step_number, step_name, step_title, metadata, user_location, ip_address, user_agent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.session_id,
            stepNumber,
            data.step_name,
            step.step_title,
            data.metadata ? JSON.stringify(data.metadata) : null,
            data.user_location || null,
            data.ip_address || null,
            data.user_agent || null
          ]
        );
      }
    } catch (dbErr) {
      console.warn('MySQL step log warning:', dbErr instanceof Error ? dbErr.message : String(dbErr));
    }

    return step;
  },

  async getJourneyBySession(sessionId: string): Promise<UserJourneyStep[]> {
    try {
      const pool = getMySQLPool();
      if (pool) {
        const [rows] = await pool.query<mysql.RowDataPacket[]>(
          'SELECT * FROM user_journey_steps WHERE session_id = ? ORDER BY step_number ASC',
          [sessionId]
        );
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: Number(r.id),
            session_id: String(r.session_id),
            step_number: Number(r.step_number),
            step_name: String(r.step_name),
            step_title: String(r.step_title || ''),
            metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
            user_location: r.user_location,
            ip_address: r.ip_address,
            user_agent: r.user_agent,
            created_at: String(r.created_at)
          }));
        }
      }
    } catch {
      // fallback to memory
    }
    return memoryStore.journeySteps
      .filter(s => s.session_id === sessionId)
      .sort((a, b) => a.step_number - b.step_number);
  },

  async getAllSessionsWithJourneys(limit = 100) {
    try {
      const pool = getMySQLPool();
      if (pool) {
        const [sessRows] = await pool.query<mysql.RowDataPacket[]>(
          'SELECT * FROM campaign_sessions ORDER BY updated_at DESC LIMIT ?',
          [limit]
        );

        if (sessRows && sessRows.length > 0) {
          const result = [];
          for (const s of sessRows) {
            const [stepRows] = await pool.query<mysql.RowDataPacket[]>(
              'SELECT * FROM user_journey_steps WHERE session_id = ? ORDER BY step_number ASC',
              [s.session_id]
            );
            const steps = (stepRows || []).map(r => ({
              id: Number(r.id),
              session_id: String(r.session_id),
              step_number: Number(r.step_number),
              step_name: String(r.step_name),
              step_title: String(r.step_title || ''),
              metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
              user_location: r.user_location,
              ip_address: r.ip_address,
              user_agent: r.user_agent,
              created_at: String(r.created_at)
            }));

            result.push({
              session: {
                id: Number(s.id),
                session_id: String(s.session_id),
                user_location: s.user_location,
                latitude: s.latitude ? Number(s.latitude) : null,
                longitude: s.longitude ? Number(s.longitude) : null,
                restaurant_id: s.restaurant_id ? Number(s.restaurant_id) : null,
                dish_id: s.dish_id ? Number(s.dish_id) : null,
                current_stage: String(s.current_stage || 'start'),
                current_step: String(s.current_step || s.current_stage || 'start'),
                step_count: steps.length,
                food_meter_percentage: Number(s.food_meter_percentage || 20),
                aur_khilo_clicks: Number(s.aur_khilo_clicks || 0),
                video_completed: Number(s.video_completed || 0),
                map_visited: Number(s.map_visited || 0),
                form_submitted: Number(s.form_submitted || 0),
                created_at: String(s.created_at),
                updated_at: String(s.updated_at || s.created_at)
              },
              steps,
              totalSteps: steps.length,
              lastStep: steps.length > 0 ? steps[steps.length - 1] : null
            });
          }
          return result;
        }
      }
    } catch (err) {
      console.warn('MySQL getAllSessionsWithJourneys fallback:', err);
    }

    const sessionsList = Array.from(memoryStore.sessions.values()).sort(
      (a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
    ).slice(0, limit);

    return sessionsList.map(sess => {
      const steps = memoryStore.journeySteps
        .filter(s => s.session_id === sess.session_id)
        .sort((a, b) => a.step_number - b.step_number);
      return {
        session: sess,
        steps,
        totalSteps: steps.length,
        lastStep: steps.length > 0 ? steps[steps.length - 1] : null
      };
    });
  },


  // VISITS & MAP
  async recordVisit(data: {
    session_id: string;
    user_id?: string;
    restaurant_id: number;
    restaurant_name?: string;
    dish_id?: number | null;
    dish_name?: string;
    city: string;
    latitude: number;
    longitude: number;
    round_number?: number;
  }) {
    const id = memoryStore.visits.length + 1;
    const matchedRest = memoryStore.restaurants.find(r => r.id === data.restaurant_id);
    let finalRestName = (data.restaurant_name || matchedRest?.name || 'Local Food Spot').trim();
    const finalDishName = (data.dish_name || 'Signature Dish').trim();
    const roundNumber = Number(data.round_number) || 1;

    // Server-side verification: restaurant_id is the Swiggy restaurant id chosen in the UI.
    const normMatch = (s: string) => (s || '').toLowerCase().replace(/\b(hotel|restaurant|pure veg|veg|cafe|the|and)\b/gi, '').replace(/[^a-z0-9]/g, '');
    const verification = await verifySwiggyRestaurant(data.restaurant_id, {
      lat: data.latitude,
      lng: data.longitude
    }).catch(() => null);
    const rawProfile = verification && verification.verified ? verification.profile : null;
    const verifiedProfile = rawProfile && (
      !data.restaurant_name ||
      (normMatch(rawProfile.name) && normMatch(data.restaurant_name) && (
        normMatch(rawProfile.name).includes(normMatch(data.restaurant_name)) ||
        normMatch(data.restaurant_name).includes(normMatch(rawProfile.name))
      ))
    ) ? rawProfile : null;
    if (verifiedProfile) {
      finalRestName = verifiedProfile.name;
      data.latitude = verifiedProfile.latitude;
      data.longitude = verifiedProfile.longitude;
      data.city = verifiedProfile.city || data.city;
    }

    // Resolve accurate coordinates & city for the restaurant
    const resolvedLoc = resolveBestCoordsForRestaurant(
      finalRestName,
      data.city,
      data.city,
      data.latitude,
      data.longitude
    );
    data.latitude = resolvedLoc.lat;
    data.longitude = resolvedLoc.lng;
    data.city = resolvedLoc.city || data.city || 'Pune';

    const visit: CampaignVisit = {
      id,
      session_id: data.session_id,
      user_id: data.user_id,
      restaurant_id: data.restaurant_id,
      restaurant_name: finalRestName,
      dish_id: data.dish_id ?? null,
      dish_name: finalDishName,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      visited_at: new Date().toISOString(),
      round_number: roundNumber
    };

    const isPlaceholderDish = (d?: string | null) => {
      const clean = String(d || '').trim().toLowerCase();
      return !clean || clean === 'signature dish' || clean === 'specialty dish';
    };

    // Update memoryStore only if same session, round, restaurant AND (same dish or placeholder dish)
    const existingIndex = memoryStore.visits.findIndex(
      v =>
        v.session_id === data.session_id &&
        (v.round_number || 1) === roundNumber &&
        (v.restaurant_name || '').trim().toLowerCase() === finalRestName.toLowerCase() &&
        (
          (v.dish_name || '').trim().toLowerCase() === finalDishName.toLowerCase() ||
          isPlaceholderDish(v.dish_name)
        )
    );
    if (existingIndex >= 0) {
      memoryStore.visits[existingIndex].dish_name = finalDishName;
      memoryStore.visits[existingIndex].dish_id = data.dish_id ?? null;
      memoryStore.visits[existingIndex].restaurant_name = finalRestName;
      memoryStore.visits[existingIndex].city = data.city;
      memoryStore.visits[existingIndex].latitude = data.latitude;
      memoryStore.visits[existingIndex].longitude = data.longitude;
      memoryStore.visits[existingIndex].round_number = roundNumber;
    } else {
      memoryStore.visits.push(visit);
      if (matchedRest) {
        matchedRest.total_visits = (matchedRest.total_visits || 0) + 1;
      }
    }

    // Persist to MySQL
    try {
      const pool = getMySQLPool();
      if (pool) {
        // 1. Ensure city is recorded in locations table
        let locationId = 1;
        if (data.city && data.city.trim()) {
          const cleanCity = data.city.trim();
          await pool.query(
            `INSERT INTO locations (name, slug, region, is_active, display_order)
             VALUES (?, LOWER(REPLACE(?, ' ', '-')), ?, 1, 99)
             ON DUPLICATE KEY UPDATE is_active = 1`,
            [cleanCity, cleanCity, cleanCity]
          ).catch(() => { });

          const [locRows] = await pool.query<mysql.RowDataPacket[]>(
            'SELECT id FROM locations WHERE LOWER(name) = LOWER(?) LIMIT 1',
            [cleanCity]
          );
          if (locRows && locRows.length > 0) {
            locationId = Number(locRows[0].id);
          }
        }

        // 2. Link or register the restaurant in restaurants table
        await ensureRestaurantVerificationSchema(pool);
        let targetRestaurantId = 0;
        if (verifiedProfile) {
          const p = verifiedProfile;
          const [existingRest] = await pool.query<mysql.RowDataPacket[]>(
            'SELECT id FROM restaurants WHERE swiggy_id = ? LIMIT 1',
            [p.swiggyId]
          );
          if (existingRest && existingRest.length > 0) {
            targetRestaurantId = Number(existingRest[0].id);
            await pool.query(
              `UPDATE restaurants
               SET name = ?, address = ?, area = ?, city = ?, latitude = ?, longitude = ?, rating = ?,
                   image = ?, description = ?, fssai_license = ?, verification_source = 'swiggy',
                   is_verified = 1, verified_at = CURRENT_TIMESTAMP, status = 'active',
                   total_visits = total_visits + 1
               WHERE id = ?`,
              [p.name, p.address, p.area, p.city, p.latitude, p.longitude, p.rating, p.imageUrl || null,
              p.cuisines.join(', '), p.fssaiLicense, targetRestaurantId]
            ).catch((err) => console.warn('Verified restaurant update notice:', err));
          } else {
            const slug = `${p.name}-${p.swiggyId}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const [insertRes] = await pool.query<mysql.ResultSetHeader>(
              `INSERT INTO restaurants (location_id, name, slug, address, area, city, latitude, longitude, rating, image,
                                        description, is_campaign_active, total_visits, status, swiggy_id,
                                        verification_source, fssai_license, is_verified, verified_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'active', ?, 'swiggy', ?, 1, CURRENT_TIMESTAMP)`,
              [locationId, p.name, slug, p.address, p.area, p.city, p.latitude, p.longitude, p.rating,
                p.imageUrl || null, p.cuisines.join(', '), p.swiggyId, p.fssaiLicense]
            ).catch((err) => {
              console.warn('Verified restaurant insert notice:', err);
              return [{ insertId: 0 }];
            });
            if (insertRes && insertRes.insertId) {
              targetRestaurantId = insertRes.insertId;
            }
          }
        }

        if (!targetRestaurantId && finalRestName) {
          const [existingByName] = await pool.query<mysql.RowDataPacket[]>(
            'SELECT id FROM restaurants WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
            [finalRestName]
          );
          if (existingByName && existingByName.length > 0) {
            targetRestaurantId = Number(existingByName[0].id);
            await pool.query(
              'UPDATE restaurants SET total_visits = total_visits + 1, status = "active", latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude), city = COALESCE(?, city) WHERE id = ?',
              [data.latitude, data.longitude, data.city, targetRestaurantId]
            ).catch(() => { });
          } else {
            const slug = `${finalRestName}-${Date.now().toString(36)}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 140);
            const [insertRest] = await pool.query<mysql.ResultSetHeader>(
              `INSERT INTO restaurants (location_id, name, slug, address, area, city, latitude, longitude, rating, is_campaign_active, total_visits, status, verification_source, is_verified, verified_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 4.7, 1, 1, 'active', 'user_visit', 1, CURRENT_TIMESTAMP)`,
              [locationId, finalRestName, slug, data.city || 'Pune', data.city || 'Pune', data.city || 'Pune', data.latitude || 18.5204, data.longitude || 73.8407]
            ).catch(() => [{ insertId: 0 }] as any);
            if (insertRest && insertRest.insertId) {
              targetRestaurantId = Number(insertRest.insertId);
            }
          }
        }

        // 3. Store the selected dish in dishes table if not already present
        if (finalDishName && !isPlaceholderDish(finalDishName) && targetRestaurantId) {
          const [existingDish] = await pool.query<mysql.RowDataPacket[]>(
            'SELECT id FROM dishes WHERE restaurant_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
            [targetRestaurantId, finalDishName]
          );
          if (!existingDish || existingDish.length === 0) {
            const dishSlug = finalDishName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 140);
            await pool.query(
              `INSERT INTO dishes (restaurant_id, name, slug, description, price, rating, popularity, is_recommended, status)
               VALUES (?, ?, ?, ?, 150, 4.7, 95, 1, 'active')`,
              [targetRestaurantId, finalDishName, dishSlug, `Signature dish at ${finalRestName}`]
            ).catch(() => { });
          }
        }

        // 4. Save/Update visit in campaign_visits:
        //    - If the user searches/selects a NEW dish (even at the same restaurant), INSERT a new row so all searched dishes are recorded and counted!
        //    - Only UPDATE if an entry for the same (session_id, round_number, restaurant_name) within 30 mins had a placeholder dish or the exact same dish_name.
        const [existing] = await pool.query<mysql.RowDataPacket[]>(
          `SELECT id FROM campaign_visits
           WHERE session_id = ?
             AND COALESCE(round_number, 1) = ?
             AND LOWER(TRIM(restaurant_name)) = LOWER(TRIM(?))
             AND (
               LOWER(TRIM(COALESCE(dish_name, ''))) = LOWER(TRIM(?))
               OR LOWER(TRIM(COALESCE(dish_name, ''))) IN ('signature dish', 'specialty dish', '')
             )
             AND visited_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
           ORDER BY id DESC LIMIT 1`,
          [data.session_id, roundNumber, finalRestName, finalDishName]
        );

        if (existing && existing.length > 0) {
          const keepId = existing[0].id;
          await pool.query(
            `UPDATE campaign_visits 
             SET restaurant_id = ?, dish_id = ?, dish_name = ?, restaurant_name = ?, city = ?, latitude = ?, longitude = ?, round_number = ?, user_id = COALESCE(?, user_id), visited_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [targetRestaurantId, data.dish_id ?? null, finalDishName, finalRestName, data.city, data.latitude, data.longitude, roundNumber, data.user_id || null, keepId]
          );
        } else {
          await pool.query(
            `INSERT INTO campaign_visits (session_id, user_id, restaurant_id, dish_id, city, latitude, longitude, restaurant_name, dish_name, round_number)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              data.session_id,
              data.user_id || null,
              targetRestaurantId,
              data.dish_id ?? null,
              data.city,
              data.latitude,
              data.longitude,
              finalRestName,
              finalDishName,
              roundNumber
            ]
          );
        }
      }
    } catch (err) {
      console.warn('MySQL recordVisit warning:', err instanceof Error ? err.message : String(err));
    }

    return visit;
  },

  async getMapData(
    sessionOrOptions?: string | { sessionId?: string; userId?: string; mobile?: string; sessionIds?: string[] },
    extraOptions?: { userId?: string; mobile?: string; sessionIds?: string[] }
  ) {
    // Live Food Tour Map (100% driven by campaign_visits):
    //  - BLUE pins: current user's session stops (Stop 1, Stop 2, ...)
    //  - RED pins: all other searched/visited restaurants from campaign_visits
    //  - Food spots counter: distinct restaurants in campaign_visits
    //  - No of dishes counter: total number of dishes searched by users overall in campaign_visits

    const sessionId = typeof sessionOrOptions === 'string' ? sessionOrOptions : sessionOrOptions?.sessionId;
    const opts = (typeof sessionOrOptions === 'object' && sessionOrOptions !== null)
      ? sessionOrOptions
      : (extraOptions || {});
    const userId = opts.userId?.trim() || undefined;
    const mobile = opts.mobile?.trim() || undefined;
    const sessionIdsList = (opts.sessionIds || []).map(s => String(s || '').trim()).filter(Boolean);
    if (sessionId && !sessionIdsList.includes(sessionId)) {
      sessionIdsList.push(sessionId);
    }

    const getRestaurantKey = (name: string): string => {
      if (!name) return 'unknown';
      const baseName = name.split(/[,-]/)[0].trim();
      const clean = baseName.toLowerCase()
        .replace(/\b(hotel|restaurant|pure veg|veg|cafe|stall|bhel|snacks|the|special|bar|and)\b/gi, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
      return clean || baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    const isValidCoord = (lat: number, lng: number): boolean =>
      Number.isFinite(lat) && Number.isFinite(lng) && lat >= 6 && lat <= 37.5 && lng >= 68 && lng <= 97.5;

    const userSessionIds = new Set<string>(sessionIdsList);
    if (sessionId) userSessionIds.add(sessionId);

    let dbFoodSpots = 0;
    let dbDishes = 0;
    let dbCities = 0;
    let visitedPoints: any[] = [];
    let currentUserSpots: any[] = [];
    let loadedFromDb = false;

    try {
      const pool = getMySQLPool();
      if (pool) {
        // A. Expand user session IDs if mobile or userId provided
        if (mobile) {
          const cleanMobile = mobile.replace(/\D/g, '');
          const tenDigit = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;
          if (tenDigit) {
            const [partRows] = await pool.query<mysql.RowDataPacket[]>(
              'SELECT DISTINCT session_id FROM participants WHERE mobile = ? OR mobile LIKE ?',
              [tenDigit, `%${tenDigit}`]
            );
            partRows.forEach(r => { if (r.session_id) userSessionIds.add(String(r.session_id)); });
          }
        }
        if (userId) {
          const [sessRows] = await pool.query<mysql.RowDataPacket[]>(
            'SELECT DISTINCT session_id FROM campaign_sessions WHERE user_id = ? UNION SELECT DISTINCT session_id FROM campaign_visits WHERE user_id = ?',
            [userId, userId]
          );
          sessRows.forEach(r => { if (r.session_id) userSessionIds.add(String(r.session_id)); });
        }

        // B. Fetch all campaign visits across all users & sessions
        const [cvRows] = await pool.query<mysql.RowDataPacket[]>(`
          SELECT cv.id, cv.session_id, cv.user_id, cv.restaurant_id,
                 COALESCE(cv.round_number, 1) AS round_number,
                 COALESCE(NULLIF(TRIM(cv.restaurant_name), ''), r.name) AS restaurant_name,
                 COALESCE(NULLIF(TRIM(cv.dish_name), ''), d.name, 'Signature Dish') AS dish_name,
                 COALESCE(NULLIF(TRIM(cv.city), ''), NULLIF(TRIM(r.city), ''), 'Pune') AS city,
                 COALESCE(cv.latitude, r.latitude) AS latitude,
                 COALESCE(cv.longitude, r.longitude) AS longitude,
                 COALESCE(r.rating, 4.8) AS rating,
                 COALESCE(r.image, '') AS image,
                 COALESCE(r.address, '') AS address,
                 cv.visited_at
          FROM campaign_visits cv
          LEFT JOIN restaurants r ON cv.restaurant_id = r.id
          LEFT JOIN dishes d ON cv.dish_id = d.id
          WHERE cv.restaurant_name IS NOT NULL AND TRIM(cv.restaurant_name) != ''
          ORDER BY cv.visited_at ASC, cv.id ASC
        `);

        // Resolve accurate coordinates for each visit row
        const enrichedVisits = cvRows.map(v => {
          const restName = String(v.restaurant_name || '').trim();
          const rawCity = String(v.city || 'Pune').trim();
          const resolved = resolveBestCoordsForRestaurant(
            restName,
            rawCity,
            rawCity,
            Number(v.latitude),
            Number(v.longitude)
          );
          return {
            ...v,
            restaurant_name: restName,
            city: resolved.city || rawCity || 'Pune',
            latitude: resolved.lat,
            longitude: resolved.lng
          };
        });

                // C. Determine current user's spots strictly for the active session (do not mix previous sessions)
        const userVisits = enrichedVisits.filter(v =>
          sessionId
            ? v.session_id === sessionId
            : (v.session_id && userSessionIds.has(v.session_id))
        );

        const roundMap = new Map<number, any>();
        userVisits.forEach(v => {
          const rNum = Number(v.round_number) || 1;
          roundMap.set(rNum, v);
        });

        const sortedRounds = Array.from(roundMap.entries()).sort((a, b) => a[0] - b[0]);
        currentUserSpots = sortedRounds.map(([roundNum, v], idx) => ({
          id: Number(v.id),
          session_id: String(v.session_id || ''),
          restaurant_id: Number(v.restaurant_id || 0),
          name: String(v.restaurant_name),
          city: String(v.city || 'Pune'),
          latitude: Number(v.latitude),
          longitude: Number(v.longitude),
          rating: Number(v.rating || 4.8),
          image: String(v.image || ''),
          featured_dish: String(v.dish_name || 'Signature Dish'),
          isCurrentUserSpot: true,
          stopNumber: idx + 1
        }));

        const currentUserNameKeys = new Set(
          currentUserSpots.map(s => getRestaurantKey(s.name))
        );

        // D. Assemble map pins strictly from campaign_visits
        const spotsMap = new Map<string, any>();

        enrichedVisits.forEach(v => {
          const restName = String(v.restaurant_name || '').trim();
          const lat = Number(v.latitude);
          const lng = Number(v.longitude);
          if (!restName || !isValidCoord(lat, lng)) return;

          const nameKey = getRestaurantKey(restName);
          if (currentUserNameKeys.has(nameKey)) return;

          const existing = spotsMap.get(nameKey);
          if (existing) {
            existing.total_visits = (existing.total_visits || 1) + 1;
            if (v.dish_name && String(v.dish_name).toLowerCase() !== 'signature dish') {
              existing.featured_dish = String(v.dish_name);
            }
          } else {
            spotsMap.set(nameKey, {
              id: Number(v.restaurant_id || v.id),
              name: restName,
              address: String(v.address || v.city || ''),
              city: String(v.city || 'Pune'),
              latitude: lat,
              longitude: lng,
              rating: Number(v.rating || 4.8),
              image: String(v.image || ''),
              total_visits: 1,
              featured_dish: String(v.dish_name || 'Signature Dish'),
              isCurrentUserSpot: false,
              isHistorical: true
            });
          }
        });

        currentUserSpots.forEach(s => {
          if (isValidCoord(s.latitude, s.longitude)) {
            spotsMap.set(`user_stop_${s.stopNumber || 1}`, {
              id: s.restaurant_id || (999900 + (s.stopNumber || 1)),
              name: s.name,
              address: s.city || '',
              city: s.city || 'Pune',
              latitude: s.latitude,
              longitude: s.longitude,
              rating: s.rating || 4.8,
              image: s.image || '',
              total_visits: 1,
              featured_dish: s.featured_dish || 'Signature Dish',
              isCurrentUserSpot: true,
              isHistorical: false,
              stopNumber: s.stopNumber || 1
            });
          }
        });

        visitedPoints = Array.from(spotsMap.values());
        visitedPoints.sort((a, b) => {
          if (a.isCurrentUserSpot && b.isCurrentUserSpot) {
            return (a.stopNumber || 1) - (b.stopNumber || 1);
          }
          if (a.isCurrentUserSpot) return -1;
          if (b.isCurrentUserSpot) return 1;
          return (b.total_visits || 0) - (a.total_visits || 0);
        });

        // E. Exact counters from campaign_visits:
        //    - Food spots: distinct restaurants visited in campaign_visits
        //    - No of dishes: total number of dishes searched by users overall in campaign_visits
        const [[rCount]] = await pool.query<mysql.RowDataPacket[]>(`
          SELECT COUNT(DISTINCT LOWER(TRIM(restaurant_name))) as c
          FROM campaign_visits
          WHERE restaurant_name IS NOT NULL AND TRIM(restaurant_name) != ''
        `);

        const [[dCount]] = await pool.query<mysql.RowDataPacket[]>(`
          SELECT COUNT(*) as c
          FROM campaign_visits
          WHERE dish_name IS NOT NULL
            AND TRIM(dish_name) != ''
            AND LOWER(TRIM(dish_name)) NOT IN ('signature dish', 'specialty dish')
        `);

        const [[cCount]] = await pool.query<mysql.RowDataPacket[]>(`
          SELECT COUNT(DISTINCT LOWER(TRIM(city))) as c
          FROM campaign_visits
          WHERE city IS NOT NULL AND TRIM(city) != ''
        `);

        dbFoodSpots = Number(rCount?.c ?? 0);
        dbDishes = Number(dCount?.c ?? 0);
        dbCities = Number(cCount?.c ?? 0);
        loadedFromDb = true;
      }
    } catch (err) {
      console.warn('MySQL getMapData query warning:', err);
    }

    if (!loadedFromDb) {
      const allVisits = memoryStore.visits || [];
      const distinctSpots = new Set(allVisits.map(v => (v.restaurant_name || '').trim().toLowerCase()).filter(Boolean));
      const validDishesCount = allVisits.filter(v => {
        const d = (v.dish_name || '').trim().toLowerCase();
        return d && d !== 'signature dish' && d !== 'specialty dish';
      }).length;
      const distinctCities = new Set(allVisits.map(v => (v.city || '').trim().toLowerCase()).filter(Boolean));

      dbFoodSpots = distinctSpots.size;
      dbDishes = validDishesCount;
      dbCities = distinctCities.size;
    }

    return {
      points: visitedPoints,
      stats: {
        foodSpots: dbFoodSpots,
        mustTryDishes: dbDishes,
        citiesCount: dbCities
      },
      currentUserPoint: currentUserSpots[0] || null,
      currentUserSpots,
      historicalSpots: visitedPoints.filter(p => p.isHistorical)
    };
  },

  // PARTICIPANTS & USER REGISTRATION
  async getParticipantByMobile(mobile: string): Promise<(Participant & { already_registered?: boolean }) | null> {
    const clean = (mobile || '').replace(/\D/g, '');
    if (!clean) return null;
    const tenDigit = clean.length >= 10 ? clean.slice(-10) : clean;

    try {
      const pool = getMySQLPool();
      if (pool) {
        const [rows] = await pool.query<mysql.RowDataPacket[]>(
          `SELECT * FROM participants 
           WHERE mobile = ? OR mobile = ? OR mobile = ? OR mobile LIKE ?
           ORDER BY id DESC LIMIT 1`,
          [tenDigit, `+91${tenDigit}`, `91${tenDigit}`, `%${tenDigit}`]
        );
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: Number(r.id),
            session_id: String(r.session_id),
            participation_id: String(r.participation_id),
            name: String(r.name),
            mobile: String(r.mobile),
            email: String(r.email),
            city: String(r.city),
            restaurant_id: r.restaurant_id ? Number(r.restaurant_id) : null,
            restaurant_name: r.restaurant_name ? String(r.restaurant_name) : undefined,
            dish_id: r.dish_id ? Number(r.dish_id) : null,
            dish_name: r.dish_name ? String(r.dish_name) : undefined,
            consent: Number(r.consent),
            terms_accepted: Number(r.terms_accepted),
            created_at: String(r.created_at)
          };
        }
      }
    } catch (err) {
      console.warn('MySQL getParticipantByMobile error:', err instanceof Error ? err.message : String(err));
    }

    const found = memoryStore.participants.find(p => {
      const pClean = (p.mobile || '').replace(/\D/g, '');
      return pClean === tenDigit || pClean.endsWith(tenDigit);
    });
    return found || null;
  },

  async createParticipant(data: {
    session_id: string;
    name: string;
    mobile: string;
    email: string;
    city: string;
    restaurant_id?: number | null;
    restaurant_name?: string;
    dish_id?: number | null;
    dish_name?: string;
    consent: number;
    terms_accepted: number;
  }): Promise<Participant & { already_registered?: boolean }> {
    const cleanMobile = (data.mobile || '').replace(/\D/g, '');
    const tenDigit = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

    // 1. STRICT CHECK: Check if mobile number is ALREADY REGISTERED (No duplicate entries allowed)
    const existing = await this.getParticipantByMobile(tenDigit);
    if (existing) {
      return { ...existing, already_registered: true };
    }

    const id = memoryStore.participants.length + 1;
    const randCode = Math.floor(100000 + Math.random() * 900000);
    const participation_id = `BKT-${randCode}`;

    const participant: Participant = {
      id,
      session_id: data.session_id,
      participation_id,
      name: data.name,
      mobile: tenDigit,
      email: data.email,
      city: data.city,
      restaurant_id: data.restaurant_id || null,
      restaurant_name: data.restaurant_name,
      dish_id: data.dish_id || null,
      dish_name: data.dish_name,
      consent: data.consent,
      terms_accepted: data.terms_accepted,
      created_at: new Date().toISOString()
    };

    memoryStore.participants.push(participant);

    // mark session submitted
    const session = memoryStore.sessions.get(data.session_id);
    if (session) {
      session.form_submitted = 1;
      session.updated_at = new Date().toISOString();
    }

    // Persist directly to MySQL database tables
    try {
      const pool = getMySQLPool();
      if (pool) {
        // 1. Insert into MySQL participants table
        await pool.query(
          `INSERT INTO participants (session_id, participation_id, name, mobile, email, city, restaurant_id, restaurant_name, dish_id, dish_name, consent, terms_accepted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.session_id,
            participation_id,
            data.name,
            tenDigit,
            data.email,
            data.city,
            data.restaurant_id || null,
            data.restaurant_name || null,
            data.dish_id || null,
            data.dish_name || null,
            data.consent ? 1 : 0,
            data.terms_accepted ? 1 : 1
          ]
        );

        // 2. Also insert into tour_submissions if available
        try {
          let rid = (typeof data.restaurant_id === 'number' && Number.isInteger(data.restaurant_id) && data.restaurant_id > 0) ? data.restaurant_id : null;
          let did = (typeof data.dish_id === 'number' && Number.isInteger(data.dish_id) && data.dish_id > 0) ? data.dish_id : null;
          if (rid !== null) {
            const [rRows] = await pool.query<mysql.RowDataPacket[]>('SELECT id FROM restaurants WHERE id = ? LIMIT 1', [rid]);
            if (!rRows || rRows.length === 0) rid = null;
          }
          if (did !== null) {
            const [dRows] = await pool.query<mysql.RowDataPacket[]>('SELECT id FROM dishes WHERE id = ? LIMIT 1', [did]);
            if (!dRows || dRows.length === 0) did = null;
          }
          await pool.query(
            `INSERT INTO tour_submissions (session_id, location_name, restaurant_id, restaurant_name, dish_id, dish_name, spice_level, is_relieved)
             VALUES (?, ?, ?, ?, ?, ?, 3, 1)`,
            [
              data.session_id,
              data.city,
              rid,
              data.restaurant_name || 'Food Spot',
              did,
              data.dish_name || 'Specialty'
            ]
          );
        } catch (subErr) {
          console.warn('MySQL tour_submissions notice:', subErr instanceof Error ? subErr.message : String(subErr));
        }

        // 3. Update campaign_sessions table
        try {
          const [upResult] = await pool.query<mysql.ResultSetHeader>(
            `UPDATE campaign_sessions SET form_submitted = 1, current_stage = 'pass', updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
            [data.session_id]
          );
          if (upResult.affectedRows === 0) {
            await pool.query(
              `INSERT INTO campaign_sessions (session_id, user_location, form_submitted, current_stage, restaurant_id, dish_id)
               VALUES (?, ?, 1, 'pass', ?, ?)`,
              [data.session_id, data.city, data.restaurant_id || null, data.dish_id || null]
            );
          }
        } catch (sessErr) {
          console.warn('MySQL campaign_sessions notice:', sessErr instanceof Error ? sessErr.message : String(sessErr));
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('ER_DUP_ENTRY') || errMsg.includes('Duplicate entry')) {
        const found = await this.getParticipantByMobile(tenDigit);
        if (found) {
          return { ...found, already_registered: true };
        }
      }
      console.warn('MySQL participant insert warning:', errMsg);
    }

    return participant;
  },

  async getParticipants(options?: { search?: string; city?: string }) {
    try {
      const pool = getMySQLPool();
      if (pool) {
        let sql = 'SELECT * FROM participants WHERE 1=1';
        const params: unknown[] = [];
        if (options?.city && options.city !== 'All') {
          sql += ' AND LOWER(city) = LOWER(?)';
          params.push(options.city);
        }
        if (options?.search) {
          sql += ' AND (name LIKE ? OR mobile LIKE ? OR email LIKE ? OR participation_id LIKE ?)';
          const term = `%${options.search}%`;
          params.push(term, term, term, term);
        }
        sql += ' ORDER BY created_at DESC';
        const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, params);
        if (rows && rows.length > 0) {
          const list = rows.map(r => ({
            id: Number(r.id),
            session_id: String(r.session_id),
            participation_id: String(r.participation_id),
            name: String(r.name),
            mobile: String(r.mobile),
            email: String(r.email),
            city: String(r.city),
            restaurant_name: r.restaurant_name ? String(r.restaurant_name) : undefined,
            dish_name: r.dish_name ? String(r.dish_name) : undefined,
            consent: Number(r.consent),
            terms_accepted: Number(r.terms_accepted),
            created_at: String(r.created_at)
          }));

          // Self-heal: If any participant has missing or generic dish_name or restaurant_name, resolve from user_journey_steps
          for (const item of list) {
            if ((!item.dish_name || item.dish_name === 'Signature Specialty' || !item.restaurant_name || item.restaurant_name === 'Local Food Spot') && item.session_id) {
              try {
                const [steps] = await pool.query<mysql.RowDataPacket[]>(
                  `SELECT metadata FROM user_journey_steps WHERE session_id = ? AND (step_name = 'dish_selected' OR step_name = 'eating' OR step_name = 'restaurant_selected' OR step_name = 'pass') ORDER BY id DESC LIMIT 10`,
                  [item.session_id]
                );
                if (steps && steps.length > 0) {
                  for (const s of steps) {
                    try {
                      const meta = typeof s.metadata === 'string' ? JSON.parse(s.metadata) : s.metadata;
                      if ((!item.dish_name || item.dish_name === 'Signature Specialty') && meta?.dish_name) {
                        item.dish_name = String(meta.dish_name).trim();
                      }
                      if ((!item.restaurant_name || item.restaurant_name === 'Local Food Spot') && meta?.restaurant_name) {
                        item.restaurant_name = String(meta.restaurant_name).trim();
                      }
                    } catch { }
                  }
                }
              } catch { }
            }
          }

          return list;
        }
      }
    } catch {
      // fallback to memory
    }

    let list = [...memoryStore.participants];
    if (options?.city && options.city !== 'All') {
      list = list.filter(p => p.city.toLowerCase() === options.city?.toLowerCase());
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.participation_id.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // ANALYTICS (100% REAL LIVE DB DATA - ZERO STATIC / ARTIFICIAL OFFSETS)
  async getAnalytics() {
    try {
      const pool = getMySQLPool();
      if (pool) {
        const [[sessCount]] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as c FROM campaign_sessions');
        isMySQLHealthy = true;
        const [[clicksCount]] = await pool.query<mysql.RowDataPacket[]>('SELECT COALESCE(SUM(aur_khilo_clicks), 0) as c FROM campaign_sessions');
        const [[completedCount]] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as c FROM campaign_sessions WHERE current_stage IN ("acidity", "relief_done", "pass") OR food_meter_percentage >= 80');
        const [[partCount]] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as c FROM participants');
        const [[visitsCount]] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as c FROM campaign_visits');

        const [popularRestaurants] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM restaurants ORDER BY total_visits DESC, rating DESC LIMIT 5');
        const [popularDishes] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM dishes ORDER BY popularity DESC, rating DESC LIMIT 5');

        const totalSessions = Number(sessCount?.c || 0);
        const totalClicks = Number(clicksCount?.c || 0);
        const totalCompleted = Number(completedCount?.c || 0);
        const totalSubmissions = Number(partCount?.c || 0);
        const totalVisits = Number(visitsCount?.c || 0);

        return {
          totalUsers: totalSessions,
          totalToursStarted: totalSessions,
          totalAurKhiloClicks: totalClicks,
          totalCompletedTours: totalCompleted,
          totalSubmissions,
          totalVisits,
          popularRestaurants: (popularRestaurants as any[]).map(r => ({
            id: Number(r.id),
            name: String(r.name),
            city: String(r.city),
            address: String(r.address || ''),
            area: String(r.area || ''),
            rating: Number(r.rating || 4.5),
            image: String(r.image || ''),
            total_visits: Number(r.total_visits || 0),
            description: String(r.description || ''),
            is_campaign_active: 1,
            latitude: Number(r.latitude || 0),
            longitude: Number(r.longitude || 0),
            status: 'active' as const
          })),
          popularDishes: (popularDishes as any[]).map(d => ({
            id: Number(d.id),
            restaurant_id: Number(d.restaurant_id),
            name: String(d.name),
            price: Number(d.price || 0),
            rating: Number(d.rating || 4.5),
            popularity: Number(d.popularity || 0),
            image: String(d.image || ''),
            description: String(d.description || ''),
            is_recommended: 1,
            status: 'active' as const
          })),
          dbStatus: getDatabaseStatus()
        };
      }
    } catch (err) {
      console.warn('MySQL getAnalytics error:', err);
    }

    // In-memory fallback (exact genuine counts without any fake additions)
    const totalToursStarted = memoryStore.sessions.size;
    const totalAurKhiloClicks = Array.from(memoryStore.sessions.values()).reduce((sum, s) => sum + (s.aur_khilo_clicks || 0), 0);
    const totalCompletedTours = Array.from(memoryStore.sessions.values()).filter(s => s.current_stage === 'acidity' || s.current_stage === 'relief_done' || s.current_stage === 'pass' || s.food_meter_percentage >= 80).length;
    const totalSubmissions = memoryStore.participants.length;
    const totalVisits = memoryStore.visits.length;

    return {
      totalUsers: totalToursStarted,
      totalToursStarted,
      totalAurKhiloClicks,
      totalCompletedTours,
      totalSubmissions,
      totalVisits,
      popularRestaurants: [...memoryStore.restaurants].sort((a, b) => (b.total_visits || 0) - (a.total_visits || 0)).slice(0, 5),
      popularDishes: [...memoryStore.dishes].sort((a, b) => b.popularity - a.popularity).slice(0, 5),
      dbStatus: getDatabaseStatus()
    };
  },

  // CLEAR ALL DB DATA
  async clearAllData() {
    try {
      const pool = getMySQLPool();
      if (pool) {
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        const tables = [
          'campaign_visits',
          'user_journey_steps',
          'participants',
          'campaign_sessions',
          'dish_video_mappings',
          'dishes',
          'menus',
          'restaurants',
          'categories',
          'locations',
          'tour_submissions'
        ];
        for (const t of tables) {
          try {
            await pool.query(`TRUNCATE TABLE ${t}`);
          } catch { }
        }
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
      }
    } catch (err) {
      console.warn('MySQL clearAllData warning:', err);
    }

    memoryStore.restaurants = [];
    memoryStore.dishes = [];
    memoryStore.sessions.clear();
    memoryStore.visits = [];
    memoryStore.participants = [];
    memoryStore.journeySteps = [];

    return { success: true, message: 'All database data successfully cleared.' };
  },

  // RESET / RE-SEED
  async resetAndSeed() {
    memoryStore.seed();
    return { success: true, message: "Database re-seeded successfully!" };
  }
};
