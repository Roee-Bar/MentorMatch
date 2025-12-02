/**
 * Test account credentials and data
 * Based on MANUAL_TESTS.md
 */

export const GLOBAL_PASSWORD = 'Test123!';

export const TEST_STUDENTS = {
  sarahCohen: {
    name: 'Sarah Cohen',
    email: 'sarah.cohen@e.braude.ac.il',
    password: GLOBAL_PASSWORD,
    year: '4th Year',
    hasPartner: false,
  },
  eldarGafarov: {
    name: 'Eldar Gafarov',
    email: 'eldar.gafarov@e.braude.ac.il',
    password: GLOBAL_PASSWORD,
    year: '4th Year',
    hasPartner: true,
    partnerEmail: 'roee.bar@e.braude.ac.il',
  },
  roeeBar: {
    name: 'Roee Bar',
    email: 'roee.bar@e.braude.ac.il',
    password: GLOBAL_PASSWORD,
    year: '4th Year',
    hasPartner: true,
    partnerEmail: 'eldar.gafarov@e.braude.ac.il',
  },
  davidLevy: {
    name: 'David Levy',
    email: 'david.levy@e.braude.ac.il',
    password: GLOBAL_PASSWORD,
    year: '3rd Year',
    hasPartner: true,
    partnerEmail: 'maya.levi@e.braude.ac.il',
  },
  mayaLevi: {
    name: 'Maya Levi',
    email: 'maya.levi@e.braude.ac.il',
    password: GLOBAL_PASSWORD,
    year: '3rd Year',
    hasPartner: true,
    partnerEmail: 'david.levy@e.braude.ac.il',
  },
};

export const TEST_SUPERVISORS = {
  naomiUnkelos: {
    name: 'Dr. Naomi Unkelos-Shpigel',
    email: 'naomi.unkelos@braude.ac.il',
    password: GLOBAL_PASSWORD,
    department: 'Software Engineering',
  },
  israelIsraeli: {
    name: 'Dr. Israel Israeli',
    email: 'israel.israeli@braude.ac.il',
    password: GLOBAL_PASSWORD,
    department: 'Software Engineering',
  },
  anatDahan: {
    name: 'Dr. Anat Dahan',
    email: 'anat.dahan@braude.ac.il',
    password: GLOBAL_PASSWORD,
    department: 'Software Engineering',
  },
};

// Invalid credentials for negative testing
export const INVALID_CREDENTIALS = {
  email: 'invalid@example.com',
  password: 'wrongpassword',
};

