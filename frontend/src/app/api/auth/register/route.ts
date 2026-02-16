export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { hashPassword, createToken, User } from '@/lib/auth-edge';
import { executeQuery, executeMutation, uuidv4 } from '@/lib/db-edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, role, stream, class_level } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const passwordHash = await hashPassword(password);

    await executeMutation(
      'INSERT INTO users (id, email, password_hash, full_name, role, stream, class_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, email, passwordHash, full_name, role || 'student', stream || null, class_level || null]
    );

    const user: User = {
      id,
      email,
      full_name,
      role: (role || 'student') as User['role'],
      stream,
      class_level,
      subjects: [],
      created_at: new Date().toISOString()
    };

    const token = await createToken(user);

    const response = NextResponse.json({ user, token });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
