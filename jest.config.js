const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Only look for tests in specific directories
  roots: ['<rootDir>/lib', '<rootDir>/app'],
  // Exclude E2E tests from Jest (they should run with Playwright)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/',
    'test-helpers',
    '/AppData/',
    '/.vscode/',
    '/Users/',
    'cursor',
  ],
  // Exclude helper files that don't contain tests
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(firebase-admin|jose|jwks-rsa)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  coverageProvider: 'v8',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

