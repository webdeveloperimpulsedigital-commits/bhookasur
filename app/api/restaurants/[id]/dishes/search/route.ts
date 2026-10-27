import { NextResponse } from 'next/server';
import { searchDishesSwiggyZomato } from '@/lib/foodSearchEngine';
import { verifySwiggyRestaurant, toVerifiedRestaurant } from '@/lib/verifiedRestaurants';

export const dynamic = 'force-dynamic';

/**
 * Dish search within a verified restaurant's live Swiggy menu (strict mode).
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await Promise.resolve(context.params);
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('query') || '').trim();
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    const result = await verifySwiggyRestaurant(params.id, { lat, lng });
    if (!result.verified) {
      return NextResponse.json({ success: true, count: 0, isLiveAPI: true, source: 'unverified', reason: result.reason, data: [] });
    }

    const profile = result.profile;
    const baseDishes = profile.vegOnly ? profile.dishes.filter(d => d.is_veg !== 0) : profile.dishes;
    const matchedDishes = searchDishesSwiggyZomato(toVerifiedRestaurant(profile), query, baseDishes);

    return NextResponse.json({
      success: true,
      count: matchedDishes.length,
      isLiveAPI: true,
      source: 'live_swiggy_menu_verified',
      data: matchedDishes
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Dish search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
