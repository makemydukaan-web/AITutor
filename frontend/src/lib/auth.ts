import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db, { uuidv4 } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-tutor-secret-key-2024';

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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hashSync(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compareSync(password, hash);
}

export function createToken(user: User): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { sub: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) as any;
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    stream: user.stream,
    class_level: user.class_level,
    subjects: user.subjects ? JSON.parse(user.subjects) : [],
    created_at: user.created_at
  };
}

export async function createUser(data: {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  stream?: string;
  class_level?: number;
}): Promise<User> {
  const id = uuidv4();
  const passwordHash = await hashPassword(data.password);
  
  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, stream, class_level)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.email, passwordHash, data.full_name, data.role || 'student', data.stream || null, data.class_level || null);
  
  return {
    id,
    email: data.email,
    full_name: data.full_name,
    role: (data.role || 'student') as User['role'],
    stream: data.stream,
    class_level: data.class_level,
    created_at: new Date().toISOString()
  };
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
  const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!userRow) return null;
  
  const validPassword = await verifyPassword(password, userRow.password_hash);
  if (!validPassword) return null;
  
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
  
  const token = createToken(user);
  return { user, token };
}
