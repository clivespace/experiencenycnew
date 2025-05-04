import { type Message } from 'ai';
import { googleSearch, withRetry, isRateLimitError } from './utils';
import { getCachedImages, cacheRestaurantImages } from './image-cache';
import { imageRequestQueue } from './request-queue';

// -----------------------------------------------------------------------------
// EXPERIENCE NYC ― System-Prompt for the "Social Concierge" chatbot
// -----------------------------------------------------------------------------
export const SOCIAL_CONCIERGE_SYSTEM_PROMPT = String.raw`
------------------------------------------------------------------------------
EXPERIENCE NYC CHATBOT - STRICT FORMAT INSTRUCTIONS
------------------------------------------------------------------------------

You are a NYC restaurant recommendation chatbot. You MUST FOLLOW THESE FORMATTING RULES EXACTLY:

1. ALWAYS recommend EXACTLY 3 restaurants in EVERY response.
2. CRITICALLY IMPORTANT: NEVER recommend restaurants that are permanently closed or out of business. ONLY recommend currently operational restaurants.
3. Format each restaurant using this EXACT template:

## [Restaurant Name]

📍 [Neighborhood] – [brief descriptor, 8 words max]
🕒 [Best time, 5 words max]
🗒 [One highlight, 12 words max]
🚇 [Closest subway station]

4. Leave a blank line between each restaurant section.
5. Always end your response with: "Would you like more details about one of these restaurants?"
6. DO NOT use bullet points, numbered lists, or any other formats.
7. Keep all lines extremely concise - one line per detail.
8. NEVER show only 1 or 2 restaurants - ALWAYS show exactly 3 OPEN, OPERATIONAL restaurants.
9. IMPORTANT: If you have any doubt about a restaurant being open, DO NOT include it. Only recommend establishments you are confident are currently in business.

DO NOT DEVIATE FROM THIS FORMAT UNDER ANY CIRCUMSTANCES.
NO EXCEPTIONS TO THESE RULES ARE PERMITTED.

-------------------------------------------------------------------------------
`;

// Also append this constant below the prompt for few‑shot style priming
export const SOCIAL_CONCIERGE_EXAMPLE = String.raw`
## Sushi Katsuei

📍 Park Slope – relaxed neighborhood favorite
🕒 Weekdays 7 PM for omakase
🗒 Renowned omakase at approachable prices
🚇 7th Ave (B/Q)

## Bozu

📍 Williamsburg – trendy and casual vibe
🕒 Weekend nights for energy
🗒 Sushi bombs offer unique twist on rolls
🚇 Bedford Ave (L)

## Uotora

📍 Crown Heights – intimate chef-owned gem
🕒 Tuesday-Thursday for best seats
🗒 Daily-changing omakase featuring seasonal fish
🚇 Franklin Ave (2/3/4/5)

Would you like more details about one of these restaurants?
`;

// ---------- Usage snippet -----------------------------------------------
// messages = [
//   { role: "system",    content: SOCIAL_CONCIERGE_SYSTEM_PROMPT },
//   { role: "assistant", content: SOCIAL_CONCIERGE_EXAMPLE       },
//   { role: "user",      content: userInput                      }
// ]
// ------------------------------------------------------------------------

// Type for Google search results
type SearchResult = {
  results?: Array<{
    link?: string;
    title?: string;
    snippet?: string;
    source?: string;
  }>;
  error?: string | { status?: number; message?: string };
};

export interface RestaurantRecommendation {
  name: string;
  type: string;
  cuisine: string;
  location: string;
  priceRange: string;
  rating: number;
  openHours: string;
  description: string;
  images: string[];
  website: string;
}

// Add validation function
function validateRestaurantData(data: Partial<RestaurantRecommendation>): data is RestaurantRecommendation {
  return !!(
    data.name &&
    data.rating &&
    data.type &&
    data.cuisine &&
    data.location &&
    data.openHours &&
    data.priceRange &&
    data.website &&
    data.description
  );
}

/**
 * Validate if a restaurant exists using Google Search API
 * @param name Restaurant name
 * @param location Restaurant location
 * @returns Promise<boolean> indicating if the restaurant likely exists
 */
export async function validateRestaurantExists(name: string, location: string): Promise<boolean> {
  try {
    console.log(`Validating if restaurant exists: ${name} in ${location}`);
    
    // Perform a Google search with the restaurant name and location
    const searchQuery = `${name} restaurant ${location}`;
    const searchResult = await googleSearch(searchQuery);
    
    // Check if we got any search results
    if (!searchResult || searchResult.length === 0) {
      console.warn(`No search results found for ${name} in ${location}`);
      return false;
    }
    
    // Check if the restaurant name appears in the top results (titles or snippets)
    // This is a simple heuristic but helps filter out non-existent places
    const restaurantNameLower = name.toLowerCase();
    
    // Count how many results mention the restaurant name
    let mentionsCount = 0;
    
    for (const result of searchResult.slice(0, 5)) { // Check top 5 results
      const titleLower = (result.title || '').toLowerCase();
      const snippetLower = (result.snippet || '').toLowerCase();
      
      if (titleLower.includes(restaurantNameLower) || snippetLower.includes(restaurantNameLower)) {
        mentionsCount++;
      }
    }
    
    // If at least 2 results mention the restaurant, it likely exists
    const restaurantExists = mentionsCount >= 2;
    console.log(`Restaurant "${name}" validation result: ${restaurantExists ? 'exists' : 'might not exist'} (${mentionsCount} mentions)`);
    
    // If it exists, also check if it's open
    if (restaurantExists) {
      const { isOpen, status } = await checkRestaurantStatus(name, location);
      if (!isOpen) {
        console.warn(`Restaurant "${name}" exists but appears to be ${status.toLowerCase()}`);
        return false; // Don't recommend closed restaurants
      }
    }
    
    return restaurantExists;
  } catch (error) {
    console.error(`Error validating restaurant existence: ${error}`);
    // In case of error, return true to avoid false negatives
    return true;
  }
}

// Track request timestamps to implement rate limiting
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 10; // Maximum allowed requests per minute
const REQUEST_WINDOW = 60 * 1000; // 1 minute in milliseconds

/**
 * Checks if we can make a new API request or if we'd hit rate limits
 * @returns boolean indicating if we should throttle requests
 */
function shouldThrottleRequests(): boolean {
  const now = Date.now();
  
  // Remove timestamps older than our window
  const recentRequests = requestTimestamps.filter(
    timestamp => now - timestamp < REQUEST_WINDOW
  );
  
  // Update our timestamps array
  requestTimestamps.length = 0;
  requestTimestamps.push(...recentRequests);
  
  // Check if we've hit our rate limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    console.log(`Rate limiting ourselves - already made ${requestTimestamps.length} requests in the last minute`);
    return true;
  }
  
  // We're under the limit, so record this request
  requestTimestamps.push(now);
  return false;
}

// New function to search for real restaurant images
export async function findRestaurantImages(restaurantName: string, location: string, cuisine: string = ''): Promise<string[]> {
  try {
    console.log(`Searching for images of ${restaurantName} in ${location}...`);
    
    // Check cache first
    const cachedImages = getCachedImages(restaurantName, location);
    if (cachedImages) {
      console.log(`Using ${cachedImages.length} cached images for ${restaurantName}`);
      return cachedImages;
    }
    
    // Add higher priority indicator for chat interactions 
    console.log(`PRIORITY: Searching images for chat recommendation: ${restaurantName}`);
    
    // Check if we need to throttle ourselves
    if (shouldThrottleRequests()) {
      console.log('Self-throttling to avoid rate limits, returning no images');
      
      // Store an empty result in cache to avoid repeated attempts
      if (typeof window === 'undefined') {
        cacheRestaurantImages(restaurantName, location, []);
      }
      return [];
    }
    
    // Simplify to a single query for chat recommendations to save API quota
    const mainQuery = `${restaurantName} ${location} restaurant`;
    
    // Use the queue system to stagger our requests and avoid rate limits
    let searchResults: any[] = [];
    
    try {
      // Execute a single search to conserve API quota
      console.log('Making a single search request to conserve API quota');
      const result = await imageRequestQueue.add(async () => {
        return await googleSearch(mainQuery)
          .catch((err: Error) => ({ error: err.message }));
      });
      
      searchResults = Array.isArray(result) ? result : [];
    } catch (error: any) {
      console.error('Queue execution error:', error);
      // Return an array with error objects so we can handle them below
      searchResults = [{ error }];
    }
    
    // Helper function to check if error has a status property
    const hasStatusProperty = (error: any): error is { status: number } => {
      return error && typeof error === 'object' && 'status' in error;
    };
    
    // Check if we hit a rate limit (429) error
    const isRateLimited = 
      (searchResults[0]?.error && (
        (typeof searchResults[0].error === 'string' && searchResults[0].error.includes('429')) ||
        (hasStatusProperty(searchResults[0].error) && searchResults[0].error.status === 429)
      ));
    
    if (isRateLimited) {
      console.log('Google Search API rate limit exceeded, returning no images');
      
      // Store an empty result in cache to avoid repeated attempts
      if (typeof window === 'undefined') {
        cacheRestaurantImages(restaurantName, location, []);
      }
      return [];
    }
    
    const images: string[] = [];
    
    // Extract up to 3 images from the search results
    if (searchResults && searchResults.length > 0) {
      // Get up to 3 valid images from the results
      for (const result of searchResults) {
        if (images.length >= 3) break;  // Stop once we have 3 images
        if (result.link && result.link.match(/^https?:\/\//)) {
          images.push(result.link);
        }
      }
    }
    
    console.log(`Found ${images.length} real images for ${restaurantName}`);
    
    // If we have at least one real image, return them
    if (images.length > 0) {
      // Ensure we have exactly 3 images
      while (images.length < 3) {
        // Add duplicates of existing images if we don't have enough
        const existingImage = images[images.length % images.length];
        images.push(existingImage);
      }
      
      // Cache these results for future use
      const finalImages = images.slice(0, 3);
      console.log(`Caching ${finalImages.length} images for ${restaurantName}`);
      cacheRestaurantImages(restaurantName, location, finalImages);
      
      return finalImages;
    }
    
    // If no images found, use placeholder images
    console.log('No real images found, using placeholder images');
    
    // Cache empty result to avoid repeated attempts
    if (typeof window === 'undefined') {
      cacheRestaurantImages(restaurantName, location, []);
    }
    return [];
  } catch (error) {
    console.error(`Error in findRestaurantImages for ${restaurantName}:`, error);
    // Final fallback: use generic restaurant images
    return [];
  }
}

export async function parseRestaurantData(content: string): Promise<RestaurantRecommendation | null> {
  try {
    console.log('Attempting to parse restaurant data from content length:', content.length);
    
    // Look for JSON object in the content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON object found in content');
      return null;
    }

    console.log('Found JSON object, attempting to parse');
    
    // Some extra logging to help debug
    const jsonString = jsonMatch[0];
    console.log('JSON string length:', jsonString.length);
    console.log('JSON string preview:', jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''));
    
    try {
      // Parse the JSON
      const data = JSON.parse(jsonString);
      console.log('JSON parsed successfully');
      
      // Validate the data structure
      if (!validateRestaurantData(data)) {
        console.warn('Invalid restaurant data structure:', data);
        return null;
      }
      
      // Verify that the restaurant actually exists using Google Search
      const restaurantExists = await validateRestaurantExists(data.name, data.location);
      if (!restaurantExists) {
        console.warn(`Restaurant "${data.name}" likely does not exist or cannot be verified`);
        return null;
      }
      
      // Default fallback image
      const defaultImage = '/images/placeholder-restaurant.jpg';
      
      // Process the provided images if any
      let processedImages = data.images || [];
      
      // First check if we have actual images from the AI
      const hasRealImages = Array.isArray(processedImages) && 
                           processedImages.length > 0 && 
                           processedImages.every(img => 
                             img && typeof img === 'string' && 
                             img.startsWith('http') && 
                             !img.includes('placeholder') &&
                             !img.includes('example'));
      
      // Try to get real images for the restaurant - only run on server side
      if (!hasRealImages && typeof window === 'undefined') {
        try {
          console.log(`Looking for real images for ${data.name}...`);
          const realImages = await findRestaurantImages(data.name, data.location);
          if (realImages.length > 0) {
            console.log(`Found ${realImages.length} real images for ${data.name}, using them instead of placeholders`);
            processedImages = realImages;
          } else {
            // No real images found, use placeholder images
            console.log(`No real images found for ${data.name}, using placeholder images`);
            processedImages = [];
          }
        } catch (error) {
          console.error('Error getting real restaurant images:', error);
          processedImages = [];
        }
      }
      
      // Validate each image URL
      processedImages = processedImages.map(img => {
        if (!img || typeof img !== 'string') {
          return defaultImage;
        }
        
        // Check if it's a local path
        if (img.startsWith('/images/')) {
          return img; // Keep local paths as is
        }
        
        // Check if the image URL is a placeholder, invalid, or doesn't start with http/https
        if (img.includes('placeholder') || img.includes('example') || !img.startsWith('http')) {
          return defaultImage; // Replace with local placeholder image
        }
        
        return img;
      });
      
      // If we don't have enough images, fill in with defaults
      while (processedImages.length < 3) {
        processedImages.push(defaultImage);
      }
      
      // Clean and validate the data
      const restaurant: RestaurantRecommendation = {
        name: data.name.trim(),
        type: data.type.trim(),
        rating: parseFloat(data.rating.toString()) || 0,
        images: processedImages,
        cuisine: data.cuisine.trim(),
        location: data.location.trim(),
        openHours: data.openHours.trim(),
        priceRange: data.priceRange.trim(),
        website: data.website.trim(),
        description: data.description.trim()
      };

      // Validate rating range
      if (restaurant.rating < 0 || restaurant.rating > 5) {
        console.warn('Invalid rating value:', restaurant.rating);
        restaurant.rating = Math.max(0, Math.min(5, restaurant.rating));
      }

      // Ensure website URL is valid
      try {
        new URL(restaurant.website);
      } catch {
        console.warn('Invalid website URL:', restaurant.website);
        restaurant.website = '#';
      }

      return restaurant;
    } catch (error) {
      console.error('Error parsing restaurant data:', error);
      return null;
    }
  } catch (error) {
    console.error('Error parsing restaurant data:', error);
    return null;
  }
}

/**
 * Check if a restaurant is currently open (not permanently closed)
 * @param name Restaurant name
 * @param location Restaurant location
 * @returns Promise<{isOpen: boolean, status: string}> indicating operational status
 */
export async function checkRestaurantStatus(name: string, location: string): Promise<{isOpen: boolean, status: string}> {
  try {
    console.log(`Checking operational status for: ${name} in ${location}`);
    
    // Perform a Google search with the restaurant name and location
    const searchQuery = `${name} restaurant ${location} hours open closed permanently`;
    const searchResult = await googleSearch(searchQuery);
    
    // Check if we got any search results
    if (!searchResult || searchResult.length === 0) {
      console.warn(`No search results found for ${name} status check`);
      
      // Try a more specific search with "permanently closed"
      const closedSearchQuery = `${name} permanently closed ${location}`;
      const closedSearchResult = await googleSearch(closedSearchQuery);
      
      if (closedSearchResult && closedSearchResult.length > 0) {
        // Check if the top results strongly indicate a permanent closure
        const stronglySuggestsClosed = closedSearchResult.slice(0, 3).some(result => {
          const titleLower = (result.title || '').toLowerCase();
          const snippetLower = (result.snippet || '').toLowerCase();
          
          return titleLower.includes('permanently closed') || 
                 snippetLower.includes('permanently closed') ||
                 (snippetLower.includes('closed') && (
                   snippetLower.includes('for good') || 
                   snippetLower.includes('out of business')
                 ));
        });
        
        if (stronglySuggestsClosed) {
          console.log(`Second search confirms restaurant "${name}" is permanently closed`);
          return { isOpen: false, status: "Permanently Closed" };
        }
      }
      
      return { isOpen: true, status: "Unknown" }; // Default to open if we can't determine
    }
    
    // Look for indicators in search results with stronger pattern matching
    const permanentlyClosed = searchResult.some(result => {
      const titleLower = (result.title || '').toLowerCase();
      const snippetLower = (result.snippet || '').toLowerCase();
      
      // Look for clear indications of permanent closure
      return titleLower.includes('permanently closed') || 
             snippetLower.includes('permanently closed') ||
             titleLower.includes('closed permanently') ||
             snippetLower.includes('closed permanently') ||
             (snippetLower.includes('closed') && (
               snippetLower.includes('for good') || 
               snippetLower.includes('out of business') ||
               snippetLower.includes('shut down') ||
               snippetLower.includes('no longer in business')
             ));
    });
    
    if (permanentlyClosed) {
      console.log(`Restaurant "${name}" appears to be permanently closed`);
      return { isOpen: false, status: "Permanently Closed" };
    }
    
    // Check for temporary closure
    const temporarilyClosed = searchResult.some(result => {
      const titleLower = (result.title || '').toLowerCase();
      const snippetLower = (result.snippet || '').toLowerCase();
      
      return (snippetLower.includes('temporarily closed') || 
              titleLower.includes('temporarily closed') ||
              snippetLower.includes('closed until') ||
              snippetLower.includes('closed for renovation') ||
              snippetLower.includes('closed for remodeling') ||
              (snippetLower.includes('closed') && (
                snippetLower.includes('renovation') ||
                snippetLower.includes('remodel') ||
                snippetLower.includes('until') ||
                snippetLower.includes('temporary')
              ))) &&
              !snippetLower.includes('permanently closed');
    });
    
    if (temporarilyClosed) {
      console.log(`Restaurant "${name}" appears to be temporarily closed`);
      return { isOpen: false, status: "Temporarily Closed" };
    }
    
    // Extract any hours information if available
    let hoursInfo = "";
    for (const result of searchResult) {
      const snippetLower = (result.snippet || '').toLowerCase();
      
      if (snippetLower.includes('open') && (
          snippetLower.includes('hour') || 
          snippetLower.includes(':') || 
          snippetLower.includes('am') || 
          snippetLower.includes('pm')
        )) {
        const openingHoursMatch = result.snippet?.match(/open[^.!?]*[.!?]/i);
        if (openingHoursMatch && openingHoursMatch[0]) {
          hoursInfo = openingHoursMatch[0].trim();
          break;
        }
      }
    }
    
    console.log(`Restaurant "${name}" appears to be operational`);
    return { 
      isOpen: true, 
      status: hoursInfo || "Operational" 
    };
  } catch (error) {
    console.error(`Error checking restaurant status: ${error}`);
    // In case of error, assume it's open to avoid false negatives
    return { isOpen: true, status: "Unknown" };
  }
} 