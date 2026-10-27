import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    if (sessionId) {
      const steps = await db.getJourneyBySession(sessionId);
      const session = await db.getSession(sessionId);
      return NextResponse.json({
        success: true,
        data: {
          session,
          steps,
          totalSteps: steps.length
        }
      });
    }

    const sessionsWithJourneys = await db.getAllSessionsWithJourneys(limit);
    return NextResponse.json({
      success: true,
      data: sessionsWithJourneys
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve journeys';
    console.error('Error fetching journeys:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
