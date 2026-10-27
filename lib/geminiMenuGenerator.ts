/**
 * Google Gemini AI Restaurant Menu Generator
 * -------------------------------------------------------------
 * When a restaurant does not have active online ordering on Swiggy or Zomato
 * (e.g., dine-in only establishments, iconic heritage eateries, dhabas, sweet marts),
 * this engine uses Google Gemini 1.5 Flash to automatically discover and construct
 * its authentic signature menu, pricing, and dietary classification.
 *
 * Results are cached in memory and saved to the MySQL database for instantaneous (5ms)
 * retrieval on subsequent visits.
 */

import type { Dish } from './db';
import { db } from './db';
import { formatCleanDishName, isDishVeg } from './dishAssets';
import { getDishVisualAssets } from './dishAssets';
import { inferDishCategory } from './liveMenu';

interface GeminiMenuOptions {
  restaurantId: number | string;
  restaurantName: string;
  area?: string;
  city?: string;
  isVeg?: boolean;
  cuisines?: string[];
}

interface RawGeminiDish {
  name: string;
  price?: number;
  category?: string;
  is_veg?: number | boolean;
  description?: string;
}

// In-memory cache for Gemini-generated menus (24 hour TTL)
const geminiMenuCache = new Map<string, { timestamp: number; dishes: Dish[] }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function fetchGeminiDishesForRestaurant(options: GeminiMenuOptions): Promise<Dish[]> {
  const { restaurantId, restaurantName, area = '', city = '', isVeg = false, cuisines = [] } = options;

  if (!restaurantName || restaurantName.trim().length < 2) {
    return [];
  }

  const cleanName = restaurantName.trim();
  const cacheKey = `${cleanName.toLowerCase()}_${city.toLowerCase()}_${area.toLowerCase()}`;

  // 1. Check in-memory cache
  const cached = geminiMenuCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.dishes;
  }

  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_KEY;

  if (!geminiKey || geminiKey.trim().length < 10) {
    return [];
  }

  const prompt = `You are an expert Indian culinary researcher and restaurant directory curator.
A user is visiting this restaurant in India:
Restaurant Name: "${cleanName}"
Location: "${area ? `${area}, ` : ''}${city || 'India'}"
${cuisines.length > 0 ? `Cuisines: "${cuisines.join(', ')}"` : ''}
Vegetarian Policy: ${isVeg ? 'STRICTLY 100% PURE VEGETARIAN ONLY (No eggs, no meat, no poultry, no seafood)' : 'Serves both Vegetarian and Non-Vegetarian dishes'}

Task:
1. If this is a known, famous, iconic, or heritage eatery (for example: Vaishali, Chitale Bandhu, Bedekar Tea Stall, Bademiya, Karim's, Kayani Bakery, Cafe Goodluck, Leopold Cafe, Mavalli Tiffin Room, etc.), provide their REAL-WORLD iconic and signature dishes that people actually order there with realistic INR pricing.
2. If this is a local neighborhood restaurant, dhaba, or sweet shop, curate 10 to 14 authentic, realistic specialty dishes commonly served there based on its name, cuisine style, and region.

Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "name": "Exact Dish Name (e.g. Special Masala Dosa, Puneri Misal Pav, Butter Chicken)",
    "category": "Main Course" | "Breakfast" | "Snacks" | "Desserts" | "Beverages" | "Thali",
    "price": 180,
    "is_veg": 1,
    "description": "Appetizing 1-sentence description highlighting fresh ingredients or taste"
  }
]
No markdown wrapping, no explanation, return strictly the JSON array.`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`Gemini menu generation returned HTTP ${response.status}: ${errText.slice(0, 150)}`);
      return [];
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return [];

    let rawDishes: RawGeminiDish[] = [];
    try {
      rawDishes = JSON.parse(rawText);
    } catch {
      // Fallback in case of markdown wrapping
      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      rawDishes = JSON.parse(cleaned);
    }

    if (!Array.isArray(rawDishes) || rawDishes.length === 0) {
      return [];
    }

    const numRestId = typeof restaurantId === 'number' ? restaurantId : parseInt(String(restaurantId), 10) || 850000;

    const formattedDishes: Dish[] = rawDishes.map((item, index) => {
      const cleanDishName = formatCleanDishName(item.name, cleanName);
      const isVegFlag = item.is_veg === 0 || item.is_veg === false ? 0 : (item.is_veg === 1 || item.is_veg === true ? 1 : (isDishVeg(cleanDishName) ? 1 : 0));
      const visual = getDishVisualAssets(cleanDishName, undefined, cleanName);

      return {
        id: numRestId * 100 + (index + 1),
        restaurant_id: numRestId,
        name: cleanDishName,
        description: item.description || `Signature ${cleanDishName} prepared fresh at ${cleanName}.`,
        price: typeof item.price === 'number' && item.price > 0 ? item.price : 180,
        category: item.category || inferDishCategory(cleanDishName, item.description),
        image: visual.flyingImage || visual.plateImage,
        flying_image: visual.flyingImage,
        is_veg: isVeg ? 1 : isVegFlag,
        rating: 4.6 + (index % 3) * 0.1,
        popularity: 92 - index,
        is_recommended: index < 3 ? 1 : 0,
        status: 'active'
      };
    });

    // Cache in-memory
    geminiMenuCache.set(cacheKey, { timestamp: Date.now(), dishes: formattedDishes });

    // Asynchronously cache to database without blocking response
    if (typeof numRestId === 'number' && !isNaN(numRestId) && formattedDishes.length > 0) {
      Promise.resolve().then(async () => {
        try {
          for (const dish of formattedDishes.slice(0, 10)) {
            await db.createDish({
              restaurant_id: dish.restaurant_id,
              name: dish.name,
              description: dish.description,
              price: dish.price,
              image: dish.image,
              rating: dish.rating,
              popularity: dish.popularity,
              is_recommended: dish.is_recommended,
              status: 'active'
            }).catch(() => {});
          }
        } catch {
          // ignore async DB cache notice
        }
      });
    }

    return formattedDishes;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Gemini menu generation error for "${cleanName}":`, msg);
    return [];
  }
}
