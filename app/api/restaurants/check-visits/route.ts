import { NextResponse } from 'next/server';
import { getMySQLPool } from '@/lib/db';
import mysql from 'mysql2/promise';

export const dynamic = 'force-dynamic';

function getRestaurantCleanKey(name: string): string {
  if (!name) return '';
  const baseName = name.split(/[,-]/)[0].trim();
  return baseName.toLowerCase()
    .replace(/\b(hotel|restaurant|pure veg|veg|cafe|stall|bhel|snacks|the|special|bar|and)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || searchParams.get('q') || '';
    const restaurantId = parseInt(searchParams.get('id') || '0', 10);

    if (!name.trim() && !restaurantId) {
      return NextResponse.json({
        success: true,
        isFirstVisitor: false,
        visitCount: 0
      });
    }

    const clean = getRestaurantCleanKey(name);
    let visitCount = 0;

    try {
      const pool = getMySQLPool();
      if (pool) {
        const [rows] = await pool.query<mysql.RowDataPacket[]>(
          `SELECT COUNT(*) as visit_count
           FROM campaign_visits
           WHERE (restaurant_name IS NOT NULL AND (
                  restaurant_name LIKE ? 
                  OR restaurant_name LIKE ?
                  ${clean ? 'OR LOWER(REPLACE(restaurant_name, " ", "")) LIKE ?' : ''}
           ))
           ${restaurantId > 0 && restaurantId < 1000 ? 'OR (restaurant_id = ?)' : ''}`,
          clean
            ? [`%${clean}%`, `%${name.trim()}%`, `%${clean}%`, ...(restaurantId > 0 && restaurantId < 1000 ? [restaurantId] : [])]
            : [`%${name.trim()}%`, `%${name.trim()}%`, ...(restaurantId > 0 && restaurantId < 1000 ? [restaurantId] : [])]
        );

        visitCount = Number(rows[0]?.visit_count || 0);
      }
    } catch {
      visitCount = 0;
    }

    const isFirstVisitor = visitCount === 0;

    return NextResponse.json({
      success: true,
      restaurantName: name,
      visitCount,
      isFirstVisitor
    });
  } catch (error: unknown) {
    console.warn('Check restaurant visits API error:', error);
    return NextResponse.json({
      success: false,
      isFirstVisitor: false,
      visitCount: 0
    });
  }
}
