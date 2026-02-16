export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-edge';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stream = searchParams.get('stream');
    const classLevel = searchParams.get('class_level');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const status = searchParams.get('status') || 'approved';

    let query = 'SELECT * FROM quizzes WHERE 1=1';
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

    query += ' ORDER BY created_at DESC';

    const quizzes = db.prepare(query).all(...params) as any[];

    // Parse questions JSON
    const parsedQuizzes = quizzes.map(quiz => ({
      ...quiz,
      questions: JSON.parse(quiz.questions)
    }));

    return NextResponse.json({ quizzes: parsedQuizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
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
    const { title, stream, class_level, subject, topic, difficulty, questions } = body;

    if (!title || !stream || !class_level || !subject || !topic || !difficulty || !questions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const status = user.role === 'admin' ? 'approved' : 'pending';

    db.prepare(`
      INSERT INTO quizzes (id, title, stream, class_level, subject, topic, difficulty, questions, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, stream, class_level, subject, topic, difficulty, JSON.stringify(questions), user.id, status);

    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as any;

    return NextResponse.json({ 
      quiz: {
        ...quiz,
        questions: JSON.parse(quiz.questions)
      }
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
