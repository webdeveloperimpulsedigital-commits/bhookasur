/**
 * Online AI & Real-Time Culinary Dish Image Generator
 * --------------------------------------------------------------------------
 * Generates or fetches authentic, dish-relevant food images on-demand whenever
 * a user searches/types any dish or when a dish does not have a local photo.
 *
 * Tier 1: Local Persistent Disk Cache (public/images/food/generated/) - 0ms
 * Tier 2: Real-Time Web Culinary Photography Search (Exact dish match) - ~500ms
 * Tier 3: Online Wikimedia Commons Culinary API (Exact dish match)
 * Tier 4: Google Gemini Imagen 3 (imagen-3.0-generate-002) via GEMINI_API_KEY
 *
 * All fetched/generated images are cached permanently to public/images/food/generated/
 * so they load in 0ms on subsequent requests.
 */

import fs from 'fs';
import path from 'path';

const GENERATED_DIR = path.join(process.cwd(), 'public', 'images', 'food', 'generated');

// Ensure output directory exists at module load
try {
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }
} catch {
  // directory may already exist
}

function sanitizeDishSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

/**
 * Generate or fetch an authentic dish image online for ANY dish name
 */
export async function generateDishImageOnline(
  dishName: string,
  restaurantName?: string
): Promise<Buffer | null> {
  const cleanName = dishName.trim();
  if (!cleanName || cleanName.length < 2) return null;

  const slug = sanitizeDishSlug(cleanName);
  const cachedJpg = path.join(GENERATED_DIR, `${slug}.jpg`);
  const cachedWebp = path.join(GENERATED_DIR, `${slug}.webp`);

  // 1. Check local persistent disk cache (0ms)
  if (fs.existsSync(cachedWebp)) {
    try {
      return await fs.promises.readFile(cachedWebp);
    } catch {
      // proceed
    }
  }
  if (fs.existsSync(cachedJpg)) {
    try {
      return await fs.promises.readFile(cachedJpg);
    } catch {
      // proceed
    }
  }

  // 2. Tier 1: Real-Time Web Culinary Photography Search (Exact dish match in ~500ms)
  try {
    const webBuffer = await fetchLiveWebDishPhoto(cleanName);
    if (webBuffer) {
      await fs.promises.writeFile(cachedJpg, webBuffer).catch(() => {});
      return webBuffer;
    }
  } catch (webErr: any) {
    console.warn(`Live web dish photo notice for "${cleanName}":`, webErr?.message || webErr);
  }

  // 3. Tier 2: Real-time Online Wikimedia Commons Search (Authentic culinary match)
  try {
    const wikiBuffer = await fetchWikimediaDishPhoto(cleanName);
    if (wikiBuffer) {
      await fs.promises.writeFile(cachedJpg, wikiBuffer).catch(() => {});
      return wikiBuffer;
    }
  } catch (wikiErr: any) {
    console.warn(`Wikimedia online search notice for "${cleanName}":`, wikiErr?.message || wikiErr);
  }

  // 4. Tier 3: Google Gemini Imagen 3 (imagen-3.0-generate-002)
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_KEY;

  if (geminiKey && geminiKey.trim().length > 10) {
    try {
      const isThali = cleanName.toLowerCase().includes('thali');
      const prompt = `Top-down culinary studio photograph of authentic restaurant dish '${cleanName}'${
        restaurantName ? ` from '${restaurantName}'` : ''
      }, served on a clean plate, garnished with fresh herbs, photorealistic, sharp focus, 4k food photography, vibrant appetizing colors, pure isolated food presentation${
        isThali ? '' : ', strictly no thali platter'
      }.`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey.trim()}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            outputMimeType: 'image/jpeg'
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const base64Bytes = json.predictions?.[0]?.bytesBase64Encoded;
        if (base64Bytes) {
          const buffer = Buffer.from(base64Bytes, 'base64');
          await fs.promises.writeFile(cachedJpg, buffer).catch(() => {});
          return buffer;
        }
      }
    } catch {
      // ignore Gemini error
    }
  }

  return null;
}

/**
 * Searches real-time culinary photography on the web for the exact dish typed by the user
 */
async function fetchLiveWebDishPhoto(dishName: string): Promise<Buffer | null> {
  const searchQuery = `${dishName} Indian food dish plate photography`;
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}&form=HDRSC2&first=1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    // Extract both fast CDN thumbnail URLs (turl) and direct media URLs (murl)
    const candidateUrls: string[] = [];

    const turlMatches = html.matchAll(/turl&quot;:&quot;(https:\/\/[^&]+?)&quot;/gi);
    for (const match of turlMatches) {
      if (match[1]) {
        candidateUrls.push(match[1].replace(/&amp;/g, '&'));
      }
      if (candidateUrls.length >= 4) break;
    }

    const murlMatches = html.matchAll(/murl&quot;:&quot;(https:\/\/[^&]+?\.(?:jpg|jpeg|png|webp))&quot;/gi);
    for (const match of murlMatches) {
      if (match[1]) {
        candidateUrls.push(match[1].replace(/&amp;/g, '&'));
      }
      if (candidateUrls.length >= 8) break;
    }

    const downloadCandidate = async (imgUrl: string): Promise<Buffer> => {
      const imgController = new AbortController();
      const imgTimer = setTimeout(() => imgController.abort(), 2800);
      try {
        const imgRes = await fetch(imgUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
          },
          signal: imgController.signal
        });
        clearTimeout(imgTimer);
        if (!imgRes.ok) throw new Error('Non-200');
        const contentType = (imgRes.headers.get('content-type') || '').toLowerCase();
        if (!contentType.startsWith('image/') || contentType.includes('svg')) {
          throw new Error('Invalid content-type');
        }
        const arr = await imgRes.arrayBuffer();
        if (arr.byteLength < 4000) throw new Error('Too small');
        return Buffer.from(arr);
      } finally {
        clearTimeout(imgTimer);
      }
    };

    if (candidateUrls.length > 0) {
      try {
        return await Promise.any(candidateUrls.slice(0, 4).map(downloadCandidate));
      } catch {
        // Fallback to remaining candidates if first batch failed
        if (candidateUrls.length > 4) {
          try {
            return await Promise.any(candidateUrls.slice(4, 8).map(downloadCandidate));
          } catch {
            // proceed
          }
        }
      }
    }
  } catch {
    clearTimeout(timeout);
  }

  return null;
}

/**
 * Searches Wikimedia Commons for authentic creative commons food photography
 * matching the dish name.
 */
async function fetchWikimediaDishPhoto(dishName: string): Promise<Buffer | null> {
  const query = `${dishName} food dish`;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&format=json&gsrlimit=5`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'BakasurFoodTour/3.0 (https://bakasur-food-tour.internal; culinary-engine)'
    },
    signal: controller.signal
  });
  clearTimeout(timeout);

  if (!res.ok) return null;
  const data = await res.json();
  const pages = data?.query?.pages || {};

  const lowerDish = dishName.toLowerCase();
  const keywords = lowerDish.split(/\s+/).filter(w => w.length >= 3 && !['special', 'plate', 'dish', 'curry'].includes(w));

  for (const pageId of Object.keys(pages)) {
    const page = pages[pageId];
    const title = (page.title || '').toLowerCase();
    const info = page.imageinfo?.[0];
    const imgUrl = info?.url;
    const mime = (info?.mime || '').toLowerCase();

    // Skip SVGs, PDFs, maps, logos, flags, icons
    if (!imgUrl || !mime.startsWith('image/') || mime.includes('svg') || title.includes('map') || title.includes('flag') || title.includes('logo')) {
      continue;
    }

    // Verify image title relates to the dish name
    const hasKeyword = keywords.length === 0 || keywords.some(k => title.includes(k));
    if (!hasKeyword) continue;

    // Fetch the image binary
    const imgController = new AbortController();
    const imgTimeout = setTimeout(() => imgController.abort(), 5000);
    const imgRes = await fetch(imgUrl, {
      headers: {
        'User-Agent': 'BakasurFoodTour/3.0'
      },
      signal: imgController.signal
    });
    clearTimeout(imgTimeout);

    if (imgRes.ok) {
      const arr = await imgRes.arrayBuffer();
      if (arr.byteLength > 8000) {
        return Buffer.from(arr);
      }
    }
  }

  return null;
}
