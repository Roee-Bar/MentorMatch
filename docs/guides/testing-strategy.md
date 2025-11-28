# Testing Strategy

A comprehensive guide to testing approach and technology stack for the MentorMatch platform.

## Quick Start: Running Tests

### Run All Tests (Jest + Playwright)

```bash
# Run all unit/integration tests (Jest)
npx jest --testMatch="**/app/**/__tests__/**/*.[jt]s?(x)" --testMatch="**/lib/**/__tests__/**/*.[jt]s?(x)"

# Run all E2E tests (Playwright)
npx playwright test

# Or run them sequentially
npx jest --testMatch="**/app/**/__tests__/**/*.[jt]s?(x)" --testMatch="**/lib/**/__tests__/**/*.[jt]s?(x)" && npx playwright test
```

### Run Specific Test Categories

```bash
# Jest tests only (unit + component + integration)
npx jest --testMatch="**/app/**/__tests__/**/*.[jt]s?(x)" --testMatch="**/lib/**/__tests__/**/*.[jt]s?(x)"

# E2E tests only
npx playwright test

# Run specific test file
npx jest app/components/__tests__/Header.test.tsx

# Run tests in watch mode
npx jest --watch --testMatch="**/app/**/__tests__/**/*.[jt]s?(x)" --testMatch="**/lib/**/__tests__/**/*.[jt]s?(x)"

# Run with coverage
npx jest --coverage --testMatch="**/app/**/__tests__/**/*.[jt]s?(x)" --testMatch="**/lib/**/__tests__/**/*.[jt]s?(x)"
```

### Test Execution Notes

**Important:** When running Jest tests, always use the `--testMatch` flag to restrict tests to your project directory. Without it, Jest may pick up test files from external dependencies (like Cursor's internal extensions), causing errors.

**Recommended aliases:** For convenience, you can add these scripts to your workflow or create shell aliases for the test commands above.

## Overview

This document outlines the testing strategy for MentorMatch, a Next.js 14 application built with TypeScript. The strategy follows industry best practices to ensure code quality, reliability, and maintainability.

## Testing Approach

We follow the **Testing Pyramid** strategy, which emphasizes a balanced distribution of tests across different levels:

### 1. Unit Tests
- **Purpose**: Test individual functions, utilities, and logic in isolation
- **Scope**: Pure functions, validators, formatters, business logic
- **Characteristics**: Fast execution, easy to maintain

### 2. Component Tests
- **Purpose**: Test React components in isolation
- **Scope**: Component rendering, props handling, conditional logic, user interactions
- **Characteristics**: Test components as users interact with them, focus on behavior over implementation

### 3. Integration Tests
- **Purpose**: Test interactions between multiple components or modules
- **Scope**: Component composition, API route handlers, state management flows
- **Characteristics**: Verify that different parts of the system work together correctly

### 4. End-to-End (E2E) Tests
- **Purpose**: Test complete user workflows from start to finish
- **Scope**: Full application flows (student registration, supervisor matching, admin dashboard)
- **Characteristics**: Simulate real user behavior, catch integration issues, slower execution

## Recommended Technologies

### Unit & Component Testing

**Jest** - JavaScript testing framework
- Fast, reliable test runner
- Built-in assertion library
- Snapshot testing support
- Code coverage reporting

**React Testing Library** - Component testing utilities
- Encourages testing from user perspective
- Simple, intuitive API
- Works seamlessly with Jest
- Follows accessibility best practices

**Key Packages:**
- `jest` - Test runner and assertion library
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers for DOM assertions
- `@testing-library/user-event` - Simulate user interactions
- `jest-environment-jsdom` - DOM environment for Jest

### E2E Testing

**Playwright** (Recommended)
- Fast and reliable browser automation
- Excellent Next.js integration
- Cross-browser testing support
- Built-in waiting and retry mechanisms
- Great debugging tools

**Alternative: Cypress**
- Popular alternative with strong community support
- Good developer experience
- Real-time test execution viewer

## Project Structure

Recommended test file organization:

```
Final/
├── __tests__/              # Unit tests for utilities and helpers
│   ├── utils/
│   └── lib/
├── components/
│   └── __tests__/          # Component tests
│       └── UserProfile.test.tsx
├── app/
│   └── __tests__/          # Page and route tests
│       ├── page.test.tsx
│       └── profile/
│           └── page.test.tsx
├── e2e/                    # End-to-end tests
│   ├── student-flow.spec.ts
│   ├── supervisor-flow.spec.ts
│   └── admin-flow.spec.ts
├── jest.config.js          # Jest configuration
├── jest.setup.js           # Jest setup file
└── playwright.config.ts    # Playwright configuration
```

### File Naming Conventions

- Unit tests: `*.test.ts` or `*.test.tsx`
- Component tests: `ComponentName.test.tsx`
- E2E tests: `*.spec.ts` (Playwright convention)
- Test utilities: `__tests__/` folders or `*.test.ts` files

### Test Description Comments

**Every test must have a 1-line description comment** directly above the `it()` or `test()` block explaining what the test verifies. This improves test readability and serves as documentation.

**Format:**
```typescript
// Tests [what behavior/feature is being tested]
it('should [expected behavior]', () => {
  // test code
});
```

```

**Guidelines:**
- Keep descriptions concise (one line)
- Focus on the behavior being tested, not implementation details
- Use active voice ("Tests..." or "Verifies...")
- Include relevant context (e.g., "for authenticated users", "when data is empty")

## What to Test

### Unit Tests

Focus on testing pure functions and business logic:

- Utility functions (formatters, validators, helpers)
- Matching algorithms and logic
- Data transformation functions
- Validation rules
- Type guards and type checking utilities

**Example areas:**
- User role validation
- Email format validation
- Student ID generation
- Data normalization functions

### Component Tests

Test React components in isolation:

- Component rendering with different props
- Conditional rendering logic
- User interactions (clicks, form submissions)
- Props validation and default values
- Accessibility features

### Integration Tests

Test how components and modules work together:

- Component composition (parent-child interactions)
- API route handlers (if using Next.js API routes)
- State management flows
- Form submission to API
- Navigation between pages

### E2E Tests

Test complete user workflows:

**Student Flow:**
- Registration/login process
- Browsing available supervisors
- Submitting project application
- Tracking application status

**Supervisor Flow:**
- Login and dashboard access
- Reviewing student applications
- Managing supervision capacity
- Responding to applications

**Admin Flow:**
- Accessing admin dashboard
- Viewing all projects and assignments
- Manual assignment of students
- Generating reports

## Configuration Overview

### Jest Configuration

Jest should be configured to work with Next.js 14 App Router and TypeScript:

**Key configuration points:**
- Use `next/jest` for automatic Next.js configuration
- Set up `jsdom` environment for DOM testing
- Configure module path aliases (`@/*` mapping)
- Set up test environment files
- Configure coverage collection

**Required npm scripts:**

> **Note:** The scripts listed below are documented as recommended commands. Some may need to be added to `package.json` if they don't exist. The core testing functionality works via direct `npx` commands shown in the "Quick Start" section above.

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Firebase Service Mocking Strategy

Since the application uses Firebase services for data operations, tests mock these services to avoid actual database calls:

**Mocking Pattern:**
- Mock Firebase services (`@/lib/services`) at the module level
- Mock Firebase Auth (`@/lib/auth`) for authentication state
- Use mock data fixtures (`@/mock-data`) for test data
- Transform mock data to match service return types

**Key Principles:**
- Mock services, not Firebase SDK directly
- Use real mock data structures for realistic tests
- Transform mock data to match service return types
- Reset mocks in `beforeEach` to ensure test isolation

### Playwright Configuration

Playwright is configured for Next.js development server with the following setup:

**Configuration (`playwright.config.ts`):**
- Test directory: `./e2e`
- Base URL: `http://localhost:3000`
- Automatic server startup via `webServer` config
- Browser: Chromium (configurable for Firefox, WebKit)
- Retry on CI: 2 retries
- Trace, screenshot, and video capture on failure

**Available npm scripts:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

**E2E Test Structure:**
```
e2e/
├── fixtures/
│   ├── auth.ts          # Pre-authenticated page fixtures
│   └── test-data.ts     # Test credentials and helper functions
├── homepage.spec.ts     # Homepage and navigation tests
├── student-flow.spec.ts # Student registration and dashboard tests
├── supervisor-flow.spec.ts # Supervisor dashboard and applications tests
└── admin-flow.spec.ts   # Admin dashboard and seed data tests
```

**Authentication Fixtures:**
The `e2e/fixtures/auth.ts` file provides reusable authentication fixtures:
- `studentPage` - Pre-authenticated student context
- `supervisorPage` - Pre-authenticated supervisor context
- `adminPage` - Pre-authenticated admin context

These fixtures can be imported and used in tests to skip repetitive login steps:
```typescript
import { test, expect } from './fixtures/auth';

test('should view supervisors', async ({ studentPage }) => {
  // studentPage is already authenticated as a student
  await expect(studentPage.getByText(/supervisor/i)).toBeVisible();
});
```

**Test Data:**
Test credentials are centralized in `e2e/fixtures/test-data.ts` for consistency across all E2E tests.

## Selective Test Execution

The project implements a comprehensive test organization strategy that enables running tests selectively by category, module, or feature. This improves development workflow by allowing focused test execution.

### Test Tagging Strategy

All tests use standardized describe block tags to categorize them:

**Tag Format:** `[Type][Module] Description`

**Available Tags:**
- **Type Tags:**
  - `[Unit]` - Unit tests for pure functions and business logic
  - `[Component]` - Component tests in isolation
  - `[Integration]` - Integration tests for pages and flows

- **Module Tags (optional):**
  - `[Firebase]` - Firebase-related functionality
  - `[Dashboard]` - Dashboard-related features

**Examples:**
```typescript
// Unit test with Firebase module tag
describe('[Unit][Firebase] Auth Module', () => {
  // tests...
});

// Component test with Dashboard module tag
describe('[Component][Dashboard] SupervisorCard', () => {
  // tests...
});

// Integration test without module tag
describe('[Integration] Login Page', () => {
  // tests...
});
```

### Available Test Scripts

> **Note:** Some scripts listed below may need to be added to `package.json`. For immediate testing, use the `npx` commands shown in the "Quick Start" section above.

The following npm scripts can be configured for selective test execution:

#### By Test Type
```bash
# Run all unit tests
npm run test:unit

# Run all component tests
npm run test:component

# Run all integration tests
npm run test:integration
```

#### By Module/Feature
```bash
# Run all Firebase-related tests (unit tests)
npm run test:firebase

# Run specific auth tests
npm run test:auth

# Run all service tests
npm run test:services

# Run all dashboard tests (components and integration)
npm run test:dashboard
```

#### E2E Tests by User Flow
```bash
# Run all E2E tests
npm run test:e2e
# Or use: npx playwright test

# Run student workflow tests only
npm run test:e2e:student

# Run supervisor workflow tests only
npm run test:e2e:supervisor

# Run admin workflow tests only
npm run test:e2e:admin

# Run E2E tests with UI mode
npm run test:e2e:ui
# Or use: npx playwright test --ui
```

#### Watch Mode
All Jest test scripts support watch mode by appending `-- --watch`:
```bash
# Watch mode for Firebase tests
npm run test:firebase -- --watch

# Watch mode for component tests
npm run test:component -- --watch

# Watch mode for all tests
npm run test:watch
```

### Advanced Filtering

You can combine Jest flags for more specific test selection:

**Pattern Matching:**
```bash
# Run tests matching a specific pattern
npm test -- --testNamePattern="supervisor"

# Run tests in specific files
npm test -- app/components/__tests__/Header.test.tsx

# Run tests matching multiple patterns
npm test -- --testNamePattern="Firebase|Dashboard"
```

**File Path Patterns:**
```bash
# Run all tests in a directory
npm test -- app/dashboard/

# Run tests matching glob pattern
npm test -- --testPathPattern="dashboard.*page"
```

**Combining Filters:**
```bash
# Run only Firebase unit tests in watch mode
npm run test:firebase -- --watch

# Run dashboard integration tests only
npm test -- --testNamePattern="\\[Integration\\].*Dashboard"

# Run component tests excluding dashboard
npm run test:component -- --testPathIgnorePatterns="dashboard"
```

### Usage Examples

**Scenario: Working on Firebase authentication**
```bash
npm run test:firebase        # Run all Firebase tests
npm run test:auth -- --watch # Watch auth tests during development
```

**Scenario: Developing a new dashboard component**
```bash
npm run test:dashboard -- --watch    # Watch all dashboard tests
npm run test:component -- --watch    # Or watch just component tests
```

**Scenario: Fixing integration issues**
```bash
npm run test:integration             # Run all integration tests
npm test -- app/login/__tests__/     # Run specific page tests
```

**Scenario: Pre-commit verification**
```bash
npm run test:unit                    # Fast unit test check
npm run test:component               # Component test check
npm run test:integration             # Integration test check
npm run test:coverage                # Full coverage report
```

### Test Organization Summary

**Current Test Distribution:**
- **Unit Tests:** 2 files (Firebase Auth and Services)
- **Component Tests:** 8 files (UI components)
- **Integration Tests:** 9 files (Pages and workflows)
- **E2E Tests:** 4 spec files (User flows)

**Total:** 23 test files across all categories

## CI/CD and Test Execution Workflow

### Test Execution Strategy

The project uses a two-tier testing approach:
- **Local commits**: Unit tests only (via pre-commit hook)
- **GitHub CI/CD**: Full test suite including E2E tests

### Local Development (Pre-commit Hook)

The `.husky/pre-commit` hook runs automatically on every commit:
1. Validates `package-lock.json` is in sync with `package.json`
2. Runs unit tests (`npm test`)
3. E2E tests are NOT executed

Execution time: 5-15 seconds

### CI/CD Pipeline (GitHub Actions)

The `.github/workflows/test.yml` workflow runs on push/pull requests with three jobs:

**Job 1: Unit & Component Tests**
- Runs linter
- Executes unit tests with coverage
- Uploads coverage reports

**Job 2: E2E Tests (Playwright)**
- Runs after unit tests pass
- Tests student, supervisor, and admin flows
- Uploads Playwright reports and test results
- Requires Firebase secrets configuration

**Job 3: Build Check**
- Runs after all tests pass
- Simulates Vercel build process
- Validates production build

Total pipeline time: 5-10 minutes

### Why E2E Tests Only in CI/CD

| Benefit | Explanation |
|---------|-------------|
| **Speed** | E2E tests take 30-60 seconds each; local commits remain fast |
| **Resources** | E2E tests require Next.js server, browser automation, and Firebase |
| **Reliability** | CI environment is consistent and isolated |
| **Developer Experience** | Fast commits encourage frequent, small changes |
| **Coverage** | Unit tests catch most issues; E2E tests provide final validation |

### Test Commands

**Local development:**
```bash
# Unit tests (runs on commit)
npx jest --testMatch="**/app/**/__tests__/**/*.[jt]s?(x)" --testMatch="**/lib/**/__tests__/**/*.[jt]s?(x)"

# Watch mode
npx jest --watch --testMatch="**/app/**/__tests__/**/*.[jt]s?(x)" --testMatch="**/lib/**/__tests__/**/*.[jt]s?(x)"

# With coverage report
npx jest --coverage --testMatch="**/app/**/__tests__/**/*.[jt]s?(x)" --testMatch="**/lib/**/__tests__/**/*.[jt]s?(x)"
```

**Manual E2E testing:**
```bash
# All E2E tests
npx playwright test

# Interactive UI mode
npx playwright test --ui

# Specific flow (if npm scripts configured)
npm run test:e2e:student

# Run all tests (Jest + Playwright)
npx jest --testMatch="**/app/**/__tests__/**/*.[jt]s?(x)" --testMatch="**/lib/**/__tests__/**/*.[jt]s?(x)" && npx playwright test
```

**Bypass pre-commit hook:**
```bash
git commit --no-verify -m "message"
```

### Configuration

- **`.husky/pre-commit`**: Runs unit tests on every commit
- **`.github/workflows/test.yml`**: Complete CI/CD pipeline with three jobs
- **`playwright.config.ts`**: Detects CI via `process.env.CI` (1 worker, 2 retries on CI; 4 workers, 1 retry locally)

### Viewing Results

GitHub Actions results are available in the **Actions** tab. Artifacts (coverage, Playwright reports, test results, build output) are retained for 7-30 days.

### Multi-Browser Testing

To test on multiple browsers, edit `.github/workflows/test.yml`:

```yaml
e2e:
  strategy:
    matrix:
      browser: [chromium, firefox, webkit]
  steps:
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps ${{ matrix.browser }}
```

## Implementation Roadmap

### Phase 1: Foundation (Priority: High) - COMPLETED
1. [x] Install Jest and React Testing Library dependencies
2. [x] Configure Jest with Next.js setup
3. [x] Create `jest.config.js` and `jest.setup.js`
4. [x] Add test scripts to `package.json`
5. [x] Write first component test for `UserProfile`

### Phase 2: Component Coverage (Priority: High) - COMPLETED
1. [x] Add tests for all existing components
2. [x] Test page components (`app/page.tsx`, `app/profile/page.tsx`)
3. [x] Test conditional rendering and role-based logic

### Phase 3: Unit Tests (Priority: Medium) - COMPLETED
1. [x] Create utility functions if needed
2. [x] Write unit tests for business logic
3. [x] Test validation functions
4. [x] Test data transformation utilities

### Phase 4: E2E Setup (Priority: Medium) - COMPLETED
1. [x] Install Playwright
2. [x] Configure Playwright for Next.js
3. [x] Write basic E2E test for homepage
4. [x] Test navigation flows

### Phase 5: Complete E2E Coverage (Priority: Low) - COMPLETED
1. [x] Write E2E tests for student workflows
2. [x] Write E2E tests for supervisor workflows
3. [x] Write E2E tests for admin workflows
4. [x] Set up CI/CD integration for automated testing

### Phase 6: Integration & CI/CD (Priority: Medium) - COMPLETED
1. [x] Integrate tests into development workflow
2. [x] Set up pre-commit hooks with Husky
3. [x] Configure GitHub Actions for test execution
4. [x] Set up test coverage reporting

## Best Practices

1. **Write tests that focus on user behavior** - Test what users see and do, not implementation details
2. **Keep tests simple and readable** - Each test should verify one specific behavior
3. **Use descriptive test names** - Test names should clearly describe what is being tested
4. **Maintain test independence** - Tests should not depend on each other
5. **Test edge cases** - Don't just test the happy path
6. **Keep E2E tests minimal** - Focus on critical user flows, not every possible scenario
7. **Run tests frequently** - Run tests during development, not just before commits

## Common Testing Issues and Solutions

### Issue: Jest picks up external test files

**Problem:** When running `npx jest` without parameters, it may pick up test files from Cursor's internal extensions or other external dependencies, causing syntax errors.

**Solution:** Always use the `--testMatch` flag to restrict tests to your project:
```bash
npx jest --testMatch="**/app/**/__tests__/**/*.[jt]s?(x)" --testMatch="**/lib/**/__tests__/**/*.[jt]s?(x)"
```

### Issue: Component tests fail with "useRouter is not a function"

**Problem:** Next.js components use hooks from `next/navigation` (like `useRouter`, `usePathname`) which need to be mocked in tests.

**Solution:** Mock `next/navigation` at the top of your test file:
```typescript
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));
```

### Issue: Test assertions inside waitFor callbacks fail

**Problem:** Using `waitFor` for both waiting and performing actions can cause timeouts.

**Solution:** Separate waiting from actions:
```typescript
// BAD: Actions inside waitFor
await waitFor(() => {
  const button = screen.getByText(/click me/i);
  fireEvent.click(button);
  expect(someMock).toHaveBeenCalled();
});

// GOOD: Wait first, then perform actions
await waitFor(() => {
  expect(screen.getByText(/click me/i)).toBeInTheDocument();
});

const button = screen.getByText(/click me/i);
fireEvent.click(button);
expect(someMock).toHaveBeenCalled();
```

## Test Maintenance and Refactoring

### What NOT to Test

To maintain a lean and valuable test suite, avoid testing:

1. **Static Text Content**
   - Hardcoded strings (e.g., "MentorMatch", page titles, static labels)
   - Marketing copy or descriptive text
   - *Rationale*: These tests break when copy changes, providing no value

2. **Static href Attributes**
   - Link destinations that never change (e.g., `href="/login"`)
   - Navigation links to static routes
   - *Rationale*: These are configuration, not behavior

3. **Static CSS Classes**
   - Presence of utility classes without conditional logic
   - Styling that doesn't depend on state
   - *Rationale*: Style changes shouldn't break tests

4. **Implementation Details**
   - Internal component state variable names
   - Function names or class names
   - DOM structure details
   - *Rationale*: Tests should survive refactoring

### What TO Test

Focus testing efforts on:

1. **User Interactions**
   - Button clicks, form submissions, dropdown interactions
   - User input validation and feedback

2. **Conditional Logic**
   - Role-based UI rendering (student vs supervisor vs admin)
   - Dynamic styling based on data (status badges, availability indicators)
   - Optional field rendering based on props/state

3. **State Management**
   - Authentication state changes
   - Loading states and async operations
   - Error handling and recovery

4. **Business Logic**
   - Form validation rules
   - Data transformation and formatting
   - Calculations and algorithms

5. **Integration Points**
   - API calls and data fetching
   - Navigation and routing logic
   - Component composition and data flow


**Key Learnings:**
- Tests that assert static content provide false confidence
- Focus on testing behavior, not configuration
- Use regex patterns for dynamic content instead of exact string matches
- Prefer testing outcomes over implementation details

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)

