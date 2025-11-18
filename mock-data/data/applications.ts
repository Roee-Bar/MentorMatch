import { Application } from '@/types/dashboard';

export const applications: Application[] = [
  {
    id: '1',
    supervisorName: 'Dr. Sarah Johnson',
    projectTitle: 'Machine Learning for Medical Diagnosis',
    status: 'under_review',
    dateApplied: '2024-10-15',
    projectDescription:
      'This project focuses on developing advanced machine learning algorithms to assist in early detection of cardiovascular diseases using patient data and medical imaging.',
    responseTime: 'Within 2 weeks',
    comments: 'Your application is currently being reviewed by the supervisor.',
  },
  {
    id: '2',
    supervisorName: 'Prof. Michael Chen',
    projectTitle: 'Blockchain Security and Scalability',
    status: 'pending',
    dateApplied: '2024-10-20',
    projectDescription:
      'Research into improving blockchain transaction throughput while maintaining security and decentralization. Focus on consensus mechanisms and sharding techniques.',
    responseTime: 'Within 1 week',
    comments: 'Waiting for initial review.',
  },
  {
    id: '3',
    supervisorName: 'Dr. Emily Roberts',
    projectTitle: 'Natural Language Processing for Legal Documents',
    status: 'approved',
    dateApplied: '2024-10-05',
    projectDescription:
      'Developing NLP models to extract key information from legal contracts and automate document analysis for law firms and legal departments.',
    responseTime: 'Approved',
    comments:
      'Congratulations! Please schedule a meeting to discuss project details.',
  },
];

