import { render, screen } from '@testing-library/react';
import UserProfile from '../UserProfile';
import { User } from '@/types/user';
import { users } from '@/mock-data';

describe('UserProfile', () => {
  // Use mock data directly from the mock-data folder
  const mockStudent = users.find(u => u.role === 'student');
  const mockSupervisor = users.find(u => u.role === 'supervisor');
  const mockAdmin = users.find(u => u.role === 'admin');

  // Ensure mock data exists
  if (!mockStudent || !mockSupervisor || !mockAdmin) {
    throw new Error('Mock data missing required user roles. Please check mock-data/data/users.ts');
  }

  describe('Student Profile', () => {
    it('renders student information correctly', () => {
      render(<UserProfile user={mockStudent} />);
      expect(screen.getByText(mockStudent.name)).toBeInTheDocument();
      expect(screen.getByText(mockStudent.email)).toBeInTheDocument();
      expect(screen.getByText(mockStudent.studentId!)).toBeInTheDocument();
      expect(screen.getByText(mockStudent.degree!)).toBeInTheDocument();
    });

    it('displays correct role badge for student', () => {
      render(<UserProfile user={mockStudent} />);
      const badge = screen.getByText('Student');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('conditionally renders student-specific fields', () => {
      render(<UserProfile user={mockStudent} />);
      expect(screen.getByText(mockStudent.studentId!)).toBeInTheDocument();
      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText(mockStudent.degree!)).toBeInTheDocument();
      expect(screen.getByText('Degree Program')).toBeInTheDocument();
    });

    it('renders profile image with correct alt text', () => {
      render(<UserProfile user={mockStudent} />);
      const image = screen.getByAltText(mockStudent.name);
      expect(image).toBeInTheDocument();
    });
  });

  describe('Supervisor Profile', () => {
    it('renders supervisor information correctly', () => {
      render(<UserProfile user={mockSupervisor} />);
      expect(screen.getByText(mockSupervisor.name)).toBeInTheDocument();
      expect(screen.getByText(mockSupervisor.email)).toBeInTheDocument();
      expect(screen.getByText(mockSupervisor.department!)).toBeInTheDocument();
    });

    it('displays correct role badge for supervisor', () => {
      render(<UserProfile user={mockSupervisor} />);
      const badge = screen.getByText('Supervisor');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('conditionally renders supervisor-specific fields', () => {
      render(<UserProfile user={mockSupervisor} />);
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText(mockSupervisor.department!)).toBeInTheDocument();
    });

    it('displays expertise array for supervisors', () => {
      render(<UserProfile user={mockSupervisor} />);
      expect(screen.getByText('Areas of Expertise')).toBeInTheDocument();
      mockSupervisor.expertise!.forEach(area => {
        expect(screen.getByText(area)).toBeInTheDocument();
      });
    });

    it('does not render student-specific fields for supervisor', () => {
      render(<UserProfile user={mockSupervisor} />);
      expect(screen.queryByText('Student ID')).not.toBeInTheDocument();
      expect(screen.queryByText('Degree Program')).not.toBeInTheDocument();
    });
  });

  describe('Admin Profile', () => {
    it('renders admin information correctly', () => {
      render(<UserProfile user={mockAdmin} />);
      expect(screen.getByText(mockAdmin.name)).toBeInTheDocument();
      expect(screen.getByText(mockAdmin.email)).toBeInTheDocument();
      expect(screen.getByText(mockAdmin.department!)).toBeInTheDocument();
    });

    it('displays correct role badge for admin', () => {
      render(<UserProfile user={mockAdmin} />);
      const badge = screen.getByText('Administrator');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('conditionally renders admin-specific fields', () => {
      render(<UserProfile user={mockAdmin} />);
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Administration')).toBeInTheDocument();
    });

    it('does not render student-specific fields for admin', () => {
      render(<UserProfile user={mockAdmin} />);
      expect(screen.queryByText('Student ID')).not.toBeInTheDocument();
      expect(screen.queryByText('Degree Program')).not.toBeInTheDocument();
    });
  });

  describe('Optional Fields Handling', () => {
    it('handles missing studentId gracefully', () => {
      const studentWithoutId: User = {
        ...mockStudent,
        studentId: undefined,
      };
      render(<UserProfile user={studentWithoutId} />);
      expect(screen.queryByText('Student ID')).not.toBeInTheDocument();
      expect(screen.getByText(mockStudent.name)).toBeInTheDocument();
    });

    it('handles missing degree gracefully', () => {
      const studentWithoutDegree: User = {
        ...mockStudent,
        degree: undefined,
      };
      render(<UserProfile user={studentWithoutDegree} />);
      expect(screen.queryByText('Degree Program')).not.toBeInTheDocument();
      expect(screen.getByText(mockStudent.name)).toBeInTheDocument();
    });

    it('handles missing department gracefully', () => {
      const supervisorWithoutDept: User = {
        ...mockSupervisor,
        department: undefined,
      };
      render(<UserProfile user={supervisorWithoutDept} />);
      expect(screen.queryByText('Department')).not.toBeInTheDocument();
      expect(screen.getByText(mockSupervisor.name)).toBeInTheDocument();
    });

    it('handles empty expertise array gracefully', () => {
      const supervisorWithoutExpertise: User = {
        ...mockSupervisor,
        expertise: undefined,
      };
      render(<UserProfile user={supervisorWithoutExpertise} />);
      expect(screen.queryByText('Areas of Expertise')).not.toBeInTheDocument();
      expect(screen.getByText(mockSupervisor.name)).toBeInTheDocument();
    });

    it('always renders email field', () => {
      render(<UserProfile user={mockStudent} />);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText(mockStudent.email)).toBeInTheDocument();
    });
  });
});

