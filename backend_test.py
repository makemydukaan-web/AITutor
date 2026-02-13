#!/usr/bin/env python3
"""
AI Tutor Application Backend API Testing Script
Tests Next.js 16 API routes with SQLite database
Uses proper cookie-based authentication
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL for the Next.js application
BASE_URL = "http://localhost:3000"

class APITester:
    def __init__(self):
        self.student_session = requests.Session()
        self.admin_session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, session: requests.Session = None) -> tuple:
        """Make HTTP request and return (success, response, status_code)"""
        url = f"{BASE_URL}{endpoint}"
        if session is None:
            session = requests.Session()
        
        try:
            if method.upper() == "GET":
                response = session.get(url)
            elif method.upper() == "POST":
                response = session.post(url, json=data)
            else:
                return False, None, 0
                
            return True, response, response.status_code
        except Exception as e:
            return False, str(e), 0
    
    def login_user(self, email: str, password: str, session: requests.Session) -> bool:
        """Login user and store cookies in session"""
        login_data = {"email": email, "password": password}
        success, response, status = self.make_request("POST", "/api/auth/login", login_data, session)
        
        if success and status == 200:
            # Cookies are automatically stored in the session
            return True
        return False
    
    def test_authentication_apis(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication APIs...")
        
        # Test 1: Register new user
        register_data = {
            "email": "testuser@aitutor.com",
            "password": "testpass123",
            "full_name": "Test User",
            "role": "student",
            "stream": "Science",
            "class_level": 12
        }
        
        success, response, status = self.make_request("POST", "/api/auth/register", register_data)
        if success and status == 200:
            try:
                data = response.json()
                if "token" in data and "user" in data:
                    self.log_test("User Registration", True, f"User created: {data['user']['email']}")
                else:
                    self.log_test("User Registration", False, "Missing token or user in response")
            except:
                self.log_test("User Registration", False, "Invalid JSON response")
        elif success and status == 400:
            # User might already exist
            self.log_test("User Registration", True, "User already exists (expected)")
        else:
            self.log_test("User Registration", False, f"Status: {status}")
        
        # Test 2: Login with student credentials
        if self.login_user("student@aitutor.com", "student123", self.student_session):
            self.log_test("Student Login", True, "Logged in as student@aitutor.com")
        else:
            self.log_test("Student Login", False, "Failed to login")
        
        # Test 3: Get current user info (using student session)
        success, response, status = self.make_request("GET", "/api/auth/me", session=self.student_session)
        if success and status == 200:
            try:
                data = response.json()
                if "user" in data:
                    self.log_test("Get Current User", True, f"User: {data['user']['email']}")
                else:
                    self.log_test("Get Current User", False, "Missing user in response")
            except:
                self.log_test("Get Current User", False, "Invalid JSON response")
        else:
            self.log_test("Get Current User", False, f"Status: {status}")
        
        # Test 4: Admin login for later tests
        if self.login_user("admin@aitutor.com", "admin123", self.admin_session):
            self.log_test("Admin Login", True, "Logged in as admin@aitutor.com")
        else:
            self.log_test("Admin Login", False, "Failed to login")
    
    def test_self_assessment_api(self):
        """Test self assessment endpoints"""
        print("\n📊 Testing Self Assessment API...")
        
        # Test 1: Create self assessment (using student session)
        assessment_data = {
            "subject": "Mathematics",
            "topic": "Algebra",
            "level": "intermediate"
        }
        
        success, response, status = self.make_request("POST", "/api/assessments", assessment_data, self.student_session)
        if success and status == 200:
            self.log_test("Create Self Assessment", True, "Assessment created successfully")
        else:
            self.log_test("Create Self Assessment", False, f"Status: {status}")
        
        # Test 2: Get assessments (using student session)
        success, response, status = self.make_request("GET", "/api/assessments", session=self.student_session)
        if success and status == 200:
            try:
                data = response.json()
                if "assessments" in data:
                    self.log_test("Get Assessments", True, f"Found {len(data['assessments'])} assessments")
                else:
                    self.log_test("Get Assessments", False, "Missing assessments in response")
            except:
                self.log_test("Get Assessments", False, "Invalid JSON response")
        else:
            self.log_test("Get Assessments", False, f"Status: {status}")
    
    def test_books_api(self):
        """Test books endpoints"""
        print("\n📚 Testing Books API...")
        
        # Test 1: Get all books (no auth required)
        success, response, status = self.make_request("GET", "/api/books")
        if success and status == 200:
            try:
                data = response.json()
                if "books" in data:
                    book_count = len(data["books"])
                    self.log_test("Get All Books", True, f"Found {book_count} books")
                    
                    # Check if we have the expected 6 seeded books
                    if book_count >= 6:
                        self.log_test("Seeded Books Count", True, f"Expected 6+ books, found {book_count}")
                    else:
                        self.log_test("Seeded Books Count", False, f"Expected 6+ books, found {book_count}")
                else:
                    self.log_test("Get All Books", False, "Missing books in response")
            except:
                self.log_test("Get All Books", False, "Invalid JSON response")
        else:
            self.log_test("Get All Books", False, f"Status: {status}")
        
        # Test 2: Filter books by subject
        success, response, status = self.make_request("GET", "/api/books?subject=Mathematics")
        if success and status == 200:
            try:
                data = response.json()
                if "books" in data:
                    math_books = len(data["books"])
                    self.log_test("Filter Books by Subject", True, f"Found {math_books} Mathematics books")
                else:
                    self.log_test("Filter Books by Subject", False, "Missing books in response")
            except:
                self.log_test("Filter Books by Subject", False, "Invalid JSON response")
        else:
            self.log_test("Filter Books by Subject", False, f"Status: {status}")
    
    def test_quizzes_api(self):
        """Test quizzes endpoints"""
        print("\n🧩 Testing Quizzes API...")
        
        # Test 1: Get all quizzes (no auth required)
        success, response, status = self.make_request("GET", "/api/quizzes")
        if success and status == 200:
            try:
                data = response.json()
                if "quizzes" in data:
                    quiz_count = len(data["quizzes"])
                    self.log_test("Get All Quizzes", True, f"Found {quiz_count} quizzes")
                    
                    # Check if we have the expected 3 seeded quizzes
                    if quiz_count >= 3:
                        self.log_test("Seeded Quizzes Count", True, f"Expected 3+ quizzes, found {quiz_count}")
                        
                        # Test quiz attempt if we have quizzes
                        if quiz_count > 0:
                            quiz_id = data["quizzes"][0]["id"]
                            self.test_quiz_attempt(quiz_id)
                    else:
                        self.log_test("Seeded Quizzes Count", False, f"Expected 3+ quizzes, found {quiz_count}")
                else:
                    self.log_test("Get All Quizzes", False, "Missing quizzes in response")
            except:
                self.log_test("Get All Quizzes", False, "Invalid JSON response")
        else:
            self.log_test("Get All Quizzes", False, f"Status: {status}")
    
    def test_quiz_attempt(self, quiz_id: str):
        """Test quiz attempt submission"""
        attempt_data = {
            "answers": [1, 1, 1, 1, 1]  # Submit answers for 5 questions
        }
        
        success, response, status = self.make_request("POST", f"/api/quizzes/{quiz_id}/attempt", attempt_data, self.student_session)
        if success and status == 200:
            try:
                data = response.json()
                if "score" in data and "correct" in data and "total" in data:
                    self.log_test("Quiz Attempt Submission", True, 
                                f"Score: {data['score']}%, Correct: {data['correct']}/{data['total']}")
                else:
                    self.log_test("Quiz Attempt Submission", False, "Missing score data in response")
            except:
                self.log_test("Quiz Attempt Submission", False, "Invalid JSON response")
        else:
            self.log_test("Quiz Attempt Submission", False, f"Status: {status}")
    
    def test_ai_chat_api(self):
        """Test AI chat endpoints"""
        print("\n🤖 Testing AI Chat API...")
        
        # Test 1: Send chat message (using student session)
        chat_data = {
            "message": "Explain quadratic equations",
            "context_type": "doubt",
            "subject": "Mathematics"
        }
        
        success, response, status = self.make_request("POST", "/api/chat", chat_data, self.student_session)
        if success and status == 200:
            try:
                data = response.json()
                if "response" in data and "session_id" in data:
                    self.log_test("AI Chat Message", True, f"Got AI response, Session: {data['session_id'][:8]}...")
                else:
                    self.log_test("AI Chat Message", False, "Missing response or session_id")
            except:
                self.log_test("AI Chat Message", False, "Invalid JSON response")
        else:
            # AI Chat might fail due to API key issues, which is expected in testing
            if status == 500:
                self.log_test("AI Chat Message", False, "AI API integration issue (expected in test environment)")
            else:
                self.log_test("AI Chat Message", False, f"Status: {status}")
        
        # Test 2: Get chat sessions (using student session)
        success, response, status = self.make_request("GET", "/api/chat/sessions", session=self.student_session)
        if success and status == 200:
            try:
                data = response.json()
                if "sessions" in data:
                    self.log_test("Get Chat Sessions", True, f"Found {len(data['sessions'])} sessions")
                else:
                    self.log_test("Get Chat Sessions", False, "Missing sessions in response")
            except:
                self.log_test("Get Chat Sessions", False, "Invalid JSON response")
        else:
            self.log_test("Get Chat Sessions", False, f"Status: {status}")
    
    def test_content_verification_api(self):
        """Test content verification endpoints (admin only)"""
        print("\n✅ Testing Content Verification API...")
        
        # Test 1: Get pending content (using admin session)
        success, response, status = self.make_request("GET", "/api/content/verify?status=pending", session=self.admin_session)
        if success and status == 200:
            try:
                data = response.json()
                # Check if we have the expected structure (books, videos, quizzes)
                content_types = []
                if "books" in data:
                    content_types.append(f"books({len(data['books'])})")
                if "videos" in data:
                    content_types.append(f"videos({len(data['videos'])})")
                if "quizzes" in data:
                    content_types.append(f"quizzes({len(data['quizzes'])})")
                
                self.log_test("Get Pending Content", True, f"Content types: {', '.join(content_types)}")
            except:
                self.log_test("Get Pending Content", False, "Invalid JSON response")
        else:
            self.log_test("Get Pending Content", False, f"Status: {status}")
    
    def test_dashboard_stats_api(self):
        """Test dashboard statistics endpoint"""
        print("\n📈 Testing Dashboard Stats API...")
        
        # Using student session
        success, response, status = self.make_request("GET", "/api/dashboard/stats", session=self.student_session)
        if success and status == 200:
            try:
                data = response.json()
                expected_fields = ["total_topics_studied", "total_time_spent", "total_quizzes_completed", 
                                 "average_quiz_score", "subject_stats"]
                
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Dashboard Stats", True, 
                                f"Topics: {data['total_topics_studied']}, Quizzes: {data['total_quizzes_completed']}")
                else:
                    self.log_test("Dashboard Stats", False, f"Missing fields: {missing_fields}")
            except:
                self.log_test("Dashboard Stats", False, "Invalid JSON response")
        else:
            self.log_test("Dashboard Stats", False, f"Status: {status}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting AI Tutor Backend API Tests...")
        print(f"Base URL: {BASE_URL}")
        
        # Run tests in order
        self.test_authentication_apis()
        self.test_self_assessment_api()
        self.test_books_api()
        self.test_quizzes_api()
        self.test_ai_chat_api()
        self.test_content_verification_api()
        self.test_dashboard_stats_api()
        
        # Summary
        print("\n" + "="*60)
        print("📋 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # List failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)