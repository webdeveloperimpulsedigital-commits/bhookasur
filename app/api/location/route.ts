import { NextResponse } from 'next/server';
import { PUNE_AREAS, AreaInfo, calculateDistanceKm } from '@/lib/areas';
import { fetchLocationFromIP } from '@/lib/ipLocation';

export const dynamic = 'force-dynamic';

const POPULAR_CITIES = [
  { name: "Pune", state: "Maharashtra", latitude: 18.5204, longitude: 73.8407, popularSpots: 35, description: "Cultural capital of Maharashtra, home of Vaishali, SPDP & Misal" },
  { name: "Mumbai", state: "Maharashtra", latitude: 18.9222, longitude: 72.8317, popularSpots: 42, description: "City of dreams, Leopold Cafe, Vada Pav & Irani Chai" },
  { name: "Delhi", state: "NCR-Delhi", latitude: 28.6507, longitude: 77.2334, popularSpots: 38, description: "Capital of flavours, Karim's & Chandni Chowk street food" },
  { name: "Bengaluru", state: "Karnataka", latitude: 12.9452, longitude: 77.5704, popularSpots: 31, description: "Silicon City, Vidyarthi Bhavan Crispy Dosas & Filter Kaapi" },
  { name: "Hyderabad", state: "Telangana", latitude: 17.4416, longitude: 78.4983, popularSpots: 35, description: "City of Pearls & Nizami Dum Biryani" },
  { name: "Kolkata", state: "West Bengal", latitude: 22.5528, longitude: 88.3533, popularSpots: 28, description: "City of Joy, Peter Cat Chelo Kebabs & Kathi Rolls" },
  { name: "Lucknow", state: "Uttar Pradesh", latitude: 26.8467, longitude: 80.9462, popularSpots: 19, description: "City of Nawabs, Tunday Kebabs & Royal Awadhi Cuisine" },
  { name: "Indore", state: "Madhya Pradesh", latitude: 22.7196, longitude: 75.8577, popularSpots: 24, description: "Street food capital, Sarafa Bazaar & 56 Dukan" },
  { name: "Jaipur", state: "Rajasthan", latitude: 26.9124, longitude: 75.7873, popularSpots: 22, description: "Pink City, Rawat Pyaaz Kachori & LMB" },
  { name: "Ahmedabad", state: "Gujarat", latitude: 23.0225, longitude: 72.5714, popularSpots: 25, description: "Food lover's haven, Manek Chowk & Gujarati Thali" },
  { name: "Amritsar", state: "Punjab", latitude: 31.6340, longitude: 74.8723, popularSpots: 20, description: "Kulcha capital, Kesar Da Dhaba & Amritsari Kulcha" },
  { name: "Nashik", state: "Maharashtra", latitude: 19.9975, longitude: 73.7898, popularSpots: 18, description: "Misal capital, Sadhana Chulivarchi Misal" },
  { name: "Nagpur", state: "Maharashtra", latitude: 21.1458, longitude: 79.0882, popularSpots: 18, description: "Orange City, Tarri Poha & Saoji Chicken" },
  { name: "Chennai", state: "Tamil Nadu", latitude: 13.0827, longitude: 80.2707, popularSpots: 22, description: "Murugan Idli Shop & Filter Coffee" },
  { name: "Goa", state: "Goa", latitude: 15.2993, longitude: 74.1240, popularSpots: 20, description: "Beach shacks, Fish Curry Thali & Vindaloo" }
];

const geoCache = new Map<string, { sublocality?: string; city?: string; state?: string }>();

const CITY_ALIASES: Record<string, string> = {
  // Pune & Suburbs / Talukas
  'pune': 'Pune',
  'poona': 'Pune',
  'haveli': 'Pune',
  'pcmc': 'Pune',
  'pimpri': 'Pune',
  'chinchwad': 'Pune',
  'pimpri-chinchwad': 'Pune',
  'pune suburban': 'Pune',
  'pune city': 'Pune',
  'pune cantonment': 'Pune',
  'khadki': 'Pune',
  'kirkee': 'Pune',
  'kothrud': 'Pune',
  'baner': 'Pune',
  'wakad': 'Pune',
  'hinjewadi': 'Pune',
  'hinjawadi': 'Pune',
  'viman nagar': 'Pune',
  'koregaon park': 'Pune',
  'hadapsar': 'Pune',
  'kondhwa': 'Pune',
  'swargate': 'Pune',
  'katraj': 'Pune',
  'sinhagad': 'Pune',
  'sinhagad road': 'Pune',
  'dhayari': 'Pune',
  'narhe': 'Pune',
  'warje': 'Pune',
  'karve nagar': 'Pune',
  'aundh': 'Pune',
  'bavdhan': 'Pune',
  'deccan': 'Pune',
  'shivajinagar': 'Pune',
  'dhanori': 'Pune',
  'akurdi': 'Pune',
  'bhosari': 'Pune',
  'chakan': 'Pune',
  'wagholi': 'Pune',
  'nanded city': 'Pune',
  'nanded phata': 'Pune',

  // Mumbai & MMR
  'mumbai': 'Mumbai',
  'bombay': 'Mumbai',
  'navi mumbai': 'Mumbai',
  'thane': 'Mumbai',
  'kalyan': 'Mumbai',
  'dombivli': 'Mumbai',
  'mira bhayandar': 'Mumbai',
  'vasai': 'Mumbai',
  'virar': 'Mumbai',
  'andheri': 'Mumbai',
  'bandra': 'Mumbai',
  'borivali': 'Mumbai',
  'dadar': 'Mumbai',
  'kurla': 'Mumbai',
  'panvel': 'Mumbai',
  'vashi': 'Mumbai',

  // Delhi NCR
  'delhi': 'Delhi',
  'new delhi': 'Delhi',
  'ncr': 'Delhi',
  'noida': 'Delhi',
  'greater noida': 'Delhi',
  'gurugram': 'Delhi',
  'gurgaon': 'Delhi',
  'ghaziabad': 'Delhi',
  'faridabad': 'Delhi',

  // Bengaluru
  'bengaluru': 'Bengaluru',
  'bangalore': 'Bengaluru',
  'whitefield': 'Bengaluru',
  'koramangala': 'Bengaluru',
  'indiranagar': 'Bengaluru',
  'electronic city': 'Bengaluru',
  'hsr layout': 'Bengaluru',
  'jayanagar': 'Bengaluru',

  // Other Major Cities
  'hyderabad': 'Hyderabad',
  'secunderabad': 'Hyderabad',
  'kolkata': 'Kolkata',
  'calcutta': 'Kolkata',
  'howrah': 'Kolkata',
  'lucknow': 'Lucknow',
  'indore': 'Indore',
  'jaipur': 'Jaipur',
  'ahmedabad': 'Ahmedabad',
  'amritsar': 'Amritsar',
  'nashik': 'Nashik',
  'nagpur': 'Nagpur',
  'chennai': 'Chennai',
  'goa': 'Goa'
};

async function reverseGeocodeCoords(lat: number, lng: number): Promise<{ sublocality?: string; city?: string; state?: string } | null> {
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
  if (geoCache.has(cacheKey)) {
    return geoCache.get(cacheKey)!;
  }

  // 1. Try OSM Nominatim First (High granularity residential, suburb, neighbourhood)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'User-Agent': 'BakasurFoodTourApp/2.0' },
        signal: controller.signal
      }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const sublocality = addr.residential || addr.suburb || addr.neighbourhood || addr.quarter || addr.subdistrict || addr.village || addr.road;
      const city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district;
      if (sublocality || city) {
        const result = {
          sublocality,
          city,
          state: addr.state
        };
        geoCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {
    // Fallback to BigDataCloud
  }

  // 2. Fallback to BigDataCloud Client Reverse Geocode
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 500);
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(bdcUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const rawSub = data.locality || data.localityInfo?.administrative?.[3]?.name || data.localityInfo?.informative?.[0]?.name;
      const rawCity = data.city || data.principalSubdivision;

      // Clean generic administrative labels
      let sublocality = rawSub ? rawSub.replace(/ taluka| district| division| subdivision/gi, '').trim() : undefined;
      let city = rawCity ? rawCity.replace(/ taluka| district| division| subdivision/gi, '').trim() : undefined;

      const result = {
        sublocality,
        city,
        state: data.principalSubdivision
      };
      geoCache.set(cacheKey, result);
      return result;
    }
  } catch {
    // Return null
  }

  return null;
}

function matchCityByName(name?: string) {
  if (!name) return null;
  const clean = name.toLowerCase().trim();
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (clean === alias || clean.includes(alias) || alias.includes(clean)) {
      return POPULAR_CITIES.find(c => c.name.toLowerCase() === canonical.toLowerCase()) || null;
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let userLat = parseFloat(searchParams.get('lat') || searchParams.get('latitude') || '');
  let userLng = parseFloat(searchParams.get('lng') || searchParams.get('longitude') || '');
  const requestedCity = searchParams.get('city') || '';

  let hasGPS = !isNaN(userLat) && !isNaN(userLng);
  let detectionSource: 'gps' | 'city' = hasGPS ? 'gps' : 'city';

  // If GPS is not present and no city requested, try IP geolocation fallback
  if (!hasGPS && !requestedCity) {
    try {
      const forwarded = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const clientIp = forwarded ? forwarded.split(',')[0].trim() : realIp || undefined;
      const ipLoc = await fetchLocationFromIP(clientIp);
      if (ipLoc && typeof ipLoc.lat === 'number' && typeof ipLoc.lng === 'number') {
        userLat = ipLoc.lat;
        userLng = ipLoc.lng;
        hasGPS = true;
        detectionSource = 'gps';
      }
    } catch (e) {
      console.warn('IP geolocation fallback notice:', e);
    }
  }

  // If still no GPS and no requested city, return unlocated state
  if (!hasGPS && !requestedCity) {
    return NextResponse.json({
      success: true,
      detectionSource: 'none',
      hasGPS: false,
      hasCoords: false,
      userCoords: null,
      detectedCity: null,
      detectedArea: null,
      preciseSublocality: null,
      locationDisplay: '',
      areas: [],
      supportedCities: POPULAR_CITIES
    });
  }

  let effectiveLat = userLat;
  let effectiveLng = userLng;

  // If GPS is absent but user requested a city, resolve city coordinates
  if (!hasGPS && requestedCity) {
    const matchedCity = matchCityByName(requestedCity) || POPULAR_CITIES.find(c => c.name.toLowerCase() === requestedCity.toLowerCase());
    if (matchedCity) {
      effectiveLat = matchedCity.latitude;
      effectiveLng = matchedCity.longitude;
    }
  }

  const hasCoords = !isNaN(effectiveLat) && !isNaN(effectiveLng);
  let preciseSublocality: string | null = null;
  let detectedCity: typeof POPULAR_CITIES[0] | null = null;

  // 2. Match metropolitan center & sublocality
  if (hasCoords) {
    // Step A: Check Proximity to known metropolitan centers (Instant 0.01ms memory check)
    const PROXIMITY_RADIUS_KM: Record<string, number> = {
      'Pune': 45,
      'Mumbai': 50,
      'Delhi': 50,
      'Bengaluru': 40,
      'Hyderabad': 40,
      'Kolkata': 40,
      'Lucknow': 35,
      'Indore': 35,
      'Jaipur': 35,
      'Ahmedabad': 35,
      'Amritsar': 30,
      'Nashik': 35,
      'Nagpur': 35,
      'Chennai': 40,
      'Goa': 50
    };

    for (const city of POPULAR_CITIES) {
      const maxRadius = PROXIMITY_RADIUS_KM[city.name] || 35;
      const dist = calculateDistanceKm(effectiveLat, effectiveLng, city.latitude, city.longitude);
      if (dist <= maxRadius) {
        detectedCity = city;
        break;
      }
    }

    if (detectedCity?.name === 'Pune') {
      let closestArea: string | null = null;
      let minAreaDist = 6; // within 6km
      for (const a of PUNE_AREAS) {
        const d = calculateDistanceKm(effectiveLat, effectiveLng, a.latitude, a.longitude);
        if (d < minAreaDist) {
          minAreaDist = d;
          closestArea = a.name;
        }
      }
      if (closestArea) {
        preciseSublocality = closestArea;
      }
    }

    let geoInfo: { sublocality?: string; city?: string; state?: string } | null = null;
    if (!preciseSublocality || !detectedCity) {
      geoInfo = await reverseGeocodeCoords(effectiveLat, effectiveLng);
      if (geoInfo?.sublocality && !preciseSublocality) {
        preciseSublocality = geoInfo.sublocality;
      }
    }

    // Step B: If proximity didn't match, check aliases of returned city/sublocality/state
    if (!detectedCity) {
      const aliasMatch = 
        matchCityByName(geoInfo?.sublocality) || 
        matchCityByName(geoInfo?.city) || 
        matchCityByName(geoInfo?.state);

      if (aliasMatch) {
        detectedCity = aliasMatch;
      } else if (geoInfo?.city) {
        const cName = geoInfo?.city || 'Local Area';
        detectedCity = {
          name: cName,
          state: geoInfo?.state || 'India',
          latitude: effectiveLat,
          longitude: effectiveLng,
          popularSpots: 20,
          description: `Famous food joints in ${cName}`
        };
      }
    }

    // Step C: Fallback to closest popular city by absolute distance
    if (!detectedCity) {
      let minDistance = Infinity;
      for (const city of POPULAR_CITIES) {
        const dist = calculateDistanceKm(effectiveLat, effectiveLng, city.latitude, city.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          detectedCity = city;
        }
      }
    }
  }

  // 2. If user specifically requested a city, override detection
  if (requestedCity) {
    const match = matchCityByName(requestedCity) || POPULAR_CITIES.find(c => c.name.toLowerCase() === requestedCity.toLowerCase());
    if (match) detectedCity = match;
  }

  // 3. Fallback if still unresolved
  if (!detectedCity) {
    detectedCity = {
      name: requestedCity || 'Local Area',
      state: 'India',
      latitude: effectiveLat,
      longitude: effectiveLng,
      popularSpots: 10,
      description: 'Local Area'
    };
  }

  // Clean sublocality if it matches the city name
  if (preciseSublocality && preciseSublocality.toLowerCase() === detectedCity.name.toLowerCase()) {
    preciseSublocality = null;
  }

  // 4. Calculate Area / Locality Info
  let areasForCity: AreaInfo[] = [];
  let detectedArea: AreaInfo | null = null;

  if (detectedCity.name.toLowerCase() === 'pune') {
    areasForCity = PUNE_AREAS;
    if (hasCoords) {
      let minAreaDist = Infinity;
      const calculatedAreas = PUNE_AREAS.map(area => {
        const dist = calculateDistanceKm(effectiveLat, effectiveLng, area.latitude, area.longitude);
        if (dist < minAreaDist) {
          minAreaDist = dist;
          detectedArea = { ...area, distanceKm: dist };
        }
        return { ...area, distanceKm: dist };
      });

      // If reverse geocoding resolved an exact Pune sublocality (e.g. "Kothrud", "Baner", "Hinjewadi", "Shivane", "Dhayari", "Nanded Phata")
      if (preciseSublocality) {
        const matchingArea = PUNE_AREAS.find(a => 
          preciseSublocality!.toLowerCase().includes(a.name.toLowerCase()) || 
          a.name.toLowerCase().includes(preciseSublocality!.toLowerCase())
        );
        if (matchingArea) {
          detectedArea = {
            ...matchingArea,
            displayName: `${preciseSublocality}, Pune`,
            distanceKm: calculateDistanceKm(effectiveLat, effectiveLng, matchingArea.latitude, matchingArea.longitude)
          };
        } else if (detectedArea) {
          const baseArea = detectedArea as AreaInfo;
          detectedArea = {
            ...baseArea,
            displayName: `${preciseSublocality}, Pune`
          };
        }
      } else if (detectedArea) {
        preciseSublocality = (detectedArea as AreaInfo).name;
      }

      // Sort areas: place selected / closest at top
      areasForCity = calculatedAreas.sort((a, b) => {
        if (a.name === detectedArea?.name) return -1;
        if (b.name === detectedArea?.name) return 1;
        return (a.distanceKm || 0) - (b.distanceKm || 0);
      });
    } else {
      detectedArea = PUNE_AREAS[0];
      preciseSublocality = PUNE_AREAS[0].name;
    }
  } else {
    // For non-Pune cities (Mumbai, Delhi, Bangalore, etc.)
    detectedArea = {
      id: `${detectedCity.name.toLowerCase()}_center`,
      name: preciseSublocality || `${detectedCity.name} Center`,
      displayName: preciseSublocality ? `${preciseSublocality}, ${detectedCity.name}` : `${detectedCity.name}`,
      city: detectedCity.name,
      latitude: hasCoords ? effectiveLat : detectedCity.latitude,
      longitude: hasCoords ? effectiveLng : detectedCity.longitude,
      popularSpotsCount: detectedCity.popularSpots || 20,
      popularLandmarks: [`${detectedCity.name} Central`, "Famous Food Street"],
      description: detectedCity.description || `Iconic food hub of ${detectedCity.name}`,
      distanceKm: hasCoords ? calculateDistanceKm(effectiveLat, effectiveLng, detectedCity.latitude, detectedCity.longitude) : 0
    };
  }

  const locationDisplay = preciseSublocality
    ? `${preciseSublocality}, ${detectedCity.name}`
    : `${detectedCity.name}, ${detectedCity.state || 'India'}`;

  return NextResponse.json({
    success: true,
    detectionSource,
    hasGPS,
    hasCoords,
    userCoords: hasCoords ? { lat: effectiveLat, lng: effectiveLng } : null,
    detectedCity,
    detectedArea,
    preciseSublocality,
    locationDisplay,
    areas: areasForCity,
    supportedCities: POPULAR_CITIES
  });
}
