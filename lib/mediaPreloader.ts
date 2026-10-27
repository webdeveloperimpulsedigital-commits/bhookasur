/**
 * Bhookasur Campaign Media Preloader & Persistent Cache
 * High-performance media preloader that:
 * 1. Preloads upcoming animation frames in the background using idle time.
 * 2. Caches video blobs in memory and CacheStorage to prevent redundant downloads.
 * 3. Provides instant 0ms playback for transitions.
 * 4. Gracefully falls back if offline, low memory, or unsupported.
 */

import { withBasePath } from './basePath';

const CACHE_NAME = 'bhookasur-media-v3';
const blobUrlCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string | null>>();

// Frame to upcoming media dependencies map
export const FRAME_MEDIA_DEPENDENCIES: Record<number, string[]> = {
  1: [
    '/images/final-frames/2.mp4',
    '/images/final-frames/Bakasur-Pointing-Rightside.mp4',
    '/images/final-frames/3.mp4'
  ],
  2: [
    '/images/final-frames/3.mp4',
    '/images/final-frames/front-eat-video.mp4'
  ],
  3: [
    '/images/final-frames/front-eat-video.mp4',
    '/images/final-frames/5.mp4',
    '/images/final-frames/side-view-final.mp4?v=2'
  ],
  4: [
    '/images/final-frames/front-eat-video.mp4',
    '/images/final-frames/5.mp4'
  ],
  5: [
    '/images/final-frames/5.mp4',
    '/images/final-frames/Bhookasur-Food-Eating.mp4',
    '/images/final-frames/Acidity-and-Dakare.mp4'
  ],
  6: [
    '/images/final-frames/Acidity-and-Dakare.mp4',
    '/images/final-frames/Food-Around-Bhookasur.mp4',
    '/images/all-frames/Showing Love.mp4'
  ],
  7: [
    '/images/final-frames/Bhookasur-Drinking-Gastrium.mp4',
    '/images/final-frames/Bhookasur-Showing-Heart.mp4'
  ],
  8: [
    '/images/final-frames/Bhookasur-Drinking-Gastrium.mp4',
    '/images/final-frames/Bhookasur-Showing-Heart.mp4'
  ],
  9: [
    '/images/final-frames/Bhookasur-Showing-Heart.mp4',
    '/images/all-frames/Showing Love.mp4'
  ],
  10: [
    '/images/all-frames/Showing Love.mp4',
    '/images/final-frames/food-tour-pass-preview.jpg'
  ],
  11: [
    '/images/all-frames/Showing Love.mp4',
    '/images/all-frames/Thumbs Up.mp4'
  ],
  12: [
    '/images/all-frames/Thumbs Up.mp4'
  ],
  13: []
};

/**
 * Preloads a single media URL and stores in memory blob cache + CacheStorage.
 * Thread-safe and deduplicates in-flight requests.
 */
export async function preloadMedia(url: string): Promise<string | null> {
  if (typeof window === 'undefined' || !url) return null;

  // 1. Already cached in memory as Blob URL
  if (blobUrlCache.has(url)) {
    return blobUrlCache.get(url)!;
  }

  // 2. Already in-flight
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }

  const fetchPromise = (async () => {
    try {
      const resolvedFetchUrl = withBasePath(url);

      // Check CacheStorage first
      let cacheObj: Cache | null = null;
      if ('caches' in window) {
        try {
          cacheObj = await window.caches.open(CACHE_NAME);
          const cachedResponse = await cacheObj.match(resolvedFetchUrl);
          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            blobUrlCache.set(url, blobUrl);
            return blobUrl;
          }
        } catch {
          // CacheStorage error fallback
        }
      }

      // Fetch from network with idle/low priority
      const res = await fetch(resolvedFetchUrl, {
        mode: 'cors',
        headers: { 'Accept': 'video/mp4,video/*,image/*,*/*' }
      });

      if (!res.ok) return null;

      // Store clone in CacheStorage for future sessions
      if (cacheObj) {
        try {
          await cacheObj.put(resolvedFetchUrl, res.clone());
        } catch {
          // Ignore quota errors
        }
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrlCache.set(url, blobUrl);
      return blobUrl;
    } catch {
      return null;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Synchronous lookup for preloaded Blob URL. Returns preloaded Blob URL or original URL with BASE_PATH.
 */
export function getPreloadedUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  if (originalUrl.endsWith('.mp4') || originalUrl.includes('.mp4?')) {
    return withBasePath(originalUrl);
  }
  return blobUrlCache.get(originalUrl) || withBasePath(originalUrl);
}

/**
 * Preload all essential assets for upcoming frames sequentially without blocking UI.
 */
export function preloadUpcomingFrameMedia(currentFrameNumber: number): void {
  if (typeof window === 'undefined') return;

  const upcomingList = FRAME_MEDIA_DEPENDENCIES[currentFrameNumber];
  if (!upcomingList || upcomingList.length === 0) return;

  const schedulePreload = () => {
    // Process items with 1.2s delay between each to protect active streaming bandwidth
    let delay = 0;
    for (const url of upcomingList) {
      if (!blobUrlCache.has(url) && !inFlightRequests.has(url)) {
        setTimeout(() => {
          preloadMedia(url).catch(() => {});
        }, delay);
        delay += 1200;
      }
    }
  };

  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
      schedulePreload,
      { timeout: 3000 }
    );
  } else {
    setTimeout(schedulePreload, 800);
  }
}
