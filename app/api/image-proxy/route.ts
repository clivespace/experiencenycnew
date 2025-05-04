import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple image proxy API endpoint
 * 
 * This endpoint fetches an image from an external URL and serves it directly.
 * This allows us to display images from any domain without Next.js image domain restrictions.
 * 
 * Usage:
 * <img src="/api/image-proxy?url=https://example.com/image.jpg" alt="Example" />
 * 
 * Security notes:
 * - In production, you might want to add more validation and restrictions
 * - Consider adding caching mechanisms for performance
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameter
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    // Validate the URL parameter
    if (!imageUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Basic URL validation - ensure it's a valid URL
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(imageUrl);
      
      // Ensure it's HTTP or HTTPS
      if (!validatedUrl.protocol.match(/^https?:$/)) {
        return new NextResponse('Invalid URL protocol', { status: 400 });
      }
    } catch (e) {
      return new NextResponse('Invalid URL', { status: 400 });
    }

    console.log(`Proxying image: ${imageUrl}`);

    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        // Some common headers to help avoid 403 errors
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
      }
    });

    // Check if the fetch was successful
    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageUrl}`, imageResponse.status, imageResponse.statusText);
      return new NextResponse(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`, { 
        status: imageResponse.status 
      });
    }

    // Get the image data as an array buffer
    const imageData = await imageResponse.arrayBuffer();
    
    // Get the content type from the original response
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Create a response with the image data and appropriate headers
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      }
    });
  } catch (error) {
    console.error('Error in image proxy:', error);
    return new NextResponse(`Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
      status: 500 
    });
  }
} 