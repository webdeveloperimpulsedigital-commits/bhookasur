import { NextResponse } from 'next/server';
import { db, getMySQLPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export interface EnrichedParticipant {
  id: number;
  session_id: string;
  participation_id: string;
  name: string;
  mobile: string;
  email: string;
  city: string;
  restaurant_name?: string;
  dish_name?: string;
  spot1_restaurant: string;
  spot1_dish: string;
  spot1_location: string;
  spot2_restaurant: string;
  spot2_dish: string;
  spot2_location: string;
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const city = searchParams.get('city') || undefined;

    const participants = await db.getParticipants({ search, city });
    const pool = getMySQLPool();

    // Map session_id -> visits from campaign_visits for supplementary spot lookup
    const visitsBySession = new Map<string, Array<{ round_number: number; restaurant_name: string; dish_name: string; city: string }>>();
    if (pool && participants.length > 0) {
      try {
        const sessionIds = Array.from(new Set(participants.map(p => p.session_id).filter(Boolean)));
        if (sessionIds.length > 0) {
          const [vRows] = await pool.query<RowDataPacket[]>(
            `SELECT session_id, COALESCE(round_number, 1) AS round_number, restaurant_name, dish_name, city
             FROM campaign_visits
             WHERE session_id IN (?)
             ORDER BY id ASC`,
            [sessionIds]
          );
          for (const vr of vRows || []) {
            const sid = String(vr.session_id || '');
            if (!visitsBySession.has(sid)) visitsBySession.set(sid, []);
            visitsBySession.get(sid)!.push({
              round_number: Number(vr.round_number || 1),
              restaurant_name: String(vr.restaurant_name || '').trim(),
              dish_name: String(vr.dish_name || '').trim(),
              city: String(vr.city || '').trim()
            });
          }
        }
      } catch {}
    }

    const enriched: EnrichedParticipant[] = participants.map((p) => {
      const restParts = (p.restaurant_name || '')
        .split(/\s+&\s+/)
        .map(s => s.trim())
        .filter(Boolean);
      const dishParts = (p.dish_name || '')
        .split(/\s+&\s+/)
        .map(s => s.trim())
        .filter(Boolean);

      const sessionVisits = visitsBySession.get(p.session_id) || [];
      const round1Visit = sessionVisits.find(v => v.round_number === 1);
      const round2Visit = sessionVisits.find(v => v.round_number === 2);

      const spot1_restaurant = restParts[0] || round1Visit?.restaurant_name || '-';
      const spot1_dish = dishParts[0] || round1Visit?.dish_name || '-';
      const spot1_location = p.city || round1Visit?.city || 'Pune';

      const spot2_restaurant = restParts[1] || (restParts.length === 1 && round2Visit && round2Visit.restaurant_name !== spot1_restaurant ? round2Visit.restaurant_name : '') || '';
      const spot2_dish = dishParts[1] || (spot2_restaurant && round2Visit ? round2Visit.dish_name : '') || '';
      const spot2_location = spot2_restaurant ? (round2Visit?.city || p.city || 'Pune') : '';

      return {
        id: p.id,
        session_id: p.session_id,
        participation_id: p.participation_id,
        name: p.name,
        mobile: p.mobile,
        email: p.email,
        city: p.city,
        restaurant_name: p.restaurant_name,
        dish_name: p.dish_name,
        spot1_restaurant,
        spot1_dish,
        spot1_location,
        spot2_restaurant,
        spot2_dish,
        spot2_location,
        created_at: p.created_at
      };
    });

    return NextResponse.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch participants';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
