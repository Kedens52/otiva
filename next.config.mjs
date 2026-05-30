function hostFromUrl(value) {
  if (!value) return null
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

const envHosts = [
  process.env.SITE_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.APP_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_BASE_URL,
]
  .map(hostFromUrl)
  .filter(Boolean)

const allowedOrigins = Array.from(
  new Set([
    "nashlo.ru",
    "www.nashlo.ru",
    ...envHosts,
    ...(process.env.NODE_ENV === "production"
      ? []
      : ["localhost:3000", "localhost:3001", "127.0.0.1:3000", "127.0.0.1:3001"]),
  ]),
)

/** Trailing slash на SEO-файлах → 308 в Next; внутренний rewrite без редиректа. */
const seoTrailingSlashRewrites = [
  "/robots.txt/",
  "/favicon.ico/",
  "/sitemap.xml/",
  "/sitemap-static.xml/",
  "/sitemap-categories.xml/",
  "/sitemap-cities.xml/",
  "/sitemap-listings.xml/",
  "/sitemap-sellers.xml/",
  "/sitemap-business.xml/",
].map((source) => ({
  source,
  destination: source.replace(/\/$/, ""),
}))

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async rewrites() {
    // beforeFiles — до trailing-slash 308 и до proxy-страниц
    return { beforeFiles: seoTrailingSlashRewrites }
  },
  async redirects() {
    return [
      {
        source: '/api/uploads/:path*',
        destination: '/uploads/:path*',
        permanent: true,
      },
      {
        source: '/feed',
        destination: '/',
        permanent: true,
      },
      { source: '/want-to-buy', destination: '/kyplu', permanent: true },
      { source: '/want-to-buy/:path*', destination: '/kyplu/:path*', permanent: true },
      { source: '/cars', destination: '/transport', permanent: true },
      { source: '/home', destination: '/home-and-garden', permanent: true },
      { source: '/fashion', destination: '/personal-items', permanent: true },
      { source: '/kids', destination: '/personal-items/kids', permanent: true },
      { source: '/sport', destination: '/hobby/sport', permanent: true },
      { source: '/terms', destination: '/legal/user-agreement', permanent: true },
      { source: '/privacy', destination: '/legal/privacy-policy', permanent: true },
      { source: '/cookies', destination: '/legal/cookie-policy', permanent: true },
      { source: '/personal-data', destination: '/legal/personal-data-consent', permanent: true },
      { source: '/transport', destination: '/category/transport', permanent: true },
      { source: '/transport/:segment', destination: '/category/transport/:segment', permanent: true },
      { source: '/real-estate', destination: '/category/real-estate', permanent: true },
      { source: '/real-estate/:segment', destination: '/category/real-estate/:segment', permanent: true },
      { source: '/services', destination: '/category/services', permanent: true },
      { source: '/services/:segment', destination: '/category/services/:segment', permanent: true },
      { source: '/electronics', destination: '/category/electronics', permanent: true },
      { source: '/electronics/:segment', destination: '/category/electronics/:segment', permanent: true },
      { source: '/home-and-garden', destination: '/category/home-and-garden', permanent: true },
      { source: '/home-and-garden/:segment', destination: '/category/home-and-garden/:segment', permanent: true },
      { source: '/personal-items', destination: '/category/personal-items', permanent: true },
      { source: '/personal-items/:segment', destination: '/category/personal-items/:segment', permanent: true },
      { source: '/hobby', destination: '/category/hobby', permanent: true },
      { source: '/hobby/:segment', destination: '/category/hobby/:segment', permanent: true },
      { source: '/animals', destination: '/category/animals', permanent: true },
      { source: '/animals/:segment', destination: '/category/animals/:segment', permanent: true },
      { source: '/jobs', destination: '/category/jobs', permanent: true },
      { source: '/jobs/:segment', destination: '/category/jobs/:segment', permanent: true },
      { source: '/parts', destination: '/category/parts', permanent: true },
      { source: '/goods', destination: '/category/goods', permanent: true },
      { source: '/free', destination: '/category/free', permanent: true },
      { source: '/biznes', destination: '/business', permanent: true },
      { source: '/biznes/:path*', destination: '/search', permanent: true },
      { source: '/b2b', destination: '/business', permanent: true },
      { source: '/b2b/:path*', destination: '/business/:path*', permanent: true },
      { source: '/bisnes', destination: '/business', permanent: true },
      { source: '/bisnes/:path*', destination: '/business', permanent: true },
      { source: '/business/real-estate', destination: '/business/commercial-real-estate', permanent: true },
      { source: '/business/real-estate/:path*', destination: '/business/commercial-real-estate/:path*', permanent: true },
      { source: '/business/catalog', destination: '/business/listings', permanent: true },
      { source: '/business/catalog/:path*', destination: '/business/listings', permanent: true },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
}

export default nextConfig
