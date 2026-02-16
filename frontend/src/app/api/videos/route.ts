export const runtime = 'edge';
import { NextResponse } from 'next/server';
import db, { initializeDatabase, uuidv4 } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

initializeDatabase();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stream = searchParams.get('stream');
    const classLevel = searchParams.get('class_level');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'approved';

    let query = 'SELECT * FROM videos WHERE 1=1';
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
    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (search) {
      query += ' AND (title LIKE ? OR teacher_name LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const videos = db.prepare(query).all(...params);

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Get videos error:', error);
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
    const { title, teacher_name, stream, class_level, subject, topic, video_url, duration, difficulty, description, tags } = body;

    if (!title || !teacher_name || !stream || !class_level || !subject || !topic || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const status = user.role === 'admin' ? 'approved' : 'pending';

    db.prepare(`
      INSERT INTO videos (id, title, teacher_name, stream, class_level, subject, topic, video_url, duration, difficulty, description, tags, uploaded_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, teacher_name, stream, class_level, subject, topic, video_url || null, duration || null, difficulty, description || null, tags || null, user.id, status);

    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Create video error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
