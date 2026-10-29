import { NextResponse } from 'next/server';
import { getMySQLPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const city = (searchParams.get('city') || '').trim();

    const pool = getMySQLPool();
    if (!pool) {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

    let sql = `
      SELECT cv.id, cv.session_id, cv.user_id, cv.restaurant_id, cv.dish_id,
             COALESCE(NULLIF(TRIM(cv.restaurant_name), ''), r.name, 'Local Food Spot') AS restaurant_name,
             COALESCE(NULLIF(TRIM(cv.dish_name), ''), d.name, 'Signature Dish') AS dish_name,
             COALESCE(NULLIF(TRIM(cv.city), ''), NULLIF(TRIM(r.city), ''), 'Pune') AS city,
             cv.latitude, cv.longitude,
             COALESCE(cv.round_number, 1) AS round_number,
             cv.visited_at
      FROM campaign_visits cv
      LEFT JOIN restaurants r ON cv.restaurant_id = r.id
      LEFT JOIN dishes d ON cv.dish_id = d.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (city && city !== 'All') {
      sql += ` AND LOWER(COALESCE(NULLIF(TRIM(cv.city), ''), r.city, '')) = LOWER(?)`;
      params.push(city);
    }

    if (search) {
      sql += ` AND (
        cv.restaurant_name LIKE ? OR
        cv.dish_name LIKE ? OR
        cv.city LIKE ? OR
        cv.session_id LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY cv.visited_at DESC, cv.id DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);

    // Count distinct users/sessions who visited
    const [[statsRow]] = await pool.query<RowDataPacket[]>(`
      SELECT
        COUNT(*) AS total_searches,
        COUNT(DISTINCT session_id) AS unique_users_visited,
        COUNT(DISTINCT LOWER(TRIM(restaurant_name))) AS unique_restaurants,
        COUNT(CASE WHEN dish_name IS NOT NULL AND TRIM(dish_name) != '' AND LOWER(TRIM(dish_name)) NOT IN ('signature dish', 'specialty dish') THEN 1 END) AS unique_dishes
      FROM campaign_visits
      WHERE restaurant_name IS NOT NULL AND TRIM(restaurant_name) != ''
    `);

    const visits = (rows || []).map((r) => ({
      id: Number(r.id),
      session_id: String(r.session_id || ''),
      user_id: r.user_id ? String(r.user_id) : null,
      restaurant_id: Number(r.restaurant_id || 0),
      restaurant_name: String(r.restaurant_name || ''),
      dish_id: r.dish_id ? Number(r.dish_id) : null,
      dish_name: String(r.dish_name || ''),
      city: String(r.city || 'Pune'),
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
      round_number: Number(r.round_number || 1),
      spot_label: `Spot ${Number(r.round_number || 1)}`,
      visited_at: r.visited_at ? new Date(r.visited_at).toISOString() : new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      count: visits.length,
      summary: {
        totalSearches: Number(statsRow?.total_searches || visits.length),
        uniqueUsersVisited: Number(statsRow?.unique_users_visited || 0),
        uniqueRestaurants: Number(statsRow?.unique_restaurants || 0),
        uniqueDishes: Number(statsRow?.unique_dishes || 0)
      },
      data: visits
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch searched restaurants';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

