"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Book, 
  HelpCircle, 
  Plus,
  History,
  Lightbulb,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  subject: string | null;
  topic: string | null;
  context_type: string;
  last_message: string;
  updated_at: string;
}

const QUICK_PROMPTS = {
  summary: [
    'Explain Quadratic Equations briefly',
    'Summarize Newton\'s Laws of Motion',
    'What is Chemical Bonding?',
    'Overview of Trigonometry'
  ],
  doubt: [
    'How do I solve x² - 5x + 6 = 0?',
    'Why does light refract when entering water?',
    'What\'s the difference between mass and weight?',
    'How do I balance chemical equations?'
  ]
};

export default function ChatPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [contextType, setContextType] = useState<'summary' | 'doubt'>('doubt');
  const [subject, setSubject] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          timestamp: m.created_at
        })));
        setSessionId(id);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          session_id: sessionId,
          subject: subject || null,
          context_type: contextType
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        setSessionId(data.session_id);
        fetchSessions();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInputMessage('');
    setShowHistory(false);
  };

  const formatMessageContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <strong key={i} className="block font-semibold">{line.slice(2, -2)}</strong>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-4">{line.slice(2)}</li>;
        }
        if (line.startsWith('# ')) {
          return <h3 key={i} className="font-bold text-lg mt-2">{line.slice(2)}</h3>;
        }
        return <p key={i} className="mb-1">{line}</p>;
      });
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            AI Tutor Chat
          </h1>
          <p className="text-gray-600 mt-1">
            Your personal Socratic tutor - I&apos;ll guide you to understand concepts deeply
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col" style={{ height: '70vh' }}>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Sparkles className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Tutor</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={contextType === 'summary' ? 'secondary' : 'default'} className="text-xs">
                      {contextType === 'summary' ? 'Summary Mode' : 'Socratic Mode'}
                    </Badge>
                    {subject && (
                      <Badge variant="outline" className="text-xs">{subject}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History className="h-4 w-4 mr-1" />
                  History
                </Button>
                <Button variant="outline" size="sm" onClick={startNewChat}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Chat
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {showHistory ? (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 mb-4">Chat History</h4>
                  {sessions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No previous chats</p>
                  ) : (
                    sessions.map(session => (
                      <div
                        key={session.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => loadSession(session.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {session.subject || 'General'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(session.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {session.last_message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 bg-blue-50 rounded-full mb-4">
                    <MessageSquare className="text-blue-500" size={48} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Start a Conversation
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    I&apos;m your Socratic tutor. I&apos;ll ask guiding questions to help you 
                    discover answers and truly understand concepts.
                  </p>
                  <div className="w-full max-w-lg">
                    <p className="text-sm font-medium text-gray-700 mb-3">Quick prompts:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {QUICK_PROMPTS[contextType].map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setInputMessage(prompt)}
                          className="p-3 text-sm text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl p-4',
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">AI Tutor</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">
                        {formatMessageContent(msg.content)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                      <span className="text-xs font-medium text-blue-600">AI Tutor is thinking...</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything about your studies..."
                  disabled={loading}
                  className="flex-1 min-h-[48px] max-h-32 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
                <Button type="submit" disabled={loading || !inputMessage.trim()} size="lg">
                  <Send size={20} />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
            </form>
          </Card>

          {/* Settings Panel */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Chat Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Mode
                </label>
                <Tabs value={contextType} onValueChange={(v) => setContextType(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="doubt" className="text-xs">
                      <HelpCircle size={14} className="mr-1" />
                      Socratic
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="text-xs">
                      <Book size={14} className="mr-1" />
                      Summary
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Subject (Optional)
                </label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Subjects</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Mode Info:</h4>
                {contextType === 'doubt' ? (
                  <div className="text-xs text-gray-600 space-y-2">
                    <p className="flex items-start gap-2">
                      <HelpCircle className="h-3 w-3 mt-0.5 text-blue-500" />
                      <span><strong>Socratic Mode:</strong> I&apos;ll guide you with questions to help you discover answers yourself</span>
                    </p>
                    <p className="ml-5">Perfect for deep understanding and critical thinking</p>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 space-y-2">
                    <p className="flex items-start gap-2">
                      <Book className="h-3 w-3 mt-0.5 text-green-500" />
                      <span><strong>Summary Mode:</strong> I&apos;ll provide concise explanations of topics</span>
                    </p>
                    <p className="ml-5">Great for quick reviews and overviews</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
