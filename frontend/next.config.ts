import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages with @cloudflare/next-on-pages
  serverExternalPackages: ['bcryptjs'],
  
  // Allow build to succeed with ESLint warnings
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Allow build to succeed with TypeScript errors (if any)
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false, // Keep this false since we fixed TS errors
  },
};

export default nextConfig;
