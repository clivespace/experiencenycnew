import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get the query parameter if provided
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || 'best restaurants in NYC';
    
    console.log('Direct Google Search API test endpoint called');
    
    // Get API credentials
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    console.log('API Key present:', !!apiKey);
    console.log('Search Engine ID:', searchEngineId);
    
    if (!apiKey || !searchEngineId) {
      return NextResponse.json({
        status: 'error',
        message: 'Google Search API credentials not configured',
        details: 'Please ensure GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID are set in your .env.local file'
      }, { status: 400 });
    }
    
    // Build the search URL manually
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('cx', searchEngineId);
    searchUrl.searchParams.append('q', query);
    
    console.log('Making direct Google Search request with URL:');
    console.log(searchUrl.toString().replace(apiKey, '[REDACTED_API_KEY]'));
    
    // Make the request
    const response = await fetch(searchUrl.toString());
    
    console.log('Response status:', response.status, response.statusText);
    
    // Get the response data
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error response:', JSON.stringify(data, null, 2));
      
      return NextResponse.json({
        status: 'error',
        message: `Google Search API error: ${response.status} ${response.statusText}`,
        error: data,
        request: {
          url: searchUrl.toString().replace(apiKey, '[REDACTED_API_KEY]'),
          query
        }
      }, { status: response.status });
    }
    
    // Format successful response
    return NextResponse.json({
      status: 'success',
      message: 'Direct Google Search API test successful',
      searchInfo: data.searchInformation,
      resultCount: data.items?.length || 0,
      results: data.items?.slice(0, 3).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet
      })) || [],
      request: {
        url: searchUrl.toString().replace(apiKey, '[REDACTED_API_KEY]'),
        query
      }
    });
    
  } catch (error: any) {
    console.error('Direct Google Search Test Error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Unknown error',
      type: error.constructor.name,
      details: 'An unexpected error occurred during direct Google Search API testing'
    }, { status: 500 });
  }
} 