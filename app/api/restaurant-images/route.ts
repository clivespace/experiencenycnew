import { NextResponse } from 'next/server';
import { enhanceRestaurantsWithRealImages, type Restaurant } from '@/lib/restaurant-helpers';

// Initial restaurant data - same as in the carousel component
const initialRestaurants: Restaurant[] = [
  {
    id: 1,
    name: "Le Bernardin",
    image: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=300&h=180&fit=crop",
    description: "Upscale French seafood restaurant with elegant atmosphere and impeccable service.",
    location: "Midtown, Manhattan"
  },
  {
    id: 2,
    name: "Eleven Madison Park",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&h=180&fit=crop",
    description: "Sophisticated tasting menus featuring seasonal ingredients in an art deco space.",
    location: "Flatiron, Manhattan"
  },
  {
    id: 3,
    name: "Gramercy Tavern",
    image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=300&h=180&fit=crop",
    description: "Seasonal American cuisine in a rustic, elegant setting with exceptional service.",
    location: "Gramercy, Manhattan"
  },
  {
    id: 4,
    name: "Per Se",
    image: "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=300&h=180&fit=crop",
    description: "Chef Thomas Keller's New American restaurant offering prix fixe menus with city views.",
    location: "Columbus Circle, Manhattan"
  },
  {
    id: 5,
    name: "Daniel",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=180&fit=crop",
    description: "Refined French cuisine served in an elegant setting with exceptional attention to detail.",
    location: "Upper East Side, Manhattan"
  },
  {
    id: 6,
    name: "Masa",
    image: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=300&h=180&fit=crop",
    description: "Exclusive sushi experience with Chef Masa Takayama's omakase menu.",
    location: "Columbus Circle, Manhattan"
  },
];

// Cache the results to avoid making multiple API calls
let cachedRestaurants: Restaurant[] | null = null;
let lastUpdated = 0;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

export async function GET() {
  try {
    const now = Date.now();
    
    // Check if cache is valid
    if (cachedRestaurants && lastUpdated > now - CACHE_TTL) {
      console.log('Returning cached restaurant data');
      return NextResponse.json({ restaurants: cachedRestaurants });
    }
    
    console.log('Fetching real restaurant images...');
    
    // Enhance restaurants with real images
    const enhancedRestaurants = await enhanceRestaurantsWithRealImages(initialRestaurants);
    
    // Update cache
    cachedRestaurants = enhancedRestaurants;
    lastUpdated = now;
    
    console.log('Successfully enhanced restaurants with real images');
    
    return NextResponse.json({ restaurants: enhancedRestaurants });
  } catch (error) {
    console.error('Error in restaurant-images API route:', error);
    
    // Return original restaurants if there's an error
    return NextResponse.json(
      { 
        restaurants: initialRestaurants,
        error: 'Failed to fetch restaurant images'
      },
      { status: 500 }
    );
  }
} 