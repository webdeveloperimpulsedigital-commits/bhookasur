/**
 * Zomato Menu Card Photo Scraper
 * -------------------------------------------------------------
 * When a restaurant has NO online delivery option on Zomato/Swiggy
 * (e.g. dine-in only establishments, heritage food places, dhabas),
 * this scraper targets the restaurant's Zomato "/menu" page and extracts
 * the authentic photographed menu card image URLs hosted on Zomato CDN (b.zmtcdn.com).
 */

import { extractCleanBrandName, ICONIC_ZOMATO_RESTAURANTS, discoverZomatoOrderUrlsFromSearch } from './zomatoEngine';

// In-memory cache for menu card image URLs (24 hour TTL)
const menuCardCache = new Map<string, { timestamp: number; images: string[] }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function fetchZomatoMenuCardImages(
  restaurantName: string,
  city = 'pune',
  area = '',
  zomatoUrl?: string
): Promise<string[]> {
  if (!restaurantName || restaurantName.trim().length < 2) return [];

  const cleanBrand = extractCleanBrandName(restaurantName);
  const cacheKey = `${cleanBrand.toLowerCase()}_${city.toLowerCase()}_${area.toLowerCase()}`;

  const cached = menuCardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.images;
  }

  const candidateMenuUrls: string[] = [];

  // 1. If explicit URL provided, convert /order or /info to /menu
  if (zomatoUrl) {
    const converted = zomatoUrl
      .replace(/\/order(\?.*)?$/i, '/menu')
      .replace(/\/info(\?.*)?$/i, '/menu')
      .replace(/\/photos(\?.*)?$/i, '/menu');
    candidateMenuUrls.push(converted.endsWith('/menu') ? converted : `${converted.replace(/\/+$/, '')}/menu`);
  }

  // 2. Check iconic registry
  const normName = restaurantName.toLowerCase().trim();
  const normClean = cleanBrand.toLowerCase().trim();
  const iconic = ICONIC_ZOMATO_RESTAURANTS.find(item => {
    const itemNorm = item.name.toLowerCase().trim();
    if (normName.includes(itemNorm) || itemNorm.includes(normName) || normClean.includes(itemNorm) || itemNorm.includes(normClean)) return true;
    return (item.aliases || []).some(a => normName.includes(a) || a.includes(normName) || normClean.includes(a) || a.includes(normClean));
  });

  if (iconic) {
    candidateMenuUrls.push(`https://www.zomato.com/${iconic.city.toLowerCase()}/${iconic.zomato_slug}/menu`);
  }

  // 3. Fallback: discover from Zomato search
  if (candidateMenuUrls.length === 0) {
    try {
      const orderUrls = await discoverZomatoOrderUrlsFromSearch(restaurantName, city, area);
      for (const u of orderUrls.slice(0, 2)) {
        const menuU = u.replace(/\/order(\?.*)?$/i, '/menu');
        if (!candidateMenuUrls.includes(menuU)) {
          candidateMenuUrls.push(menuU);
        }
      }
    } catch {
      // discovery skip
    }
  }

  // Attempt to fetch from candidate URLs
  for (const menuUrl of candidateMenuUrls.slice(0, 3)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(menuUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://www.zomato.com/'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const html = await res.text();

      // Extract menu images matching Zomato CDN pattern
      // e.g. https://b.zmtcdn.com/data/menus/123/456/abc.jpg or similar
      const menuImageRegex = /https:\/\/(?:b|res)\.zmtcdn\.com\/data\/menus\/[a-zA-Z0-9/_.\-]+\.(?:jpg|jpeg|png|webp)/gi;
      const matches = html.match(menuImageRegex) || [];

      // Filter and deduplicate unique high-res menu pages
      const uniqueImages = Array.from(new Set(matches)).filter(url => {
        // Exclude tiny thumbnails if full-res is available
        return !url.includes('_thumb.') && !url.includes('thumb_');
      });

      if (uniqueImages.length > 0) {
        // Keep top 2 clearest menu pages to keep OCR fast and token-efficient
        const finalImages = uniqueImages.slice(0, 2);
        menuCardCache.set(cacheKey, { timestamp: Date.now(), images: finalImages });
        return finalImages;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Zomato menu card scraper notice for ${menuUrl}:`, msg);
    }
  }

  return [];
}
