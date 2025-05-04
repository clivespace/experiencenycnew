# NYC Dining Landing Page [![CI](https://github.com/clivespace/experiencenyc/actions/workflows/ci.yml/badge.svg?branch=)](https://github.com/clivespace/experiencenyc/actions/workflows/ci.yml)

A modern, responsive web application showcasing New York City's finest dining establishments with AI-powered recommendations.

## Features

- Interactive restaurant showcase
- AI-powered dining recommendations via ChatGPT
- Responsive, modern UI
- Real-time restaurant image search
- Restaurant details and reviews

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # Google Search API Credentials
   GOOGLE_SEARCH_API_KEY=your-api-key-here
   GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id-here
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Google Search API Setup

To use the restaurant image search functionality:

1. Create a Google Cloud Project at [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Enable the "Custom Search API" in Google Cloud Console
3. Create API credentials to get your API key
4. Create a Programmable Search Engine at [https://programmablesearchengine.google.com/](https://programmablesearchengine.google.com/)
5. Configure your search engine to search the entire web
6. Get your Search Engine ID from the search engine settings
7. Add both values to your `.env.local` file

## License

This project is licensed under the MIT License.

## Building for Production

To create a production build:

```
npm run build
```

To start the production server:

```
npm start
```

## Deployment

This project can be deployed on Vercel, Netlify, or any platform that supports Next.js applications.

## Technologies Used

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [OpenAI API](https://platform.openai.com/) (for search enhancements)
- [Unsplash API](https://unsplash.com/developers) (for images)
- [Google Custom Search API](https://developers.google.com/custom-search/) (for search functionality) 