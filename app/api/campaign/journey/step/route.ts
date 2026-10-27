import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const {
      session_id,
      step_name,
      step_title,
      step_number,
      metadata,
      user_location,
      latitude,
      longitude,
      restaurant_id,
      dish_id,
      food_meter_percentage
    } = body;

    if (!session_id || !step_name) {
      return NextResponse.json(
        { success: false, error: 'session_id and step_name are required' },
        { status: 400 }
      );
    }

    // Extract client IP and User-Agent
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip_address = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || null;
    const user_agent = request.headers.get('user-agent') || null;

    const step = await db.logJourneyStep({
      session_id,
      step_name,
      step_title,
      step_number: typeof step_number === 'number' ? step_number : undefined,
      metadata: metadata || null,
      user_location: user_location || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      restaurant_id: restaurant_id ? parseInt(restaurant_id, 10) : null,
      dish_id: dish_id ? parseInt(dish_id, 10) : null,
      food_meter_percentage: food_meter_percentage ? parseInt(food_meter_percentage, 10) : undefined,
      ip_address,
      user_agent
    });

    return NextResponse.json({
      success: true,
      data: step
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to log user journey step';
    console.error('Error logging journey step:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
