export type UserRole = 'student' | 'supervisor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage: string;
  // Role-specific fields (optional)
  studentId?: string;
  degree?: string;
  department?: string;
  expertise?: string[];
}

