import { NextResponse } from 'next/server';
import { getFallbackRestaurantImages } from '@/lib/fallback-images';
import type { Restaurant } from '@/lib/restaurant-helpers';

export const dynamic = "force-static";

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
    imageUrl: '/images/french-1.jpg',
    image: '/images/french-1.jpg', 
    images: ['/images/french-1.jpg', '/images/french-2.jpg', '/images/french-3.jpg'],
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
    imageUrl: '/images/restaurant-1.jpg',
    image: '/images/restaurant-1.jpg',
    images: ['/images/restaurant-1.jpg', '/images/restaurant-2.jpg', '/images/restaurant-3.jpg'],
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
    imageUrl: '/images/italian-1.jpg',
    image: '/images/italian-1.jpg',
    images: ['/images/italian-1.jpg', '/images/italian-2.jpg', '/images/italian-3.jpg'],
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
    imageUrl: '/images/restaurant-2.jpg',
    image: '/images/restaurant-2.jpg',
    images: ['/images/restaurant-2.jpg', '/images/restaurant-1.jpg', '/images/restaurant-3.jpg'],
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
    imageUrl: '/images/mexican-1.jpg',
    image: '/images/mexican-1.jpg',
    images: ['/images/mexican-1.jpg', '/images/mexican-2.jpg', '/images/mexican-3.jpg'],
    address: '35 E 21st St, New York, NY 10010'
  }
];

export async function GET() {
  return NextResponse.json(initialRestaurants);
} 