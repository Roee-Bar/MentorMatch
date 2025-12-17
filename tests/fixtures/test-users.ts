/**
 * Test user account credentials
 * Based on docs/testing/TEST_DATA.md
 */

export const TEST_USERS = {
  admin: {
    email: 'admin@braude.ac.il',
    password: 'admin123',
    role: 'admin' as const,
  },
  supervisor: {
    email: 'naomi.unkelos@braude.ac.il',
    password: 'Test123!',
    role: 'supervisor' as const,
  },
  student: {
    email: 'sarah.cohen@e.braude.ac.il',
    password: 'Test123!',
    role: 'student' as const,
  },
  studentWithPartner: {
    email: 'eldar.gafarov@e.braude.ac.il',
    password: 'Test123!',
    role: 'student' as const,
  },
  studentNoPartner: {
    email: 'roee.bar@e.braude.ac.il',
    password: 'Test123!',
    role: 'student' as const,
  },
} as const;

export type TestUser = typeof TEST_USERS[keyof typeof TEST_USERS];

