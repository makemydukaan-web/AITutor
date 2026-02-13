import { NextResponse } from 'next/server';
import db, { initializeDatabase, uuidv4 } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

initializeDatabase();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { answers } = body;

    // Get quiz
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as any;
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const questions = JSON.parse(quiz.questions);

    // Calculate score
    let correctCount = 0;
    const results = questions.map((q: any, i: number) => {
      const isCorrect = answers[i] === q.correct_answer;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        selected: answers[i],
        correct: q.correct_answer,
        isCorrect,
        explanation: q.explanation
      };
    });

    const score = (correctCount / questions.length) * 100;

    // Save attempt
    const attemptId = uuidv4();
    db.prepare(`
      INSERT INTO quiz_attempts (id, quiz_id, user_id, answers, score)
      VALUES (?, ?, ?, ?, ?)
    `).run(attemptId, id, user.id, JSON.stringify(answers), score);

    // Update topic progress
    const existingProgress = db.prepare(`
      SELECT * FROM topic_progress WHERE user_id = ? AND subject = ? AND topic = ?
    `).get(user.id, quiz.subject, quiz.topic) as any;

    if (existingProgress) {
      const newAttempts = existingProgress.quiz_attempts + 1;
      const newAverage = ((existingProgress.average_score * existingProgress.quiz_attempts) + score) / newAttempts;
      db.prepare(`
        UPDATE topic_progress 
        SET quiz_attempts = ?, average_score = ?, mastery_level = ?, last_accessed = ?
        WHERE id = ?
      `).run(newAttempts, newAverage, Math.min(newAverage, 100), new Date().toISOString(), existingProgress.id);
    } else {
      db.prepare(`
        INSERT INTO topic_progress (id, user_id, stream, class_level, subject, topic, mastery_level, quiz_attempts, average_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), user.id, quiz.stream, quiz.class_level, quiz.subject, quiz.topic, score, 1, score);
    }

    return NextResponse.json({
      score,
      correct: correctCount,
      total: questions.length,
      results,
      attempt_id: attemptId
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
