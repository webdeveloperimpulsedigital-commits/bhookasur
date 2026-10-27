import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id') || undefined;
    const userId = searchParams.get('user_id') || undefined;
    const mobile = searchParams.get('mobile') || undefined;
    const sessionIdsRaw = searchParams.get('session_ids') || undefined;
    const sessionIds = sessionIdsRaw ? sessionIdsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const result = await db.getMapData(sessionId, {
      userId,
      mobile,
      sessionIds
    });
    const mapPoints = result.points;
    const totalCampaignVisits = mapPoints.reduce((sum: number, p: any) => sum + (p.total_visits || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalCampaignVisits,
        totalRestaurants: result.stats.foodSpots,
        points: mapPoints,
        stats: result.stats,
        currentUserPoint: result.currentUserPoint,
        currentUserSpots: (result as any).currentUserSpots || (result.currentUserPoint ? [result.currentUserPoint] : []),
        historicalSpots: (result as any).historicalSpots || []
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch map data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
