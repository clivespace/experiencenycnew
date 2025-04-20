import type { ChatCompletionChunk } from 'openai/resources';

declare module 'ai' {
  export class StreamingTextResponse extends Response {
    constructor(stream: ReadableStream);
  }

  type ChatCompletionChunk = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
      index: number;
      delta: {
        content: string | null;
        role?: string;
        function_call?: {
          name?: string;
          arguments?: string;
        };
      };
      finish_reason: string | null;
    }>;
  };

  export function OpenAIStream(response: AsyncIterable<ChatCompletionChunk>): ReadableStream;
} 