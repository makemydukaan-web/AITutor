from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"
    PARENT = "parent"

class Stream(str, Enum):
    ICSE = "ICSE"
    CBSE = "CBSE"

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    EXPERT = "expert"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile_data: Optional[Dict[str, Any]] = {}

class UserInDB(User):
    password_hash: str

# Student Profile
class StudentProfile(BaseModel):
    user_id: str
    stream: Stream
    class_level: int  # 8-12
    subjects: List[str] = []
    learning_pace: Optional[str] = None
    strengths: List[str] = []
    weaknesses: List[str] = []

# Content Models
class BookBase(BaseModel):
    title: str
    author: str
    stream: Stream
    class_level: int
    subject: str
    topic: str
    content_url: Optional[str] = None
    summary: Optional[str] = None
    tags: List[str] = []

class BookCreate(BookBase):
    pass

class Book(BookBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    uploaded_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved: bool = False

class VideoBase(BaseModel):
    title: str
    teacher_name: str
    stream: Stream
    class_level: int
    subject: str
    topic: str
    video_url: Optional[str] = None
    duration: Optional[int] = None  # in seconds
    difficulty: DifficultyLevel
    tags: List[str] = []
    description: Optional[str] = None

class VideoCreate(VideoBase):
    pass

class Video(VideoBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    uploaded_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved: bool = False

# Quiz Models
class QuizQuestion(BaseModel):
    question: str
    options: List[str]  # 4 options
    correct_answer: int  # index of correct option (0-3)
    explanation: str

class QuizBase(BaseModel):
    title: str
    stream: Stream
    class_level: int
    subject: str
    topic: str
    difficulty: DifficultyLevel
    questions: List[QuizQuestion]

class QuizCreate(QuizBase):
    pass

class Quiz(QuizBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class QuizAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quiz_id: str
    user_id: str
    answers: List[int]  # list of selected options
    score: float
    completed_at: datetime = Field(default_factory=datetime.utcnow)

# Chat Models
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    topic: Optional[str] = None
    subject: Optional[str] = None
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    context_type: Optional[str] = "doubt"  # 'summary', 'doubt', 'quiz'

# Progress Tracking
class TopicProgress(BaseModel):
    user_id: str
    stream: Stream
    class_level: int
    subject: str
    topic: str
    mastery_level: float = 0.0  # 0-100
    time_spent: int = 0  # in minutes
    quiz_attempts: int = 0
    average_score: float = 0.0
    last_accessed: datetime = Field(default_factory=datetime.utcnow)

# Search/Filter Models
class ContentFilter(BaseModel):
    stream: Optional[Stream] = None
    class_level: Optional[int] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = None
    search_query: Optional[str] = None
