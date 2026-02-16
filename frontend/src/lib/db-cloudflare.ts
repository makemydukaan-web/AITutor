/**
 * Database configuration for Cloudflare D1 (production) and better-sqlite3 (local dev)
 * 
 * For Cloudflare Pages:
 * - Uses D1 binding via getRequestContext()
 * - Must be called inside API route handlers
 * 
 * For local development:
 * - Uses better-sqlite3
 * - Synchronous operations
 */

import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { createSQLiteAdapter, createD1Adapter, type DBAdapter } from './db-adapter';

// Local SQLite instance for development
let localDB: Database.Database | null = null;

function getLocalDB(): Database.Database {
  if (!localDB) {
    const dbPath = path.join(process.cwd(), 'data', 'ai_tutor.db');
    const dataDir = path.join(process.cwd(), 'data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    localDB = new Database(dbPath);
    localDB.pragma('journal_mode = WAL');
  }
  return localDB;
}

/**
 * Get database instance - works in both local and Cloudflare environments
 * 
 * @param useD1 - Force D1 usage (for Cloudflare Pages API routes)
 * @returns Database adapter
 */
export function getDB(useD1 = false): DBAdapter {
  // In Cloudflare Pages environment
  if (useD1 || process.env.CF_PAGES) {
    try {
      const context = getRequestContext();
      if (context?.env?.DB) {
        return createD1Adapter(context.env.DB);
      }
    } catch (e) {
      // getRequestContext() can only be called inside request handlers
      // Fall back to local DB for build time / initialization
    }
  }
  
  // Local development with better-sqlite3
  return createSQLiteAdapter(getLocalDB());
}

/**
 * Legacy export for backward compatibility
 * Note: This will only work with better-sqlite3 operations (.get, .run, .all)
 * For D1, use getDB() inside API route handlers
 */
const db = getLocalDB();

// Initialize database schema
export function initializeDatabase() {
  const localDb = getLocalDB();
  
  // Users table
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      stream TEXT,
      class_level INTEGER,
      subjects TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Self assessments table
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS self_assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      level TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, subject, topic)
    )
  `);

  // Books table
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      stream TEXT NOT NULL,
      class_level INTEGER NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      summary TEXT,
      content_url TEXT,
      tags TEXT,
      uploaded_by TEXT,
      status TEXT DEFAULT 'pending',
      verified_by TEXT,
      verified_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Videos table
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      stream TEXT NOT NULL,
      class_level INTEGER NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      video_url TEXT,
      duration INTEGER,
      difficulty TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      uploaded_by TEXT,
      status TEXT DEFAULT 'pending',
      verified_by TEXT,
      verified_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Quizzes table
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      stream TEXT NOT NULL,
      class_level INTEGER NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      questions TEXT NOT NULL,
      created_by TEXT,
      status TEXT DEFAULT 'pending',
      verified_by TEXT,
      verified_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Quiz attempts table
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      answers TEXT NOT NULL,
      score REAL NOT NULL,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Chat sessions table
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT,
      topic TEXT,
      context_type TEXT DEFAULT 'doubt',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Chat messages table
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    )
  `);

  // Topic progress table
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS topic_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stream TEXT NOT NULL,
      class_level INTEGER NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      mastery_level REAL DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      quiz_attempts INTEGER DEFAULT 0,
      average_score REAL DEFAULT 0,
      last_accessed TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, subject, topic)
    )
  `);

  // Content verification history
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS verification_history (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      content_id TEXT NOT NULL,
      action TEXT NOT NULL,
      verified_by TEXT NOT NULL,
      comments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  localDb.exec(`CREATE INDEX IF NOT EXISTS idx_books_subject ON books(stream, class_level, subject)`);
  localDb.exec(`CREATE INDEX IF NOT EXISTS idx_videos_subject ON videos(stream, class_level, subject)`);
  localDb.exec(`CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(stream, class_level, subject)`);
  localDb.exec(`CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id)`);
  localDb.exec(`CREATE INDEX IF NOT EXISTS idx_self_assessments_user ON self_assessments(user_id)`);
}

export { db, uuidv4 };
export default db;
