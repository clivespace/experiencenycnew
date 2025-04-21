import { googleSearch } from './utils';

// Types for restaurant data
export interface Restaurant {
  id: number;
  name: string;
  image: string;
  description: string;
  location?: string;
}

// Function to find a real image for a specific restaurant
export async function findRestaurantImage(restaurantName: string, location: string = "New York City"): Promise<string | null> {
  try {
    console.log(`Searching for image of ${restaurantName} in ${location}...`);
    
    // Create a specific search query for the restaurant
    const searchQuery = `${restaurantName} ${location} restaurant exterior high quality photo`;
    
    // Execute the search
    const searchResults = await googleSearch(searchQuery);
    
    if (!searchResults.results || searchResults.results.length === 0) {
      console.log(`No search results found for ${restaurantName}`);
      return null;
    }
    
    // Look for image links in results (typically ending with image extensions or from image sites)
    for (const result of searchResults.results) {
      const link = result.link;
      // Check if it's an image URL or from an image hosting site
      if (
        link.match(/\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i) ||
        link.includes('images') ||
        link.includes('photos') ||
        link.includes('media') ||
        link.includes('unsplash') ||
        link.includes('pexels') ||
        link.includes('shutterstock') ||
        link.includes('cloudfront') ||
        link.includes('googleusercontent')
      ) {
        console.log(`Found real image for ${restaurantName}: ${link}`);
        return link;
      }
    }
    
    // If no clear image URL is found, return null
    console.log(`No suitable image found for ${restaurantName}`);
    return null;
  } catch (error) {
    console.error(`Error finding image for ${restaurantName}:`, error);
    return null;
  }
}

// Function to enhance a list of restaurants with real images
export async function enhanceRestaurantsWithRealImages(restaurants: Restaurant[]): Promise<Restaurant[]> {
  if (typeof window !== 'undefined') {
    // We're in the browser, can't use server-side APIs
    return restaurants;
  }

  try {
    // Process restaurants in parallel
    const enhancedRestaurants = await Promise.all(
      restaurants.map(async (restaurant) => {
        try {
          // Try to find a real image
          const realImage = await findRestaurantImage(restaurant.name, restaurant.location);
          
          // If a real image is found, update the restaurant
          if (realImage) {
            return {
              ...restaurant,
              image: realImage
            };
          }
        } catch (error) {
          console.error(`Error enhancing restaurant ${restaurant.name}:`, error);
        }
        
        // Return the original restaurant if no real image is found or an error occurs
        return restaurant;
      })
    );

    return enhancedRestaurants;
  } catch (error) {
    console.error('Error enhancing restaurants with real images:', error);
    return restaurants;
  }
} 