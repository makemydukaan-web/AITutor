export const runtime = 'edge';
import { NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db-edge';
import { getCurrentUser } from '@/lib/auth-edge';


export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = db.prepare(`
      SELECT cs.*, 
        (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM chat_sessions cs
      WHERE cs.user_id = ?
      ORDER BY cs.updated_at DESC
      LIMIT 50
    `).all(user.id);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
