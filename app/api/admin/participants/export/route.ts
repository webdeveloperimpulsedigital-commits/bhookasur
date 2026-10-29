import { NextResponse } from 'next/server';
import { db, getMySQLPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  try {
    const participants = await db.getParticipants();
    const pool = getMySQLPool();

    const visitsBySession = new Map<string, Array<{ round_number: number; restaurant_name: string; dish_name: string; city: string }>>();
    if (pool && participants.length > 0) {
      try {
        const sessionIds = Array.from(new Set(participants.map(p => p.session_id).filter(Boolean)));
        if (sessionIds.length > 0) {
          const [vRows] = await pool.query<RowDataPacket[]>(
            `SELECT session_id, COALESCE(round_number, 1) AS round_number, restaurant_name, dish_name, city
             FROM campaign_visits
             WHERE session_id IN (?)
             ORDER BY id ASC`,
            [sessionIds]
          );
          for (const vr of vRows || []) {
            const sid = String(vr.session_id || '');
            if (!visitsBySession.has(sid)) visitsBySession.set(sid, []);
            visitsBySession.get(sid)!.push({
              round_number: Number(vr.round_number || 1),
              restaurant_name: String(vr.restaurant_name || '').trim(),
              dish_name: String(vr.dish_name || '').trim(),
              city: String(vr.city || '').trim()
            });
          }
        }
      } catch {}
    }

    const tableRows = participants
      .map((p, idx) => {
        const restParts = (p.restaurant_name || '')
          .split(/\s+&\s+/)
          .map(s => s.trim())
          .filter(Boolean);
        const dishParts = (p.dish_name || '')
          .split(/\s+&\s+/)
          .map(s => s.trim())
          .filter(Boolean);

        const sessionVisits = visitsBySession.get(p.session_id) || [];
        const round1Visit = sessionVisits.find(v => v.round_number === 1);
        const round2Visit = sessionVisits.find(v => v.round_number === 2);

        const spot1Rest = restParts[0] || round1Visit?.restaurant_name || '-';
        const spot1Dish = dishParts[0] || round1Visit?.dish_name || '-';
        const spot2Rest = restParts[1] || (restParts.length === 1 && round2Visit && round2Visit.restaurant_name !== spot1Rest ? round2Visit.restaurant_name : '-') || '-';
        const spot2Dish = dishParts[1] || (spot2Rest !== '-' && round2Visit ? round2Visit.dish_name : '-') || '-';
        const createdDate = p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : '';

        return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="font-weight:bold;">${escapeHtml(p.participation_id)}</td>
          <td>${escapeHtml(p.name)}</td>
          <td style="mso-number-format:'\\@';">${escapeHtml(p.mobile)}</td>
          <td>${escapeHtml(p.city)}</td>
          <td>${escapeHtml(spot1Rest)}</td>
          <td>${escapeHtml(spot1Dish)}</td>
          <td>${escapeHtml(spot2Rest)}</td>
          <td>${escapeHtml(spot2Dish)}</td>
          <td>${escapeHtml(createdDate)}</td>
        </tr>`;
      })
      .join('');

    const excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Participants Data</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      </head>
      <body>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:11pt;">
          <thead>
            <tr style="background-color:#EA580C;color:#FFFFFF;font-weight:bold;">
              <th>Sr. No.</th>
              <th>Participation ID</th>
              <th>User Name</th>
              <th>Mobile Number</th>
              <th>Location (City)</th>
              <th>Spot 1 - Visited Restaurant</th>
              <th>Spot 1 - Dish Name</th>
              <th>Spot 2 - Visited Restaurant</th>
              <th>Spot 2 - Dish Name</th>
              <th>Registered Date &amp; Time</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>`;

    return new NextResponse(excelHtml, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="bakasur_participants_data_${Date.now()}.xls"`
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
