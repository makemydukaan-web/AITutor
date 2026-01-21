import React, { useState, useRef, useEffect } from 'react';
import { chatAPI, metadataAPI } from '../services/api';
import { MessageSquare, Send, Sparkles, Book, HelpCircle } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Layout from '../components/Layout';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [contextType, setContextType] = useState('doubt');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSubjects = async () => {
    try {
      const response = await metadataAPI.getSubjects();
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        message: inputMessage,
        session_id: sessionId,
        subject: subject || null,
        context_type: contextType
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      setSessionId(response.data.session_id);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInputMessage('');
  };

  const quickQuestions = {
    summary: [
      'Explain Quadratic Equations',
      'Summarize Newton\'s Laws of Motion',
      'What is Chemical Kinetics?'
    ],
    doubt: [
      'How do I solve for x in ax² + bx + c = 0?',
      'What is the difference between velocity and acceleration?',
      'Explain the concept of inertia'
    ]
  };

  return (
    <Layout>
      <div className=\"max-w-6xl mx-auto\">
        <div className=\"mb-6\">
          <h1 className=\"text-3xl font-bold text-gray-900 mb-2\">AI Tutor Chat</h1>
          <p className=\"text-gray-600\">Ask questions, get summaries, and clarify your doubts</p>
        </div>

        <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
          {/* Chat Area */}
          <Card className=\"lg:col-span-2 flex flex-col\" style={{ height: '70vh' }}>
            {/* Chat Header */}
            <div className=\"p-4 border-b flex items-center justify-between\">
              <div className=\"flex items-center gap-2\">
                <div className=\"p-2 bg-blue-100 rounded-full\">
                  <Sparkles className=\"text-blue-600\" size={20} />
                </div>
                <div>
                  <h3 className=\"font-semibold text-gray-900\">AI Tutor</h3>
                  <p className=\"text-xs text-gray-500\">
                    {contextType === 'summary' ? 'Summary Mode' : 'Doubt Resolution Mode'}
                  </p>
                </div>
              </div>
              <Button onClick={startNewChat} variant=\"outline\" size=\"sm\">
                New Chat
              </Button>
            </div>

            {/* Messages */}
            <div className=\"flex-1 overflow-y-auto p-4 space-y-4\">
              {messages.length === 0 ? (
                <div className=\"flex flex-col items-center justify-center h-full text-center\">
                  <MessageSquare className=\"text-gray-300 mb-4\" size={64} />
                  <h3 className=\"text-xl font-semibold text-gray-900 mb-2\">
                    Start a conversation
                  </h3>
                  <p className=\"text-gray-600 mb-4\">
                    Ask me anything about your studies!
                  </p>
                  <div className=\"grid grid-cols-1 gap-2 max-w-md\">
                    {quickQuestions[contextType]?.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setInputMessage(q)}
                        className=\"p-3 text-sm text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors\"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className=\"whitespace-pre-wrap\">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className=\"flex justify-start\">
                  <div className=\"bg-gray-100 rounded-lg p-4\">
                    <div className=\"flex gap-2\">
                      <div className=\"w-2 h-2 bg-gray-400 rounded-full animate-bounce\" />
                      <div className=\"w-2 h-2 bg-gray-400 rounded-full animate-bounce\" style={{ animationDelay: '0.2s' }} />
                      <div className=\"w-2 h-2 bg-gray-400 rounded-full animate-bounce\" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className=\"p-4 border-t\">
              <div className=\"flex gap-2\">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder=\"Type your message...\"
                  disabled={loading}
                  className=\"flex-1\"
                />
                <Button type=\"submit\" disabled={loading || !inputMessage.trim()}>
                  <Send size={20} />
                </Button>
              </div>
            </form>
          </Card>

          {/* Settings Sidebar */}
          <Card className=\"p-6 h-fit\">
            <h3 className=\"font-semibold text-gray-900 mb-4\">Chat Settings</h3>
            
            <div className=\"space-y-4\">
              <div>
                <label className=\"text-sm font-medium text-gray-700 mb-2 block\">
                  Context Type
                </label>
                <Tabs value={contextType} onValueChange={setContextType}>
                  <TabsList className=\"grid w-full grid-cols-2\">
                    <TabsTrigger value=\"summary\">
                      <Book size={16} className=\"mr-2\" />
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value=\"doubt\">
                      <HelpCircle size={16} className=\"mr-2\" />
                      Doubt
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <label className=\"text-sm font-medium text-gray-700 mb-2 block\">
                  Subject (Optional)
                </label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder=\"Select subject\" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=\" \">All Subjects</SelectItem>
                    {subjects.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className=\"pt-4 border-t\">
                <h4 className=\"text-sm font-medium text-gray-700 mb-2\">Tips:</h4>
                <ul className=\"text-xs text-gray-600 space-y-2\">
                  <li>• Summary mode: Get concise explanations of topics</li>
                  <li>• Doubt mode: Get detailed help with specific questions</li>
                  <li>• Select a subject for better context</li>
                  <li>• Be specific in your questions</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
