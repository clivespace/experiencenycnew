import { NextResponse } from 'next/server';
import { testGoogleSearch, googleSearch } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    // Get the query parameter if provided
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || 'best restaurants in NYC';
    
    console.log('Test Google Search API endpoint called');
    console.log('Environment variables:');
    console.log('- GOOGLE_SEARCH_API_KEY present:', !!process.env.GOOGLE_SEARCH_API_KEY);
    console.log('- GOOGLE_SEARCH_ENGINE_ID:', process.env.GOOGLE_SEARCH_ENGINE_ID);
    
    // First run the automated test
    const testResult = await testGoogleSearch();
    
    // If a specific query was provided, also test with that
    let queryResult = null;
    if (query && query !== 'best restaurants in NYC') {
      console.log('Testing with user-provided query:', query);
      queryResult = await googleSearch(query);
    }
    
    return NextResponse.json({
      status: testResult.success ? 'success' : 'error',
      message: testResult.success 
        ? `Google Search API is working correctly (found ${testResult.resultCount} results)`
        : `Google Search API test failed: ${testResult.error}`,
      testResult,
      queryResult: queryResult ? {
        query,
        error: queryResult.error,
        resultCount: queryResult.results?.length || 0,
        results: queryResult.results?.slice(0, 3) || [] // Only send the first 3 results to keep response size reasonable
      } : null,
      config: {
        apiKeyPresent: !!process.env.GOOGLE_SEARCH_API_KEY,
        apiKeyPrefix: process.env.GOOGLE_SEARCH_API_KEY?.substring(0, 10) + '...',
        searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID
      }
    });
    
  } catch (error: any) {
    console.error('Google Search Test Error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Unknown error',
      type: error.constructor.name,
      details: 'An unexpected error occurred while testing the Google Search API'
    }, { status: 500 });
  }
} 