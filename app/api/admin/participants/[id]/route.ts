import { NextResponse } from 'next/server';
import { getMySQLPool } from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const participantId = Number(id);
    if (!participantId || isNaN(participantId)) {
      return NextResponse.json({ success: false, error: 'Valid participant ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const mobile = String(body.mobile || '').replace(/\D/g, '').slice(-10);
    const city = String(body.city || 'Pune').trim();
    const spot1_restaurant = String(body.spot1_restaurant || '').trim();
    const spot1_dish = String(body.spot1_dish || '').trim();
    const spot2_restaurant = String(body.spot2_restaurant || '').trim();
    const spot2_dish = String(body.spot2_dish || '').trim();

    if (!name || !mobile || mobile.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Valid participant name and 10-digit mobile number are required' },
        { status: 400 }
      );
    }

    const combinedRestaurants = [spot1_restaurant, spot2_restaurant]
      .filter(s => s && s !== '-')
      .join(' & ') || String(body.restaurant_name || 'Local Food Spot').trim();

    const combinedDishes = [spot1_dish, spot2_dish]
      .filter(s => s && s !== '-')
      .join(' & ') || String(body.dish_name || 'Signature Dish').trim();

    const pool = getMySQLPool();
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Database pool unavailable' }, { status: 503 });
    }

    await pool.query<ResultSetHeader>(
      `UPDATE participants
       SET name = ?, mobile = ?, city = ?, restaurant_name = ?, dish_name = ?
       WHERE id = ?`,
      [name, mobile, city, combinedRestaurants, combinedDishes, participantId]
    );

    // Also update campaign_visits for this participant's session if unique
    const [pRows] = await pool.query<RowDataPacket[]>('SELECT session_id FROM participants WHERE id = ? LIMIT 1', [participantId]);
    const sessionId = pRows?.[0]?.session_id ? String(pRows[0].session_id) : '';
    if (sessionId) {
      if (spot1_restaurant && spot1_restaurant !== '-') {
        await pool.query(
          `UPDATE campaign_visits SET restaurant_name = ?, dish_name = ?, city = ? WHERE session_id = ? AND round_number = 1`,
          [spot1_restaurant, spot1_dish || 'Signature Dish', city, sessionId]
        ).catch(() => {});
      }
      if (spot2_restaurant && spot2_restaurant !== '-') {
        await pool.query(
          `UPDATE campaign_visits SET restaurant_name = ?, dish_name = ?, city = ? WHERE session_id = ? AND round_number = 2`,
          [spot2_restaurant, spot2_dish || 'Signature Dish', city, sessionId]
        ).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Participant record updated successfully'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update participant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const participantId = Number(id);
    if (!participantId || isNaN(participantId)) {
      return NextResponse.json({ success: false, error: 'Valid participant ID is required' }, { status: 400 });
    }

    const pool = getMySQLPool();
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Database pool unavailable' }, { status: 503 });
    }

    await pool.query<ResultSetHeader>('DELETE FROM participants WHERE id = ?', [participantId]);

    return NextResponse.json({
      success: true,
      message: 'Participant record deleted successfully'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete participant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

