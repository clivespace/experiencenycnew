import { createApi } from 'unsplash-js';

export const unsplash = createApi({
  accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '',
});

// Restaurant-related search queries for consistent images
export const RESTAURANT_QUERIES = {
  interior: 'luxury restaurant interior',
  food: 'gourmet food plating',
  bar: 'luxury restaurant bar',
  dining: 'fine dining restaurant',
}; 