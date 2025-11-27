import { render, screen } from '@testing-library/react';
import UserProfile from '../UserProfile';
import { User } from '@/types/user';
import { users } from '@/mock-data';

describe('[Component] UserProfile', () => {
  // Use mock data directly from the mock-data folder
  const mockStudent = users.find(u => u.role === 'student');
  const mockSupervisor = users.find(u => u.role === 'supervisor');
  const mockAdmin = users.find(u => u.role === 'admin');

  // Ensure mock data exists
  if (!mockStudent || !mockSupervisor || !mockAdmin) {
    throw new Error('Mock data missing required user roles. Please check mock-data/data/users.ts');
  }

  describe('Supervisor Profile', () => {
    // Tests conditional field rendering excludes student fields for supervisor role
    it('does not render student-specific fields for supervisor', () => {
      render(<UserProfile user={mockSupervisor} />);
      expect(screen.queryByText('Student ID')).not.toBeInTheDocument();
      expect(screen.queryByText('Degree Program')).not.toBeInTheDocument();
    });
  });

  describe('Admin Profile', () => {
    // Tests conditional field rendering excludes student fields for admin role
    it('does not render student-specific fields for admin', () => {
      render(<UserProfile user={mockAdmin} />);
      expect(screen.queryByText('Student ID')).not.toBeInTheDocument();
      expect(screen.queryByText('Degree Program')).not.toBeInTheDocument();
    });
  });

  describe('Optional Fields Handling', () => {
    // Tests optional studentId field is hidden when undefined
    it('handles missing studentId gracefully', () => {
      const studentWithoutId: User = {
        ...mockStudent,
        studentId: undefined,
      };
      render(<UserProfile user={studentWithoutId} />);
      expect(screen.queryByText('Student ID')).not.toBeInTheDocument();
      expect(screen.getByText(mockStudent.name)).toBeInTheDocument();
    });

    // Tests optional degree field is hidden when undefined
    it('handles missing degree gracefully', () => {
      const studentWithoutDegree: User = {
        ...mockStudent,
        degree: undefined,
      };
      render(<UserProfile user={studentWithoutDegree} />);
      expect(screen.queryByText('Degree Program')).not.toBeInTheDocument();
      expect(screen.getByText(mockStudent.name)).toBeInTheDocument();
    });

    // Tests optional department field is hidden when undefined
    it('handles missing department gracefully', () => {
      const supervisorWithoutDept: User = {
        ...mockSupervisor,
        department: undefined,
      };
      render(<UserProfile user={supervisorWithoutDept} />);
      expect(screen.queryByText('Department')).not.toBeInTheDocument();
      expect(screen.getByText(mockSupervisor.name)).toBeInTheDocument();
    });

    // Tests optional expertise field is hidden when undefined
    it('handles empty expertise array gracefully', () => {
      const supervisorWithoutExpertise: User = {
        ...mockSupervisor,
        expertise: undefined,
      };
      render(<UserProfile user={supervisorWithoutExpertise} />);
      expect(screen.queryByText('Areas of Expertise')).not.toBeInTheDocument();
      expect(screen.getByText(mockSupervisor.name)).toBeInTheDocument();
    });
  });
});

