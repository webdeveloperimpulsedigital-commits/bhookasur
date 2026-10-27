import { NextResponse } from 'next/server';
import { clearPlacesCache } from '@/lib/livePlaces';

export const dynamic = 'force-dynamic';

export async function GET() {
  clearPlacesCache();
  return NextResponse.json({
    success: true,
    message: 'Server cache successfully cleared (placesCache & live API memory).'
  });
}

export async function POST() {
  clearPlacesCache();
  return NextResponse.json({
    success: true,
    message: 'Server cache successfully cleared (placesCache & live API memory).'
  });
}
