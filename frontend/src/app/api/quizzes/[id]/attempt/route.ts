export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-edge';
import { executeQuery, executeMutation, uuidv4 } from '@/lib/db-edge';

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
    const quiz = await executeQuery<any>('SELECT * FROM quizzes WHERE id = ?', [id]);
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
    await executeMutation(
      'INSERT INTO quiz_attempts (id, quiz_id, user_id, answers, score) VALUES (?, ?, ?, ?, ?)',
      [attemptId, id, user.id, JSON.stringify(answers), score]
    );

    // Update topic progress
    const existingProgress = await executeQuery<any>(
      'SELECT * FROM topic_progress WHERE user_id = ? AND subject = ? AND topic = ?',
      [user.id, quiz.subject, quiz.topic]
    );

    if (existingProgress) {
      const newAttempts = existingProgress.quiz_attempts + 1;
      const newAverage = ((existingProgress.average_score * existingProgress.quiz_attempts) + score) / newAttempts;
      await executeMutation(
        'UPDATE topic_progress SET quiz_attempts = ?, average_score = ?, mastery_level = ?, last_accessed = ? WHERE id = ?',
        [newAttempts, newAverage, Math.min(newAverage, 100), new Date().toISOString(), existingProgress.id]
      );
    } else {
      await executeMutation(
        'INSERT INTO topic_progress (id, user_id, stream, class_level, subject, topic, mastery_level, quiz_attempts, average_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), user.id, quiz.stream, quiz.class_level, quiz.subject, quiz.topic, score, 1, score]
      );
    }

    return NextResponse.json({ score, results, correctCount, totalQuestions: questions.length });
  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
