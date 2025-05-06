# NYC Dining Landing Page

A beautiful landing page showcasing New York City's finest dining establishments. Built with Next.js 15.

## Features

- Restaurant showcase with images and details
- Mobile-responsive design
- Static site generation for fast loading
- Beautiful UI with modern design practices

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Building for Production

```bash
# Regular build with server features
npm run build

# Static export (for GitHub Pages or other static hosts)
# 1. Temporarily rename API directory: mv app/api app/_api_disabled
# 2. Build static site: npm run build
# 3. Restore API directory: mv app/_api_disabled app/api
# 4. Static files will be in the 'out' directory
```

## Deployment

The static export can be deployed to any static hosting service such as GitHub Pages, Vercel, Netlify, or any web server.

## API Keys Configuration for Image Search

To enable image search functionality on Vercel, you need to set up the following environment variables in your Vercel project settings:

1. **Google Custom Search API** (primary provider):
   - `GOOGLE_API_KEY`: Your Google Cloud Platform API key with Custom Search API enabled
   - `GOOGLE_CSE_ID`: Your Google Custom Search Engine ID

2. **Unsplash API** (fallback provider):
   - `UNSPLASH_ACCESS_KEY`: Your Unsplash API access key

3. **Dynamic Mode** (for API routes):
   - `NEXT_PUBLIC_STATIC_EXPORT`: Set to `false` to enable dynamic API routes

To set these in Vercel:
1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add each key-value pair
4. Redeploy your application

For local development, create a `.env.local` file with these variables.

## Environment Variables

To enable image search functionality in both development and production, set up the following environment variables:

### Required for Image APIs

```
# Google Custom Search API Keys
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_google_cse_id

# Unsplash API Keys
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

### Setting up on Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each key-value pair:
   - `GOOGLE_API_KEY` - your Google API key
   - `GOOGLE_CSE_ID` - your Google Custom Search Engine ID  
   - `UNSPLASH_ACCESS_KEY` - your Unsplash access key
4. Redeploy your application

### Local Development

For local development, create a `.env.local` file in the project root with these variables.

## Technologies Used

- Next.js 15
- React
- Tailwind CSS
- Shadcn UI Components 