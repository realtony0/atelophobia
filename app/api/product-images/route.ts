import { get } from '@vercel/blob';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get('path') || '';

  if (!pathname || !pathname.startsWith('products/')) {
    return new Response('Not found', { status: 404 });
  }

  const result = await get(pathname, { access: 'private', useCache: true });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
