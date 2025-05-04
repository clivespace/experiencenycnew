# Rate Limit Prevention Strategies

This document outlines the strategies implemented to prevent and handle rate limit issues with the Google Image Search API.

## Overview

The NYC Dining Landing app uses Google Image Search API to fetch real images of restaurants. However, API rate limits can cause disruptions in service. We've implemented multiple layers of protection:

1. **Image Caching** - Store previously fetched images to reduce API calls
2. **Request Throttling** - Self-impose limits on our API request rate
3. **Staggered Requests** - Space out API calls to avoid bursts
4. **Request Queuing** - Queue and process requests at a controlled pace
5. **Fallback Images** - Use local images when API limits are reached
6. **Exponential Backoff** - Retry failed requests with increasing delays

## Implementation Details

### 1. Image Caching (`image-cache.ts`)

- In-memory cache with localStorage persistence
- 24-hour cache expiration
- Automatic pruning of expired entries
- Cache entries keyed by restaurant name + location

```typescript
// Example usage
const cachedImages = getCachedImages(restaurantName, location);
if (cachedImages) {
  return cachedImages; // Use cached images instead of API call
}
```

### 2. Request Throttling

- Track timestamps of recent API calls
- Limit to maximum number of requests per time window
- Skip API calls when self-imposed limit is reached

```typescript
// Self-throttling check
if (shouldThrottleRequests()) {
  return getFallbackRestaurantImages(restaurantName, cuisine);
}
```

### 3. Request Queue System (`request-queue.ts`)

- Queue requests to be processed in controlled batches
- Limit concurrent requests (default: 2)
- Add delays between batches and individual requests
- Process queue with controlled pacing

```typescript
// Process with queueing
const results = await imageRequestQueue.enqueue(async () => {
  // Staggered API calls
});
```

### 4. Exponential Backoff (`utils.ts`)

- Retry failed requests with increasing delays
- Skip retrying 429 errors (already rate limited)
- Custom retry logic based on error type

```typescript
withRetry(
  searchFn,
  2,           // Max 2 retries
  1500,        // Start with 1.5s delay
  error => !isRateLimitError(error)  // Don't retry rate limits
)
```

### 5. Fallback Images (`fallback-images.ts`)

- Categorized by cuisine type
- Local image assets that don't require API calls
- Automatic cuisine detection and normalization

```typescript
// When API fails, use fallbacks
return getFallbackRestaurantImages(restaurantName, cuisine);
```

## Monitoring and Maintenance

- Console logging for rate limit detection and cache operations
- Track API usage patterns to adjust throttling parameters
- Periodically update fallback images for better relevance

## Best Practices

1. **Batch Processing** - When working with multiple restaurants, use the `batchProcess` utility to control the overall request rate
2. **Preload Popular Data** - Consider preloading images for popular restaurants during quiet periods
3. **Adjust Parameters** - Fine-tune delay and concurrency settings based on API quota and usage patterns 