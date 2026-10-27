import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const city = searchParams.get('city') || undefined;

    const participants = await db.getParticipants({ search, city });

    return NextResponse.json({
      success: true,
      count: participants.length,
      data: participants
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch participants';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
