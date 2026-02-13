import { NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

initializeDatabase();

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get progress data
    const progress = db.prepare(`
      SELECT * FROM topic_progress WHERE user_id = ?
    `).all(user.id) as any[];

    // Get quiz attempts
    const quizAttempts = db.prepare(`
      SELECT * FROM quiz_attempts WHERE user_id = ?
    `).all(user.id) as any[];

    // Get self assessments
    const assessments = db.prepare(`
      SELECT * FROM self_assessments WHERE user_id = ?
    `).all(user.id) as any[];

    // Calculate stats
    const totalTopics = progress.length;
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
    const totalQuizzes = quizAttempts.length;
    const avgScore = quizAttempts.length > 0 
      ? quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length 
      : 0;

    // Subject-wise stats
    const subjectStats: Record<string, any> = {};
    for (const p of progress) {
      if (!subjectStats[p.subject]) {
        subjectStats[p.subject] = {
          topics_studied: 0,
          time_spent: 0,
          average_mastery: 0,
          total_mastery: 0
        };
      }
      subjectStats[p.subject].topics_studied++;
      subjectStats[p.subject].time_spent += p.time_spent || 0;
      subjectStats[p.subject].total_mastery += p.mastery_level || 0;
    }

    // Calculate averages
    for (const subject in subjectStats) {
      const count = subjectStats[subject].topics_studied;
      subjectStats[subject].average_mastery = count > 0 
        ? subjectStats[subject].total_mastery / count 
        : 0;
      delete subjectStats[subject].total_mastery;
    }

    // Assessment stats
    const assessmentStats: Record<string, any> = {};
    for (const a of assessments) {
      if (!assessmentStats[a.subject]) {
        assessmentStats[a.subject] = { topics: [] };
      }
      assessmentStats[a.subject].topics.push({
        topic: a.topic,
        level: a.level
      });
    }

    return NextResponse.json({
      total_topics_studied: totalTopics,
      total_time_spent: totalTimeSpent,
      total_quizzes_completed: totalQuizzes,
      average_quiz_score: Math.round(avgScore * 100) / 100,
      subject_stats: subjectStats,
      assessment_stats: assessmentStats,
      recent_progress: progress.slice(0, 5)
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
