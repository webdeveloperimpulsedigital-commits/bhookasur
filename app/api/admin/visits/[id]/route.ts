import { NextResponse } from 'next/server';
import { getMySQLPool } from '@/lib/db';
import { resolveBestCoordsForRestaurant } from '@/lib/locationResolver';
import type { ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const visitId = Number(id);
    if (!visitId || isNaN(visitId)) {
      return NextResponse.json({ success: false, error: 'Valid visit ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const restaurant_name = String(body.restaurant_name || '').trim();
    const dish_name = String(body.dish_name || '').trim();
    const city = String(body.city || 'Pune').trim();
    const round_number = Number(body.round_number) === 2 ? 2 : 1;

    if (!restaurant_name) {
      return NextResponse.json({ success: false, error: 'Restaurant name is required' }, { status: 400 });
    }

    const pool = getMySQLPool();
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Database pool unavailable' }, { status: 503 });
    }

    const resolvedCoords = resolveBestCoordsForRestaurant(
      restaurant_name,
      '',
      city,
      body.latitude ? Number(body.latitude) : null,
      body.longitude ? Number(body.longitude) : null
    );

    await pool.query<ResultSetHeader>(
      `UPDATE campaign_visits
       SET restaurant_name = ?, dish_name = ?, city = ?, round_number = ?, latitude = ?, longitude = ?
       WHERE id = ?`,
      [restaurant_name, dish_name || 'Signature Dish', city, round_number, resolvedCoords.lat, resolvedCoords.lng, visitId]
    );

    return NextResponse.json({
      success: true,
      message: 'Searched restaurant record updated successfully'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update visit record';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const visitId = Number(id);
    if (!visitId || isNaN(visitId)) {
      return NextResponse.json({ success: false, error: 'Valid visit ID is required' }, { status: 400 });
    }

    const pool = getMySQLPool();
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Database pool unavailable' }, { status: 503 });
    }

    await pool.query<ResultSetHeader>('DELETE FROM campaign_visits WHERE id = ?', [visitId]);

    return NextResponse.json({
      success: true,
      message: 'Searched restaurant record deleted successfully'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete visit record';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

