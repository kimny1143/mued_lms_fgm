/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development' && process.env.MOBILE_PREVIEW !== 'true',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest.json$/],
  // モバイル専用のService Worker設定
  sw: 'sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: false, // 無限ループ問題の調査のため一時的に無効化
  images: {
    domains: ['images.unsplash.com', 'cloudinary.com', 'res.cloudinary.com'],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      '@components': `${__dirname}/app/components`,
      '@ui': `${__dirname}/app/components/ui`,
      '@sections': `${__dirname}/app/landing-sections`,
      '@lib': `${__dirname}/lib`,
    };
    return config;
  },
  output: 'standalone',
  env: {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // SSR時のエラーを回避するため、特定のページを動的レンダリングに設定
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // 本番環境用セキュリティヘッダー
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // 開発環境での追加セキュリティ
          ...(isDev ? [
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: wss:; connect-src 'self' https: wss: *.supabase.co; frame-ancestors 'self';"
            }
          ] : [])
        ],
      },
      // APIルートのCORS設定
      // 注意: middleware.tsで動的にOriginを設定するため、ここでは基本的なヘッダーのみ設定
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ]
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'query',
            key: '_rsc',
          },
        ],
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig); 