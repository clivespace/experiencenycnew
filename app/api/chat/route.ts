import { NextResponse } from 'next/server';
import { generateChatCompletion } from '@/lib/openai';
import { googleSearch } from '@/lib/utils';
import { ChatMessage } from '@/lib/openai';
import { SOCIAL_CONCIERGE_SYSTEM_PROMPT, SOCIAL_CONCIERGE_EXAMPLE } from '@/lib/chat-helpers';

// This route is restored from tmp-api-backup/api/chat/route.ts to serve /api/chat requests

export const dynamic = "force-static";

function sanitizeErrorForLogging(error: any): any {
  try {
    return {
      message: error?.message || 'Unknown error',
      name: error?.name,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
    };
  } catch {
    return { message: 'Error during error sanitization' };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, nonStreaming } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request: messages array is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json({ content: "I'm sorry, I couldn't process your request right now.", error: 'API key missing' }, { status: 500 });
    }

    const lastUserMessage = [...messages].reverse().find((m: ChatMessage) => m.role === 'user');
    if (!lastUserMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    let searchResults = '';
    let closedRestaurantWarning = '';

    try {
      const q = lastUserMessage.content.toLowerCase();
      const hit = ['restaurant', 'eat', 'dinner', 'lunch', 'food', 'dining', 'coffee', 'cafe', 'shop']
        .some(word => q.includes(word));
      if (hit) {
        const results = await googleSearch(`Best New York City restaurants ${lastUserMessage.content}`);
        if (results.length) {
          const closedRestaurants: string[] = [];
          const processed = [] as typeof results;
          for (const r of results) {
            const tl = (r.title || '').toLowerCase();
            const sl = (r.snippet || '').toLowerCase();
            const closed = tl.includes('permanently closed') || sl.includes('permanently closed') || tl.includes('closed permanently') || sl.includes('closed permanently');
            if (closed) {
              const nm = r.title?.match(/^(.*?)(?:\s+\-|\s+\||\s+—|\s+–|:)/);
              if (nm?.[1]) closedRestaurants.push(nm[1].trim());
            } else {
              processed.push(r);
            }
          }
          searchResults = processed.map(r => `${r.title}\n${r.snippet}\n${r.link}`).join('\n\n');
          if (closedRestaurants.length) {
            closedRestaurantWarning = `WARNING: The following restaurants are PERMANENTLY CLOSED and should NOT be recommended: ${closedRestaurants.join(', ')}. DO NOT mention these restaurants in your response.`;
          }
          if (processed.length < 5) {
            const more = await googleSearch(`Popular NYC restaurants ${lastUserMessage.content}`);
            if (more.length) {
              const additional = more.filter(r => {
                const tl = (r.title || '').toLowerCase();
                const sl = (r.snippet || '').toLowerCase();
                return !tl.includes('permanently closed') && !sl.includes('permanently closed');
              }).map(r => `${r.title}\n${r.snippet}\n${r.link}`).join('\n\n');
              searchResults += `\n\nAdditional restaurant options:\n\n${additional}`;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in restaurant search:', err);
    }

    const formattedMessages: ChatMessage[] = [
      { role: 'system', content: SOCIAL_CONCIERGE_SYSTEM_PROMPT },
      { role: 'assistant', content: SOCIAL_CONCIERGE_EXAMPLE },
      ...messages,
      ...(searchResults ? [{ role: 'system', content: `Here are some relevant search results to help with your response:\n\n${searchResults}` }] : []),
      ...(closedRestaurantWarning ? [{ role: 'system', content: closedRestaurantWarning }] : []),
      { role: 'system', content: 'CRITICAL REMINDER: ONLY recommend restaurants that are CURRENTLY OPEN and operational. NEVER mention permanently closed establishments in your response.' },
    ];

    const completion = await generateChatCompletion(formattedMessages);
    if (completion.error) {
      console.error('OpenAI API error:', completion.error);
      return NextResponse.json({ content: "I'm sorry, I couldn't process your request right now.", error: completion.error }, { status: 500 });
    }

    return NextResponse.json({ content: completion.content });
  } catch (error) {
    console.error('Error in chat API:', sanitizeErrorForLogging(error));
    return NextResponse.json({ content: "I'm sorry, I couldn't process your request right now.", error: 'Internal server error' }, { status: 500 });
  }
} 