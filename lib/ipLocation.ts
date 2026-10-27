/**
 * Server-side & shared IP geolocation utility
 * Fetches accurate coordinates and location details from IP address
 */

export interface IpLocationResult {
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
  area?: string;
  queryIp?: string;
}

const ipLocationCache = new Map<string, { timestamp: number; data: IpLocationResult }>();
const IP_CACHE_TTL = 3600000; // 1 hour

export async function fetchLocationFromIP(clientIp?: string): Promise<IpLocationResult | null> {
  const cacheKey = clientIp || 'default_ip';
  const cached = ipLocationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < IP_CACHE_TTL) {
    return cached.data;
  }

  try {
    const isPublic = clientIp && 
      !clientIp.startsWith('127.') && 
      !clientIp.startsWith('192.168.') && 
      !clientIp.startsWith('10.') && 
      !clientIp.startsWith('172.') && 
      clientIp !== '::1' && 
      clientIp !== 'localhost';

    const url = isPublic 
      ? `http://ip-api.com/json/${clientIp}?fields=status,country,regionName,city,lat,lon,zip,query`
      : `http://ip-api.com/json/?fields=status,country,regionName,city,lat,lon,zip,query`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 700);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && typeof data.lat === 'number' && typeof data.lon === 'number') {
        const result: IpLocationResult = {
          lat: data.lat,
          lng: data.lon,
          city: data.city || '',
          state: data.regionName || '',
          country: data.country || 'India',
          queryIp: data.query
        };
        ipLocationCache.set(cacheKey, { timestamp: Date.now(), data: result });
        return result;
      }
    }
  } catch (err) {
    console.warn('IP geolocation notice:', err);
  }

  // Secondary fallback: ipwho.is
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.city || '',
          state: data.region || '',
          country: data.country || 'India',
          queryIp: data.ip
        };
      }
    }
  } catch {
    // Ignore fallback failure
  }

  return null;
}
