import { NextResponse } from 'next/server';
import { isApifyConfigured, testApifySwiggyConnection, getApifyActor } from '@/lib/apifySwiggy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || searchParams.get('q') || 'Meghana Foods';
    const city = searchParams.get('city') || 'bangalore';

    const result = await testApifySwiggyConnection(name, city);

    return NextResponse.json(
      {
        ...result,
        timestamp: new Date().toISOString()
      },
      { status: result.configured ? 200 : 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        configured: isApifyConfigured(),
        actor: getApifyActor(),
        error: err.message || String(err)
      },
      { status: 500 }
    );
  }
}
