export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { executeQueryAll } from '@/lib/db-edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const stream = searchParams.get('stream');
    const classLevel = searchParams.get('class_level');

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    let query = 'SELECT DISTINCT topic FROM books WHERE status = ? AND subject = ?';
    const params: any[] = ['approved', subject];

    if (stream) {
      query += ' AND stream = ?';
      params.push(stream);
    }
    if (classLevel) {
      query += ' AND class_level = ?';
      params.push(parseInt(classLevel));
    }

    const topics = await executeQueryAll<{ topic: string }>(query, params);

    return NextResponse.json({ 
      topics: topics.map(t => t.topic).sort() 
    });
  } catch (error) {
    console.error('Get topics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
