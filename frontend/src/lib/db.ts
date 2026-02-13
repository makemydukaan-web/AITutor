import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'data', 'ai_tutor.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initializeDatabase() {
  // Users table
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`CREATE INDEX IF NOT EXISTS idx_books_subject ON books(stream, class_level, subject)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_videos_subject ON videos(stream, class_level, subject)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(stream, class_level, subject)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_self_assessments_user ON self_assessments(user_id)`);
}

export { db, uuidv4 };
export default db;
