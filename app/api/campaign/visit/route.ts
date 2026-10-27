import { NextResponse } from 'next/server';
import { db, getMySQLPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      session_id,
      user_id,
      restaurant_id,
      restaurant_name,
      dish_id,
      dish_name,
      city = 'Pune',
      latitude = 18.5204,
      longitude = 73.8407,
      round_number = 1
    } = body;

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'session_id is required' },
        { status: 400 }
      );
    }

    const restId = restaurant_id ? Number(restaurant_id) : 1;
    const dishId = dish_id ? Number(dish_id) : null;
    const lat = Number(latitude) || 18.5204;
    const lng = Number(longitude) || 73.8407;
    const roundNum = Number(round_number) || 1;

    // Record visit in MySQL & memoryStore
    const visit = await db.recordVisit({
      session_id,
      user_id: user_id ? String(user_id) : undefined,
      restaurant_id: restId,
      restaurant_name: restaurant_name ? String(restaurant_name) : undefined,
      dish_id: dishId,
      dish_name: dish_name ? String(dish_name) : undefined,
      city: String(city),
      latitude: lat,
      longitude: lng,
      round_number: roundNum
    });

    // Also register or update tour_submissions in DB if available
    try {
      const pool = getMySQLPool();
      if (pool) {
        await pool.query(
          `INSERT INTO tour_submissions (session_id, location_name, restaurant_name, dish_name, spice_level, is_relieved)
           VALUES (?, ?, ?, ?, 3, 1)
           ON DUPLICATE KEY UPDATE 
             restaurant_name = VALUES(restaurant_name),
             dish_name = VALUES(dish_name),
             is_relieved = 1`,
          [
            session_id,
            city,
            restaurant_name || 'Selected Food Spot',
            dish_name || 'Signature Dish'
          ]
        );
      }
    } catch (dbErr) {
      console.warn('tour_submissions insert non-blocking notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        visit,
        restaurant_name,
        dish_name
      },
      message: 'Visited restaurant successfully saved to database'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save visited restaurant';
    console.error('Save visit error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
