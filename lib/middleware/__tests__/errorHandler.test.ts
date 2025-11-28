/**
 * [Unit] Error Handler Middleware Tests
 * 
 * Tests for centralized API error handling
 */

import { NextResponse } from 'next/server';
import { ApiError, handleApiError, ErrorCodes } from '../errorHandler';

describe('[Unit] Error Handler Middleware', () => {
  describe('ApiError Class', () => {
    it('should create an ApiError with all properties', () => {
      const error = new ApiError(404, 'Resource not found', ['detail1', 'detail2']);

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.errors).toEqual(['detail1', 'detail2']);
      expect(error.name).toBe('ApiError');
    });

    it('should create an ApiError without errors array', () => {
      const error = new ApiError(500, 'Internal error');

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal error');
      expect(error.errors).toBeUndefined();
    });
  });

  describe('handleApiError', () => {
    it('should handle ApiError and return appropriate response', () => {
      const error = new ApiError(403, 'Access forbidden');
      const response = handleApiError(error);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(403);
    });

    it('should handle ApiError with errors array', () => {
      const error = new ApiError(400, 'Validation failed', ['Field1 is required', 'Field2 is invalid']);
      const response = handleApiError(error);

      expect(response.status).toBe(400);
    });

    it('should handle standard Error and return 500', () => {
      const error = new Error('Something went wrong');
      const response = handleApiError(error);

      expect(response.status).toBe(500);
    });

    it('should handle unknown error types', () => {
      const error = 'string error';
      const response = handleApiError(error);

      expect(response.status).toBe(500);
    });

    it('should return NextResponse with JSON body', async () => {
      const error = new ApiError(404, 'Not found');
      const response = handleApiError(error);
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: 'Not found',
      });
    });

    it('should include errors array in response when present', async () => {
      const error = new ApiError(400, 'Bad request', ['error1', 'error2']);
      const response = handleApiError(error);
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: 'Bad request',
        errors: ['error1', 'error2'],
      });
    });
  });

  describe('ErrorCodes', () => {
    it('should have UNAUTHORIZED error code', () => {
      expect(ErrorCodes.UNAUTHORIZED).toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('should have FORBIDDEN error code', () => {
      expect(ErrorCodes.FORBIDDEN).toEqual({
        code: 403,
        message: 'Forbidden',
      });
    });

    it('should have NOT_FOUND error code', () => {
      expect(ErrorCodes.NOT_FOUND).toEqual({
        code: 404,
        message: 'Resource not found',
      });
    });

    it('should have VALIDATION_ERROR code', () => {
      expect(ErrorCodes.VALIDATION_ERROR).toEqual({
        code: 400,
        message: 'Validation error',
      });
    });

    it('should have INTERNAL_ERROR code', () => {
      expect(ErrorCodes.INTERNAL_ERROR).toEqual({
        code: 500,
        message: 'Internal server error',
      });
    });
  });
});

