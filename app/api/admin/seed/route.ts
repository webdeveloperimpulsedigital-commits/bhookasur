import { NextResponse } from 'next/server';
import { db, testMySQLConnection, getDatabaseStatus } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const testResult = await testMySQLConnection();
    const status = getDatabaseStatus();

    return NextResponse.json({
      success: true,
      status,
      mysqlTest: testResult
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Status check failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await db.resetAndSeed();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
