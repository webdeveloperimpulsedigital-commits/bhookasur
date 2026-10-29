import { NextResponse } from 'next/server';
import { getMySQLPool } from '@/lib/db';
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
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT cv.id, cv.session_id,
             COALESCE(NULLIF(TRIM(cv.restaurant_name), ''), r.name, 'Local Food Spot') AS restaurant_name,
             COALESCE(NULLIF(TRIM(cv.city), ''), NULLIF(TRIM(r.city), ''), 'Pune') AS city,
             COALESCE(NULLIF(TRIM(cv.dish_name), ''), d.name, 'Signature Dish') AS dish_name,
             COALESCE(cv.round_number, 1) AS round_number,
             cv.latitude, cv.longitude, cv.visited_at
      FROM campaign_visits cv
      LEFT JOIN restaurants r ON cv.restaurant_id = r.id
      LEFT JOIN dishes d ON cv.dish_id = d.id
      ORDER BY cv.visited_at DESC, cv.id DESC
    `);

    const tableRows = (rows || [])
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

    const excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>campaign_visits</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      </head>
      <body>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:11pt;">
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
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>`;

    return new NextResponse(excelHtml, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="bakasur_campaign_visits_${Date.now()}.xls"`
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
