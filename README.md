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

## Technologies Used

- Next.js 15
- React
- Tailwind CSS
- Shadcn UI Components 