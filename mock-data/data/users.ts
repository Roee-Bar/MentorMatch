import { User } from '@/types/user';

export const users: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@student.braude.ac.il',
    role: 'student',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    studentId: 'STU-2024-001',
    degree: 'B.Sc. in Software Engineering',
  },
  {
    id: '2',
    name: 'Dr. Michael Cohen',
    email: 'michael.cohen@braude.ac.il',
    role: 'supervisor',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    department: 'Software Engineering',
    expertise: ['Machine Learning', 'Computer Vision', 'Deep Learning', 'AI Systems'],
  },
  {
    id: '3',
    name: 'Prof. David Miller',
    email: 'david.miller@braude.ac.il',
    role: 'admin',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    department: 'Administration',
  },
];

