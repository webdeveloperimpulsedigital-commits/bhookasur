import { NextResponse } from 'next/server';
import { fetchLocationFromIP } from '@/lib/ipLocation';
import { parseSwiggyRestaurantUrl, CITY_COORDINATES } from '@/lib/apifySwiggy';
import { parseZomatoUrl, fetchZomatoRestaurantProfileByUrl } from '@/lib/zomatoEngine';
import { lookupGazetteer } from '@/lib/locationResolver';
import {
  fetchVerifiedNearbyRestaurants,
  verifySwiggyRestaurant,
  toVerifiedRestaurant
} from '@/lib/verifiedRestaurants';
import { searchRestaurantsAnywhere } from '@/lib/restaurantSearch';

export const dynamic = 'force-dynamic';

/**
 * Multi-Source Restaurant Search across Zomato, Swiggy, Google, and verified registry.
 *
 * - No query      -> verified restaurants nearest to the user.
 * - With a query  -> searches across Zomato, Swiggy, Google, and verified registry.
 * - Handles exclusive Zomato restaurants (e.g. Badshahi Boarding House),
 *   exclusive Swiggy restaurants, and Google discoveries.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('query') || '').trim();
    let city = (searchParams.get('city') || '').trim();
    const latParam = parseFloat(searchParams.get('lat') || searchParams.get('latitude') || '');
    const lngParam = parseFloat(searchParams.get('lng') || searchParams.get('longitude') || '');
    const hasExplicitCoords = !isNaN(latParam) && !isNaN(lngParam);

    let userCoords = hasExplicitCoords ? { lat: latParam, lng: lngParam } : null;

    // Resolve location from client IP if explicit coordinates or city are not provided
    if (!userCoords || !city) {
      try {
        const forwarded = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwarded ? forwarded.split(',')[0].trim() : realIp || undefined;
        const ipLoc = await fetchLocationFromIP(clientIp);
        if (ipLoc) {
          if (!userCoords && typeof ipLoc.lat === 'number' && typeof ipLoc.lng === 'number') {
            userCoords = { lat: ipLoc.lat, lng: ipLoc.lng };
          }
          if (!city && ipLoc.city) {
            city = ipLoc.city;
          }
        }
      } catch (err) {
        console.warn('IP location resolution notice in search route:', err);
      }
    }

    // 1. No query -> closest verified restaurants to the user ONLY if explicit coordinates were provided
    if (!query) {
      if (!hasExplicitCoords) {
        return NextResponse.json({
          success: true,
          count: 0,
          isLiveAPI: true,
          verification: 'multi_source_verified',
          userCoords: null,
          data: []
        });
      }

      const nearby = await fetchVerifiedNearbyRestaurants(latParam, lngParam, 5);
      return NextResponse.json({
        success: true,
        count: nearby.length,
        isLiveAPI: true,
        verification: 'multi_source_verified',
        userCoords,
        data: nearby
      });
    }

    // 2. Pasted Swiggy URL / id -> verify that exact restaurant only (works for any city)
    const parsedSwiggy = parseSwiggyRestaurantUrl(query);
    if (parsedSwiggy.isSwiggyUrl && parsedSwiggy.restaurantId) {
      const result = await verifySwiggyRestaurant(parsedSwiggy.restaurantId, userCoords || undefined);
      const data = result.verified ? [toVerifiedRestaurant(result.profile, userCoords)] : [];
      return NextResponse.json({
        success: true,
        count: data.length,
        isLiveAPI: true,
        verification: 'multi_source_verified',
        data,
        ...(data.length === 0 ? { message: 'This Swiggy restaurant could not be verified.' } : {})
      });
    }

    // 3. Pasted Zomato URL -> direct profile lookup first, fallback to name search
    const parsedZomato = parseZomatoUrl(query);
    if (parsedZomato.isZomatoUrl) {
      const directProfile = await fetchZomatoRestaurantProfileByUrl(query);
      if (directProfile) {
        return NextResponse.json({
          success: true,
          count: 1,
          isLiveAPI: true,
          verification: 'multi_source_verified',
          scope: 'typed_location',
          searchedLocation: null,
          data: [directProfile]
        });
      }

      if (parsedZomato.name) {
        const cleanName = parsedZomato.name.replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim();
        const result = await searchRestaurantsAnywhere(cleanName || parsedZomato.name, userCoords, { selectedCity: parsedZomato.city || city });
        return NextResponse.json({
          success: true,
          count: result.data.length,
          isLiveAPI: true,
          verification: 'multi_source_verified',
          scope: result.scope,
          searchedLocation: result.searchedLocation,
          data: result.data
        });
      }
    }

    // 4. Name / cuisine / dish search across Zomato, Swiggy, and Google in any location
    const result = await searchRestaurantsAnywhere(query, userCoords, { selectedCity: city });
    return NextResponse.json({
      success: true,
      count: result.data.length,
      isLiveAPI: true,
      verification: 'multi_source_verified',
      scope: result.scope,
      searchedLocation: result.searchedLocation,
      spellingSuggestion: result.spellingSuggestion,
      ...(result.message ? { message: result.message } : {}),
      data: result.data
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
