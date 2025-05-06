import { NextRequest, NextResponse } from 'next/server';

// Default Google Search API configuration
// In production, use environment variables instead of hardcoded values
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || 'AIzaSyDwstlEMfnItV34_h-nLO-GMSKN9vtwbL8';
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || '764bbc3a489a34eb6';

// This API provides an interface to Google Custom Search API for client components
// It allows fetching restaurant images on-demand
// Path: /api/google-image-search?q=restaurant+name

export const dynamic = "force-static";

/**
 * Google Image Search API endpoint
 * This proxies requests to the Google Custom Search API to avoid exposing API keys to the client
 */
export async function GET(request: Request) {
  try {
    // Parse the URL to get search query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }
    
    console.log('Google Image Search request:', query);
    
    if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      console.error('Google Search API key or Search Engine ID not configured');
      return NextResponse.json({ 
        error: 'Search configuration missing',
        results: []
      }, { status: 500 });
    }
    
    // Add a random sleep between 500ms and 2000ms to prevent hitting rate limits
    const sleepTime = Math.floor(Math.random() * 1500) + 500;
    await new Promise(resolve => setTimeout(resolve, sleepTime));
    
    // Build the search URL for image search
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.append('key', GOOGLE_SEARCH_API_KEY);
    searchUrl.searchParams.append('cx', GOOGLE_SEARCH_ENGINE_ID);
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('searchType', 'image'); // This enables image search
    searchUrl.searchParams.append('num', '5'); // Request 5 images instead of 10 to conserve quota
    
    console.log('Request URL:', searchUrl.toString().replace(GOOGLE_SEARCH_API_KEY, '[REDACTED]'));
    
    // Make the request
    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log('Image search response status:', response.status, response.statusText);
    
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limit hit
        console.error('Google Image Search API rate limit exceeded - returning empty results');
        return NextResponse.json({ 
          error: 'Rate limit exceeded',
          status: 429,
          results: []
        }, { status: 429 });
      }
      
      const errorData = await response.json();
      console.error('Google Image Search API error:', JSON.stringify(errorData, null, 2));
      
      // Extract more specific error information if available
      const errorMessage = errorData.error?.message || `${response.status} ${response.statusText}`;
      const errorReason = errorData.error?.errors?.[0]?.reason || 'unknown';
      
      return NextResponse.json({ 
        error: `Image search failed: ${errorMessage} (${errorReason})`,
        errorDetails: errorData,
        results: []
      }, { status: response.status });
    }
    
    const data = await response.json();
    console.log('Image search results received:', data.searchInformation?.totalResults || 'unknown', 'total results');
    
    // If we didn't get any items, return empty results
    if (!data.items || data.items.length === 0) {
      console.log('No image results found');
      return NextResponse.json({
        results: []
      });
    }
    
    // Format the results specifically for images
    const formattedResults = data.items?.map((item: any) => ({
      title: item.title,
      link: item.link, // This is the direct image URL
      thumbnail: item.image?.thumbnailLink,
      source: item.displayLink,
      width: item.image?.width,
      height: item.image?.height
    })) || [];
    
    return NextResponse.json({
      results: formattedResults
    });
    
  } catch (error) {
    console.error('Error in Google image search API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown image search error',
      results: []
    }, { status: 500 });
  }
} 