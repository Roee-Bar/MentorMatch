// lib/seed-data.ts
// Test data for MentorMatch database seeding

import { BaseUser, Student, Supervisor, Admin, Application } from '@/types/database';

// ============================================
// PASSWORDS (same for all test accounts for easy testing)
// ============================================
export const TEST_PASSWORD = 'Test123!';

// ============================================
// ADMIN DATA
// ============================================
export const adminUsers: { auth: { email: string; password: string }; user: Omit<BaseUser, 'createdAt'>; admin: Omit<Admin, 'createdAt' | 'updatedAt'> }[] = [
  // E2E Test Admin Account
  {
    auth: {
      email: 'admin@test.com',
      password: 'password123',
    },
    user: {
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'admin',
      department: 'Software Engineering',
      photoURL: '',
    },
    admin: {
      firstName: 'Test',
      lastName: 'Admin',
      fullName: 'Test Admin',
      email: 'admin@test.com',
      phone: '04-9900000',
      department: 'Software Engineering',
      adminRole: 'project_coordinator',
      permissions: [
        'manage_users',
        'manage_supervisors',
        'manage_students',
        'manage_projects',
        'view_reports',
        'export_data',
        'import_data',
      ],
      isActive: true,
    },
  },
  {
    auth: {
      email: 'julia.sheidin@braude.ac.il',
      password: TEST_PASSWORD,
    },
    user: {
      email: 'julia.sheidin@braude.ac.il',
      name: 'Dr. Julia Sheidin',
      role: 'admin',
      department: 'Software Engineering',
      photoURL: '',
    },
    admin: {
      firstName: 'Julia',
      lastName: 'Sheidin',
      fullName: 'Dr. Julia Sheidin',
      email: 'julia.sheidin@braude.ac.il',
      phone: '04-9901234',
      department: 'Software Engineering',
      adminRole: 'project_coordinator',
      permissions: [
        'manage_users',
        'manage_supervisors',
        'manage_students',
        'manage_projects',
        'view_reports',
        'export_data',
        'import_data',
      ],
      isActive: true,
    },
  },
];

// ============================================
// SUPERVISOR DATA
// ============================================
export const supervisorUsers: { auth: { email: string; password: string }; user: Omit<BaseUser, 'createdAt'>; supervisor: Omit<Supervisor, 'createdAt' | 'updatedAt'> }[] = [
  // E2E Test Supervisor Account
  {
    auth: {
      email: 'supervisor@test.com',
      password: 'password123',
    },
    user: {
      email: 'supervisor@test.com',
      name: 'Test Supervisor',
      role: 'supervisor',
      department: 'Computer Science',
      photoURL: '',
    },
    supervisor: {
      firstName: 'Test',
      lastName: 'Supervisor',
      fullName: 'Test Supervisor',
      email: 'supervisor@test.com',
      phone: '04-9900001',
      department: 'Computer Science',
      title: 'Dr.',
      bio: 'Test supervisor account for E2E testing.',
      researchInterests: ['Machine Learning', 'Web Development'],
      expertiseAreas: ['Software Engineering', 'Testing'],
      officeLocation: 'Test Building',
      officeHours: 'By appointment',
      maxCapacity: 5,
      currentCapacity: 0,
      availabilityStatus: 'available',
      suggestedTopics: [
        {
          id: 'test-topic-1',
          title: 'Test Project',
          description: 'A test project for E2E testing.',
          requiredSkills: ['JavaScript', 'Testing'],
          difficulty: 'intermediate',
          isAvailable: true,
        },
      ],
      notificationPreference: 'daily',
      isApproved: true,
      isActive: true,
    },
  },
  {
    auth: {
      email: 'naomi.unkelos@braude.ac.il',
      password: TEST_PASSWORD,
    },
    user: {
      email: 'naomi.unkelos@braude.ac.il',
      name: 'Dr. Naomi Unkelos-Shpigel',
      role: 'supervisor',
      department: 'Software Engineering',
      photoURL: '',
    },
    supervisor: {
      firstName: 'Naomi',
      lastName: 'Unkelos-Shpigel',
      fullName: 'Dr. Naomi Unkelos-Shpigel',
      email: 'naomi.unkelos@braude.ac.il',
      phone: '04-9901235',
      department: 'Software Engineering',
      title: 'Dr.',
      bio: 'Senior lecturer specializing in software engineering practices, agile methodologies, and human-computer interaction. Passionate about mentoring students in creating impactful software solutions.',
      researchInterests: ['Agile Development', 'Software Quality', 'User Experience', 'Educational Technology'],
      expertiseAreas: ['Web Development', 'Project Management', 'UI/UX Design', 'Software Testing'],
      officeLocation: 'Building 3, Room 312',
      officeHours: 'Sunday & Tuesday 14:00-16:00',
      maxCapacity: 5,
      currentCapacity: 2,
      availabilityStatus: 'available',
      suggestedTopics: [
        {
          id: 'topic-1',
          title: 'Student Collaboration Platform',
          description: 'Build a platform for students to find project partners and collaborate on assignments.',
          requiredSkills: ['React', 'Node.js', 'Database Design'],
          difficulty: 'intermediate',
          isAvailable: true,
        },
        {
          id: 'topic-2',
          title: 'Code Review Assistant',
          description: 'Develop an AI-powered tool to help students improve their code quality.',
          requiredSkills: ['Python', 'Machine Learning', 'API Development'],
          difficulty: 'advanced',
          isAvailable: true,
        },
      ],
      notificationPreference: 'daily',
      isApproved: true,
      isActive: true,
    },
  },
  {
    auth: {
      email: 'israel.israeli@braude.ac.il',
      password: TEST_PASSWORD,
    },
    user: {
      email: 'israel.israeli@braude.ac.il',
      name: 'Dr. Israel Israeli',
      role: 'supervisor',
      department: 'Software Engineering',
      photoURL: '',
    },
    supervisor: {
      firstName: 'Israel',
      lastName: 'Israeli',
      fullName: 'Dr. Israel Israeli',
      email: 'israel.israeli@braude.ac.il',
      phone: '04-9901236',
      department: 'Software Engineering',
      title: 'Dr.',
      bio: 'Expert in machine learning and data science with over 10 years of industry experience. Focuses on practical applications of AI in software systems.',
      researchInterests: ['Machine Learning', 'Data Science', 'Natural Language Processing', 'Computer Vision'],
      expertiseAreas: ['Python', 'TensorFlow', 'Data Analysis', 'Deep Learning'],
      officeLocation: 'Building 3, Room 315',
      officeHours: 'Monday & Wednesday 10:00-12:00',
      maxCapacity: 4,
      currentCapacity: 3,
      availabilityStatus: 'limited',
      suggestedTopics: [
        {
          id: 'topic-3',
          title: 'Sentiment Analysis Dashboard',
          description: 'Create a dashboard that analyzes sentiment from social media data in real-time.',
          requiredSkills: ['Python', 'NLP', 'React', 'Data Visualization'],
          difficulty: 'advanced',
          isAvailable: true,
        },
      ],
      notificationPreference: 'immediate',
      isApproved: true,
      isActive: true,
    },
  },
  {
    auth: {
      email: 'anat.dahan@braude.ac.il',
      password: TEST_PASSWORD,
    },
    user: {
      email: 'anat.dahan@braude.ac.il',
      name: 'Dr. Anat Dahan',
      role: 'supervisor',
      department: 'Software Engineering',
      photoURL: '',
    },
    supervisor: {
      firstName: 'Anat',
      lastName: 'Dahan',
      fullName: 'Dr. Anat Dahan',
      email: 'anat.dahan@braude.ac.il',
      phone: '04-9901237',
      department: 'Software Engineering',
      title: 'Dr.',
      bio: 'Specializes in cybersecurity and secure software development. Former security consultant with extensive experience in enterprise systems.',
      researchInterests: ['Cybersecurity', 'Secure Coding', 'Network Security', 'Blockchain'],
      expertiseAreas: ['Security Testing', 'Penetration Testing', 'Cryptography', 'Secure Architecture'],
      officeLocation: 'Building 3, Room 320',
      officeHours: 'Thursday 12:00-15:00',
      maxCapacity: 3,
      currentCapacity: 0,
      availabilityStatus: 'available',
      suggestedTopics: [
        {
          id: 'topic-4',
          title: 'Secure Authentication System',
          description: 'Implement a modern authentication system with multi-factor authentication and biometric support.',
          requiredSkills: ['Node.js', 'Security Protocols', 'Mobile Development'],
          difficulty: 'advanced',
          isAvailable: true,
        },
        {
          id: 'topic-5',
          title: 'Vulnerability Scanner',
          description: 'Build an automated tool to scan web applications for common security vulnerabilities.',
          requiredSkills: ['Python', 'Web Security', 'API Development'],
          difficulty: 'intermediate',
          isAvailable: true,
        },
      ],
      notificationPreference: 'custom',
      notificationHour: 9,
      isApproved: true,
      isActive: true,
    },
  },
];

// ============================================
// STUDENT DATA
// ============================================
export const studentUsers: { auth: { email: string; password: string }; user: Omit<BaseUser, 'createdAt'>; student: Omit<Student, 'createdAt' | 'updatedAt' | 'registrationDate'> }[] = [
  // E2E Test Student Account
  {
    auth: {
      email: 'student@test.com',
      password: 'password123',
    },
    user: {
      email: 'student@test.com',
      name: 'Test Student',
      role: 'student',
      department: 'Computer Science',
      photoURL: '',
    },
    student: {
      firstName: 'Test',
      lastName: 'Student',
      fullName: 'Test Student',
      email: 'student@test.com',
      studentId: 'S001',
      phone: '050-0000001',
      department: 'Computer Science',
      academicYear: '4th Year',
      skills: 'JavaScript, React, Testing',
      interests: 'Web Development, Software Testing',
      previousProjects: 'Various web applications',
      preferredTopics: 'Web Development, Full-Stack',
      hasPartner: false,
      partnerName: '',
      partnerEmail: '',
      profileComplete: true,
      matchStatus: 'unmatched',
      assignedSupervisorId: '',
    },
  },
  {
    auth: {
      email: 'eldar.gafarov@e.braude.ac.il',
      password: TEST_PASSWORD,
    },
    user: {
      email: 'eldar.gafarov@e.braude.ac.il',
      name: 'Eldar Gafarov',
      role: 'student',
      department: 'Software Engineering',
      photoURL: '',
    },
    student: {
      firstName: 'Eldar',
      lastName: 'Gafarov',
      fullName: 'Eldar Gafarov',
      email: 'eldar.gafarov@e.braude.ac.il',
      studentId: '318276543',
      phone: '052-1234567',
      department: 'Software Engineering',
      academicYear: '4th Year',
      skills: 'React, TypeScript, Node.js, Firebase, Python',
      interests: 'Web Development, User Experience, Educational Technology',
      previousProjects: 'Built a task management app using React and Firebase',
      preferredTopics: 'Web Applications, Full-Stack Development',
      hasPartner: true,
      partnerName: 'Roee Bar',
      partnerEmail: 'roee.bar@e.braude.ac.il',
      profileComplete: true,
      matchStatus: 'matched',
      assignedSupervisorId: '', // Will be set during seeding
    },
  },
  {
    auth: {
      email: 'roee.bar@e.braude.ac.il',
      password: TEST_PASSWORD,
    },
    user: {
      email: 'roee.bar@e.braude.ac.il',
      name: 'Roee Bar',
      role: 'student',
      department: 'Software Engineering',
      photoURL: '',
    },
    student: {
      firstName: 'Roee',
      lastName: 'Bar',
      fullName: 'Roee Bar',
      email: 'roee.bar@e.braude.ac.il',
      studentId: '318276544',
      phone: '052-2345678',
      department: 'Software Engineering',
      academicYear: '4th Year',
      skills: 'JavaScript, React, CSS, UI Design, Figma',
      interests: 'Frontend Development, UI/UX Design, Mobile Apps',
      previousProjects: 'Designed and developed a mobile-first e-commerce website',
      preferredTopics: 'User Interface Design, Mobile Development',
      hasPartner: true,
      partnerName: 'Eldar Gafarov',
      partnerEmail: 'eldar.gafarov@e.braude.ac.il',
      profileComplete: true,
      matchStatus: 'matched',
      assignedSupervisorId: '', // Will be set during seeding
    },
  },
  {
    auth: {
      email: 'sarah.cohen@e.braude.ac.il',
      password: TEST_PASSWORD,
    },
    user: {
      email: 'sarah.cohen@e.braude.ac.il',
      name: 'Sarah Cohen',
      role: 'student',
      department: 'Software Engineering',
      photoURL: '',
    },
    student: {
      firstName: 'Sarah',
      lastName: 'Cohen',
      fullName: 'Sarah Cohen',
      email: 'sarah.cohen@e.braude.ac.il',
      studentId: '318276545',
      phone: '052-3456789',
      department: 'Software Engineering',
      academicYear: '4th Year',
      skills: 'Python, Machine Learning, TensorFlow, Data Analysis',
      interests: 'Artificial Intelligence, Data Science, Automation',
      previousProjects: 'Created a recommendation system for a local bookstore',
      preferredTopics: 'Machine Learning, AI Applications',
      hasPartner: false,
      profileComplete: true,
      matchStatus: 'pending',
    },
  },
  {
    auth: {
      email: 'david.levy@e.braude.ac.il',
      password: TEST_PASSWORD,
    },
    user: {
      email: 'david.levy@e.braude.ac.il',
      name: 'David Levy',
      role: 'student',
      department: 'Software Engineering',
      photoURL: '',
    },
    student: {
      firstName: 'David',
      lastName: 'Levy',
      fullName: 'David Levy',
      email: 'david.levy@e.braude.ac.il',
      studentId: '318276546',
      phone: '052-4567890',
      department: 'Software Engineering',
      academicYear: '3rd Year',
      skills: 'Java, Android, Kotlin, SQL',
      interests: 'Mobile Development, Database Design, Cloud Computing',
      previousProjects: 'Developed an Android app for tracking fitness activities',
      preferredTopics: 'Mobile Apps, Cloud Services',
      hasPartner: true,
      partnerName: 'Maya Levi',
      partnerEmail: 'maya.levi@e.braude.ac.il',
      profileComplete: true,
      matchStatus: 'unmatched',
    },
  },
  {
    auth: {
      email: 'maya.levi@e.braude.ac.il',
      password: TEST_PASSWORD,
    },
    user: {
      email: 'maya.levi@e.braude.ac.il',
      name: 'Maya Levi',
      role: 'student',
      department: 'Software Engineering',
      photoURL: '',
    },
    student: {
      firstName: 'Maya',
      lastName: 'Levi',
      fullName: 'Maya Levi',
      email: 'maya.levi@e.braude.ac.il',
      studentId: '318276547',
      phone: '052-5678901',
      department: 'Software Engineering',
      academicYear: '3rd Year',
      skills: 'C++, Python, Embedded Systems, IoT',
      interests: 'Internet of Things, Embedded Programming, Hardware Integration',
      previousProjects: 'Built a smart home controller using Raspberry Pi',
      preferredTopics: 'IoT, Embedded Systems, Smart Devices',
      hasPartner: true,
      partnerName: 'David Levy',
      partnerEmail: 'david.levy@e.braude.ac.il',
      profileComplete: true,
      matchStatus: 'unmatched',
    },
  },
];

// ============================================
// SAMPLE APPLICATIONS DATA
// ============================================
export const sampleApplications: Omit<Application, 'id' | 'dateApplied' | 'lastUpdated'>[] = [
  {
    studentId: '', // Will be set during seeding
    studentName: 'Sarah Cohen',
    studentEmail: 'sarah.cohen@e.braude.ac.il',
    supervisorId: '', // Will be set during seeding
    supervisorName: 'Dr. Israel Israeli',
    projectTitle: 'AI-Powered Study Assistant',
    projectDescription: 'An intelligent study assistant that uses machine learning to help students learn more effectively by adapting to their learning style and progress.',
    isOwnTopic: true,
    studentSkills: 'Python, Machine Learning, TensorFlow, Data Analysis',
    studentInterests: 'Artificial Intelligence, Data Science, Automation',
    hasPartner: false,
    status: 'pending',
    responseTime: '5-7 business days',
  },
  {
    studentId: '', // Will be set during seeding
    studentName: 'Sarah Cohen',
    studentEmail: 'sarah.cohen@e.braude.ac.il',
    supervisorId: '', // Will be set during seeding
    supervisorName: 'Dr. Naomi Unkelos-Shpigel',
    projectTitle: 'Code Review Assistant',
    projectDescription: 'Applying for the suggested topic: Develop an AI-powered tool to help students improve their code quality.',
    proposedTopicId: 'topic-2',
    isOwnTopic: false,
    studentSkills: 'Python, Machine Learning, TensorFlow, Data Analysis',
    studentInterests: 'Artificial Intelligence, Data Science, Automation',
    hasPartner: false,
    status: 'under_review',
    responseTime: '3-5 business days',
  },
];