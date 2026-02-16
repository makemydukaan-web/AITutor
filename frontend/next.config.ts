import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages with @cloudflare/next-on-pages
  serverExternalPackages: ['bcryptjs', 'better-sqlite3', 'bindings'],
  
  // Webpack configuration to handle Node.js modules in Edge Runtime
  webpack: (config, { isServer, nextRuntime }) => {
    // For Edge Runtime, completely replace Node.js modules with empty mocks
    if (nextRuntime === 'edge') {
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.fallback = config.resolve.fallback || {};
      
      // Replace Node.js built-ins with empty modules for Edge Runtime
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
      
      // Ignore better-sqlite3 and other native modules in Edge Runtime
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('better-sqlite3', 'bcryptjs', 'jsonwebtoken', 'bindings');
      }
    }
    
    return config;
  },
  
  // Allow build to succeed with ESLint warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
