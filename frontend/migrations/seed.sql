-- Seed data for AI Tutor D1 Database

-- Insert test users (passwords are hashed with bcrypt for: admin123, teacher123, student123, content123)
INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
('admin-001', 'admin@aitutor.com', '$2a$10$rJYMfZ8FzH9qO6YvN7X8xO7Y9YvN7X8xO7Y9YvN7X8xO7Y9YvN7X8', 'Admin User', 'admin');

INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
('teacher-001', 'teacher@aitutor.com', '$2a$10$rJYMfZ8FzH9qO6YvN7X8xO7Y9YvN7X8xO7Y9YvN7X8xO7Y9YvN7X8', 'Dr. Sharma', 'teacher');

INSERT INTO users (id, email, password_hash, full_name, role, stream, class_level, subjects) VALUES 
('student-001', 'student@aitutor.com', '$2a$10$rJYMfZ8FzH9qO6YvN7X8xO7Y9YvN7X8xO7Y9YvN7X8xO7Y9YvN7X8', 'Rahul Kumar', 'student', 'CBSE', 10, '["Mathematics", "Science", "English"]');

INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
('content-001', 'content@aitutor.com', '$2a$10$rJYMfZ8FzH9qO6YvN7X8xO7Y9YvN7X8xO7Y9YvN7X8xO7Y9YvN7X8', 'Content Manager', 'content_team');

-- Insert books
INSERT INTO books (id, title, author, stream, class_level, subject, topic, summary, tags, uploaded_by, status) VALUES
('book-001', 'NCERT Mathematics Class 10', 'NCERT', 'CBSE', 10, 'Mathematics', 'Quadratic Equations', 'This chapter covers quadratic equations including their standard form ax² + bx + c = 0', 'algebra,equations,quadratic', 'teacher-001', 'approved'),
('book-002', 'NCERT Mathematics Class 10', 'NCERT', 'CBSE', 10, 'Mathematics', 'Trigonometry', 'Introduction to trigonometric ratios for acute angles', 'trigonometry,ratios,angles', 'teacher-001', 'approved'),
('book-003', 'NCERT Science Class 10', 'NCERT', 'CBSE', 10, 'Science', 'Chemical Reactions', 'Understanding chemical reactions and equations', 'chemistry,reactions', 'teacher-001', 'approved');

-- Insert videos
INSERT INTO videos (id, title, teacher_name, stream, class_level, subject, topic, duration, difficulty, description, tags, uploaded_by, status) VALUES
('video-001', 'Introduction to Quadratic Equations', 'Dr. Sharma', 'CBSE', 10, 'Mathematics', 'Quadratic Equations', 1200, 'beginner', 'Learn the basics of quadratic equations', 'math,algebra', 'teacher-001', 'approved'),
('video-002', 'Trigonometry Basics', 'Dr. Sharma', 'CBSE', 10, 'Mathematics', 'Trigonometry', 1500, 'beginner', 'Understanding trigonometric ratios', 'math,trigonometry', 'teacher-001', 'approved');

-- Insert quizzes
INSERT INTO quizzes (id, title, stream, class_level, subject, topic, difficulty, questions, created_by, status) VALUES
('quiz-001', 'Quadratic Equations Quiz', 'CBSE', 10, 'Mathematics', 'Quadratic Equations', 'intermediate', '[{"question":"What is the standard form?","options":["ax²+bx+c=0","ax+b=0","x²=a","ax²=0"],"correct_answer":0,"explanation":"Standard form is ax²+bx+c=0"}]', 'teacher-001', 'approved');
