import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, current_stage } = body;

    if (!session_id) {
      return NextResponse.json({ success: false, error: 'session_id is required' }, { status: 400 });
    }

    const session = await db.getSession(session_id);
    const prevClicks = session ? session.aur_khilo_clicks : 0;
    const clickCount = prevClicks + 1;

    let nextStage = 'stage_2';
    let nextPercentage = 45;
    let isTiredState = false;
    let isAcidityState = false;

    if (current_stage === 'stage_1' || !current_stage) {
      nextStage = 'stage_2';
      nextPercentage = 45;
    } else if (current_stage === 'stage_2') {
      nextStage = 'stage_3';
      nextPercentage = 85;
      isTiredState = true;
    } else if (current_stage === 'stage_3') {
      nextStage = 'acidity';
      nextPercentage = 100;
      isTiredState = true;
      isAcidityState = true;
    } else if (current_stage === 'acidity') {
      nextStage = 'acidity';
      nextPercentage = 100;
      isTiredState = true;
      isAcidityState = true;
    }

    const updatedSession = await db.createOrUpdateSession({
      session_id,
      current_stage: nextStage,
      food_meter_percentage: nextPercentage,
      aur_khilo_clicks: clickCount,
      video_completed: 1
    });

    return NextResponse.json({
      success: true,
      data: {
        session: updatedSession,
        current_stage: nextStage,
        food_meter_percentage: nextPercentage,
        aur_khilo_clicks: clickCount,
        isTiredState,
        isAcidityState,
        celebrationMessage: isAcidityState 
          ? "Pet Bhar Gaya! Bhookasur Ko Gastrium Do!" 
          : "Bhookasur ne aur khana pel diya! Food Meter Badh Gaya!"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Aur Khilo action failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
