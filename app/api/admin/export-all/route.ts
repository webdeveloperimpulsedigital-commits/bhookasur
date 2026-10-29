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
    const pool = getMySQLPool();
    const participants = await db.getParticipants();

    let visitRows: RowDataPacket[] = [];
    const visitsBySession = new Map<string, Array<{ round_number: number; restaurant_name: string; dish_name: string; city: string }>>();

    if (pool) {
      const [vRows] = await pool.query<RowDataPacket[]>(`
        SELECT cv.id, cv.session_id,
               COALESCE(NULLIF(TRIM(cv.restaurant_name), ''), r.name, 'Local Food Spot') AS restaurant_name,
               COALESCE(NULLIF(TRIM(cv.city), ''), NULLIF(TRIM(r.city), ''), 'Pune') AS city,
               COALESCE(NULLIF(TRIM(cv.dish_name), ''), d.name, 'Signature Dish') AS dish_name,
               COALESCE(cv.round_number, 1) AS round_number,
               cv.visited_at
        FROM campaign_visits cv
        LEFT JOIN restaurants r ON cv.restaurant_id = r.id
        LEFT JOIN dishes d ON cv.dish_id = d.id
        ORDER BY cv.visited_at DESC, cv.id DESC
      `);
      visitRows = vRows || [];

      for (const vr of visitRows) {
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

    const visitsHtmlRows = visitRows
      .map((r, idx) => {
        const visitedDate = r.visited_at ? new Date(r.visited_at).toLocaleString('en-IN') : '';
        return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center;">#${r.id}</td>
          <td style="mso-number-format:'\\@';font-weight:bold;">${escapeHtml(r.session_id)}</td>
          <td>${escapeHtml(r.restaurant_name)}</td>
          <td>${escapeHtml(r.city)}</td>
          <td>${escapeHtml(r.dish_name)}</td>
          <td>${escapeHtml(visitedDate)}</td>
        </tr>`;
      })
      .join('');

    const participantsHtmlRows = participants
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
      </head>
      <body>
        <h2>1. User Searched Restaurants &amp; Dishes (Total: ${visitRows.length})</h2>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:11pt;margin-bottom:30px;">
          <thead>
            <tr style="background-color:#EA580C;color:#FFFFFF;font-weight:bold;">
              <th>Sr. No.</th>
              <th>Record ID</th>
              <th>User Session ID</th>
              <th>Searched Restaurant Name</th>
              <th>Restaurant Location (City)</th>
              <th>Searched Dish Name</th>
              <th>Visited Date &amp; Time</th>
            </tr>
          </thead>
          <tbody>
            ${visitsHtmlRows}
          </tbody>
        </table>

        <h2>2. Registered Participants Data with Spot 1 &amp; Spot 2 (Total: ${participants.length})</h2>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:11pt;">
          <thead>
            <tr style="background-color:#059669;color:#FFFFFF;font-weight:bold;">
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
            ${participantsHtmlRows}
          </tbody>
        </table>
      </body>
    </html>`;

    return new NextResponse(excelHtml, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="bakasur_complete_report_${Date.now()}.xls"`
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

