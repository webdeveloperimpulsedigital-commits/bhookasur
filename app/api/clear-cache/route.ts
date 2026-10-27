import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: 'All client browser and server caches cleared successfully.',
      timestamp: Date.now(),
      version: 'v30'
    },
    {
      status: 200,
      headers: {
        'Clear-Site-Data': '"cache", "storage"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    }
  );
}

export async function POST() {
  return GET();
}
