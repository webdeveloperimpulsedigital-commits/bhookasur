import { NextRequest, NextResponse } from 'next/server';
import { getDishVisualAssets } from '@/lib/dishAssets';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dishName = searchParams.get('dish') || searchParams.get('name') || searchParams.get('q') || 'Special Dish';
    const rawImage = searchParams.get('raw') === 'true';

    // Resolve accurate visual assets (AI generated PNG prioritized)
    const visual = getDishVisualAssets(dishName);
    const imagePath = visual.plateImage;

    // If client requested the raw image binary directly (e.g. for <img src="..." />)
    if (rawImage || req.headers.get('accept')?.includes('image/')) {
      return NextResponse.redirect(new URL(imagePath, req.url));
    }

    return NextResponse.json(
      {
        success: true,
        dishName,
        image: imagePath,
        flyingImage: visual.flyingImage,
        format: 'png',
        isAiGenerated: true
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      }
    );
  } catch (error) {
    const fallbackUrl = `/api/ai/dish-image?dish=Special%20Dish`;
    return NextResponse.json(
      {
        success: true,
        dishName: 'Dish',
        image: fallbackUrl,
        flyingImage: fallbackUrl,
        format: 'png',
        isAiGenerated: true
      },
      { status: 200 }
    );
  }
}
