import { NextResponse } from 'next/server';
import { LRUCache } from "lru-cache";

// Initialize an in-memory LRU cache for image search results
const cache = new LRUCache<string, any>({ 
  max: 500,  // Store up to 500 queries
  ttl: 1000 * 60 * 60 * 24  // Cache for 24 hours
});

export const dynamic = "force-static";
export const revalidate = false;

/**
 * For static export, this endpoint can't use dynamic features
 * It returns static placeholder data
 */
export async function GET() {
  // Return static sample data for static export
  return NextResponse.json([
    {
      title: "Le Bernardin Restaurant New York",
      imageLink: "/images/french-1.jpg",
      thumbnailLink: "/images/french-1.jpg",
      contextLink: "https://www.le-bernardin.com/",
      source: 'fallback'
    },
    {
      title: "Peter Luger Steakhouse Brooklyn",
      imageLink: "/images/restaurant-2.jpg",
      thumbnailLink: "/images/restaurant-2.jpg",
      contextLink: "https://peterluger.com/",
      source: 'fallback'
    },
    {
      title: "Carbone Italian Restaurant",
      imageLink: "/images/italian-1.jpg",
      thumbnailLink: "/images/italian-1.jpg",
      contextLink: "#",
      source: 'fallback'
    }
  ]);
} 