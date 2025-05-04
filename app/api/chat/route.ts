import { NextResponse } from 'next/server';
import { generateChatCompletion } from '@/lib/openai';
import { googleSearch } from '@/lib/utils';
import { ChatMessage } from '@/lib/openai';
import { SOCIAL_CONCIERGE_SYSTEM_PROMPT, SOCIAL_CONCIERGE_EXAMPLE, checkRestaurantStatus } from '@/lib/chat-helpers';

// Function to safely handle potentially large error objects for logging
function sanitizeErrorForLogging(error: any): any {
  try {
    // Create a simplified error object for logging
    const sanitized = {
      message: error?.message || 'Unknown error',
      name: error?.name,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n'), // Only keep first 3 lines of stack
      cause: error?.cause ? {
        message: error.cause.message,
        name: error.cause.name
      } : undefined
    };
    return sanitized;
  } catch (e) {
    return { message: 'Error during error sanitization' };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    // Check if we have an OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { 
          content: "I'm sorry, I couldn't process your request at the moment. Please try again in a few seconds.",
          error: 'API configuration missing' 
        },
        { status: 500 }
      );
    }

    // Check for obvious API key format issues
    if (apiKey.includes('Bearer') && apiKey.length > 100) {
      console.warn('API key appears to have Bearer prefix in environment variable');
    }

    // Get the last user message
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg: ChatMessage) => msg.role === 'user');

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Perform a web search for restaurant-related queries
    let searchResults = '';
    let closedRestaurantWarning = '';
    // ... existing code for restaurant search ...
    
    // Extract this to a separate try/catch block for better error isolation
    try {
      if (lastUserMessage.content.toLowerCase().includes('restaurant') ||
          lastUserMessage.content.toLowerCase().includes('eat') ||
          lastUserMessage.content.toLowerCase().includes('dinner') ||
          lastUserMessage.content.toLowerCase().includes('lunch') ||
          lastUserMessage.content.toLowerCase().includes('food') ||
          lastUserMessage.content.toLowerCase().includes('dining') || 
          lastUserMessage.content.toLowerCase().includes('coffee') || 
          lastUserMessage.content.toLowerCase().includes('cafe') || 
          lastUserMessage.content.toLowerCase().includes('shop')) {
        
        // First search for restaurant recommendations
        const results = await googleSearch(
          `Best New York City restaurants ${lastUserMessage.content}`
        );
        
        if (results.length > 0) {
          // Process the results to check for permanently closed restaurants
          const closedRestaurants: string[] = [];
          const processedResults = [];
          
          for (const result of results) {
            const titleLower = (result.title || '').toLowerCase();
            const snippetLower = (result.snippet || '').toLowerCase();
            
            // Check if this result indicates the restaurant is closed
            const isClosed = 
              titleLower.includes('permanently closed') || 
              snippetLower.includes('permanently closed') ||
              titleLower.includes('closed permanently') ||
              snippetLower.includes('closed permanently');
            
            if (isClosed) {
              // Extract the restaurant name if possible
              const nameMatch = result.title?.match(/^(.*?)(?:\s+\-|\s+\||\s+—|\s+–|:)/);
              if (nameMatch && nameMatch[1]) {
                closedRestaurants.push(nameMatch[1].trim());
              }
            } else {
              // Only include open restaurants in the search results
              processedResults.push(result);
            }
          }
          
          // Format the filtered results
          searchResults = processedResults
            .map(result => `${result.title}\n${result.snippet}\n${result.link}`)
            .join('\n\n');
          
          // Add a warning about closed restaurants if any were found
          if (closedRestaurants.length > 0) {
            closedRestaurantWarning = `WARNING: The following restaurants are PERMANENTLY CLOSED and should NOT be recommended: ${closedRestaurants.join(', ')}. DO NOT mention these restaurants in your response.`;
          }
          
          // If few results are found, perform an additional search for popular restaurants
          if (processedResults.length < 5) {
            const additionalResults = await googleSearch(
              `Popular NYC restaurants ${lastUserMessage.content}`
            );
            
            if (additionalResults && additionalResults.length > 0) {
              const additionalProcessed = additionalResults
                .filter(result => {
                  const titleLower = (result.title || '').toLowerCase();
                  const snippetLower = (result.snippet || '').toLowerCase();
                  return !titleLower.includes('permanently closed') && 
                         !snippetLower.includes('permanently closed');
                })
                .map(result => `${result.title}\n${result.snippet}\n${result.link}`)
                .join('\n\n');
              
              searchResults += `\n\nAdditional restaurant options:\n\n${additionalProcessed}`;
            }
          }
        }
      }
    } catch (searchError) {
      // If search fails, log it but continue with the conversation
      console.error('Error in restaurant search:', searchError);
      // We'll continue without search results rather than failing the whole request
    }

    // Format messages for OpenAI
    // Add system prompt and example first, then user messages
    const formattedMessages: ChatMessage[] = [
      {
        role: 'system',
        content: SOCIAL_CONCIERGE_SYSTEM_PROMPT
      },
      {
        role: 'assistant', 
        content: SOCIAL_CONCIERGE_EXAMPLE
      },
      ...messages,
      ...(searchResults ? [{
        role: 'system',
        content: `Here are some relevant search results to help with your response:\n\n${searchResults}`,
      }] : []),
      ...(closedRestaurantWarning ? [{
        role: 'system',
        content: closedRestaurantWarning
      }] : []),
      {
        role: 'system',
        content: 'CRITICAL REMINDER: ONLY recommend restaurants that are CURRENTLY OPEN and operational. NEVER mention permanently closed establishments in your response.'
      }
    ];

    // Generate chat completion
    const completion = await generateChatCompletion(formattedMessages);

    if (completion.error) {
      console.error('OpenAI API error:', completion.error);
      return NextResponse.json(
        { 
          content: "I'm sorry, I couldn't process your request at the moment. Please try again in a few seconds.",
          error: completion.error 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: completion.content });
  } catch (error) {
    console.error('Error in chat API:', sanitizeErrorForLogging(error));
    return NextResponse.json(
      { 
        content: "I'm sorry, I couldn't process your request at the moment. Please try again in a few seconds.", 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 