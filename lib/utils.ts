import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from 'zod';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Default Google Search API configuration
// In production, use environment variables instead of hardcoded values
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_API_KEY || '';
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_CSE_ID || '';

// Schema for Google Search API response
const GoogleSearchResultSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string(),
});

export type GoogleSearchResult = z.infer<typeof GoogleSearchResultSchema>;

/**
 * Test function for the Google Search API
 * Call this directly to verify API configuration
 */
export async function testGoogleSearch() {
  console.log('=== Testing Google Search API ===');
  
  console.log('API Key present:', !!GOOGLE_SEARCH_API_KEY);
  console.log('API Key prefix:', GOOGLE_SEARCH_API_KEY?.substring(0, 10) + '...');
  console.log('Search Engine ID:', GOOGLE_SEARCH_ENGINE_ID);
  
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.error('❌ Missing configuration');
    return { success: false, error: 'Missing configuration' };
  }
  
  try {
    // Test with a simple query
    const testQuery = 'best restaurant NYC';
    console.log('Making test search for:', testQuery);
    
    const results = await googleSearch(testQuery);
    
    if (!Array.isArray(results)) {
      console.error('❌ Search failed: Unexpected result type');
      return { success: false, error: 'Unexpected result type' };
    }
    
    if (results.length > 0) {
      console.log('✅ Search successful:', results.length, 'results found');
      console.log('First result:', results[0]?.title);
      return { success: true, resultCount: results.length };
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
export async function googleSearch(query: string): Promise<GoogleSearchResult[]> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !searchEngineId) {
      console.error('Missing Google Search API configuration');
      return [];
    }

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Google Search API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // Validate and parse the search results
    const results = data.items?.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    })) || [];

    return results;
  } catch (error) {
    console.error('Error performing Google search:', error);
    return [];
  }
}

/**
 * Utility for retrying failed API requests with exponential backoff
 */

/**
 * Retries a function with exponential backoff on failure
 * @param fn The async function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Initial delay in ms before first retry
 * @returns Result of the function or throws the last error
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error)) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

/**
 * Checks if an error is due to rate limiting (429)
 */
export function isRateLimitError(error: any): boolean {
  return error?.status === 429 || 
         error?.message?.includes('429') || 
         error?.message?.includes('rate limit');
}
