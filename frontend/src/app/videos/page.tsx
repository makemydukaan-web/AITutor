"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Video, Search, Filter, Clock, User, Play } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  teacher_name: string;
  stream: string;
  class_level: number;
  subject: string;
  topic: string;
  duration: number | null;
  difficulty: string;
  description: string | null;
  tags: string | null;
  status: string;
  created_at: string;
}

export default function VideosPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stream, setStream] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVideos();
    }
  }, [isAuthenticated, stream, subject, difficulty]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stream) params.append('stream', stream);
      if (subject) params.append('subject', subject);
      if (difficulty) params.append('difficulty', difficulty);
      if (search) params.append('search', search);

      const res = await fetch(`/api/videos?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Video className="h-8 w-8 text-blue-600" />
            Video Library
          </h1>
          <p className="text-gray-600 mt-1">
            Watch educational videos from expert teachers
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search videos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={stream} onValueChange={setStream}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Boards</SelectItem>
                  <SelectItem value="CBSE">CBSE</SelectItem>
                  <SelectItem value="ICSE">ICSE</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Subjects</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                </SelectContent>
              </Select>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Videos Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos found</h3>
              <p className="text-gray-600">Try adjusting your filters or search term</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card 
                key={video.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 relative flex items-center justify-center">
                  <Play className="h-16 w-16 text-white/80" />
                  <div className="absolute bottom-2 right-2">
                    <Badge className="bg-black/50 text-white">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(video.duration)}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {video.teacher_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{video.stream}</Badge>
                    <Badge variant="secondary">Class {video.class_level}</Badge>
                    <Badge className={getDifficultyColor(video.difficulty)}>
                      {video.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{video.subject} - {video.topic}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Video Detail Modal */}
        {selectedVideo && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedVideo(null)}
          >
            <Card 
              className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 relative flex items-center justify-center">
                <Play className="h-20 w-20 text-white/80" />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedVideo.title}</CardTitle>
                    <CardDescription>by {selectedVideo.teacher_name}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedVideo(null)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{selectedVideo.stream}</Badge>
                  <Badge variant="secondary">Class {selectedVideo.class_level}</Badge>
                  <Badge variant="secondary">{selectedVideo.subject}</Badge>
                  <Badge className={getDifficultyColor(selectedVideo.difficulty)}>
                    {selectedVideo.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(selectedVideo.duration)}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Topic</h4>
                  <p className="text-gray-700">{selectedVideo.topic}</p>
                </div>
                {selectedVideo.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Description</h4>
                    <p className="text-gray-700">{selectedVideo.description}</p>
                  </div>
                )}
                <Button className="w-full" onClick={() => router.push(`/chat?subject=${selectedVideo.subject}&topic=${selectedVideo.topic}`)}>
                  Ask AI Tutor about this topic
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
