/**
 * Test Data Builders
 * 
 * Builder pattern implementation for flexible test data creation.
 * Provides fluent API for building test entities.
 */

import type { Student, Supervisor, Admin, Application, Project, SupervisorPartnershipRequest, ProjectTopic, AdminPermission } from '@/types/database';
import { 
  generateStudentData, 
  generateSupervisorData, 
  generateAdminData,
  generateApplicationData,
  generateProjectData,
  generateSupervisorPartnershipRequestData
} from './test-data';
import { TestData } from '../config/test-config';

/**
 * Student Data Builder
 */
export class StudentDataBuilder {
  private data: Partial<Student> = {};

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  withFirstName(firstName: string): this {
    this.data.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.data.lastName = lastName;
    return this;
  }

  withDepartment(department: string): this {
    this.data.department = department;
    return this;
  }

  withStudentId(studentId: string): this {
    this.data.studentId = studentId;
    return this;
  }

  withPhone(phone: string): this {
    this.data.phone = phone;
    return this;
  }

  withSkills(skills: string): this {
    this.data.skills = skills;
    return this;
  }

  withInterests(interests: string): this {
    this.data.interests = interests;
    return this;
  }

  withPartnershipStatus(status: 'none' | 'paired' | 'pending_sent' | 'pending_received'): this {
    this.data.partnershipStatus = status;
    return this;
  }

  withPartner(partnerId: string, partnerName: string, partnerEmail: string): this {
    this.data.partnerId = partnerId;
    this.data.hasPartner = true;
    this.data.partnerName = partnerName;
    this.data.partnerEmail = partnerEmail;
    return this;
  }

  withPreferredTopics(topics: string): this {
    this.data.preferredTopics = topics;
    return this;
  }

  withPreviousProjects(projects: string): this {
    this.data.previousProjects = projects;
    return this;
  }

  build(): Omit<Student, 'id'> {
    return generateStudentData(this.data);
  }
}

/**
 * Supervisor Data Builder
 */
export class SupervisorDataBuilder {
  private data: Partial<Supervisor> = {};

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  withFirstName(firstName: string): this {
    this.data.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.data.lastName = lastName;
    return this;
  }

  withDepartment(department: string): this {
    this.data.department = department;
    return this;
  }

  withTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  withBio(bio: string): this {
    this.data.bio = bio;
    return this;
  }

  withResearchInterests(interests: string[]): this {
    this.data.researchInterests = interests;
    return this;
  }

  withExpertiseAreas(areas: string[]): this {
    this.data.expertiseAreas = areas;
    return this;
  }

  withCapacity(maxCapacity: number, currentCapacity: number = 0): this {
    this.data.maxCapacity = maxCapacity;
    this.data.currentCapacity = currentCapacity;
    return this;
  }

  withAvailabilityStatus(status: 'available' | 'unavailable' | 'limited'): this {
    this.data.availabilityStatus = status;
    return this;
  }

  withOfficeLocation(location: string): this {
    this.data.officeLocation = location;
    return this;
  }

  withOfficeHours(hours: string): this {
    this.data.officeHours = hours;
    return this;
  }

  withSuggestedTopics(topics: ProjectTopic[]): this {
    this.data.suggestedTopics = topics;
    return this;
  }

  build(): Omit<Supervisor, 'id'> {
    return generateSupervisorData(this.data);
  }
}

/**
 * Admin Data Builder
 */
export class AdminDataBuilder {
  private data: Partial<Admin> = {};

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  withFirstName(firstName: string): this {
    this.data.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.data.lastName = lastName;
    return this;
  }

  withDepartment(department: string): this {
    this.data.department = department;
    return this;
  }

  withRole(role: 'project_coordinator' | 'department_secretary' | 'system_admin'): this {
    this.data.adminRole = role;
    return this;
  }

  withPermissions(permissions: AdminPermission[]): this {
    this.data.permissions = permissions;
    return this;
  }

  withPhone(phone: string): this {
    this.data.phone = phone;
    return this;
  }

  build(): Omit<Admin, 'id'> {
    return generateAdminData(this.data);
  }
}

/**
 * Application Data Builder
 */
export class ApplicationDataBuilder {
  private data: Partial<Application> = {};
  private studentId: string;
  private supervisorId: string;

  constructor(studentId: string, supervisorId: string) {
    this.studentId = studentId;
    this.supervisorId = supervisorId;
  }

  withProjectTitle(title: string): this {
    this.data.projectTitle = title;
    return this;
  }

  withProjectDescription(description: string): this {
    this.data.projectDescription = description;
    return this;
  }

  withStatus(status: Application['status']): this {
    this.data.status = status;
    return this;
  }

  withIsOwnTopic(isOwnTopic: boolean): this {
    this.data.isOwnTopic = isOwnTopic;
    return this;
  }

  withStudentSkills(skills: string): this {
    this.data.studentSkills = skills;
    return this;
  }

  withStudentInterests(interests: string): this {
    this.data.studentInterests = interests;
    return this;
  }

  withHasPartner(hasPartner: boolean): this {
    this.data.hasPartner = hasPartner;
    return this;
  }

  withAppliedByStudentId(studentId: string): this {
    this.data.appliedByStudentId = studentId;
    return this;
  }

  withStudentName(name: string): this {
    this.data.studentName = name;
    return this;
  }

  withStudentEmail(email: string): this {
    this.data.studentEmail = email;
    return this;
  }

  withSupervisorName(name: string): this {
    this.data.supervisorName = name;
    return this;
  }

  build(): Omit<Application, 'id'> {
    return generateApplicationData(this.studentId, this.supervisorId, this.data);
  }
}

/**
 * Project Data Builder
 */
export class ProjectDataBuilder {
  private data: Partial<Project> = {};

  withProjectCode(code: string): this {
    this.data.projectCode = code;
    return this;
  }

  withTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  withSupervisor(supervisorId: string, supervisorName: string): this {
    this.data.supervisorId = supervisorId;
    this.data.supervisorName = supervisorName;
    return this;
  }

  withCoSupervisor(coSupervisorId: string, coSupervisorName: string): this {
    this.data.coSupervisorId = coSupervisorId;
    this.data.coSupervisorName = coSupervisorName;
    return this;
  }

  withStudents(studentIds: string[], studentNames: string[]): this {
    this.data.studentIds = studentIds;
    this.data.studentNames = studentNames;
    return this;
  }

  withStatus(status: Project['status']): this {
    this.data.status = status;
    return this;
  }

  withPhase(phase: 'A' | 'B'): this {
    this.data.phase = phase;
    return this;
  }

  build(): Omit<Project, 'id'> {
    return generateProjectData(this.data);
  }
}

/**
 * Supervisor Partnership Request Data Builder
 */
export class SupervisorPartnershipRequestDataBuilder {
  private data: Partial<SupervisorPartnershipRequest> = {};
  private requestingSupervisorId: string;
  private targetSupervisorId: string;
  private projectId: string;

  constructor(requestingSupervisorId: string, targetSupervisorId: string, projectId: string) {
    this.requestingSupervisorId = requestingSupervisorId;
    this.targetSupervisorId = targetSupervisorId;
    this.projectId = projectId;
  }

  withStatus(status: SupervisorPartnershipRequest['status']): this {
    this.data.status = status;
    return this;
  }

  withRequestingSupervisorName(name: string): this {
    this.data.requestingSupervisorName = name;
    return this;
  }

  withTargetSupervisorName(name: string): this {
    this.data.targetSupervisorName = name;
    return this;
  }

  withProjectTitle(title: string): this {
    this.data.projectTitle = title;
    return this;
  }

  build(): Omit<SupervisorPartnershipRequest, 'id'> {
    return generateSupervisorPartnershipRequestData(
      this.requestingSupervisorId,
      this.targetSupervisorId,
      this.projectId,
      this.data
    );
  }
}

/**
 * Convenience factory functions
 */
export const StudentBuilder = () => new StudentDataBuilder();
export const SupervisorBuilder = () => new SupervisorDataBuilder();
export const AdminBuilder = () => new AdminDataBuilder();
export const ApplicationBuilder = (studentId: string, supervisorId: string) => 
  new ApplicationDataBuilder(studentId, supervisorId);
export const ProjectBuilder = () => new ProjectDataBuilder();
export const SupervisorPartnershipRequestBuilder = (
  requestingSupervisorId: string,
  targetSupervisorId: string,
  projectId: string
) => new SupervisorPartnershipRequestDataBuilder(requestingSupervisorId, targetSupervisorId, projectId);

