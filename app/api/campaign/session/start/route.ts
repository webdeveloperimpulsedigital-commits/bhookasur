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
      user_id,
      user_location,
      latitude,
      longitude,
      restaurant_id,
      dish_id,
      current_stage,
      current_step,
      food_meter_percentage,
      aur_khilo_clicks,
      map_visited,
      form_submitted
    } = body;

    if (!session_id) {
      return NextResponse.json({ success: false, error: 'session_id is required' }, { status: 400 });
    }

    const session = await db.createOrUpdateSession({
      session_id,
      user_id: user_id ? String(user_id) : undefined,
      user_location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      restaurant_id: restaurant_id ? parseInt(restaurant_id, 10) : null,
      dish_id: dish_id ? parseInt(dish_id, 10) : null,
      current_stage: current_stage || undefined,
      current_step: current_step || undefined,
      food_meter_percentage: food_meter_percentage !== undefined ? parseInt(food_meter_percentage, 10) : undefined,
      aur_khilo_clicks: aur_khilo_clicks !== undefined ? parseInt(aur_khilo_clicks, 10) : undefined,
      map_visited: map_visited !== undefined ? (map_visited ? 1 : 0) : undefined,
      form_submitted: form_submitted !== undefined ? (form_submitted ? 1 : 0) : undefined
    });

    return NextResponse.json({
      success: true,
      data: session
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start campaign session';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
