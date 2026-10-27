import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analytics = await db.getAnalytics();
    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
