import { NextRequest, NextResponse } from 'next/server';
import { safeImageSearch } from '@/lib/image-search';

// Set to fetch new data on each request
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  
  try {
    const imageResults = await safeImageSearch(query, page);
    return NextResponse.json(imageResults);
  } catch (error) {
    console.error('Image proxy search error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
} 