from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from typing import Optional, List
from datetime import datetime
import asyncio

from models import *
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
from database import (
    db, users_collection, books_collection, videos_collection,
    quizzes_collection, quiz_attempts_collection, chat_sessions_collection,
    topic_progress_collection, student_profiles_collection, init_db
)
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="AI Tutor Platform")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= Authentication Dependency =============
async def get_current_user(authorization: Optional[str] = Header(None)) -> UserInDB:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_doc = await users_collection.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return UserInDB(**user_doc)

# ============= Authentication Routes =============
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        profile_data={}
    )
    
    user_in_db = UserInDB(
        **user.dict(),
        password_hash=get_password_hash(user_data.password)
    )
    
    await users_collection.insert_one(user_in_db.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.dict()
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await users_collection.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_in_db = UserInDB(**user_doc)
    
    if not verify_password(credentials.password, user_in_db.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user_in_db.id, "role": user_in_db.role})
    
    user = User(**{k: v for k, v in user_in_db.dict().items() if k != 'password_hash'})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.dict()
    }

@api_router.get("/auth/me")
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    user = User(**{k: v for k, v in current_user.dict().items() if k != 'password_hash'})
    return user

# ============= Book Routes =============
@api_router.post("/books", response_model=Book)
async def create_book(book: BookCreate, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    book_doc = Book(**book.dict(), uploaded_by=current_user.id)
    
    if current_user.role == UserRole.ADMIN:
        book_doc.approved = True
    
    await books_collection.insert_one(book_doc.dict())
    return book_doc

@api_router.get("/books", response_model=List[Book])
async def get_books(
    stream: Optional[str] = None,
    class_level: Optional[int] = None,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    search: Optional[str] = None
):
    query = {"approved": True}
    
    if stream:
        query["stream"] = stream
    if class_level:
        query["class_level"] = class_level
    if subject:
        query["subject"] = subject
    if topic:
        query["topic"] = topic
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    books = await books_collection.find(query).to_list(100)
    return [Book(**book) for book in books]

@api_router.get("/books/{book_id}", response_model=Book)
async def get_book(book_id: str):
    book_doc = await books_collection.find_one({"id": book_id})
    if not book_doc:
        raise HTTPException(status_code=404, detail="Book not found")
    return Book(**book_doc)

# ============= Video Routes =============
@api_router.post("/videos", response_model=Video)
async def create_video(video: VideoCreate, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    video_doc = Video(**video.dict(), uploaded_by=current_user.id)
    
    if current_user.role == UserRole.ADMIN:
        video_doc.approved = True
    
    await videos_collection.insert_one(video_doc.dict())
    return video_doc

@api_router.get("/videos", response_model=List[Video])
async def get_videos(
    stream: Optional[str] = None,
    class_level: Optional[int] = None,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None
):
    query = {"approved": True}
    
    if stream:
        query["stream"] = stream
    if class_level:
        query["class_level"] = class_level
    if subject:
        query["subject"] = subject
    if topic:
        query["topic"] = topic
    if difficulty:
        query["difficulty"] = difficulty
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"teacher_name": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    videos = await videos_collection.find(query).to_list(100)
    return [Video(**video) for video in videos]

@api_router.get("/videos/{video_id}", response_model=Video)
async def get_video(video_id: str):
    video_doc = await videos_collection.find_one({"id": video_id})
    if not video_doc:
        raise HTTPException(status_code=404, detail="Video not found")
    return Video(**video_doc)

# ============= Quiz Routes =============
@api_router.post("/quizzes", response_model=Quiz)
async def create_quiz(quiz: QuizCreate, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    quiz_doc = Quiz(**quiz.dict(), created_by=current_user.id)
    await quizzes_collection.insert_one(quiz_doc.dict())
    return quiz_doc

@api_router.get("/quizzes", response_model=List[Quiz])
async def get_quizzes(
    stream: Optional[str] = None,
    class_level: Optional[int] = None,
    subject: Optional[str] = None,
    topic: Optional[str] = None
):
    query = {}
    
    if stream:
        query["stream"] = stream
    if class_level:
        query["class_level"] = class_level
    if subject:
        query["subject"] = subject
    if topic:
        query["topic"] = topic
    
    quizzes = await quizzes_collection.find(query).to_list(100)
    return [Quiz(**quiz) for quiz in quizzes]

@api_router.post("/quizzes/{quiz_id}/attempt")
async def submit_quiz(
    quiz_id: str,
    answers: List[int],
    current_user: UserInDB = Depends(get_current_user)
):
    quiz_doc = await quizzes_collection.find_one({"id": quiz_id})
    if not quiz_doc:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    quiz = Quiz(**quiz_doc)
    
    # Calculate score
    correct_count = 0
    for i, answer in enumerate(answers):
        if i < len(quiz.questions) and answer == quiz.questions[i].correct_answer:
            correct_count += 1
    
    score = (correct_count / len(quiz.questions)) * 100 if quiz.questions else 0
    
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=current_user.id,
        answers=answers,
        score=score
    )
    
    await quiz_attempts_collection.insert_one(attempt.dict())
    
    # Update progress
    await update_topic_progress(
        current_user.id,
        quiz.stream,
        quiz.class_level,
        quiz.subject,
        quiz.topic,
        score
    )
    
    return {
        "score": score,
        "correct": correct_count,
        "total": len(quiz.questions),
        "attempt_id": attempt.id
    }

# ============= AI Chat Routes =============
@api_router.post("/chat")
async def chat_with_ai(
    chat_request: ChatRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        # Get or create session
        if chat_request.session_id:
            session_doc = await chat_sessions_collection.find_one({"id": chat_request.session_id})
            if session_doc:
                session = ChatSession(**session_doc)
            else:
                session = ChatSession(user_id=current_user.id, subject=chat_request.subject, topic=chat_request.topic)
        else:
            session = ChatSession(user_id=current_user.id, subject=chat_request.subject, topic=chat_request.topic)
        
        # Add user message to session
        user_message = ChatMessage(role="user", content=chat_request.message)
        session.messages.append(user_message)
        
        # Create AI chat instance
        emergent_llm_key = os.getenv("EMERGENT_LLM_KEY")
        
        # Build system message based on context
        if chat_request.context_type == "summary":
            system_message = f"You are an expert AI tutor for {chat_request.subject or 'various subjects'}. Provide clear, concise summaries of educational topics. Focus on key concepts and make them easy to understand for students."
        elif chat_request.context_type == "doubt":
            system_message = f"You are an AI tutor helping students with doubts and questions about {chat_request.subject or 'their subjects'}. Provide detailed explanations with examples. Be patient, encouraging, and thorough."
        else:
            system_message = "You are a helpful AI tutor. Assist students with their learning needs."
        
        # Create LLM chat
        llm_chat = LlmChat(
            api_key=emergent_llm_key,
            session_id=session.id,
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        # Get AI response
        ai_response_text = await llm_chat.send_message(
            UserMessage(text=chat_request.message)
        )
        
        # Add AI response to session
        ai_message = ChatMessage(role="assistant", content=ai_response_text)
        session.messages.append(ai_message)
        session.updated_at = datetime.utcnow()
        
        # Save session
        await chat_sessions_collection.update_one(
            {"id": session.id},
            {"$set": session.dict()},
            upsert=True
        )
        
        return {
            "response": ai_response_text,
            "session_id": session.id
        }
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@api_router.get("/chat/sessions")
async def get_chat_sessions(current_user: UserInDB = Depends(get_current_user)):
    sessions = await chat_sessions_collection.find(
        {"user_id": current_user.id}
    ).sort("updated_at", -1).to_list(50)
    
    return [ChatSession(**session) for session in sessions]

@api_router.get("/chat/sessions/{session_id}")
async def get_chat_session(
    session_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    session_doc = await chat_sessions_collection.find_one({
        "id": session_id,
        "user_id": current_user.id
    })
    
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return ChatSession(**session_doc)

# ============= Progress Tracking =============
async def update_topic_progress(
    user_id: str,
    stream: Stream,
    class_level: int,
    subject: str,
    topic: str,
    quiz_score: Optional[float] = None
):
    """Update student's progress for a topic"""
    progress_doc = await topic_progress_collection.find_one({
        "user_id": user_id,
        "subject": subject,
        "topic": topic
    })
    
    if progress_doc:
        progress = TopicProgress(**progress_doc)
        progress.last_accessed = datetime.utcnow()
        
        if quiz_score is not None:
            progress.quiz_attempts += 1
            # Update average score
            total_score = progress.average_score * (progress.quiz_attempts - 1) + quiz_score
            progress.average_score = total_score / progress.quiz_attempts
            # Update mastery level based on average score
            progress.mastery_level = min(progress.average_score, 100)
        
        await topic_progress_collection.update_one(
            {"user_id": user_id, "subject": subject, "topic": topic},
            {"$set": progress.dict()}
        )
    else:
        progress = TopicProgress(
            user_id=user_id,
            stream=stream,
            class_level=class_level,
            subject=subject,
            topic=topic,
            mastery_level=quiz_score if quiz_score else 0,
            quiz_attempts=1 if quiz_score else 0,
            average_score=quiz_score if quiz_score else 0
        )
        await topic_progress_collection.insert_one(progress.dict())

@api_router.get("/progress")
async def get_progress(current_user: UserInDB = Depends(get_current_user)):
    progress_docs = await topic_progress_collection.find(
        {"user_id": current_user.id}
    ).to_list(100)
    
    return [TopicProgress(**doc) for doc in progress_docs]

@api_router.get("/progress/{subject}")
async def get_subject_progress(
    subject: str,
    current_user: UserInDB = Depends(get_current_user)
):
    progress_docs = await topic_progress_collection.find({
        "user_id": current_user.id,
        "subject": subject
    }).to_list(100)
    
    return [TopicProgress(**doc) for doc in progress_docs]

# ============= Dashboard Statistics =============
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: UserInDB = Depends(get_current_user)):
    # Get all progress
    progress_docs = await topic_progress_collection.find(
        {"user_id": current_user.id}
    ).to_list(1000)
    
    # Get quiz attempts
    quiz_attempts = await quiz_attempts_collection.find(
        {"user_id": current_user.id}
    ).to_list(1000)
    
    # Calculate stats
    total_topics = len(progress_docs)
    total_time = sum(p.get("time_spent", 0) for p in progress_docs)
    total_quizzes = len(quiz_attempts)
    avg_score = sum(q.get("score", 0) for q in quiz_attempts) / len(quiz_attempts) if quiz_attempts else 0
    
    # Subject-wise stats
    subject_stats = {}
    for progress in progress_docs:
        subject = progress.get("subject")
        if subject not in subject_stats:
            subject_stats[subject] = {
                "topics_studied": 0,
                "time_spent": 0,
                "average_mastery": 0
            }
        subject_stats[subject]["topics_studied"] += 1
        subject_stats[subject]["time_spent"] += progress.get("time_spent", 0)
        subject_stats[subject]["average_mastery"] += progress.get("mastery_level", 0)
    
    # Calculate averages
    for subject in subject_stats:
        count = subject_stats[subject]["topics_studied"]
        if count > 0:
            subject_stats[subject]["average_mastery"] /= count
    
    return {
        "total_topics_studied": total_topics,
        "total_time_spent": total_time,
        "total_quizzes_completed": total_quizzes,
        "average_quiz_score": round(avg_score, 2),
        "subject_stats": subject_stats
    }

# ============= Content Metadata Routes =============
@api_router.get("/metadata/subjects")
async def get_subjects(stream: Optional[str] = None, class_level: Optional[int] = None):
    """Get list of unique subjects"""
    query = {"approved": True}
    if stream:
        query["stream"] = stream
    if class_level:
        query["class_level"] = class_level
    
    subjects = await books_collection.distinct("subject", query)
    return {"subjects": sorted(subjects)}

@api_router.get("/metadata/topics")
async def get_topics(subject: str, stream: Optional[str] = None, class_level: Optional[int] = None):
    """Get list of topics for a subject"""
    query = {"approved": True, "subject": subject}
    if stream:
        query["stream"] = stream
    if class_level:
        query["class_level"] = class_level
    
    topics = await books_collection.distinct("topic", query)
    return {"topics": sorted(topics)}

# ============= Root & Health Check =============
@api_router.get("/")
async def root():
    return {"message": "AI Tutor Platform API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include router in app
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("Database initialized")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down...")
