// lib/constants.ts
// Shared constants for the application

/**
 * Department options used across registration and filtering
 */
export const DEPARTMENTS = [
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Software Engineering', label: 'Software Engineering' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
  { value: 'Industrial Engineering', label: 'Industrial Engineering' },
  { value: 'Biotechnology', label: 'Biotechnology' },
] as const;

/**
 * Department options for filter dropdowns (includes "All" option)
 */
export const DEPARTMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  ...DEPARTMENTS,
];

/**
 * Availability status options for filter dropdowns
 */
export const AVAILABILITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Availability' },
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited Capacity' },
] as const;

/**
 * Predefined technical skills for student selection
 */
export const SKILLS_OPTIONS = [
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Java', label: 'Java' },
  { value: 'C++', label: 'C++' },
  { value: 'C#', label: 'C#' },
  { value: 'React', label: 'React' },
  { value: 'Angular', label: 'Angular' },
  { value: 'Vue.js', label: 'Vue.js' },
  { value: 'Node.js', label: 'Node.js' },
  { value: 'Django', label: 'Django' },
  { value: 'Flask', label: 'Flask' },
  { value: 'Spring', label: 'Spring Framework' },
  { value: 'SQL', label: 'SQL' },
  { value: 'NoSQL', label: 'NoSQL Databases' },
  { value: 'MongoDB', label: 'MongoDB' },
  { value: 'PostgreSQL', label: 'PostgreSQL' },
  { value: 'Machine Learning', label: 'Machine Learning' },
  { value: 'Deep Learning', label: 'Deep Learning' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'Computer Vision', label: 'Computer Vision' },
  { value: 'NLP', label: 'Natural Language Processing' },
  { value: 'Cloud Computing', label: 'Cloud Computing' },
  { value: 'AWS', label: 'AWS' },
  { value: 'Azure', label: 'Azure' },
  { value: 'Docker', label: 'Docker' },
  { value: 'Kubernetes', label: 'Kubernetes' },
  { value: 'Git', label: 'Git' },
  { value: 'CI/CD', label: 'CI/CD' },
  { value: 'Mobile Development', label: 'Mobile Development' },
  { value: 'iOS', label: 'iOS Development' },
  { value: 'Android', label: 'Android Development' },
  { value: 'React Native', label: 'React Native' },
  { value: 'Flutter', label: 'Flutter' },
  { value: 'Cybersecurity', label: 'Cybersecurity' },
  { value: 'Network Security', label: 'Network Security' },
  { value: 'Penetration Testing', label: 'Penetration Testing' },
  { value: 'UI/UX Design', label: 'UI/UX Design' },
  { value: 'Embedded Systems', label: 'Embedded Systems' },
  { value: 'IoT', label: 'Internet of Things' },
  { value: 'Robotics', label: 'Robotics' },
  { value: 'Blockchain', label: 'Blockchain' },
  { value: 'Game Development', label: 'Game Development' },
  { value: 'AR/VR', label: 'AR/VR' },
];

/**
 * Type for department values
 */
export type Department = typeof DEPARTMENTS[number]['value'];

/**
 * Type for availability status values
 */
export type AvailabilityStatus = 'available' | 'limited' | 'unavailable';

/**
 * Type for skill values
 */
export type Skill = typeof SKILLS_OPTIONS[number]['value'];

/**
 * UI timing constants
 */
export const UI_CONSTANTS = {
  MESSAGE_DISPLAY_DURATION: 5000, // ms - how long success/error messages show
} as const;

