import { NextResponse } from 'next/server';
import { checkRestaurantStatus } from '@/lib/chat-helpers';

/**
 * API endpoint to check if a restaurant is open or closed
 * @param request Request containing restaurant name and location
 * @returns JSON response with status information
 */
export async function GET(request: Request) {
  try {
    // Parse request parameters
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const location = url.searchParams.get('location') || 'New York';
    
    if (!name) {
      return NextResponse.json({ 
        error: 'Missing restaurant name parameter' 
      }, { status: 400 });
    }
    
    console.log(`Checking status for restaurant: ${name} in ${location}`);
    
    // Check restaurant status
    const statusResult = await checkRestaurantStatus(name, location);
    
    return NextResponse.json({
      name,
      location,
      isOpen: statusResult.isOpen,
      status: statusResult.status
    });
    
  } catch (error) {
    console.error('Error checking restaurant status:', error);
    return NextResponse.json({ 
      error: `API error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 