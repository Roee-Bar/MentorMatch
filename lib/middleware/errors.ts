/**
 * Custom Error Classes
 * 
 * Standardized error classes for API error handling
 * Each error class maps to a specific HTTP status code
 */

/**
 * Base API error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 * Used for invalid request data
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Unauthorized error (401)
 * Used when authentication is required but not provided or invalid
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * Forbidden error (403)
 * Used when user is authenticated but doesn't have permission
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * Not found error (404)
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
  }
}

/**
 * Conflict error (409)
 * Used when request conflicts with current state
 */
export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Rate limit error (429)
 * Used when rate limit is exceeded
 */
export class RateLimitError extends ApiError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, details?: any) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
    this.retryAfter = retryAfter;
  }
}

/**
 * Internal server error (500)
 * Used for unexpected server errors
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_ERROR', details);
  }
}

/**
 * Timeout error (504)
 * Used when an operation exceeds its timeout
 */
export class TimeoutError extends ApiError {
  constructor(operation: string, timeoutMs: number, details?: any) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      504,
      'TIMEOUT',
      { operation, timeoutMs, ...details }
    );
  }
}

