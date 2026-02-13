import db, { uuidv4, initializeDatabase } from './db';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  initializeDatabase();
  
  // Check if already seeded
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existingUsers.count > 0) {
    console.log('Database already seeded');
    return;
  }

  console.log('Seeding database...');

  // Create admin user
  const adminId = uuidv4();
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminId, 'admin@aitutor.com', adminPassword, 'Admin User', 'admin');

  // Create teacher user
  const teacherId = uuidv4();
  const teacherPassword = bcrypt.hashSync('teacher123', 10);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(teacherId, 'teacher@aitutor.com', teacherPassword, 'Dr. Sharma', 'teacher');

  // Create content team user
  const contentId = uuidv4();
  const contentPassword = bcrypt.hashSync('content123', 10);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(contentId, 'content@aitutor.com', contentPassword, 'Content Manager', 'content_team');

  // Create student user
  const studentId = uuidv4();
  const studentPassword = bcrypt.hashSync('student123', 10);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, stream, class_level, subjects)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(studentId, 'student@aitutor.com', studentPassword, 'Rahul Kumar', 'student', 'CBSE', 10, JSON.stringify(['Mathematics', 'Science', 'English']));

  // Seed Books
  const books = [
    {
      title: 'NCERT Mathematics Class 10',
      author: 'NCERT',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      summary: 'This chapter covers quadratic equations including their standard form ax² + bx + c = 0, methods of solving (factorization, completing the square, quadratic formula), nature of roots using discriminant, and real-world applications.',
      tags: 'algebra,equations,quadratic,mathematics',
      status: 'approved'
    },
    {
      title: 'NCERT Mathematics Class 10',
      author: 'NCERT',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Mathematics',
      topic: 'Trigonometry',
      summary: 'Introduction to trigonometric ratios (sin, cos, tan, cot, sec, cosec) for acute angles, trigonometric identities, and applications in finding heights and distances.',
      tags: 'trigonometry,ratios,angles,mathematics',
      status: 'approved'
    },
    {
      title: 'NCERT Science Class 10',
      author: 'NCERT',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Science',
      topic: 'Chemical Reactions and Equations',
      summary: 'Understanding chemical reactions, writing and balancing chemical equations, types of reactions (combination, decomposition, displacement, double displacement, oxidation-reduction).',
      tags: 'chemistry,reactions,equations,science',
      status: 'approved'
    },
    {
      title: 'NCERT Science Class 10',
      author: 'NCERT',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Science',
      topic: 'Light - Reflection and Refraction',
      summary: 'Laws of reflection, spherical mirrors, mirror formula, magnification, refraction of light, laws of refraction, refractive index, lens formula, and power of lens.',
      tags: 'physics,light,optics,mirrors,lenses',
      status: 'approved'
    },
    {
      title: 'NCERT Science Class 10',
      author: 'NCERT',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Science',
      topic: 'Electricity',
      summary: 'Electric current, potential difference, Ohm\'s law, resistance, factors affecting resistance, resistors in series and parallel, heating effect of electric current, electric power.',
      tags: 'physics,electricity,circuits,ohms law',
      status: 'approved'
    },
    {
      title: 'ICSE Physics Concise',
      author: 'Selina Publishers',
      stream: 'ICSE',
      class_level: 10,
      subject: 'Physics',
      topic: 'Force',
      summary: 'Types of forces, Newton\'s laws of motion, momentum, conservation of momentum, and practical applications of force in daily life.',
      tags: 'physics,force,motion,newtons laws',
      status: 'approved'
    }
  ];

  for (const book of books) {
    db.prepare(`
      INSERT INTO books (id, title, author, stream, class_level, subject, topic, summary, tags, uploaded_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), book.title, book.author, book.stream, book.class_level, book.subject, book.topic, book.summary, book.tags, adminId, book.status);
  }

  // Seed Videos
  const videos = [
    {
      title: 'Quadratic Equations - Complete Chapter',
      teacher_name: 'Dr. Sharma',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      duration: 2400,
      difficulty: 'intermediate',
      description: 'Complete explanation of quadratic equations with solved examples and practice problems.',
      tags: 'mathematics,algebra,quadratic',
      status: 'approved'
    },
    {
      title: 'Trigonometry Basics',
      teacher_name: 'Mrs. Gupta',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Mathematics',
      topic: 'Trigonometry',
      duration: 1800,
      difficulty: 'beginner',
      description: 'Introduction to trigonometric ratios with easy-to-understand examples.',
      tags: 'mathematics,trigonometry,basics',
      status: 'approved'
    },
    {
      title: 'Chemical Reactions Explained',
      teacher_name: 'Mr. Verma',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Science',
      topic: 'Chemical Reactions and Equations',
      duration: 2100,
      difficulty: 'intermediate',
      description: 'Learn about different types of chemical reactions with demonstrations.',
      tags: 'science,chemistry,reactions',
      status: 'approved'
    },
    {
      title: 'Light and Optics',
      teacher_name: 'Dr. Sharma',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Science',
      topic: 'Light - Reflection and Refraction',
      duration: 2700,
      difficulty: 'intermediate',
      description: 'Comprehensive coverage of reflection, refraction, mirrors and lenses.',
      tags: 'physics,optics,light',
      status: 'approved'
    }
  ];

  for (const video of videos) {
    db.prepare(`
      INSERT INTO videos (id, title, teacher_name, stream, class_level, subject, topic, duration, difficulty, description, tags, uploaded_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), video.title, video.teacher_name, video.stream, video.class_level, video.subject, video.topic, video.duration, video.difficulty, video.description, video.tags, teacherId, video.status);
  }

  // Seed Quizzes
  const quizzes = [
    {
      title: 'Quadratic Equations Quiz',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      difficulty: 'intermediate',
      questions: JSON.stringify([
        {
          question: 'What is the standard form of a quadratic equation?',
          options: ['ax + b = 0', 'ax² + bx + c = 0', 'ax³ + bx² + cx + d = 0', 'a/x + b = 0'],
          correct_answer: 1,
          explanation: 'A quadratic equation in standard form is ax² + bx + c = 0, where a ≠ 0.'
        },
        {
          question: 'If the discriminant (b² - 4ac) is negative, the quadratic equation has:',
          options: ['Two distinct real roots', 'Two equal real roots', 'No real roots', 'One real root'],
          correct_answer: 2,
          explanation: 'When discriminant < 0, the equation has no real roots (only complex roots).'
        },
        {
          question: 'Solve: x² - 5x + 6 = 0',
          options: ['x = 1, 6', 'x = 2, 3', 'x = -2, -3', 'x = 1, 5'],
          correct_answer: 1,
          explanation: 'Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3.'
        },
        {
          question: 'The sum of roots of ax² + bx + c = 0 is:',
          options: ['b/a', '-b/a', 'c/a', '-c/a'],
          correct_answer: 1,
          explanation: 'Sum of roots = -b/a (by Vieta\'s formulas).'
        },
        {
          question: 'Which method always works for solving quadratic equations?',
          options: ['Factorization', 'Completing the square', 'Quadratic formula', 'All of the above'],
          correct_answer: 2,
          explanation: 'The quadratic formula x = (-b ± √(b²-4ac))/2a always gives the roots.'
        }
      ]),
      status: 'approved'
    },
    {
      title: 'Trigonometry Basics Quiz',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Mathematics',
      topic: 'Trigonometry',
      difficulty: 'beginner',
      questions: JSON.stringify([
        {
          question: 'In a right triangle, sin θ is defined as:',
          options: ['Adjacent/Hypotenuse', 'Opposite/Hypotenuse', 'Opposite/Adjacent', 'Hypotenuse/Opposite'],
          correct_answer: 1,
          explanation: 'sin θ = Opposite side / Hypotenuse'
        },
        {
          question: 'What is the value of sin 30°?',
          options: ['1', '1/2', '√3/2', '0'],
          correct_answer: 1,
          explanation: 'sin 30° = 1/2 is a standard value.'
        },
        {
          question: 'tan θ can be expressed as:',
          options: ['sin θ / cos θ', 'cos θ / sin θ', 'sin θ × cos θ', '1 / sin θ'],
          correct_answer: 0,
          explanation: 'tan θ = sin θ / cos θ by definition.'
        },
        {
          question: 'What is the value of sin²θ + cos²θ?',
          options: ['0', '1', '2', 'Depends on θ'],
          correct_answer: 1,
          explanation: 'This is the fundamental trigonometric identity: sin²θ + cos²θ = 1'
        }
      ]),
      status: 'approved'
    },
    {
      title: 'Chemical Reactions Quiz',
      stream: 'CBSE',
      class_level: 10,
      subject: 'Science',
      topic: 'Chemical Reactions and Equations',
      difficulty: 'intermediate',
      questions: JSON.stringify([
        {
          question: 'In a balanced chemical equation, the number of atoms of each element on reactant side equals:',
          options: ['Double on product side', 'Half on product side', 'Equal on product side', 'None of the above'],
          correct_answer: 2,
          explanation: 'Law of conservation of mass requires equal atoms on both sides.'
        },
        {
          question: 'Which type of reaction is: 2Mg + O₂ → 2MgO?',
          options: ['Decomposition', 'Combination', 'Displacement', 'Double displacement'],
          correct_answer: 1,
          explanation: 'Two substances combine to form a single product - combination reaction.'
        },
        {
          question: 'Rusting of iron is an example of:',
          options: ['Combination reaction', 'Oxidation reaction', 'Both A and B', 'Neither A nor B'],
          correct_answer: 2,
          explanation: 'Rusting involves iron combining with oxygen (combination) and losing electrons (oxidation).'
        }
      ]),
      status: 'approved'
    }
  ];

  for (const quiz of quizzes) {
    db.prepare(`
      INSERT INTO quizzes (id, title, stream, class_level, subject, topic, difficulty, questions, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), quiz.title, quiz.stream, quiz.class_level, quiz.subject, quiz.topic, quiz.difficulty, quiz.questions, teacherId, quiz.status);
  }

  console.log('Database seeded successfully!');
  console.log('Test accounts created:');
  console.log('  Admin: admin@aitutor.com / admin123');
  console.log('  Teacher: teacher@aitutor.com / teacher123');
  console.log('  Content: content@aitutor.com / content123');
  console.log('  Student: student@aitutor.com / student123');
}
