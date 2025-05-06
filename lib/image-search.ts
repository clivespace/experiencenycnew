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
    
    // In server components, use direct API calls
    if (typeof window === 'undefined') {
      try {
        return await safeImageSearch(query, page);
      } catch (serverErr) {
        console.error('Server-side image search error:', serverErr);
        return getFallbackImages();
      }
    } 
    
    // In client components with dynamic mode, use the API route
    try {
      const res = await fetch(
        `/api/image-proxy?q=${encodeURIComponent(query)}&page=${page}`,
        { cache: 'no-store' } // Disable caching for dynamic content
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
      // For static export, just return the image link directly
      if (process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true') {
        return images[0].imageLink;
      }
      
      // Handle external URLs through the proxy
      if (images[0].imageLink.startsWith('http')) {
        return `/api/image-proxy/image?url=${encodeURIComponent(images[0].imageLink)}`
      }
      
      // Local image paths can be used directly
      return images[0].imageLink;
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
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!unsplashKey) {
    throw new Error('Unsplash API key not configured');
  }
  
  console.log(`Making Unsplash API request for: "${query}"`);
  
  const res = await fetch(
    `https://api.unsplash.com/search/photos?` +
      `client_id=${unsplashKey}` +
      `&query=${encodeURIComponent(query)}` +
      `&per_page=${per}`
  );
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Unsplash error ${res.status}: ${errorText}`);
  }
  
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
  
  if (!data.results || data.results.length === 0) {
    throw new Error('No results from Unsplash API');
  }
  
  console.log(`Found ${data.results.length} Unsplash results for "${query}"`);
  
  return data.results.map((img) => ({
    title: img.description ?? img.alt_description ?? "Unsplash image",
    imageLink: img.urls.raw,
    thumbnailLink: img.urls.thumb,
    contextLink: img.links.html,
    source: 'unsplash' as const
  }));
};

/**
 * Google image search function
 * Makes a single call to Google Custom Search API to fetch up to 10 images per request
 * Requires GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables
 */
const googleImageSearch = async (query: string, start = 1) => {
  // Check if API keys are available
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCseId = process.env.GOOGLE_CSE_ID;
  const hasApiKeys = !!googleApiKey && !!googleCseId;
  
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
    `key=${googleApiKey}` +
    `&cx=${googleCseId}` +
    `&q=${encodeURIComponent(query)}` +
    `&searchType=image&num=10&start=${start}`;
  
  console.log(`Using Google API keys: ${googleApiKey?.substring(0, 5)}...`);
  
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
  
  // Check if we got any results
  if (!data.items || data.items.length === 0) {
    throw new Error("No Google results found");
  }
  
  // Map the results
  const results = data.items.map((img) => ({
    title: img.title,
    imageLink: img.link,
    thumbnailLink: img.image.thumbnailLink,
    contextLink: img.image.contextLink,
    source: 'google' as const
  }));
  
  // Cache the results for future use
  cache.set(cacheKey, results);
  
  return results;
};

// Fallback images when all APIs fail
function getFallbackImages(): ImageResult[] {
  console.log('Using static fallback images');
  
  // Return multiple different images as fallback
  return [
    { 
      title: "New York Restaurant", 
      imageLink: "/images/restaurant-1.jpg",
      thumbnailLink: "/images/restaurant-1.jpg",
      contextLink: "#",
      source: 'fallback' as const
    },
    { 
      title: "French Restaurant", 
      imageLink: "/images/french-1.jpg",
      thumbnailLink: "/images/french-1.jpg",
      contextLink: "#",
      source: 'fallback' as const
    },
    { 
      title: "Italian Restaurant", 
      imageLink: "/images/italian-1.jpg",
      thumbnailLink: "/images/italian-1.jpg",
      contextLink: "#",
      source: 'fallback' as const
    },
    { 
      title: "Japanese Restaurant", 
      imageLink: "/images/japanese-1.jpg",
      thumbnailLink: "/images/japanese-1.jpg",
      contextLink: "#",
      source: 'fallback' as const
    }
  ];
}

/**
 * Safe image search with fallback
 * Tries Google first, falls back to Unsplash on quota issues
 */
export const safeImageSearch = async (query: string, start = 1) => {
  // Create enhanced query for restaurant images
  const enhancedQuery = query.includes('restaurant') ? query : `${query} restaurant`;
  
  try {
    // Check if Google API keys are available
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const googleCseId = process.env.GOOGLE_CSE_ID;
    const hasGoogleApiKeys = !!googleApiKey && !!googleCseId;
    
    if (!hasGoogleApiKeys) {
      console.log(`Skipping Google search and using Unsplash for "${enhancedQuery}" (no API keys)`);
      // Go directly to Unsplash if Google API keys aren't configured
      const per = Number(process.env.UNSPLASH_FALLBACK_PER_PAGE ?? 10);
      
      // Check if Unsplash API key is available
      if (process.env.UNSPLASH_ACCESS_KEY) {
        try {
          console.log(`Using Unsplash with access key: ${process.env.UNSPLASH_ACCESS_KEY?.substring(0, 5)}...`);
          const results = await unsplashSearch(enhancedQuery, per);
          
          if (results.length > 0) {
            return results;
          }
          
          throw new Error('No Unsplash results found');
        } catch (unsplashErr) {
          console.error(`Unsplash search failed: ${unsplashErr}`);
          // Return fallback images
          return getFallbackImages();
        }
      } else {
        console.log('No API keys available for either Google or Unsplash');
        // If no Unsplash key either, return fallback images
        return getFallbackImages();
      }
    }
    
    // If Google API keys are available, try Google first
    console.log(`Attempting Google image search for "${enhancedQuery}"`);
    return await googleImageSearch(enhancedQuery, start);  // primary provider
  } catch (err: any) {
    console.warn(`Google search failed: ${err.message}`);
    
    if (err.message.includes("429") || err.message.includes("quota") || 
        err.message.includes("No Google results") || err.message.includes("API keys not configured")) {
      // Google quota hit or no results → use Unsplash
      console.log(`Falling back to Unsplash for query: "${enhancedQuery}"`);
      const per = Number(process.env.UNSPLASH_FALLBACK_PER_PAGE ?? 10);
      
      // Check if Unsplash API key is available
      if (process.env.UNSPLASH_ACCESS_KEY) {
        try {
          console.log(`Using Unsplash with access key: ${process.env.UNSPLASH_ACCESS_KEY?.substring(0, 5)}...`);
          const results = await unsplashSearch(enhancedQuery, per);
          
          // Cache unsplash results too
          if (results.length > 0) {
            cache.set(`${enhancedQuery}-${start}`, results);
            return results;
          }
          
          console.log('No Unsplash results found either, using fallbacks');
          return getFallbackImages();
        } catch (unsplashErr) {
          console.error(`Unsplash fallback also failed: ${unsplashErr}`);
          // Return placeholder as final fallback
          return getFallbackImages();
        }
      } else {
        console.log('No Unsplash access key available');
        // If no Unsplash key either, return fallback images
        return getFallbackImages();
      }
    }
    
    console.error(`Unhandled error in image search: ${err.message}`);
    return getFallbackImages(); // Return fallbacks for any unexpected error
  }
}; 