// Cloudflare D1 Database Configuration
import { v4 as uuidv4 } from 'uuid';

// Get D1 database from request context
export function getDB() {
  // In Next.js App Router with Cloudflare, we need to get DB from the request
  // This will be available via platform.env.DB
  if (typeof process !== 'undefined' && process.env.DB) {
    return process.env.DB;
  }
  throw new Error('Database not available');
}

// Initialize database is not needed for D1 as schema is managed via Wrangler
export function initializeDatabase() {
  // No-op for D1 - schema is managed via migrations
  return;
}

export { uuidv4 };

// Helper to get DB from platform context in API routes
export function getDBFromContext(request: Request): D1Database {
  // @ts-expect-error - Cloudflare Pages provides this at runtime
  return request.env?.DB || globalThis.DB;
}

// Type for D1 Database
export type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  dump: () => Promise<ArrayBuffer>;
  batch: <T = unknown>(statements: D1PreparedStatement[]) => Promise<T[]>;
  exec: (query: string) => Promise<D1ExecResult>;
};

export type D1PreparedStatement = {
  bind: (...values: any[]) => D1PreparedStatement;
  first: <T = unknown>(colName?: string) => Promise<T | null>;
  run: () => Promise<D1Result>;
  all: <T = unknown>() => Promise<D1Result<T>>;
  raw: <T = unknown>() => Promise<T[]>;
};

export type D1Result<T = unknown> = {
  results?: T[];
  success: boolean;
  meta: {
    duration: number;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
};

export type D1ExecResult = {
  count: number;
  duration: number;
};
