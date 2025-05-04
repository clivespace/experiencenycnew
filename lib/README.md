# Restaurant Image System

## Overview

This system provides restaurant images for the NYC Dining Landing app. It uses a combination of Google Image Search and local fallback images to ensure restaurants always have appropriate images even when API rate limits are reached.

## Features

- **Real-time Google Image Search**: Searches for real photos of restaurants when available.
- **Rate Limit Handling**: Falls back to a curated set of cuisine-specific images when rate limits are hit.
- **Cuisine Classification**: Automatically classifies restaurants by cuisine type for appropriate fallback images.
- **Consistent Image Count**: Always provides exactly 3 images for each restaurant.

## Implementation

### Main Components:

1. **findRestaurantImages()** - Fetches real images via Google Image Search API
2. **getFallbackRestaurantImages()** - Provides fallback images when API fails
3. **normalizeCuisine()** - Maps restaurant cuisine to our standardized categories

### Fallback Image Categories:

- Italian
- Japanese
- Mexican
- Chinese
- Indian
- French
- Thai
- Default (for any other cuisine type)

## Usage

```typescript
// To get images for a restaurant
const images = await findRestaurantImages('Restaurant Name', 'New York', 'Italian');

// To directly use fallback images
const fallbackImages = getFallbackRestaurantImages('Restaurant Name', 'Italian');
```

## Image Structure

Local fallback images are stored in `/public/images/` with the naming convention:
- `/images/{cuisine}-{number}.jpg` (e.g., `/images/italian-1.jpg`)
- `/images/restaurant-{number}.jpg` for default images

## Error Handling

The system handles various error cases:
- API rate limiting (429 errors)
- Network failures
- Missing or incomplete image results
- Invalid image URLs

In all error cases, appropriate fallback images are provided. 