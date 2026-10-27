/**
 * Google Gemini AI Restaurant Menu Generator & Vision OCR Engine
 * -------------------------------------------------------------
 * When a restaurant does not have active online ordering on Swiggy or Zomato
 * (e.g., dine-in only establishments, iconic heritage eateries, dhabas, sweet marts):
 *
 * Tier 1: Scrapes authentic photographed menu card images from the restaurant's
 *         Zomato /menu page and uses Gemini 1.5 Flash Vision OCR to extract the exact
 *         dishes and prices printed on the physical menu card.
 *
 * Tier 2: If no menu card photo is available or the scraper is rate-limited, it falls
 *         back to Gemini's deep culinary knowledge to curate the authentic signature dishes.
 *
 * Results are cached in memory and saved to the MySQL database for instantaneous (5ms)
 * retrieval on subsequent visits.
 */

import type { Dish } from './db';
import { db } from './db';
import { formatCleanDishName, isDishVeg } from './dishAssets';
import { getDishVisualAssets } from './dishAssets';
import { inferDishCategory } from './liveMenu';
import { fetchZomatoMenuCardImages } from './zomatoMenuCardScraper';

interface GeminiMenuOptions {
  restaurantId: number | string;
  restaurantName: string;
  area?: string;
  city?: string;
  isVeg?: boolean;
  cuisines?: string[];
  zomatoUrl?: string;
}

interface RawGeminiDish {
  name: string;
  price?: number;
  category?: string;
  is_veg?: number | boolean;
  description?: string;
}

// In-memory cache for Gemini-generated menus (24 hour TTL)
const geminiMenuCache = new Map<string, { timestamp: number; dishes: Dish[]; source: string }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function saveDishesToDbAsync(dishes: Dish[]) {
  if (!dishes || dishes.length === 0) return;
  Promise.resolve().then(async () => {
    try {
      const restId = dishes[0].restaurant_id;
      const existing = await db.getRestaurantById(restId).catch(() => null);
      if (!existing) return;

      for (const dish of dishes.slice(0, 12)) {
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

const GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

async function callGeminiGenerateContent(
  contents: unknown[],
  geminiKey: string,
  timeoutMs = 15000
): Promise<string | null> {
  const trimmedKey = geminiKey.trim();
  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.15,
            responseMimeType: 'application/json'
          }
        }),
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[Gemini] model ${model} HTTP ${response.status}: ${errText.slice(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText && typeof rawText === 'string' && rawText.trim().length > 0) {
        return rawText.trim();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini] model ${model} error:`, msg);
    }
  }
  return null;
}

/**
 * Uses Google Gemini Vision to perform multimodal OCR on photographed menu cards
 */
async function extractDishesFromMenuCardImages(
  imageUrls: string[],
  restaurantName: string,
  restaurantId: number | string,
  geminiKey: string,
  isVeg = false
): Promise<Dish[]> {
  for (const imgUrl of imageUrls.slice(0, 2)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const imgRes = await fetch(imgUrl, {
        headers: {
          Referer: 'https://www.zomato.com/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!imgRes.ok) continue;

      const arrayBuffer = await imgRes.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      const rawContentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const contentType = rawContentType.split(';')[0].trim() || 'image/jpeg';

      const prompt = `You are an expert OCR transcription engine specializing in Indian restaurant menus.
This image is an authentic photographed menu card from "${restaurantName}".
Read every legible dish name, printed price in INR, and section category visible in this photo.
Identify whether each item is vegetarian (is_veg = 1) or non-vegetarian (is_veg = 0).

Return ONLY a valid JSON array of objects with the schema:
[
  {
    "name": "Exact Dish Name as printed on the card",
    "price": 180,
    "category": "Main Course" | "Breakfast" | "Snacks" | "Desserts" | "Beverages" | "Thali",
    "is_veg": 1,
    "description": "Appetizing 1-sentence description"
  }
]
Return strictly the JSON array, no markdown backticks, no other text.`;

      const contents = [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: contentType,
                data: base64Data
              }
            }
          ]
        }
      ];

      const rawText = await callGeminiGenerateContent(contents, geminiKey, 18000);
      if (!rawText) continue;

      let parsed: RawGeminiDish[] = [];
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
        parsed = JSON.parse(cleaned);
      }

      if (Array.isArray(parsed) && parsed.length >= 3) {
        const numRestId = typeof restaurantId === 'number' ? restaurantId : parseInt(String(restaurantId), 10) || 850000;
        return parsed.map((item, index) => {
          const cleanDishName = formatCleanDishName(item.name, restaurantName);
          const isVegFlag = item.is_veg === 0 || item.is_veg === false ? 0 : (item.is_veg === 1 || item.is_veg === true ? 1 : (isDishVeg(cleanDishName) ? 1 : 0));
          const visual = getDishVisualAssets(cleanDishName, undefined, restaurantName);

          return {
            id: numRestId * 100 + (index + 1),
            restaurant_id: numRestId,
            name: cleanDishName,
            description: item.description || `Signature ${cleanDishName} prepared fresh at ${restaurantName}.`,
            price: typeof item.price === 'number' && item.price > 0 ? item.price : 180,
            category: item.category || inferDishCategory(cleanDishName, item.description),
            image: visual.flyingImage || visual.plateImage,
            flying_image: visual.flyingImage,
            is_veg: isVeg ? 1 : isVegFlag,
            rating: 4.7 + (index % 3) * 0.1,
            popularity: 95 - index,
            is_recommended: index < 3 ? 1 : 0,
            status: 'active'
          };
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Gemini Vision menu card OCR notice for ${restaurantName}:`, msg);
    }
  }
  return [];
}

export async function fetchGeminiDishesForRestaurant(options: GeminiMenuOptions): Promise<{ dishes: Dish[]; source: string }> {
  const { restaurantId, restaurantName, area = '', city = '', isVeg = false, cuisines = [], zomatoUrl } = options;

  if (!restaurantName || restaurantName.trim().length < 2) {
    return { dishes: [], source: 'none' };
  }

  const cleanName = restaurantName.trim();
  const cacheKey = `${cleanName.toLowerCase()}_${city.toLowerCase()}_${area.toLowerCase()}`;

  // 1. Check in-memory cache
  const cached = geminiMenuCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { dishes: cached.dishes, source: cached.source };
  }

  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_KEY;

  if (!geminiKey || geminiKey.trim().length < 10) {
    return { dishes: [], source: 'none' };
  }

  // =========================================================================
  // TIER 1: Real-World Zomato Menu Card Photo Scraping + Gemini Vision OCR
  // =========================================================================
  try {
    const menuCardImages = await fetchZomatoMenuCardImages(cleanName, city, area, zomatoUrl);
    if (menuCardImages && menuCardImages.length > 0) {
      const ocrDishes = await extractDishesFromMenuCardImages(
        menuCardImages,
        cleanName,
        restaurantId,
        geminiKey,
        isVeg
      );

      if (ocrDishes && ocrDishes.length >= 3) {
        geminiMenuCache.set(cacheKey, { timestamp: Date.now(), dishes: ocrDishes, source: 'zomato_menu_card_ocr' });
        saveDishesToDbAsync(ocrDishes);
        return { dishes: ocrDishes, source: 'zomato_menu_card_ocr' };
      }
    }
  } catch (ocrErr) {
    console.warn(`Zomato menu card OCR step skipped for "${cleanName}":`, ocrErr);
  }

  // =========================================================================
  // TIER 2: Gemini Generative Culinary Intelligence Fallback
  // =========================================================================
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
    const contents = [
      {
        parts: [{ text: prompt }]
      }
    ];

    const rawText = await callGeminiGenerateContent(contents, geminiKey, 8000);
    if (!rawText) return { dishes: [], source: 'none' };

    let rawDishes: RawGeminiDish[] = [];
    try {
      rawDishes = JSON.parse(rawText);
    } catch {
      // Fallback in case of markdown wrapping
      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      rawDishes = JSON.parse(cleaned);
    }

    if (!Array.isArray(rawDishes) || rawDishes.length === 0) {
      return { dishes: [], source: 'none' };
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
    geminiMenuCache.set(cacheKey, { timestamp: Date.now(), dishes: formattedDishes, source: 'gemini_ai_menu' });
    saveDishesToDbAsync(formattedDishes);

    return { dishes: formattedDishes, source: 'gemini_ai_menu' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Gemini menu generation error for "${cleanName}":`, msg);
    return { dishes: [], source: 'none' };
  }
}
