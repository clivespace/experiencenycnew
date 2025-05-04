import { NextResponse } from 'next/server';
import { enhanceRestaurantsWithRealImages, findRestaurantImages } from '@/lib/restaurant-helpers';

// Import the Restaurant type from helpers to ensure consistency
import type { Restaurant } from '@/lib/restaurant-helpers';

// Initial restaurant data with placeholder images
const initialRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Le Bernardin',
    cuisine: 'French',
    priceRange: '$$$',
    neighborhood: 'Midtown',
    description: 'Upscale French seafood restaurant with elegant atmosphere',
    rating: 4.8,
    imageUrl: '/images/placeholder-restaurant.jpg',
    image: '/images/placeholder-restaurant.jpg',
    address: '155 W 51st St, New York, NY 10019'
  },
  {
    id: '2',
    name: 'Katz\'s Delicatessen',
    cuisine: 'Deli',
    priceRange: '$$',
    neighborhood: 'Lower East Side',
    description: 'Famous deli known for pastrami sandwiches',
    rating: 4.6,
    imageUrl: '/images/placeholder-restaurant.jpg',
    image: '/images/placeholder-restaurant.jpg',
    address: '205 E Houston St, New York, NY 10002'
  },
  {
    id: '3',
    name: 'Carbone',
    cuisine: 'Italian',
    priceRange: '$$$',
    neighborhood: 'Greenwich Village',
    description: 'Upscale Italian-American restaurant with retro vibes',
    rating: 4.7,
    imageUrl: '/images/placeholder-restaurant.jpg',
    image: '/images/placeholder-restaurant.jpg',
    address: '181 Thompson St, New York, NY 10012'
  },
  {
    id: '4',
    name: 'Peter Luger',
    cuisine: 'Steakhouse',
    priceRange: '$$$',
    neighborhood: 'Williamsburg',
    description: 'Iconic steakhouse serving dry-aged beef since 1887',
    rating: 4.5,
    imageUrl: '/images/placeholder-restaurant.jpg',
    image: '/images/placeholder-restaurant.jpg',
    address: '178 Broadway, Brooklyn, NY 11211'
  },
  {
    id: '5',
    name: 'Cosme',
    cuisine: 'Mexican',
    priceRange: '$$$',
    neighborhood: 'Flatiron District',
    description: 'Modern Mexican restaurant with creative dishes',
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c',
    image: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c',
    address: '35 E 21st St, New York, NY 10010'
  }
];

// Cache for enhanced restaurants to avoid redundant API calls
let cachedRestaurants: Restaurant[] | null = null;
let lastCachedTime: number = 0;
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function GET() {
  // Check if we have a fresh cached result
  const now = Date.now();
  if (cachedRestaurants && (now - lastCachedTime < CACHE_TTL)) {
    console.log('Returning cached restaurant data with real images');
    return NextResponse.json(cachedRestaurants);
  }

  try {
    console.log('Fetching restaurant data for carousel...');
    
    // Skip image search for carousel to conserve API quota for chat recommendations
    let enhancedRestaurants = await enhanceRestaurantsWithRealImages(initialRestaurants, true);
    
    // No image search for carousel - conserve API quota for chat interface
    console.log('Using placeholder images for carousel to conserve API quota');
    
    // Update cache
    cachedRestaurants = enhancedRestaurants;
    lastCachedTime = now;
    
    console.log(`Returning ${enhancedRestaurants.length} restaurants with placeholder images`);
    return NextResponse.json(enhancedRestaurants);
  } catch (error) {
    console.error('Error fetching restaurant images:', error);
    // If there's an error, return the original data
    return NextResponse.json(initialRestaurants);
  }
} 