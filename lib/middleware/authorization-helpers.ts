/**
 * Authorization Verification Helpers
 * 
 * Provides reusable functions for verifying user access to resources
 */

import { NextResponse } from 'next/server';
import { ApiResponse } from './response';
import { SupervisorPartnershipRequestService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-request-service';
import { ProjectService } from '@/lib/services/projects/project-service';
import { ERROR_MESSAGES } from '@/lib/constants/error-messages';
import type { SupervisorPartnershipRequest } from '@/types/database';
import type { Project } from '@/types/database';

/**
 * Result of authorization verification
 */
export interface AuthorizationResult<T> {
  authorized: boolean;
  resource?: T;
  error?: NextResponse;
}

/**
 * Verify user has access to a partnership request
 * User must be either the requesting supervisor or target supervisor
 * 
 * @param requestId - Partnership request ID
 * @param userId - User ID to verify
 * @returns Authorization result with request data if authorized
 */
export async function verifyRequestAccess(
  requestId: string,
  userId: string
): Promise<AuthorizationResult<SupervisorPartnershipRequest>> {
  const request = await SupervisorPartnershipRequestService.getById(requestId);
  
  if (!request) {
    return {
      authorized: false,
      error: ApiResponse.notFound(ERROR_MESSAGES.PARTNERSHIP_REQUEST_NOT_FOUND),
    };
  }
  
  const isAuthorized = 
    request.requestingSupervisorId === userId || 
    request.targetSupervisorId === userId;
  
  if (!isAuthorized) {
    return {
      authorized: false,
      error: ApiResponse.forbidden(ERROR_MESSAGES.UNAUTHORIZED_VIEW_REQUEST),
    };
  }
  
  return {
    authorized: true,
    resource: request,
  };
}

/**
 * Verify user has access to a project
 * User must be supervisor, co-supervisor, or admin
 * 
 * @param projectId - Project ID
 * @param userId - User ID to verify
 * @param userRole - User role
 * @param allowedRoles - Optional array of allowed roles (admin is always allowed)
 * @returns Authorization result with project data if authorized
 */
export async function verifyProjectAccess(
  projectId: string,
  userId: string,
  userRole: string,
  allowedRoles?: string[]
): Promise<AuthorizationResult<Project>> {
  const project = await ProjectService.getProjectById(projectId);
  
  if (!project) {
    return {
      authorized: false,
      error: ApiResponse.notFound(ERROR_MESSAGES.PROJECT_NOT_FOUND),
    };
  }
  
  // Admin always has access
  if (userRole === 'admin') {
    return {
      authorized: true,
      resource: project,
    };
  }
  
  // Check if user is supervisor or co-supervisor
  const isSupervisor = 
    project.supervisorId === userId || 
    project.coSupervisorId === userId;
  
  // Check role-based access if specified
  const hasRoleAccess = allowedRoles 
    ? allowedRoles.includes(userRole)
    : true;
  
  if (!isSupervisor || !hasRoleAccess) {
    return {
      authorized: false,
      error: ApiResponse.forbidden(ERROR_MESSAGES.UNAUTHORIZED_ACCESS_PROJECT),
    };
  }
  
  return {
    authorized: true,
    resource: project,
  };
}

