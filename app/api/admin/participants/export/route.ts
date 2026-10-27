import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const participants = await db.getParticipants();

    // Generate CSV content
    const headers = ["Participation ID", "Name", "Mobile", "Email", "City", "Restaurant", "Dish", "Created At"];
    const rows = participants.map(p => [
      `"${p.participation_id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.mobile}"`,
      `"${p.email}"`,
      `"${p.city}"`,
      `"${(p.restaurant_name || '').replace(/"/g, '""')}"`,
      `"${(p.dish_name || '').replace(/"/g, '""')}"`,
      `"${p.created_at}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bakasur_contest_participants_${Date.now()}.csv"`
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
