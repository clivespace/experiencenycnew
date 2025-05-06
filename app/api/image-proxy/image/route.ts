import { NextRequest, NextResponse } from 'next/server';

// Set to fetch new data on each request
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');
  
  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Missing image URL parameter' },
      { status: 400 }
    );
  }
  
  try {
    // Fetch the image from the provided URL
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Return the image with appropriate content type
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Redirect to a placeholder image on error
    return NextResponse.redirect(new URL('/placeholder.jpg', request.url));
  }
} 