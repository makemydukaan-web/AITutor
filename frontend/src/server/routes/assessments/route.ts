export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-edge';
import { executeQueryAll, executeQuery, executeMutation, uuidv4 } from '@/lib/db-edge';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assessments = await executeQueryAll(
      'SELECT * FROM self_assessments WHERE user_id = ?',
      [user.id]
    );

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error('Get assessments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, topic, level } = body;

    if (!subject || !topic || !level) {
      return NextResponse.json(
        { error: 'Subject, topic, and level are required' },
        { status: 400 }
      );
    }

    if (!['beginner', 'intermediate', 'expert'].includes(level)) {
      return NextResponse.json(
        { error: 'Level must be beginner, intermediate, or expert' },
        { status: 400 }
      );
    }

    // Upsert assessment
    const existing = await executeQuery<{ id: string }>(
      'SELECT id FROM self_assessments WHERE user_id = ? AND subject = ? AND topic = ?',
      [user.id, subject, topic]
    );

    if (existing) {
      await executeMutation(
        'UPDATE self_assessments SET level = ?, updated_at = ? WHERE id = ?',
        [level, new Date().toISOString(), existing.id]
      );
    } else {
      const id = uuidv4();
      await executeMutation(
        'INSERT INTO self_assessments (id, user_id, subject, topic, level) VALUES (?, ?, ?, ?, ?)',
        [id, user.id, subject, topic, level]
      );
    }

    return NextResponse.json({ message: 'Assessment saved successfully' });
  } catch (error) {
    console.error('Save assessment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
