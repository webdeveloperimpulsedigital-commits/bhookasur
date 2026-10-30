import type { Dish } from './db';
import { getDishVisualAssets, isDishVeg, isPureVegRestaurantName } from './dishAssets';
import { withBasePath } from './basePath';

export interface DishTemplate {
  name: string;
  description: string;
  price: number;
  image: string;
  popularity: number;
  rating: number;
  category?: string;
  is_veg?: number;
}

export function inferDishCategory(name: string, description?: string): string {
  const nameLower = (name || '').trim().toLowerCase();
  const descLower = (description || '').trim().toLowerCase();

  // Helper for whole word or boundary match
  const hasWord = (str: string, pattern: string) =>
    new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, 'i').test(str);

  // 1. Upvas Special (Fasting Food)
  if (
    hasWord(nameLower, 'sabudana') || hasWord(nameLower, 'upvas') || hasWord(nameLower, 'upwas') ||
    hasWord(nameLower, 'bhagar') || hasWord(nameLower, 'varai') || hasWord(nameLower, 'farali') ||
    hasWord(nameLower, 'ratalyacha') || hasWord(nameLower, 'rajgira') || hasWord(nameLower, 'sweet potato chaat')
  ) {
    return 'Upvas Special';
  }

  // 2. Maharashtrian Thali & Traditional Meals
  if (
    hasWord(nameLower, 'thali') || hasWord(nameLower, 'bhojan') || hasWord(nameLower, 'meals') ||
    hasWord(nameLower, 'gavran thali') || hasWord(nameLower, 'combo') || hasWord(nameLower, 'mini meal')
  ) {
    return 'Maharashtrian Thali';
  }

  // 3. Dal, Varan and Amti
  if (
    hasWord(nameLower, 'varan') || hasWord(nameLower, 'amti') || hasWord(nameLower, 'aamti') ||
    hasWord(nameLower, 'katachi amti') || hasWord(nameLower, 'goda amti') || hasWord(nameLower, 'kadhi') ||
    hasWord(nameLower, 'takachi kadhi') || hasWord(nameLower, 'danyachi amti') || hasWord(nameLower, 'shengdana amti') ||
    hasWord(nameLower, 'solkadhi') || hasWord(nameLower, 'sol kadhi') || hasWord(nameLower, 'kairichi dal') ||
    hasWord(nameLower, 'ambat varan') || hasWord(nameLower, 'toor dal') || hasWord(nameLower, 'sadha varan')
  ) {
    return 'Dal, Varan and Amti';
  }

  // 4. Rice and Bhat
  if (
    hasWord(nameLower, 'masale bhat') || hasWord(nameLower, 'masale bhaat') || hasWord(nameLower, 'masala bhat') ||
    hasWord(nameLower, 'masala bhaat') || hasWord(nameLower, 'varan bhat') || hasWord(nameLower, 'amti bhat') ||
    hasWord(nameLower, 'tup bhat') || hasWord(nameLower, 'fodnicha bhat') || hasWord(nameLower, 'phodnicha bhat') ||
    hasWord(nameLower, 'vangi bhat') || hasWord(nameLower, 'tondli bhat') || hasWord(nameLower, 'matki bhat') ||
    hasWord(nameLower, 'valache bhat') || hasWord(nameLower, 'matar bhat') || hasWord(nameLower, 'goda masale bhat') ||
    hasWord(nameLower, 'indrayani') || hasWord(nameLower, 'ambemohar') || hasWord(nameLower, 'kolam') ||
    hasWord(nameLower, 'khichdi') || hasWord(nameLower, 'biryani') || hasWord(nameLower, 'pulao') ||
    hasWord(nameLower, 'pulav') || hasWord(nameLower, 'curd rice') || hasWord(nameLower, 'lemon rice') ||
    hasWord(nameLower, 'dahi bhat') || hasWord(nameLower, 'bhat') || hasWord(nameLower, 'bhaat') ||
    hasWord(nameLower, 'rice')
  ) {
    return 'Rice and Bhat';
  }

  // 5. Bhakri, Poli and Roti
  if (
    hasWord(nameLower, 'bhakri') || hasWord(nameLower, 'bhakar') || hasWord(nameLower, 'jwarichi') ||
    hasWord(nameLower, 'bajrichi') || hasWord(nameLower, 'nachni') || hasWord(nameLower, 'poli') ||
    hasWord(nameLower, 'chapati') || hasWord(nameLower, 'ghavan') || hasWord(nameLower, 'amboli') ||
    hasWord(nameLower, 'thalipeeth') || hasWord(nameLower, 'dhirde') || hasWord(nameLower, 'roti') ||
    hasWord(nameLower, 'naan') || hasWord(nameLower, 'paratha') || hasWord(nameLower, 'kulcha') ||
    hasWord(nameLower, 'phulka')
  ) {
    return 'Bhakri, Poli and Roti';
  }

  // 6. Chicken, Mutton and Seafood
  if (
    hasWord(nameLower, 'chicken') || hasWord(nameLower, 'mutton') || hasWord(nameLower, 'fish') ||
    hasWord(nameLower, 'prawn') || hasWord(nameLower, 'prawns') || hasWord(nameLower, 'surmai') ||
    hasWord(nameLower, 'bombil') || hasWord(nameLower, 'pomfret') || hasWord(nameLower, 'bangda') ||
    hasWord(nameLower, 'kolambi') || hasWord(nameLower, 'crab') || hasWord(nameLower, 'seafood') ||
    hasWord(nameLower, 'kombdi') || hasWord(nameLower, 'tambda') || hasWord(nameLower, 'pandhra') ||
    hasWord(nameLower, 'sukka') || hasWord(nameLower, 'sukha') || hasWord(nameLower, 'saoji') ||
    hasWord(nameLower, 'keema') || hasWord(nameLower, 'kheema') || hasWord(nameLower, 'boti') ||
    hasWord(nameLower, 'handi') || hasWord(nameLower, 'tangdi') || hasWord(nameLower, 'roast chicken')
  ) {
    return 'Chicken, Mutton and Seafood';
  }

  // 7. Chutney and Sides
  if (
    hasWord(nameLower, 'thecha') || hasWord(nameLower, 'kharda') || hasWord(nameLower, 'chutney') ||
    hasWord(nameLower, 'metkut') || hasWord(nameLower, 'loncha') || hasWord(nameLower, 'lonche') ||
    hasWord(nameLower, 'koshimbir') || hasWord(nameLower, 'kakdi') || hasWord(nameLower, 'papad') ||
    hasWord(nameLower, 'sandge') || hasWord(nameLower, 'kurdai') || hasWord(nameLower, 'taak') ||
    hasWord(nameLower, 'mattha') || hasWord(nameLower, 'chaas') || hasWord(nameLower, 'buttermilk')
  ) {
    return 'Chutney and Sides';
  }

  // 8. Bhaji and Usal
  if (
    hasWord(nameLower, 'bhaji') || hasWord(nameLower, 'usal') || hasWord(nameLower, 'pithla') ||
    hasWord(nameLower, 'pitla') || hasWord(nameLower, 'zunka') || hasWord(nameLower, 'jhunka') ||
    hasWord(nameLower, 'bharli vangi') || hasWord(nameLower, 'vangi') || hasWord(nameLower, 'patodi') ||
    hasWord(nameLower, 'matki') || hasWord(nameLower, 'chawli') || hasWord(nameLower, 'valachi') ||
    hasWord(nameLower, 'pavta') || hasWord(nameLower, 'kobi') || hasWord(nameLower, 'bhendi') ||
    hasWord(nameLower, 'flower') || hasWord(nameLower, 'dodka') || hasWord(nameLower, 'dudhi') ||
    hasWord(nameLower, 'padwal') || hasWord(nameLower, 'tondli') || hasWord(nameLower, 'gavar') ||
    hasWord(nameLower, 'shevga') || hasWord(nameLower, 'lal math') || hasWord(nameLower, 'palak') ||
    hasWord(nameLower, 'methi') || hasWord(nameLower, 'suran') || hasWord(nameLower, 'farasbi') ||
    hasWord(nameLower, 'karla') || hasWord(nameLower, 'bhopla') || hasWord(nameLower, 'paneer') ||
    hasWord(nameLower, 'batata') || hasWord(nameLower, 'rassa') ||
    hasWord(nameLower, 'sabzi') || hasWord(nameLower, 'curry')
  ) {
    return 'Bhaji and Usal';
  }

  // 9. Breakfast Items
  if (
    hasWord(nameLower, 'poha') || hasWord(nameLower, 'pohe') || hasWord(nameLower, 'upma') ||
    hasWord(nameLower, 'sheera') || hasWord(nameLower, 'breakfast') || hasWord(nameLower, 'omelette') ||
    hasWord(nameLower, 'omelet') || hasWord(nameLower, 'omlet') || hasWord(nameLower, 'dosa') ||
    hasWord(nameLower, 'idli') || hasWord(nameLower, 'medu vada')
  ) {
    return 'Breakfast';
  }

  // 10. Snacks and Farsan
  if (
    hasWord(nameLower, 'dhokla') || hasWord(nameLower, 'khaman') || hasWord(nameLower, 'idra') ||
    hasWord(nameLower, 'khatta dhokla') || hasWord(nameLower, 'white dhokla') || hasWord(nameLower, 'khandvi') ||
    hasWord(nameLower, 'fafda') || hasWord(nameLower, 'gathiya') || hasWord(nameLower, 'thepla') ||
    hasWord(nameLower, 'handvo') || hasWord(nameLower, 'chivda') || hasWord(nameLower, 'namkeen') ||
    hasWord(nameLower, 'farsan') || hasWord(nameLower, 'patra') ||
    hasWord(nameLower, 'vadi') || hasWord(nameLower, 'kothimbir') || hasWord(nameLower, 'alu vadi') ||
    hasWord(nameLower, 'suralichi') || hasWord(nameLower, 'appe') || hasWord(nameLower, 'kanda bhaji') ||
    hasWord(nameLower, 'bhajiya') || hasWord(nameLower, 'pakoda') || hasWord(nameLower, 'chakli') ||
    hasWord(nameLower, 'bhakarwadi') || hasWord(nameLower, 'shankarpali') || hasWord(nameLower, 'batata vada') ||
    hasWord(nameLower, 'samosa') || hasWord(nameLower, 'kachori') || hasWord(nameLower, 'dabeli')
  ) {
    return 'Snacks and Farsan';
  }

  // 11. Street Food and Chaat
  if (
    hasWord(nameLower, 'misal') || hasWord(nameLower, 'vada pav') || hasWord(nameLower, 'pav bhaji') ||
    hasWord(nameLower, 'masala pav') || hasWord(nameLower, 'ragda') || hasWord(nameLower, 'pani puri') ||
    hasWord(nameLower, 'sev puri') || hasWord(nameLower, 'bhel') || hasWord(nameLower, 'chaat') ||
    hasWord(nameLower, 'frankie') || hasWord(nameLower, 'tawa pulao')
  ) {
    return 'Street Food and Chaat';
  }

  // 12. Sweets and Desserts
  if (
    hasWord(nameLower, 'puran poli') || hasWord(nameLower, 'modak') || hasWord(nameLower, 'karanji') ||
    hasWord(nameLower, 'shrikhand') || hasWord(nameLower, 'amrakhand') || hasWord(nameLower, 'basundi') ||
    hasWord(nameLower, 'aamras') || hasWord(nameLower, 'kharvas') || hasWord(nameLower, 'kheer') ||
    hasWord(nameLower, 'halwa') || hasWord(nameLower, 'ladoo') || hasWord(nameLower, 'laddu') ||
    hasWord(nameLower, 'gulab jamun') || hasWord(nameLower, 'jalebi') || hasWord(nameLower, 'rasmalai') ||
    hasWord(nameLower, 'rasgulla') || hasWord(nameLower, 'rasgulle') || hasWord(nameLower, 'katli') ||
    hasWord(nameLower, 'chakra') || hasWord(nameLower, 'jelly') || hasWord(nameLower, 'mithai') ||
    hasWord(nameLower, 'ice cream') || hasWord(nameLower, 'kulfi') || hasWord(nameLower, 'mastani') ||
    hasWord(nameLower, 'falooda') || hasWord(nameLower, 'barfi') || hasWord(nameLower, 'peda') ||
    hasWord(nameLower, 'anarse') || hasWord(nameLower, 'chirote') || hasWord(nameLower, 'sweet')
  ) {
    return 'Sweets and Desserts';
  }

  // 13. Regional Specialties
  if (
    hasWord(nameLower, 'saoji') || hasWord(nameLower, 'varhadi') || hasWord(nameLower, 'khandeshi') ||
    hasWord(nameLower, 'malvani') || hasWord(nameLower, 'kolhapuri') || hasWord(nameLower, 'puneri') ||
    hasWord(nameLower, 'naan qalia') || hasWord(nameLower, 'gavran')
  ) {
    return 'Regional Specialties';
  }

  // Modern / Café / Western fallbacks for non-Maharashtrian menus
  if (hasWord(nameLower, 'pizza') || hasWord(nameLower, 'burger') || hasWord(nameLower, 'fries')) return 'Fast Food';
  if (hasWord(nameLower, 'noodle') || hasWord(nameLower, 'manchurian') || hasWord(nameLower, 'momos')) return 'Chinese';
  if (hasWord(nameLower, 'cake') || hasWord(nameLower, 'pastry') || hasWord(nameLower, 'brownie')) return 'Cakes & Pastries';
  if (hasWord(nameLower, 'coffee') || hasWord(nameLower, 'tea') || hasWord(nameLower, 'chai')) return 'Tea & Coffee';
  if (hasWord(nameLower, 'juice') || hasWord(nameLower, 'shake')) return 'Juices & Shakes';

  // Description fallbacks
  if (hasWord(descLower, 'thali')) return 'Maharashtrian Thali';
  if (hasWord(descLower, 'rice') || hasWord(descLower, 'bhat')) return 'Rice and Bhat';
  if (hasWord(descLower, 'amti') || hasWord(descLower, 'dal')) return 'Dal, Varan and Amti';
  if (hasWord(descLower, 'chicken') || hasWord(descLower, 'mutton') || hasWord(descLower, 'fish')) return 'Chicken, Mutton and Seafood';

  return 'Recommended';
}

export interface CuisineProfile {
  name: string;
  keywords: string[];
  dishes: DishTemplate[];
}

// 1. EXACT SIGNATURE DISHES FOR ICONIC RESTAURANTS ACROSS INDIA
export const ICONIC_RESTAURANT_DISHES: Record<string, DishTemplate[]> = {
  // Mr. Vadya (Famous Vada Pav Landmark in Kalwa, Thane)
  'mr vadya': [
    {
      name: "Mr. Vadya Special Vada Pav",
      description: "Signature piping-hot golden batata vada served in fresh soft ladi pav with fiery red garlic thecha and mint-coriander chutney.",
      price: 25,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28",
      popularity: 100,
      rating: 5.0,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Cheese Burst Vada Pav",
      description: "Crispy hot vada pav bursting with molten processed cheese, spiced butter, and garlic dry chutney.",
      price: 45,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28",
      popularity: 99,
      rating: 5.0,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Chowpatty Schezwan Vada Pav",
      description: "Spicy Mumbai street-style vada pav slathered with tangy spicy Schezwan chutney and crispy sev.",
      price: 35,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Ulta Vada Pav (Special)",
      description: "Inverted pav stuffed with spicy potato mash, coated in seasoned besan batter and fried golden crisp.",
      price: 50,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28",
      popularity: 97,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Crispy Kanda Bhaji Plate",
      description: "Crunchy hand-sliced onion fritters spiced with ajwain and green chillies, served piping hot with fried chilies.",
      price: 40,
      image: "/api/ai/dish-image?dish=Kanda%20Bhaji&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Crispy Batata Bhaji Plate",
      description: "Thin sliced spiced potato pakoras fried crisp in gram flour batter with green chutney.",
      price: 40,
      image: "/api/ai/dish-image?dish=Kanda%20Bhaji&v=v28",
      popularity: 96,
      rating: 4.8,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Garma Garam Masala Chai",
      description: "Freshly brewed strong cutting chai with crushed ginger, cardamom, and whole spices.",
      price: 20,
      image: "/api/ai/dish-image?dish=Masala%20Chai&v=v28",
      popularity: 99,
      rating: 5.0,
      category: "Desserts & Drinks",
      is_veg: 1
    },
    {
      name: "Cold Spiced Masala Taak",
      description: "Chilled refreshing buttermilk tempered with cumin, fresh coriander, ginger, and black salt.",
      price: 30,
      image: "/images/food/masala_taak.jpg",
      popularity: 97,
      rating: 4.8,
      category: "Desserts & Drinks",
      is_veg: 1
    }
  ],
  'mr. vadya': [
    {
      name: "Mr. Vadya Special Vada Pav",
      description: "Signature piping-hot golden batata vada served in fresh soft ladi pav with fiery red garlic thecha and mint-coriander chutney.",
      price: 25,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28",
      popularity: 100,
      rating: 5.0,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Cheese Burst Vada Pav",
      description: "Crispy hot vada pav bursting with molten processed cheese, spiced butter, and garlic dry chutney.",
      price: 45,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28",
      popularity: 99,
      rating: 5.0,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Chowpatty Schezwan Vada Pav",
      description: "Spicy Mumbai street-style vada pav slathered with tangy spicy Schezwan chutney and crispy sev.",
      price: 35,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Ulta Vada Pav (Special)",
      description: "Inverted pav stuffed with spicy potato mash, coated in seasoned besan batter and fried golden crisp.",
      price: 50,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28",
      popularity: 97,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Crispy Kanda Bhaji Plate",
      description: "Crunchy hand-sliced onion fritters spiced with ajwain and green chillies, served piping hot with fried chilies.",
      price: 40,
      image: "/api/ai/dish-image?dish=Kanda%20Bhaji&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Garma Garam Masala Chai",
      description: "Freshly brewed strong cutting chai with crushed ginger, cardamom, and whole spices.",
      price: 20,
      image: "/api/ai/dish-image?dish=Masala%20Chai&v=v28",
      popularity: 99,
      rating: 5.0,
      category: "Desserts & Drinks",
      is_veg: 1
    }
  ],
  // Relax Pure Veg & Fast Food (Sinhagad Road / Pune Landmark)
  'relax': [
    {
      name: "Mumbai Street Style Tawa Pulao",
      description: "Fragrant long-grain basmati rice tossed on giant tawa with fresh bell peppers, peas, paneer cubes, tomatoes, and spicy pav bhaji butter masala.",
      price: 210,
      image: "/images/food/tawa_pulao.jpg",
      popularity: 100,
      rating: 5.0,
      category: "Rice & Biryani",
      is_veg: 1
    },
    {
      name: "Special Amul Butter Pav Bhaji",
      description: "Rich spiced mashed vegetable bhaji drenched in pure Amul butter, served with sizzling butter-toasted soft ladi pavs.",
      price: 160,
      image: "/images/food/pav_bhaji.jpg",
      popularity: 99,
      rating: 5.0,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Mysore Butter Masala Dosa with Sambar",
      description: "Crisp golden fermented crepe smeared with spicy red garlic chutney, potato masala, and pure butter.",
      price: 150,
      image: "/images/food/dosa.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Special Veg Pulao with Raita",
      description: "Fragrant basmati rice tossed with fresh green peas, carrot cubes, paneer and browned onions.",
      price: 210,
      image: "/images/food/pulao.jpg",
      popularity: 97,
      rating: 4.9,
      category: "Rice & Biryani",
      is_veg: 1
    },
    {
      name: "Fresh Green Peas (Matar) Pulao",
      description: "Delicate long-grain rice tempered with sweet green peas, whole cumin, cardamom and pure ghee.",
      price: 190,
      image: "/images/food/pulao.jpg",
      popularity: 96,
      rating: 4.8,
      category: "Rice & Biryani",
      is_veg: 1
    },
    {
      name: "Shahi Kashmiri Pulao with Dry Fruits & Pomegranate",
      description: "Aromatic saffron-infused basmati rice tossed with roasted cashews, almonds, raisins, and fresh pomegranate.",
      price: 240,
      image: "/images/food/pulao.jpg",
      popularity: 96,
      rating: 4.8,
      category: "Rice & Biryani",
      is_veg: 1
    },
    {
      name: "Tandoori Paneer Tikka Pulao",
      description: "Smoky clay-oven roasted paneer tikka cubes folded into spiced biryani rice with caramelized onions.",
      price: 230,
      image: "/images/food/pulao.jpg",
      popularity: 97,
      rating: 4.9,
      category: "Rice & Biryani",
      is_veg: 1
    },
    {
      name: "Special Paneer Butter Masala",
      description: "Fresh malai paneer cubes simmered in rich creamy butter tomato cashew gravy.",
      price: 260,
      image: "/images/food/paneer_butter_masala.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Main Course",
      is_veg: 1
    },
    {
      name: "Crispy Butter Garlic Naan (2 Pcs)",
      description: "Clay oven tandoor baked leavened bread slathered with roasted garlic butter.",
      price: 90,
      image: "/images/food/garlic_naan.jpg",
      popularity: 97,
      rating: 4.8,
      category: "Indian Breads",
      is_veg: 1
    },
    {
      name: "Special SPDP (Sev Potato Dahi Puri)",
      description: "Crispy puris layered with spiced potatoes, sweet chilled dahi, date chutney and crunchy sev.",
      price: 110,
      image: "/images/food/pani_puri.jpg",
      popularity: 95,
      rating: 4.8,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Heritage South Indian Filter Coffee",
      description: "Aromatic chicory decoction frothed with boiling whole milk in traditional brass tumbler.",
      price: 60,
      image: "/images/food/coffee.jpg",
      popularity: 96,
      rating: 4.8,
      category: "Tea & Coffee",
      is_veg: 1
    },
    {
      name: "Punjabi Sweet Lassi Malai Mar Ke",
      description: "Thick hand-churned sweet creamy yogurt drink in a tall glass crowned with fresh malai.",
      price: 90,
      image: "/images/food/punjabi_lassi.jpg",
      popularity: 95,
      rating: 4.8,
      category: "Juices & Shakes",
      is_veg: 1
    }
  ],

  // Hotel Shree Jay Ganesh & Iconic Ganesh Hotels (Pune & Maharashtra)
  'ganesh': [
    {
      name: "Special Pithla Bhakri with Thecha & Kanda",
      description: "Steaming hot spiced besan pithla served with freshly roasted jowar bhakri, green thecha & onions.",
      price: 180,
      image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0,
      category: "Main Course",
      is_veg: 1
    },
    {
      name: "Kolhapuri Special Misal Pav with Spicy Farsan",
      description: "Fiery sprouted moth bean curry garnished with crispy spicy farsan, fresh onions, coriander & soft pav.",
      price: 120,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Crispy Kothimbir Vadi with Green Chutney",
      description: "Fresh coriander and chickpea flour savory diamond cakes fried crisp, served with sweet-spicy chutney.",
      price: 90,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 99,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Garma Garam Poori Bhaji Platter",
      description: "Four puffed golden pooris served with authentic mildly spiced batata bhaji and pickle.",
      price: 130,
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=85",
      popularity: 98,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Maharashtrian Special Veg Thali",
      description: "Homely feast: 2 hot chapatis, seasonal sabzi, dal varan bhat with pure ghee, usal, koshimbir & sweet.",
      price: 220,
      image: "https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85",
      popularity: 99,
      rating: 5.0,
      category: "Main Course",
      is_veg: 1
    },
    {
      name: "Crispy Sabudana Vada with Sweet Dahi (2 Pcs)",
      description: "Crunchy golden tapioca sago patties with roasted crushed peanuts served with sweetened creamy curd.",
      price: 95,
      image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Mysore Butter Masala Dosa with Sambar",
      description: "Crispy fermented crepe with fiery red garlic spread & potato masala, served with coconut chutney & sambar.",
      price: 140,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Steamed Idli & Crispy Medu Vada Combo",
      description: "Two soft steamed rice idlis and one crispy lentil vada served submerged in piping hot sambar.",
      price: 110,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.8,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Khandeshi Spicy Shev Bhaji with Chapatis",
      description: "Fiery black masala roasted onion gravy cooked with thick crunchy ratlami shev and two hot chapatis.",
      price: 170,
      image: "/images/food/shev_bhaji.jpg",
      popularity: 97,
      rating: 4.8,
      category: "Main Course",
      is_veg: 1
    },
    {
      name: "Indrayani Varan Bhat with Pure Desi Ghee",
      description: "Fragrant soft Indrayani rice topped with homestyle yellow toor dal varan, pure desi ghee and lemon.",
      price: 130,
      image: "https://images.unsplash.com/photo-1789991184293-224a84e41900?w=800&auto=format&fit=crop&q=85",
      popularity: 96,
      rating: 4.8,
      category: "Breads & Rice",
      is_veg: 1
    },
    {
      name: "Steamed Ukdiche Modak with Saffron Ghee (2 Pcs)",
      description: "Traditional soft steamed rice dumplings filled with fresh coconut, jaggery and green cardamom.",
      price: 110,
      image: "/images/food/modak.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Beverages & Sweets",
      is_veg: 1
    },
    {
      name: "Special Paneer Butter Masala with Butter Roti",
      description: "Soft cottage cheese cubes simmered in rich buttery tomato cashew gravy, served with 2 tandoori rotis.",
      price: 240,
      image: "/api/ai/dish-image?dish=Paneer%20Butter%20Masala&v=v28",
      popularity: 97,
      rating: 4.8,
      category: "Main Course",
      is_veg: 1
    },
    {
      name: "Dal Tadka with Fragrant Jeera Rice",
      description: "Double tempered yellow lentils with garlic, cumin, dried red chilies, paired with fragrant jeera rice.",
      price: 190,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8,
      category: "Breads & Rice",
      is_veg: 1
    },
    {
      name: "Authentic Bhajani Thalipeeth with White Butter",
      description: "Multigrain roasted savory pancake seasoned with onions and spices, topped with homemade white butter.",
      price: 110,
      image: "https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85",
      popularity: 97,
      rating: 4.8,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Digestive Spiced Mattha (Masala Taak)",
      description: "Refreshing churned curd drink tempered with roasted cumin, green chillies, ginger & fresh coriander.",
      price: 40,
      image: "/images/food/masala_taak.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Beverages & Sweets",
      is_veg: 1
    },
    {
      name: "Special Masala Kadak Cutting Chai",
      description: "Steaming hot milk tea boiled with crushed ginger, cardamom and lemongrass.",
      price: 25,
      image: "/api/ai/dish-image?dish=Masala%20Chai&v=v28",
      popularity: 99,
      rating: 5.0,
      category: "Beverages & Sweets",
      is_veg: 1
    },
    {
      name: "Hot Desi Ghee Gulab Jamun (2 Pcs)",
      description: "Warm melt-in-mouth milk dumplings soaked in cardamom and rose sugar syrup.",
      price: 70,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Beverages & Sweets",
      is_veg: 1
    }
  ],

  // Hotel Sai Sagar & Sai Hotels
  'sai': [
    {
      name: "Mysore Butter Masala Dosa",
      description: "Golden crispy thin rice crepe packed with spicy red chutney & potato masala.",
      price: 130,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Crispy Medu Vada Sambar (2 Pcs)",
      description: "Golden fried lentil donuts in hot aromatic lentil sambar & coconut chutney.",
      price: 90,
      image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Special Amul Butter Pav Bhaji",
      description: "Rich spiced mashed vegetable bhaji dripping with butter, served with soft butter-toasted pavs.",
      price: 150,
      image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9,
      category: "Snacks & Starters",
      is_veg: 1
    },
    {
      name: "Paneer Butter Masala with 2 Butter Naan",
      description: "Fresh cottage cheese in creamy tomato gravy with oven-baked garlic butter naan.",
      price: 260,
      image: "/api/ai/dish-image?dish=Paneer%20Butter%20Masala&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Main Course",
      is_veg: 1
    },
    {
      name: "Dal Khichdi Tadka with Roasted Papad",
      description: "Comforting yellow dal and rice tempered with ghee, cumin seeds, garlic, and dried red chilies.",
      price: 180,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.8,
      category: "Breads & Rice",
      is_veg: 1
    },
    {
      name: "Authentic South Indian Filter Coffee",
      description: "Fresh decoction chicory coffee frothed with boiling whole milk in a traditional tumbler.",
      price: 45,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0,
      category: "Beverages & Sweets",
      is_veg: 1
    }
  ],

  // Sathe Swayampakghar (Iconic Maharashtrian Swayampakghar & Homestyle Dining in Pune)
  'sathe': [
    {
      name: "Sathe Special Puran Poli Thali with Pure Desi Ghee",
      description: "Authentic handmade Puran Poli dripping in hot pure ghee, served with spicy Katachi Amti, fragrant rice & batata bhaji.",
      price: 240,
      image: "https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Sathe Garma Garam Pithla Bhakri with Thecha & Kanda",
      description: "Freshly roasted jowar bhakri paired with steaming hot spiced besan pithla, spicy green mirchi thecha, raw onion & fresh white butter.",
      price: 180,
      image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Sathe Traditional Maharashtrian Veg Thali",
      description: "Full homely spread: 2 hot chapatis, 2 seasonal vegetable bhajis, dal varan bhat with ghee, koshimbir, papad, pickle & sweet.",
      price: 220,
      image: "https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Crispy Kothimbir Vadi Plate with Green Chutney",
      description: "Steamed coriander cakes shallow-fried extra crisp with spicy mint chutney.",
      price: 90,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Steamed Ukdiche Modak with Saffron Infusion (2 Pcs)",
      description: "Delicate steamed rice flour dumplings filled with grated coconut, jaggery and pure cardamom ghee.",
      price: 120,
      image: "/images/food/modak.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Authentic Bharli Vangi with Jowar Bhakri",
      description: "Tender stuffed eggplants cooked in roasted peanut, sesame and Goda masala gravy.",
      price: 210,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Steamed Varan Bhat with Toop & Limboo",
      description: "Steaming aromatic Indrayani rice topped with thick yellow toor dal varan, pure desi ghee and lemon.",
      price: 140,
      image: "https://images.unsplash.com/photo-1789991184293-224a84e41900?w=800&auto=format&fit=crop&q=85",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "Chilled Kokum Solkadhi Glass",
      description: "Refreshing pink digestive cooler made from wild kokum extract and fresh coconut milk.",
      price: 50,
      image: "/images/food/solkadhi.jpg",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Chaitanya Paranthas (Iconic Pune Landmark for Jumbo Stuffed Parathas)
  'chaitanya': [
    {
      name: "Chaitanya Special Aloo Cheese Stuffed Paratha with Makhan & Dahi",
      description: "Signature jumbo tawa paratha packed with spiced mashed potatoes, cheese, served with fresh white butter, spiced dahi & pickle.",
      price: 160,
      image: "",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Chaitanya Paneer Pyaz Special Stuffed Paratha",
      description: "Crumbled fresh malai paneer and caramelized onions stuffed inside golden roasted butter paratha with mint dip.",
      price: 180,
      image: "",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Mix Veg Cheese Double Decker Paratha",
      description: "Crispy layered stuffed paratha loaded with vegetables, herbs, and molten cheese blend.",
      price: 170,
      image: "",
      popularity: 99,
      rating: 4.9
    },
    {
      name: "Crispy Amritsari Kulcha with Chole",
      description: "Clay oven baked potato onion kulcha served with spicy Punjabi Amritsari chole.",
      price: 190,
      image: "",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Punjabi Sweet Lassi Malai Mar Ke",
      description: "Thick hand-churned sweet creamy yogurt drink in a tall glass crowned with fresh malai.",
      price: 90,
      image: "",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Rolls Mania (Iconic Pune Landmark for Hot Kathi Rolls & Frankies)
  'rolls mania': [
    {
      name: "Rolls Mania Special Paneer Tikka Kathi Roll",
      description: "Clay oven roasted spiced cottage cheese, crunchy onions, and mint chutney rolled in flaky paratha.",
      price: 150,
      image: "",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Classic Double Egg Chicken Roll",
      description: "Succulent shredded chicken kebab and double egg omelette rolled with tangy onions and sauces.",
      price: 180,
      image: "",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Crispy Aloo Masala Frankie Roll",
      description: "Spiced potato cutlet roll wrapped with crunchy onions, chaat masala and tangy coriander sauce.",
      price: 110,
      image: "",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Loaded Peri Peri French Fries",
      description: "Crispy golden potato fries seasoned with fiery African peri peri spice rub.",
      price: 110,
      image: "",
      popularity: 97,
      rating: 4.8
    }
  ],

  // George Restaurant (Iconic Camp Pune Mughlai & Biryani Landmark)
  'george': [
    {
      name: "George Special Chicken Dum Biryani",
      description: "Camp Pune legendary long-grain aromatic saffron Basmati rice dum-cooked with tender spiced chicken.",
      price: 360,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "George Famous Mutton Rogan Josh",
      description: "Tender boneless mutton slow-braised in Kashmiri whole spices and rich aromatic gravy.",
      price: 420,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Charcoal Tandoori Chicken Tikka Platter",
      description: "Smoky boneless succulent chicken pieces grilled in clay tandoor with roasted spices & mint dip.",
      price: 330,
      image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85",
      popularity: 99,
      rating: 4.9
    }
  ],

  // Blue Nile (Iconic Pune Mughlai & Irani Biryani)
  'blue nile': [
    {
      name: "Blue Nile Irani Mutton Dum Biryani",
      description: "Legendary fragrant basmati rice layered with melt-in-mouth mutton chunks, saffron milk & caramelized onions.",
      price: 390,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Blue Nile Shahi Butter Chicken with Naan",
      description: "Rich velvety tomato cashew gravy with charcoal smoked chicken and hot butter garlic naan.",
      price: 380,
      image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=85",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Mutton Chelo Kebab with Butter Rice",
      description: "Tender Persian style spiced minced meat seekh skewers served on steaming butter basmati rice.",
      price: 440,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Shivaji Military Hotel (Iconic Maratha Non-Veg Mutton Thali)
  'shivaji': [
    {
      name: "Shivaji Special Mutton Thali (Tambda & Pandhra Rassa)",
      description: "Fiery Kolhapuri red rassa, white coconut broth, tender mutton sukka, 2 jowar bhakris & fragrant rice.",
      price: 380,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Spicy Gavran Chicken Sukka with Jowar Bhakri",
      description: "Desi free-range country chicken roasted dry with caramelized onions, coconut and black masala.",
      price: 320,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Mutton Kheema Pav & Boiled Egg Curry",
      description: "Minced spiced mutton slow cooked with green peas, mint, and toasted butter ladi pav.",
      price: 240,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Cafe Durga (Iconic Pune Institution - Erandwane, Kothrud, Paud Road, FC Road)
  'durga': [
    {
      name: "Durga Famous Thick Cold Coffee with Chocolate",
      description: "Pune's cult-favorite thick creamy cold coffee blended with rich chocolate syrup and crowned with chocolate froth.",
      price: 45,
      image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Thick Cold Coffee with Vanilla Ice Cream",
      description: "Cult-classic thick chocolate cold coffee crowned with a luscious scoop of rich vanilla ice cream.",
      price: 65,
      image: "/api/ai/dish-image?dish=Thick%20Cold%20Coffee%20with%20Vanilla%20Ice%20Cream&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Special Kanda Poha Plate with Sev & Lemon",
      description: "Authentic Puneri breakfast: fluffy yellow flattened rice tempered with mustard seeds, roasted peanuts, diced onions, crispy sev & fresh coriander.",
      price: 40,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Durga Special Spiced Misal Pav",
      description: "Fiery sprouted matki misal topped with crispy farsan, diced onions, fresh coriander, lemon wedge and two buttered pavs.",
      price: 80,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Special Amul Butter Pav Bhaji",
      description: "Slow-simmered spiced mashed vegetable bhaji slathered with pure Amul butter, served with hot toasted pav.",
      price: 120,
      image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=85",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Cheese Burst Pav Bhaji",
      description: "Rich spiced vegetable bhaji topped with a generous mountain of grated Amul cheese, served with buttered pav.",
      price: 150,
      image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=85",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Crispy Masala Dosa with Sambar & Chutney",
      description: "Golden thin crispy rice crepe rolled with seasoned spiced potato bhaji, served with coconut chutney & lentil sambar.",
      price: 85,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Cheese Masala Dosa",
      description: "Thin crispy golden dosa packed with savory spiced potato filling and melting shredded cheese.",
      price: 115,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "Veg Grilled Cheese Sandwich",
      description: "Toasted jumbo sandwich layered with spiced potato, cucumber, tomato, green chutney, and melted processed cheese.",
      price: 90,
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Classic Veg Cheese Toast Sandwich",
      description: "Crispy grilled sandwich with spiced vegetable filling and melted mozzarella-cheddar blend.",
      price: 75,
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85",
      popularity: 95,
      rating: 4.8
    },
    {
      name: "Hot Steamed Rava Upma with Chutney",
      description: "Fluffy semolina breakfast tempered with mustard seeds, curry leaves, ginger, green chillies and roasted peanuts.",
      price: 40,
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85",
      popularity: 95,
      rating: 4.8
    },
    {
      name: "Sweet Pineapple Sheera with Dry Fruits",
      description: "Traditional sweet semolina delicacy slow-cooked in pure desi ghee with real pineapple chunks, cardamom & cashews.",
      price: 50,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=800&auto=format&fit=crop&q=85",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "South Indian Kadak Filter Coffee",
      description: "Traditional brewed chicory coffee decoction frothed with boiling whole milk and thick creamy foam.",
      price: 35,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "Special Masala Chai Kulhad",
      description: "Steaming hot ginger and cardamom tea brewed with whole milk and served piping hot in an earthen cup.",
      price: 25,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=85",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Atulya Pure Veg (Pune Landmark Pure Vegetarian Restaurant)
  'atulya': [
    {
      name: "Atulya Special Maharaja Veg Thali",
      description: "Complete royal vegetarian feast: Paneer Butter Masala, Veg Kolhapuri, Dal Fry, Jeera Rice, 3 Butter Rotis, Roasted Papad, Raita & Gulab Jamun.",
      price: 280,
      image: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Atulya Special Paneer Butter Masala",
      description: "Fresh malai paneer cubes simmered in rich creamy butter tomato makhani gravy & kasuri methi.",
      price: 220,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Royal Shahi Kaju Kari",
      description: "Whole roasted cashews slow cooked in rich creamy white cashew and saffron gravy.",
      price: 250,
      image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=85",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Crispy Butter Garlic Naan (2 Pcs)",
      description: "Clay oven tandoor baked leavened bread slathered with roasted garlic butter.",
      price: 90,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Dal Tadka with Fragrant Jeera Rice",
      description: "Yellow lentils tempered with roasted garlic, cumin and red chilies, served with cumin Basmati rice.",
      price: 190,
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Spicy Veg Kolhapuri Gravy",
      description: "Garden fresh vegetables tossed in fiery roasted Kolhapuri red masala and dry coconut.",
      price: 200,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Tandoori Paneer Tikka (6 Pcs)",
      description: "Charcoal grilled cottage cheese chunks with bell peppers, onions & fresh mint chutney.",
      price: 240,
      image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=85",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Hot Gulab Jamun in Saffron Syrup (2 Pcs)",
      description: "Soft melt-in-mouth milk dumplings soaked in warm cardamom saffron syrup.",
      price: 70,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=800&auto=format&fit=crop&q=85",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Punjabi Sweet Lassi Malai Mar Ke",
      description: "Thick churned sweet yogurt cooler served with thick malai layer.",
      price: 80,
      image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=800&auto=format&fit=crop&q=85",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Chilled Masala Chaas (Spiced Buttermilk)",
      description: "Refreshing spiced churned buttermilk with roasted cumin and fresh coriander.",
      price: 40,
      image: "/images/food/masala_taak.jpg",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Sujata Mastani (Pune Landmark dessert institution since 1953)
  'sujata': [
    {
      name: "Sujata Famous Pure Mango Mastani",
      description: "Pune's legendary dessert: thick rich Alphonso mango shake topped with a generous scoop of mango ice cream, diced mangoes, slivered dry fruits, and glazed cherries.",
      price: 130,
      image: "/images/food/mango_mastani.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Royal Kesar Pista Dryfruit Mastani",
      description: "Thick saffron pistachio thick shake loaded with rich kulfi ice cream, roasted cashews, and almonds.",
      price: 150,
      image: "/images/food/kesar_pista_mastani.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Chocolate Fudge Brownie Mastani",
      description: "Decadent Dutch chocolate shake topped with dark chocolate ice cream, brownie chunks & hot fudge sauce.",
      price: 140,
      image: "/images/food/chocolate_mastani.jpg",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Special Anjir Badam Mastani Glass",
      description: "Creamy Turkish fig milkshake crowned with vanilla ice cream and roasted sliced badam.",
      price: 150,
      image: "/images/food/dryfruit_mastani.jpg",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "Heritage Rose Falooda with Rabdi & Kulfi",
      description: "Chilled rose milk layered with basil seeds, falooda sev, rich rabdi and malai kulfi.",
      price: 120,
      image: "/images/food/falooda.jpg",
      popularity: 99,
      rating: 5.0
    }
  ],
  'mastani': [
    {
      name: "Pune Special Famous Mango Mastani",
      description: "Authentic Puneri delicacy: luscious mango shake topped with velvet mango ice cream, diced mango chunks, and crunchy dry fruits.",
      price: 130,
      image: "/api/ai/dish-image?dish=Mango%20Mastani&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Royal Kesar Pista Dryfruit Mastani",
      description: "Thick saffron pistachio thick shake loaded with rich kulfi ice cream, roasted cashews, and almonds.",
      price: 150,
      image: "/api/ai/dish-image?dish=Kesar%20Pista%20Mastani&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Heritage Rose Falooda with Rabdi & Kulfi",
      description: "Chilled rose milk layered with basil seeds, falooda sev, rich rabdi and malai kulfi.",
      price: 120,
      image: "/api/ai/dish-image?dish=Falooda&v=v28",
      popularity: 99,
      rating: 5.0
    }
  ],
  // Hotel Panchali (Jangali Maharaj Road, Pune)
  'panchali': [
    {
      name: "Panchali Special Shahi Maharaja Thali",
      description: "Jangali Maharaj Road landmark royal feast: Puran Poli, Paneer Subzi, Spiced Amti, Bhakri, and Aamras.",
      price: 280,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Panchali Special Veg Kolhapuri with Butter Roti",
      description: "Spicy mixed vegetable curry cooked in fiery roasted Kolhapuri masala, served with tandoor rotis.",
      price: 210,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Panchali Shahi Dum Biryani with Veg Raita",
      description: "Fragrant saffron Basmati rice slow-cooked with fresh garden vegetables and paneer in sealed handi.",
      price: 240,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Panchali Special Paneer Butter Masala Handi",
      description: "Soft cottage cheese cubes simmered in rich creamy butter tomato gravy.",
      price: 230,
      image: "/api/ai/dish-image?dish=Paneer%20Butter%20Masala&v=v28",
      popularity: 96,
      rating: 4.8
    }
  ],

  // Gajanan Vadapav (Thane)
  'gajanan': [
    {
      name: "Gajanan Special Yellow Chutney Vada Pav (2 Pcs)",
      description: "Thane's iconic golden potato vada stuffed in soft ladi pav, drenched in legendary spicy-tangy yellow besan chutney.",
      price: 50,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Crispy Kothimbir Vadi Plate",
      description: "Steamed fresh coriander cilantro diamond cakes shallow-fried crisp with sweet & spicy dip.",
      price: 80,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Crispy Sabudana Vada with Sweet Dahi",
      description: "Golden fried tapioca pearl patties with roasted crushed peanuts and spiced sweet curd.",
      price: 90,
      image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v28",
      popularity: 97,
      rating: 4.8
    },
    {
      name: "Spicy Schezwan Cheese Vada Pav",
      description: "Loaded with melted mozzarella cheese, fiery schezwan sauce, and garlic chutney.",
      price: 90,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 95,
      rating: 4.8
    }
  ],

  // Mamledar Misal (Thane)
  'mamledar': [
    {
      name: "Mamledar Famous Fiery Rassa Misal Pav",
      description: "Thane Zilla Parishad's legendary 1946 fiery red cut tarri misal topped with crispy farsan, onion, and soft pav.",
      price: 130,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Mamledar Medium Spicy Matki Misal",
      description: "Balanced spiced sprouted moth bean misal served with extra crunchy farsan bowl and toasted pav.",
      price: 120,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Chilled Kokum Solkadhi Glass",
      description: "Refreshing pink digestive cooler made with coconut milk, kokum extract, garlic, and green chillies.",
      price: 50,
      image: "/images/food/solkadhi.jpg",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Bedekar Tea Stall (Narayan Peth, Pune) - World Famous Misal Landmark
  'bedekar': [
    {
      name: "Historic Bedekar Puneri Misal with Bread Slices",
      description: "Narayan Peth's legendary 1948 spicy misal prepared with authentic Maharashtrian spices, served with soft bread slices, farsan & lemon.",
      price: 120,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Special Bedekar Kolhapuri Tarri Misal Pav",
      description: "Fiery red cut rassa misal topped with extra crispy farsan, diced onions, and soft pav.",
      price: 130,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 4.9
    },
    {
      name: "Crispy Kothimbir Vadi Plate",
      description: "Steamed fresh coriander cakes shallow-fried crisp with spicy green chutney.",
      price: 80,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Traditional Bedekar Poha Laddoo (2 Pcs)",
      description: "Heritage sweet flattened rice laddoos rolled with pure desi ghee and roasted nuts.",
      price: 60,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "Authentic Puneri Kande Pohe with Coconut",
      description: "Fluffy seasoned flattened rice tempered with mustard seeds, peanuts, and freshly grated coconut.",
      price: 50,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 95,
      rating: 4.8
    },
    {
      name: "Crispy Sabudana Vada with Peanut Dahi",
      description: "Golden fried tapioca pearl fritters served with sweet and spicy roasted peanut curd chutney.",
      price: 90,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 94,
      rating: 4.8
    },
    {
      name: "Special Digestive Kokum Sharbat",
      description: "Refreshing sweet and sour traditional Konkan digestive cooler with roasted cumin and rock salt.",
      price: 40,
      image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80",
      popularity: 90,
      rating: 4.7
    },
    {
      name: "Bedekar Special Masala Cutting Chai",
      description: "Aromatic boiled milk tea brewed with ginger, green cardamom, and lemongrass.",
      price: 30,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
      popularity: 93,
      rating: 4.8
    }
  ],

  // Prashant Corner (Thane)
  'prashant corner': [
    {
      name: "Plain Dhokla",
      description: "Authentic steamed fluffy, spongy golden besan Khaman Dhokla tempered with mustard seeds, curry leaves, and green chillies.",
      price: 90,
      image: "/images/food/dhokla.jpg",
      popularity: 100,
      rating: 5.0,
      category: "Snacks and Farsan",
      is_veg: 1
    },
    {
      name: "White Dhokla",
      description: "Traditional fermented rice and urad dal Khatta Idra Dhokla seasoned with crushed black pepper, mustard seeds, and fresh coriander.",
      price: 95,
      image: "/images/food/white_dhokla.jpg",
      popularity: 99,
      rating: 4.95,
      category: "Snacks and Farsan",
      is_veg: 1
    },
    {
      name: "Prashant Corner Shahi Kaju Katli (250g)",
      description: "Thane's celebrated melt-in-mouth diamond cashew fudge made with premium Goan cashews.",
      price: 260,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9,
      category: "Sweets and Desserts",
      is_veg: 1
    },
    {
      name: "Traditional Puran Poli with Pure Desi Ghee",
      description: "Warm golden flatbread stuffed with cardamom chana dal jaggery stuffing, slathered in pure ghee.",
      price: 140,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.85,
      category: "Sweets and Desserts",
      is_veg: 1
    },
    {
      name: "Special Dahi Sev Batata Puri Chaat",
      description: "Crispy puris layered with spiced potato mash, sweetened chilled curd, tamarind glaze, and sev.",
      price: 120,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8,
      category: "Street Food and Chaat",
      is_veg: 1
    }
  ],

  // Gurukripa (Sion, Mumbai) - Legendary Samosas & Chole Bhature
  'gurukripa': [
    {
      name: "Samosa",
      description: "Sion's legendary golden crisp samosa filled with spiced potatoes, served with signature sweet tamarind & mint chutney.",
      price: 45,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Chole Bhature",
      description: "Iconic North Indian style spicy chickpea curry served with two piping hot golden fluffy bhature and pickled onions.",
      price: 150,
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Dahi Samosa",
      description: "Crushed crisp samosas drenched in chilled sweet curd, tangy tamarind chutney, spicy green chutney and crunchy sev.",
      price: 90,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Samosa Chaat",
      description: "Special crushed samosa layered with hot chole gravy, diced onions, coriander, and chatpata chaat masala.",
      price: 110,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "Gulab Jamun Plate",
      description: "Warm, melt-in-mouth milk solid dumplings soaked in aromatic saffron and cardamom sugar syrup.",
      price: 70,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
      popularity: 95,
      rating: 4.8
    },
    {
      name: "Sweet Lassi Glass",
      description: "Thick, creamy Punjabi style beaten yogurt drink topped with a layer of thick malai.",
      price: 60,
      image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80",
      popularity: 94,
      rating: 4.7
    }
  ],

  // Hotel Roopali (FC Road Pune)
  'roopali': [
    {
      name: "Roopali Special Butter Set Dosa",
      description: "Trio of ultra-spongy golden dosas served with creamy white coconut chutney and spicy potato saggu.",
      price: 150,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 4.9
    },
    {
      name: "Crispy Onion Rava Masala Dosa",
      description: "Crispy semolina crepe tempered with mustard, green chillies & cashews, stuffed with spiced aloo masala.",
      price: 160,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.8
    },
    {
      name: "Roopali Heritage Hot Filter Coffee",
      description: "Aromatic South Indian filter coffee frothed to perfection in authentic brass davarah.",
      price: 55,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Roopali Special Veg Cutlet & Sambar",
      description: "Crispy beetroot and vegetable cutlets served with hot piping lentil sambar and spicy green chutney.",
      price: 120,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 95,
      rating: 4.7
    }
  ],

  // Vaishali (FC Road Pune)
  'vaishali': [
    {
      name: "Special Vaishali Tomato Omelette",
      description: "FC Road's iconic golden chickpea-flour pancake prepared with chopped fresh ripe tomatoes, green chilies and coriander, served with crisp buttered toast.",
      price: 150,
      image: "/images/food/tomato_omelette.jpg",
      popularity: 100,
      rating: 5.0,
      category: "South Indian Snacks",
      is_veg: 1
    },
    {
      name: "Special Cheese Tomato Omelette",
      description: "Vaishali's famous savory tomato besan pancake smothered in melted Amul cheese, served with hot buttered toast.",
      price: 180,
      image: "/images/food/tomato_omelette.jpg",
      popularity: 99,
      rating: 4.9,
      category: "South Indian Snacks",
      is_veg: 1
    },
    {
      name: "Vaishali Special Mysore Masala Dosa",
      description: "FC Road's iconic golden fermented rice crepe smeared with fiery red garlic paste & spiced potato mash.",
      price: 160,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Vaishali Signature SPDP (Sev Potato Dahi Puri)",
      description: "Legendary Pune student snack: crispy puris filled with potatoes, sweetened curd, date chutney & mountain of sev.",
      price: 130,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Crispy Cheese Onion Rava Dosa",
      description: "Crisp semolina crepe tempered with mustard, green chilies, cashews, and loaded with processed cheese.",
      price: 180,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Special Veg Cutlet & Coconut Chutney",
      description: "Golden beetroot vegetable patties served with piping hot lentil sambar and creamy coconut dip.",
      price: 120,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "Steamed Button Idlis in Ghee Sambar",
      description: "Bowl of mini button idlis submerged in aromatic South Indian sambar with pure desi ghee.",
      price: 110,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Heritage South Indian Filter Coffee",
      description: "Strong chicory-blended decoction frothed with rich hot milk in traditional brass tumbler.",
      price: 60,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Cafe Goodluck (Deccan Pune)
  'goodluck': [
    {
      name: "Goodluck Bun Maska & Special Irani Chai",
      description: "Deccan's 1935 classic: crusty bun slathered with salted whipped butter and steaming hot cardamom Irani tea.",
      price: 75,
      image: "/api/ai/dish-image?dish=Bun%20Maska&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Goodluck Famous Mutton Keema Ghotala Pav",
      description: "Minced spiced mutton scrambled with farm eggs, green chillies, and served with toasted ladi pav.",
      price: 290,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Crispy Chicken Baida Roti",
      description: "Crispy pan-fried flatbread layered with spiced chicken mince and egg wrap.",
      price: 220,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Spicy Mutton Biryani Iranian Style",
      description: "Slow-cooked fragrant Basmati rice with succulent mutton pieces, fried potatoes & caramelized onions.",
      price: 340,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Cheese Egg Omelette with Bun",
      description: "Fluffy 3-egg omelette loaded with green chilies, onions, melted cheese and toasted buttery pav.",
      price: 150,
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8
    }
  ],

  // Sujata Mastani (Pune)
  'sujata_mastani': [
    {
      name: "Sujata Special Alphonso Mango Mastani",
      description: "Pune's original thick Alphonso mango milkshake topped with rich vanilla ice cream, dry fruits, and cherry.",
      price: 150,
      image: "/images/food/mango_mastani.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Royal Kaju Draksh Sitaphal Mastani",
      description: "Custard apple pulp blended thick with whole roasted cashews, black raisins, and creamy ice cream.",
      price: 170,
      image: "/images/food/sitaphal_mastani.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Kesar Pista Special Dryfruit Shake",
      description: "Aromatic Kashmiri saffron thick milk blend topped with generous crushed green pistachios.",
      price: 160,
      image: "/images/food/kesar_pista_mastani.jpg",
      popularity: 97,
      rating: 4.8
    },
    {
      name: "Chocolate Brownie Mastani",
      description: "Rich dark chocolate shake topped with brownie chunks, fudge sauce and chocolate ice cream.",
      price: 180,
      image: "/images/food/chocolate_mastani.jpg",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Girija Pure Veg & Bhel (Sinhagad Road Pune)
  'girija': [
    {
      name: "Girija Special SPDP (Sev Potato Dahi Puri)",
      description: "Crispy puris layered with spiced potatoes, sweetened curd, tangy tamarind and crunchy sev.",
      price: 110,
      image: "/api/ai/dish-image?dish=SPDP&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Girija Famous Matki Bhel",
      description: "Sprouted matki, puffed rice, tangy tamarind glaze, roasted peanuts and fresh coriander.",
      price: 90,
      image: "/api/ai/dish-image?dish=Bhel%20Puri&v=v28",
      popularity: 99,
      rating: 4.9
    },
    {
      name: "Girija Special Butter Pav Bhaji",
      description: "Mashed spiced vegetables cooked on flat tawa topped with pure Amul butter & warm ladi pav.",
      price: 160,
      image: "/api/ai/dish-image?dish=Pav%20Bhaji&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Girija Authentic Maharashtrian Thali",
      description: "Authentic family thali: Puran poli, spiced amti, jowar bhakri, subzi, rice & sweets.",
      price: 240,
      image: "/api/ai/dish-image?dish=Veg%20Thali&v=v28",
      popularity: 96,
      rating: 4.8
    }
  ],

  // Katakirr Misal (Pune)
  'katakirr': [
    {
      name: "Katakirr Kolhapuri Tikhat Tarri Misal Pav",
      description: "Fiery spicy sprouted moth bean misal drowned in red cut rassa, crunchy farsan and lemon.",
      price: 130,
      image: "/api/ai/dish-image?dish=Misal%20Pav&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Katakirr Medium Spiced Matki Misal Pav",
      description: "Balanced spiced aromatic misal served with extra crunchy farsan bowl and toasted pav.",
      price: 120,
      image: "/api/ai/dish-image?dish=Misal%20Pav&v=v28",
      popularity: 99,
      rating: 4.9
    },
    {
      name: "Chilled Dahi Vati & Extra Pav Duo",
      description: "Sweetened chilled dahi bowl to balance the fiery Kolhapuri rassa with fresh butter pav.",
      price: 60,
      image: "/api/ai/dish-image?dish=Masala%20Dosa&v=v28",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Hotel Jagdamb (Pune)
  'jagdamb': [
    {
      name: "Jagdamb Special Gavran Mutton Thali",
      description: "Legendary spicy Gavran mutton thali with mutton sukka, Tambda rassa, Pandhra rassa & hot jowar bhakri.",
      price: 420,
      image: "/api/ai/dish-image?dish=Mutton%20Thali&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Kala Masala Chicken Handi with Bhakri",
      description: "Country chicken simmered in traditional roasted black spices on open charcoal fire.",
      price: 380,
      image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Tambda & Pandhra Rassa Bowl Duo",
      description: "Spicy red fiery mutton soup and silky white coconut-poppy seed broth.",
      price: 120,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Mutton Alani Bhat (Aromatic Bone Broth Rice)",
      description: "Fragrant rice cooked in rich unspiced mutton bone stock with tender meat pieces.",
      price: 240,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Shivraj Hotel (Pune)
  'shivraj': [
    {
      name: "Shivraj World Famous Raavan Mutton Thali",
      description: "Giant non-veg feast platter with mutton chops, kheema, chicken handi, 5 rassas, bhakri & biryani.",
      price: 990,
      image: "/api/ai/dish-image?dish=Mutton%20Thali&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Bullet Chicken Special Thali",
      description: "Spicy country chicken handi, chicken sukka, tambda rassa, pandhra rassa, rice & hot jowar bhakri.",
      price: 390,
      image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Tandoori Surmai Fish Fry",
      description: "Fresh kingfish steak coated in Kolhapuri spices and rawa fried crisp in pure coconut oil.",
      price: 480,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Agashiye (Ahmedabad, Gujarat)
  'agashiye': [
    {
      name: "Agashiye Grand Royal Gujarati Thali",
      description: "The House of MG's celebrated 20+ item royal Gujarati feast: Farsan, Rasawala Shaak, Kadhi, Rotli & Aamras.",
      price: 580,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Traditional Surati Undhiyu with Puri",
      description: "Heritage winter mixed vegetable casserole slow-cooked in earthen pot with methi muthiyas and hot puris.",
      price: 240,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Authentic Fafda Jalebi & Sambharo Plate",
      description: "Crispy fafda paired with hot crunchy saffron jalebi, fried chillies, and papaya sambharo.",
      price: 140,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Das Khaman (Surat / Ahmedabad, Gujarat)
  'das khaman': [
    {
      name: "Das Famous Spongy Nylon Khaman",
      description: "Ahmedabad's 1922 institution world-famous for super soft, juicy steamed gram flour khaman tempered with mustard & curry leaves.",
      price: 80,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Special Surati Locho with Butter & Sev",
      description: "Steamed seasoned gram flour delicacy topped with melting butter, green garlic chutney, and crispy nylon sev.",
      price: 90,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Authentic Fafda Jalebi Plate",
      description: "Crispy gram flour fafda with golden crunchy saffron jalebis and fried green chillies.",
      price: 130,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Rawat Mishthan Bhandar (Jaipur, Rajasthan)
  'rawat': [
    {
      name: "Rawat World Famous Spicy Pyaaz Kachori (2 Pcs)",
      description: "Jaipur's iconic flaky golden pastry stuffed with spicy caramelized onion masala, served with tamarind chutney.",
      price: 80,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Royal Dal Baati Churma with Desi Ghee",
      description: "Baked whole wheat baatis crushed in pure desi ghee, served with spicy panchmel dal and sweet dry fruit churma.",
      price: 280,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Shahi Malai Ghevar with Saffron Rabdi",
      description: "Honeycomb textured Rajasthani festive dessert soaked in cardamom sugar syrup crowned with thick malai.",
      price: 160,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Chokhi Dhani (Jaipur, Rajasthan)
  'chokhi dhani': [
    {
      name: "Chokhi Dhani Royal Dal Baati Churma Feast",
      description: "Heritage village royal platter: Baatis soaked in country ghee, Panchmel Dal, Churma, Gatte Ki Sabzi & Ker Sangri.",
      price: 490,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Authentic Gatte Ki Sabzi with Bajra No Rotlo",
      description: "Gram flour roundels simmered in spiced yogurt curry, served hot with clay-roasted bajra flatbread & white makhan.",
      price: 220,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Ker Sangri Marwari Delicacy",
      description: "Rare desert beans and berries cooked with dry spices, amchur, and raisins in mustard oil.",
      price: 240,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Tunday Kababi (Lucknow, UP)
  'tunday': [
    {
      name: "Tunday Original Galouti Kebab (4 Pcs)",
      description: "Lucknow's 1905 Aminabad legend: 160-spice minced mutton kebabs that literally melt in your mouth.",
      price: 280,
      image: "/api/ai/dish-image?dish=Tandoori%20Chicken&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Mughlai Paratha with Mutton Korma",
      description: "Flaky pan-fried parathas paired with rich, slow-simmered Awadhi brown onion mutton gravy.",
      price: 360,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Awadhi Shahi Dum Biryani",
      description: "Fragrant saffron Basmati rice layered with tender lamb pieces on dum in sealed handi.",
      price: 390,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Karim's (Delhi)
  'karim': [
    {
      name: "Karim's Royal Mutton Burra Kebab",
      description: "Charcoal-tandoor smoked juicy mutton chops marinated in secret royal Mughal spices.",
      price: 520,
      image: "/api/ai/dish-image?dish=Tandoori%20Chicken&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Shahi Mutton Korma & Khamiri Roti",
      description: "Slow-simmered rich gravy infused with brown onions, kewra essence, served with fluffy clay-oven flatbread.",
      price: 440,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Royal Mutton Dum Biryani",
      description: "Saffron infused Basmati rice cooked with tender marinated mutton in traditional sealed handi.",
      price: 460,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Aslam Butter Chicken (Delhi)
  'aslam': [
    {
      name: "Aslam Special Dahi Butter Chicken",
      description: "Old Delhi's sensation: tandoori roasted chicken bathed in a stream of melted Amul butter and spiced curd.",
      price: 480,
      image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Seekh Kebab Butter Bath",
      description: "Charcoal grilled mutton seekh kebabs dipped in melted butter and spiced yogurt.",
      price: 360,
      image: "/api/ai/dish-image?dish=Tandoori%20Chicken&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Soft Rumali Roti & Mint Chutney",
      description: "Paper-thin soft rumali roti served with tangy coriander-mint yogurt dip.",
      price: 50,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 95,
      rating: 4.8
    }
  ],

  // Sita Ram Diwan Chand (Delhi)
  'sita ram': [
    {
      name: "Sita Ram Paneer Stuffed Chole Bhature",
      description: "Paharganj's iconic puffed golden bhaturas stuffed with grated paneer, served with spicy tangy chickpea curry & aam pickle.",
      price: 160,
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Special Chhole Kulche with Aloo Pickle",
      description: "Soft buttered kulchas served with dry spiced chickpeas, ginger juliennes, and sour green chili pickle.",
      price: 130,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Special Malai Meethi Lassi",
      description: "Thick creamy churned yogurt drink topped with a thick layer of fresh malai and rose syrup.",
      price: 90,
      image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Arsalan Biryani (Kolkata)
  'arsalan': [
    {
      name: "Arsalan Special Mutton Dum Biryani (with Aloo & Egg)",
      description: "Kolkata's crown jewel: fragrant long-grain Basmati rice, melt-in-mouth mutton, slow-cooked whole potato, and boiled egg.",
      price: 420,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Juicy Mutton Chaap with Roomali Roti",
      description: "Slow-braised mutton ribs in thick poppy seed and cashew gravy, served with paper-thin roomali roti.",
      price: 380,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Kolkata Chicken Kathi Roll",
      description: "Flaky layered paratha wrapped with spicy chicken tikka, sliced onions, green chillies, and lime.",
      price: 180,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Peter Cat (Kolkata)
  'peter cat': [
    {
      name: "Peter Cat World Famous Chelo Kebab",
      description: "Legendary platter: fragrant buttered rice crowned with grilled chicken & mutton kebabs, roasted tomato, and fried egg.",
      price: 490,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Sizzling Butter Chicken Steak",
      description: "Hot iron sizzler plate with spiced chicken steak, sauteed vegetables, and jacket potatoes.",
      price: 460,
      image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Heritage Caramel Custard",
      description: "Silky smooth baked egg and milk custard with burnt caramel sugar glaze.",
      price: 130,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8
    }
  ],

  // Behrouz Biryani
  'behrouz': [
    {
      name: "Behrouz Royal Dum Gosht Mutton Biryani",
      description: "Tender boneless mutton marinated in secret royal spices, layered with fragrant saffron basmati rice.",
      price: 395,
      image: "/api/ai/dish-image?dish=Biryani&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Behrouz Murgh Makhani Dum Biryani",
      description: "Charcoal grilled spiced chicken pieces layered with long-grain saffron rice and browned onions.",
      price: 345,
      image: "/api/ai/dish-image?dish=Biryani&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Behrouz Subz-e-Biryani Handi",
      description: "Assorted seasonal garden vegetables, paneer cubes, and aromatic dry fruits slow-cooked on dum.",
      price: 295,
      image: "/api/ai/dish-image?dish=Biryani&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Royal Gulab Jamun with Saffron Dip (2 Pcs)",
      description: "Warm melt-in-mouth milk dumplings soaked in royal cardamom & rose syrup.",
      price: 85,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Domino's Pizza
  'domino': [
    {
      name: "Domino's Farmhouse Cheese Burst Pizza",
      description: "Delightful combination of onion, crisp capsicum, grilled mushroom & fresh tomato with molten cheese crust.",
      price: 399,
      image: "/api/ai/dish-image?dish=Pizza&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Domino's Peppy Paneer / Chicken Pepper Pizza",
      description: "Flavorful chunks of spiced paneer or chicken, crisp capsicum and fiery red paprika.",
      price: 369,
      image: "/api/ai/dish-image?dish=Pizza&v=v28",
      popularity: 99,
      rating: 4.9
    },
    {
      name: "Domino's Stuffed Cheesy Garlic Bread",
      description: "Freshly baked garlic breadsticks overflowing with mozzarella cheese and sweet corn kernels.",
      price: 169,
      image: "/api/ai/dish-image?dish=Pizza&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Domino's Choco Lava Cake",
      description: "Warm chocolate cake with gooey, flowing melted chocolate fudge center.",
      price: 119,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Burger King
  'burger king': [
    {
      name: "Burger King Crispy Veg / Chicken Whopper",
      description: "Flame-grilled signature patty layered with crunchy lettuce, creamy mayo, sliced pickles and sesame seed bun.",
      price: 199,
      image: "/api/ai/dish-image?dish=Burger&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Burger King Fiery Peri Peri Crispy Fries",
      description: "Golden fried crispy potato fries seasoned with fiery African peri peri spice sprinkle.",
      price: 129,
      image: "/api/ai/dish-image?dish=Burger&v=v28",
      popularity: 99,
      rating: 4.9
    },
    {
      name: "Burger King Crispy Veg / Chicken Crunch Bites",
      description: "Crunchy golden fried bite-sized treats served with rich cheesy dipping sauce.",
      price: 159,
      image: "/api/ai/dish-image?dish=Burger&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Burger King Chocolate Thick Shake",
      description: "Decadent blended ice cream milkshake with rich chocolate syrup and cocoa swirl.",
      price: 169,
      image: "/api/ai/dish-image?dish=Cold%20Coffee&v=v28",
      popularity: 97,
      rating: 4.8
    }
  ],

  // McDonald's
  'mcdonald': [
    {
      name: "McDonald's McAloo Tikki / McChicken Burger",
      description: "Iconic spiced potato patty with special tomato-mayo sauce in toasted bun.",
      price: 139,
      image: "/api/ai/dish-image?dish=Burger&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "McDonald's World Famous French Fries (Large)",
      description: "Golden, crispy outside and fluffy inside premium salted potato fries.",
      price: 129,
      image: "/api/ai/dish-image?dish=Burger&v=v28",
      popularity: 99,
      rating: 4.9
    },
    {
      name: "McDonald's McSpicy Paneer / Chicken Burger",
      description: "Fiery crunchy crumb-coated patty with shredded lettuce and creamy spicy sauce.",
      price: 199,
      image: "/api/ai/dish-image?dish=Burger&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "McDonald's Soft Serve McFlurry",
      description: "Creamy vanilla dairy soft serve blended with chocolate crunch.",
      price: 99,
      image: "/api/ai/dish-image?dish=Falooda&v=v28",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Wow! Momo
  'wow momo': [
    {
      name: "Wow! Momo Steamed Darjeeling Veg / Chicken Momos (6 Pcs)",
      description: "Authentic thin-wrapper steamed Himalayan dumplings served with fiery red chili garlic sauce.",
      price: 149,
      image: "/api/ai/dish-image?dish=Momos&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Wow! Momo Crispy Fried Cheese Corn Momos (6 Pcs)",
      description: "Golden fried crunchy momos loaded with melted mozzarella, sweet corn & herbs with spicy dip.",
      price: 179,
      image: "/api/ai/dish-image?dish=Momos&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Wow! Momo Sizzling Schezwan Gravy Momos",
      description: "Steamed momos wok-tossed in rich red sizzling garlic schezwan pepper gravy.",
      price: 199,
      image: "/api/ai/dish-image?dish=Momos&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Wow! Momo Butter Garlic Pan-Fried Momos",
      description: "Crispy bottom pan-seared dumplings drizzled in sizzling aromatic chili garlic butter.",
      price: 189,
      image: "/api/ai/dish-image?dish=Momos&v=v28",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Haldiram's
  'haldiram': [
    {
      name: "Haldiram's Special Raj Kachori Chaat",
      description: "Crispy giant kachori shell stuffed with bhallas, sprouts, sweet curd, mint & date chutneys.",
      price: 145,
      image: "/api/ai/dish-image?dish=SPDP&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Haldiram's Famous Chole Bhature Platter",
      description: "Twin fluffy golden bhaturas served with spicy Amritsari chole, pickled carrots and onions.",
      price: 185,
      image: "/api/ai/dish-image?dish=Chole%20Bhature&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Haldiram's Special Butter Pav Bhaji",
      description: "Mashed vegetable spiced gravy topped with a dollop of pure Amul butter & toasted pavs.",
      price: 165,
      image: "/api/ai/dish-image?dish=Pav%20Bhaji&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Haldiram's Royal Kaju Katli (250g)",
      description: "Finest silver vark coated diamond cashew fudge made from pure premium Goan cashews.",
      price: 260,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Bikanervala
  'bikanervala': [
    {
      name: "Bikanervala Special Crispy Pyaaz Kachori (2 Pcs)",
      description: "Flaky golden crust packed with spicy caramelized onion masala and sweet-tangy chutney.",
      price: 95,
      image: "/api/ai/dish-image?dish=Samosa&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Bikanervala Famous Chole Bhature",
      description: "Twin crispy inflated bhaturas with rich spiced pindi chole and special raw mango pickle.",
      price: 190,
      image: "/api/ai/dish-image?dish=Chole%20Bhature&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Hot Crunchy Desi Ghee Jalebi (100g)",
      description: "Freshly piped golden spirals fried in pure desi ghee and immersed in saffron sugar syrup.",
      price: 120,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Wadeshwar
  'wadeshwar': [
    {
      name: "Wadeshwar Special Ghee Pudi Idli (2 Pcs)",
      description: "Soft steamed thatte idlis drenched in pure desi cow ghee and fiery gun powder spice mix.",
      price: 120,
      image: "/api/ai/dish-image?dish=Idli&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Wadeshwar Butter Mysore Masala Dosa",
      description: "Crispy red-paste coated crepe stuffed with spiced mashed potato filling and white coconut chutney.",
      price: 155,
      image: "/api/ai/dish-image?dish=Masala%20Dosa&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Wadeshwar Signature Filter Coffee",
      description: "South Indian chicory-decoction frothed with whole boiling milk in traditional brass tumbler.",
      price: 55,
      image: "/api/ai/dish-image?dish=Cold%20Coffee&v=v28",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Durvankur Dining Hall
  'durvankur': [
    {
      name: "Durvankur Authentic Puneri Unlimited Thali",
      description: "Sadashiv Peth legend: Puran Poli, Modak, Matki Usal, Kadhi, Amti, Bhakri, and Aamras.",
      price: 320,
      image: "/api/ai/dish-image?dish=Veg%20Thali&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Durvankur Traditional Puran Poli with Desi Ghee",
      description: "Sweet chana dal and jaggery stuffed wholewheat flatbread served piping hot with pure ghee.",
      price: 110,
      image: "/api/ai/dish-image?dish=Puran%20Poli&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Durvankur Steamed Ukdiche Modak (2 Pcs)",
      description: "Tender steamed rice dumplings filled with freshly grated coconut, organic jaggery & nutmeg.",
      price: 120,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Durvankur Spiced Masale Bhaat with Pure Ghee",
      description: "Fragrant rice tempered in authentic goda masala, tender cashews, coconut and pure desi ghee.",
      price: 140,
      image: "/images/food/masala_bhaat.jpg",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Phadke Dining Hall
  'phadke': [
    {
      name: "Phadke Authentic Puneri Unlimited Thali",
      description: "Sadashiv Peth legend: Puran Poli with Desi Ghee, Masale Bhaat, Katachi Amti, Batata Bhaji, and seasonal sweet.",
      price: 310,
      image: "/api/ai/dish-image?dish=Veg%20Thali&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Phadke Traditional Puran Poli with Desi Ghee",
      description: "Warm homemade puran poli served with generous dollop of pure desi cow ghee.",
      price: 110,
      image: "/api/ai/dish-image?dish=Puran%20Poli&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Phadke Spiced Masale Bhaat with Pure Ghee",
      description: "Fragrant rice tempered in goda masala, tender cashews, coconut and pure desi ghee.",
      price: 140,
      image: "/images/food/masala_bhaat.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Phadke Steamed Ukdiche Modak (2 Pcs)",
      description: "Handcrafted steamed rice flour modak filled with sweet coconut-jaggery stuffing.",
      price: 120,
      image: "/images/food/modak.jpg",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Kayani Bakery
  'kayani': [
    {
      name: "Kayani Legendary Shrewsbury Biscuits (250g)",
      description: "East Street iconic British-heritage rich butter cookies made fresh daily in vintage ovens.",
      price: 180,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Kayani Rich Mawa Cake Slice",
      description: "Dense, moist cardamom-spiced milk solid sponge cake baked with slivered cashews.",
      price: 90,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Kayani Crispy Butter Cheese Straws",
      description: "Flaky puff pastry twists baked crisp with aged cheddar cheese and black pepper.",
      price: 110,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Irani Cafe
  'irani cafe': [
    {
      name: "Irani Cafe Special Bun Maska & Irani Chai",
      description: "Parsi cafe signature warm sweet crust bun laden with whipped butter & rich aromatic tea.",
      price: 85,
      image: "/api/ai/dish-image?dish=Bun%20Maska&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Irani Cafe Mutton Keema Ghotala Pav",
      description: "Minced mutton slow-cooked with fresh mint, scrambled egg and butter-toasted ladi pav.",
      price: 260,
      image: "/api/ai/dish-image?dish=Keema%20Pav&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Irani Cafe Chicken Baida Roti",
      description: "Crispy shallow-fried parcel stuffed with spiced chicken mince, beaten egg and herbs.",
      price: 210,
      image: "/api/ai/dish-image?dish=Keema%20Pav&v=v28",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Shabree Maharashtrian Restaurant (FC Road, Pune)
  'shabree': [
    {
      name: "Shabree Special Maharashtrian Veg Thali",
      description: "Homestyle authentic spread: 2 hot chapatis, 2 vegetable bhajis, dal varan bhat with ghee, koshimbir, papad, pickle & sweet.",
      price: 240,
      image: "/api/ai/dish-image?dish=Maharashtrian%20Thali&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Authentic Pithla Bhakri with Thecha & Kanda",
      description: "Freshly roasted jowar bhakri paired with steaming hot spiced besan pithla, spicy green mirchi thecha & raw onion.",
      price: 180,
      image: "/api/ai/dish-image?dish=Pithla%20Bhakri&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Bharli Vangi with Jowar Bhakri",
      description: "Tender baby eggplants stuffed with peanut and goda masala gravy, served with hot bhakri.",
      price: 210,
      image: "/api/ai/dish-image?dish=Bharli%20Vangi&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Steamed Ukdiche Modak with Pure Ghee (2 Pcs)",
      description: "Fresh steamed rice flour dumplings filled with grated coconut, jaggery, cardamom and pure ghee.",
      price: 120,
      image: "/images/food/modak.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Crispy Kothimbir Vadi Platter with Green Chutney",
      description: "Steamed fresh coriander cakes shallow-fried extra crisp with spicy mint chutney.",
      price: 90,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Chilled Kokum Solkadhi Glass",
      description: "Refreshing digestive cooler made from wild kokum extract, coconut milk and roasted cumin.",
      price: 50,
      image: "/images/food/solkadhi.jpg",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Shreyas Dining Hall (Apte Road, Deccan, Pune)
  'shreyas': [
    {
      name: "Shreyas Heritage Maharashtrian Cultural Thali",
      description: "Apte Road's legendary cultural feast: Kothimbir Vadi, 2 bhajis, delicate Kadhi, Puri Bhaji, Varan Bhat with Toop & sweet.",
      price: 260,
      image: "/api/ai/dish-image?dish=Maharashtrian%20Thali&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Pure Desi Ghee Puran Poli Thali with Katachi Amti",
      description: "Two handmade golden Puran Polis drenched in hot pure desi ghee, served with spicy Katachi Amti & batata bhaji.",
      price: 240,
      image: "/api/ai/dish-image?dish=Puran%20Poli&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Special Alphonso Mango Aamras Bowl (Unlimited)",
      description: "Rich chilled pure Alphonso mango pulp served with hot puffed puris and white butter.",
      price: 180,
      image: "/api/ai/dish-image?dish=Mango%20Aamras&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Steamed Ukdiche Modak with Saffron Infusion (2 Pcs)",
      description: "Hot steamed rice-flour dumplings filled with fragrant coconut and jaggery, served with ghee.",
      price: 130,
      image: "/images/food/modak.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Crispy Kothimbir Vadi Plate with Green Chutney",
      description: "Steamed coriander and gram flour cakes shallow fried to golden crisp perfection.",
      price: 90,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Sukanta Thali (Deccan Gymkhana, Pune)
  'sukanta': [
    {
      name: "Sukanta Royal Unlimited Rajasthani & Gujarati Thali",
      description: "Deccan landmark royal feast: 25+ items including Dal Baati Churma, Paneer Makhani, Gatte Ki Sabzi, Phulkas, Dhokla & sweets.",
      price: 350,
      image: "/api/ai/dish-image?dish=Rajasthani%20Thali&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Traditional Dal Baati Churma with Pure Desi Ghee",
      description: "Clay-baked wheat baatis crushed and drenched in pure desi ghee, served with panchmel dal & sweet churma.",
      price: 240,
      image: "/api/ai/dish-image?dish=Dal%20Baati&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Shahi Paneer Butter Masala with Hot Phulkas",
      description: "Rich cottage cheese cubes simmered in creamy cashew-tomato gravy served with ghee phulkas.",
      price: 220,
      image: "/images/food/paneer_butter_masala.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Hot Malpua with Creamy Rabdi (2 Pcs)",
      description: "Crispy golden sweet pancakes soaked in saffron syrup crowned with thickened milk rabdi.",
      price: 120,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Hotel Nisarg Seafood (Kothrud, Pune)
  'nisarg': [
    {
      name: "Nisarg Special Surmai Rava Fish Fry (Kingfish)",
      description: "Fresh slice of Kingfish marinated in fiery Malvani red chilli-garlic paste and coated with crispy semolina.",
      price: 440,
      image: "/images/food/fish_fry.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Authentic Pomfret Curry Thali with Rice & Solkadhi",
      description: "Whole fresh pomfret simmered in spicy coastal coconut-kokum curry, served with steamed rice, chapati & solkadhi.",
      price: 490,
      image: "/images/food/fish_fry.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Butter Garlic Jumbo Tiger Prawns",
      description: "Succulent sea prawns tossed in rich golden butter, crushed garlic, and green herbs.",
      price: 420,
      image: "/images/food/fish_fry.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Crispy Kolambi (Prawns) Koliwada",
      description: "Deep-fried spicy battered prawns served with tangy red chutney and lemon.",
      price: 360,
      image: "/images/food/fish_fry.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Fresh Kokum Solkadhi Glass",
      description: "Digestive pink nectar made from wild kokum extract, coconut milk and roasted spices.",
      price: 50,
      image: "/images/food/solkadhi.jpg",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Chitale Bandhu Mithaiwale (Sadashiv Peth / Bajirao Road, Pune)
  'chitale': [
    {
      name: "Chitale Bandhu World-Famous Crunchy Bakarwadi (500g)",
      description: "Pune's historic 1950 institution: spiral crispy fried pastry rolls stuffed with secret spicy-tangy roasted coconut masala.",
      price: 180,
      image: "/api/ai/dish-image?dish=Bakarwadi&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Chitale Bandhu Signature Mango Barfi (Amba Barfi)",
      description: "Iconic double-layered fudge made with Alphonso mango pulp and condensed milk solids.",
      price: 220,
      image: "/api/ai/dish-image?dish=Mango%20Barfi&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Special Kesari Shrikhand Tub",
      description: "Thick strained creamy yoghurt dessert infused with Kashmiri saffron threads and green cardamom.",
      price: 140,
      image: "/api/ai/dish-image?dish=Shrikhand&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Crispy Pyaaz Kachori with Chutney (2 Pcs)",
      description: "Flaky golden fried pastry stuffed with spicy caramelized onion masala.",
      price: 80,
      image: "/api/ai/dish-image?dish=Samosa&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Hot Crispy Jalebi with Creamy Rabdi",
      description: "Thin golden jalebi spirals fried fresh in pure ghee and soaked in saffron syrup.",
      price: 120,
      image: "/images/food/jalebi.jpg",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Marz-O-Rin (MG Road Camp, Pune)
  'marz-o-rin': [
    {
      name: "Special Shredded Chicken Sandwich",
      description: "MG Road 1965 bakery legend: soft white bread packed with creamy shredded spiced chicken and secret mayo.",
      price: 110,
      image: "/api/ai/dish-image?dish=Chicken%20Sandwich&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Baked Macaroni with Cheese & Tomato",
      description: "Classic European comfort bake with tender elbow macaroni, rich cheddar cheese, and tangy tomato glaze.",
      price: 160,
      image: "/api/ai/dish-image?dish=Pasta&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Fresh Chilled Rich Apple Juice",
      description: "Camp heritage freshly pressed unfiltered apple juice served ice-cold.",
      price: 90,
      image: "/api/ai/dish-image?dish=Apple%20Juice&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Classic Veg Chutney Sandwich",
      description: "Triple-layered triangular sandwich with cucumber, tomato, potato, and fiery green mint chutney.",
      price: 70,
      image: "/api/ai/dish-image?dish=Veg%20Sandwich&v=v28",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Poona Guest House (Sadashiv Peth, Laxmi Road, Pune) - Historic 1935 Pure Veg Maharashtrian Cultural Institution
  'poona guest': [
    {
      name: "Traditional Puneri Maharashtrian Thali",
      description: "Sadashiv Peth 1935 heritage: 2 fresh chapatis, 2 seasonal bhajis, spicy Katachi Amti, Koshimbir, Indrayani Varan Bhat with sajuk toop & sweet.",
      price: 260,
      image: "/api/ai/dish-image?dish=Maharashtrian%20Thali&v=v28",
      popularity: 100,
      rating: 5.0,
      category: "Thalis & Combos",
      is_veg: 1
    },
    {
      name: "Special Puran Poli Thali with Pure Desi Ghee",
      description: "Traditional feast with unlimited Katachi Amti, 2 handmade Puran Polis drenched in warm sajuk toop, batata bhaji, koshimbir & varan bhat.",
      price: 280,
      image: "https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0,
      category: "Thalis & Combos",
      is_veg: 1
    },
    {
      name: "Steamed Ukdiche Modak with Pure Ghee (2 Pcs)",
      description: "Sadashiv Peth's legendary steamed fragrant rice-flour dumplings filled with freshly grated coconut and organic jaggery.",
      price: 120,
      image: "/images/food/modak.jpg",
      popularity: 100,
      rating: 5.0,
      category: "Desserts & Sweets",
      is_veg: 1
    },
    {
      name: "Puran Poli with Katachi Amti & Pure Ghee (2 Pcs)",
      description: "Handmade sweet flatbreads stuffed with cardamom chana dal jaggery paste, served with spicy amti & hot desi ghee.",
      price: 140,
      image: "/api/ai/dish-image?dish=Puran%20Poli&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Garma Garam Pithla Bhakri with Thecha & Kanda",
      description: "Hot comforting besan pithla served with piping hot roasted jowar/bajra bhakri, spicy green mirchi thecha and fresh sliced onions.",
      price: 160,
      image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Authentic Bhajani Thalipeeth with White Loni Butter",
      description: "Crispy multigrain roasted flatbread prepared from traditional bhajani flour, served with fresh white butter and homemade pickle.",
      price: 120,
      image: "https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85",
      popularity: 99,
      rating: 4.9,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Crispy Kothimbir Vadi Platter",
      description: "Steamed and shallow-fried coriander and spiced gram flour diamond cakes served with spicy green chutney.",
      price: 90,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 97,
      rating: 4.8,
      category: "Starters & Snacks",
      is_veg: 1
    },
    {
      name: "Steamed & Fried Alu Vadi Plate (Patra)",
      description: "Tender colocasia leaf pinwheels seasoned with tamarind-jaggery paste, garnished with white sesame & fresh coconut.",
      price: 90,
      image: "/images/food/alu_vadi.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Starters & Snacks",
      is_veg: 1
    },
    {
      name: "Authentic Bharli Vangi with Jowar Bhakri",
      description: "Baby brinjals slow-simmered in roasted peanut, sesame, coconut and goda masala gravy, served with 2 jowar bhakris.",
      price: 190,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85",
      popularity: 97,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Indrayani Varan Bhat with Pure Desi Ghee & Nimbu",
      description: "Steaming aromatic soft Indrayani rice topped with slow-cooked yellow lentil varan, sajuk toop & fresh lemon.",
      price: 130,
      image: "https://images.unsplash.com/photo-1789991184293-224a84e41900?w=800&auto=format&fit=crop&q=85",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Traditional Masala Bhaat with Ghee",
      description: "Puneri festive spiced rice cooked with ivy gourd, green peas, whole cloves, cinnamon, cashews and freshly grated coconut.",
      price: 150,
      image: "/api/ai/dish-image?dish=Masala%20Bhaat&v=v28",
      popularity: 97,
      rating: 4.9,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Aluche Fadfade with Chapati",
      description: "Festive sweet, sour and spicy colocasia stem and leaf stew cooked with roasted peanuts and chana dal.",
      price: 160,
      image: "/api/ai/dish-image?dish=Aluche%20Fadfade&v=v28",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Spiced Matki Usal Plate with Chapati",
      description: "Tender sprouted moth beans tempered with mustard, curry leaves, hing, and fresh grated coconut.",
      price: 140,
      image: "/api/ai/dish-image?dish=Matki%20Usal&v=v28",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Khandeshi Shev Bhaji with Hot Chapatis",
      description: "Spicy roasted red masala gravy topped with thick crunchy Ratlami shev, served with 2 chapatis.",
      price: 170,
      image: "/images/food/shev_bhaji.jpg",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Batata Sukhi Bhaji with 2 Chapatis",
      description: "Puneri yellow tempered potato sabzi tossed with green chillies, mustard seeds, curry leaves & fresh coriander.",
      price: 120,
      image: "/api/ai/dish-image?dish=Batata%20Bhaji&v=v28",
      popularity: 95,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Fresh Shrikhand Puri Plate (4 Pcs)",
      description: "Creamy saffron and cardamom-infused hung curd shrikhand served with 4 puffed golden wheat puris.",
      price: 160,
      image: "/api/ai/dish-image?dish=Shrikhand%20Puri&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Desserts & Sweets",
      is_veg: 1
    },
    {
      name: "Pure Alphonso Aamras Puri Platter",
      description: "Seasonal heritage special: pure Alphonso mango pulp served with 4 fluffy hot puris.",
      price: 210,
      image: "/api/ai/dish-image?dish=Aamras%20Puri&v=v28",
      popularity: 99,
      rating: 5.0,
      category: "Desserts & Sweets",
      is_veg: 1
    },
    {
      name: "Puneri Khamang Kakdi (Salad)",
      description: "Crisp cucumber salad tossed with roasted crushed peanuts, green chillies, fresh lemon juice, and mustard curry leaf tadka.",
      price: 80,
      image: "/api/ai/dish-image?dish=Khamang%20Kakdi&v=v28",
      popularity: 95,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Chilled Masala Taak (Puneri Mattha)",
      description: "Traditional spiced buttermilk tempered with crushed ginger, green chillies, fresh mint, coriander, and roasted cumin.",
      price: 40,
      image: "/images/food/masala_taak.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Digestive Pink Kokum Solkadhi",
      description: "Refreshing natural coastal cooler extracted from fresh coconut milk and wild kokum with crushed green chilies and garlic.",
      price: 50,
      image: "/images/food/solkadhi.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Authentic Dadpe Pohe",
      description: "Traditional uncooked flattened rice tossed with freshly grated coconut, raw onion, crushed peanuts, green chillies and lemon.",
      price: 80,
      image: "/api/ai/dish-image?dish=Dadpe%20Pohe&v=v28",
      popularity: 96,
      rating: 4.8,
      category: "Breakfast",
      is_veg: 1
    },
    {
      name: "Sabudana Khichdi with Sweet Dahi",
      description: "Tender sago pearls sauteed in pure ghee with roasted peanuts, cumin, and green chillies, served with fresh curd.",
      price: 90,
      image: "/api/ai/dish-image?dish=Sabudana%20Khichdi&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Breakfast",
      is_veg: 1
    },
    {
      name: "Crispy Sabudana Vada (2 Pcs)",
      description: "Golden-crisp sago and potato patties served with sweet-tangy peanut yogurt chutney.",
      price: 90,
      image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v28",
      popularity: 97,
      rating: 4.9,
      category: "Starters & Snacks",
      is_veg: 1
    },
    {
      name: "Hot Gulab Jamun in Saffron Syrup (2 Pcs)",
      description: "Warm melt-in-mouth mawa dumplings soaked in cardamom sugar syrup.",
      price: 80,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 97,
      rating: 4.8,
      category: "Desserts & Sweets",
      is_veg: 1
    },
    {
      name: "Extra Hot Katachi Amti Bowl",
      description: "Spicy, tangy thin chana dal broth flavored with goda masala, coconut, and mustard tempering.",
      price: 60,
      image: "/api/ai/dish-image?dish=Katachi%20Amti&v=v28",
      popularity: 97,
      rating: 4.9,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Fresh Jowar Bhakri (2 Pcs)",
      description: "Traditional hand-patted roasted sorghum flatbreads with charred aroma.",
      price: 50,
      image: "/images/food/pithla_bhakri.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Indian Breads",
      is_veg: 1
    },
    {
      name: "Hot Phulka Chapati Plate (3 Pcs)",
      description: "Soft whole wheat rotis lightly brushed with pure ghee.",
      price: 40,
      image: "/api/ai/dish-image?dish=Roti&v=v28",
      popularity: 97,
      rating: 4.8,
      category: "Indian Breads",
      is_veg: 1
    },
    {
      name: "Authentic Maharashtrian Puri Bhaji",
      description: "4 Crispy golden puffed puris served with aromatic yellow batata sukhi bhaji, lemon and green thecha.",
      price: 130,
      image: "/images/food/puri_bhaji.jpg",
      popularity: 99,
      rating: 4.9,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Traditional Kheer with Saffron & Roasted Dry Fruits",
      description: "Slow-cooked rich creamy milk kheer infused with Kashmiri saffron, cardamom, cashews, almonds & pistachios.",
      price: 90,
      image: "/images/food/kheer.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Desserts & Sweets",
      is_veg: 1
    }
  ],
  'poona guest house': [
    {
      name: "Traditional Puneri Maharashtrian Thali",
      description: "Sadashiv Peth 1935 heritage: 2 fresh chapatis, 2 seasonal bhajis, spicy Katachi Amti, Koshimbir, Indrayani Varan Bhat with sajuk toop & sweet.",
      price: 260,
      image: "/api/ai/dish-image?dish=Maharashtrian%20Thali&v=v28",
      popularity: 100,
      rating: 5.0,
      category: "Thalis & Combos",
      is_veg: 1
    },
    {
      name: "Special Puran Poli Thali with Pure Desi Ghee",
      description: "Traditional feast with unlimited Katachi Amti, 2 handmade Puran Polis drenched in warm sajuk toop, batata bhaji, koshimbir & varan bhat.",
      price: 280,
      image: "https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0,
      category: "Thalis & Combos",
      is_veg: 1
    },
    {
      name: "Steamed Ukdiche Modak with Pure Ghee (2 Pcs)",
      description: "Sadashiv Peth's legendary steamed fragrant rice-flour dumplings filled with freshly grated coconut and organic jaggery.",
      price: 120,
      image: "/images/food/modak.jpg",
      popularity: 100,
      rating: 5.0,
      category: "Desserts & Sweets",
      is_veg: 1
    },
    {
      name: "Puran Poli with Katachi Amti & Pure Ghee (2 Pcs)",
      description: "Handmade sweet flatbreads stuffed with cardamom chana dal jaggery paste, served with spicy amti & hot desi ghee.",
      price: 140,
      image: "/api/ai/dish-image?dish=Puran%20Poli&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Garma Garam Pithla Bhakri with Thecha & Kanda",
      description: "Hot comforting besan pithla served with piping hot roasted jowar/bajra bhakri, spicy green mirchi thecha and fresh sliced onions.",
      price: 160,
      image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=85",
      popularity: 100,
      rating: 5.0,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Authentic Bhajani Thalipeeth with White Loni Butter",
      description: "Crispy multigrain roasted flatbread prepared from traditional bhajani flour, served with fresh white butter and homemade pickle.",
      price: 120,
      image: "https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85",
      popularity: 99,
      rating: 4.9,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Crispy Kothimbir Vadi Platter",
      description: "Steamed and shallow-fried coriander and spiced gram flour diamond cakes served with spicy green chutney.",
      price: 90,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 97,
      rating: 4.8,
      category: "Starters & Snacks",
      is_veg: 1
    },
    {
      name: "Steamed & Fried Alu Vadi Plate (Patra)",
      description: "Tender colocasia leaf pinwheels seasoned with tamarind-jaggery paste, garnished with white sesame & fresh coconut.",
      price: 90,
      image: "/images/food/alu_vadi.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Starters & Snacks",
      is_veg: 1
    },
    {
      name: "Authentic Bharli Vangi with Jowar Bhakri",
      description: "Baby brinjals slow-simmered in roasted peanut, sesame, coconut and goda masala gravy, served with 2 jowar bhakris.",
      price: 190,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85",
      popularity: 97,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Indrayani Varan Bhat with Pure Desi Ghee & Nimbu",
      description: "Steaming aromatic soft Indrayani rice topped with slow-cooked yellow lentil varan, sajuk toop & fresh lemon.",
      price: 130,
      image: "https://images.unsplash.com/photo-1789991184293-224a84e41900?w=800&auto=format&fit=crop&q=85",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Traditional Masala Bhaat with Ghee",
      description: "Puneri festive spiced rice cooked with ivy gourd, green peas, whole cloves, cinnamon, cashews and freshly grated coconut.",
      price: 150,
      image: "/api/ai/dish-image?dish=Masala%20Bhaat&v=v28",
      popularity: 97,
      rating: 4.9,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Aluche Fadfade with Chapati",
      description: "Festive sweet, sour and spicy colocasia stem and leaf stew cooked with roasted peanuts and chana dal.",
      price: 160,
      image: "/api/ai/dish-image?dish=Aluche%20Fadfade&v=v28",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Spiced Matki Usal Plate with Chapati",
      description: "Tender sprouted moth beans tempered with mustard, curry leaves, hing, and fresh grated coconut.",
      price: 140,
      image: "/api/ai/dish-image?dish=Matki%20Usal&v=v28",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Khandeshi Shev Bhaji with Hot Chapatis",
      description: "Spicy roasted red masala gravy topped with thick crunchy Ratlami shev, served with 2 chapatis.",
      price: 170,
      image: "/images/food/shev_bhaji.jpg",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Batata Sukhi Bhaji with 2 Chapatis",
      description: "Puneri yellow tempered potato sabzi tossed with green chillies, mustard seeds, curry leaves & fresh coriander.",
      price: 120,
      image: "/api/ai/dish-image?dish=Batata%20Bhaji&v=v28",
      popularity: 95,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Fresh Shrikhand Puri Plate (4 Pcs)",
      description: "Creamy saffron and cardamom-infused hung curd shrikhand served with 4 puffed golden wheat puris.",
      price: 160,
      image: "/api/ai/dish-image?dish=Shrikhand%20Puri&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Desserts & Sweets",
      is_veg: 1
    },
    {
      name: "Pure Alphonso Aamras Puri Platter",
      description: "Seasonal heritage special: pure Alphonso mango pulp served with 4 fluffy hot puris.",
      price: 210,
      image: "/api/ai/dish-image?dish=Aamras%20Puri&v=v28",
      popularity: 99,
      rating: 5.0,
      category: "Desserts & Sweets",
      is_veg: 1
    },
    {
      name: "Puneri Khamang Kakdi (Salad)",
      description: "Crisp cucumber salad tossed with roasted crushed peanuts, green chillies, fresh lemon juice, and mustard curry leaf tadka.",
      price: 80,
      image: "/api/ai/dish-image?dish=Khamang%20Kakdi&v=v28",
      popularity: 95,
      rating: 4.8,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Chilled Masala Taak (Puneri Mattha)",
      description: "Traditional spiced buttermilk tempered with crushed ginger, green chillies, fresh mint, coriander, and roasted cumin.",
      price: 40,
      image: "/images/food/masala_taak.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Digestive Pink Kokum Solkadhi",
      description: "Refreshing natural coastal cooler extracted from fresh coconut milk and wild kokum with crushed green chilies and garlic.",
      price: 50,
      image: "/images/food/solkadhi.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Authentic Dadpe Pohe",
      description: "Traditional uncooked flattened rice tossed with freshly grated coconut, raw onion, crushed peanuts, green chillies and lemon.",
      price: 80,
      image: "/api/ai/dish-image?dish=Dadpe%20Pohe&v=v28",
      popularity: 96,
      rating: 4.8,
      category: "Breakfast",
      is_veg: 1
    },
    {
      name: "Sabudana Khichdi with Sweet Dahi",
      description: "Tender sago pearls sauteed in pure ghee with roasted peanuts, cumin, and green chillies, served with fresh curd.",
      price: 90,
      image: "/api/ai/dish-image?dish=Sabudana%20Khichdi&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Breakfast",
      is_veg: 1
    },
    {
      name: "Crispy Sabudana Vada (2 Pcs)",
      description: "Golden-crisp sago and potato patties served with sweet-tangy peanut yogurt chutney.",
      price: 90,
      image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v28",
      popularity: 97,
      rating: 4.9,
      category: "Starters & Snacks",
      is_veg: 1
    },
    {
      name: "Hot Gulab Jamun in Saffron Syrup (2 Pcs)",
      description: "Warm melt-in-mouth mawa dumplings soaked in cardamom sugar syrup.",
      price: 80,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 97,
      rating: 4.8,
      category: "Desserts & Sweets",
      is_veg: 1
    },
    {
      name: "Extra Hot Katachi Amti Bowl",
      description: "Spicy, tangy thin chana dal broth flavored with goda masala, coconut, and mustard tempering.",
      price: 60,
      image: "/api/ai/dish-image?dish=Katachi%20Amti&v=v28",
      popularity: 97,
      rating: 4.9,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Fresh Jowar Bhakri (2 Pcs)",
      description: "Traditional hand-patted roasted sorghum flatbreads with charred aroma.",
      price: 50,
      image: "/images/food/pithla_bhakri.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Indian Breads",
      is_veg: 1
    },
    {
      name: "Hot Phulka Chapati Plate (3 Pcs)",
      description: "Soft whole wheat rotis lightly brushed with pure ghee.",
      price: 40,
      image: "/api/ai/dish-image?dish=Roti&v=v28",
      popularity: 97,
      rating: 4.8,
      category: "Indian Breads",
      is_veg: 1
    },
    {
      name: "Authentic Maharashtrian Puri Bhaji",
      description: "4 Crispy golden puffed puris served with aromatic yellow batata sukhi bhaji, lemon and green thecha.",
      price: 130,
      image: "/images/food/puri_bhaji.jpg",
      popularity: 99,
      rating: 4.9,
      category: "Maharashtrian",
      is_veg: 1
    },
    {
      name: "Traditional Kheer with Saffron & Roasted Dry Fruits",
      description: "Slow-cooked rich creamy milk kheer infused with Kashmiri saffron, cardamom, cashews, almonds & pistachios.",
      price: 90,
      image: "/images/food/kheer.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Desserts & Sweets",
      is_veg: 1
    }
  ],

  // Bipin Snacks & Katta (Karve Road, Kothrud, Pune)
  'bipin': [
    {
      name: "Traditional Thalipeeth with White Loni Butter",
      description: "Kothrud morning legend: multi-grain roasted flatbread spiced with onion and coriander, topped with fresh white loni.",
      price: 110,
      image: "/api/ai/dish-image?dish=Thalipeeth&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Crispy Sabudana Vada with Sweet Dahi (2 Pcs)",
      description: "Golden fried crispy sago and roasted peanut patties served with sweet curd chutney.",
      price: 80,
      image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Steamed Kothimbir Vadi Fry",
      description: "Fresh coriander and gram flour savory cakes steamed and shallow-fried till super crisp.",
      price: 90,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Puneri Kanda Poha Supreme with Sev & Coconut",
      description: "Fluffy flattened rice tempered with mustard seeds, turmeric, peanuts, and freshly grated coconut.",
      price: 50,
      image: "/api/ai/dish-image?dish=Kanda%20Poha&v=v28",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Saraswati Misal (Dhayari / Nanded Phata, Pune)
  'saraswati': [
    {
      name: "Fiery Kolhapuri Rassa Misal with Toasted Pav",
      description: "Extra spicy sprouted bean misal drenched in blazing red spicy tarri gravy, served with toasted pav & lemon.",
      price: 120,
      image: "/api/ai/dish-image?dish=Misal%20Pav&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Puneri Matki Misal Pav with Extra Tarri",
      description: "Authentic Puneri style misal with poha base, spicy sprouted matki, mixed farsan, and extra rassa cup.",
      price: 110,
      image: "/api/ai/dish-image?dish=Misal%20Pav&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Crispy Batata Vada Sambar (2 Pcs)",
      description: "Golden fried spiced potato fritters served with hot spicy lentil sambar and green mint chutney.",
      price: 70,
      image: "/images/food/vada_pav.jpg",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "Chilled Kokum Solkadhi Glass",
      description: "Soothing pink drink made from coconut milk, kokum extract, green chilli and garlic.",
      price: 45,
      image: "/images/food/solkadhi.jpg",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Katta Cafe (Near MIT College, Kothrud, Pune)
  'katta': [
    {
      name: "Famous Katta Special Thick Cold Coffee",
      description: "Kothrud youth favorite: thick creamy frothed cold coffee topped with rich chocolate drizzle.",
      price: 70,
      image: "/api/ai/dish-image?dish=Cold%20Coffee&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Cheese Corn Grill Sandwich",
      description: "Golden toasted jumbo sandwich stuffed with sweet corn, capsicum, and molten cheese blend.",
      price: 140,
      image: "/api/ai/dish-image?dish=Veg%20Sandwich&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Schezwan Double Masala Maggi",
      description: "Wok-tossed spicy noodles loaded with vegetables, Schezwan chili paste, and extra cheese.",
      price: 100,
      image: "/api/ai/dish-image?dish=Maggi&v=v28",
      popularity: 97,
      rating: 4.8
    },
    {
      name: "Peri Peri French Fries Large",
      description: "Crispy golden potato fries seasoned with fiery African peri peri spice rub.",
      price: 110,
      image: "/api/ai/dish-image?dish=French%20Fries&v=v28",
      popularity: 96,
      rating: 4.8
    }
  ],

  // Tilak Hotel (Tilak Road, Shukrawar Peth, Pune)
  'tilak': [
    {
      name: "Tilak Road Special Misal Pav",
      description: "Classic spicy Shukrawar Peth misal with crunchy farsan, diced onions, and buttery toasted pav.",
      price: 110,
      image: "/api/ai/dish-image?dish=Misal%20Pav&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Crispy Batata Vada Sambar (2 Pcs)",
      description: "Two deep-fried golden spiced potato balls served with flavorful aromatic sambar.",
      price: 65,
      image: "/images/food/vada_pav.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Kanda Bhajji (Pakoda) Plate",
      description: "Crispy sliced onion fritters deep fried in seasoned gram flour batter, served with spicy chutney.",
      price: 70,
      image: "/api/ai/dish-image?dish=Bhajji&v=v28",
      popularity: 97,
      rating: 4.8
    },
    {
      name: "Special Adrak Wali Chai",
      description: "Strong boiled milk tea infused with freshly crushed ginger root.",
      price: 25,
      image: "/api/ai/dish-image?dish=Masala%20Chai&v=v28",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Joshi Wadewale (Iconic Pune Maharashtrian Pure Veg Snack Institution since 1989)
  'joshi wadewale': [
    {
      name: "Joshi Special Vada Pav",
      description: "Pune's iconic 1989 legend: piping hot golden batata vada inside fresh soft pav, slathered with fiery dry garlic chutney, green mint chutney & fried green chilli.",
      price: 25,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v30",
      popularity: 100,
      rating: 5.0,
      category: "Vada Pav & Snacks",
      is_veg: 1
    },
    {
      name: "Crispy Batata Vada Plate (2 Pcs)",
      description: "Handcrafted potato mash tempered with mustard seeds, green chillies, ginger & turmeric, golden fried in besan batter, served with fried chillies.",
      price: 40,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v30",
      popularity: 99,
      rating: 5.0,
      category: "Vada Pav & Snacks",
      is_veg: 1
    },
    {
      name: "Puneri Misal Pav Special",
      description: "Authentic spicy sprouted matki usal layered with fluffy poha, crunchy Puneri farsan, chopped onions, coriander, fiery tarri rassa and soft butter pav.",
      price: 90,
      image: "/api/ai/dish-image?dish=Misal%20Pav&v=v30",
      popularity: 98,
      rating: 4.9,
      category: "Misal & Snacks",
      is_veg: 1
    },
    {
      name: "Crispy Kothimbir Vadi (6 Pcs)",
      description: "Traditional Maharashtrian steamed fresh coriander and gram flour diamond cakes shallow-fried to perfection, served with sweet-tangy chutney.",
      price: 80,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Maharashtrian Snacks",
      is_veg: 1
    },
    {
      name: "Sabudana Vada with Sweet Dahi (2 Pcs)",
      description: "Crispy golden fried sago tapioca pearl and roasted crushed peanut patties, served with sweet spiced curd and peanut chutney.",
      price: 80,
      image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v30",
      popularity: 97,
      rating: 4.9,
      category: "Upwas & Fasting Special",
      is_veg: 1
    },
    {
      name: "Puneri Kanda Poha Plate",
      description: "Fluffy flattened rice cooked with tempered mustard seeds, turmeric, green chillies, curry leaves, potatoes, roasted peanuts & grated coconut.",
      price: 40,
      image: "/api/ai/dish-image?dish=Kanda%20Poha&v=v30",
      popularity: 97,
      rating: 4.8,
      category: "Maharashtrian Breakfast",
      is_veg: 1
    },
    {
      name: "Crispy Kanda Bhajji Plate (Pakoda)",
      description: "Thinly sliced onions coated in spiced carom-seed besan batter and fried ultra crispy, served with fried salted green chillies.",
      price: 60,
      image: "/api/ai/dish-image?dish=Kanda%20Bhaji&v=v30",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian Snacks",
      is_veg: 1
    },
    {
      name: "Crispy Moong Dal Bhajji Plate",
      description: "Spiced yellow moong dal fritters deep-fried golden and crunchy, served with mint coriander chutney.",
      price: 70,
      image: "/api/ai/dish-image?dish=Bhajji&v=v30",
      popularity: 95,
      rating: 4.8,
      category: "Maharashtrian Snacks",
      is_veg: 1
    },
    {
      name: "Maharashtrian Thalipeeth with Loni Butter",
      description: "Multi-grain roasted flour spiced flatbread made with traditional bhajani, served piping hot with fresh white butter and spicy green thecha.",
      price: 90,
      image: "/api/ai/dish-image?dish=Thalipeeth&v=v30",
      popularity: 98,
      rating: 4.9,
      category: "Maharashtrian Breakfast",
      is_veg: 1
    },
    {
      name: "Sabudana Khichdi (Upwas Special)",
      description: "Sago tapioca pearls sauteed in desi ghee with roasted peanut powder, cumin seeds, green chillies, and boiled potatoes.",
      price: 70,
      image: "/api/ai/dish-image?dish=Sabudana%20Khichdi&v=v30",
      popularity: 96,
      rating: 4.8,
      category: "Upwas & Fasting Special",
      is_veg: 1
    },
    {
      name: "Puri Bhaji Plate (4 Puris with Batata Bhaji)",
      description: "Puffed golden whole wheat puris served with comforting Maharashtrian yellow potato bhaji tempered with mustard and turmeric.",
      price: 80,
      image: "/api/ai/dish-image?dish=Puri%20Bhaji&v=v30",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian Breakfast",
      is_veg: 1
    },
    {
      name: "Special Masala Taak (Cooling Buttermilk)",
      description: "Refreshing churned spiced yogurt cooler seasoned with roasted cumin, ginger, coriander, and rock salt.",
      price: 30,
      image: "/images/food/masala_taak.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Chilled Shahi Piyush Glass",
      description: "Thick, creamy, traditional Maharashtrian festive beverage prepared with sweetened shrikhand, curd, nutmeg, saffron, and pistachios.",
      price: 70,
      image: "/api/ai/dish-image?dish=Lassi&v=v30",
      popularity: 99,
      rating: 5.0,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Special Ginger Masala Cutting Chai",
      description: "Strong piping hot brew of Assam tea leaves, buffalo milk, crushed ginger, cardamom, and lemongrass.",
      price: 20,
      image: "/api/ai/dish-image?dish=Masala%20Chai&v=v30",
      popularity: 99,
      rating: 5.0,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Special South Indian Filter Coffee",
      description: "Fresh chicory-infused strong coffee decoction frothed with rich hot milk.",
      price: 35,
      image: "/api/ai/dish-image?dish=Filter%20Coffee&v=v30",
      popularity: 95,
      rating: 4.7,
      category: "Beverages",
      is_veg: 1
    }
  ],

  // Rohit Wadewale (Pune Fast Food & Vada Pav Chain)
  'rohit wadewale': [
    {
      name: "Rohit Classic Vada Pav",
      description: "Rohit's signature freshly fried jumbo batata vada packed inside soft pav with spicy green chutney, fiery dry garlic chutney and fried chillies.",
      price: 25,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v30",
      popularity: 100,
      rating: 5.0,
      category: "Vada Pav & Snacks",
      is_veg: 1
    },
    {
      name: "Rohit Cheese Burst Vada Pav",
      description: "Golden crispy batata vada topped with melted processed cheese slice and spiced mayo inside soft toasted pav.",
      price: 50,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v30",
      popularity: 99,
      rating: 5.0,
      category: "Vada Pav & Snacks",
      is_veg: 1
    },
    {
      name: "Ulta Vada Pav (Signature Specialty)",
      description: "Rohit's famous invention: spicy potato bhaji stuffed inside pav, dipped completely in spiced gram flour batter and fried crispy like a savory pocket.",
      price: 45,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v30",
      popularity: 99,
      rating: 5.0,
      category: "Vada Pav & Snacks",
      is_veg: 1
    },
    {
      name: "Crispy Batata Vada Plate (2 Pcs)",
      description: "Two piping hot Maharashtrian potato fritters served with hot garlic-coconut chutney and fried green chillies.",
      price: 40,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v30",
      popularity: 98,
      rating: 4.9,
      category: "Vada Pav & Snacks",
      is_veg: 1
    },
    {
      name: "Puneri Misal Pav with Butter Pav",
      description: "Spicy sprout curry with thick crunchy farsan, diced onions, lemon wedge, and 2 butter-toasted pavs.",
      price: 85,
      image: "/api/ai/dish-image?dish=Misal%20Pav&v=v30",
      popularity: 98,
      rating: 4.9,
      category: "Misal & Snacks",
      is_veg: 1
    },
    {
      name: "Crispy Samosa Pav with Chutney",
      description: "Crunchy spiced potato and green pea samosa stuffed inside soft pav with sweet date chutney and fiery garlic podi.",
      price: 30,
      image: "/api/ai/dish-image?dish=Samosa&v=v30",
      popularity: 97,
      rating: 4.8,
      category: "Vada Pav & Snacks",
      is_veg: 1
    },
    {
      name: "Crispy Kanda Bhaji Plate (Pyaaz Pakoda)",
      description: "Crunchy onion fritters tossed with carom seeds and green chillies, fried crisp.",
      price: 60,
      image: "/api/ai/dish-image?dish=Kanda%20Bhaji&v=v30",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian Snacks",
      is_veg: 1
    },
    {
      name: "Sabudana Vada with Dahi (2 Pcs)",
      description: "Fasting delicacy: crispy tapioca pearl vadas with crushed roasted peanuts, served with sweetened curd.",
      price: 75,
      image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v30",
      popularity: 97,
      rating: 4.9,
      category: "Upwas & Fasting Special",
      is_veg: 1
    },
    {
      name: "Kanda Poha with Peanuts & Sev",
      description: "Steamed seasoned flattened rice garnished with crunchy peanuts, fine sev, fresh cilantro and lemon.",
      price: 40,
      image: "/api/ai/dish-image?dish=Kanda%20Poha&v=v30",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian Breakfast",
      is_veg: 1
    },
    {
      name: "Bread Pattice Plate with Chutney",
      description: "Triangular bread slices sandwiched with spicy batata mash, dipped in gram flour batter and deep-fried golden.",
      price: 40,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v30",
      popularity: 95,
      rating: 4.8,
      category: "Maharashtrian Snacks",
      is_veg: 1
    },
    {
      name: "Sabudana Khichdi Plate",
      description: "Upwas special sago pearls tossed in ghee with roasted peanuts, cumin, and potatoes.",
      price: 65,
      image: "/api/ai/dish-image?dish=Sabudana%20Khichdi&v=v30",
      popularity: 95,
      rating: 4.7,
      category: "Upwas & Fasting Special",
      is_veg: 1
    },
    {
      name: "Special Masala Taak (Buttermilk)",
      description: "Chilled churning of fresh curd with roasted cumin, mint, and black salt.",
      price: 25,
      image: "/images/food/masala_taak.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Kokum Solkadhi Glass",
      description: "Digestive pink cooler made with fresh coconut milk, kokum juice, garlic, and green chillies.",
      price: 40,
      image: "/images/food/solkadhi.jpg",
      popularity: 97,
      rating: 4.8,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Special Kadak Cutting Chai",
      description: "Strong hot milk tea brewed with crushed ginger and aromatic spices.",
      price: 20,
      image: "/api/ai/dish-image?dish=Masala%20Chai&v=v30",
      popularity: 99,
      rating: 5.0,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Thick Cold Coffee with Chocolate Sauce",
      description: "Frothed rich chilled milk coffee topped with chocolate syrup.",
      price: 60,
      image: "/api/ai/dish-image?dish=Cold%20Coffee&v=v30",
      popularity: 96,
      rating: 4.8,
      category: "Beverages",
      is_veg: 1
    }
  ],

  // Shaniwar Peth (Pune Heritage Cultural Snacks & Meals)
  'shaniwar peth': [
    {
      name: "Shaniwar Peth Puneri Vada Pav",
      description: "Iconic heritage-style batata vada nestled in soft pav with freshly ground dry garlic-coconut chutney and fried salted green chillies.",
      price: 25,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v30",
      popularity: 100,
      rating: 5.0,
      category: "Vada Pav & Snacks",
      is_veg: 1
    },
    {
      name: "Shaniwar Wada Special Misal Pav",
      description: "Heritage Puneri misal with sprouted matki, crunchy chiwda and farsan, topped with spicy red rassa, chopped onion, and butter pav.",
      price: 90,
      image: "/api/ai/dish-image?dish=Misal%20Pav&v=v30",
      popularity: 100,
      rating: 5.0,
      category: "Misal & Snacks",
      is_veg: 1
    },
    {
      name: "Traditional Pithla Bhakri with Thecha",
      description: "Piping hot besan pithla tempered with mustard and garlic, served with fresh roasted jowar bhakri, fiery green mirchi thecha, and raw onion.",
      price: 150,
      image: "/images/food/pithla_bhakri.jpg",
      popularity: 99,
      rating: 5.0,
      category: "Maharashtrian Meals",
      is_veg: 1
    },
    {
      name: "Crispy Kothimbir Vadi (6 Pcs)",
      description: "Traditional coriander cakes steamed and shallow-fried golden crisp, served with mint chutney.",
      price: 80,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Maharashtrian Snacks",
      is_veg: 1
    },
    {
      name: "Maharashtrian Thalipeeth with Fresh White Loni",
      description: "Spiced multi-grain bhajani flatbread pan-toasted with ghee, served with dollop of fresh churned white butter.",
      price: 95,
      image: "/images/food/thalipeeth.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Maharashtrian Breakfast",
      is_veg: 1
    },
    {
      name: "Puran Poli with Desi Ghee & Katachi Amti",
      description: "Festive sweet flatbread stuffed with fragrant chana dal jaggery filling, drenched in pure cow ghee and paired with spicy chana broth amti.",
      price: 120,
      image: "/images/food/puran_poli.jpg",
      popularity: 99,
      rating: 5.0,
      category: "Maharashtrian Meals",
      is_veg: 1
    },
    {
      name: "Shrikhand Puri Plate (4 Puris with Kesar Shrikhand)",
      description: "Golden hot wheat puris served with thick saffron-cardamom strained yogurt sweet.",
      price: 110,
      image: "/images/food/shrikhand_puri.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Maharashtrian Meals",
      is_veg: 1
    },
    {
      name: "Sabudana Vada with Sweet Dahi (2 Pcs)",
      description: "Crunchy sago patties with crushed roasted peanuts served with sweet dahi.",
      price: 80,
      image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v30",
      popularity: 97,
      rating: 4.9,
      category: "Upwas & Fasting Special",
      is_veg: 1
    },
    {
      name: "Authentic Puneri Kanda Poha",
      description: "Fluffy yellow flattened rice with roasted peanuts, curry leaves, fresh grated coconut, and lemon.",
      price: 40,
      image: "/api/ai/dish-image?dish=Kanda%20Poha&v=v30",
      popularity: 97,
      rating: 4.8,
      category: "Maharashtrian Breakfast",
      is_veg: 1
    },
    {
      name: "Bharli Vangi with Jowar Bhakri (2 Pcs)",
      description: "Baby brinjals stuffed with roasted peanut, sesame and Goda masala gravy, served with hot jowar bhakri.",
      price: 160,
      image: "/images/food/bharli_vangi.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Maharashtrian Meals",
      is_veg: 1
    },
    {
      name: "Puneri Mattha (Spiced Buttermilk)",
      description: "Churned curd drink infused with green chillies, ginger, roasted cumin, and fresh cilantro.",
      price: 30,
      image: "/images/food/masala_taak.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Chilled Solkadhi Glass",
      description: "Traditional digestive coconut-kokum cooler.",
      price: 45,
      image: "/images/food/solkadhi.jpg",
      popularity: 97,
      rating: 4.8,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Special Masala Chai",
      description: "Spiced boiling ginger tea.",
      price: 20,
      image: "/api/ai/dish-image?dish=Masala%20Chai&v=v30",
      popularity: 99,
      rating: 5.0,
      category: "Beverages",
      is_veg: 1
    }
  ],

  // Generic Wadewale (Fallback for any Wadewale outlet)
  'wadewale': [
    {
      name: "Crispy Famous Vada Pav",
      description: "Classic hot batata vada inside fresh pav with garlic chutney and fried chillies.",
      price: 25,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v30",
      popularity: 100,
      rating: 5.0,
      category: "Vada Pav & Snacks",
      is_veg: 1
    },
    {
      name: "Batata Vada Plate (2 Pcs)",
      description: "Piping hot spiced potato fritters served with chutneys.",
      price: 40,
      image: "/api/ai/dish-image?dish=Vada%20Pav&v=v30",
      popularity: 99,
      rating: 5.0,
      category: "Vada Pav & Snacks",
      is_veg: 1
    },
    {
      name: "Puneri Misal Pav",
      description: "Sprouted matki usal with spicy tarri, farsan and soft pav.",
      price: 85,
      image: "/api/ai/dish-image?dish=Misal%20Pav&v=v30",
      popularity: 98,
      rating: 4.9,
      category: "Misal & Snacks",
      is_veg: 1
    },
    {
      name: "Crispy Kothimbir Vadi",
      description: "Steamed cilantro cakes shallow-fried crisp.",
      price: 80,
      image: "/images/food/kothimbir_vadi.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Maharashtrian Snacks",
      is_veg: 1
    },
    {
      name: "Sabudana Vada with Dahi (2 Pcs)",
      description: "Golden fried tapioca patties with roasted peanuts.",
      price: 80,
      image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v30",
      popularity: 97,
      rating: 4.9,
      category: "Upwas & Fasting Special",
      is_veg: 1
    },
    {
      name: "Kanda Poha Plate",
      description: "Tempered flattened rice with peanuts, curry leaves & lemon.",
      price: 40,
      image: "/api/ai/dish-image?dish=Kanda%20Poha&v=v30",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian Breakfast",
      is_veg: 1
    },
    {
      name: "Kanda Bhaji Plate",
      description: "Crispy onion fritters with fried green chillies.",
      price: 60,
      image: "/api/ai/dish-image?dish=Kanda%20Bhaji&v=v30",
      popularity: 96,
      rating: 4.8,
      category: "Maharashtrian Snacks",
      is_veg: 1
    },
    {
      name: "Special Masala Taak",
      description: "Chilled spiced churned buttermilk.",
      price: 25,
      image: "/images/food/masala_taak.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Beverages",
      is_veg: 1
    },
    {
      name: "Masala Chai",
      description: "Hot milk tea with ginger and cardamom.",
      price: 20,
      image: "/api/ai/dish-image?dish=Masala%20Chai&v=v30",
      popularity: 99,
      rating: 5.0,
      category: "Beverages",
      is_veg: 1
    }
  ],

  // Vidyarthi Bhavan (Gandhi Bazaar, Bengaluru)
  'vidyarthi': [
    {
      name: "Vidyarthi Bhavan Signature Crispy Masala Dosa",
      description: "Historic 1943 legend: thick golden crispy crepe smeared with red chutney and packed with potato saagu & generous pure ghee.",
      price: 95,
      image: "/images/food/dosa.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Crispy Medu Vada Sambar (2 Pcs)",
      description: "Crisp golden lentil fritters served with hot spiced sambar and thick coconut chutney.",
      price: 65,
      image: "/api/ai/dish-image?dish=Medu%20Vada&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Heritage South Indian Filter Coffee",
      description: "Aromatic chicory coffee decoction frothed in traditional stainless steel tumbler.",
      price: 40,
      image: "/api/ai/dish-image?dish=Filter%20Coffee&v=v28",
      popularity: 99,
      rating: 5.0
    }
  ],

  // MTR - Mavalli Tiffin Room (Lalbagh, Bengaluru)
  'mtr': [
    {
      name: "MTR Signature Rava Idli with Pure Desi Ghee",
      description: "World-famous 1924 heritage invention: steaming semolina idli topped with cashew, served with pure ghee cup, potato saagu & chutney.",
      price: 90,
      image: "/images/food/idli.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "MTR Special Masala Dosa with Sambar",
      description: "Crispy roasted rice-lentil crepe rolled with spiced potato mash and laden with pure ghee.",
      price: 110,
      image: "/images/food/dosa.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "MTR Filter Coffee Supreme",
      description: "Freshly frothed chicory coffee served hot in authentic silver tumbler.",
      price: 45,
      image: "/api/ai/dish-image?dish=Filter%20Coffee&v=v28",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Shri Sagar CTR (Malleshwaram, Bengaluru)
  'ctr': [
    {
      name: "CTR World-Famous Benne Masala Dosa",
      description: "Malleshwaram's 1920 legend: crispy golden crust drenched in dollops of fresh white butter, packed with savory potato bhaji.",
      price: 110,
      image: "/images/food/dosa.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Fluffy Poori Sagu (3 Pcs)",
      description: "Hot puffed golden wheat pooris served with spiced vegetable saagu and coconut chutney.",
      price: 85,
      image: "/api/ai/dish-image?dish=Poori%20Bhaji&v=v28",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Nagarjuna Restaurant (Residency Road, Bengaluru)
  'nagarjuna': [
    {
      name: "Nagarjuna Royal Andhra Banana Leaf Meal",
      description: "Residency Road spice bastion: unlimited aromatic rice, pappu dal, gun powder with ghee, sambar, rasam, curd & payasam.",
      price: 280,
      image: "/api/ai/dish-image?dish=Andhra%20Meals&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Fiery Andhra Guntur Chicken Fry",
      description: "Tender chicken morsels tossed in red-hot Guntur chillies, curry leaves, and crushed peppercorns.",
      price: 340,
      image: "/images/food/chicken_curry.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Spicy Andhra Mutton Curry with Rice",
      description: "Succulent mutton cuts slow-simmered in fiery Andhra poppy seed and roasted chili gravy.",
      price: 390,
      image: "/images/food/mutton_curry.jpg",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Bawarchi (RTC X Roads, Hyderabad)
  'bawarchi': [
    {
      name: "Bawarchi Original Double Masala Mutton Biryani",
      description: "RTC X Roads cult legend: fragrant saffron Basmati rice slow dum-cooked with double-spiced succulent lamb and dark roasted spices.",
      price: 360,
      image: "/api/ai/dish-image?dish=Mutton%20Biryani&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Spicy Tangdi Kebab (4 Pcs)",
      description: "Clay-oven charred chicken drumsticks basted in ginger-garlic paste and mustard oil.",
      price: 320,
      image: "/images/food/chicken_curry.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Tangy Mirchi Ka Salan Bowl",
      description: "Traditional Hyderabadi peanut, sesame and green chili accompaniment curry.",
      price: 60,
      image: "/api/ai/dish-image?dish=Biryani&v=v28",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Paradise Biryani (Secunderabad / Hyderabad)
  'paradise': [
    {
      name: "Paradise World-Famous Special Mutton Dum Biryani",
      description: "Secunderabad 1953 institution: Royal Nizami dum biryani cooked in sealed copper handi with tender spiced mutton & fragrant saffron.",
      price: 380,
      image: "/api/ai/dish-image?dish=Mutton%20Biryani&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Royal Mutton Seekh Kebab",
      description: "Charcoal grilled skewered minced lamb infused with aromatic whole spices.",
      price: 340,
      image: "/images/food/mutton_curry.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Traditional Double Ka Meetha",
      description: "Royal Hyderabadi fried bread pudding soaked in saffron milk and dry fruits.",
      price: 110,
      image: "/images/food/gulab_jamun.jpg",
      popularity: 98,
      rating: 4.9
    }
  ],

  // KFC (Kentucky Fried Chicken)
  'kfc': [
    {
      name: "KFC Hot & Crispy Fried Chicken (4 Pcs)",
      description: "Signature 11 herbs & spices battered chicken fried to golden extra crunchy perfection.",
      price: 399,
      image: "/images/food/kfc_fried_chicken.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "KFC Classic Zinger Burger",
      description: "Thick crispy chicken fillet with fresh lettuce and signature creamy mayo in sesame bun.",
      price: 199,
      image: "/images/food/zinger_burger.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Crispy Chicken Popcorn Large",
      description: "Bite-sized crispy tender chicken morsels seasoned with savory spice dust.",
      price: 219,
      image: "/images/food/chicken_popcorn.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "KFC Crispy Boneless Chicken Strips (3 Pcs)",
      description: "Extra crunchy boneless chicken tenders coated in seasoned batter with honey mustard dip.",
      price: 249,
      image: "/images/food/chicken_strips.jpg",
      popularity: 97,
      rating: 4.8
    },
    {
      name: "KFC Peri Peri Crispy Fries",
      description: "Golden crispy fries tossed with fiery spicy peri peri herb seasoning.",
      price: 129,
      image: "/images/food/peri_peri_fries.jpg",
      popularity: 96,
      rating: 4.8
    }
  ],

  // Pizza Hut
  'pizza hut': [
    {
      name: "Pizza Hut Pan Pizza Supreme",
      description: "Signature thick golden pan crust topped with spiced tomato sauce, mozzarella, bell peppers and paneer or chicken.",
      price: 399,
      image: "/images/food/pizza.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Cheesy Garlic Breadsticks",
      description: "Oven-baked leavened bread slathered with roasted garlic butter and molten mozzarella cheese.",
      price: 159,
      image: "/images/food/garlic_bread.jpg",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Pizza Fire & Wood-Fired Pizzerias
  'pizza fire': [
    {
      name: "Wood-Fired Pizza Fire Special",
      description: "Authentic brick-oven blistered crust topped with smoky tomato reduction, fresh fior di latte mozzarella, and basil.",
      price: 420,
      image: "/images/food/wood_fired_pizza.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Artisanal Margherita Supreme Pizza",
      description: "San Marzano tomato base, fresh buffalo mozzarella pearls, fragrant basil leaves and extra virgin olive oil.",
      price: 340,
      image: "/images/food/margherita_pizza.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Fire Roasted Peppy Paneer Pizza",
      description: "Wood-fired crust with chargrilled marinated paneer cubes, red paprika, and bubbling mozzarella.",
      price: 380,
      image: "/images/food/paneer_pizza.jpg",
      popularity: 97,
      rating: 4.8
    },
    {
      name: "Cheesy Stuffed Garlic Breadsticks",
      description: "Freshly pulled from the oven, loaded with roasted garlic herb butter and stringy molten mozzarella.",
      price: 180,
      image: "/images/food/garlic_bread.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Peri Peri Crinkle Fries",
      description: "Crunchy potato fries tossed with hot peri peri spice mix and creamy mayo dip.",
      price: 140,
      image: "/images/food/peri_peri_fries.jpg",
      popularity: 96,
      rating: 4.8
    }
  ],
  'fire pizza': [
    {
      name: "Wood-Fired Pizza Fire Special",
      description: "Authentic brick-oven blistered crust topped with smoky tomato reduction, fresh fior di latte mozzarella, and basil.",
      price: 420,
      image: "/images/food/wood_fired_pizza.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Artisanal Margherita Supreme Pizza",
      description: "San Marzano tomato base, fresh buffalo mozzarella pearls, fragrant basil leaves and extra virgin olive oil.",
      price: 340,
      image: "/images/food/margherita_pizza.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Cheesy Stuffed Garlic Breadsticks",
      description: "Freshly pulled from the oven, loaded with roasted garlic herb butter and stringy molten mozzarella.",
      price: 180,
      image: "/images/food/garlic_bread.jpg",
      popularity: 99,
      rating: 5.0
    }
  ],
  'wood fired pizza': [
    {
      name: "Wood-Fired Pizza Fire Special",
      description: "Authentic brick-oven blistered crust topped with smoky tomato reduction, fresh fior di latte mozzarella, and basil.",
      price: 420,
      image: "/images/food/wood_fired_pizza.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Artisanal Margherita Supreme Pizza",
      description: "San Marzano tomato base, fresh buffalo mozzarella pearls, fragrant basil leaves and extra virgin olive oil.",
      price: 340,
      image: "/images/food/margherita_pizza.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Farmhouse Fire Baked Pizza",
      description: "Hand-tossed crust with mozzarella, sweet corn, bell peppers, black olives, and caramelized onions.",
      price: 390,
      image: "/images/food/farmhouse_pizza.jpg",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Subway
  'subway': [
    {
      name: "Subway Paneer Tikka Sub (6 Inch)",
      description: "Freshly baked multigrain bread filled with spiced tandoori paneer, crisp veggies and signature southwest sauce.",
      price: 219,
      image: "/api/ai/dish-image?dish=Sandwich&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Subway Roasted Chicken Breast Sub",
      description: "Tender herb-roasted chicken breast fillet with crisp lettuce, olives and mint mayo.",
      price: 249,
      image: "/api/ai/dish-image?dish=Sandwich&v=v28",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Starbucks Coffee
  'starbucks': [
    {
      name: "Starbucks Java Chip Frappuccino",
      description: "Blended coffee, milk, chocolate chips, and ice, crowned with sweetened whipped cream & chocolate drizzle.",
      price: 360,
      image: "/api/ai/dish-image?dish=Cold%20Coffee&v=v28",
      popularity: 100,
      rating: 5.0,
      category: "Tea & Coffee",
      is_veg: 1
    },
    {
      name: "Starbucks Caramel Macchiato",
      description: "Freshly steamed milk with vanilla-flavored syrup, marked with espresso and finished with caramel drizzle.",
      price: 290,
      image: "/api/ai/dish-image?dish=Coffee&v=v28",
      popularity: 99,
      rating: 5.0,
      category: "Tea & Coffee",
      is_veg: 1
    },
    {
      name: "Tall Iced Caffe Latte",
      description: "Dark, rich espresso combined with milk and served over ice.",
      price: 280,
      image: "/api/ai/dish-image?dish=Cold%20Coffee&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Tea & Coffee",
      is_veg: 1
    },
    {
      name: "Tall Cold Brew with Chocolate Protein Foam",
      description: "Slow-steeped small-batch cold brew topped with velvety cocoa cloud foam.",
      price: 390,
      image: "/api/ai/dish-image?dish=Cold%20Coffee&v=v28",
      popularity: 97,
      rating: 4.9,
      category: "Tea & Coffee",
      is_veg: 1
    },
    {
      name: "Classic Caffe Americano",
      description: "Espresso shots topped with hot water create a light layer of crema.",
      price: 240,
      image: "/api/ai/dish-image?dish=Coffee&v=v28",
      popularity: 97,
      rating: 4.8,
      category: "Tea & Coffee",
      is_veg: 1
    },
    {
      name: "Flaky Butter Croissant",
      description: "Classic French golden baked pastry with rich butter laminations.",
      price: 190,
      image: "/api/ai/dish-image?dish=Croissant&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Bakery",
      is_veg: 1
    },
    {
      name: "Blueberry Muffin with Streusel Crumble",
      description: "Moist bakery muffin loaded with whole juicy blueberries and sweet crumble.",
      price: 220,
      image: "/api/ai/dish-image?dish=Muffin&v=v28",
      popularity: 96,
      rating: 4.8,
      category: "Cakes & Pastries",
      is_veg: 1
    },
    {
      name: "New York Style Cheesecake Slice",
      description: "Dense, velvety smooth cream cheese on golden graham cracker crust.",
      price: 340,
      image: "/api/ai/dish-image?dish=Cheesecake&v=v28",
      popularity: 99,
      rating: 5.0,
      category: "Cakes & Pastries",
      is_veg: 1
    },
    {
      name: "Double Chocolate Chip Cookie",
      description: "Warm soft-baked cookie packed with bittersweet chocolate chunks.",
      price: 160,
      image: "/api/ai/dish-image?dish=Cookies&v=v28",
      popularity: 95,
      rating: 4.8,
      category: "Bakery",
      is_veg: 1
    },
    {
      name: "Warm Sizzling Chocolate Brownie",
      description: "Fudge walnut brownie served warm with molten dark chocolate ganache.",
      price: 240,
      image: "/api/ai/dish-image?dish=Brownie&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Cakes & Pastries",
      is_veg: 1
    },
    {
      name: "Basil Tomato & Mozzarella Panini",
      description: "Grilled sourdough stuffed with vine tomatoes, fresh mozzarella and basil pesto.",
      price: 310,
      image: "/api/ai/dish-image?dish=Sandwich&v=v28",
      popularity: 97,
      rating: 4.8,
      category: "Café Food",
      is_veg: 1
    },
    {
      name: "Smoked Chicken & Cheese Sandwich",
      description: "Herbed roasted chicken breast and cheddar cheese grilled in multi-grain bread.",
      price: 340,
      image: "/api/ai/dish-image?dish=Sandwich&v=v28",
      popularity: 98,
      rating: 4.9,
      category: "Café Food",
      is_veg: 0
    },
    {
      name: "Signature Hot Chocolate with Whipped Cream",
      description: "Steamed milk with rich dark chocolate syrup topped with sweetened whipped cream.",
      price: 270,
      image: "/api/ai/dish-image?dish=Coffee&v=v28",
      popularity: 97,
      rating: 4.9,
      category: "Tea & Coffee",
      is_veg: 1
    },
    {
      name: "Nutella Belgian Waffle with Ice Cream",
      description: "Freshly ironed golden crisp waffle smothered in warm Nutella and choco chips.",
      price: 290,
      image: "/api/ai/dish-image?dish=Waffle&v=v28",
      popularity: 99,
      rating: 5.0,
      category: "Café Food",
      is_veg: 1
    }
  ],

  // Hotel Sandeep (Iconic Pune & Kolhapuri Mutton/Chicken Landmark)
  'sandeep': [
    {
      name: "Special Kolhapuri Mutton Thali (Tambda & Pandhra Rassa)",
      description: "Iconic feast: fiery red rassa, soothing white coconut broth, tender mutton sukka, 2 jowar bhakris & fragrant rice.",
      price: 435,
      image: "/images/food/mutton_thali.jpg",
      popularity: 100,
      rating: 5.0,
      category: "Thalis & Combos",
      is_veg: 0
    },
    {
      name: "Bokud Mutton Fry (Signature Specialty)",
      description: "Prime cut goat meat slow pan-roasted dry in black onion masala and roasted coconut.",
      price: 424,
      image: "/images/food/mutton_curry.jpg",
      popularity: 100,
      rating: 5.0,
      category: "Non-Veg Main Course",
      is_veg: 0
    },
    {
      name: "Bokud Mutton Handi Gravy",
      description: "Tender goat meat simmered in traditional earthen handi with roasted Kolhapuri spices.",
      price: 435,
      image: "/images/food/mutton_curry.jpg",
      popularity: 99,
      rating: 5.0,
      category: "Non-Veg Main Course",
      is_veg: 0
    },
    {
      name: "Bokud Mutton Ukkhar (Clear Broth)",
      description: "Mildly spiced comforting goat meat bone broth cooked with turmeric, ginger and fresh coriander.",
      price: 435,
      image: "/images/food/mutton_curry.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Non-Veg Main Course",
      is_veg: 0
    },
    {
      name: "Bolai Mutton Handi",
      description: "Rustic sheep meat slow-cooked in rich caramelized onion and garlic rassa.",
      price: 435,
      image: "/images/food/mutton_curry.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Non-Veg Main Course",
      is_veg: 0
    },
    {
      name: "Bolai Mutton Ukkhar",
      description: "Traditional savory bone broth soup slow simmered with whole spices.",
      price: 435,
      image: "/images/food/mutton_curry.jpg",
      popularity: 97,
      rating: 4.8,
      category: "Non-Veg Main Course",
      is_veg: 0
    },
    {
      name: "Spicy Gavran Chicken Sukka with Bhakri",
      description: "Free-range country chicken roasted dry in aromatic black masala, served with hot jowar bhakri.",
      price: 386,
      image: "/images/food/chicken_curry.jpg",
      popularity: 99,
      rating: 5.0,
      category: "Non-Veg Main Course",
      is_veg: 0
    },
    {
      name: "Gavran Chicken Handi",
      description: "Country chicken simmered in rich Kolhapuri spiced red curry with fresh coriander.",
      price: 405,
      image: "/images/food/chicken_curry.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Non-Veg Main Course",
      is_veg: 0
    },
    {
      name: "Chicken Tangdi Kabab (3 Pcs)",
      description: "Charcoal clay tandoor grilled chicken drumsticks marinated in curd, ginger garlic & roasted spices.",
      price: 488,
      image: "/images/food/tandoori_chicken.jpg",
      popularity: 99,
      rating: 5.0,
      category: "Tandoori & Grilled",
      is_veg: 0
    },
    {
      name: "Chicken Meat Mirch Fry",
      description: "Spicy pan-seared chicken tossed with slit green chillies, garlic and crushed pepper.",
      price: 419,
      image: "/images/food/chicken_curry.jpg",
      popularity: 97,
      rating: 4.8,
      category: "Non-Veg Main Course",
      is_veg: 0
    },
    {
      name: "Mutton Kheema Pav & Boiled Egg",
      description: "Minced goat meat slow-braised with peas, mint, and toasted butter ladi pav.",
      price: 290,
      image: "/images/food/mutton_curry.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Non-Veg Main Course",
      is_veg: 0
    },
    {
      name: "Tambda Rassa Bowl (Extra Cut)",
      description: "Unlimited style fiery red mutton bone broth infused with Kolhapuri lavangi chillies.",
      price: 90,
      image: "/images/food/mutton_curry.jpg",
      popularity: 99,
      rating: 5.0,
      category: "Soups",
      is_veg: 0
    },
    {
      name: "Pandhra Rassa Bowl (White Broth)",
      description: "Aromatic white bone soup slow-simmered with coconut milk, white sesame, poppy seeds & spices.",
      price: 90,
      image: "/images/food/mutton_curry.jpg",
      popularity: 99,
      rating: 5.0,
      category: "Soups",
      is_veg: 0
    },
    {
      name: "Traditional Digestive Solkadhi Glass",
      description: "Chilled pink cooler extracted from wild kokum, coconut milk, roasted cumin & garlic.",
      price: 60,
      image: "/images/food/solkadhi.jpg",
      popularity: 100,
      rating: 5.0,
      category: "Tea & Coffee",
      is_veg: 1
    },
    {
      name: "Fresh Hot Jowar Bhakri (2 Pcs)",
      description: "Hand-patted roasted whole grain sorghum flatbread with charred aroma.",
      price: 50,
      image: "/images/food/pithla_bhakri.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Indian Breads",
      is_veg: 1
    },
    {
      name: "Steamed Indrayani Rice with Ghee",
      description: "Soft fragrant sticky Indrayani rice, the perfect match for hot rassa.",
      price: 110,
      image: "/images/food/biryani.jpg",
      popularity: 97,
      rating: 4.8,
      category: "Rice & Biryani",
      is_veg: 1
    },
    {
      name: "Surmai Rava Fish Fry",
      description: "Fresh kingfish steak coated in fiery red masala and crispy semolina crust.",
      price: 450,
      image: "/images/food/fish_fry.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Seafood",
      is_veg: 0
    },
    {
      name: "Smoky Tandoori Chicken Tikka (6 Pcs)",
      description: "Boneless chicken thighs marinated in red spiced hung curd and roasted in clay oven.",
      price: 320,
      image: "/images/food/tandoori_chicken.jpg",
      popularity: 98,
      rating: 4.9,
      category: "Tandoori & Grilled",
      is_veg: 0
    }
  ],

  // SP's Biryani House (Tilak Road / Sadashiv Peth, Pune)
  'sp': [
    {
      name: "SP's Famous Sajuk Tupatli Mutton Dum Biryani",
      description: "Tilak Road's legendary non-veg specialty: aromatic Basmati rice and succulent mutton cooked in pure desi ghee.",
      price: 420,
      image: "/images/food/biryani.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "SP's Special Chicken Dum Biryani",
      description: "Fragrant long-grain rice layered with marinated chicken, saffron milk and rich biryani spices.",
      price: 360,
      image: "/images/food/biryani.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Mutton Sukka Fry with Hot Jowar Bhakri",
      description: "Pan-roasted spiced mutton masala with caramelized onion, grated coconut and hot roasted bhakri.",
      price: 390,
      image: "/images/food/mutton_curry.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Tambda & Pandhra Rassa Bowl Duo",
      description: "Authentic Kolhapuri style fiery red mutton rassa and aromatic creamy white coconut broth.",
      price: 110,
      image: "/images/food/mutton_curry.jpg",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Fisherman's Wharf (Cavelossim / Mobor, Goa)
  'fisherman': [
    {
      name: "Fisherman's Wharf King Crab Peri Peri",
      description: "Fresh mud crab tossed in fiery Goan peri peri chili paste, garlic, and vinegar.",
      price: 750,
      image: "/images/food/fish_fry.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Goan Prawn Balchão with Poi Bread",
      description: "Spicy and tangy pickling-style prawn masala cooked with red chilies, toddy vinegar and warm Goan poi.",
      price: 490,
      image: "/images/food/fish_fry.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Fresh Kingfish (Surmai) Rava Fry",
      description: "Thick surmai fish steak marinated in recheado masala and fried crisp in semolina.",
      price: 460,
      image: "/images/food/fish_fry.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Authentic Goan Fish Curry with Steamed Rice",
      description: "Traditional coconut and tefla-infused tangy fish curry served with steaming local red rice.",
      price: 390,
      image: "/images/food/fish_fry.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Traditional Goan Bebinca Slice",
      description: "Multi-layered Indo-Portuguese pudding baked with coconut milk, egg yolks, sugar & nutmeg.",
      price: 180,
      image: "/images/food/modak.jpg",
      popularity: 96,
      rating: 4.8
    }
  ],

  // Britto's (Baga Beach, Goa)
  'britto': [
    {
      name: "Britto's Butter Garlic Jumbo Prawns",
      description: "Baga beach legend: succulent sea prawns tossed in golden garlic butter and parsley.",
      price: 520,
      image: "/images/food/fish_fry.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Calamari Golden Crispy Squid Rings",
      description: "Fresh ocean squid rings dusted in seasoned batter and fried crunchy, served with tartar sauce.",
      price: 380,
      image: "/images/food/fish_fry.jpg",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Britto's Seafood Platter Supreme",
      description: "Grand combination of rawa fried fish, butter garlic prawns, calamari and crab cake.",
      price: 950,
      image: "/images/food/fish_fry.jpg",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Manek Chowk Food Street (Ahmedabad)
  'manek chowk': [
    {
      name: "Manek Chowk Famous Gwalior Butter Dosa",
      description: "Ahmedabad night market icon: crispy fermented dosa smothered with an entire block of melting butter and spicy aloo mash.",
      price: 180,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Signature Chocolate Cheese Pineapple Toast",
      description: "Triple-decker sandwich packed with Nutella chocolate spread, pineapple slices, and a mountain of grated cheese.",
      price: 160,
      image: "/api/ai/dish-image?dish=Sandwich&v=v28",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Manek Chowk Butter Pav Bhaji Platter",
      description: "Rich spiced mashed vegetable bhaji dripping with butter, served with soft butter-toasted pavs.",
      price: 170,
      image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Bademiya (Colaba, Mumbai)
  'bademiya': [
    {
      name: "Bademiya Legendary Mutton Seekh Kebab (4 Pcs)",
      description: "Colaba behind-Taj heritage: charcoal-grilled spiced mutton mince skewers served with mint chutney and onion rings.",
      price: 320,
      image: "/api/ai/dish-image?dish=Tandoori%20Chicken&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Bademiya Special Chicken Baida Roti",
      description: "Crispy pan-fried envelope of spiced minced chicken and egg cooked on giant tawa.",
      price: 240,
      image: "/images/food/chicken_curry.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Charcoal Chicken Tikka Roll",
      description: "Smoky tandoori chicken tikka rolled in hot flaky paratha with mint chutney and sliced onions.",
      price: 210,
      image: "/api/ai/dish-image?dish=Kathi%20Roll&v=v28",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Leopold Cafe & Bar (Colaba, Mumbai)
  'leopold': [
    {
      name: "Leopold Special Cold Coffee with Chocolate",
      description: "Historic 1871 Colaba icon: thick creamy cold coffee topped with dark chocolate syrup.",
      price: 180,
      image: "/api/ai/dish-image?dish=Cold%20Coffee&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Leopold Famous Chicken Chilli & Hakka Noodles",
      description: "Wok-fried spicy Indo-Chinese chicken chunks with bell peppers, green chilies and egg noodles.",
      price: 360,
      image: "/api/ai/dish-image?dish=Fried%20Rice&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Spicy Keema Pav Platter",
      description: "Classic Mumbai spiced minced meat gravy served with butter toasted ladi pavs.",
      price: 280,
      image: "/images/food/mutton_curry.jpg",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Sardar Refreshments (Tardeo, Mumbai)
  'sardar': [
    {
      name: "Sardar Famous Extra Butter Pav Bhaji",
      description: "Tardeo's legendary giant slab of Amul butter floating on rich red spiced bhaji with hot pavs.",
      price: 190,
      image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Sardar Special Cheese Pav Bhaji",
      description: "Loaded with a thick blanket of grated mozzarella and cheddar cheese over steaming hot bhaji.",
      price: 230,
      image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Kyani & Co. (Marine Lines, Mumbai)
  'kyani': [
    {
      name: "Kyani & Co. Heritage Bun Maska & Irani Chai",
      description: "1904 Marine Lines legend: soft bun with generous crust of butter dipped in sweet cardamom Irani chai.",
      price: 80,
      image: "/api/ai/dish-image?dish=Bun%20Maska&v=v28",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Mutton Keema Ghotala with Pav",
      description: "Minced mutton scrambled with eggs, green peas, and warm Irani spices, served with fresh pav.",
      price: 220,
      image: "/images/food/mutton_curry.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Parsi Bakery Special Mawa Cake Slice",
      description: "Rich buttery sponge cake flavored with pure mawa, green cardamom and nutmeg.",
      price: 45,
      image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Al Jawahar (Jama Masjid, Old Delhi)
  'al jawahar': [
    {
      name: "Al Jawahar Famous Mutton Korma & Khamiri Roti",
      description: "Jama Masjid's celebrated slow-simmered rich red mutton korma with thick yeast-leavened khamiri roti.",
      price: 380,
      image: "/images/food/mutton_curry.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Shahi Chicken Changezi",
      description: "Old Delhi style roasted chicken pieces simmered in tangy tomato, milk and cashew gravy.",
      price: 360,
      image: "/images/food/chicken_curry.jpg",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Charcoal Mutton Seekh Kebab (4 Pcs)",
      description: "Juicy minced mutton skewers roasted on open coals with roomali roti and mint yogurt dip.",
      price: 280,
      image: "/api/ai/dish-image?dish=Tandoori%20Chicken&v=v28",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Gulati Restaurant (Pandara Road, Delhi)
  'gulati': [
    {
      name: "Gulati World-Famous Butter Chicken",
      description: "Pandara Road's benchmark: succulent tandoori chicken simmered in velvet smooth tomato, butter and cream gravy.",
      price: 460,
      image: "/images/food/butter_chicken.jpg",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Melt-in-Mouth Galouti Kebab with Roomali Roti",
      description: "Finely minced lamb patty blended with 32 spices, pan-seared to melt on the palate.",
      price: 420,
      image: "/api/ai/dish-image?dish=Tandoori%20Chicken&v=v28",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Dal Makhani Overnight Simmered with Garlic Naan",
      description: "Creamy black lentils simmered for 18 hours on slow charcoal with pure butter and cream.",
      price: 320,
      image: "/images/food/dal_makhani.jpg",
      popularity: 99,
      rating: 5.0
    }
  ]
};

// 2. UNIVERSAL CUISINE CATEGORIES FOR DYNAMICALLY BRANDED PLACES
export const CUISINE_MENUS: CuisineProfile[] = [
  // Cafe, Specialty Coffee & Western Bakery
  {
    name: "Cafe, Specialty Coffee & Western Bakery",
    keywords: ['cafe', 'coffee', 'cold coffee', 'bistro', 'roastery', 'starbucks', 'barista', 'costa', 'third wave', 'blue tokai', 'latte', 'frappuccino', 'frappe', 'cappuccino', 'espresso', 'americano', 'croissant', 'waffle', 'pancake', 'cheesecake', 'brownie', 'panini'],
    dishes: [
      { name: "Famous Thick Cold Coffee with Chocolate", description: "Rich blended creamy cold coffee crowned with chocolate syrup and thick froth.", price: 90, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=85", popularity: 100, rating: 5.0, category: "Tea & Coffee", is_veg: 1 },
      { name: "Signature Java Chip Frappuccino", description: "Blended espresso coffee, milk, chocolate chips, crowned with whipped cream and chocolate drizzle.", price: 290, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85", popularity: 100, rating: 5.0, category: "Tea & Coffee", is_veg: 1 },
      { name: "Caramel Macchiato with Vanilla", description: "Steamed whole milk marked with rich espresso shots and drizzled with buttery caramel glaze.", price: 240, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85", popularity: 99, rating: 5.0, category: "Tea & Coffee", is_veg: 1 },
      { name: "Classic Caffe Latte with Velvety Foam", description: "Rich espresso combined with silky steamed milk and a thin layer of microfoam.", price: 210, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85", popularity: 98, rating: 4.9, category: "Tea & Coffee", is_veg: 1 },
      { name: "Slow Steeped Small Batch Cold Brew", description: "Smooth 18-hour cold steeped coffee served over crystal ice with subtle citrus notes.", price: 240, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=85", popularity: 97, rating: 4.9, category: "Tea & Coffee", is_veg: 1 },
      { name: "Flaky French Butter Croissant", description: "Golden-baked layered puff pastry with rich golden European butter laminations.", price: 160, image: "/api/ai/dish-image?dish=Croissant&v=v28", popularity: 99, rating: 5.0, category: "Bakery", is_veg: 1 },
      { name: "Blueberry Crumble Muffin", description: "Moist bakery muffin bursting with fresh juicy blueberries and brown sugar streusel crumble.", price: 170, image: "/api/ai/dish-image?dish=Muffin&v=v28", popularity: 96, rating: 4.8, category: "Cakes & Pastries", is_veg: 1 },
      { name: "New York Style Baked Cheesecake", description: "Dense and velvety cream cheese filling over buttery biscuit crust.", price: 280, image: "/api/ai/dish-image?dish=Cheesecake&v=v28", popularity: 99, rating: 5.0, category: "Cakes & Pastries", is_veg: 1 },
      { name: "Warm Sizzling Chocolate Brownie with Ice Cream", description: "Gooey dark chocolate walnut brownie with hot fudge drizzle and vanilla ice cream scoop.", price: 210, image: "/api/ai/dish-image?dish=Warm%20Sizzling%20Chocolate%20Brownie%20with%20Ice%20Cream&v=v28", popularity: 100, rating: 5.0, category: "Cakes & Pastries", is_veg: 1 },
      { name: "Nutella Belgian Waffle with Choco Chips", description: "Crisp golden ironed waffle smothered in warm Nutella hazelnut spread and choco chips.", price: 230, image: "/api/ai/dish-image?dish=Waffle&v=v28", popularity: 99, rating: 5.0, category: "Café Food", is_veg: 1 },
      { name: "Fluffy American Pancakes with Maple Syrup", description: "Stack of three golden buttermilk pancakes served with melted butter and pure maple syrup.", price: 210, image: "/api/ai/dish-image?dish=Pancakes&v=v28", popularity: 97, rating: 4.9, category: "Café Food", is_veg: 1 },
      { name: "Grilled Cheese & Jalapeno Panini", description: "Toasted sourdough loaded with sharp cheddar, mozzarella, sliced pickled jalapenos & herbs.", price: 220, image: "/api/ai/dish-image?dish=Sandwich&v=v28", popularity: 98, rating: 4.9, category: "Café Food", is_veg: 1 },
      { name: "Basil Pesto & Mozzarella Sandwich", description: "Fresh Italian basil pesto, vine-ripened tomatoes and fresh mozzarella pressed in crusty ciabatta.", price: 240, image: "/api/ai/dish-image?dish=Sandwich&v=v28", popularity: 97, rating: 4.8, category: "Café Food", is_veg: 1 },
      { name: "Herbed Chicken Mayo Club Sandwich", description: "Triple decker toast with roasted shredded chicken breast, lettuce, tomato and garlic mayo.", price: 270, image: "/api/ai/dish-image?dish=Sandwich&v=v28", popularity: 98, rating: 4.9, category: "Café Food", is_veg: 0 },
      { name: "Creamy White Sauce Alfredo Penne", description: "Penne pasta tossed in rich parmesan cream sauce with sauteed garlic mushrooms and herbs.", price: 280, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9, category: "Italian Food", is_veg: 1 },
      { name: "Loaded Peri Peri French Fries", description: "Crispy golden shoestring fries tossed in fiery African peri peri spice rub with cheese dip.", price: 140, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0, category: "Fast Food", is_veg: 1 },
      { name: "Cheesy Garlic Breadsticks with Herb Butter", description: "Fresh baked baguette smothered in garlic parsley butter and melted mozzarella.", price: 170, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9, category: "Fast Food", is_veg: 1 },
      { name: "Rich Dark Hot Chocolate with Marshmallows", description: "Decadent whole milk simmered with 70% dark Belgian cocoa and fluffy marshmallows.", price: 220, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9, category: "Tea & Coffee", is_veg: 1 }
    ]
  },

  // Kachori & Samosa Sweets
  {
    name: "Kachori, Samosa & Sweets",
    keywords: ['kachori', 'pyaaz kachori', 'mawa kachori', 'samosa', 'bikanervala', 'haldiram', 'mithai', 'sweet', 'sweets', 'bhandar', 'mishthan', 'jalebi', 'ghevar', 'laddu', 'laddoo', 'gulab jamun', 'chitale', 'kaka halwai', 'barfi', 'peda'],
    dishes: [
      { name: "Special Crispy Pyaaz Kachori (2 Pcs)", description: "Crispy flaky golden pastry stuffed with spicy caramelized onion masala, served with tamarind chutney.", price: 80, image: "/api/ai/dish-image?dish=Kachori&v=v28", popularity: 100, rating: 5.0 },
      { name: "Hot Samosa with Sweet-Spicy Chutney (2 Pcs)", description: "Crispy pastry cones filled with spiced potatoes, green peas, and cashews, served with mint chutney.", price: 60, image: "/api/ai/dish-image?dish=Samosa&v=v28", popularity: 98, rating: 4.9 },
      { name: "Royal Shahi Raj Kachori Chaat", description: "Giant crisp kachori loaded with sprouted moong, boiled potatoes, dahi, tangy chutneys & sev.", price: 140, image: "/api/ai/dish-image?dish=Kachori&v=v28", popularity: 99, rating: 5.0 },
      { name: "Dahi Samosa Chaat Platter", description: "Crushed hot samosas smothered in sweet whipped curd, tamarind glaze & roasted cumin.", price: 110, image: "/api/ai/dish-image?dish=Samosa&v=v28", popularity: 97, rating: 4.9 },
      { name: "Crispy Moong Dal Khasta Kachori (2 Pcs)", description: "Flaky deep-fried puffed puris packed with spiced yellow lentil stuffing & dry spices.", price: 70, image: "/api/ai/dish-image?dish=Kachori&v=v28", popularity: 96, rating: 4.8 },
      { name: "Shahi Malai Ghevar with Rabdi", description: "Honeycomb textured festive delicacy soaked in saffron syrup crowned with thick malai.", price: 160, image: "/api/ai/dish-image?dish=Rabri&v=v28", popularity: 97, rating: 4.9 },
      { name: "Hot Crispy Jalebi with Creamy Rabdi", description: "Thin spiral golden jalebis freshly fried and soaked in saffron sugar syrup with thickened rabdi.", price: 120, image: "/api/ai/dish-image?dish=Jalebi&v=v28", popularity: 99, rating: 5.0 },
      { name: "Warm Gulab Jamun with Saffron Dip (2 Pcs)", description: "Melt-in-mouth milk dumplings soaked in aromatic cardamom and rose water syrup.", price: 80, image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28", popularity: 98, rating: 4.9 },
      { name: "Rich Kaju Katli (4 Pcs)", description: "Diamond cut silver-foiled luxury sweet made with premium pulverized cashews and sugar.", price: 120, image: "/api/ai/dish-image?dish=Kaju%20Katli&v=v28", popularity: 98, rating: 4.9 },
      { name: "Fresh Motichoor Laddoo (2 Pcs)", description: "Tiny gram flour pearls fried in pure desi ghee and pressed into sweet saffron spheres.", price: 70, image: "/api/ai/dish-image?dish=Ladoo&v=v28", popularity: 95, rating: 4.8 },
      { name: "Special Masala Chai Kulhad", description: "Steaming hot ginger and cardamom tea brewed with whole milk and served in a clay pot.", price: 30, image: "/api/ai/dish-image?dish=Masala%20Chai&v=v28", popularity: 99, rating: 5.0 },
      { name: "Chilled Sweet Mango Lassi", description: "Thick hand-churned yogurt smoothie blended with ripe mango pulp and crushed pistachios.", price: 90, image: "/api/ai/dish-image?dish=Mango%20Lassi&v=v28", popularity: 97, rating: 4.9 }
    ]
  },

  // Sandwich & Fast Food
  {
    name: "Sandwich & Fast Food",
    keywords: ['sandwich', 'sandwiches', 'toast', 'grill', 'club sandwich', 'grilled cheese', 'sub', 'toast sandwich'],
    dishes: [
      { name: "Special 3-Layer Cheese Burst Grilled Sandwich", description: "Toasted jumbo bread loaded with spiced potato, veggies, spicy green chutney, and melted cheese blend.", price: 160, image: "/api/ai/dish-image?dish=Cheese%20Sandwich&v=v28", popularity: 100, rating: 5.0 },
      { name: "Classic Bombay Veg Toast Sandwich", description: "Thin-sliced potato, cucumber, tomato & onion with mint-coriander chutney and sandwich masala.", price: 110, image: "/api/ai/dish-image?dish=Veg%20Grilled%20Sandwich&v=v28", popularity: 98, rating: 4.9 },
      { name: "Famous Chocolate Cheese Toast Sandwich", description: "Decadent sandwich layered with Nutella chocolate spread, butter, and grated processed cheese.", price: 140, image: "/api/ai/dish-image?dish=Cheese%20Sandwich&v=v28", popularity: 98, rating: 4.9 },
      { name: "Crispy Paneer Tikka Grilled Sandwich", description: "Marinated tandoori paneer cubes, crisp capsicum and mint mayonnaise pressed in buttered bread.", price: 170, image: "/api/ai/dish-image?dish=Paneer%20Wrap&v=v28", popularity: 99, rating: 5.0 },
      { name: "Corn & Cheese Double Decker Toast", description: "Sweet corn kernels, green chillies and melted cheddar cheese grilled golden brown.", price: 150, image: "/api/ai/dish-image?dish=Cheese%20Sandwich&v=v28", popularity: 97, rating: 4.8 },
      { name: "Loaded Peri Peri French Fries", description: "Crispy golden potato fries seasoned with fiery African peri peri spice rub and cheese sauce.", price: 120, image: "/api/ai/dish-image?dish=Peri%20Peri%20Fries&v=v28", popularity: 96, rating: 4.8 },
      { name: "Golden Crispy Onion Rings (8 Pcs)", description: "Crisp batter-coated onion rings fried crunchy and served with garlic mayo.", price: 130, image: "/api/ai/dish-image?dish=French%20Fries&v=v28", popularity: 95, rating: 4.7 },
      { name: "Cheesy Garlic Breadsticks with Dip", description: "Oven-toasted garlic bread smothered with garlic butter and melted mozzarella.", price: 140, image: "/api/ai/dish-image?dish=Garlic%20Bread&v=v28", popularity: 98, rating: 4.9 },
      { name: "Creamy Thick Cold Coffee with Ice Cream", description: "Blended rich coffee and chilled whole milk crowned with a scoop of vanilla ice cream.", price: 110, image: "/api/ai/dish-image?dish=Cold%20Coffee&v=v28", popularity: 99, rating: 5.0 },
      { name: "Hazelnut Cold Coffee Frappe", description: "Espresso coffee blended with roasted hazelnut syrup, dark chocolate and whipped cream.", price: 130, image: "/api/ai/dish-image?dish=Iced%20Coffee&v=v28", popularity: 97, rating: 4.9 },
      { name: "Thick Chocolate Milkshake", description: "Velvety cocoa fudge blended with cream and chocolate drizzle.", price: 120, image: "/api/ai/dish-image?dish=Milkshakes&v=v28", popularity: 96, rating: 4.8 },
      { name: "Chilled Iced Lemon Peach Tea", description: "Brewed black tea infused with real peach extract, fresh mint and lemon slice.", price: 90, image: "/api/ai/dish-image?dish=Iced%20Tea&v=v28", popularity: 95, rating: 4.7 }
    ]
  },

  // Momos & Tibetan Dumplings
  {
    name: "Momos & Tibetan Dumplings",
    keywords: ['momo', 'momos', 'dimsum', 'dumpling', 'dumplings', 'thukpa', 'tibetan', 'wow momo', 'momo king', 'the momo'],
    dishes: [
      { name: "Steamed Darjeeling Veg Momos (6 Pcs)", description: "Authentic thin-wrapper steamed Himalayan dumplings served with fiery red chili garlic sauce.", price: 140, image: "/api/ai/dish-image?dish=Momos&v=v28", popularity: 100, rating: 5.0 },
      { name: "Steamed Juicy Chicken Momos (6 Pcs)", description: "Minced tender chicken seasoned with scallions and ginger, steamed to juicy perfection.", price: 160, image: "/api/ai/dish-image?dish=Momos&v=v28", popularity: 100, rating: 5.0 },
      { name: "Crispy Fried Cheese Corn Momos (6 Pcs)", description: "Golden fried crunchy momos loaded with melted mozzarella, sweet corn & herbs with spicy dip.", price: 170, image: "/api/ai/dish-image?dish=Momos&v=v28", popularity: 99, rating: 5.0 },
      { name: "Sizzling Schezwan Gravy Momos", description: "Steamed momos wok-tossed in rich red sizzling garlic schezwan pepper gravy.", price: 190, image: "/api/ai/dish-image?dish=Momos&v=v28", popularity: 98, rating: 4.9 },
      { name: "Butter Garlic Pan-Fried Momos", description: "Crispy bottom pan-seared dumplings drizzled in sizzling aromatic chili garlic butter.", price: 180, image: "/api/ai/dish-image?dish=Momos&v=v28", popularity: 98, rating: 4.9 },
      { name: "Crunchy Kurkure Momos Platter", description: "Crumb-coated extra crunchy fried momos dusted with tangy chatpata peri peri spice.", price: 180, image: "/api/ai/dish-image?dish=Momos&v=v28", popularity: 97, rating: 4.9 },
      { name: "Authentic Tibetan Thukpa Noodle Soup", description: "Comforting hot spiced broth with handmade noodles, crunchy shredded vegetables and fresh cilantro.", price: 160, image: "/api/ai/dish-image?dish=Veg%20Hakka%20Noodles&v=v28", popularity: 97, rating: 4.8 },
      { name: "Special Veg Hakka Noodles", description: "Wok-tossed noodles with shredded cabbage, carrots, bell peppers, light soy & white pepper.", price: 180, image: "/api/ai/dish-image?dish=Veg%20Hakka%20Noodles&v=v28", popularity: 96, rating: 4.8 },
      { name: "Triple Schezwan Fried Rice & Gravy", description: "Spicy wok rice and fried noodles tossed in fiery red Schezwan sauce with Manchurian gravy.", price: 240, image: "/api/ai/dish-image?dish=Schezwan%20Noodles&v=v28", popularity: 98, rating: 4.9 },
      { name: "Crispy Vegetable Spring Rolls", description: "Golden fried wafer rolls stuffed with seasoned Asian juliennes served with sweet chilli dip.", price: 150, image: "/api/ai/dish-image?dish=Spring%20Rolls&v=v28", popularity: 95, rating: 4.8 },
      { name: "Hot & Sour Manchow Soup", description: "Spicy dark broth loaded with garlic, chopped veggies and topped with crispy fried noodles.", price: 120, image: "/api/ai/dish-image?dish=Hot%20Garlic%20Noodles&v=v28", popularity: 96, rating: 4.8 },
      { name: "Iced Peach Ice Tea", description: "Refreshing brewed iced tea infused with sweet peach puree and mint.", price: 90, image: "/api/ai/dish-image?dish=Iced%20Tea&v=v28", popularity: 95, rating: 4.7 }
    ]
  },

  // Chai, Tea & Tapri
  {
    name: "Chai & Tapri Snacks",
    keywords: ['chai', 'tea', 'tapri', 'katta', 'dolly', 'chalo chai', 'chaiwala', 'cutting', 'tea post', 'bun maska', 'amruttulya'],
    dishes: [
      { name: "Special Kulhad Masala Chai & Bun Maska", description: "Strong aromatic tea brewed with ginger, cardamom, and lemongrass, served with warm buttery bun.", price: 70, image: "/api/ai/dish-image?dish=Masala%20Chai&v=v28", popularity: 100, rating: 5.0 },
      { name: "Sweet Bun Maska with Fruit Jam", description: "Soft bakery bun spread generously with pure Amul butter and sweet mixed fruit preserve.", price: 60, image: "/api/ai/dish-image?dish=Bun%20Maska&v=v28", popularity: 98, rating: 4.9 },
      { name: "Special Ginger Lemongrass Cutting Chai (2 Cups)", description: "Boiled milk tea infused with crushed fresh ginger root and aromatic lemongrass.", price: 40, image: "/api/ai/dish-image?dish=Masala%20Chai&v=v28", popularity: 99, rating: 5.0 },
      { name: "Legendary Mumbai Vada Pav (2 Pcs)", description: "Hot golden spiced potato dumplings in soft pav with dry garlic chutney & fried green chilli.", price: 50, image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28", popularity: 100, rating: 5.0 },
      { name: "Crispy Samosa Pav with Spicy Garlic Chutney", description: "Fresh fried samosa tucked inside soft ladi pav with fiery red dry garlic chutney.", price: 50, image: "/api/ai/dish-image?dish=Samosa&v=v28", popularity: 98, rating: 4.9 },
      { name: "Crispy Kanda Bhajji (Onion Pakoda) Plate", description: "Thin sliced onions tossed in spiced gram flour and fried crunchy, served with fried chillies.", price: 70, image: "/api/ai/dish-image?dish=Kanda%20Bhaji&v=v28", popularity: 98, rating: 4.9 },
      { name: "Steamed Kanda Poha Plate", description: "Fluffy flattened rice tempered with mustard seeds, curry leaves, onions & roasted peanuts.", price: 60, image: "/api/ai/dish-image?dish=Poha&v=v28", popularity: 97, rating: 4.8 },
      { name: "Crispy Sabudana Vada with Sweet Dahi", description: "Golden fried sago pearl patties with roasted crushed peanuts and sweetened spiced curd.", price: 90, image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v28", popularity: 98, rating: 4.9 },
      { name: "Cheese Grilled Masala Toast Sandwich", description: "Golden toasted sandwich with spiced potato masala, green chutney and molten processed cheese.", price: 120, image: "/api/ai/dish-image?dish=Cheese%20Sandwich&v=v28", popularity: 96, rating: 4.8 },
      { name: "Creamy Kadak Filter Coffee", description: "Traditional strong decoction milk coffee frothed rich with velvety foam.", price: 50, image: "/api/ai/dish-image?dish=Filter%20Coffee&v=v28", popularity: 97, rating: 4.8 },
      { name: "Rich Mawa Cake Slice (2 Pcs)", description: "Traditional Parsi bakery butter cardamom sponge cake packed with dense reduced milk mawa.", price: 70, image: "/api/ai/dish-image?dish=Cake&v=v28", popularity: 96, rating: 4.8 },
      { name: "Chilled Badam Milk with Kesar", description: "Sweetened milk infused with almond paste, Kashmiri saffron strands and crushed cardamom.", price: 80, image: "/api/ai/dish-image?dish=Milkshakes&v=v28", popularity: 95, rating: 4.8 }
    ]
  },

  // Gujarati Farsan & Thali
  {
    name: "Gujarati Farsan & Thali",
    keywords: ['gujarat', 'gujarati', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'khaman', 'dhokla', 'fafda', 'jalebi', 'locho', 'thepla', 'undhiyu', 'handvo', 'kathiyawadi', 'sev khamani', 'sev tameta'],
    dishes: [
      { name: "Special Surati Locho with Butter & Sev", description: "Steamed seasoned gram flour delicacy topped with melting butter, green garlic chutney, and crispy nylon sev.", price: 90, image: "/api/ai/dish-image?dish=Dhokla&v=v28", popularity: 100, rating: 5.0 },
      { name: "Authentic Fafda Jalebi Plate with Papaya Sambharo", description: "Crispy gram flour fafda paired with hot crunchy saffron jalebi, fried green chillies, and raw papaya salad.", price: 130, image: "/api/ai/dish-image?dish=Jalebi&v=v28", popularity: 100, rating: 5.0 },
      { name: "Nylon Khaman Dhokla (4 Pcs)", description: "Melt-in-mouth spongy yellow steamed cakes tempered with mustard, green chilies, sugar syrup & coconut.", price: 80, image: "/api/ai/dish-image?dish=Dhokla&v=v28", popularity: 99, rating: 5.0 },
      { name: "Royal Kathiyawadi Sev Tameta & Bajra No Rotlo", description: "Tangy spiced tomato curry topped with ratlami sev, served with clay-roasted pearl millet flatbread and fresh white butter.", price: 210, image: "/api/ai/dish-image?dish=Bhakri&v=v28", popularity: 98, rating: 4.9 },
      { name: "Crispy Methi Thepla with Chhundo (4 Pcs)", description: "Soft spiced whole wheat flatbreads kneaded with fresh fenugreek leaves and yogurt, served with sweet mango relish.", price: 90, image: "/api/ai/dish-image?dish=Thepla&v=v28", popularity: 97, rating: 4.8 },
      { name: "Steamed Vegetable Handvo Slice", description: "Savory fermented baked cake made from lentils, rice, grated bottle gourd, sesame & mustard seeds.", price: 110, image: "/api/ai/dish-image?dish=Dhokla&v=v28", popularity: 96, rating: 4.8 },
      { name: "Gujarati Surti Sev Khamani", description: "Crumbled chana dal delicacy sauteed in mustard seeds, ginger, pomegranate seeds and crispy sev.", price: 100, image: "/api/ai/dish-image?dish=Dhokla&v=v28", popularity: 96, rating: 4.8 },
      { name: "Grand Gujarati Royal Thali Platter", description: "Complete feast: Kathiyawadi curry, Dal, Kadhi, Steamed Rice, 4 Phulkas, Farsan, Papad, Pickle & Sweet.", price: 260, image: "/api/ai/dish-image?dish=Veg%20Thali&v=v28", popularity: 99, rating: 5.0 },
      { name: "Warm Puran Poli with Pure Desi Ghee", description: "Thin whole wheat sweet flatbread stuffed with spiced jaggery and chana dal stuffing, served dripping in ghee.", price: 90, image: "/api/ai/dish-image?dish=Puran%20Poli&v=v28", popularity: 98, rating: 4.9 },
      { name: "Hot Saffron Jalebi Plate (4 Pcs)", description: "Crispy golden spirals soaked in pure saffron sugar syrup.", price: 80, image: "/api/ai/dish-image?dish=Jalebi&v=v28", popularity: 99, rating: 5.0 },
      { name: "Chilled Gujarati Masala Chaas (Buttermilk)", description: "Thin refreshing spiced churned yogurt cooler with roasted cumin and coriander.", price: 40, image: "/images/food/masala_taak.jpg", popularity: 98, rating: 4.9 },
      { name: "Alphonso Mango Aamras Bowl", description: "Pure sweet mango pulp garnished with green cardamom and dry fruits.", price: 110, image: "/api/ai/dish-image?dish=Aamras&v=v28", popularity: 99, rating: 5.0 }
    ]
  },

  // South Indian & Udupi Cafes
  {
    name: "South Indian & Udupi Tiffin",
    keywords: ['dosa', 'idli', 'udupi', 'south indian', 'bhavan', 'tiffin', 'coffee', 'mtr', 'vidyarthi', 'sangeetha', 'saravana', 'priya', 'dakshin', 'wada', 'vada', 'sambar', 'rameshwaram', 'roopali', 'vaishali', 'wadeshwar'],
    dishes: [
      { name: "Mysore Butter Masala Dosa", description: "Crispy golden crepe with fiery red garlic spread & spiced potato masala.", price: 160, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Crispy Medu Vada Sambar (2 Pcs)", description: "Golden fried lentil donuts in hot aromatic lentil sambar & coconut chutney.", price: 110, image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Steamed Thatte Idli with Ghee Podi", description: "Plate-sized soft fluffy idlis drenched in pure desi ghee and spiced gun powder.", price: 120, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Crispy Onion Rava Dosa", description: "Lacy semolina crepe tempered with mustard, green chilies, cashews & onions.", price: 170, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Cheese Burst Masala Dosa", description: "Loaded with melted mozzarella & cheddar cheese over spiced potato filling.", price: 190, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Special Mixed Veg Uttapam", description: "Thick fermented pancake topped with juicy tomatoes, onions, capsicum & coriander.", price: 150, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 94, rating: 4.7 },
      { name: "Ven Pongal with Desi Ghee & Cashews", description: "Comforting rice-lentil porridge tempered with black pepper, cumin & whole cashews.", price: 130, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 93, rating: 4.8 },
      { name: "Heritage South Indian Filter Coffee", description: "Aromatic chicory-decoction frothed with boiling whole milk in brass davarah.", price: 60, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Sweet Pineapple Sheera / Kesari Bath", description: "Melt-in-mouth semolina pudding infused with saffron, pineapple chunks & ghee.", price: 90, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", popularity: 92, rating: 4.8 },
      { name: "Curd Rice with Pomegranate & Tadka", description: "Tempered creamy yogurt rice with mustard seeds, curry leaves & roasted cashews.", price: 140, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 90, rating: 4.7 }
    ]
  },

  // Vada Pav & Street Food
  {
    name: "Vada Pav & Street Food",
    keywords: ['vadapav', 'vada pav', 'wada pav', 'batata vada', 'vada', 'wada', 'wadewale', 'wade wale', 'vadapav wala', 'vada pav wala', 'wada pav wala', 'vadapav thela', 'vada pav thela', 'joshi', 'rohit', 'street food', 'babu vadapav', 'gajanan', 'jumbo king', 'nashta', 'snacks'],
    dishes: [
      { name: "Special Legendary Vada Pav (2 Pcs)", description: "Freshly fried golden potato dumplings stuffed in soft ladi pav with red garlic chutney.", price: 50, image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28", popularity: 100, rating: 5.0 },
      { name: "Fiery Schezwan Cheese Vada Pav", description: "Loaded with melted mozzarella, spicy schezwan glaze, and roasted garlic chutney.", price: 90, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Crispy Kothimbir Vadi Plate", description: "Steamed cilantro diamond cakes shallow-fried crisp with sweet-tangy chutney.", price: 80, image: "/images/food/kothimbir_vadi.jpg", popularity: 97, rating: 4.9 },
      { name: "Crispy Sabudana Vada with Sweet Dahi", description: "Golden fried tapioca patties with roasted peanuts and sweetened curd.", price: 90, image: "/api/ai/dish-image?dish=Sabudana%20Vada&v=v28", popularity: 97, rating: 4.8 },
      { name: "Steamed Kanda Poha Plate", description: "Fluffy flattened rice tempered with mustard, onions, roasted peanuts & lemon.", price: 60, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.7 },
      { name: "Spicy Misal Pav Combo", description: "Fiery sprouted bean curry topped with crispy farsan, onion, lemon & soft pav.", price: 120, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Batata Bhajji (Pakoda) Plate", description: "Crispy spiced gram flour coated potato fritters served with fried green chillies.", price: 70, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", popularity: 94, rating: 4.8 },
      { name: "Special Masala Chai Kulhad", description: "Cardamom & ginger infused hot milky tea served in traditional clay cup.", price: 30, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 }
    ]
  },

  // Misal & Maharashtrian
  {
    name: "Misal & Maharashtrian Food",
    keywords: ['misal', 'tarri', 'bhakri', 'pithla', 'thalipeeth', 'maratha', 'kolhapuri', 'katakirr', 'bedekar', 'mamledar', 'shaniwar peth', 'sadashiv peth', 'narayan peth', 'katta', 'bipin'],
    dishes: [
      { name: "Fiery Kolhapuri Tarri Misal Pav", description: "Sprouted moth beans in blistering spicy red cut rassa, crunchy farsan & fresh pav.", price: 140, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Special Puneri Sweet-Spicy Misal", description: "Authentic Pune style misal with pohe, matki, sample gravy, farsan & onion.", price: 130, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Pithla Bhakri & Thecha Thali", description: "Gram flour pithla served piping hot with freshly roasted jowar bhakri & green thecha.", price: 180, image: "/api/ai/dish-image?dish=Bhakri&v=v28", popularity: 99, rating: 5.0 },
      { name: "Special Bhakri Bhaji Thali", description: "Authentic roasted jowar bhakri with spicy vegetable bhaji, green thecha, onion & pickle.", price: 190, image: "/api/ai/dish-image?dish=Bhakri&v=v28", popularity: 100, rating: 5.0 },
      { name: "Crispy Bhajani Thalipeeth with White Butter", description: "Multi-grain savory spiced flatbread served with fresh homemade white makkhan.", price: 120, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Bharli Vangi (Stuffed Eggplant Curry)", description: "Baby eggplants slow-cooked in rich roasted peanut, coconut and sesame gravy.", price: 190, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Khandeshi Shev Bhaji with Pav", description: "Fiery spicy roasted red gravy served with thick crunchy ratlami shev.", price: 170, image: "/images/food/shev_bhaji.jpg", popularity: 96, rating: 4.8 },
      { name: "Steamed Ukdiche Modak (2 Pcs)", description: "Delicate rice dough dumplings filled with freshly grated coconut, jaggery & ghee.", price: 120, image: "/images/food/modak.jpg", popularity: 99, rating: 5.0 },
      { name: "Chilled Kokum Solkadhi Glass", description: "Pink digestive drink made of fresh coconut milk, kokum extract, garlic & cilantro.", price: 50, image: "/images/food/solkadhi.jpg", popularity: 98, rating: 4.9 }
    ]
  },

  // Biryani, Mughlai & Non-Veg
  {
    name: "Biryani & Mughlai Kebabs",
    keywords: ['biryani', 'mutton', 'chicken', 'kebab', 'kebabs', 'nihari', 'handi', 'non veg', 'darbar', 'boti', 'seekh', 'tandoori', 'jagdamb', 'karim', 'behrouz'],
    dishes: [
      { name: "Special Dum Mutton Biryani", description: "Aromatic Basmati rice slow cooked on dum with tender mutton chunks & saffron ghee.", price: 390, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Hyderabadi Chicken Dum Biryani", description: "Fragrant spiced long grain rice layered with succulent marinated chicken & mint.", price: 320, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Charcoal Smoky Tandoori Chicken (Full)", description: "Whole spring chicken marinated in Kashmiri red chilli yogurt and grilled in clay tandoor.", price: 420, image: "/api/ai/dish-image?dish=Tandoori%20Chicken&v=v28", popularity: 98, rating: 4.9 },
      { name: "Old Delhi Style Butter Chicken", description: "Tender roasted chicken tikka simmered in rich creamy tomato cashew makhani gravy.", price: 360, image: "/images/food/butter_chicken.jpg", popularity: 99, rating: 5.0 },
      { name: "Mutton Rogan Josh Kashmiri", description: "Slow-cooked Kashmiri tender mutton curry infused with ratanjot & fennel spices.", price: 410, image: "/images/food/mutton_curry.jpg", popularity: 97, rating: 4.9 },
      { name: "Juicy Chicken Seekh Kebab (4 Pcs)", description: "Charcoal grilled spiced minced chicken skewers served with mint chutney.", price: 290, image: "/api/ai/dish-image?dish=Tandoori%20Chicken&v=v28", popularity: 96, rating: 4.8 },
      { name: "Spicy Chicken Handi with Gravy", description: "Rustic country chicken cooked in traditional earthenware handi with whole spices.", price: 370, image: "/images/food/chicken_curry.jpg", popularity: 97, rating: 4.9 },
      { name: "Fluffy Butter Garlic Naan (2 Pcs)", description: "Leavened oven-baked flatbread glazed with crushed roasted garlic & pure butter.", price: 90, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Dal Makhani Overnight Simmered", description: "Black lentils and kidney beans slow simmered with butter and fresh cream.", price: 230, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Royal Shahi Phirni Kulhad", description: "Ground rice pudding infused with Kashmiri saffron, cardamom & silver vark.", price: 110, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 }
    ]
  },

  // Seafood & Coastal
  {
    name: "Coastal & Malvani Seafood",
    keywords: ['seafood', 'fish', 'surmai', 'pomfret', 'prawns', 'crab', 'malvan', 'konkan', 'goan', 'bombil', 'nisarg', 'gajalee', 'mahesh'],
    dishes: [
      { name: "Surmai Rava Fish Fry (Kingfish)", description: "Fresh kingfish steak coated in fiery coastal masala and crispy golden semolina crust.", price: 440, image: "/images/food/fish_fry.jpg", popularity: 100, rating: 5.0 },
      { name: "Special Pomfret Curry Thali", description: "Whole fresh pomfret curry, fried fish, rice bhakri, steamed rice & solkadhi.", price: 490, image: "/images/food/fish_fry.jpg", popularity: 99, rating: 5.0 },
      { name: "Crispy Bombay Duck (Bombil) Fry", description: "Fresh Bombay duck fillets marinated in triphala spices and pan-fried extra crisp.", price: 320, image: "/images/food/fish_fry.jpg", popularity: 98, rating: 4.9 },
      { name: "Butter Garlic Tiger Prawns", description: "Jumbo prawns tossed in sizzling garlic butter, white pepper and fresh parsley.", price: 420, image: "/images/food/fish_fry.jpg", popularity: 99, rating: 5.0 },
      { name: "Crab Sukka Masala (Mud Crab)", description: "Whole fresh crab simmered in dry roasted coconut, black pepper and Malvani spices.", price: 540, image: "/images/food/fish_fry.jpg", popularity: 97, rating: 4.9 },
      { name: "Tisrya (Clams) Masala Fry", description: "Fresh ocean clams cooked with shallots, curry leaves, tamarind & coconut masala.", price: 340, image: "/images/food/fish_fry.jpg", popularity: 96, rating: 4.8 },
      { name: "Steamed Rice Bhakri (2 Pcs)", description: "Traditional soft gluten-free flatbread prepared from freshly milled rice flour.", price: 60, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Digestive Pink Solkadhi Glass", description: "Chilled extract of fresh coconut milk and wild kokum with crushed green chilies.", price: 50, image: "/images/food/solkadhi.jpg", popularity: 99, rating: 5.0 }
    ]
  },

  // Pav Bhaji & Chaat
  {
    name: "Pav Bhaji & Chaat Adda",
    keywords: ['pav bhaji', 'bhel', 'chaat', 'pani puri', 'panipuri', 'golgappe', 'golgappa', 'puchka', 'gupchup', 'pani puri wala', 'panipuri wala', 'chaat wala', 'chaatwala', 'chaat thela', 'bhel puri', 'sukha puri', 'sev puri', 'ragda', 'dahi puri', 'thela', 'stall', 'chowpatty', 'sardar', 'honest', 'relax', 'girija'],
    dishes: [
      { name: "Pani Puri Platter (6 Pcs)", description: "Crisp puffed puris served with spicy mint pani, sweet sonth chutney & warm ragda.", price: 60, image: "/api/ai/dish-image?dish=Pani%20Puri&v=v28", popularity: 100, rating: 5.0 },
      { name: "Special SPDP (Sev Potato Dahi Puri)", description: "Crispy puris layered with spiced potatoes, sweetened curd, date chutney & sev.", price: 110, image: "/api/ai/dish-image?dish=SPDP&v=v28", popularity: 99, rating: 5.0 },
      { name: "Special Amul Butter Pav Bhaji", description: "Mashed vegetable spiced gravy served with a floating slab of pure butter & warm pav.", price: 160, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Cheese Loaded Masala Pav Bhaji", description: "Topped with a mountain of grated mozzarella and processed cheese.", price: 190, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Dahi Papdi Chaat Supreme", description: "Crispy flour wafers layered with boiled chickpeas, spiced yogurt, sev & pomegranate.", price: 120, image: "/api/ai/dish-image?dish=Papdi%20Chaat&v=v28", popularity: 97, rating: 4.8 },
      { name: "Double Butter Masala Pav", description: "Soft ladi pavs drenched in sizzling butter garlic bhaji gravy.", price: 110, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Ragda Pattice Platter", description: "Crispy golden potato patties drowned in hot white pea curry, chutney & sev.", price: 120, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Royal Mango Kulfi Falooda", description: "Chilled rose vermicelli blend with sweet basil seeds, mango puree & malai kulfi.", price: 150, image: "/api/ai/dish-image?dish=Royal%20Mango%20Kulfi%20Falooda&v=v28", popularity: 97, rating: 4.9 }
    ]
  },

  // Bar & Restaurant / Multi-Cuisine Dining / Permit Room
  {
    name: "Bar & Multi-Cuisine Restaurant",
    keywords: ['temptation', 'bar', 'permit room', 'lounge', 'beer', 'pub', 'club', 'dining bar', 'restobar', 'resto bar', 'brewery', 'barometer', 'hidden place', 'wine', 'liquor'],
    dishes: [
      { name: "Special Tandoori Chicken Tikka (6 Pcs)", description: "Smoky boneless chicken chunks marinated in hung curd, ginger garlic & roasted spices.", price: 320, image: "/api/ai/dish-image?dish=Tandoori%20Chicken&v=v28", popularity: 100, rating: 5.0, category: "Starters & Snacks", is_veg: 0 },
      { name: "Famous Butter Chicken with Garlic Naan", description: "Charcoal grilled chicken in rich creamy tomato cashew gravy with hot garlic butter naan.", price: 360, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0, category: "Main Course", is_veg: 0 },
      { name: "Paneer Butter Masala Handi", description: "Fresh cottage cheese cubes simmered in velvety tomato butter gravy and aromatic kasuri methi.", price: 270, image: "/api/ai/dish-image?dish=Paneer%20Butter%20Masala&v=v28", popularity: 99, rating: 5.0, category: "Main Course", is_veg: 1 },
      { name: "Crispy Fish Koliwada Fry", description: "Fresh fish fillets coated in spicy gram flour batter, deep fried crisp with mint dip.", price: 380, image: "/api/ai/dish-image?dish=Fish%20Fry&v=v28", popularity: 98, rating: 4.9, category: "Starters & Snacks", is_veg: 0 },
      { name: "Crispy Chicken Lollipop Schezwan (6 Pcs)", description: "Crumb-fried juicy chicken wings tossed in fiery wok Schezwan sauce.", price: 290, image: "/api/ai/dish-image?dish=Chicken%20Lollipop&v=v28", popularity: 99, rating: 4.9, category: "Starters & Snacks", is_veg: 0 },
      { name: "Tandoori Paneer Tikka Platter (6 Pcs)", description: "Smoky chargrilled cottage cheese with bell peppers, onions and mint dip.", price: 280, image: "/api/ai/dish-image?dish=Paneer%20Tikka&v=v28", popularity: 98, rating: 4.9, category: "Starters & Snacks", is_veg: 1 },
      { name: "Dal Makhani Overnight Charcoal Simmered", description: "Slow simmered black lentils finished with fresh cream and butter.", price: 230, image: "/api/ai/dish-image?dish=Dal%20Makhani&v=v28", popularity: 97, rating: 4.9, category: "Main Course", is_veg: 1 },
      { name: "Mutton Sukka Fry with Bhakri", description: "Dry roasted tender mutton cooked with caramelized onions, coconut and black masala.", price: 410, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9, category: "Main Course", is_veg: 0 },
      { name: "Hyderabadi Chicken Dum Biryani", description: "Fragrant spiced long grain basmati rice layered with juicy chicken and saffron.", price: 340, image: "/api/ai/dish-image?dish=Chicken%20Biryani&v=v28", popularity: 99, rating: 5.0, category: "Rice & Biryani", is_veg: 0 },
      { name: "Special Veg Pulao with Raita", description: "Long grain Basmati rice tossed with fresh garden vegetables, paneer & brown onions.", price: 210, image: "/api/ai/dish-image?dish=Veg%20Pulao&v=v28", popularity: 95, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Crispy Corn Salt and Pepper", description: "Crunchy sweet corn kernels tossed with crushed pepper, spring onions & green chillies.", price: 220, image: "/api/ai/dish-image?dish=Paneer%20Tikka&v=v28", popularity: 96, rating: 4.8, category: "Starters & Snacks", is_veg: 1 },
      { name: "Butter Garlic Naan (2 Pcs)", description: "Clay oven baked leavened bread slathered with roasted garlic butter.", price: 110, image: "/api/ai/dish-image?dish=Garlic%20Naan&v=v28", popularity: 98, rating: 4.9, category: "Indian Breads", is_veg: 1 },
      { name: "Paneer Chilli Dry & Hakka Noodles", description: "Wok-fried cottage cheese cubes tossed with bell peppers, green chillies & noodles.", price: 270, image: "/api/ai/dish-image?dish=Fried%20Rice&v=v28", popularity: 97, rating: 4.8, category: "Starters & Snacks", is_veg: 1 },
      { name: "Fragrant Jeera Rice with Dal Tadka", description: "Cumin tempered Basmati rice with yellow lentil garlic tadka.", price: 190, image: "/api/ai/dish-image?dish=Jeera%20Rice&v=v28", popularity: 96, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Sizzling Brownie with Vanilla Ice Cream", description: "Warm chocolate walnut brownie on cast iron sizzler with dark fudge sauce.", price: 180, image: "/api/ai/dish-image?dish=Warm%20Sizzling%20Chocolate%20Brownie%20with%20Ice%20Cream&v=v28", popularity: 99, rating: 5.0, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Hot Gulab Jamun in Saffron Syrup (2 Pcs)", description: "Melt-in-mouth milk dumplings soaked in cardamom sugar syrup.", price: 90, image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28", popularity: 97, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 }
    ]
  },

  // Chinese & Pan-Asian
  {
    name: "Chinese & Pan-Asian Wok",
    keywords: ['chinese', 'noodle', 'noodles', 'momo', 'momos', 'wok', 'schezwan', 'manchurian', 'dragon', 'asian', 'dimsum', 'chopstick', 'fried rice', 'mainland'],
    dishes: [
      { name: "Special Triple Schezwan Fried Rice & Gravy", description: "Wok-tossed spicy rice and noodles topped with red Schezwan gravy & crispy noodles.", price: 260, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Steamed Veg Momos (6 Pcs)", description: "Authentic steamed Himalayan dumplings served with fiery red spicy garlic chutney.", price: 140, image: "/api/ai/dish-image?dish=Momos&v=v28", popularity: 100, rating: 5.0 },
      { name: "Crispy Fried Cheese Momos (6 Pcs)", description: "Golden fried crunchy dumplings stuffed with melted mozzarella & sweet corn, served with mayo dip.", price: 170, image: "/api/ai/dish-image?dish=Momos&v=v28", popularity: 99, rating: 5.0 },
      { name: "Steamed Butter Garlic Momos (6 Pcs)", description: "Handcrafted steamed dumplings glazed in sizzling chili garlic butter sauce.", price: 180, image: "/api/ai/dish-image?dish=Momos&v=v28", popularity: 99, rating: 5.0 },
      { name: "Fiery Schezwan Gravy Momos", description: "Steamed momos wok-tossed in hot sizzling Schezwan red pepper gravy.", price: 190, image: "/api/ai/dish-image?dish=Momos&v=v28", popularity: 98, rating: 4.9 },
      { name: "Fiery Dragon Chicken / Paneer Sizzler", description: "Crispy strips tossed with cashews, red peppers, and fiery hot sauce on sizzler plate.", price: 310, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Classic Veg Hakka Noodles", description: "Wok-tossed noodles with shredded cabbage, carrots, capsicum, soy & white pepper.", price: 190, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Chilli Garlic Fried Rice", description: "Aromatic jasmine rice stir-fried with burnt garlic, red chillies and scallions.", price: 210, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Crispy Spring Rolls with Sweet Chilli Dip", description: "Golden fried pastry rolls packed with spiced Asian vegetable juliennes.", price: 180, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Hot & Sour Manchow Soup with Fried Noodles", description: "Spicy dark broth loaded with minced mushrooms, garlic, coriander & crispy noodles.", price: 140, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 }
    ]
  },

  // Pizza & Italian
  {
    name: "Pizza & Italian Adda",
    keywords: ['pizza', 'pizzeria', 'pizzas', 'domino', 'pizza hut', 'ovenstory', 'la pinoz', 'mojo', 'pasta', 'italian', 'slice', 'crust'],
    dishes: [
      { name: "Special Farmhouse 7-Cheese Burst Pizza", description: "Hand-stretched crust overflowing with mozzarella, cheddar, bell peppers, olives & corn.", price: 360, image: "/api/ai/dish-image?dish=Farmhouse%20Pizza&v=v28", popularity: 100, rating: 5.0 },
      { name: "Fiery Peri Peri Paneer / Chicken Pizza", description: "Loaded with spiced peri peri chunks, red paprika, jalapenos & smoked cheese blend.", price: 340, image: "/api/ai/dish-image?dish=Paneer%20Pizza&v=v28", popularity: 99, rating: 4.9 },
      { name: "Cheesy Garlic Breadsticks with Dip", description: "Buttered golden breadsticks stuffed with molten mozzarella & sweet corn kernels.", price: 170, image: "/api/ai/dish-image?dish=Garlic%20Bread&v=v28", popularity: 98, rating: 4.9 },
      { name: "Creamy White Sauce Alfredo Pasta", description: "Penne pasta tossed in rich parmesan garlic cream sauce with mushrooms & herbs.", price: 260, image: "/api/ai/dish-image?dish=White%20Sauce%20Pasta&v=v28", popularity: 97, rating: 4.8 },
      { name: "Spicy Red Arrabiata Pasta", description: "Al dente penne in fiery crushed tomato sauce with garlic, basil, olives & parmesan.", price: 240, image: "/api/ai/dish-image?dish=Red%20Sauce%20Pasta&v=v28", popularity: 96, rating: 4.8 },
      { name: "Margherita Supreme with Fresh Basil", description: "San Marzano style tomato base with fresh mozzarella slices & basil leaves.", price: 290, image: "/api/ai/dish-image?dish=Margherita%20Pizza&v=v28", popularity: 97, rating: 4.9 },
      { name: "Molten Choco Lava Cake", description: "Warm chocolate sponge cake with gooey flowing dark chocolate center.", price: 110, image: "/api/ai/dish-image?dish=Cake&v=v28", popularity: 99, rating: 5.0 }
    ]
  },

  // Burger & Fast Food
  {
    name: "Burger & Fast Food",
    keywords: ['burger', 'burgers', 'flippin', 'good flippin', 'smash burger', 'mcdonald', 'burger king', 'kfc', 'wendy', 'wrap', 'fries', 'fast food', 'crunch', 'subway', 'crispy chicken burger', 'whopper'],
    dishes: [
      { name: "Special Double Patty Crispy Burger & Fries", description: "Toasted brioche bun with crispy spiced patty, melted cheese, lettuce & secret sauce.", price: 210, image: "/api/ai/dish-image?dish=Veg%20Burger&v=v28", popularity: 100, rating: 5.0 },
      { name: "Fiery Peri Peri Crunch Bites Bucket", description: "Crumb-fried golden bites tossed in hot peri peri spice mix with cheese dip.", price: 180, image: "/api/ai/dish-image?dish=Nuggets&v=v28", popularity: 98, rating: 4.9 },
      { name: "Cheese Loaded Peri Peri French Fries", description: "Crispy crinkle-cut golden fries smothered in warm cheese sauce & jalapenos.", price: 140, image: "/api/ai/dish-image?dish=Peri%20Peri%20Fries&v=v28", popularity: 99, rating: 5.0 },
      { name: "Crispy Paneer / Chicken Tikka Wrap", description: "Warm tortilla stuffed with smoky tikka cubes, crunchy onions & mint mayo.", price: 190, image: "/api/ai/dish-image?dish=Paneer%20Wrap&v=v28", popularity: 97, rating: 4.8 },
      { name: "Spicy Zinger Crunch Burger", description: "Extra crispy spiced whole fillet topped with fresh coleslaw and chipotle drizzle.", price: 230, image: "/api/ai/dish-image?dish=Crispy%20Chicken%20Burger&v=v28", popularity: 98, rating: 4.9 },
      { name: "Golden Crispy Onion Rings (8 Pcs)", description: "Thick sweet onion slices batter-fried crisp served with garlic aioli.", price: 130, image: "/api/ai/dish-image?dish=French%20Fries&v=v28", popularity: 95, rating: 4.7 },
      { name: "Thick Cold Chocolate Frappe", description: "Blended dark espresso, rich cocoa fudge and whipped dairy cream.", price: 160, image: "/api/ai/dish-image?dish=Cold%20Coffee&v=v28", popularity: 98, rating: 4.9 }
    ]
  },

  // Ice Cream, Desserts & Shakes
  {
    name: "Ice Cream, Mastani & Shakes",
    keywords: ['ice cream', 'dessert', 'falooda', 'kulfi', 'mastani', 'shake', 'waffle', 'bakery', 'cake', 'naturals', 'havmor', 'amul', 'sujata', 'giani', 'baskin'],
    dishes: [
      { name: "Special Alphonso Mango Mastani", description: "Thick mango puree milkshake crowned with vanilla ice cream, dry fruits & cherries.", price: 170, image: "/images/food/mango_mastani.jpg", popularity: 100, rating: 5.0 },
      { name: "Royal Kaju Sitaphal Mastani", description: "Real custard apple pulp blended thick with whole roasted cashews & malai scoop.", price: 190, image: "/images/food/sitaphal_mastani.jpg", popularity: 99, rating: 5.0 },
      { name: "Royal Shahi Falooda with Rabdi", description: "Rose milk layered with vermicelli, basil seeds, rich malai kulfi & rabdi.", price: 180, image: "/images/food/falooda.jpg", popularity: 98, rating: 4.9 },
      { name: "Tender Coconut Natural Ice Cream", description: "Artisanal handcrafted natural ice cream packed with fresh malai coconut chunks.", price: 100, image: "/images/food/tender_coconut_ice_cream.jpg", popularity: 98, rating: 4.9 },
      { name: "Saffron Matka Kulfi on Stick", description: "Slow-reduced milk kulfi infused with Kashmiri saffron, pistachios & cardamom.", price: 80, image: "/images/food/kulfi.jpg", popularity: 97, rating: 4.9 },
      { name: "Nutella Belgian Waffle with Ice Cream", description: "Freshly ironed golden crisp waffle smothered in warm Nutella and choco chips.", price: 210, image: "/images/food/vanilla_ice_cream.jpg", popularity: 99, rating: 5.0 }
    ]
  },

  // Maharashtrian Swayampakghar, Homestyle Dining & Khanawal
  {
    name: "Maharashtrian Swayampakghar & Homestyle Dining",
    keywords: [
      'swayampakghar', 'swayampak', 'swayam', 'khanawal', 'poli bhaji', 'poli', 'bhaji kendra',
      'boarding', 'bhojanalay', 'bhojanalaya', 'dining hall', 'shabree', 'sukanta', 'shreyas',
      'durvankur', 'phadke', 'badshahi', 'poona boarding', 'poona guest house', 'poona guest', 'guest house', 'aaswad', 'marathi', 'maharashtrian',
      'puneri', 'kothimbir', 'alu vadi', 'aloo vadi', 'patra', 'puran poli', 'pithla', 'pitla', 'bhakri', 'varan bhat',
      'thecha', 'modak', 'zunka', 'bharli vangi', 'sathe', 'chapati'
    ],
    dishes: [
      { name: "Special Puran Poli Thali with Pure Desi Ghee", description: "Soft melt-in-mouth puran poli served with aromatic Katachi Amti, batata bhaji & pure desi ghee.", price: 230, image: "https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85", popularity: 100, rating: 5.0 },
      { name: "Garma Garam Pithla Bhakri with Thecha & Kanda", description: "Hot golden besan pithla served with fresh jowar bhakri, green thecha and fresh sliced onions.", price: 180, image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=85", popularity: 100, rating: 5.0 },
      { name: "Maharashtrian Special Veg Thali", description: "2 Chapatis, seasonal sabzi, usal, dal varan bhat with pure ghee, koshimbir, papad & sweet.", price: 210, image: "https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85", popularity: 99, rating: 4.9 },
      { name: "Crispy Kothimbir Vadi with Mint Chutney", description: "Fresh coriander and spiced gram flour savory diamond cutlets fried crunchy.", price: 90, image: "/images/food/kothimbir_vadi.jpg", popularity: 98, rating: 4.9 },
      { name: "Steamed & Fried Alu Vadi Plate (Patra)", description: "Colocasia leaf spiced pinwheels garnished with roasted sesame seeds & grated coconut.", price: 90, image: "/images/food/alu_vadi.jpg", popularity: 98, rating: 4.9 },
      { name: "Steamed Ukdiche Modak with Saffron Ghee (2 Pcs)", description: "Traditional sweet rice dumplings stuffed with fresh grated coconut & jaggery.", price: 110, image: "/images/food/modak.jpg", popularity: 98, rating: 4.9 },
      { name: "Authentic Bharli Vangi with Jowar Bhakri", description: "Spiced baby brinjals simmered in rich roasted peanut and sesame goda gravy.", price: 200, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85", popularity: 97, rating: 4.8 },
      { name: "Indrayani Varan Bhat with Pure Desi Ghee", description: "Steaming aromatic soft rice topped with yellow lentil varan, fresh lemon & ghee.", price: 140, image: "https://images.unsplash.com/photo-1789991184293-224a84e41900?w=800&auto=format&fit=crop&q=85", popularity: 96, rating: 4.8 },
      { name: "Digestive Pink Kokum Solkadhi", description: "Chilled fresh coconut milk extract with wild kokum, garlic, and fresh coriander.", price: 50, image: "/images/food/solkadhi.jpg", popularity: 98, rating: 4.9 },
      { name: "Chilled Masala Taak (Mattha)", description: "Traditional spiced buttermilk tempered with roasted cumin, fresh coriander, ginger & mint.", price: 40, image: "/images/food/masala_taak.jpg", popularity: 98, rating: 4.9 },
      { name: "Authentic Bhajani Thalipeeth with White Butter", description: "Crispy multigrain roasted flatbread served with homemade white butter and pickle.", price: 120, image: "https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85", popularity: 97, rating: 4.8 },
      { name: "Khandeshi Shev Bhaji with Pav", description: "Fiery spicy roasted red masala gravy served with thick crunchy ratlami shev.", price: 170, image: "/images/food/shev_bhaji.jpg", popularity: 96, rating: 4.8 },
      { name: "Fresh Shrikhand Puri Plate (4 Pcs)", description: "Creamy saffron and cardamom-infused hung curd shrikhand served with 4 puffed golden wheat puris.", price: 160, image: "/images/food/shrikhand_puri.jpg", popularity: 99, rating: 5.0 },
      { name: "Authentic Maharashtrian Puri Bhaji", description: "4 Crispy golden puffed puris served with aromatic yellow batata sukhi bhaji, lemon and green thecha.", price: 130, image: "/images/food/puri_bhaji.jpg", popularity: 98, rating: 4.9 },
      { name: "Traditional Kheer with Saffron & Roasted Dry Fruits", description: "Slow-cooked rich creamy milk kheer infused with Kashmiri saffron, cardamom, cashews, almonds & pistachios.", price: 90, image: "/images/food/kheer.jpg", popularity: 98, rating: 4.9 },
      { name: "Pure Alphonso Aamras Puri Platter", description: "Seasonal heritage special: pure Alphonso mango pulp served with 4 fluffy hot puris.", price: 210, image: "/images/food/aamras_puri.jpg", popularity: 99, rating: 5.0 },
      { name: "Traditional Masala Bhaat with Pure Ghee", description: "Fragrant spiced wedding rice prepared with goda masala, tendli, cashews, and fresh coconut garnish.", price: 150, image: "/images/food/masala_bhaat.jpg", popularity: 97, rating: 4.8 },
      { name: "Sabudana Khichdi with Sweet Dahi", description: "Tender sago pearls sauteed in pure ghee with roasted peanuts, cumin, and green chillies, served with fresh curd.", price: 90, image: "/images/food/sabudana_khichdi.jpg", popularity: 98, rating: 4.9 }
    ]
  },

  // Military Hotel & Maratha Non-Veg
  {
    name: "Military Hotel & Maratha Non-Veg",
    keywords: [
      'military', 'military hotel', 'maratha', 'kolhapuri', 'tambda', 'pandhra',
      'rassa', 'gavran', 'mutton thali', 'chicken thali', 'surve', 'hotel sandeep',
      'jagadamb', 'jagdamb', 'dehati', 'hotel shivaji'
    ],
    dishes: [
      { name: "Special Kolhapuri Mutton Thali (Tambda & Pandhra Rassa)", description: "Fiery red rassa, rich white coconut broth, tender mutton sukka, 2 jowar bhakris & fragrant rice.", price: 380, image: "/images/food/mutton_thali.jpg", popularity: 100, rating: 5.0, category: "Thalis & Combos", is_veg: 0 },
      { name: "Bokud Mutton Fry (Signature Specialty)", description: "Prime cut goat meat slow pan-roasted dry in black onion masala and roasted coconut.", price: 424, image: "/images/food/mutton_curry.jpg", popularity: 100, rating: 5.0, category: "Non-Veg Main Course", is_veg: 0 },
      { name: "Bokud Mutton Handi Gravy", description: "Tender goat meat simmered in traditional earthen handi with roasted Kolhapuri spices.", price: 435, image: "/images/food/mutton_curry.jpg", popularity: 99, rating: 5.0, category: "Non-Veg Main Course", is_veg: 0 },
      { name: "Bokud Mutton Ukkhar (Clear Broth)", description: "Mildly spiced comforting goat meat bone broth cooked with turmeric, ginger and fresh coriander.", price: 435, image: "/images/food/mutton_curry.jpg", popularity: 98, rating: 4.9, category: "Non-Veg Main Course", is_veg: 0 },
      { name: "Bolai Mutton Handi", description: "Rustic sheep meat slow-cooked in rich caramelized onion and garlic rassa.", price: 435, image: "/images/food/mutton_curry.jpg", popularity: 98, rating: 4.9, category: "Non-Veg Main Course", is_veg: 0 },
      { name: "Spicy Gavran Chicken Sukka with Jowar Bhakri", description: "Country chicken pan-roasted dry in rich caramelized onions, coconut and black masala.", price: 320, image: "/images/food/chicken_curry.jpg", popularity: 99, rating: 5.0, category: "Non-Veg Main Course", is_veg: 0 },
      { name: "Gavran Chicken Handi", description: "Country chicken simmered in rich Kolhapuri spiced red curry with fresh coriander.", price: 405, image: "/images/food/chicken_curry.jpg", popularity: 98, rating: 4.9, category: "Non-Veg Main Course", is_veg: 0 },
      { name: "Chicken Tangdi Kabab (3 Pcs)", description: "Charcoal clay tandoor grilled chicken drumsticks marinated in curd, ginger garlic & roasted spices.", price: 488, image: "/images/food/tandoori_chicken.jpg", popularity: 99, rating: 5.0, category: "Tandoori & Grilled", is_veg: 0 },
      { name: "Mutton Kheema Pav & Boiled Egg Curry", description: "Minced spiced mutton slow cooked with green peas, mint, and toasted butter ladi pav.", price: 240, image: "/images/food/mutton_curry.jpg", popularity: 98, rating: 4.9, category: "Non-Veg Main Course", is_veg: 0 },
      { name: "Smoky Tandoori Chicken Tikka (6 Pcs)", description: "Clay oven roasted spiced chicken chunks with mint-coriander chutney.", price: 290, image: "/images/food/tandoori_chicken.jpg", popularity: 97, rating: 4.9, category: "Tandoori & Grilled", is_veg: 0 },
      { name: "Tambda Rassa Bowl (Extra Cut)", description: "Unlimited style fiery red mutton bone broth infused with Kolhapuri lavangi chillies.", price: 90, image: "/images/food/mutton_curry.jpg", popularity: 99, rating: 5.0, category: "Soups", is_veg: 0 },
      { name: "Pandhra Rassa Bowl (White Broth)", description: "Aromatic white bone soup slow-simmered with coconut milk, white sesame, poppy seeds & spices.", price: 90, image: "/images/food/mutton_curry.jpg", popularity: 99, rating: 5.0, category: "Soups", is_veg: 0 },
      { name: "Kombdi Vade (Chicken with Puffed Vade)", description: "Malvani style spicy chicken gravy served with 4 multi-grain puffed kombdi vade.", price: 340, image: "/images/food/chicken_curry.jpg", popularity: 98, rating: 4.9, category: "Thalis & Combos", is_veg: 0 },
      { name: "Surmai Rava Fish Fry", description: "Fresh kingfish steak coated in fiery red masala and crispy semolina crust.", price: 440, image: "/images/food/fish_fry.jpg", popularity: 99, rating: 5.0, category: "Seafood", is_veg: 0 },
      { name: "Crispy Bombil Fry", description: "Fresh Bombay duck fillets pan-fried extra crisp with Malvani triphala spice.", price: 320, image: "/images/food/fish_fry.jpg", popularity: 98, rating: 4.9, category: "Seafood", is_veg: 0 },
      { name: "Hot Jowar Bhakri (2 Pcs)", description: "Hand-patted roasted whole grain sorghum flatbread with charred aroma.", price: 50, image: "/images/food/pithla_bhakri.jpg", popularity: 98, rating: 4.9, category: "Indian Breads", is_veg: 1 },
      { name: "Steamed Indrayani Rice with Ghee", description: "Soft fragrant sticky Indrayani rice, the perfect match for hot rassa.", price: 110, image: "/images/food/biryani.jpg", popularity: 97, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Traditional Solkadhi Glass", description: "Pink coconut milk digestive appetizer infused with fresh wild kokum.", price: 50, image: "/images/food/solkadhi.jpg", popularity: 99, rating: 5.0, category: "Tea & Coffee", is_veg: 1 }
    ]
  },

  // Fresh Juices, Sugarcane Raswanti & Coolers
  {
    name: "Fresh Juices, Shakes & Coolers",
    keywords: ['juice', 'juices', 'juice center', 'juice bar', 'raswanti', 'sugarcane', 'ganne ka ras', 'sharbat', 'cooler', 'mocktail', 'lemonade', 'fresh juice'],
    dishes: [
      { name: "Freshly Squeezed Orange Juice", description: "100% pure cold-pressed Nagpur oranges served chilled with pulp and no added sugar.", price: 90, image: "/api/ai/dish-image?dish=Fresh%20Orange%20Juice&v=v57", popularity: 100, rating: 5.0, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Chilled Watermelon Juice (Tarbooz Ras)", description: "Refreshing ruby-red watermelon juice blended with a hint of black salt and fresh mint leaves.", price: 80, image: "/api/ai/dish-image?dish=Fresh%20Watermelon%20Juice&v=v57", popularity: 99, rating: 5.0, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Fresh Mosambi (Sweet Lime) Juice", description: "Naturally sweet and vitamin-C rich hand-pressed mosambi juice served ice cold.", price: 85, image: "/api/ai/dish-image?dish=Fresh%20Mosambi%20Juice&v=v57", popularity: 99, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Thick Alphonso Mango Juice", description: "Rich pulpy Ratnagiri Alphonso mango nectar served chilled in a tall glass.", price: 110, image: "/api/ai/dish-image?dish=Fresh%20Mango%20Juice&v=v57", popularity: 98, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Fresh Chilled Sugarcane Juice (Ganne Ka Ras)", description: "Crushed fresh sugarcane juice pressed with ginger, lemon, and mint leaves.", price: 40, image: "/api/ai/dish-image?dish=Sugarcane%20Juice&v=v57", popularity: 100, rating: 5.0, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Fresh Mint Mojito & Lime Cooler", description: "Muddled garden mint leaves, fresh lime wedges, crushed ice, and sparkling lemon refresher.", price: 100, image: "/api/ai/dish-image?dish=Virgin%20Mojito&v=v57", popularity: 98, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Mixed Fruit Cocktail Juice", description: "Energizing blend of fresh pineapple, sweet orange, pomegranate, and apple juices.", price: 110, image: "/api/ai/dish-image?dish=Mixed%20Fruit%20Juice&v=v57", popularity: 97, rating: 4.8, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Fresh Anar (Pomegranate) Juice", description: "Pure cold-pressed ruby pomegranate seeds packed with natural antioxidants.", price: 130, image: "/api/ai/dish-image?dish=Pomegranate%20Juice&v=v57", popularity: 97, rating: 4.8, category: "Desserts & Drinks", is_veg: 1 }
    ]
  },

  // Paratha House & North Indian Tandoor
  {
    name: "Paratha House & North Indian Tandoor",
    keywords: ['paratha', 'paranthas', 'parantha', 'parathas', 'chaitanya', 'aloo paratha', 'paneer paratha', 'kulcha', 'amritsari', 'paratha house'],
    dishes: [
      { name: "Special Aloo Cheese Stuffed Paratha with Makhan & Dahi", description: "Hot crispy layered paratha packed with spiced mashed potatoes, cheese, served with dollop of white butter, fresh dahi & pickle.", price: 160, image: "/api/ai/dish-image?dish=Aloo%20Paratha&v=v28", popularity: 100, rating: 5.0 },
      { name: "Paneer Pyaz Special Stuffed Paratha", description: "Crumbled malai paneer and caramelized onions stuffed inside golden roasted butter paratha with mint chutney.", price: 180, image: "/api/ai/dish-image?dish=Paneer%20Paratha&v=v28", popularity: 99, rating: 5.0 },
      { name: "Crispy Amritsari Kulcha with Chole", description: "Flaky clay oven baked potato onion kulcha served with spicy Amritsari chole & imli chutney.", price: 190, image: "/api/ai/dish-image?dish=Kulcha&v=v28", popularity: 98, rating: 4.9 },
      { name: "Mix Veg Cheese Double Decker Paratha", description: "Loaded with spiced cauliflower, carrots, peas, potatoes and melted cheese blend.", price: 170, image: "/api/ai/dish-image?dish=Aloo%20Paratha&v=v28", popularity: 97, rating: 4.9 },
      { name: "Methi Paneer Tawa Paratha with Raita", description: "Fresh fenugreek leaves and seasoned paneer kneaded into multi-layered paratha.", price: 150, image: "/api/ai/dish-image?dish=Paneer%20Paratha&v=v28", popularity: 96, rating: 4.8 },
      { name: "Punjabi Sweet Lassi Malai Mar Ke", description: "Thick hand-churned sweet creamy yogurt drink in a tall glass crowned with fresh malai.", price: 90, image: "/api/ai/dish-image?dish=Lassi&v=v28", popularity: 99, rating: 5.0 },
      { name: "Dal Makhani Charcoal Simmered", description: "Black lentils slow-cooked overnight with churned butter and fresh cream.", price: 210, image: "/api/ai/dish-image?dish=Dal%20Makhani&v=v28", popularity: 96, rating: 4.8 },
      { name: "Hot Gulab Jamun in Saffron Syrup (2 Pcs)", description: "Warm melt-in-mouth milk dumplings soaked in cardamom saffron syrup.", price: 80, image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28", popularity: 97, rating: 4.8 }
    ]
  },

  // Rolls, Wraps & Shawarma
  {
    name: "Rolls, Wraps & Shawarma",
    keywords: ['roll', 'rolls', 'wrap', 'wraps', 'shawarma', 'kathi roll', 'frankie', 'rolls mania', 'tibbs', 'roll point'],
    dishes: [
      { name: "Special Paneer Tikka Kathi Roll", description: "Clay oven roasted spiced cottage cheese, crunchy onions, and mint chutney rolled in flaky paratha.", price: 150, image: "/api/ai/dish-image?dish=Paneer%20Wrap&v=v28", popularity: 100, rating: 5.0 },
      { name: "Classic Double Egg Chicken Roll", description: "Succulent shredded chicken kebab and double egg omelette rolled with tangy onions and sauces.", price: 180, image: "/api/ai/dish-image?dish=Chicken%20Wrap&v=v28", popularity: 99, rating: 5.0 },
      { name: "Crispy Aloo Masala Frankie Roll", description: "Spiced potato cutlet roll wrapped with crunchy onions, chaat masala and tangy coriander sauce.", price: 110, image: "/api/ai/dish-image?dish=Indian%20Rolls&v=v28", popularity: 98, rating: 4.9 },
      { name: "Mutton Seekh Kebab Roll with Green Chutney", description: "Tender spiced minced mutton seekh skewers rolled in crisp buttery laccha paratha.", price: 210, image: "/api/ai/dish-image?dish=Mutton%20Seekh%20Kebab&v=v28", popularity: 98, rating: 4.9 },
      { name: "Cheese Melt Veg Frankie Roll", description: "Golden toasted roll stuffed with spiced mixed vegetables and molten cheese blend.", price: 140, image: "/api/ai/dish-image?dish=Paneer%20Wrap&v=v28", popularity: 97, rating: 4.8 },
      { name: "Loaded Peri Peri French Fries", description: "Crispy golden potato fries seasoned with fiery African peri peri spice rub.", price: 110, image: "/api/ai/dish-image?dish=Peri%20Peri%20Fries&v=v28", popularity: 96, rating: 4.8 },
      { name: "Chilled Sweet Mango Lassi Glass", description: "Thick churned creamy yogurt shake blended with sweet Alphonso mango pulp.", price: 90, image: "/api/ai/dish-image?dish=Mango%20Lassi&v=v28", popularity: 97, rating: 4.9 }
    ]
  },

  // Pure Veg, Dhaba & North Indian
  {
    name: "Pure Veg & Punjabi Dhaba",
    keywords: ['dhaba', 'punjabi', 'paneer', 'north indian', 'chole', 'dal makhani', 'bhoj', 'rasoi'],
    dishes: [
      { name: "Special Paneer Butter Masala", description: "Fresh malai paneer cubes simmered in rich creamy butter tomato gravy & kasuri methi.", price: 260, image: "/api/ai/dish-image?dish=Special%20Paneer%20Butter%20Masala&v=v28", popularity: 100, rating: 5.0, category: "Main Course", is_veg: 1 },
      { name: "Dal Makhani Charcoal Simmered", description: "Black lentils slow-cooked overnight with churned white butter, cream & whole spices.", price: 230, image: "/api/ai/dish-image?dish=Dal%20Makhani&v=v28", popularity: 99, rating: 4.9, category: "Main Course", is_veg: 1 },
      { name: "Crispy Butter Garlic Naan (2 Pcs)", description: "Clay oven tandoor baked leavened bread slathered with roasted garlic butter.", price: 90, image: "/api/ai/dish-image?dish=Garlic%20Naan&v=v28", popularity: 99, rating: 4.9, category: "Indian Breads", is_veg: 1 },
      { name: "Special Veg Dum Biryani with Boondi Raita", description: "Long grain Basmati rice cooked with garden vegetables and aromatic spices in sealed clay pot.", price: 250, image: "/api/ai/dish-image?dish=Veg%20Biryani&v=v28", popularity: 98, rating: 4.9, category: "Rice & Biryani", is_veg: 1 },
      { name: "Mumbai Street Style Tawa Pulao", description: "Fragrant long grain rice tossed on giant tawa with fresh veggies, paneer cubes & pav bhaji butter spices.", price: 210, image: "/api/ai/dish-image?dish=Tawa%20Pulao&v=v28", popularity: 98, rating: 4.9, category: "Rice & Biryani", is_veg: 1 },
      { name: "Special Veg Pulao with Raita", description: "Fragrant basmati rice tossed with fresh green peas, carrot cubes, paneer and browned onions.", price: 210, image: "/api/ai/dish-image?dish=Veg%20Pulao&v=v28", popularity: 97, rating: 4.9, category: "Rice & Biryani", is_veg: 1 },
      { name: "Fresh Green Peas (Matar) Pulao", description: "Delicate long grain rice tempered with sweet green peas, whole cumin, cardamom and pure ghee.", price: 190, image: "/api/ai/dish-image?dish=Matar%20Pulao&v=v28", popularity: 96, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Shahi Kashmiri Pulao with Dry Fruits & Pomegranate", description: "Aromatic saffron-infused basmati rice tossed with roasted cashews, almonds, raisins, and fresh pomegranate.", price: 240, image: "/api/ai/dish-image?dish=Kashmiri%20Pulao&v=v28", popularity: 96, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Tandoori Paneer Tikka Pulao", description: "Smoky clay-oven roasted paneer tikka cubes folded into spiced biryani rice with caramelized onions.", price: 230, image: "/api/ai/dish-image?dish=Paneer%20Pulao&v=v28", popularity: 96, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Royal Shahi Paneer Handi", description: "Soft paneer cubes simmered in royal cashew, almond, milk and saffron gravy.", price: 280, image: "/api/ai/dish-image?dish=Shahi%20Paneer&v=v28", popularity: 98, rating: 4.9, category: "Main Course", is_veg: 1 },
      { name: "Fresh Palak Paneer", description: "Cottage cheese cubes folded in spiced smooth spinach puree finished with garlic and cream.", price: 250, image: "/api/ai/dish-image?dish=Palak%20Paneer&v=v28", popularity: 97, rating: 4.8, category: "Main Course", is_veg: 1 },
      { name: "Amritsari Chole Bhature Platter", description: "Spicy dark Amritsari chickpea curry served with two puffed golden bhaturas, pickled onions and chili.", price: 210, image: "/api/ai/dish-image?dish=Chole%20Bhature&v=v28", popularity: 99, rating: 5.0, category: "Main Course", is_veg: 1 },
      { name: "Home-Style Rajma Chawal Combo", description: "Slow-simmered Kashmiri kidney bean curry served over steaming hot basmati rice with pickle.", price: 190, image: "/api/ai/dish-image?dish=Rajma%20Chawal&v=v28", popularity: 97, rating: 4.8, category: "Main Course", is_veg: 1 },
      { name: "Fragrant Jeera Rice & Yellow Dal Tadka", description: "Cumin tempered Basmati rice served with garlic and red chili tadka yellow dal.", price: 220, image: "/api/ai/dish-image?dish=Jeera%20Rice&v=v28", popularity: 96, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Spicy Veg Kolhapuri Gravy", description: "Mixed garden vegetables tossed in fiery red Kolhapuri chili paste and roasted coconut.", price: 240, image: "/api/ai/dish-image?dish=Veg%20Kolhapuri&v=v28", popularity: 96, rating: 4.8, category: "Main Course", is_veg: 1 },
      { name: "Fresh Mix Veg Makhani", description: "Seasonal garden vegetables cooked in mild buttery tomato gravy.", price: 230, image: "/api/ai/dish-image?dish=Mix%20Veg&v=v28", popularity: 95, rating: 4.7, category: "Main Course", is_veg: 1 },
      { name: "Dhaba Style Aloo Gobi Masala", description: "Tender potatoes and spiced cauliflower florets tossed with ginger, cumin and fresh coriander.", price: 200, image: "/api/ai/dish-image?dish=Aloo%20Gobi&v=v28", popularity: 95, rating: 4.7, category: "Main Course", is_veg: 1 },
      { name: "Smoky Baingan Bharta with Bhakri", description: "Charcoal roasted spiced eggplant mash sauteed with onions, green chillies and fresh jowar bhakri.", price: 210, image: "/api/ai/dish-image?dish=Baingan%20Bharta&v=v28", popularity: 96, rating: 4.8, category: "Main Course", is_veg: 1 },
      { name: "Traditional Kadhi Pakora with Rice", description: "Tangy yogurt gram flour kadhi with crispy onion pakoras served with steamed basmati rice.", price: 190, image: "/api/ai/dish-image?dish=Kadhi%20Pakora&v=v28", popularity: 95, rating: 4.7, category: "Main Course", is_veg: 1 },
      { name: "Tandoori Paneer Tikka Platter (6 Pcs)", description: "Charcoal grilled cottage cheese chunks with bell peppers, onions & mint chutney.", price: 270, image: "/api/ai/dish-image?dish=Tandoori%20Paneer%20Tikka%20Platter&v=v28", popularity: 97, rating: 4.8, category: "Starters & Snacks", is_veg: 1 },
      { name: "Crispy Hara Bhara Kabab (6 Pcs)", description: "Spinach, green peas, and paneer patties shallow-fried crisp with mint coriander chutney.", price: 210, image: "/api/ai/dish-image?dish=Hara%20Bhara%20Kebab&v=v28", popularity: 96, rating: 4.8, category: "Starters & Snacks", is_veg: 1 },
      { name: "Special Aloo Stuffed Paratha with Butter & Curd", description: "Layered flatbread packed with spiced mashed potatoes, fresh white butter, dahi & pickle.", price: 160, image: "/api/ai/dish-image?dish=Aloo%20Paratha&v=v28", popularity: 97, rating: 4.8, category: "Indian Breads", is_veg: 1 },
      { name: "Paneer Pyaz Special Paratha", description: "Crumbled fresh paneer and caramelized onions stuffed inside golden butter paratha.", price: 180, image: "/api/ai/dish-image?dish=Paneer%20Paratha&v=v28", popularity: 96, rating: 4.8, category: "Indian Breads", is_veg: 1 },
      { name: "Amritsari Stuffed Kulcha", description: "Clay oven baked potato onion kulcha brushed with desi ghee served with chole & tamarind chutney.", price: 170, image: "/api/ai/dish-image?dish=Kulcha&v=v28", popularity: 97, rating: 4.8, category: "Indian Breads", is_veg: 1 },
      { name: "Butter Tandoori Roti (2 Pcs)", description: "Whole wheat clay oven baked roti brushed with pure melted butter.", price: 50, image: "/api/ai/dish-image?dish=Butter%20Naan&v=v28", popularity: 97, rating: 4.8, category: "Indian Breads", is_veg: 1 },
      { name: "Creamy Saffron Rasmalai (2 Pcs)", description: "Soft melt-in-mouth cottage cheese patties soaked in saffron and cardamom scented milk.", price: 110, image: "/api/ai/dish-image?dish=Rasmalai&v=v28", popularity: 98, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Hot Gulab Jamun in Saffron Syrup (2 Pcs)", description: "Soft melt-in-mouth milk solids dumplings soaked in warm cardamom saffron syrup.", price: 80, image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28", popularity: 98, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Garma Garam Gajar Ka Halwa with Khoya", description: "Slow-cooked grated red carrots simmered in whole milk, mawa, pure ghee, and roasted cashews.", price: 120, image: "/api/ai/dish-image?dish=Gajar%20Halwa&v=v28", popularity: 98, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Punjabi Sweet Lassi Malai Mar Ke", description: "Thick churned creamy yogurt shake served in a tall brass glass with malai layer.", price: 90, image: "/api/ai/dish-image?dish=Punjabi%20Sweet%20Lassi%20Malai%20Mar%20Ke&v=v28", popularity: 97, rating: 4.8, category: "Desserts & Drinks", is_veg: 1 }
    ]
  },

  // Mumbai Street Food, Pav Bhaji & Tawa Pulao
  {
    name: "Mumbai Street Food, Pav Bhaji & Tawa Pulao",
    keywords: ['pav bhaji', 'tawa pulao', 'bhel', 'chaat', 'pani puri', 'sev puri', 'dahi puri', 'dabeli', 'ragda pattice', 'vada pav', 'vadapav', 'vadya', 'mr vadya', 'samosa', 'kachori', 'relax', 'girija', 'sardar', 'honest'],
    dishes: [
      { name: "Mumbai Street Style Tawa Pulao", description: "Fragrant long grain rice tossed on giant tawa with fresh bell peppers, green peas, paneer cubes, tomatoes & spicy pav bhaji butter spices.", price: 210, image: "/api/ai/dish-image?dish=Tawa%20Pulao&v=v28", popularity: 100, rating: 5.0, category: "Rice & Biryani", is_veg: 1 },
      { name: "Special Amul Butter Pav Bhaji", description: "Rich spiced mashed vegetable bhaji drenched in pure Amul butter, served with sizzling butter-toasted soft ladi pavs.", price: 160, image: "/api/ai/dish-image?dish=Pav%20Bhaji&v=v28", popularity: 100, rating: 5.0, category: "Snacks & Starters", is_veg: 1 },
      { name: "Cheese Loaded Masala Pav Bhaji", description: "Topped with a mountain of grated mozzarella and processed cheese, served with two buttery pavs.", price: 190, image: "/api/ai/dish-image?dish=Pav%20Bhaji&v=v28", popularity: 99, rating: 5.0, category: "Snacks & Starters", is_veg: 1 },
      { name: "Legendary Mumbai Vada Pav (2 Pcs)", description: "Golden spiced potato dumpling enclosed in soft ladi pav with red garlic chutney & green chili.", price: 50, image: "/api/ai/dish-image?dish=Vada%20Pav&v=v28", popularity: 100, rating: 5.0, category: "Snacks & Starters", is_veg: 1 },
      { name: "Pani Puri / Golgappa Platter (6 Pcs)", description: "Crispy hollow puris served with mint-coriander spiced water, sweet date chutney & warm ragda.", price: 60, image: "/api/ai/dish-image?dish=Pani%20Puri&v=v28", popularity: 100, rating: 5.0, category: "Snacks & Starters", is_veg: 1 },
      { name: "Special Sev Puri Chaat", description: "Flat crispy papdis loaded with diced potatoes, onions, trio of chutneys and a mountain of crisp nylon sev.", price: 90, image: "/api/ai/dish-image?dish=Sev%20Puri&v=v28", popularity: 99, rating: 4.9, category: "Snacks & Starters", is_veg: 1 },
      { name: "Dahi Puri Supreme", description: "Puffed puris filled with potato mash, sweet chilled curd, tamarind chutney, roasted cumin and sev.", price: 110, image: "/api/ai/dish-image?dish=Dahi%20Puri&v=v28", popularity: 99, rating: 4.9, category: "Snacks & Starters", is_veg: 1 },
      { name: "Crunchy Bhel Puri", description: "Puffed rice tossed with onions, tomatoes, raw mango, spiced chutneys and crushed papdi.", price: 80, image: "/api/ai/dish-image?dish=Bhel%20Puri&v=v28", popularity: 98, rating: 4.8, category: "Snacks & Starters", is_veg: 1 },
      { name: "Kutchi Dabeli (2 Pcs)", description: "Spiced potato mix tucked inside toasted pav with roasted peanuts, sweet pomegranate & sev.", price: 70, image: "/api/ai/dish-image?dish=Dabeli&v=v28", popularity: 97, rating: 4.8, category: "Snacks & Starters", is_veg: 1 },
      { name: "Ragda Pattice Platter", description: "Crisp potato patties smothered in steaming hot white pea ragda curry, chutneys and chopped coriander.", price: 120, image: "/api/ai/dish-image?dish=Ragda%20Pattice&v=v28", popularity: 98, rating: 4.8, category: "Snacks & Starters", is_veg: 1 },
      { name: "Crispy Samosa Plate with Chutney (2 Pcs)", description: "Golden triangular pastries filled with spicy potatoes, peas and cashews.", price: 60, image: "/api/ai/dish-image?dish=Samosa&v=v28", popularity: 98, rating: 4.9, category: "Snacks & Starters", is_veg: 1 },
      { name: "Moong Dal Khasta Kachori (2 Pcs)", description: "Flaky deep-fried puffed puris packed with spiced yellow lentil stuffing & dry spices.", price: 70, image: "/api/ai/dish-image?dish=Kachori&v=v28", popularity: 96, rating: 4.8, category: "Snacks & Starters", is_veg: 1 },
      { name: "Crispy Aloo Tikki Chaat", description: "Golden shallow-fried potato cutlets served with sweet curd, mint chutney & pomegranate seeds.", price: 110, image: "/api/ai/dish-image?dish=Aloo%20Tikki&v=v28", popularity: 97, rating: 4.8, category: "Snacks & Starters", is_veg: 1 },
      { name: "Crispy Kanda Bhajji (Onion Pakoda)", description: "Thin sliced onions coated with carom-seed spiced gram flour and fried super crunchy.", price: 80, image: "/api/ai/dish-image?dish=Kanda%20Bhaji&v=v28", popularity: 98, rating: 4.9, category: "Snacks & Starters", is_veg: 1 },
      { name: "Special Paneer Tikka Kathi Roll", description: "Clay oven roasted spiced cottage cheese, crunchy onions, and mint chutney rolled in flaky paratha.", price: 150, image: "/api/ai/dish-image?dish=Paneer%20Roll&v=v28", popularity: 98, rating: 4.9, category: "Snacks & Starters", is_veg: 1 },
      { name: "Classic Bombay Veg Toast Sandwich", description: "Thin-sliced potato, cucumber, tomato & onion with mint chutney, sandwich masala & butter.", price: 110, image: "/api/ai/dish-image?dish=Veg%20Sandwich&v=v28", popularity: 98, rating: 4.9, category: "Snacks & Starters", is_veg: 1 },
      { name: "Special Veg Pulao with Raita", description: "Fragrant basmati rice tossed with fresh green peas, carrot cubes, paneer and browned onions.", price: 210, image: "/api/ai/dish-image?dish=Veg%20Pulao&v=v28", popularity: 97, rating: 4.9, category: "Rice & Biryani", is_veg: 1 },
      { name: "Fresh Green Peas (Matar) Pulao", description: "Delicate long-grain rice tempered with sweet green peas, whole cumin, cardamom and pure ghee.", price: 190, image: "/api/ai/dish-image?dish=Matar%20Pulao&v=v28", popularity: 96, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Royal Shahi Falooda with Rabdi & Kulfi", description: "Rose milk layered with vermicelli, sweet basil seeds, malai kulfi slice and creamy rabdi.", price: 160, image: "/api/ai/dish-image?dish=Falooda&v=v28", popularity: 99, rating: 5.0, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Chilled Sweet Mango Lassi", description: "Thick hand-churned yogurt smoothie blended with ripe mango pulp and crushed pistachios.", price: 90, image: "/api/ai/dish-image?dish=Mango%20Lassi&v=v28", popularity: 97, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 }
    ]
  },

  // Royal North Indian, Biryani & Mughlai Veg
  {
    name: "Royal North Indian, Biryani & Mughlai Veg",
    keywords: ['royal veg', 'shahi', 'biryani veg', 'mughlai veg', 'veg dum biryani', 'kashmiri pulao', 'kaju kari'],
    dishes: [
      { name: "Special Veg Dum Biryani with Boondi Raita", description: "Long grain Basmati rice cooked with garden vegetables and aromatic spices in sealed clay pot.", price: 250, image: "/api/ai/dish-image?dish=Veg%20Biryani&v=v28", popularity: 100, rating: 5.0, category: "Rice & Biryani", is_veg: 1 },
      { name: "Shahi Kashmiri Pulao with Dry Fruits & Pomegranate", description: "Aromatic saffron-infused basmati rice tossed with roasted cashews, almonds, raisins, and fresh pomegranate.", price: 240, image: "/api/ai/dish-image?dish=Kashmiri%20Pulao&v=v28", popularity: 99, rating: 5.0, category: "Rice & Biryani", is_veg: 1 },
      { name: "Tandoori Paneer Tikka Biryani", description: "Smoky tandoori paneer tikka layered with saffron basmati rice and caramelized mint onions.", price: 270, image: "/api/ai/dish-image?dish=Paneer%20Biryani&v=v28", popularity: 98, rating: 4.9, category: "Rice & Biryani", is_veg: 1 },
      { name: "Fresh Mushroom Dum Biryani", description: "Earthy button mushrooms marinated in aromatic yogurt spices and slow-cooked with long grain rice.", price: 260, image: "/api/ai/dish-image?dish=Mushroom%20Biryani&v=v28", popularity: 97, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Mumbai Street Style Tawa Pulao", description: "Spicy basmati rice tossed with bell peppers, green peas, tomatoes and butter pav bhaji masala.", price: 210, image: "/api/ai/dish-image?dish=Tawa%20Pulao&v=v28", popularity: 98, rating: 4.9, category: "Rice & Biryani", is_veg: 1 },
      { name: "Special Veg Pulao with Raita", description: "Fragrant basmati rice tossed with fresh green peas, carrot cubes, paneer and browned onions.", price: 210, image: "/api/ai/dish-image?dish=Veg%20Pulao&v=v28", popularity: 97, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Royal Shahi Paneer Handi", description: "Soft malai paneer simmered in rich creamy white cashew and saffron gravy.", price: 280, image: "/api/ai/dish-image?dish=Shahi%20Paneer&v=v28", popularity: 99, rating: 5.0, category: "Main Course", is_veg: 1 },
      { name: "Special Paneer Butter Masala", description: "Fresh cottage cheese in velvet tomato butter gravy and aromatic kasuri methi.", price: 260, image: "/api/ai/dish-image?dish=Paneer%20Butter%20Masala&v=v28", popularity: 99, rating: 4.9, category: "Main Course", is_veg: 1 },
      { name: "Dal Makhani Overnight Charcoal Simmered", description: "Whole black lentils slow simmered for 18 hours with pure churned butter and cream.", price: 230, image: "/api/ai/dish-image?dish=Dal%20Makhani&v=v28", popularity: 98, rating: 4.9, category: "Main Course", is_veg: 1 },
      { name: "Tandoori Paneer Tikka Platter (6 Pcs)", description: "Smoky chargrilled cottage cheese with bell peppers, onions and mint dip.", price: 270, image: "/api/ai/dish-image?dish=Paneer%20Tikka&v=v28", popularity: 98, rating: 4.9, category: "Starters & Snacks", is_veg: 1 },
      { name: "Crispy Butter Garlic Naan (2 Pcs)", description: "Clay oven baked leavened bread slathered with roasted garlic butter.", price: 90, image: "/api/ai/dish-image?dish=Garlic%20Naan&v=v28", popularity: 98, rating: 4.9, category: "Indian Breads", is_veg: 1 },
      { name: "Fragrant Jeera Rice & Yellow Dal Tadka", description: "Cumin tempered Basmati rice served with garlic and red chili tadka yellow dal.", price: 220, image: "/api/ai/dish-image?dish=Jeera%20Rice&v=v28", popularity: 96, rating: 4.8, category: "Rice & Biryani", is_veg: 1 },
      { name: "Creamy Saffron Rasmalai (2 Pcs)", description: "Soft melt-in-mouth cottage cheese patties soaked in saffron and cardamom scented milk.", price: 110, image: "/api/ai/dish-image?dish=Rasmalai&v=v28", popularity: 98, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Warm Gulab Jamun in Saffron Syrup (2 Pcs)", description: "Warm melt-in-mouth milk dumplings soaked in cardamom saffron syrup.", price: 80, image: "/api/ai/dish-image?dish=Gulab%20Jamun&v=v28", popularity: 98, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 },
      { name: "Royal Kaju Katli (4 Pcs)", description: "Diamond cut silver-foiled luxury sweet made with premium pulverized cashews and sugar.", price: 120, image: "/api/ai/dish-image?dish=Kaju%20Katli&v=v28", popularity: 98, rating: 4.9, category: "Desserts & Drinks", is_veg: 1 }
    ]
  },

  // Healthy Food, Salads & Breakfast
  {
    name: "Healthy Food, Salads & Breakfast",
    keywords: ['healthy', 'salad', 'diet', 'fit', 'quinoa', 'sprouts', 'buddha bowl', 'protein bowl', 'breakfast', 'brunch', 'oats', 'smoothie bowl'],
    dishes: [
      { name: "Crisp Classic Caesar Salad with Croutons", description: "Crisp romaine lettuce tossed in creamy parmesan garlic dressing with crunchy herb croutons.", price: 220, image: "/api/ai/dish-image?dish=Caesar%20Salad&v=v28", popularity: 100, rating: 5.0, category: "Salads & Healthy Food", is_veg: 1 },
      { name: "Mediterranean Greek Salad with Feta", description: "Vine-ripened tomatoes, cucumbers, bell peppers, Kalamata olives, oregano, and crumbled feta cheese.", price: 230, image: "/api/ai/dish-image?dish=Greek%20Salad&v=v28", popularity: 99, rating: 5.0, category: "Salads & Healthy Food", is_veg: 1 },
      { name: "Fresh Garden Green Salad with Lemon", description: "Crisp cucumber rounds, carrots, juicy tomatoes, radish, and fresh lemon wedges.", price: 140, image: "/api/ai/dish-image?dish=Garden%20Salad&v=v28", popularity: 96, rating: 4.8, category: "Salads & Healthy Food", is_veg: 1 },
      { name: "Sprouted Moong & Chana Salad with Chaat Masala", description: "Steamed sprouted beans tossed with diced tomatoes, onions, green chillies, lemon and chaat spices.", price: 150, image: "/api/ai/dish-image?dish=Sprouts%20Salad&v=v28", popularity: 97, rating: 4.8, category: "Salads & Healthy Food", is_veg: 1 },
      { name: "Fresh Seasonal Cut Fruit Bowl", description: "Handpicked fresh seasonal papaya, pineapple, crisp apples, watermelon, and pomegranate seeds.", price: 160, image: "/api/ai/dish-image?dish=Fruit%20Bowl&v=v28", popularity: 98, rating: 4.9, category: "Salads & Healthy Food", is_veg: 1 },
      { name: "Wholesome Quinoa Buddha Bowl", description: "Fluffy cooked organic quinoa paired with roasted sweet potatoes, edamame, avocado, and tahini drizzle.", price: 280, image: "/api/ai/dish-image?dish=Buddha%20Bowl&v=v28", popularity: 98, rating: 4.9, category: "Salads & Healthy Food", is_veg: 1 },
      { name: "Tandoori Paneer & Pepper Salad", description: "Warm chargrilled paneer cubes tossed over fresh rocket leaves and lemon olive oil dressing.", price: 240, image: "/api/ai/dish-image?dish=Paneer%20Salad&v=v28", popularity: 97, rating: 4.8, category: "Salads & Healthy Food", is_veg: 1 },
      { name: "Acai Berry Smoothie Bowl with Seeds & Nuts", description: "Thick antioxidant-rich berry puree topped with chia seeds, pumpkin seeds, granola, and fresh banana slices.", price: 260, image: "/api/ai/dish-image?dish=Smoothie%20Bowl&v=v28", popularity: 99, rating: 5.0, category: "Salads & Healthy Food", is_veg: 1 },
      { name: "Puneri Kanda Poha Plate", description: "Fluffy flattened rice tempered with mustard seeds, turmeric, peanuts, and freshly grated coconut.", price: 60, image: "/api/ai/dish-image?dish=Poha&v=v28", popularity: 98, rating: 4.9, category: "Breakfast & Brunch", is_veg: 1 },
      { name: "Savory Semolina Upma", description: "Roasted semolina tempered with mustard seeds, curry leaves, ginger, green chillies & roasted cashews.", price: 70, image: "/api/ai/dish-image?dish=Upma&v=v28", popularity: 96, rating: 4.8, category: "Breakfast & Brunch", is_veg: 1 },
      { name: "Street Style Bread Omelette", description: "Two-egg masala omelette wrapped inside golden butter-toasted bread slices with coriander chutney.", price: 90, image: "/api/ai/dish-image?dish=Bread%20Omelette&v=v28", popularity: 98, rating: 4.9, category: "Breakfast & Brunch", is_veg: 0 },
      { name: "Double Cheese Omelette with Toast", description: "Fluffy three-egg omelette overflowing with melted cheddar and mozzarella cheese served with toast.", price: 140, image: "/api/ai/dish-image?dish=Cheese%20Omelette&v=v28", popularity: 98, rating: 4.9, category: "Breakfast & Brunch", is_veg: 0 },
      { name: "Fluffy Buttery Scrambled Eggs", description: "Slow-cooked creamy scrambled eggs seasoned with cracked black pepper and chives served with toast.", price: 120, image: "/api/ai/dish-image?dish=Scrambled%20Eggs&v=v28", popularity: 96, rating: 4.8, category: "Breakfast & Brunch", is_veg: 0 },
      { name: "Boiled Eggs with Black Pepper (2 Pcs)", description: "Farm-fresh hard-boiled eggs served halved with crushed peppercorns and pink Himalayan salt.", price: 50, image: "/api/ai/dish-image?dish=Boiled%20Eggs&v=v28", popularity: 95, rating: 4.7, category: "Breakfast & Brunch", is_veg: 0 },
      { name: "Fluffy American Pancakes with Maple Syrup", description: "Stack of three golden buttermilk pancakes served with melted butter and pure maple syrup.", price: 210, image: "/api/ai/dish-image?dish=Pancakes&v=v28", popularity: 98, rating: 4.9, category: "Breakfast & Brunch", is_veg: 1 },
      { name: "Nutella Belgian Waffles", description: "Freshly ironed golden crisp waffle smothered in warm Nutella and choco chips.", price: 210, image: "/api/ai/dish-image?dish=Waffles&v=v28", popularity: 99, rating: 5.0, category: "Breakfast & Brunch", is_veg: 1 },
      { name: "Cinnamon Brioche French Toast", description: "Thick brioche bread dipped in spiced egg custard and pan-toasted golden with honey drizzle.", price: 190, image: "/api/ai/dish-image?dish=French%20Toast&v=v28", popularity: 97, rating: 4.8, category: "Breakfast & Brunch", is_veg: 1 },
      { name: "Creamy Oatmeal Porridge with Nuts & Honey", description: "Warm rolled oats cooked in milk topped with toasted almonds, walnuts, chia seeds, and raw honey.", price: 140, image: "/api/ai/dish-image?dish=Oats&v=v28", popularity: 96, rating: 4.8, category: "Breakfast & Brunch", is_veg: 1 },
      { name: "Fresh Berry Yogurt Granola Bowl", description: "Greek yogurt layered with crunchy artisanal honey granola and fresh seasonal berries.", price: 180, image: "/api/ai/dish-image?dish=Granola%20Bowl&v=v28", popularity: 98, rating: 4.9, category: "Breakfast & Brunch", is_veg: 1 },
      { name: "Soothing Green Tea with Mint", description: "Whole leaf antioxidant-rich green tea brewed with fresh garden mint leaves.", price: 50, image: "/api/ai/dish-image?dish=Green%20Tea&v=v28", popularity: 95, rating: 4.7, category: "Tea & Coffee", is_veg: 1 },
      { name: "Fresh Lemon Honey Tea", description: "Hot water infused with pure clover honey, fresh lemon juice and sliced ginger.", price: 50, image: "/api/ai/dish-image?dish=Lemon%20Tea&v=v28", popularity: 95, rating: 4.7, category: "Tea & Coffee", is_veg: 1 }
    ]
  }
];

// Helper to extract a clean prefix name from any restaurant string
function getCleanSpotBrandName(rawName: string): string {
  if (!rawName) return 'Special';
  const clean = rawName
    .replace(/\b(hotel|restaurant|cafe|dhaba|stall|point|corner|center|outlet|bhojanalaya|refreshment|bhandar|the|famous)\b/gi, '')
    .trim();
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 0 && words[0].length >= 2) {
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return rawName.split(/\s+/)[0] || 'Special';
}

export function generateLiveMenuForRestaurant(restaurant: { id: number; name: string; description?: string; area?: string; city?: string; is_veg?: number }): Dish[] {
  const restName = restaurant.name || 'Special Food Joint';
  const restNameLower = restName.toLowerCase().trim();
  const descLower = (restaurant.description || '').toLowerCase().trim();
  const text = `${restNameLower} ${descLower} ${(restaurant.area || '').toLowerCase()} ${(restaurant.city || '').toLowerCase()}`;

  const collectedDishes: DishTemplate[] = [];
  const seenDishKeys = new Set<string>();
  let isIconicMatch = false;

  // 1. Check for EXACT ICONIC RESTAURANT MATCH in restaurant name
  for (const [key, iconicDishes] of Object.entries(ICONIC_RESTAURANT_DISHES)) {
    const keyLower = key.toLowerCase().trim();
    const wordRegex = new RegExp(`(^|[^a-z0-9])${keyLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
    if (wordRegex.test(restNameLower) || (keyLower.length >= 4 && restNameLower.includes(keyLower))) {
      isIconicMatch = true;
      for (const item of iconicDishes) {
        const keyNorm = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!seenDishKeys.has(keyNorm)) {
          seenDishKeys.add(keyNorm);
          collectedDishes.push({
            ...item,
            category: item.category || inferDishCategory(item.name, item.description),
            is_veg: item.is_veg !== undefined ? item.is_veg : (isDishVeg(item.name) ? 1 : 0)
          });
        }
      }
      break;
    }
  }

  // 2. If not an iconic landmark match, match against rich CUISINE_MENUS by cuisine keywords
  if (!isIconicMatch || collectedDishes.length === 0) {
    for (const cuisine of CUISINE_MENUS) {
      const matchesKeyword = cuisine.keywords.some(kw => {
        const kwRegex = new RegExp(`(^|[^a-z0-9])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
        return kwRegex.test(text);
      });
      if (matchesKeyword) {
        for (const item of cuisine.dishes) {
          const keyNorm = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!seenDishKeys.has(keyNorm)) {
            seenDishKeys.add(keyNorm);
            collectedDishes.push({
              ...item,
              category: item.category || inferDishCategory(item.name, item.description),
              is_veg: item.is_veg !== undefined ? item.is_veg : (isDishVeg(item.name) ? 1 : 0)
            });
          }
        }
        break;
      }
    }
  }

  // 3. Universal curated culinary fallback so users are NEVER left without dishes
  if (collectedDishes.length === 0) {
    const isStrictVegFallback = isPureVegRestaurantName(restNameLower) || restaurant.is_veg === 1;
    const universalFallbacks: DishTemplate[] = [
      {
        name: "Special Masala Taak (Cooling Buttermilk)",
        description: "Refreshing churned spiced yogurt cooler seasoned with roasted cumin, ginger, coriander, and rock salt.",
        price: 35,
        image: "/images/food/masala_taak.jpg",
        popularity: 100,
        rating: 5.0,
        category: "Beverages",
        is_veg: 1
      },
      {
        name: "Special Signature Thali Platter",
        description: "Grand traditional platter with fresh rotis, signature curries, dal, steamed rice, papad, pickle & sweet.",
        price: 240,
        image: "/images/food/thali.jpg",
        popularity: 99,
        rating: 5.0,
        category: "Thalis & Combos",
        is_veg: 1
      },
      {
        name: isStrictVegFallback ? "Extra Butter Pav Bhaji" : "Shahi Dum Biryani with Raita",
        description: isStrictVegFallback
          ? "Rich spiced mashed vegetable bhaji drenched in pure butter with toasted ladi pavs."
          : "Fragrant long-grain basmati rice layered with rich spices, saffron, and tender morsels.",
        price: isStrictVegFallback ? 160 : 260,
        image: isStrictVegFallback ? "/images/food/pav_bhaji.jpg" : "/images/food/biryani.jpg",
        popularity: 98,
        rating: 4.9,
        category: isStrictVegFallback ? "Street Food" : "Rice & Biryani",
        is_veg: isStrictVegFallback ? 1 : 0
      },
      {
        name: "Crispy Butter Masala Dosa",
        description: "Thin crisp golden fermented crepe folded over spiced potato filling, served with sambar and coconut chutney.",
        price: 130,
        image: "/images/food/dosa.jpg",
        popularity: 97,
        rating: 4.9,
        category: "South Indian",
        is_veg: 1
      }
    ];

    for (const item of universalFallbacks) {
      collectedDishes.push({
        ...item,
        category: item.category || inferDishCategory(item.name, item.description),
        is_veg: item.is_veg !== undefined ? item.is_veg : (isDishVeg(item.name) ? 1 : 0)
      });
    }
  }

  const isStrictVeg = isPureVegRestaurantName(restNameLower) ||
    isPureVegRestaurantName(restaurant.name) ||
    restNameLower.includes('wadewale') ||
    restNameLower.includes('wade wale') ||
    restNameLower.includes('vada pav') ||
    restNameLower.includes('vadapav') ||
    restNameLower.includes('wada') ||
    restNameLower.includes('shaniwar peth') ||
    restNameLower.includes('pure veg') ||
    (restNameLower.includes('veg') && !restNameLower.includes('non')) ||
    restaurant.is_veg === 1;

  let finalDishes = collectedDishes;
  if (isStrictVeg || restaurant.is_veg === 1 || isPureVegRestaurantName(restaurant.name)) {
    finalDishes = finalDishes.filter(d => isDishVeg(d.name) && d.is_veg !== 0);
  }


  // 5. Return authentic dishes with verified categories, real names, and pure food visual assets
  // Ensure the top 3 items have top ratings (5.0, 4.95, 4.9) and is_recommended: 1 so Frame 3 features them on top cards!
  return finalDishes.map((item, idx) => {
    const dishName = item.name.trim();
    const cat = item.category || inferDishCategory(dishName, item.description);
    const vegVal = item.is_veg !== undefined ? item.is_veg : (isDishVeg(dishName) ? 1 : 0);

    const imgParam = item.image && (item.image.startsWith('http://') || item.image.startsWith('https://')) && (item.image.includes('swiggy.com') || item.image.includes('cloudinary.com'))
      ? `&imgUrl=${encodeURIComponent(item.image)}`
      : '';
    const aiFoodPngUrl = withBasePath(`/api/ai/dish-image?dish=${encodeURIComponent(dishName)}&restaurant=${encodeURIComponent(restaurant.name)}${imgParam}&v=v57`);

    const dynamicRating = idx === 0 ? 5.0 : idx === 1 ? 4.95 : idx === 2 ? 4.9 : (item.rating || 4.7);
    const dynamicPopularity = idx < 3 ? (100 - idx) : (item.popularity || 90);

    return {
      id: restaurant.id * 100 + idx + 1,
      restaurant_id: restaurant.id,
      name: dishName,
      description: item.description,
      price: item.price,
      image: aiFoodPngUrl,
      rating: dynamicRating,
      popularity: dynamicPopularity,
      is_recommended: idx < 3 ? 1 : 0,
      is_veg: vegVal,
      category: cat,
      status: 'active' as const
    };
  });
}

