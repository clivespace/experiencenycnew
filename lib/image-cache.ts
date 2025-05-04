/**
 * Image Cache System
 * 
 * Provides caching for restaurant images to reduce Google Image Search API calls
 * and avoid rate limiting.
 */

// In-memory cache to store restaurant image results
interface CacheEntry {
  images: string[];
  timestamp: number;
}

// Cache with restaurant key and image results
let imageCache: Record<string, CacheEntry> = {};

// Storage key for localStorage
const STORAGE_KEY = 'restaurant_image_cache';

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Initialize cache from localStorage if available
const initializeCache = () => {
  if (typeof window !== 'undefined') {
    try {
      const storedCache = localStorage.getItem(STORAGE_KEY);
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        imageCache = parsedCache;
        console.log('Loaded image cache from localStorage');
        
        // Clean expired entries
        pruneExpiredEntries();
      }
    } catch (error) {
      console.error('Error loading cache from localStorage:', error);
      // In case of error, just use an empty cache
      imageCache = {};
    }
  }
};

// Call initialization once
initializeCache();

/**
 * Removes expired entries from the cache
 */
function pruneExpiredEntries(): void {
  const now = Date.now();
  let prunedCount = 0;
  
  for (const key in imageCache) {
    if ((now - imageCache[key].timestamp) > CACHE_EXPIRATION) {
      delete imageCache[key];
      prunedCount++;
    }
  }
  
  if (prunedCount > 0) {
    console.log(`Pruned ${prunedCount} expired cache entries`);
    // Save the pruned cache
    saveCache();
  }
}

/**
 * Saves the cache to localStorage if in browser environment
 */
function saveCache(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imageCache));
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  }
}

/**
 * Creates a cache key from restaurant details
 */
function createCacheKey(restaurantName: string, location: string): string {
  return `${restaurantName.toLowerCase().trim()}|${location.toLowerCase().trim()}`;
}

/**
 * Stores restaurant images in the cache
 */
export function cacheRestaurantImages(restaurantName: string, location: string, images: string[]): void {
  const key = createCacheKey(restaurantName, location);
  
  imageCache[key] = {
    images,
    timestamp: Date.now()
  };
  
  console.log(`Cached images for ${restaurantName} in ${location}`);
  
  // Save to localStorage
  saveCache();
}

/**
 * Retrieves cached images for a restaurant if they exist and aren't expired
 * @returns Array of image URLs or null if not cached/expired
 */
export function getCachedImages(restaurantName: string, location: string): string[] | null {
  const key = createCacheKey(restaurantName, location);
  const cacheEntry = imageCache[key];
  
  // Check if entry exists and isn't expired
  if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_EXPIRATION) {
    console.log(`Cache hit: Using cached images for ${restaurantName}`);
    return cacheEntry.images;
  }
  
  // If entry doesn't exist or is expired
  if (cacheEntry) {
    console.log(`Cache expired for ${restaurantName}, will fetch fresh images`);
    delete imageCache[key];
    saveCache();
  }
  
  return null;
}

/**
 * Clears all cached data (useful for testing)
 */
export function clearImageCache(): void {
  imageCache = {};
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  
  console.log('Image cache cleared');
} 