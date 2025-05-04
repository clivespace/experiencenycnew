import { imageRequestQueue } from './request-queue';
import { getFallbackRestaurantImages } from './fallback-images';

// Types for restaurant data
export interface Restaurant {
  name: string;
  cuisine: string;
  address: string;
  rating: number;
  priceRange: string;
  website?: string;
  description?: string;
  images?: string[];
  neighborhood?: string;
  location?: string;
  id?: number | string;
  imageUrl?: string;
  image?: string;
}

/**
 * Find a single restaurant image using Google image search
 * Use with fallback system for rate limits
 */
export async function findRestaurantImage(restaurantName: string, location: string, specificQuery?: string): Promise<string | null> {
  try {
    const query = specificQuery 
      ? `${restaurantName} ${location} ${specificQuery}` 
      : `${restaurantName} ${location} restaurant`;
    
    console.log(`Searching for image: ${query}`);
    
    // googleImageSearch removed; just return null or a fallback
    return null;
  } catch (error: any) {
    console.error(`Error finding image for ${restaurantName}:`, error);
    if (error.response && error.response.status === 429) {
      console.log('Hit rate limit during image search, using fallback image');
    }
    return null;
  }
}

/**
 * Find multiple images for a restaurant with retries and fallbacks
 */
export async function findRestaurantImages(restaurant: Restaurant, location: string): Promise<string[]> {
  try {
    console.log(`Finding images for ${restaurant.name} in ${location}`);
    
    // Check for specific restaurant name fallbacks first
    const restaurantNameLower = restaurant.name.toLowerCase();
    if (restaurantNameLower === 'cosme') {
      console.log(`Using dedicated fallback images for ${restaurant.name}`);
      return getFallbackRestaurantImages('cosme');
    }
    
    // First attempt: try to find real images using staggered searches
    const imagePromises = [
      findRestaurantImage(restaurant.name, location, "interior"),
      findRestaurantImage(restaurant.name, location, "food"),
      findRestaurantImage(restaurant.name, location, "exterior")
    ];
    
    // Wait for all image searches to complete
    const images = await Promise.all(imagePromises);
    
    // Filter out nulls from failed searches
    const validImages = images.filter(img => img !== null) as string[];
    
    // If we have at least one valid image, return them
    if (validImages.length > 0) {
      console.log(`Found ${validImages.length} valid images for ${restaurant.name}`);
      return validImages;
    }
    
    // Fallback: use cuisine-based fallback images
    console.log(`Using fallback images for ${restaurant.name} (${restaurant.cuisine})`);
    return getFallbackRestaurantImages(restaurant.cuisine);
    
  } catch (error) {
    console.error(`Error in findRestaurantImages for ${restaurant.name}:`, error);
    
    // Final fallback: use generic restaurant images
    return getFallbackRestaurantImages('general');
  }
}

/**
 * Process a batch of restaurants to add real images
 * Uses controlled concurrency to avoid rate limits
 */
export async function enhanceRestaurantsWithRealImages(
  restaurants: Restaurant[], 
  skipImageSearch: boolean | string = false,
  batchSize: number = 3
): Promise<Restaurant[]> {
  console.log(`Enhancing ${restaurants.length} restaurants with real images`);
  
  // Use location string if provided, otherwise use default
  const location = typeof skipImageSearch === 'string' ? skipImageSearch : "New York City";
  
  // If skipImageSearch is true, don't search for real images
  const shouldSkipImageSearch = skipImageSearch === true;
  
  // Process in controlled batches to avoid overwhelming the API
  const enhancedRestaurants: Restaurant[] = [];
  
  // Process in batches
  for (let i = 0; i < restaurants.length; i += batchSize) {
    const batch = restaurants.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1} (${batch.length} restaurants)`);
    
    // Process this batch concurrently
    const batchPromises = batch.map(async (restaurant) => {
      try {
        // Use existing images if available
        if (restaurant.images && restaurant.images.length > 0) {
          return restaurant;
        }
        
        // Skip image search if requested
        if (shouldSkipImageSearch) {
          // Use fallback images
          const fallbackImages = getFallbackRestaurantImages(restaurant.cuisine);
          return { ...restaurant, images: fallbackImages };
        }
        
        // Otherwise find images
        const images = await findRestaurantImages(restaurant, location);
        return { ...restaurant, images };
      } catch (error) {
        console.error(`Error enhancing restaurant ${restaurant.name}:`, error);
        
        // Use fallback images if anything goes wrong
        const fallbackImages = getFallbackRestaurantImages(restaurant.cuisine);
        return { ...restaurant, images: fallbackImages };
      }
    });
    
    // Wait for this batch to complete
    const batchResults = await Promise.all(batchPromises);
    enhancedRestaurants.push(...batchResults);
    
    // Wait a bit between batches to reduce API pressure
    if (i + batchSize < restaurants.length) {
      console.log('Pausing between batches to avoid rate limits');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return enhancedRestaurants;
}

/**
 * Use only fallback images for the initial carousel view
 * This preserves API quota for chat recommendations
 */
export function getInitialRestaurantImages(restaurant: Restaurant): string[] {
  return getFallbackRestaurantImages(restaurant.cuisine);
} 