import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await db.clearAllData();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await db.clearAllData();
  return NextResponse.json(result);
}
