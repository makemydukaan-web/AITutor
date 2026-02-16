/**
 * Type definitions for Cloudflare Workers/Pages environment
 */

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    EMERGENT_LLM_KEY?: string;
    JWT_SECRET?: string;
  }
}

export {};
