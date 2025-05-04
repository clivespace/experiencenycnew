import OpenAI from 'openai';
import { SOCIAL_CONCIERGE_SYSTEM_PROMPT } from './chat-helpers';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
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
      model: 'dall-e-3',
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