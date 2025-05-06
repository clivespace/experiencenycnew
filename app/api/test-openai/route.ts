import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  // Use environment variable for API key
  apiKey: process.env.OPENAI_API_KEY || "",
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v1',
  },
  defaultQuery: {
    'api-version': '2024-04',
  },
});

export const dynamic = "force-static";

export async function GET() {
  try {
    // Log the API key status (not the actual key)
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        status: 'error',
        message: 'OpenAI API key not configured',
        details: 'Please ensure OPENAI_API_KEY is set in your .env.local file'
      }, { status: 401 });
    }

    // Log request details
    console.log('Sending test request to OpenAI API...');
    console.log('Model:', 'gpt-4o');
    
    // Try a simple completion to verify API key works
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Say hello!' }],
      max_tokens: 10,
    });

    console.log('OpenAI response received:', JSON.stringify(response, null, 2));

    if (!response.choices[0]?.message?.content) {
      throw new Error('No response content received from OpenAI');
    }

    return NextResponse.json({
      status: 'success',
      message: 'OpenAI API is working correctly',
      response: response.choices[0].message.content,
      model: response.model,
      usage: response.usage
    });
  } catch (error: any) {
    console.error('OpenAI Test Error:', error);
    
    // Handle specific OpenAI error types
    if (error.name === 'APIError') {
      return NextResponse.json({
        status: 'error',
        message: 'OpenAI API Error',
        type: error.name,
        code: error.status,
        details: error.message
      }, { status: error.status || 500 });
    }
    
    return NextResponse.json({
      status: 'error',
      message: error.message,
      type: error.constructor.name,
      code: error.code || 500,
      details: 'An unexpected error occurred while testing the OpenAI connection'
    }, { status: 500 });
  }
} 