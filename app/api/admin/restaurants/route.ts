import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Admin review: include unverified (legacy/user-entered) rows; each row carries is_verified
    const restaurants = await db.getRestaurants({ includeUnverified: true });
    return NextResponse.json({ success: true, count: restaurants.length, data: restaurants });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch restaurants';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, address, area, city, latitude, longitude, rating, image, is_campaign_active } = body;

    if (!name || !city || !address) {
      return NextResponse.json({ success: false, error: 'Name, City, and Address are required' }, { status: 400 });
    }

    const created = await db.createRestaurant({
      name,
      description: description || '',
      address,
      area: area || city,
      city,
      latitude: parseFloat(latitude) || 18.5204,
      longitude: parseFloat(longitude) || 73.8407,
      rating: parseFloat(rating) || 4.5,
      image: image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      is_campaign_active: is_campaign_active !== undefined ? Number(is_campaign_active) : 1,
      total_visits: 0,
      status: 'active'
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create restaurant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
