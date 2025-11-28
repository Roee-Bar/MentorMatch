/**
 * [Unit] Firebase Admin SDK Tests
 * 
 * Tests Firebase Admin SDK initialization and configuration
 */

// Mock firebase-admin module
jest.mock('firebase-admin', () => {
  const mockAuth = { verifyIdToken: jest.fn() };
  const mockDb = { collection: jest.fn() };
  const mockStorage = { bucket: jest.fn() };
  
  return {
    apps: [],
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn((config) => {
        if (!config.projectId || !config.clientEmail || !config.privateKey) {
          throw new Error('Missing credentials');
        }
        return { projectId: config.projectId };
      }),
    },
    auth: jest.fn(() => mockAuth),
    firestore: jest.fn(() => mockDb),
    storage: jest.fn(() => mockStorage),
  };
});

describe('[Unit] Firebase Admin SDK', () => {
  // Clear module cache before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Reset environment variables
    delete process.env.FIREBASE_ADMIN_PROJECT_ID;
    delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  });

  describe('Initialization', () => {
    it('should initialize Firebase Admin SDK with valid credentials', () => {
      // Set up valid environment variables
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project';
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\n-----END PRIVATE KEY-----';

      // Import module
      const { adminAuth, adminDb, adminStorage } = require('../firebase-admin');

      expect(adminAuth).toBeDefined();
      expect(adminDb).toBeDefined();
      expect(adminStorage).toBeDefined();
    });

    it('should handle missing environment variables gracefully', () => {
      // Clear environment variables for this test
      const origProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
      const origClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const origPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      
      delete process.env.FIREBASE_ADMIN_PROJECT_ID;
      delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;

      // Should not throw when importing
      expect(() => {
        require('../firebase-admin');
      }).not.toThrow();
      
      // Restore env vars
      if (origProjectId) process.env.FIREBASE_ADMIN_PROJECT_ID = origProjectId;
      if (origClientEmail) process.env.FIREBASE_ADMIN_CLIENT_EMAIL = origClientEmail;
      if (origPrivateKey) process.env.FIREBASE_ADMIN_PRIVATE_KEY = origPrivateKey;
    });

    it('should replace escaped newlines in private key', () => {
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project';
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\\n-----END PRIVATE KEY-----';

      const admin = require('firebase-admin');
      require('../firebase-admin');

      // Verify that credential.cert was called with properly formatted key
      expect(admin.credential.cert).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project',
          clientEmail: 'test@test-project.iam.gserviceaccount.com',
          privateKey: expect.stringContaining('\n'), // Should contain actual newlines, not escaped
        })
      );
    });
  });

  describe('Export Validation', () => {
    it('should export adminAuth, adminDb, and adminStorage', () => {
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project';
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';

      const firebaseAdmin = require('../firebase-admin');

      expect(firebaseAdmin).toHaveProperty('adminAuth');
      expect(firebaseAdmin).toHaveProperty('adminDb');
      expect(firebaseAdmin).toHaveProperty('adminStorage');
      expect(firebaseAdmin.default).toBeDefined();
    });
  });
});
