import { OpenAI } from 'openai';
import { headers } from 'next/headers';
import { ChatCompletionChunk } from 'openai/resources';
import { googleSearch } from '@/lib/utils';

// Initialize OpenAI client with project-based API key configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  organization: process.env.OPENAI_ORG_ID, // Optional: Add if you have multiple organizations
});

// Define the structure we expect from ChatGPT
interface RestaurantRecommendation {
  name: string;
  type: string;
  cuisine: string;
  location: string;
  priceRange: string;
  rating: number;
  openHours: string;
  description: string;
  images: string[];
  website: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Add this additional type for tool messages
interface ToolMessage {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string;
}

// Update ChatRequest interface to use both message types
interface ChatRequest {
  messages: ChatMessage[];
}

// Add this type for updated messages that can include tool messages
type AnyMessage = ChatMessage | ToolMessage | { role: 'assistant', content: string, tool_calls: any[] };

// Simple rate limiting with memory store (note: this will reset on server restart)
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const requestCounts = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);

  if (!userRequests || (now - userRequests.timestamp) > RATE_LIMIT_WINDOW) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (userRequests.count >= RATE_LIMIT) {
    return true;
  }

  userRequests.count++;
  return false;
}

class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Enhanced API key validation function
async function validateOpenAIKey(): Promise<boolean> {
  try {
    // Make a minimal API call to test the key
    const response = await openai.models.list();
    // Check if we can access GPT-4, which is required for our chat
    const hasGpt4 = response.data.some(model => model.id.startsWith('gpt-4'));
    if (!hasGpt4) {
      console.warn('GPT-4 access not available with current API key');
      return false;
    }
    return true;
  } catch (error: any) {
    console.error('OpenAI API key validation failed:', {
      error: error.message,
      type: error.type,
      code: error.code,
    });
    // Check for project-specific API key errors
    if (error.status === 401) {
      console.error('Project API key unauthorized. Please check key permissions.');
    } else if (error.status === 429) {
      console.error('Project API key rate limit exceeded.');
    }
    return false;
  }
}

export async function POST(req: Request) {
  try {
    console.log('Starting chat request processing...');
    
    // Check if the API key is set
    if (!openai.apiKey) {
      console.error('OpenAI API key not configured properly');
      throw new APIError('OpenAI API key not configured', 500, 'MISSING_API_KEY');
    }

    console.log('OpenAI API key is set');

    // Get IP for rate limiting
    const headersList = headers() as unknown as Headers;
    let ip = 'unknown';
    
    try {
      const forwardedFor = headersList.get('x-forwarded-for');
      if (forwardedFor) {
        ip = forwardedFor.split(',')[0].trim();
      }
      console.log('IP address extracted:', ip);
    } catch (e) {
      console.warn('Failed to get x-forwarded-for header:', e);
    }

    // Check rate limit
    if (isRateLimited(ip)) {
      console.log('Rate limit exceeded for IP:', ip);
      throw new APIError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
    }

    // Parse and validate request body
    let body: ChatRequest;
    try {
      const rawBody = await req.json();
      console.log('Received request body:', JSON.stringify(rawBody, null, 2));
      
      body = rawBody as ChatRequest;
      if (!body.messages || !Array.isArray(body.messages)) {
        console.error('Invalid request body structure:', body);
        throw new APIError('Invalid request body', 400, 'INVALID_REQUEST');
      }
      console.log('Request body validated');
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new APIError('Invalid JSON', 400, 'INVALID_JSON');
    }

    const systemPrompt = `You are an AI assistant specializing in New York City dining recommendations. 
    When users ask about restaurants, provide detailed, specific recommendations in the following JSON format:
    {
      "name": "Restaurant Name",
      "type": "Type of Restaurant",
      "cuisine": "Cuisine Style",
      "location": "Neighborhood",
      "priceRange": "$-$$$$",
      "rating": 4.5,
      "openHours": "Opening Hours",
      "description": "Brief description that highlights the restaurant's specialties and atmosphere",
      "images": ["interior_url", "food_url", "bar_url"],
      "website": "website_url"
    }
    
    You have access to web search to find the most up-to-date information about restaurants in NYC. Use it to get accurate information about:
    - Restaurant opening hours and current status
    - Menu items and specialties
    - Current ratings from review sites
    - Correct websites and contact information
    - Recent news or events at the restaurant
    
    IMPORTANT: You MUST check if a restaurant is permanently closed or temporarily closed before recommending it. 
    Use web search to verify the restaurant's current status. NEVER recommend restaurants that are permanently closed 
    or temporarily closed. If you discover that a restaurant you were considering is closed, search for another similar option 
    that is currently open. Always include a web search query with the restaurant name and "open" or "closed" to verify status.
    
    When using web search, make specific queries about the restaurant name, location, and any other details needed.
    
    IMPORTANT: Your response MUST ALWAYS include the JSON object even if hidden. Before the JSON data,
    provide only 1-2 short, concise sentences about the restaurant. Keep your introduction extremely brief.
    DO NOT show the raw JSON data in your visible response.
    
    Example of a good response format:
    "I recommend Example Restaurant, an elegant fine dining spot in SoHo known for seasonal tasting menus."
    [JSON OBJECT HERE]
    
    Your responses should be helpful, focusing on a specific restaurant recommendation based on the user's query.
    
    For Japanese/Sushi restaurants, use these high-quality image URLs:
    ["https://images.unsplash.com/photo-1579871494447-9811cf80d66c", 
    "https://images.unsplash.com/photo-1563612116625-3012372fccce", 
    "https://images.unsplash.com/photo-1607301406259-dfb186e15de8"]
    
    For Italian restaurants, use these high-quality image URLs:
    ["https://images.unsplash.com/photo-1481833761820-0509d3217039", 
    "https://images.unsplash.com/photo-1595295333158-4742f28fbd85", 
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141"]
    
    For Mexican restaurants, use these high-quality image URLs:
    ["https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c", 
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38", 
    "https://images.unsplash.com/photo-1586511925558-a4c6376fe65f"]
    
    For American restaurants, use these high-quality image URLs:
    ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5", 
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17", 
    "https://images.unsplash.com/photo-1576271758667-7185457ffe56"]
    
    Always include valid website URLs (even if using placeholder ones like "https://www.restaurantname.com").
    
    {
      "name": "Example Restaurant",
      "type": "Fine Dining",
      "cuisine": "Contemporary American",
      "location": "SoHo, Manhattan",
      "priceRange": "$$$",
      "rating": 4.7,
      "openHours": "Tue-Sun: 5:30 PM - 11:00 PM",
      "description": "Example Restaurant offers innovative American cuisine in an elegant setting with exceptional service. Known for their seasonal tasting menu and craft cocktails.",
      "images": ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5", "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17", "https://images.unsplash.com/photo-1576271758667-7185457ffe56"],
      "website": "https://www.examplerestaurant.com"
    }`;

    console.log('Creating OpenAI chat completion...');

    try {
      // Prepare the messages in the format OpenAI expects
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...body.messages.map(msg => {
          // Ensure roles are properly cast to OpenAI's expected types
          const role = msg.role === 'user' ? 'user' as const :
                     msg.role === 'assistant' ? 'assistant' as const :
                     'user' as const;
          return { role, content: msg.content };
        })
      ];
      
      console.log('Sending messages to OpenAI');
      
      // Make a non-streaming API call first to get the complete response
      const nonStreamingResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        tools: [
          {
            type: "function",
            function: {
              name: "web_search",
              description: "Search the web for current information about restaurants in New York City.",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query to use. Should be about restaurants in New York City.",
                  }
                },
                required: ["query"]
              }
            }
          }
        ],
        tool_choice: "auto",
      });
      
      let fullResponse = "";
      
      // Check if the model wants to use a tool (web search)
      if (nonStreamingResponse.choices[0]?.message?.tool_calls && nonStreamingResponse.choices[0].message.tool_calls.length > 0) {
        console.log('Model is using web search...');
        
        // Get all tool calls from the response
        const toolCalls = nonStreamingResponse.choices[0].message.tool_calls;
        
        // Create a new messages array that includes the assistant's tool calls
        const updatedMessages = [...messages, nonStreamingResponse.choices[0].message];
        
        // For each tool call, execute it and add the result to the messages
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'web_search') {
            try {
              // Parse the tool call arguments
              const args = JSON.parse(toolCall.function.arguments);
              const query = args.query;
              
              console.log('Web search query:', query);
              
              // Actually perform the search using our utility function
              console.log('Calling googleSearch with query:', query);
              const searchResults = await googleSearch(query);
              console.log('Search results received:', 
                searchResults.error ? `Error: ${searchResults.error}` : 
                `${searchResults.results?.length || 0} results`);
              
              // Format the search results for the AI
              let formattedResults = '';
              
              if (searchResults.error) {
                formattedResults = `Error performing search: ${searchResults.error}`;
                console.error('Search error:', searchResults.error);
              } else if (!searchResults.results || searchResults.results.length === 0) {
                formattedResults = `No results found for query: "${query}"`;
                console.warn('No search results found for query:', query);
              } else {
                // Format the top 3-5 results into a concise, helpful format
                formattedResults = searchResults.results.slice(0, 5).map((result: any, index: number) => {
                  return `[${index + 1}] "${result.title}" (${result.source})
${result.snippet}
Link: ${result.link}`;
                }).join('\n\n');
                console.log('Formatted search results for AI consumption');
              }
              
              // Add the tool result to the messages
              console.log('Adding tool result to messages');
              updatedMessages.push({
                tool_call_id: toolCall.id,
                role: 'tool' as const,
                name: 'web_search',
                content: formattedResults,
              } as any); // Type cast to avoid TypeScript errors
            } catch (searchError) {
              console.error('Error during web search processing:', searchError);
              
              // Add an error message as the tool result so the AI knows the search failed
              updatedMessages.push({
                tool_call_id: toolCall.id,
                role: 'tool' as const,
                name: 'web_search',
                content: `Error performing web search: ${searchError instanceof Error ? searchError.message : 'Unknown error'}`,
              } as any);
            }
          }
        }
        
        // Make a second API call with the tool results
        console.log('Making second API call with tool results...');
        const finalResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: updatedMessages as any, // Type cast to avoid TypeScript errors
          temperature: 0.7,
        });
        
        fullResponse = finalResponse.choices[0]?.message?.content || "";
        console.log('Final response received from OpenAI after using tools');
      } else {
        // No tool was used, use the original response
        fullResponse = nonStreamingResponse.choices[0]?.message?.content || "";
        console.log('Full response received from OpenAI - no tools used');
      }
      
      // Format response as expected by the AI library
      // The AI library expects an array of messages in this format
      return new Response(
        JSON.stringify([{ 
          content: fullResponse,
          id: nonStreamingResponse.id || Date.now().toString(),
          role: 'assistant',
          createdAt: new Date()
        }]),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('OpenAI API call error:', error);
      throw new APIError(
        'OpenAI API error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        500,
        'OPENAI_API_ERROR'
      );
    }
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    
    if (error instanceof APIError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code
        }), 
        { 
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Log the full error details
    if (error instanceof Error) {
      console.error('Unexpected error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error('Unknown error type:', error);
    }

    return new Response(
      JSON.stringify({
        error: 'An error occurred while processing your request',
        code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 