import { NextRequest, NextResponse } from 'next/server';

// Default Google Search API configuration
// In production, use environment variables instead of hardcoded values
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || 'AIzaSyDwstlEMfnItV34_h-nLO-GMSKN9vtwbL8';
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || '764bbc3a489a34eb6';

// This API provides an interface to Google Custom Search API for client components
// It allows fetching restaurant images on-demand
// Path: /api/google-image-search?q=restaurant+name

export const dynamic = "force-static";
export const revalidate = false;

/**
 * For static export, this endpoint can't use dynamic features
 * It returns a static empty result
 */
export async function GET() {
  // For static export, return empty results
  return NextResponse.json({
    results: []
  });
} 