import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  /* config options here */
  // React Compiler improves runtime output but can noticeably slow dev compilation on large pages.
  reactCompiler: isProd,
  
  // Production optimizations
  compress: true, // Enable gzip compression
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Optimize output
  output: 'standalone',
  
  // Experimental features for better performance
  experimental: {
    // Keep heavy optimizations for production builds; prioritize dev compile speed locally.
    optimizeCss: isProd,
    
    // Enable optimizePackageImports for faster builds
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },

  // Security headers applied to all routes
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // required by Next.js
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' https: wss:",
          "frame-ancestors 'none'",
        ].join('; '),
      },
      // HSTS: only set in production to avoid locking out local HTTP dev
      ...(isProd
        ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
        : []),
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

