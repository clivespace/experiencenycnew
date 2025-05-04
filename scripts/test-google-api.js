// Simple test script for the Google Search API
// Run with: node scripts/test-google-api.js

const API_KEY = 'AIzaSyDwstlEMfnItV34_h-nLO-GMSKN9vtwbL8';
const SEARCH_ENGINE_ID = '764bbc3a489a34eb6';

async function testSearchAPI() {
  console.log('Testing Google Search API with:');
  console.log('- API Key:', API_KEY.substring(0, 10) + '...');
  console.log('- Search Engine ID:', SEARCH_ENGINE_ID);
  
  // Build the search URL
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('key', API_KEY);
  url.searchParams.append('cx', SEARCH_ENGINE_ID);
  url.searchParams.append('q', 'test query');
  
  console.log('\nMaking direct API request...');
  
  try {
    // Make the request
    const response = await fetch(url.toString());
    
    console.log('Response status:', response.status, response.statusText);
    
    // Get the response data
    const data = await response.json();
    
    if (!response.ok) {
      console.error('\nAPI Error:');
      console.error(JSON.stringify(data, null, 2));
      
      if (data.error?.errors?.[0]) {
        console.error('\nError details:');
        console.error('- Domain:', data.error.errors[0].domain);
        console.error('- Reason:', data.error.errors[0].reason);
        console.error('- Message:', data.error.errors[0].message);
      }
    } else {
      console.log('\nSearch successful!');
      console.log('- Result count:', data.searchInformation?.totalResults || 0);
      
      if (data.items?.length > 0) {
        console.log('\nFirst result:');
        console.log('- Title:', data.items[0].title);
        console.log('- Link:', data.items[0].link);
      } else {
        console.log('No items found in the response');
      }
    }
  } catch (error) {
    console.error('\nFetch Error:', error);
  }
}

// Test image search
async function testImageSearchAPI() {
  console.log('\n\nTesting Google Image Search API with:');
  console.log('- API Key:', API_KEY.substring(0, 10) + '...');
  console.log('- Search Engine ID:', SEARCH_ENGINE_ID);
  
  // Build the search URL for image search
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('key', API_KEY);
  url.searchParams.append('cx', SEARCH_ENGINE_ID);
  url.searchParams.append('q', 'restaurant food');
  url.searchParams.append('searchType', 'image');
  url.searchParams.append('num', '1');
  
  console.log('\nMaking direct Image API request...');
  
  try {
    // Make the request
    const response = await fetch(url.toString());
    
    console.log('Response status:', response.status, response.statusText);
    
    // Get the response data
    const data = await response.json();
    
    if (!response.ok) {
      console.error('\nAPI Error:');
      console.error(JSON.stringify(data, null, 2));
      
      if (data.error?.errors?.[0]) {
        console.error('\nError details:');
        console.error('- Domain:', data.error.errors[0].domain);
        console.error('- Reason:', data.error.errors[0].reason);
        console.error('- Message:', data.error.errors[0].message);
      }
    } else {
      console.log('\nImage search successful!');
      console.log('- Result count:', data.searchInformation?.totalResults || 0);
      
      if (data.items?.length > 0) {
        console.log('\nFirst image result:');
        console.log('- Title:', data.items[0].title);
        console.log('- Image URL:', data.items[0].link);
        console.log('- Thumbnail:', data.items[0].image?.thumbnailLink);
      } else {
        console.log('No image items found in the response');
      }
    }
  } catch (error) {
    console.error('\nFetch Error:', error);
  }
}

// Run both tests
async function runTests() {
  await testSearchAPI();
  await testImageSearchAPI();
  console.log('\nTests completed');
}

runTests(); 