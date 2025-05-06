/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export options for dynamic API usage
  // output: 'export',
  // distDir: 'out',
  
  // Enable API routes
  skipTrailingSlashRedirect: true,
  trailingSlash: true,
  
  // Allow processing of API routes
  rewrites: async () => {
    return [];
  },
  
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'md', 'mdx'],
  images: {
    domains: [
      'images.unsplash.com',
      'www.le-bernardin.com',
      'static01.nyt.com',
      'cdn.vox-cdn.com',
      'pyxis.nymag.com',
      'media.newyorker.com',
      'res.cloudinary.com',
      'c8.alamy.com',
      'upload.wikimedia.org',
      'khni.kerry.com',
      'peterluger.com',
      'dynamic-media-cdn.tripadvisor.com',
      'd2zyb4ugwufqpc.cloudfront.net'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
    unoptimized: false // Enable image optimization
  },
  env: {
    GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_API_KEY || '',
    GOOGLE_SEARCH_ENGINE_ID: process.env.GOOGLE_CSE_ID || '',
    NEXT_PUBLIC_STATIC_EXPORT: 'false'
  }
}

module.exports = nextConfig 