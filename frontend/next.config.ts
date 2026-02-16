import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages with @cloudflare/next-on-pages
  serverExternalPackages: ['bcryptjs', 'better-sqlite3'],
  
  // Webpack configuration to handle Node.js modules in Edge Runtime
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Node.js modules that can't run in Edge Runtime
      config.externals = config.externals || [];
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
        'fs': 'commonjs fs',
        'path': 'commonjs path',
        'crypto': 'commonjs crypto',
      });
    }
    return config;
  },
  
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
