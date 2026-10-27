import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const videos = await db.getAllVideos();
    return NextResponse.json({ success: true, count: videos.length, data: videos });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch videos';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurant_id, dish_id, stage, stage_number, video_url, thumbnail, duration, meter_percentage, message, cta_text } = body;

    if (!stage || !video_url || !message) {
      return NextResponse.json({ success: false, error: 'Stage, Video URL, and Dialogue Message are required' }, { status: 400 });
    }

    const created = await db.createVideo({
      restaurant_id: restaurant_id ? parseInt(restaurant_id, 10) : null,
      dish_id: dish_id ? parseInt(dish_id, 10) : null,
      stage,
      stage_number: parseInt(stage_number, 10) || 1,
      video_url,
      thumbnail: thumbnail || null,
      duration: parseInt(duration, 10) || 15,
      meter_percentage: parseInt(meter_percentage, 10) || 20,
      message,
      cta_text: cta_text || '🍽️ AUR KHILO',
      status: 'active'
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save video configuration';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
