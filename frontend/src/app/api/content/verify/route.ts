export const runtime = 'edge';
import { NextResponse } from 'next/server';
import db, { initializeDatabase, uuidv4 } from '@/lib/db-edge';
import { getCurrentUser } from '@/lib/auth-edge';


// Get pending content for verification
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !['admin', 'teacher'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'pending';

    const result: any = {};

    if (contentType === 'all' || contentType === 'books') {
      result.books = db.prepare(`
        SELECT b.*, u.full_name as uploader_name 
        FROM books b 
        LEFT JOIN users u ON b.uploaded_by = u.id 
        WHERE b.status = ?
        ORDER BY b.created_at DESC
      `).all(status);
    }

    if (contentType === 'all' || contentType === 'videos') {
      result.videos = db.prepare(`
        SELECT v.*, u.full_name as uploader_name 
        FROM videos v 
        LEFT JOIN users u ON v.uploaded_by = u.id 
        WHERE v.status = ?
        ORDER BY v.created_at DESC
      `).all(status);
    }

    if (contentType === 'all' || contentType === 'quizzes') {
      const quizzes = db.prepare(`
        SELECT q.*, u.full_name as creator_name 
        FROM quizzes q 
        LEFT JOIN users u ON q.created_by = u.id 
        WHERE q.status = ?
        ORDER BY q.created_at DESC
      `).all(status) as any[];

      result.quizzes = quizzes.map(q => ({
        ...q,
        questions: JSON.parse(q.questions)
      }));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get pending content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Verify/reject content
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !['admin', 'teacher'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { content_type, content_id, action, comments } = body;

    if (!content_type || !content_id || !action) {
      return NextResponse.json(
        { error: 'content_type, content_id, and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const tableName = content_type === 'book' ? 'books' : 
                      content_type === 'video' ? 'videos' : 'quizzes';

    const newStatus = action === 'approve' ? 'approved' : 
                      action === 'reject' ? 'rejected' : 'changes_requested';

    // Update content status
    db.prepare(`
      UPDATE ${tableName} 
      SET status = ?, verified_by = ?, verified_at = ?
      WHERE id = ?
    `).run(newStatus, user.id, new Date().toISOString(), content_id);

    // Log verification history
    db.prepare(`
      INSERT INTO verification_history (id, content_type, content_id, action, verified_by, comments)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), content_type, content_id, action, user.id, comments || null);

    return NextResponse.json({ 
      message: `Content ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked for changes'} successfully` 
    });
  } catch (error) {
    console.error('Verify content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
