import { NextResponse } from 'next/server';

export const dynamic = "force-static";
export const revalidate = false;

/**
 * For static export, this endpoint can't use dynamic features
 * It returns a simple redirect to a static image
 */
export async function GET() {
  // For static export, return a simple 404 response
  // This route won't be used in static exports
  // Images are linked directly to the /images directory
  return new NextResponse('Not available in static export', { status: 404 });
} 