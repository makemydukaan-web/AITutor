import { NextResponse } from 'next/server';
import db, { initializeDatabase, uuidv4 } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

initializeDatabase();

const EMERGENT_LLM_KEY = process.env.EMERGENT_LLM_KEY;

const SOCRATIC_SYSTEM_PROMPT = `You are a Socratic AI Tutor. Your teaching philosophy follows these principles:

1. **Guide, Don't Tell**: Instead of giving direct answers, guide students to discover answers themselves through thoughtful questions.

2. **Assess Understanding**: Before explaining, ask probing questions to understand what the student already knows.

3. **Build on Knowledge**: Connect new concepts to what the student already understands.

4. **Encourage Critical Thinking**: Ask "why" and "how" questions to deepen understanding.

5. **Adapt to Level**: Adjust your explanations based on the student's demonstrated knowledge level.

6. **Provide Examples**: Use real-world examples and analogies to make concepts relatable.

7. **Check Comprehension**: After explaining, ask questions to verify understanding.

Your conversation flow should be:
1. Acknowledge the student's question
2. Ask a clarifying question about their current understanding
3. Provide explanation with examples
4. Ask a follow-up question to check comprehension
5. Offer to explore related concepts

Be encouraging, patient, and supportive. Use simple language for beginners and more technical terms for advanced students.`;

const SUMMARY_SYSTEM_PROMPT = `You are an expert educational content summarizer. When asked about a topic:

1. Provide a clear, concise summary of the main concepts
2. Highlight key terms and definitions
3. Include important formulas or rules if applicable
4. Give 2-3 practical examples
5. End with "Key Takeaways" as bullet points

Keep summaries well-structured and easy to understand for students.`;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, session_id, subject, topic, context_type } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create session
    let sessionId = session_id;
    if (!sessionId) {
      sessionId = uuidv4();
      db.prepare(`
        INSERT INTO chat_sessions (id, user_id, subject, topic, context_type)
        VALUES (?, ?, ?, ?, ?)
      `).run(sessionId, user.id, subject || null, topic || null, context_type || 'doubt');
    }

    // Save user message
    const userMsgId = uuidv4();
    db.prepare(`
      INSERT INTO chat_messages (id, session_id, role, content)
      VALUES (?, ?, ?, ?)
    `).run(userMsgId, sessionId, 'user', message);

    // Get chat history for context
    const chatHistory = db.prepare(`
      SELECT role, content FROM chat_messages 
      WHERE session_id = ? 
      ORDER BY created_at ASC
      LIMIT 20
    `).all(sessionId) as { role: string; content: string }[];

    // Get student's self-assessment for this subject/topic if available
    let studentLevel = 'intermediate';
    if (subject) {
      const assessment = db.prepare(`
        SELECT level FROM self_assessments 
        WHERE user_id = ? AND subject = ?
        LIMIT 1
      `).get(user.id, subject) as { level: string } | undefined;
      if (assessment) {
        studentLevel = assessment.level;
      }
    }

    // Build system message based on context
    let systemMessage = context_type === 'summary' ? SUMMARY_SYSTEM_PROMPT : SOCRATIC_SYSTEM_PROMPT;
    
    // Add student context
    systemMessage += `\n\nStudent Context:\n- Name: ${user.full_name}\n- Knowledge Level: ${studentLevel}`;
    if (subject) systemMessage += `\n- Subject: ${subject}`;
    if (topic) systemMessage += `\n- Topic: ${topic}`;

    // Prepare messages for API call
    const messages = [
      { role: 'system', content: systemMessage },
      ...chatHistory.map(m => ({ role: m.role, content: m.content }))
    ];

    // Call LLM API via Emergent Integration Proxy
    const INTEGRATION_PROXY_URL = process.env.INTEGRATION_PROXY_URL || 'https://integrations.emergentagent.com';
    
    const response = await fetch(`${INTEGRATION_PROXY_URL}/llm/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EMERGENT_LLM_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LLM API error:', errorData);
      
      // Parse error to provide better user feedback
      let errorMessage = 'Failed to get AI response';
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error?.message?.includes('Budget has been exceeded')) {
          errorMessage = 'API credits exhausted. Please add your OpenAI API key to continue.';
        } else if (errorJson.error?.message?.includes('Invalid API key')) {
          errorMessage = 'Invalid API key. Please configure a valid OpenAI API key.';
        }
      } catch (e) {
        // Use default error message
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    // Save AI response
    const aiMsgId = uuidv4();
    db.prepare(`
      INSERT INTO chat_messages (id, session_id, role, content)
      VALUES (?, ?, ?, ?)
    `).run(aiMsgId, sessionId, 'assistant', aiResponse);

    // Update session timestamp
    db.prepare(`
      UPDATE chat_sessions SET updated_at = ? WHERE id = ?
    `).run(new Date().toISOString(), sessionId);

    return NextResponse.json({
      response: aiResponse,
      session_id: sessionId
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
