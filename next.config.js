/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  // Settings for static export
  skipTrailingSlashRedirect: true,
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
    unoptimized: true // Required for static export
  },
  env: {
    GOOGLE_SEARCH_API_KEY: 'AIzaSyDwstlEMfnItV34_h-nLO-GMSKN9vtwbL8',
    GOOGLE_SEARCH_ENGINE_ID: '764bbc3a489a34eb6',
    NEXT_PUBLIC_STATIC_EXPORT: 'true'
  }
}

module.exports = nextConfig 