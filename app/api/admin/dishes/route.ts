import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restId = searchParams.get('restaurant_id');
    const search = searchParams.get('search') || searchParams.get('q') || undefined;

    const dishes = await db.getAllDishes({
      restaurantId: restId ? parseInt(restId, 10) : undefined,
      search
    });

    return NextResponse.json({ success: true, count: dishes.length, data: dishes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dishes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurant_id, name, description, price, image, rating, popularity, is_recommended } = body;

    if (!restaurant_id || !name) {
      return NextResponse.json({ success: false, error: 'Restaurant ID and Dish Name are required' }, { status: 400 });
    }

    const created = await db.createDish({
      restaurant_id: parseInt(restaurant_id, 10),
      name,
      description: description || '',
      price: parseFloat(price) || 150,
      image: image || 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
      rating: parseFloat(rating) || 4.7,
      popularity: parseInt(popularity, 10) || 90,
      is_recommended: is_recommended !== undefined ? Number(is_recommended) : 1,
      status: 'active'
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create dish';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
