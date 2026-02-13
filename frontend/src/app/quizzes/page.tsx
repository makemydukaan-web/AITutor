"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, Play, Check, X, ChevronRight, Trophy, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  stream: string;
  class_level: number;
  subject: string;
  topic: string;
  difficulty: string;
  questions: Question[];
  status: string;
}

interface QuizResult {
  question: string;
  selected: number;
  correct: number;
  isCorrect: boolean;
  explanation: string;
}

export default function QuizzesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [results, setResults] = useState<{ score: number; results: QuizResult[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizzes();
    }
  }, [isAuthenticated, subject]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (subject) params.append('subject', subject);

      const res = await fetch(`/api/quizzes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers(new Array(quiz.questions.length).fill(-1));
    setQuizSubmitted(false);
    setResults(null);
  };

  const selectAnswer = (optionIndex: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    if (!selectedQuiz) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/quizzes/${selectedQuiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });

      if (res.ok) {
        const data = await res.json();
        setResults({ score: data.score, results: data.results });
        setQuizSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setQuizSubmitted(false);
    setResults(null);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'expert': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Quiz taking view
  if (selectedQuiz) {
    const question = selectedQuiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedQuiz.questions.length) * 100;

    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          {/* Quiz Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedQuiz.title}</h1>
                <p className="text-gray-600">{selectedQuiz.subject} - {selectedQuiz.topic}</p>
              </div>
              <Button variant="outline" onClick={resetQuiz}>
                <X className="h-4 w-4 mr-2" />
                Exit Quiz
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Progress value={progress} className="flex-1" />
              <span className="text-sm font-medium text-gray-600">
                {currentQuestion + 1} / {selectedQuiz.questions.length}
              </span>
            </div>
          </div>

          {/* Results View */}
          {quizSubmitted && results ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  {results.score >= 70 ? (
                    <div className="p-4 bg-green-100 rounded-full">
                      <Trophy className="h-12 w-12 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-100 rounded-full">
                      <RotateCcw className="h-12 w-12 text-yellow-600" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-3xl">
                  {Math.round(results.score)}%
                </CardTitle>
                <CardDescription>
                  You got {results.results.filter(r => r.isCorrect).length} out of {results.results.length} questions correct
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="font-semibold text-gray-900">Review Answers:</h3>
                {results.results.map((result, i) => (
                  <div key={i} className={cn(
                    "p-4 rounded-lg border",
                    result.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  )}>
                    <div className="flex items-start gap-2">
                      {result.isCorrect ? (
                        <Check className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 mb-2">{result.question}</p>
                        {!result.isCorrect && (
                          <p className="text-sm text-red-600 mb-1">
                            Your answer: {selectedQuiz.questions[i].options[result.selected] || 'Not answered'}
                          </p>
                        )}
                        <p className="text-sm text-green-600 mb-2">
                          Correct answer: {selectedQuiz.questions[i].options[result.correct]}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Explanation:</strong> {result.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 pt-4">
                  <Button onClick={resetQuiz} className="flex-1">
                    Back to Quizzes
                  </Button>
                  <Button variant="outline" onClick={() => startQuiz(selectedQuiz)} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Question View */
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  Question {currentQuestion + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg text-gray-900">{question.question}</p>
                <div className="space-y-3">
                  {question.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      className={cn(
                        "w-full p-4 text-left rounded-lg border-2 transition-all",
                        answers[currentQuestion] === i
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium",
                          answers[currentQuestion] === i
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300 text-gray-500"
                        )}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-gray-900">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  {currentQuestion < selectedQuiz.questions.length - 1 ? (
                    <Button
                      onClick={() => setCurrentQuestion(currentQuestion + 1)}
                      disabled={answers[currentQuestion] === -1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={submitQuiz}
                      disabled={answers.includes(-1) || submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Quiz list view
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-blue-600" />
            Quizzes
          </h1>
          <p className="text-gray-600 mt-1">
            Test your understanding with adaptive quizzes
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Subjects</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quizzes Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No quizzes available</h3>
              <p className="text-gray-600">Check back later for new quizzes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <CardDescription>
                    {quiz.subject} - {quiz.topic}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{quiz.stream}</Badge>
                      <Badge variant="secondary">Class {quiz.class_level}</Badge>
                      <Badge className={getDifficultyColor(quiz.difficulty)}>
                        {quiz.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {quiz.questions.length} questions
                    </p>
                    <Button className="w-full" onClick={() => startQuiz(quiz)}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
