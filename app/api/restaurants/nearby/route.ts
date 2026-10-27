import { NextResponse } from 'next/server';
import { CITY_COORDINATES } from '@/lib/apifySwiggy';
import { fetchVerifiedNearbyRestaurants } from '@/lib/verifiedRestaurants';

export const dynamic = 'force-dynamic';

/**
 * Nearby restaurants (strict verified mode).
 * Returns only Swiggy-verified restaurants closest to the given coordinates.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = parseFloat(searchParams.get('latitude') || searchParams.get('lat') || '');
    const lngParam = parseFloat(searchParams.get('longitude') || searchParams.get('lng') || '');
    const city = (searchParams.get('city') || '').trim().toLowerCase();
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '5', 10) || 5, 1), 15);

    let targetLat = latParam;
    let targetLng = lngParam;
    if (isNaN(targetLat) || isNaN(targetLng)) {
      const cityCoords = CITY_COORDINATES[city];
      if (!cityCoords) {
        return NextResponse.json({ success: true, count: 0, isLiveAPI: true, verification: 'swiggy_strict', data: [] });
      }
      targetLat = cityCoords.lat;
      targetLng = cityCoords.lng;
    }

    const restaurants = await fetchVerifiedNearbyRestaurants(targetLat, targetLng, limit);

    return NextResponse.json({
      success: true,
      count: restaurants.length,
      isLiveAPI: true,
      verification: 'swiggy_strict',
      data: restaurants
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch nearby restaurants';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
