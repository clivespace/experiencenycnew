import { LRUCache } from "lru-cache";

// Initialize an in-memory LRU cache for image search results
// This saves API quota by caching identical queries for 24 hours
const cache = new LRUCache<string, any>({ 
  max: 500,  // Store up to 500 queries
  ttl: 1000 * 60 * 60 * 24  // Cache for 24 hours
});

/**
 * Interface for image search results
 */
export interface ImageResult {
  title: string
  imageLink: string
  thumbnailLink: string
  contextLink: string
  source?: 'google' | 'unsplash' | 'fallback'
}

/**
 * Search for restaurant images using our optimized API
 * 
 * This function fetches restaurant images from the Google Custom Search API
 * through our optimized endpoint that includes caching and fallbacks.
 * 
 * @param query - The restaurant name to search for
 * @param page - The page number (1-based, defaults to 1)
 * @returns Array of image results
 */
export async function searchRestaurantImages(
  query: string, 
  page: number = 1
): Promise<ImageResult[]> {
  if (!query.trim()) {
    return []
  }

  try {
    // For static export, return fallback images directly
    if (process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true') {
      return getFallbackImages();
    }
    
    // Use direct access to the Google and Unsplash APIs when in a server component
    if (typeof window === 'undefined') {
      try {
        // Try direct server-side import of the relevant module
        const { safeImageSearch } = require('@/app/api/image-proxy/route');
        // Call the search function directly
        return await safeImageSearch(query, (page - 1) * 10 + 1);
      } catch (err) {
        // Fall back to static images if module import fails
        return getFallbackImages();
      }
    } 
    
    // In client components, use the API route
    try {
      const res = await fetch(
        `/api/image-proxy?q=${encodeURIComponent(query)}&page=${page}`,
        { next: { revalidate: 3600 } } // Cache for 1 hour
      )

      if (!res.ok) {
        console.error(`Image search error: ${res.status} ${res.statusText}`)
        return getFallbackImages();
      }

      return await res.json()
    } catch (fetchErr) {
      // Handle fetch errors in client components
      console.error('Fetch error:', fetchErr);
      return getFallbackImages();
    }
  } catch (error) {
    console.error('Error fetching restaurant images:', error)
    return getFallbackImages();
  }
}

/**
 * Get a single optimized restaurant image URL
 * 
 * This is a convenience function that returns just the first image URL
 * from a restaurant image search, or falls back to a placeholder
 * 
 * @param query - The restaurant name to search for
 * @returns Promise with an image URL string
 */
export async function getRestaurantImageUrl(query: string): Promise<string> {
  try {
    const images = await searchRestaurantImages(query)
    
    if (images.length > 0) {
      // Return the first image URL through our proxy
      return `/api/image-proxy/image?url=${encodeURIComponent(images[0].imageLink)}`
    }
    
    // Fallback to placeholder
    return '/placeholder.jpg'
  } catch (error) {
    console.error('Error getting restaurant image:', error)
    return '/placeholder.jpg'
  }
}

/**
 * Unsplash image search function
 * Provides a fallback when Google API reaches quota limits
 */
const unsplashSearch = async (query: string, per = 10) => {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?` +
      `client_id=${process.env.UNSPLASH_ACCESS_KEY}` +
      `&query=${encodeURIComponent(query)}` +
      `&per_page=${per}`
  );
  if (!res.ok) throw new Error(`Unsplash error ${res.status}`);
  const data = await res.json() as { 
    results: Array<{
      description: string | null;
      alt_description: string | null;
      urls: {
        raw: string;
        thumb: string;
      };
      links: {
        html: string;
      }
    }>
  };
  return data.results.map((img) => ({
    title: img.description ?? img.alt_description ?? "Unsplash image",
    imageLink: img.urls.raw,
    thumbnailLink: img.urls.thumb,
    contextLink: img.links.html,
    source: 'unsplash'
  }));
};

/**
 * Google image search function
 * Makes a single call to Google Custom Search API to fetch up to 10 images per request
 * Requires GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables
 */
const googleImageSearch = async (query: string, start = 1) => {
  // Check if API keys are available
  const hasApiKeys = !!process.env.GOOGLE_API_KEY && !!process.env.GOOGLE_CSE_ID;
  
  // Skip Google search if API keys are not available
  if (!hasApiKeys) {
    console.log("Skipping Google search: API keys not available");
    throw new Error("Google API keys not configured");
  }
  
  // Create a cache key from the query and start position
  const cacheKey = `${query}-${start}`;
  
  // Check if we have cached results
  const cachedResults = cache.get(cacheKey);
  if (cachedResults) {
    console.log(`Using cached results for query: "${query}" (start: ${start})`);
    return cachedResults;
  }
  
  // If not in cache, make the API request
  console.log(`Fetching from Google CSE API: "${query}" (start: ${start})`);
  const url =
    `https://www.googleapis.com/customsearch/v1?` +
    `key=${process.env.GOOGLE_API_KEY}` +
    `&cx=${process.env.GOOGLE_CSE_ID}` +
    `&q=${encodeURIComponent(query)}` +
    `&searchType=image&num=10&start=${start}`;
  const res = await fetch(url);
   
  // Handle quota exceeded (429) errors
  if (res.status === 429) {
    throw new Error(`Google API quota exceeded: 429`);
  }
  
  // Handle any other error response
  if (!res.ok) {
    throw new Error(`Google error ${res.status}`);
  }
  
  // Parse the response
  const data = await res.json() as { 
    items?: Array<{ 
      title: string; 
      link: string; 
      image: { 
        thumbnailLink: string; 
        contextLink: string; 
      } 
    }> 
  };
  
  // Map the results
  const results = data.items?.map((img) => ({
    title: img.title,
    imageLink: img.link,
    thumbnailLink: img.image.thumbnailLink,
    contextLink: img.image.contextLink,
    source: 'google' as const
  })) ?? [];
  
  // If no results, throw an error
  if (results.length === 0) {
    throw new Error(`No Google results found for query: "${query}"`);
  }
  
  // Store the results in cache before returning
  cache.set(cacheKey, results);
  return results;
};

// Fallback images when all APIs fail
function getFallbackImages() {
  return [{ 
    title: "API keys not configured", 
    imageLink: "/images/restaurant-1.jpg",
    thumbnailLink: "/images/restaurant-1.jpg",
    contextLink: "#",
    source: 'fallback' as const
  }];
}

/**
 * Safe image search with fallback
 * Tries Google first, falls back to Unsplash on quota issues
 */
export const safeImageSearch = async (query: string, start = 1) => {
  try {
    // Check if Google API keys are available
    const hasGoogleApiKeys = !!process.env.GOOGLE_API_KEY && !!process.env.GOOGLE_CSE_ID;
    if (!hasGoogleApiKeys) {
      console.log(`Skipping Google search and using Unsplash for "${query}" (no API keys)`);
      // Go directly to Unsplash if Google API keys aren't configured
      const per = Number(process.env.UNSPLASH_FALLBACK_PER_PAGE ?? 10);
      
      // Check if Unsplash API key is available
      if (process.env.UNSPLASH_ACCESS_KEY) {
        try {
          const results = await unsplashSearch(query, per);
          return results;
        } catch (unsplashErr) {
          console.error(`Unsplash search failed: ${unsplashErr}`);
          // Return fallback images
          return getFallbackImages();
        }
      } else {
        // If no Unsplash key either, return fallback images
        return getFallbackImages();
      }
    }
    
    // If Google API keys are available, try Google first
    return await googleImageSearch(query, start);          // primary provider
  } catch (err: any) {
    console.warn(`Google search failed: ${err.message}`);
    
    if (err.message.includes("429") || err.message.includes("quota") || 
        err.message.includes("No Google results") || err.message.includes("API keys not configured")) {
      // Google quota hit or no results → use Unsplash
      console.log(`Falling back to Unsplash for query: "${query}"`);
      const per = Number(process.env.UNSPLASH_FALLBACK_PER_PAGE ?? 10);
      
      // Check if Unsplash API key is available
      if (process.env.UNSPLASH_ACCESS_KEY) {
        try {
          const results = await unsplashSearch(query, per);
          // Cache unsplash results too
          cache.set(`${query}-${start}`, results);
          return results;
        } catch (unsplashErr) {
          console.error(`Unsplash fallback also failed: ${unsplashErr}`);
          // Return placeholder as final fallback
          return getFallbackImages();
        }
      } else {
        // If no Unsplash key either, return fallback images
        return getFallbackImages();
      }
    }
    throw err; // unknown error, bubble up
  }
}; 