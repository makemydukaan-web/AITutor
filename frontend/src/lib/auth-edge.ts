/**
 * Edge Runtime Compatible Authentication Module
 * Uses jose library instead of jsonwebtoken for Edge compatibility
 * Uses Web Crypto API instead of bcryptjs
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-tutor-secret-key-2024';
const secret = new TextEncoder().encode(JWT_SECRET);

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin' | 'content_team';
  stream?: string;
  class_level?: number;
  subjects?: string[];
  created_at: string;
}

/**
 * Hash password using Web Crypto API (Edge compatible)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify password using Web Crypto API (Edge compatible)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Create JWT token using jose (Edge compatible)
 */
export async function createToken(user: User): Promise<string> {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
  
  return token;
}

/**
 * Verify JWT token using jose (Edge compatible)
 */
export async function verifyToken(token: string): Promise<{ sub: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * Get current user from cookie - Edge compatible
 * Note: This function does NOT query the database
 * It only verifies the JWT token and returns user data from the token
 */
export async function getCurrentUser(): Promise<Pick<User, 'id' | 'email' | 'role'> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role as User['role'],
  };
}
