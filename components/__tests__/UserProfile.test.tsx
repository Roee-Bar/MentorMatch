import { render, screen } from '@testing-library/react';
import UserProfile from '../UserProfile';
import { User } from '@/types/user';

describe('UserProfile', () => {
  const mockStudent: User = {
    id: '1',
    name: 'Test Student',
    email: 'test.student@example.com',
    role: 'student',
    profileImage: '/test-image.jpg',
    studentId: 'STU-001',
    degree: 'B.Sc. Software Engineering',
  };

  const mockSupervisor: User = {
    id: '2',
    name: 'Test Supervisor',
    email: 'test.supervisor@example.com',
    role: 'supervisor',
    profileImage: '/test-supervisor.jpg',
    department: 'Computer Science',
    expertise: ['Machine Learning', 'Web Development', 'Database Systems'],
  };

  const mockAdmin: User = {
    id: '3',
    name: 'Test Admin',
    email: 'test.admin@example.com',
    role: 'admin',
    profileImage: '/test-admin.jpg',
    department: 'Administration',
  };

  describe('Student Profile', () => {
    it('renders student information correctly', () => {
      render(<UserProfile user={mockStudent} />);
      expect(screen.getByText('Test Student')).toBeInTheDocument();
      expect(screen.getByText('test.student@example.com')).toBeInTheDocument();
      expect(screen.getByText('STU-001')).toBeInTheDocument();
      expect(screen.getByText('B.Sc. Software Engineering')).toBeInTheDocument();
    });

    it('displays correct role badge for student', () => {
      render(<UserProfile user={mockStudent} />);
      const badge = screen.getByText('Student');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('conditionally renders student-specific fields', () => {
      render(<UserProfile user={mockStudent} />);
      expect(screen.getByText('STU-001')).toBeInTheDocument();
      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText('B.Sc. Software Engineering')).toBeInTheDocument();
      expect(screen.getByText('Degree Program')).toBeInTheDocument();
    });

    it('renders profile image with correct alt text', () => {
      render(<UserProfile user={mockStudent} />);
      const image = screen.getByAltText('Test Student');
      expect(image).toBeInTheDocument();
      // Next.js Image component transforms the src, so we check that it contains the original path
      expect(image).toHaveAttribute('src', expect.stringContaining('test-image.jpg'));
    });
  });

  describe('Supervisor Profile', () => {
    it('renders supervisor information correctly', () => {
      render(<UserProfile user={mockSupervisor} />);
      expect(screen.getByText('Test Supervisor')).toBeInTheDocument();
      expect(screen.getByText('test.supervisor@example.com')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
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
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
    });

    it('displays expertise array for supervisors', () => {
      render(<UserProfile user={mockSupervisor} />);
      expect(screen.getByText('Areas of Expertise')).toBeInTheDocument();
      expect(screen.getByText('Machine Learning')).toBeInTheDocument();
      expect(screen.getByText('Web Development')).toBeInTheDocument();
      expect(screen.getByText('Database Systems')).toBeInTheDocument();
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
      expect(screen.getByText('Test Admin')).toBeInTheDocument();
      expect(screen.getByText('test.admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('Administration')).toBeInTheDocument();
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
      expect(screen.getByText('Test Student')).toBeInTheDocument();
    });

    it('handles missing degree gracefully', () => {
      const studentWithoutDegree: User = {
        ...mockStudent,
        degree: undefined,
      };
      render(<UserProfile user={studentWithoutDegree} />);
      expect(screen.queryByText('Degree Program')).not.toBeInTheDocument();
      expect(screen.getByText('Test Student')).toBeInTheDocument();
    });

    it('handles missing department gracefully', () => {
      const supervisorWithoutDept: User = {
        ...mockSupervisor,
        department: undefined,
      };
      render(<UserProfile user={supervisorWithoutDept} />);
      expect(screen.queryByText('Department')).not.toBeInTheDocument();
      expect(screen.getByText('Test Supervisor')).toBeInTheDocument();
    });

    it('handles empty expertise array gracefully', () => {
      const supervisorWithoutExpertise: User = {
        ...mockSupervisor,
        expertise: undefined,
      };
      render(<UserProfile user={supervisorWithoutExpertise} />);
      expect(screen.queryByText('Areas of Expertise')).not.toBeInTheDocument();
      expect(screen.getByText('Test Supervisor')).toBeInTheDocument();
    });

    it('always renders email field', () => {
      render(<UserProfile user={mockStudent} />);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('test.student@example.com')).toBeInTheDocument();
    });
  });
});

