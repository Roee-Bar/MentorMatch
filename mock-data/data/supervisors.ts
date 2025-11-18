import { Supervisor } from '@/types/dashboard';

export const supervisors: Supervisor[] = [
  {
    id: '1',
    name: 'Dr. James Anderson',
    department: 'Computer Science',
    expertiseAreas: ['Artificial Intelligence', 'Computer Vision', 'Deep Learning'],
    availabilityStatus: 'available',
    bio: 'Dr. Anderson has 15 years of experience in AI research with focus on computer vision applications in autonomous systems and medical imaging.',
    currentCapacity: '2 students available',
    researchInterests: [
      'Object Detection',
      'Image Segmentation',
      'Medical AI',
    ],
    contact: 'j.anderson@university.edu',
  },
  {
    id: '2',
    name: 'Prof. Linda Martinez',
    department: 'Software Engineering',
    expertiseAreas: ['Cloud Computing', 'Distributed Systems', 'DevOps'],
    availabilityStatus: 'limited',
    bio: 'Professor Martinez specializes in cloud-native architectures and has extensive industry experience with major tech companies.',
    currentCapacity: '1 student available',
    researchInterests: [
      'Microservices',
      'Container Orchestration',
      'Cloud Security',
    ],
    contact: 'l.martinez@university.edu',
  },
  {
    id: '3',
    name: 'Dr. David Kim',
    department: 'Data Science',
    expertiseAreas: ['Data Mining', 'Big Data Analytics', 'Statistical Modeling'],
    availabilityStatus: 'available',
    bio: 'Dr. Kim focuses on extracting insights from large-scale datasets and developing predictive models for business intelligence.',
    currentCapacity: '3 students available',
    researchInterests: [
      'Predictive Analytics',
      'Data Visualization',
      'Time Series Analysis',
    ],
    contact: 'd.kim@university.edu',
  },
];

