import { imageRequestQueue } from './request-queue';
import { getFallbackRestaurantImages } from './fallback-images';
import { searchRestaurantImages } from './image-search';
import { googleSearch } from './utils';

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
 * Find a single restaurant image using our optimized image search API
 */
export async function findRestaurantImage(restaurantName: string, location: string, specificQuery?: string): Promise<string | null> {
  try {
    const query = specificQuery 
      ? `${restaurantName} ${location} ${specificQuery}` 
      : `${restaurantName} ${location} restaurant`;
    
    console.log(`Searching for image: ${query}`);
    
    // Use our new image search API that has built-in caching and fallbacks
    const searchResults = await searchRestaurantImages(query);
    
    if (searchResults && searchResults.length > 0) {
      // Return the first image URL
      console.log(`Found image for ${restaurantName} (${specificQuery || 'general'})`);
      return searchResults[0].imageLink;
    }
    
    console.log(`No image found for ${restaurantName} (${specificQuery || 'general'})`);
    return null;
  } catch (error) {
    console.error(`Error finding image for ${restaurantName}:`, error);
    return null;
  }
}

/**
 * Find multiple images for a restaurant with retries and fallbacks
 */
export async function findRestaurantImages(restaurant: Restaurant, location: string): Promise<string[]> {
  try {
    console.log(`Finding images for ${restaurant.name} in ${location}`);
    
    // No special-case skip: allow real image search for all restaurants
    
    // Use our new streamlined API to search for images
    const searchResults = await searchRestaurantImages(`${restaurant.name} ${location} restaurant`);
    
    // If we got results, convert them to image URLs
    if (searchResults && searchResults.length > 0) {
      const imageUrls = searchResults.map(result => 
        // Use our image proxy for external images
        `/api/image-proxy/image?url=${encodeURIComponent(result.imageLink)}`
      );
      
      console.log(`Found ${imageUrls.length} images for ${restaurant.name}`);
      return imageUrls;
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
        // If the restaurant already has images, keep them **only** when they
        // appear to be real (external) images.  Local placeholder assets live
        // under the `public/images` folder and start with "/images/".  Those
        // are meant as fallbacks, so we should still attempt a real image
        // search in that case.
        if (restaurant.images && restaurant.images.length > 0) {
          const hasRealRemoteImage = restaurant.images.some((url) => url.startsWith('http'));

          // When at least one remote URL is already present we assume the
          // restaurant was previously enriched and we can skip another search.
          if (hasRealRemoteImage) {
            return restaurant;
          }
          // Otherwise (only local placeholders) fall through to search.
        }
        
        // Skip image search if requested
        if (shouldSkipImageSearch) {
          // Use fallback images
          const fallbackImages = getFallbackRestaurantImages(restaurant.cuisine);
          return { ...restaurant, images: fallbackImages, image: fallbackImages[0] };
        }
        
        // Otherwise find images
        const images = await findRestaurantImages(restaurant, location);
        return { ...restaurant, images, image: images[0] };
      } catch (error) {
        console.error(`Error enhancing restaurant ${restaurant.name}:`, error);
        
        // Use fallback images if anything goes wrong
        const fallbackImages = getFallbackRestaurantImages(restaurant.cuisine);
        return { ...restaurant, images: fallbackImages, image: fallbackImages[0] };
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

/**
 * Fetches restaurant images using our image search API
 * @param restaurantName The name of the restaurant
 * @param count Number of images to return (default 3)
 * @returns An array of image URLs
 */
export async function fetchRestaurantImages(restaurantName: string, count: number = 3): Promise<string[]> {
  try {
    // For Zero Otto Nove, directly use Italian restaurant images
    if (restaurantName.toLowerCase().includes('zero otto nove')) {
      console.log('Using direct Italian images for Zero Otto Nove');
      return [
        '/images/italian-1.jpg',
        '/images/italian-2.jpg',
        '/images/italian-3.jpg'
      ];
    }
    
    // Create a search query with the restaurant name
    const searchQuery = `${restaurantName} restaurant`;
    
    // Use our image search API
    const response = await fetch(`/api/image-proxy?q=${encodeURIComponent(searchQuery)}`);
    
    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        // Map the image links through our proxy to avoid CORS issues
        const imageUrls = results.slice(0, count).map((result: { imageLink: string }) => {
          // For external images, use the proxy
          if (result.imageLink.startsWith('http')) {
            return `/api/image-proxy/image?url=${encodeURIComponent(result.imageLink)}`;
          }
          // For local images, use directly
          return result.imageLink;
        });
        
        // Ensure we have enough images by adding fallbacks if needed
        const fallbacks = getFallbackImagesForRestaurant(restaurantName);
        while (imageUrls.length < count) {
          imageUrls.push(fallbacks[imageUrls.length % fallbacks.length]);
        }
        
        return imageUrls;
      }
    }
    
    // If no images found or API error, return fallback images
    return getFallbackImagesForRestaurant(restaurantName);
  } catch (error) {
    console.error(`Error fetching images for ${restaurantName}:`, error);
    return getFallbackImagesForRestaurant(restaurantName);
  }
}

/**
 * Get fallback images for a restaurant based on name or cuisine
 */
function getFallbackImagesForRestaurant(restaurantName: string): string[] {
  // Map of restaurant names to cuisines for common NYC restaurants
  const restaurantToCuisine: Record<string, string> = {
    'le bernardin': 'french',
    'per se': 'french',
    'eleven madison park': 'american',
    'daniel': 'french',
    'jean-georges': 'french',
    'masa': 'japanese',
    'blue hill': 'american',
    'gramercy tavern': 'american',
    'momofuku ko': 'japanese',
    'del posto': 'italian',
    'the modern': 'american',
    'carbone': 'italian',
    'peter luger': 'american',
    'cosme': 'mexican',
    'katz\'s delicatessen': 'american',
    'the river café': 'american',
    'balthazar': 'french',
    'crown shy': 'american',
    'zero otto nove': 'italian',
  };
  
  // Try to determine the cuisine from the restaurant name
  const lowerName = restaurantName.toLowerCase();
  let cuisine = 'general';
  
  // Check if we have a specific mapping for this restaurant
  if (restaurantToCuisine[lowerName]) {
    cuisine = restaurantToCuisine[lowerName];
  } else {
    // Look for cuisine indicators in the name
    if (lowerName.includes('italian') || lowerName.includes('pasta') || lowerName.includes('pizza')) {
      cuisine = 'italian';
    } else if (lowerName.includes('french') || lowerName.includes('bistro') || lowerName.includes('cafe')) {
      cuisine = 'french';
    } else if (lowerName.includes('japanese') || lowerName.includes('sushi') || lowerName.includes('ramen')) {
      cuisine = 'japanese';
    } else if (lowerName.includes('mexican') || lowerName.includes('taco') || lowerName.includes('burrito')) {
      cuisine = 'mexican';
    } else if (lowerName.includes('chinese') || lowerName.includes('dim sum')) {
      cuisine = 'chinese';
    } else if (lowerName.includes('thai')) {
      cuisine = 'thai';
    } else if (lowerName.includes('indian')) {
      cuisine = 'indian';
    }
  }
  
  // Return cuisine-specific images from our public directory
  return [
    `/images/${cuisine}-1.jpg`,
    `/images/${cuisine}-2.jpg`,
    `/images/${cuisine}-3.jpg`
  ];
}

/**
 * Fetch expert review info (rating, summary, website) for a restaurant
 * Uses Google Custom Search snippets from reputable sources (Michelin, NYTimes, etc.)
 */
export async function fetchExpertRestaurantInfo(name: string, location: string = 'New York'): Promise<{ rating?: number; summary?: string; website?: string }> {
  try {
    const query = `${name} ${location} restaurant reviews`;
    const results = await googleSearch(query);

    if (!results || results.length === 0) {
      return {};
    }

    // Attempt to pick the first result that looks like an official site for website
    const officialSite = results.find(r => {
      const url = r.link || '';
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      return (
        domain.includes(name.toLowerCase().replace(/[^a-z0-9]/g, '')) &&
        !/yelp|tripadvisor|opentable|grubhub|ubereats|doordash/.test(domain)
      );
    });

    const website = officialSite?.link;

    // Try to extract a star rating from any snippet (e.g. "4.6/5" or "4.6 out of 5")
    let rating: number | undefined;
    for (const r of results) {
      const match = r.snippet.match(/(\d\.\d)\s*(?:\/|out of)\s*5/);
      if (match) {
        rating = parseFloat(match[1]);
        break;
      }
    }

    // Use the first reputable snippet as summary (Michelin, NYTimes, Eater, etc.)
    const reputable = results.find(r => /michelin|nytimes|new york times|newyorker|eater/.test(r.link.toLowerCase()));
    const summary = reputable?.snippet || results[0].snippet;

    return { rating, summary, website };
  } catch (err) {
    console.error('Error fetching expert info:', err);
    return {};
  }
} 