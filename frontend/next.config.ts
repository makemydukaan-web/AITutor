import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove better-sqlite3 as we're using D1
  serverExternalPackages: ['bcryptjs'],
  
  // Cloudflare Pages configuration
  output: 'export', // Static export for Cloudflare Pages
  
  // Remove turbopack for better compatibility
  images: {
    unoptimized: true, // Cloudflare will handle image optimization
  },
};

export default nextConfig;
