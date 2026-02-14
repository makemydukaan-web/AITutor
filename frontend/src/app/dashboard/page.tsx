"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Video, Trophy, Clock, TrendingUp, Target, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { apiGet } from '@/lib/api';

interface DashboardStats {
  total_topics_studied: number;
  total_time_spent: number;
  total_quizzes_completed: number;
  average_quiz_score: number;
  subject_stats: Record<string, {
    topics_studied: number;
    time_spent: number;
    average_mastery: number;
  }>;
  assessment_stats: Record<string, {
    topics: { topic: string; level: string }[];
  }>;
}

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const res = await apiGet('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const statCards = [
    {
      icon: BookOpen,
      label: 'Topics Studied',
      value: stats?.total_topics_studied || 0,
      color: 'blue'
    },
    {
      icon: Trophy,
      label: 'Quizzes Completed',
      value: stats?.total_quizzes_completed || 0,
      color: 'green'
    },
    {
      icon: TrendingUp,
      label: 'Average Score',
      value: `${stats?.average_quiz_score || 0}%`,
      color: 'purple'
    },
    {
      icon: Clock,
      label: 'Time Spent',
      value: `${stats?.total_time_spent || 0}m`,
      color: 'orange'
    }
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.full_name}!</h1>
          <p className="text-gray-600 mt-1">Track your learning progress and continue your journey</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/chat">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ask AI Tutor</p>
                  <p className="text-sm text-gray-500">Get help with your doubts</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/assessment">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Self Assessment</p>
                  <p className="text-sm text-gray-500">Track your knowledge level</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/quizzes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Take Quiz</p>
                  <p className="text-sm text-gray-500">Test your understanding</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const colors = colorClasses[stat.color];
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 ${colors.bg} rounded-full`}>
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Subject-wise Progress */}
        {stats?.subject_stats && Object.keys(stats.subject_stats).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Subject Progress</CardTitle>
              <CardDescription>Your mastery level in each subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(stats.subject_stats).map(([subject, data]) => (
                  <div key={subject}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-900">{subject}</h3>
                      <span className="text-sm text-gray-600">
                        {Math.round(data.average_mastery)}% mastery
                      </span>
                    </div>
                    <Progress value={data.average_mastery} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {data.topics_studied} topics studied
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!stats || stats.total_topics_studied === 0) && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start Your Learning Journey
              </h3>
              <p className="text-gray-600 mb-6">
                Begin by assessing your knowledge level and exploring the content library
              </p>
              <div className="flex justify-center gap-4">
                <Button asChild>
                  <Link href="/assessment">Take Self Assessment</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/books">Browse Books</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
