import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Test function for the Google Search API
 * Call this directly to verify API configuration
 */
export async function testGoogleSearch() {
  console.log('=== Testing Google Search API ===');
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  console.log('API Key present:', !!apiKey);
  console.log('API Key prefix:', apiKey?.substring(0, 10) + '...');
  console.log('Search Engine ID:', searchEngineId);
  
  if (!apiKey || !searchEngineId) {
    console.error('❌ Missing configuration');
    return { success: false, error: 'Missing configuration' };
  }
  
  try {
    // Test with a simple query
    const testQuery = 'best restaurant NYC';
    console.log('Making test search for:', testQuery);
    
    const result = await googleSearch(testQuery);
    
    if (result.error) {
      console.error('❌ Search failed:', result.error);
      return { success: false, error: result.error };
    }
    
    if (result.results && result.results.length > 0) {
      console.log('✅ Search successful:', result.results.length, 'results found');
      console.log('First result:', result.results[0]?.title);
      return { success: true, resultCount: result.results.length };
    } else {
      console.log('⚠️ Search returned no results');
      return { success: true, resultCount: 0 };
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Google Custom Search API integration
 * @param query Search query
 * @returns Array of search results with titles, links, and snippets
 */
export async function googleSearch(query: string) {
  try {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    console.log('Google Search Configuration:');
    console.log('- API Key present:', !!apiKey);
    console.log('- Search Engine ID:', searchEngineId);
    
    if (!apiKey || !searchEngineId) {
      console.error('Google Search API key or Search Engine ID not configured');
      return { 
        error: 'Search configuration missing',
        results: []
      };
    }
    
    // Build the search URL - try the main Google Search API endpoint
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', query);
    
    console.log('Making Google Search request:', query);
    console.log('Request URL:', url.toString().replace(apiKey, '[REDACTED]'));
    
    // Make the request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log('Search response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Search API error:', JSON.stringify(errorData, null, 2));
      
      // Extract more specific error information if available
      const errorMessage = errorData.error?.message || `${response.status} ${response.statusText}`;
      const errorReason = errorData.error?.errors?.[0]?.reason || 'unknown';
      const errorDetails = errorData.error?.errors?.[0]?.message || '';
      
      console.error(`Google Search API error details - Reason: ${errorReason}, Message: ${errorMessage}`);
      
      return { 
        error: `Search failed: ${errorMessage} (${errorReason})`,
        errorDetails: errorData,
        results: []
      };
    }
    
    const data = await response.json();
    console.log('Search results received:', data.searchInformation?.totalResults || 'unknown', 'total results');
    
    // Format the results
    const formattedResults = data.items?.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: item.displayLink
    })) || [];
    
    console.log('Formatted', formattedResults.length, 'search results');
    
    return {
      results: formattedResults
    };
  } catch (error) {
    console.error('Error in Google search:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown search error',
      results: []
    };
  }
}
