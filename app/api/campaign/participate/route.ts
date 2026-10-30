import { NextResponse } from 'next/server';
import { db, getMySQLPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

function isValidIndianMobile(raw: string): boolean {
  const clean = (raw || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(clean)) return false;
  if (/(\d)\1{5,}/.test(clean)) return false;
  if (/^(\d\d)\1{4}$/.test(clean)) return false;
  if (new Set(clean.split('')).size < 3) return false;
  const sequences = [
    '012345', '123456', '234567', '345678', '456789', '567890', '678901',
    '987654', '876543', '765432', '654321', '543210', '432109'
  ];
  for (const seq of sequences) {
    if (clean.includes(seq)) return false;
  }
  return true;
}

// GET: Check if a mobile number is already registered
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('check_mobile') || searchParams.get('mobile');
    if (!mobile) {
      return NextResponse.json({ success: false, error: 'Mobile number parameter required' }, { status: 400 });
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    const tenDigit = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;
    if (tenDigit.length !== 10 || !isValidIndianMobile(tenDigit)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid mobile number' }, { status: 400 });
    }

    const existing = await db.getParticipantByMobile(tenDigit);
    return NextResponse.json({
      success: true,
      isRegistered: !!existing,
      data: existing ? {
        participation_id: existing.participation_id,
        name: existing.name,
        mobile: existing.mobile,
        city: existing.city,
        restaurant_name: existing.restaurant_name,
        dish_name: existing.dish_name,
        created_at: existing.created_at
      } : null
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Mobile check failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, user_id, name, mobile, email, city, restaurant_id, dish_id, consent, terms_accepted } = body;

    const rawMobile = String(mobile || '').trim();
    const cleanMobile = rawMobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile) || !isValidIndianMobile(cleanMobile)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid mobile number' }, { status: 400 });
    }
    const tenDigit = cleanMobile;

    // Validate Name: Only characters (letters and spaces), 2-60 chars
    const rawName = String(name || '').trim();
    if (!rawName || !/^[a-zA-Z\s]{2,60}$/.test(rawName)) {
      return NextResponse.json({ success: false, error: 'Kripya apna sahi naam darj karein (sirf characters allow hain).' }, { status: 400 });
    }
    const finalName = rawName;

    // 0. STRICT CHECK: Check if this mobile number is already registered (DO NOT ADD DUPLICATE ENTRIES)
    const existing = await db.getParticipantByMobile(tenDigit);
    if (existing) {
      return NextResponse.json({
        success: false,
        alreadyRegistered: true,
        error: `Yeh mobile number (+91 ${tenDigit}) pehle se registered hai! Duplicate entry allow nahi hai.`,
        data: {
          participation_id: existing.participation_id,
          name: existing.name,
          mobile: existing.mobile,
          city: existing.city,
          restaurant_name: existing.restaurant_name,
          dish_name: existing.dish_name,
          created_at: existing.created_at
        }
      }, { status: 409 });
    }

    const finalEmail = (email?.trim() && email.includes('@')) ? email.trim() : `${tenDigit}@foodtour.com`;
    const finalCity = city?.trim() || 'Pune';
    const isConsentGiven = Boolean(consent || terms_accepted);
    if (!isConsentGiven) {
      return NextResponse.json({ success: false, error: 'Please accept campaign communication terms' }, { status: 400 });
    }

    // 1. Direct values passed from client (highest priority)
    let restaurantName = (body.restaurant_name || '').trim();
    let dishName = (body.dish_name || '').trim();
    let restLat = body.latitude ? parseFloat(body.latitude) : 18.5204;
    let restLng = body.longitude ? parseFloat(body.longitude) : 73.8407;
    let finalRestId = restaurant_id ? parseInt(restaurant_id, 10) : null;
    let finalDishId = dish_id ? parseInt(dish_id, 10) : null;
    let hasExistingSessionVisits = false;

    // 2. Query all visits for session to capture both restaurants if multi-stop tour
    if (session_id) {
      try {
        const pool = getMySQLPool();
        if (pool) {
          const [visits] = await pool.query<RowDataPacket[]>(
            `SELECT restaurant_id, restaurant_name, dish_id, dish_name, city, latitude, longitude FROM campaign_visits WHERE session_id = ? ORDER BY id ASC`,
            [session_id]
          );
          if (visits && visits.length > 0) {
            hasExistingSessionVisits = true;
            const visitedRestNames = Array.from(new Set(visits.map(v => String(v.restaurant_name || '').trim()).filter(Boolean)));
            if (visitedRestNames.length > 1 && (!restaurantName || !restaurantName.includes('&'))) {
              restaurantName = visitedRestNames.join(' & ');
            } else if (!restaurantName || restaurantName === 'Local Food Spot') {
              restaurantName = String(visits[visits.length - 1].restaurant_name || '').trim() || restaurantName;
            }

            const visitedDishNames = Array.from(new Set(visits.map(v => String(v.dish_name || '').trim()).filter(Boolean)));
            if (visitedDishNames.length > 1 && (!dishName || !dishName.includes('&'))) {
              dishName = visitedDishNames.join(' & ');
            } else if (!dishName || dishName === 'Signature Specialty') {
              dishName = String(visits[visits.length - 1].dish_name || '').trim() || dishName;
            }

            if (!finalRestId && visits[0].restaurant_id) {
              finalRestId = Number(visits[0].restaurant_id);
            }
            if (!finalDishId && visits[0].dish_id) {
              finalDishId = Number(visits[0].dish_id);
            }
            if (visits[0].latitude) restLat = Number(visits[0].latitude);
            if (visits[0].longitude) restLng = Number(visits[0].longitude);
          }
        }
      } catch (visitErr) {
        console.warn('Session visits lookup notice:', visitErr);
      }
    }

    // 3. Fallback journey step lookup if still needed
    if ((!dishName || !restaurantName || restaurantName === 'Local Food Spot' || dishName === 'Signature Specialty') && session_id) {
      try {
        const pool = getMySQLPool();
        if (pool) {
          const [steps] = await pool.query<RowDataPacket[]>(
            `SELECT metadata FROM user_journey_steps WHERE session_id = ? AND (step_name = 'dish_selected' OR step_name = 'eating' OR step_name = 'restaurant_selected' OR step_name = 'pass') ORDER BY id DESC LIMIT 10`,
            [session_id]
          );
          if (steps && steps.length > 0) {
            for (const s of steps) {
              try {
                const meta = typeof s.metadata === 'string' ? JSON.parse(s.metadata) : s.metadata;
                if ((!dishName || dishName === 'Signature Specialty') && meta?.dish_name) {
                  dishName = String(meta.dish_name).trim();
                }
                if ((!restaurantName || restaurantName === 'Local Food Spot') && meta?.restaurant_name) {
                  restaurantName = String(meta.restaurant_name).trim();
                }
                if (!finalRestId && meta?.restaurant_id) {
                  finalRestId = Number(meta.restaurant_id);
                }
              } catch {}
            }
          }
        }
      } catch (stepErr) {
        console.warn('Fallback journey step lookup warning:', stepErr);
      }
    }

    // 4. Fallback to DB lookup by ID if still missing
    if (!restaurantName && finalRestId) {
      const rest = await db.getRestaurantById(finalRestId);
      if (rest) {
        restaurantName = rest.name;
        if (rest.latitude) restLat = rest.latitude;
        if (rest.longitude) restLng = rest.longitude;
      }
    }

    if (!dishName && finalDishId) {
      const d = await db.getDishById(finalDishId);
      if (d) {
        dishName = d.name;
      }
    }

    // 5. Default fallbacks
    if (!restaurantName) restaurantName = "Local Food Spot";
    if (!dishName) dishName = "Signature Specialty";

    const participant = await db.createParticipant({
      session_id: session_id || `sess_${Date.now()}`,
      name: finalName,
      mobile: tenDigit,
      email: finalEmail.toLowerCase(),
      city: finalCity,
      restaurant_id: finalRestId,
      restaurant_name: restaurantName,
      dish_id: finalDishId,
      dish_name: dishName,
      consent: isConsentGiven ? 1 : 0,
      terms_accepted: 1
    });

    if (participant.already_registered) {
      return NextResponse.json({
        success: false,
        alreadyRegistered: true,
        error: `Yeh mobile number (+91 ${tenDigit}) pehle se registered hai! Duplicate entry allow nahi hai.`,
        data: {
          participation_id: participant.participation_id,
          name: participant.name,
          mobile: participant.mobile,
          city: participant.city,
          restaurant_name: participant.restaurant_name,
          dish_name: participant.dish_name,
          created_at: participant.created_at
        }
      }, { status: 409 });
    }

    // Only record fallback visits if this session doesn't already have visits in campaign_visits
    if (!hasExistingSessionVisits) {
      const restParts = restaurantName.split(/\s*&\s*/).map((s: string) => s.trim()).filter(Boolean);
      const dishParts = dishName.split(/\s*&\s*/).map((s: string) => s.trim()).filter(Boolean);
      const count = Math.max(restParts.length, 1);
      for (let i = 0; i < Math.min(count, 2); i++) {
        await db.recordVisit({
          session_id: participant.session_id,
          user_id: user_id ? String(user_id) : undefined,
          restaurant_id: i === 0 ? finalRestId : null,
          restaurant_name: restParts[i] || restParts[0] || 'Local Food Spot',
          dish_id: i === 0 ? finalDishId : null,
          dish_name: dishParts[i] || dishParts[0] || 'Signature Specialty',
          city: finalCity,
          latitude: restLat,
          longitude: restLng
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        participation_id: participant.participation_id,
        participant,
        message: "Congratulations! You have completed Bhookasur Ka Food Tour and your contest participation is confirmed!"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Participation submission failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
