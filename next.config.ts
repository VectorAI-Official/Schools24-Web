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
};

export default nextConfig;

