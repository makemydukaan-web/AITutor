export const runtime = 'edge';
import { NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db';

initializeDatabase();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stream = searchParams.get('stream');
    const classLevel = searchParams.get('class_level');

    let query = 'SELECT DISTINCT subject FROM books WHERE status = ?';
    const params: any[] = ['approved'];

    if (stream) {
      query += ' AND stream = ?';
      params.push(stream);
    }
    if (classLevel) {
      query += ' AND class_level = ?';
      params.push(parseInt(classLevel));
    }

    const subjects = db.prepare(query).all(...params) as { subject: string }[];

    return NextResponse.json({ 
      subjects: subjects.map(s => s.subject).sort() 
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
