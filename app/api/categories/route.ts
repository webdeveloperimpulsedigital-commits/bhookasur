import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FOOD_CATEGORIES } from '@/lib/foodSearchEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await db.getCategories();
    return NextResponse.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: true,
      count: FOOD_CATEGORIES.length,
      data: FOOD_CATEGORIES
    });
  }
}
