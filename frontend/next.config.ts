import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages with @cloudflare/next-on-pages
  serverExternalPackages: ['bcryptjs'],
};

export default nextConfig;
