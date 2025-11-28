/**
 * [Unit] Validation Middleware Tests
 * 
 * Tests for Zod-based request validation
 */

import { z } from 'zod';
import { validateRequest, createApplicationSchema, updateSupervisorSchema, updateApplicationStatusSchema } from '../validation';

// Helper function to create a mock NextRequest with body
function createMockRequestWithBody(body: any) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as any;
}

describe('[Unit] Validation Middleware', () => {
  describe('validateRequest', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().min(0).max(150),
    });

    it('should return valid=true with correct data', async () => {
      const request = createMockRequestWithBody({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });

      const result = await validateRequest(request, testSchema);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });
      expect(result.error).toBeUndefined();
    });

    it('should return valid=false with missing required fields', async () => {
      const request = createMockRequestWithBody({
        name: 'John Doe',
        // email missing
        age: 25,
      });

      const result = await validateRequest(request, testSchema);

      expect(result.valid).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('email');
    });

    it('should return valid=false with invalid email format', async () => {
      const request = createMockRequestWithBody({
        name: 'John Doe',
        email: 'invalid-email',
        age: 25,
      });

      const result = await validateRequest(request, testSchema);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('email');
    });

    it('should return valid=false with out-of-range values', async () => {
      const request = createMockRequestWithBody({
        name: 'John Doe',
        email: 'john@example.com',
        age: 200, // exceeds max
      });

      const result = await validateRequest(request, testSchema);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('age');
    });

    it('should return formatted error messages for multiple validation errors', async () => {
      const request = createMockRequestWithBody({
        name: '',
        email: 'invalid-email',
        age: -5,
      });

      const result = await validateRequest(request, testSchema);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      // Should contain multiple field errors
      expect(result.error).toContain('name');
      expect(result.error).toContain('email');
    });

    it('should handle empty request body', async () => {
      const request = createMockRequestWithBody({});

      const result = await validateRequest(request, testSchema);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Validation Schemas', () => {
    describe('createApplicationSchema', () => {
      it('should validate valid application data', () => {
        const validData = {
          supervisorId: 'supervisor-123',
          projectTitle: 'Machine Learning Research',
          projectDescription: 'A comprehensive study of ML algorithms',
          hasPartner: false,
        };

        const result = createApplicationSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should validate application with partner', () => {
        const validData = {
          supervisorId: 'supervisor-123',
          projectTitle: 'Machine Learning Research',
          projectDescription: 'A comprehensive study of ML algorithms',
          hasPartner: true,
          partnerName: 'Jane Doe',
          partnerEmail: 'jane@example.com',
        };

        const result = createApplicationSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should reject application with short title', () => {
        const invalidData = {
          supervisorId: 'supervisor-123',
          projectTitle: 'ML',
          projectDescription: 'A comprehensive study of ML algorithms',
          hasPartner: false,
        };

        const result = createApplicationSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject application with short description', () => {
        const invalidData = {
          supervisorId: 'supervisor-123',
          projectTitle: 'Machine Learning Research',
          projectDescription: 'Too short',
          hasPartner: false,
        };

        const result = createApplicationSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe('updateSupervisorSchema', () => {
      it('should validate all optional fields', () => {
        const validData = {
          bio: 'Experienced researcher in AI and ML',
          researchInterests: ['Machine Learning', 'AI'],
          expertiseAreas: ['Deep Learning', 'NLP'],
          maxCapacity: 5,
          availabilityStatus: 'available' as const,
        };

        const result = updateSupervisorSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should validate partial updates', () => {
        const validData = {
          bio: 'Updated bio',
        };

        const result = updateSupervisorSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should reject invalid availability status', () => {
        const invalidData = {
          availabilityStatus: 'maybe',
        };

        const result = updateSupervisorSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject invalid maxCapacity', () => {
        const invalidData = {
          maxCapacity: 25, // exceeds max of 20
        };

        const result = updateSupervisorSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe('updateApplicationStatusSchema', () => {
      it('should validate status update with feedback', () => {
        const validData = {
          status: 'approved' as const,
          feedback: 'Great project proposal!',
        };

        const result = updateApplicationStatusSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should validate status update without feedback', () => {
        const validData = {
          status: 'pending' as const,
        };

        const result = updateApplicationStatusSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should reject invalid status', () => {
        const invalidData = {
          status: 'maybe',
        };

        const result = updateApplicationStatusSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should accept all valid status values', () => {
        const statuses = ['pending', 'under_review', 'approved', 'rejected', 'revision_requested'];

        statuses.forEach(status => {
          const result = updateApplicationStatusSchema.safeParse({ status });
          expect(result.success).toBe(true);
        });
      });
    });
  });
});
