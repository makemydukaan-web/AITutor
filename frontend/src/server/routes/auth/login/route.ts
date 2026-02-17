export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db-edge';
import { verifyPassword, createToken, type User } from '@/lib/auth-edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query user from D1 database
    const userRow = await executeQuery<any>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!userRow) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await verifyPassword(password, userRow.password_hash);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create user object
    const user: User = {
      id: userRow.id,
      email: userRow.email,
      full_name: userRow.full_name,
      role: userRow.role,
      stream: userRow.stream,
      class_level: userRow.class_level,
      subjects: userRow.subjects ? JSON.parse(userRow.subjects) : [],
      created_at: userRow.created_at
    };

    // Create JWT token
    const token = await createToken(user);

    const response = NextResponse.json({
      user,
      token
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
