export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';
export type AvailabilityStatus = 'available' | 'limited' | 'unavailable';

export interface Application {
  id: string;
  studentId: string;           // Link to student
  studentName: string;          // Student display name
  supervisorId: string;         // Link to supervisor
  supervisorName: string;
  projectTitle: string;
  status: ApplicationStatus;
  dateApplied: string;
  projectDescription: string;
  responseTime: string;
  comments: string;
}

export interface Supervisor {
  id: string;
  name: string;
  department: string;
  expertiseAreas: string[];
  availabilityStatus: AvailabilityStatus;
  bio: string;
  currentCapacity: string;
  researchInterests: string[];
  contact: string;
}

