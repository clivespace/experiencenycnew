import OpenAI from 'openai';
import { SOCIAL_CONCIERGE_SYSTEM_PROMPT } from './chat-helpers';

// Helper function to clean the API key (removes 'Bearer ' if present)
function cleanApiKey(apiKey: string | undefined): string | undefined {
  if (!apiKey) return undefined;
  return apiKey.startsWith('Bearer ') ? apiKey.substring(7).trim() : apiKey;
}

// Initialize OpenAI client with cleaned API key
const openai = new OpenAI({
  apiKey: cleanApiKey(process.env.OPENAI_API_KEY),
  organization: process.env.OPENAI_ORG_ID,
  dangerouslyAllowBrowser: false,
  timeout: 30000, // 30 second timeout
});

// Type for chat messages
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Type for chat completion response
export type ChatCompletionResponse = {
  content: string;
  error?: string;
};

/**
 * Generates a chat completion using OpenAI's API
 * @param messages Array of chat messages
 * @returns Chat completion response
 */
export async function generateChatCompletion(
  messages: ChatMessage[]
): Promise<ChatCompletionResponse> {
  try {
    // Note: We no longer need to add the system prompt here
    // The chat API already includes it

    // Using GPT-4o model
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Switched back to gpt-4o from gpt-3.5-turbo
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return { content };
  } catch (error) {
    console.error('Error generating chat completion:', error);
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Log additional details for debugging
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        cause: (error as any).cause,
        stack: error.stack
      });
    }
    
    return {
      content: "I'm sorry, I couldn't process your request at the moment. Please try again in a few seconds.",
      error: errorMessage,
    };
  }
}

/**
 * Generates an image using OpenAI's DALL-E API
 * @param prompt Image generation prompt
 * @returns URL of the generated image
 */
export async function generateImage(prompt: string): Promise<string | null> {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-2', // Using a more stable model
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data[0]?.url || null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
} 