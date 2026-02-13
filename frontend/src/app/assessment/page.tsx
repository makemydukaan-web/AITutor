"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Assessment {
  id: string;
  subject: string;
  topic: string;
  level: string;
  updated_at: string;
}

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry'];

const TOPICS: Record<string, string[]> = {
  'Mathematics': ['Quadratic Equations', 'Trigonometry', 'Algebra', 'Geometry', 'Calculus'],
  'Science': ['Chemical Reactions and Equations', 'Light - Reflection and Refraction', 'Electricity', 'Magnetism'],
  'Physics': ['Force', 'Motion', 'Energy', 'Waves', 'Optics'],
  'Chemistry': ['Periodic Table', 'Chemical Bonding', 'Acids and Bases', 'Organic Chemistry'],
  'English': ['Grammar', 'Comprehension', 'Writing', 'Literature']
};

const LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting to learn this topic', color: 'bg-green-100 text-green-700' },
  { value: 'intermediate', label: 'Intermediate', description: 'Have basic understanding', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'expert', label: 'Expert', description: 'Strong grasp of concepts', color: 'bg-blue-100 text-blue-700' }
];

export default function AssessmentPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAssessments();
    }
  }, [isAuthenticated]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assessments');
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
      }
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAssessment = async () => {
    if (!selectedSubject || !selectedTopic || !selectedLevel) return;

    setSaving(true);
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          topic: selectedTopic,
          level: selectedLevel
        })
      });

      if (res.ok) {
        await fetchAssessments();
        setSelectedSubject('');
        setSelectedTopic('');
        setSelectedLevel('');
      }
    } catch (error) {
      console.error('Failed to save assessment:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAssessmentForTopic = (subject: string, topic: string) => {
    return assessments.find(a => a.subject === subject && a.topic === topic);
  };

  const getLevelBadge = (level: string) => {
    const levelData = LEVELS.find(l => l.value === level);
    return levelData ? (
      <Badge className={levelData.color}>{levelData.label}</Badge>
    ) : null;
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="h-8 w-8 text-blue-600" />
            Self Assessment
          </h1>
          <p className="text-gray-600 mt-2">
            Rate your knowledge level for each topic. This helps our AI tutor personalize your learning experience.
          </p>
        </div>

        {/* Assessment Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rate Your Knowledge</CardTitle>
            <CardDescription>
              Select a subject, topic, and your current understanding level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Subject</label>
                <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setSelectedTopic(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Topic</label>
                <Select 
                  value={selectedTopic} 
                  onValueChange={setSelectedTopic}
                  disabled={!selectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {(TOPICS[selectedSubject] || []).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(l => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={saveAssessment} 
                  disabled={!selectedSubject || !selectedTopic || !selectedLevel || saving}
                  className="w-full"
                >
                  {saving ? 'Saving...' : 'Save Assessment'}
                </Button>
              </div>
            </div>

            {/* Level Descriptions */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {LEVELS.map(level => (
                <div 
                  key={level.value}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all",
                    selectedLevel === level.value 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedLevel(level.value)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{level.label}</span>
                    {selectedLevel === level.value && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Assessments */}
        <Card>
          <CardHeader>
            <CardTitle>Your Assessments</CardTitle>
            <CardDescription>
              Your self-assessed knowledge levels by subject and topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No assessments yet. Start by rating your knowledge above!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {SUBJECTS.filter(subject => assessments.some(a => a.subject === subject)).map(subject => (
                  <div key={subject}>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      {subject}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-6">
                      {assessments
                        .filter(a => a.subject === subject)
                        .map(assessment => (
                          <div 
                            key={assessment.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm text-gray-700">{assessment.topic}</span>
                            {getLevelBadge(assessment.level)}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
