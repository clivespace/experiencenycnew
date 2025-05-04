/**
 * Fallback Images for Restaurant Recommendations
 * 
 * Provides a collection of curated restaurant images when API searches fail due to rate limiting
 * or other errors. Images are organized by cuisine type.
 */

/**
 * Maps cuisine name variants to standard cuisine types
 */
function normalizeCuisine(cuisine: string): string {
  const lowerCuisine = cuisine.toLowerCase().trim();
  
  // Map common variants to main cuisine types
  if (lowerCuisine.includes('italian') || lowerCuisine.includes('pizza') || lowerCuisine.includes('pasta')) {
    return 'italian';
  } else if (lowerCuisine.includes('japan') || lowerCuisine.includes('sushi') || lowerCuisine.includes('ramen')) {
    return 'japanese';
  } else if (lowerCuisine.includes('mexic') || lowerCuisine.includes('taco') || lowerCuisine.includes('burrito')) {
    return 'mexican';
  } else if (lowerCuisine.includes('chinese') || lowerCuisine.includes('dim sum') || lowerCuisine.includes('szechuan')) {
    return 'chinese';
  } else if (lowerCuisine.includes('thai')) {
    return 'thai';
  } else if (lowerCuisine.includes('indian') || lowerCuisine.includes('curry')) {
    return 'indian';
  } else if (lowerCuisine.includes('french')) {
    return 'french';
  } else if (lowerCuisine.includes('greek') || lowerCuisine.includes('mediterranean')) {
    return 'mediterranean';
  } else if (lowerCuisine.includes('korean') || lowerCuisine.includes('bbq')) {
    return 'korean';
  } else if (lowerCuisine.includes('american') || lowerCuisine.includes('burger') || lowerCuisine.includes('steak')) {
    return 'american';
  }
  
  // Default to general restaurant images
  return 'general';
}

/**
 * Curated fallback restaurant images by cuisine type
 */
const fallbackImages: Record<string, string[]> = {
  // Italian restaurant images
  italian: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    'https://images.unsplash.com/photo-1498579397066-22750a3cb424',
    'https://images.unsplash.com/photo-1534649643822-e7431de08af6',
    'https://images.unsplash.com/photo-1579684947550-22e945225d9a',
  ],
  
  // Japanese restaurant images
  japanese: [
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252',
    'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10',
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c',
    'https://images.unsplash.com/photo-1617196034183-421b4917c92d',
  ],
  
  // Mexican restaurant images
  mexican: [
    'https://images.unsplash.com/photo-1584314465196-31db4a57b2d9',
    'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f',
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b',
  ],
  
  // Specific restaurant fallbacks
  cosme: [
    'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f',
    'https://images.unsplash.com/photo-1617197089406-9a0b89cc4eeb',
  ],
  
  // Chinese restaurant images
  chinese: [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d',
    'https://images.unsplash.com/photo-1567529692333-de9fd6772897',
    'https://images.unsplash.com/photo-1518983546435-91f8b87fe561',
    'https://images.unsplash.com/photo-1548943487-a2e4e43b4853',
  ],
  
  // Thai restaurant images
  thai: [
    'https://images.unsplash.com/photo-1604020126714-86c81f9403a0?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1567982047351-76b6f93e9942?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562565651-7d4948f339f5?w=800&auto=format&fit=crop',
  ],
  
  // Indian restaurant images
  indian: [
    'https://images.unsplash.com/photo-1585937421612-70a008356c36?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593252726954-ae843734c079?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=800&auto=format&fit=crop',
  ],
  
  // French restaurant images
  french: [
    'https://images.unsplash.com/photo-1550507992-eb63ffee0847',
    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d',
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092',
    'https://images.unsplash.com/photo-1605300045234-d0582c116871',
  ],
  
  // Mediterranean restaurant images
  mediterranean: [
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530554764233-e79e16c91d08?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517254456976-ee8682099819?w=800&auto=format&fit=crop',
  ],
  
  // Korean restaurant images
  korean: [
    'https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583592643761-bf2ecd0e6f84?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1632756916135-f90a196a6e97?w=800&auto=format&fit=crop',
  ],
  
  // American restaurant images
  american: [
    'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555992457-b8fefdd46da2?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544510806-7daec3d252cf?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=800&auto=format&fit=crop',
  ],
  
  // General restaurant images (fallback for unrecognized cuisines)
  general: [
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop',
  ],
};

// Export a type for better TypeScript support
export type CuisineType = 'italian' | 'japanese' | 'mexican' | 'chinese' | 'thai' | 'indian' | 'french' | 'mediterranean' | 'korean' | 'american' | 'general';

/**
 * Returns a set of fallback images for a restaurant based on cuisine
 * @param cuisine The restaurant's cuisine type
 * @returns An array of at least three image URLs
 */
export function getFallbackRestaurantImages(cuisine: string = 'general'): string[] {
  const normalizedCuisine = normalizeCuisine(cuisine);
  const images = fallbackImages[normalizedCuisine] || fallbackImages.general;
  
  // Ensure we return at least 3 images (repeat if necessary)
  if (images.length < 3) {
    return [...images, ...images, ...images].slice(0, 3);
  }
  
  return images.slice(0, 3);
} 