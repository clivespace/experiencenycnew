import { NextRequest, NextResponse } from 'next/server';
import { safeImageSearch } from '@/lib/image-search';
import { LRUCache } from "lru-cache";

// Initialize an in-memory LRU cache for image search results
// This saves API quota by caching identical queries for 24 hours
const cache = new LRUCache<string, any>({ 
  max: 500,  // Store up to 500 queries
  ttl: 1000 * 60 * 60 * 24  // Cache for 24 hours
});

export const dynamic = "force-static";

/**
 * Restaurant image search API with lazy pagination
 * 
 * This endpoint searches for restaurant images using Google Custom Search
 * and only issues a second Google call when the front-end passes page=2,3... (lazy pagination)
 * If Google API hits quota limits, falls back to Unsplash API
 * 
 * Usage:
 * GET /api/image-proxy?q=restaurant+name&page=1
 * 
 * Returns: Array of image results
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const start = (page - 1) * 10 + 1;
  const key = `${q}-${page}`;

  if (cache.has(key)) return NextResponse.json(cache.get(key));

  // Create the composite query to get better restaurant images
  const baseQuery = q ? `${q} restaurant new york (exterior OR interior OR dish)` : "";
  
  if (!baseQuery) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  try {
    const results = await safeImageSearch(baseQuery, start);
    cache.set(key, results);
    return NextResponse.json(results);
  } catch (error) {
    console.error(`Error searching for images: ${error}`);
    return NextResponse.json({ 
      error: `Error searching for images: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
} 