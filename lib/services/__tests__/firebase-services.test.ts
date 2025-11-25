// Unit tests for Firebase Services
import {
  UserService,
  StudentService,
  SupervisorService,
  ApplicationService,
  ProjectService,
  AdminService,
} from '../firebase-services';
import {
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  collection,
  doc,
} from 'firebase/firestore';
import { users } from '@/mock-data';
import type {
  Student,
  Supervisor,
  Application,
  Project,
  Admin,
} from '@/types/database';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  Timestamp: jest.fn(),
}));

// Mock Firebase db
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
}));

describe('Firebase Services - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock doc to return a document reference object
    (doc as jest.Mock).mockReturnValue({ id: 'mock-doc-ref' });
    // Mock collection to return a collection reference object
    (collection as jest.Mock).mockReturnValue({ id: 'mock-collection-ref' });
  });

  // ============================================
  // USER SERVICE TESTS
  // ============================================
  describe('UserService', () => {
    describe('getUserById', () => {
      // Verifies successful retrieval of user data by ID from Firestore
      it('should return user data when user exists', async () => {
        const mockUser = users[0];
        const mockDoc = {
          exists: () => true,
          data: () => mockUser,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await UserService.getUserById('1');

        expect(result).toEqual(mockUser);
        expect(getDoc).toHaveBeenCalledTimes(1);
      });

      // Tests that getUserById returns null when user document doesn't exist
      it('should return null when user does not exist', async () => {
        const mockDoc = {
          exists: () => false,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await UserService.getUserById('nonexistent');

        expect(result).toBeNull();
      });

      // Tests error handling returns null when Firestore query fails
      it('should return null on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await UserService.getUserById('1');

        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user:', expect.any(Error));
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getAllUsers', () => {
      // Verifies retrieval of all user documents from Firestore collection
      it('should return all users', async () => {
        const mockQuerySnapshot = {
          docs: users.map(user => ({
            data: () => user,
          })),
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await UserService.getAllUsers();

        expect(result).toEqual(users);
        expect(getDocs).toHaveBeenCalledTimes(1);
      });

      // Tests that getAllUsers returns empty array when no documents exist
      it('should return empty array when no users exist', async () => {
        const mockQuerySnapshot = {
          docs: [],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await UserService.getAllUsers();

        expect(result).toEqual([]);
      });

      // Tests error handling returns empty array when Firestore query fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await UserService.getAllUsers();

        expect(result).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching users:', expect.any(Error));
        consoleErrorSpy.mockRestore();
      });
    });
  });

  // ============================================
  // STUDENT SERVICE TESTS
  // ============================================
  describe('StudentService', () => {
    const mockStudent: Student = {
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'john.doe@braude.ac.il',
      studentId: 'STU-001',
      phone: '050-1234567',
      department: 'Computer Science',
      academicYear: '4th Year',
      skills: 'JavaScript, React',
      interests: 'Web Development',
      hasPartner: false,
      profileComplete: true,
      matchStatus: 'unmatched',
      registrationDate: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    describe('getStudentById', () => {
      // Verifies successful retrieval of student data by ID from Firestore
      it('should return student data when student exists', async () => {
        const mockDoc = {
          exists: () => true,
          data: () => mockStudent,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await StudentService.getStudentById('STU-001');

        expect(result).toEqual(mockStudent);
      });

      // Tests that getStudentById returns null when student document doesn't exist
      it('should return null when student does not exist', async () => {
        const mockDoc = {
          exists: () => false,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await StudentService.getStudentById('nonexistent');

        expect(result).toBeNull();
      });

      // Tests error handling returns null when student query fails
      it('should return null on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await StudentService.getStudentById('STU-001');

        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getAllStudents', () => {
      // Verifies retrieval of all student documents from Firestore collection
      it('should return all students', async () => {
        const mockStudents = [mockStudent];
        const mockQuerySnapshot = {
          docs: mockStudents.map(student => ({
            data: () => student,
          })),
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await StudentService.getAllStudents();

        expect(result).toEqual(mockStudents);
      });

      // Tests error handling returns empty array when getAllStudents query fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await StudentService.getAllStudents();

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getUnmatchedStudents', () => {
      // Verifies query returns only students with unmatched status
      it('should return only unmatched students', async () => {
        const unmatchedStudent = { ...mockStudent, matchStatus: 'unmatched' as const };
        const mockQuerySnapshot = {
          docs: [{ data: () => unmatchedStudent }],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await StudentService.getUnmatchedStudents();

        expect(result).toHaveLength(1);
        expect(result[0].matchStatus).toBe('unmatched');
      });

      // Tests handling when no unmatched students exist
      it('should return empty array when no unmatched students', async () => {
        const mockQuerySnapshot = {
          docs: [],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await StudentService.getUnmatchedStudents();

        expect(result).toEqual([]);
      });

      // Tests error handling for getUnmatchedStudents query failure
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await StudentService.getUnmatchedStudents();

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('updateStudent', () => {
      // Verifies successful student data update with updatedAt timestamp
      it('should update student successfully', async () => {
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const result = await StudentService.updateStudent('STU-001', {
          skills: 'TypeScript, React, Node.js',
        });

        expect(result).toBe(true);
        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            skills: 'TypeScript, React, Node.js',
            updatedAt: expect.any(Date),
          })
        );
      });

      // Tests error handling returns false when student update fails
      it('should return false on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

        const result = await StudentService.updateStudent('STU-001', {
          skills: 'Updated skills',
        });

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });
    });
  });

  // ============================================
  // SUPERVISOR SERVICE TESTS
  // ============================================
  describe('SupervisorService', () => {
    const mockSupervisor: Supervisor = {
      firstName: 'Dr.',
      lastName: 'Smith',
      fullName: 'Dr. Smith',
      email: 'smith@braude.ac.il',
      department: 'Computer Science',
      title: 'Dr.',
      bio: 'Expert in AI',
      researchInterests: ['AI', 'Machine Learning'],
      expertiseAreas: ['Deep Learning'],
      maxCapacity: 5,
      currentCapacity: 2,
      availabilityStatus: 'available',
      notificationPreference: 'immediate',
      isApproved: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('getSupervisorById', () => {
      // Verifies successful retrieval of supervisor data by ID
      it('should return supervisor data when supervisor exists', async () => {
        const mockDoc = {
          exists: () => true,
          data: () => mockSupervisor,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await SupervisorService.getSupervisorById('SUP-001');

        expect(result).toEqual(mockSupervisor);
      });

      // Tests that getSupervisorById returns null when document doesn't exist
      it('should return null when supervisor does not exist', async () => {
        const mockDoc = {
          exists: () => false,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await SupervisorService.getSupervisorById('nonexistent');

        expect(result).toBeNull();
      });

      // Tests error handling returns null when supervisor query fails
      it('should return null on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await SupervisorService.getSupervisorById('SUP-001');

        expect(result).toBeNull();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getAllSupervisors', () => {
      // Verifies retrieval of all supervisor documents from Firestore
      it('should return all supervisors', async () => {
        const mockSupervisors = [mockSupervisor];
        const mockQuerySnapshot = {
          docs: mockSupervisors.map(sup => ({
            data: () => sup,
          })),
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await SupervisorService.getAllSupervisors();

        expect(result).toEqual(mockSupervisors);
      });

      // Tests error handling returns empty array when getAllSupervisors query fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await SupervisorService.getAllSupervisors();

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getAvailableSupervisors', () => {
      // Verifies filtering and transformation of available supervisors for display
      it('should return and transform available supervisors', async () => {
        const mockQuerySnapshot = {
          docs: [
            {
              id: 'SUP-001',
              data: () => mockSupervisor,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await SupervisorService.getAvailableSupervisors();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: 'SUP-001',
          name: mockSupervisor.fullName,
          department: mockSupervisor.department,
          bio: mockSupervisor.bio,
          expertiseAreas: mockSupervisor.expertiseAreas,
          researchInterests: mockSupervisor.researchInterests,
          availabilityStatus: mockSupervisor.availabilityStatus,
          currentCapacity: `${mockSupervisor.currentCapacity}/${mockSupervisor.maxCapacity} projects`,
          contact: mockSupervisor.email,
        });
      });

      // Tests that getAvailableSupervisors excludes supervisors with unavailable status
      it('should filter out unavailable supervisors', async () => {
        const unavailableSupervisor = {
          ...mockSupervisor,
          availabilityStatus: 'unavailable' as const,
        };
        const mockQuerySnapshot = {
          docs: [
            {
              id: 'SUP-001',
              data: () => unavailableSupervisor,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await SupervisorService.getAvailableSupervisors();

        expect(result).toHaveLength(0);
      });

      // Tests error handling returns empty array when getAvailableSupervisors fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await SupervisorService.getAvailableSupervisors();

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('updateSupervisor', () => {
      // Verifies successful supervisor data update with updatedAt timestamp
      it('should update supervisor successfully', async () => {
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const result = await SupervisorService.updateSupervisor('SUP-001', {
          currentCapacity: 3,
        });

        expect(result).toBe(true);
        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            currentCapacity: 3,
            updatedAt: expect.any(Date),
          })
        );
      });

      // Tests error handling returns false when supervisor update fails
      it('should return false on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

        const result = await SupervisorService.updateSupervisor('SUP-001', {
          currentCapacity: 3,
        });

        expect(result).toBe(false);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getSupervisorsByDepartment', () => {
      // Verifies filtering supervisors by department query
      it('should return supervisors filtered by department', async () => {
        const mockQuerySnapshot = {
          docs: [{ data: () => mockSupervisor }],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await SupervisorService.getSupervisorsByDepartment('Computer Science');

        expect(result).toHaveLength(1);
        expect(result[0].department).toBe('Computer Science');
      });

      // Tests handling when no supervisors exist in specified department
      it('should return empty array when no supervisors in department', async () => {
        const mockQuerySnapshot = {
          docs: [],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await SupervisorService.getSupervisorsByDepartment('Mechanical Engineering');

        expect(result).toEqual([]);
      });

      // Tests error handling returns empty array when department query fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await SupervisorService.getSupervisorsByDepartment('Computer Science');

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });
  });

  // ============================================
  // APPLICATION SERVICE TESTS
  // ============================================
  describe('ApplicationService', () => {
    const mockApplication: Application = {
      id: 'APP-001',
      studentId: 'STU-001',
      studentName: 'John Doe',
      studentEmail: 'john@braude.ac.il',
      supervisorId: 'SUP-001',
      supervisorName: 'Dr. Smith',
      projectTitle: 'AI Project',
      projectDescription: 'Building an AI system',
      isOwnTopic: true,
      studentSkills: 'JavaScript, Python',
      studentInterests: 'AI, ML',
      hasPartner: false,
      status: 'pending',
      dateApplied: new Date('2024-01-01'),
      lastUpdated: new Date('2024-01-01'),
    };

    describe('getApplicationById', () => {
      // Verifies successful retrieval of application by ID with document ID mapping
      it('should return application when it exists', async () => {
        const mockData = { ...mockApplication };
        delete (mockData as any).id; // Remove id from data as it comes from doc.id
        
        const mockDoc = {
          exists: () => true,
          id: 'APP-001',
          data: () => mockData,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await ApplicationService.getApplicationById('APP-001');

        expect(result).toBeTruthy();
        expect(result?.id).toBe('APP-001');
      });

      // Tests conversion of Firestore Timestamps to Date objects for single application
      it('should convert Firestore Timestamps to Date objects', async () => {
        const mockTimestamp = {
          toDate: jest.fn(() => new Date('2024-01-15T10:30:00Z')),
        };
        
        const mockData = {
          ...mockApplication,
          id: undefined,
          dateApplied: mockTimestamp,
          lastUpdated: mockTimestamp,
        };

        const mockDoc = {
          exists: () => true,
          id: 'APP-001',
          data: () => mockData,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await ApplicationService.getApplicationById('APP-001');

        expect(result).toBeTruthy();
        expect(result!.dateApplied).toBeInstanceOf(Date);
        expect(result!.lastUpdated).toBeInstanceOf(Date);
        expect(mockTimestamp.toDate).toHaveBeenCalled();
      });

      // Tests that getApplicationById returns null when document doesn't exist
      it('should return null when application does not exist', async () => {
        const mockDoc = {
          exists: () => false,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await ApplicationService.getApplicationById('nonexistent');

        expect(result).toBeNull();
      });

      // Tests error handling returns null when application query fails
      it('should return null on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ApplicationService.getApplicationById('APP-001');

        expect(result).toBeNull();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getStudentApplications', () => {
      // Verifies retrieval and transformation of student applications with date formatting
      it('should return and transform student applications', async () => {
        const mockData = {
          ...mockApplication,
          dateApplied: {
            toDate: () => new Date('2024-01-01'),
          },
          supervisorName: 'Dr. Smith',
        };

        const mockQuerySnapshot = {
          docs: [
            {
              id: 'APP-001',
              data: () => mockData,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ApplicationService.getStudentApplications('STU-001');

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: 'APP-001',
          projectTitle: mockApplication.projectTitle,
          supervisorName: 'Dr. Smith',
        });
      });

      // Tests handling of null or missing date objects in application data
      it('should handle missing toDate method', async () => {
        const mockData = {
          ...mockApplication,
          dateApplied: null,
        };

        const mockQuerySnapshot = {
          docs: [
            {
              id: 'APP-001',
              data: () => mockData,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ApplicationService.getStudentApplications('STU-001');

        expect(result[0].dateApplied).toBe('N/A');
      });

      // Tests error handling returns empty array when student applications query fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ApplicationService.getStudentApplications('STU-001');

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getSupervisorApplications', () => {
      // Verifies retrieval of all applications for a specific supervisor
      it('should return applications for supervisor', async () => {
        const mockQuerySnapshot = {
          docs: [
            {
              id: 'APP-001',
              data: () => mockApplication,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ApplicationService.getSupervisorApplications('SUP-001');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('APP-001');
      });

      // Tests conversion of Firestore Timestamp to JavaScript Date objects
      it('should convert Firestore Timestamps to Date objects', async () => {
        const mockTimestamp = {
          toDate: jest.fn(() => new Date('2024-01-15T10:30:00Z')),
        };
        
        const mockData = {
          ...mockApplication,
          dateApplied: mockTimestamp,
          lastUpdated: mockTimestamp,
          responseDate: mockTimestamp,
        };

        const mockQuerySnapshot = {
          docs: [
            {
              id: 'APP-001',
              data: () => mockData,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ApplicationService.getSupervisorApplications('SUP-001');

        expect(result).toHaveLength(1);
        expect(result[0].dateApplied).toBeInstanceOf(Date);
        expect(result[0].lastUpdated).toBeInstanceOf(Date);
        expect(result[0].responseDate).toBeInstanceOf(Date);
        expect(mockTimestamp.toDate).toHaveBeenCalledTimes(3);
      });

      // Tests handling when date fields are already Date objects (not Timestamps)
      it('should handle dates that are already Date objects', async () => {
        const nativeDate = new Date('2024-01-15T10:30:00Z');
        const mockData = {
          ...mockApplication,
          dateApplied: nativeDate,
          lastUpdated: nativeDate,
        };

        const mockQuerySnapshot = {
          docs: [
            {
              id: 'APP-001',
              data: () => mockData,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ApplicationService.getSupervisorApplications('SUP-001');

        expect(result[0].dateApplied).toBe(nativeDate);
        expect(result[0].lastUpdated).toBe(nativeDate);
      });

      // Tests error handling returns empty array when supervisor applications query fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ApplicationService.getSupervisorApplications('SUP-001');

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getPendingApplications', () => {
      // Verifies filtering applications by pending and under_review status
      it('should return only pending and under review applications', async () => {
        const mockQuerySnapshot = {
          docs: [
            {
              id: 'APP-001',
              data: () => ({ ...mockApplication, status: 'pending' }),
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ApplicationService.getPendingApplications('SUP-001');

        expect(result).toHaveLength(1);
      });

      // Tests conversion of Firestore Timestamps in pending applications
      it('should convert Firestore Timestamps to Date objects', async () => {
        const mockTimestamp = {
          toDate: jest.fn(() => new Date('2024-01-15T10:30:00Z')),
        };
        
        const mockData = {
          ...mockApplication,
          status: 'pending' as const,
          dateApplied: mockTimestamp,
          lastUpdated: mockTimestamp,
        };

        const mockQuerySnapshot = {
          docs: [
            {
              id: 'APP-001',
              data: () => mockData,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ApplicationService.getPendingApplications('SUP-001');

        expect(result[0].dateApplied).toBeInstanceOf(Date);
        expect(result[0].lastUpdated).toBeInstanceOf(Date);
      });

      // Tests error handling returns empty array when pending applications query fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ApplicationService.getPendingApplications('SUP-001');

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('createApplication', () => {
      // Verifies successful creation of new application with timestamps
      it('should create application successfully', async () => {
        const mockDocRef = { id: 'APP-NEW' };
        (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

        const applicationData = {
          ...mockApplication,
          id: undefined as any,
        };
        const result = await ApplicationService.createApplication(applicationData);

        expect(result).toBe('APP-NEW');
        expect(addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            dateApplied: expect.any(Date),
            lastUpdated: expect.any(Date),
          })
        );
      });

      // Tests error handling returns null when application creation fails
      it('should return null on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (addDoc as jest.Mock).mockRejectedValue(new Error('Create failed'));

        const applicationData = {
          ...mockApplication,
          id: undefined as any,
        };
        const result = await ApplicationService.createApplication(applicationData);

        expect(result).toBeNull();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('updateApplicationStatus', () => {
      // Verifies successful status update with feedback and timestamps
      it('should update status successfully', async () => {
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const result = await ApplicationService.updateApplicationStatus(
          'APP-001',
          'approved',
          'Great project!'
        );

        expect(result).toBe(true);
        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            status: 'approved',
            supervisorFeedback: 'Great project!',
            lastUpdated: expect.any(Date),
            responseDate: expect.any(Date),
          })
        );
      });

      // Tests status update without optional feedback parameter
      it('should update status without feedback', async () => {
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const result = await ApplicationService.updateApplicationStatus(
          'APP-001',
          'under_review'
        );

        expect(result).toBe(true);
        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            status: 'under_review',
            lastUpdated: expect.any(Date),
          })
        );
      });

      // Tests that responseDate is added when status changes to approved or rejected
      it('should add responseDate for approved/rejected status', async () => {
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        await ApplicationService.updateApplicationStatus('APP-001', 'rejected');

        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            responseDate: expect.any(Date),
          })
        );
      });

      // Tests error handling returns false when status update fails
      it('should return false on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

        const result = await ApplicationService.updateApplicationStatus('APP-001', 'approved');

        expect(result).toBe(false);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getAllApplications', () => {
      // Verifies retrieval of all application documents from Firestore
      it('should return all applications', async () => {
        const mockQuerySnapshot = {
          docs: [
            {
              id: 'APP-001',
              data: () => mockApplication,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ApplicationService.getAllApplications();

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('APP-001');
      });

      // Tests conversion of Firestore Timestamps in all applications query
      it('should convert Firestore Timestamps to Date objects for all applications', async () => {
        const mockTimestamp = {
          toDate: jest.fn(() => new Date('2024-01-15T10:30:00Z')),
        };
        
        const mockData = {
          ...mockApplication,
          dateApplied: mockTimestamp,
          lastUpdated: mockTimestamp,
        };

        const mockQuerySnapshot = {
          docs: [
            {
              id: 'APP-001',
              data: () => mockData,
            },
            {
              id: 'APP-002',
              data: () => mockData,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ApplicationService.getAllApplications();

        expect(result).toHaveLength(2);
        result.forEach(app => {
          expect(app.dateApplied).toBeInstanceOf(Date);
          expect(app.lastUpdated).toBeInstanceOf(Date);
        });
      });

      // Tests error handling returns empty array when getAllApplications query fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ApplicationService.getAllApplications();

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });
  });

  // ============================================
  // PROJECT SERVICE TESTS
  // ============================================
  describe('ProjectService', () => {
    const mockProject: Project = {
      id: 'PRJ-001',
      projectCode: '2024-1-C-01',
      studentIds: ['STU-001'],
      studentNames: ['John Doe'],
      supervisorId: 'SUP-001',
      supervisorName: 'Dr. Smith',
      title: 'AI Project',
      description: 'Building an AI system',
      status: 'in_progress',
      phase: 'A',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('getProjectById', () => {
      // Verifies successful retrieval of project by ID with document ID mapping
      it('should return project when it exists', async () => {
        const mockDoc = {
          exists: () => true,
          id: 'PRJ-001',
          data: () => ({ ...mockProject, id: undefined }),
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await ProjectService.getProjectById('PRJ-001');

        expect(result).toBeTruthy();
        expect(result?.id).toBe('PRJ-001');
      });

      // Tests that getProjectById returns null when document doesn't exist
      it('should return null when project does not exist', async () => {
        const mockDoc = {
          exists: () => false,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await ProjectService.getProjectById('nonexistent');

        expect(result).toBeNull();
      });

      // Tests error handling returns null when project query fails
      it('should return null on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ProjectService.getProjectById('PRJ-001');

        expect(result).toBeNull();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getAllProjects', () => {
      // Verifies retrieval of all project documents from Firestore
      it('should return all projects', async () => {
        const mockQuerySnapshot = {
          docs: [
            {
              id: 'PRJ-001',
              data: () => mockProject,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ProjectService.getAllProjects();

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('PRJ-001');
      });

      // Tests error handling returns empty array when getAllProjects query fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ProjectService.getAllProjects();

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getSupervisorProjects', () => {
      // Verifies filtering projects by supervisor ID
      it('should return projects for supervisor', async () => {
        const mockQuerySnapshot = {
          docs: [
            {
              id: 'PRJ-001',
              data: () => mockProject,
            },
          ],
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const result = await ProjectService.getSupervisorProjects('SUP-001');

        expect(result).toHaveLength(1);
        expect(result[0].supervisorId).toBe('SUP-001');
      });

      // Tests error handling returns empty array when supervisor projects query fails
      it('should return empty array on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ProjectService.getSupervisorProjects('SUP-001');

        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
      });
    });

    describe('createProject', () => {
      // Verifies successful creation of new project with timestamps
      it('should create project successfully', async () => {
        const mockDocRef = { id: 'PRJ-NEW' };
        (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

        const projectData = {
          ...mockProject,
          id: undefined as any,
        };
        const result = await ProjectService.createProject(projectData);

        expect(result).toBe('PRJ-NEW');
        expect(addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          })
        );
      });

      // Tests error handling returns null when project creation fails
      it('should return null on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (addDoc as jest.Mock).mockRejectedValue(new Error('Create failed'));

        const projectData = {
          ...mockProject,
          id: undefined as any,
        };
        const result = await ProjectService.createProject(projectData);

        expect(result).toBeNull();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('generateProjectCode', () => {
      // Tests business logic for generating standardized project codes
      it('should generate correct project code format', () => {
        const code = ProjectService.generateProjectCode(2024, 1, 'Computer Science', 5);

        expect(code).toBe('2024-1-C-05');
      });

      // Tests that project codes pad single digit sequence numbers correctly
      it('should pad single digit numbers', () => {
        const code = ProjectService.generateProjectCode(2024, 2, 'Software Engineering', 3);

        expect(code).toBe('2024-2-S-03');
      });

      // Tests that project codes extract first letter from department name
      it('should use first letter of department', () => {
        const code = ProjectService.generateProjectCode(2024, 1, 'Mechanical Engineering', 10);

        expect(code).toBe('2024-1-M-10');
      });
    });
  });

  // ============================================
  // ADMIN SERVICE TESTS
  // ============================================
  describe('AdminService', () => {
    const mockAdmin: Admin = {
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      email: 'admin@braude.ac.il',
      department: 'Administration',
      adminRole: 'system_admin',
      permissions: ['manage_users', 'view_reports'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('getAdminById', () => {
      // Verifies successful retrieval of admin data by ID
      it('should return admin when it exists', async () => {
        const mockDoc = {
          exists: () => true,
          data: () => mockAdmin,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await AdminService.getAdminById('ADM-001');

        expect(result).toEqual(mockAdmin);
      });

      // Tests that getAdminById returns null when document doesn't exist
      it('should return null when admin does not exist', async () => {
        const mockDoc = {
          exists: () => false,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDoc);

        const result = await AdminService.getAdminById('nonexistent');

        expect(result).toBeNull();
      });

      // Tests error handling returns null when admin query fails
      it('should return null on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await AdminService.getAdminById('ADM-001');

        expect(result).toBeNull();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getDashboardStats', () => {
      // Verifies calculation of dashboard statistics from student and supervisor data
      it('should calculate dashboard stats correctly', async () => {
        const mockStudentsSnapshot = {
          docs: [
            { data: () => ({ matchStatus: 'matched' }) },
            { data: () => ({ matchStatus: 'unmatched' }) },
            { data: () => ({ matchStatus: 'pending' }) },
          ],
          size: 3,
        };

        const mockSupervisorsSnapshot = {
          docs: [],
          size: 5,
        };

        (getDocs as jest.Mock)
          .mockResolvedValueOnce(mockStudentsSnapshot)
          .mockResolvedValueOnce(mockSupervisorsSnapshot);

        const result = await AdminService.getDashboardStats();

        expect(result).toEqual({
          totalStudents: 3,
          matchedStudents: 1,
          pendingMatches: 2,
          activeSupervisors: 5,
        });
      });

      // Tests error handling returns zero values when getDashboardStats fails
      it('should return zero stats on error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await AdminService.getDashboardStats();

        expect(result).toEqual({
          totalStudents: 0,
          matchedStudents: 0,
          pendingMatches: 0,
          activeSupervisors: 0,
        });
        consoleErrorSpy.mockRestore();
      });

      // Tests calculation returns zeros when collections are empty
      it('should handle empty collections', async () => {
        const mockEmptySnapshot = {
          docs: [],
          size: 0,
        };

        (getDocs as jest.Mock)
          .mockResolvedValueOnce(mockEmptySnapshot)
          .mockResolvedValueOnce(mockEmptySnapshot);

        const result = await AdminService.getDashboardStats();

        expect(result).toEqual({
          totalStudents: 0,
          matchedStudents: 0,
          pendingMatches: 0,
          activeSupervisors: 0,
        });
      });
    });
  });
});

