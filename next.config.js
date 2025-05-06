/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export when explicitly requested
  ...(process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? {
    output: 'export',
    distDir: 'out',
  } : {}),
  
  // Enable trailing slashes for consistency
  trailingSlash: true,
  
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
    unoptimized: process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true'
  },
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID || '',
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY || ''
  }
}

module.exports = nextConfig 