import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTarget = searchParams.get('url') || searchParams.get('id') || '';

    if (!rawTarget) {
      return new NextResponse('Invalid or missing image url', { status: 400 });
    }

    let targetUrl = rawTarget.trim();

    // If it's a Swiggy image ID rather than full URL, convert to Swiggy CDN URL
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      const cleanId = targetUrl.replace(/^\/+/, '');
      targetUrl = `https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_600,h_600,c_fit/${cleanId}`;
    }

    const referer = (targetUrl.includes('zmtcdn.com') || targetUrl.includes('zomato.com'))
      ? 'https://www.zomato.com/'
      : 'https://www.swiggy.com/';

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: referer,
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      next: { revalidate: 604800 } // 7-day edge cache
    });

    if (!res.ok) {
      // Fallback: try default Unsplash culinary placeholder if Swiggy CDN returns 404
      const fallback = await fetch('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80');
      const fallbackBuf = await fallback.arrayBuffer();
      return new NextResponse(fallbackBuf, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new NextResponse(err.message || 'Image proxy error', { status: 500 });
  }
}
