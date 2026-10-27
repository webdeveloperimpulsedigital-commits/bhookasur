import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; dishId: string }> }
) {
  try {
    const params = await Promise.resolve(context.params);
    const restId = parseInt(params.id, 10);
    const dId = parseInt(params.dishId, 10);

    const restaurant = await db.getRestaurantById(restId);
    const dish = await db.getDishById(dId);

    if (!restaurant || !dish) {
      return NextResponse.json(
        { success: false, error: 'Restaurant or Dish not found' },
        { status: 404 }
      );
    }

    const videos = await db.getBakasurVideos(restId, dId);

    // Structure eating stages sequence
    const stages = [
      {
        stage: 'stage_1',
        stage_number: 1,
        title: `Pehla Niwala: ${dish.name}`,
        target_meter: 20,
        video_url: videos.find(v => v.stage === 'stage_1')?.video_url || "/uploads/videos/1.mp4",
        thumbnail: dish.image,
        message: `Waah! ${dish.name} ka pehla niwala toh lajawab hai! Lekin Bhookasur ka pet abhi khaali hai... Aur Khilo!`,
        cta_text: '🍽️ AUR KHILO'
      },
      {
        stage: 'stage_2',
        stage_number: 2,
        title: `Pel Ke Khana: ${dish.name}`,
        target_meter: 45,
        video_url: videos.find(v => v.stage === 'stage_2')?.video_url || "/uploads/videos/2%201.mp4",
        thumbnail: restaurant.image,
        message: `Maza aa raha hai ${restaurant.name} mein! Plate par plate aane do... Bhookasur ko koi roko mat!`,
        cta_text: '🍽️ AUR KHILO'
      },
      {
        stage: 'stage_3',
        stage_number: 3,
        title: `Over-Eating Mode: Bhari Pet!`,
        target_meter: 85,
        video_url: videos.find(v => v.stage === 'stage_3')?.video_url || "/uploads/videos/3%201.mp4",
        thumbnail: dish.image,
        message: `Arre baap re! Itna saara ${dish.name}! Mera pet phool ke dholak ho gaya...`,
        cta_text: '💥 PET FULL HO GAYA!'
      },
      {
        stage: 'acidity',
        stage_number: 4,
        title: `Acidity Strike! Bhookasur Ko Gastrium Do`,
        target_meter: 100,
        video_url: videos.find(v => v.stage === 'acidity')?.video_url || "/uploads/videos/3%201.mp4",
        thumbnail: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
        message: `Aah! Seene mein jalan aur gas ka tehelka! Bhookasur ab hil bhi nahi paa raha... Bhookasur Ko Gastrium Do!`,
        cta_text: '💊 GASTRIUM RELIEF'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          city: restaurant.city,
          address: restaurant.address,
          image: restaurant.image,
          rating: restaurant.rating
        },
        dish: {
          id: dish.id,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          image: dish.image,
          rating: dish.rating
        },
        stages,
        totalStages: 3,
        brandMoment: {
          tagline: "Bhookasur Ko Gastrium Do",
          subtext: "Fast, effective relief from Acidity, Gas & Heartburn after heavy festive feasting!",
          product_name: "Gastrium Antacid Gel & Tablets"
        }
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load Bakasur experience';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
