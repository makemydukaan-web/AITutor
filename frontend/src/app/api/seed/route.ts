export const runtime = 'edge';
import { NextResponse } from 'next/server';

// Seed route - Note: D1 migrations should be used for schema instead
export async function POST() {
  try {
    // For D1, seeding should be done via wrangler d1 migrations
    // This endpoint is kept for compatibility but returns a message
    return NextResponse.json({ 
      message: 'For Cloudflare D1, please use wrangler d1 migrations for seeding',
      info: 'Run: npx wrangler d1 migrations apply <database-name> --remote'
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
