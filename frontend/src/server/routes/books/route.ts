export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-edge';
import { executeQueryAll } from '@/lib/db-edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stream = searchParams.get('stream');
    const classLevel = searchParams.get('class_level');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'approved';

    let query = 'SELECT * FROM books WHERE 1=1';
    const params: any[] = [];

    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (stream) {
      query += ' AND stream = ?';
      params.push(stream);
    }
    if (classLevel) {
      query += ' AND class_level = ?';
      params.push(parseInt(classLevel));
    }
    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }
    if (topic) {
      query += ' AND topic = ?';
      params.push(topic);
    }
    if (search) {
      query += ' AND (title LIKE ? OR author LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const books = await executeQueryAll(query, params);

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Get books error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
