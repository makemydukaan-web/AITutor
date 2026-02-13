"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Shield, BookOpen, Video, ClipboardCheck, Check, X, MessageSquare, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Book {
  id: string;
  title: string;
  author: string;
  stream: string;
  class_level: number;
  subject: string;
  topic: string;
  summary: string | null;
  status: string;
  uploader_name: string;
  created_at: string;
}

interface VideoItem {
  id: string;
  title: string;
  teacher_name: string;
  stream: string;
  class_level: number;
  subject: string;
  topic: string;
  difficulty: string;
  status: string;
  uploader_name: string;
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  stream: string;
  class_level: number;
  subject: string;
  topic: string;
  difficulty: string;
  questions: any[];
  status: string;
  creator_name: string;
  created_at: string;
}

export default function VerifyPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ type: string; item: any } | null>(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && !['admin', 'teacher'].includes(user.role)) {
        router.push('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user && ['admin', 'teacher'].includes(user.role)) {
      fetchPendingContent();
    }
  }, [isAuthenticated, user]);

  const fetchPendingContent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/content/verify?status=pending');
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
        setVideos(data.videos || []);
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error('Failed to fetch pending content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (action: 'approve' | 'reject' | 'request_changes') => {
    if (!selectedItem) return;
    setProcessing(true);

    try {
      const res = await fetch('/api/content/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: selectedItem.type,
          content_id: selectedItem.item.id,
          action,
          comments
        })
      });

      if (res.ok) {
        setSelectedItem(null);
        setComments('');
        fetchPendingContent();
      }
    } catch (error) {
      console.error('Failed to verify content:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || !isAuthenticated || !user || !['admin', 'teacher'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const totalPending = books.length + videos.length + quizzes.length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Content Verification
          </h1>
          <p className="text-gray-600 mt-1">
            Review and approve pending content submissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{books.length}</p>
                <p className="text-sm text-gray-600">Books</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Video className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
                <p className="text-sm text-gray-600">Videos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <ClipboardCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{quizzes.length}</p>
                <p className="text-sm text-gray-600">Quizzes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : totalPending === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No pending content to review</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="books">
            <TabsList className="mb-6">
              <TabsTrigger value="books">
                <BookOpen className="h-4 w-4 mr-2" />
                Books ({books.length})
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Video className="h-4 w-4 mr-2" />
                Videos ({videos.length})
              </TabsTrigger>
              <TabsTrigger value="quizzes">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Quizzes ({quizzes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="books">
              <div className="space-y-4">
                {books.map(book => (
                  <Card key={book.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{book.title}</h3>
                          <p className="text-sm text-gray-600">by {book.author}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">{book.stream}</Badge>
                            <Badge variant="secondary">Class {book.class_level}</Badge>
                            <Badge variant="secondary">{book.subject}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            <User className="h-3 w-3 inline mr-1" />
                            Uploaded by {book.uploader_name}
                          </p>
                        </div>
                        <Button onClick={() => setSelectedItem({ type: 'book', item: book })}>
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos">
              <div className="space-y-4">
                {videos.map(video => (
                  <Card key={video.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{video.title}</h3>
                          <p className="text-sm text-gray-600">by {video.teacher_name}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">{video.stream}</Badge>
                            <Badge variant="secondary">Class {video.class_level}</Badge>
                            <Badge variant="secondary">{video.subject}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            <User className="h-3 w-3 inline mr-1" />
                            Uploaded by {video.uploader_name}
                          </p>
                        </div>
                        <Button onClick={() => setSelectedItem({ type: 'video', item: video })}>
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quizzes">
              <div className="space-y-4">
                {quizzes.map(quiz => (
                  <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                          <p className="text-sm text-gray-600">{quiz.questions.length} questions</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">{quiz.stream}</Badge>
                            <Badge variant="secondary">Class {quiz.class_level}</Badge>
                            <Badge variant="secondary">{quiz.subject}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            <User className="h-3 w-3 inline mr-1" />
                            Created by {quiz.creator_name}
                          </p>
                        </div>
                        <Button onClick={() => setSelectedItem({ type: 'quiz', item: quiz })}>
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Review Modal */}
        {selectedItem && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedItem(null)}
          >
            <Card 
              className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Review {selectedItem.type}</CardTitle>
                    <CardDescription>Verify content for accuracy and quality</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {selectedItem.item.title}
                  </h4>
                  {selectedItem.type === 'book' && (
                    <>
                      <p className="text-sm text-gray-600">Author: {selectedItem.item.author}</p>
                      {selectedItem.item.summary && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">Summary:</p>
                          <p className="text-sm text-gray-600 mt-1">{selectedItem.item.summary}</p>
                        </div>
                      )}
                    </>
                  )}
                  {selectedItem.type === 'quiz' && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Questions:</p>
                      {selectedItem.item.questions.map((q: any, i: number) => (
                        <div key={i} className="text-sm text-gray-600 p-2 bg-white rounded">
                          <p><strong>Q{i+1}:</strong> {q.question}</p>
                          <p className="text-xs text-green-600 mt-1">
                            Correct: {q.options[q.correct_answer]}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Comments (optional)
                  </label>
                  <Textarea
                    placeholder="Add feedback or notes..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleVerify('approve')}
                    disabled={processing}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleVerify('request_changes')}
                    disabled={processing}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleVerify('reject')}
                    disabled={processing}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
