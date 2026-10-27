import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await Promise.resolve(context.params);
    const restId = parseInt(params.id, 10);
    const body = await request.json();

    const updated = await db.updateRestaurant(restId, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update restaurant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await Promise.resolve(context.params);
    const restId = parseInt(params.id, 10);

    const deleted = await db.deleteRestaurant(restId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Restaurant deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete restaurant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
