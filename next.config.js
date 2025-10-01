// next.config.js
module.exports = {
  images: {
    domains: ['images.unsplash.com'],
  },
  
  // Security headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
      {
        // Stricter headers for API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  
  // HTTPS enforcement in production
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/(.*)',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://nogalssapexcoop.org/:path*',
          permanent: true,
        },
      ];
    }
    return [];
  },
  
  // Experimental features for security
  experimental: {
    // Enable strict mode for better security
    strictNextHead: true,
  },
  
  // Compiler options for security
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Webpack configuration for security
  webpack: (config, { dev, isServer }) => {
    // Security: Disable source maps in production
    if (!dev && !isServer) {
      config.devtool = false;
    }
    
    return config;
  },
};