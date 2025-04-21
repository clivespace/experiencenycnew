import { type Message } from 'ai';
import { googleSearch } from './utils';

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

// New function to search for real restaurant images
export async function findRestaurantImages(restaurantName: string, location: string): Promise<string[]> {
  try {
    console.log(`Searching for images of ${restaurantName} in ${location}...`);
    
    // Create specific search queries for different aspects of the restaurant
    const interiorQuery = `${restaurantName} ${location} restaurant interior photos`;
    const foodQuery = `${restaurantName} ${location} food dishes photos`;
    const exteriorQuery = `${restaurantName} ${location} restaurant exterior building`;
    
    // Execute the searches
    const [interiorResults, foodResults, exteriorResults] = await Promise.all([
      googleSearch(interiorQuery),
      googleSearch(foodQuery),
      googleSearch(exteriorQuery)
    ]);
    
    const images: string[] = [];
    
    // Helper function to extract image URLs from search results
    const extractImageUrl = (results: any) => {
      if (!results.results || results.results.length === 0) return null;
      
      // Look for image links in results (typically ending with image extensions or from image sites)
      for (const result of results.results) {
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
          return link;
        }
      }
      
      // If no clear image URL, take the first result as it might lead to an image
      return results.results[0]?.link || null;
    };
    
    // Extract one image from each search result
    const interiorImage = extractImageUrl(interiorResults);
    const foodImage = extractImageUrl(foodResults);
    const exteriorImage = extractImageUrl(exteriorResults);
    
    // Add the found images to our collection
    if (interiorImage) images.push(interiorImage);
    if (foodImage) images.push(foodImage);
    if (exteriorImage) images.push(exteriorImage);
    
    console.log(`Found ${images.length} real images for ${restaurantName}`);
    return images;
  } catch (error) {
    console.error('Error finding restaurant images:', error);
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
      
      // Add cuisine-specific images based on the restaurant type
      let defaultImages = [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', // Restaurant interior
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836', // Food dish
        'https://images.unsplash.com/photo-1592861956120-e524fc739696'  // Bar/ambiance
      ];
      
      // Check cuisine type and assign appropriate images
      const cuisineType = data.cuisine.toLowerCase();
      if (cuisineType.includes('sushi') || cuisineType.includes('japanese')) {
        defaultImages = [
          'https://images.unsplash.com/photo-1579871494447-9811cf80d66c', // Sushi restaurant
          'https://images.unsplash.com/photo-1563612116625-3012372fccce', // Sushi platter
          'https://images.unsplash.com/photo-1607301406259-dfb186e15de8'  // Sushi chef
        ];
      } else if (cuisineType.includes('italian')) {
        defaultImages = [
          'https://images.unsplash.com/photo-1481833761820-0509d3217039', // Italian restaurant
          'https://images.unsplash.com/photo-1595295333158-4742f28fbd85', // Pasta dish
          'https://images.unsplash.com/photo-1551183053-bf91a1d81141'  // Italian ambiance
        ];
      } else if (cuisineType.includes('mexican')) {
        defaultImages = [
          'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c', // Mexican restaurant
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', // Tacos
          'https://images.unsplash.com/photo-1586511925558-a4c6376fe65f'  // Mexican food
        ];
      } else if (cuisineType.includes('chinese')) {
        defaultImages = [
          'https://images.unsplash.com/photo-1623341214825-9f4f963727da', // Chinese restaurant
          'https://images.unsplash.com/photo-1583032015879-e5022cb87c3b', // Dim sum
          'https://images.unsplash.com/photo-1546069901-5ec6a79120b0'  // Chinese dish
        ];
      } else if (cuisineType.includes('indian')) {
        defaultImages = [
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', // Indian restaurant
          'https://images.unsplash.com/photo-1585937421612-70a008356fbe', // Indian curry
          'https://images.unsplash.com/photo-1542367592-8849eb970d3a'  // Indian food
        ];
      } else if (cuisineType.includes('french')) {
        defaultImages = [
          'https://images.unsplash.com/photo-1515668236457-83c3b8764839', // French restaurant
          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', // French cuisine
          'https://images.unsplash.com/photo-1550507992-eb63ffee0847'  // Wine and cheese
        ];
      }
      
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
      
      // Try to get real images for the restaurant
      if (!hasRealImages && typeof window === 'undefined') {
        try {
          console.log(`Looking for real images for ${data.name}...`);
          const realImages = await findRestaurantImages(data.name, data.location);
          
          if (realImages.length > 0) {
            console.log(`Found ${realImages.length} real images for ${data.name}, using them instead of placeholders`);
            processedImages = realImages;
          }
        } catch (error) {
          console.error('Error getting real restaurant images:', error);
          // Fall back to defaults (which happens below)
        }
      }
      
      // Validate each image URL
      processedImages = processedImages.map(img => {
        // Check if the image URL is a placeholder
        if (img.includes('placeholder') || !img.startsWith('http')) {
          return defaultImages[0]; // Replace with a real image
        }
        return img;
      });
      
      // If we don't have enough images, fill in with defaults
      while (processedImages.length < 3) {
        const defaultIndex = processedImages.length;
        if (defaultIndex < defaultImages.length) {
          processedImages.push(defaultImages[defaultIndex]);
        } else {
          processedImages.push(defaultImages[0]); // Use the first default if we run out
        }
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