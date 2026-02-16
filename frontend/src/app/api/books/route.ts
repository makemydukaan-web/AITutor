export const runtime = 'edge';
import { NextResponse } from 'next/server';
import db, { initializeDatabase, uuidv4 } from '@/lib/db-edge';
import { getCurrentUser } from '@/lib/auth-edge';


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

    const books = db.prepare(query).all(...params);

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Get books error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !['admin', 'teacher', 'content_team'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, author, stream, class_level, subject, topic, summary, content_url, tags } = body;

    if (!title || !author || !stream || !class_level || !subject || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const status = user.role === 'admin' ? 'approved' : 'pending';

    db.prepare(`
      INSERT INTO books (id, title, author, stream, class_level, subject, topic, summary, content_url, tags, uploaded_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, author, stream, class_level, subject, topic, summary || null, content_url || null, tags || null, user.id, status);

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);

    return NextResponse.json({ book });
  } catch (error) {
    console.error('Create book error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
