import { NextResponse } from 'next/server';
import { testGoogleSearch, googleSearch } from '@/lib/utils';

export const dynamic = "force-static";

export async function GET(request: Request) {
  try {
    // Parse the URL to get search query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || 'Le Bernardin restaurant New York';
    
    console.log('Testing Google Search with query:', query);
    
    // First check if configuration is working
    const testResult = await testGoogleSearch();
    
    // If the test fails, don't attempt an actual search
    if (!testResult.success) {
      return NextResponse.json({ 
        test: testResult,
        error: 'Google Search API configuration is not valid'
      }, { status: 500 });
    }
    
    // If test is successful, try the actual search
    let queryResult;
    try {
      queryResult = await googleSearch(query);
    } catch (err) {
      queryResult = { error: `Search execution error: ${err instanceof Error ? err.message : String(err)}` };
    }
    
    // Return both test and search results
    return NextResponse.json({
      test: testResult,
      search: queryResult,
      query
    });
    
  } catch (error) {
    console.error('Error in test-google-search API:', error);
    return NextResponse.json({ 
      error: `API error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 