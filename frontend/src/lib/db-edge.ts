/**
 * Edge Runtime Compatible Database Module for Cloudflare D1
 * This module ONLY works in Cloudflare Pages/Workers environment
 * DO NOT use for local development - use db.ts instead
 */

import { getRequestContext } from '@cloudflare/next-on-pages';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get D1 database instance from Cloudflare request context
 * This ONLY works in Edge Runtime on Cloudflare Pages
 */
export function getD1Database(): D1Database {
  try {
    const context = getRequestContext();
    if (!context?.env?.DB) {
      throw new Error('D1 database not available in request context');
    }
    return context.env.DB;
  } catch (error) {
    // For build time, return a mock object
    console.warn('D1 database not available - using mock');
    return null as any;
  }
}

/**
 * Execute a D1 query safely
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const db = getD1Database();
    if (!db) return null;
    
    const result = await db.prepare(query).bind(...params).first<T>();
    return result;
  } catch (error) {
    console.error('D1 query error:', error);
    return null;
  }
}

/**
 * Execute a D1 query that returns multiple rows
 */
export async function executeQueryAll<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const db = getD1Database();
    if (!db) return [];
    
    const result = await db.prepare(query).bind(...params).all<T>();
    return result.results || [];
  } catch (error) {
    console.error('D1 query error:', error);
    return [];
  }
}

/**
 * Execute a D1 mutation (INSERT, UPDATE, DELETE)
 */
export async function executeMutation(
  query: string,
  params: any[] = []
): Promise<boolean> {
  try {
    const db = getD1Database();
    if (!db) return false;
    
    await db.prepare(query).bind(...params).run();
    return true;
  } catch (error) {
    console.error('D1 mutation error:', error);
    return false;
  }
}

// No initialization needed for D1 - schema is managed via Wrangler migrations
export function initializeDatabase() {
  // No-op for D1
}

export { uuidv4 };

// Type definitions for D1
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
