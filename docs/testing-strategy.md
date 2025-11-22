# Testing Strategy

A comprehensive guide to testing approach and technology stack for the MentorMatch platform.

## Overview

This document outlines the testing strategy for MentorMatch, a Next.js 14 application built with TypeScript. The strategy follows industry best practices to ensure code quality, reliability, and maintainability.

## Testing Approach

We follow the **Testing Pyramid** strategy, which emphasizes a balanced distribution of tests across different levels:

### 1. Unit Tests
- **Purpose**: Test individual functions, utilities, and logic in isolation
- **Scope**: Pure functions, validators, formatters, business logic
- **Characteristics**: Fast execution, high coverage, easy to maintain

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

**Components to prioritize:**
- `UserProfile` - Test role-based rendering, conditional fields
- Navigation components - Test routing and active states
- Form components - Test validation and submission
- Card components - Test data display and interactions

### Integration Tests

Test how components and modules work together:

- Component composition (parent-child interactions)
- API route handlers (if using Next.js API routes)
- State management flows
- Form submission to API
- Navigation between pages

**Example scenarios:**
- User profile page loading and displaying data
- Form submission flow with validation
- Multi-step processes (application submission)

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
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Playwright Configuration

Playwright should be configured for Next.js development server:

**Key configuration points:**
- Base URL pointing to local development server
- Automatic server startup before tests
- Browser selection (Chromium, Firefox, WebKit)
- Test timeout and retry settings
- Screenshot and video capture on failure

**Required npm scripts:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Example Test Structure

### Component Test Example

Here's an example test for the `UserProfile` component:

```typescript
// components/__tests__/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import UserProfile from '../UserProfile';
import { User } from '@/types/user';

describe('UserProfile', () => {
  const mockStudent: User = {
    id: '1',
    name: 'Test Student',
    email: 'test@example.com',
    role: 'student',
    profileImage: '/test-image.jpg',
    studentId: 'STU-001',
    degree: 'B.Sc. Software Engineering',
  };

  it('renders student information correctly', () => {
    render(<UserProfile user={mockStudent} />);
    expect(screen.getByText('Test Student')).toBeInTheDocument();
    expect(screen.getByText('STU-001')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('displays correct role badge for student', () => {
    render(<UserProfile user={mockStudent} />);
    const badge = screen.getByText('Student');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('conditionally renders student-specific fields', () => {
    render(<UserProfile user={mockStudent} />);
    expect(screen.getByText('STU-001')).toBeInTheDocument();
    expect(screen.getByText('B.Sc. Software Engineering')).toBeInTheDocument();
  });
});
```

### E2E Test Example

Example Playwright test for student flow:

```typescript
// e2e/student-flow.spec.ts
import { test, expect } from '@playwright/test';

test('student can view profile page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=My Profile');
  await expect(page).toHaveURL('/profile');
  await expect(page.locator('h2')).toContainText('Personal Profile');
});
```

## Implementation Roadmap

### Phase 1: Foundation (Priority: High)
1. Install Jest and React Testing Library dependencies
2. Configure Jest with Next.js setup
3. Create `jest.config.js` and `jest.setup.js`
4. Add test scripts to `package.json`
5. Write first component test for `UserProfile`

### Phase 2: Component Coverage (Priority: High)
1. Add tests for all existing components
2. Test page components (`app/page.tsx`, `app/profile/page.tsx`)
3. Test conditional rendering and role-based logic
4. Achieve 70%+ component test coverage

### Phase 3: Unit Tests (Priority: Medium)
1. Create utility functions if needed
2. Write unit tests for business logic
3. Test validation functions
4. Test data transformation utilities

### Phase 4: E2E Setup (Priority: Medium)
1. Install Playwright
2. Configure Playwright for Next.js
3. Write basic E2E test for homepage
4. Test navigation flows

### Phase 5: Complete E2E Coverage (Priority: Low)
1. Write E2E tests for student workflows
2. Write E2E tests for supervisor workflows
3. Write E2E tests for admin workflows
4. Set up CI/CD integration for automated testing

### Phase 6: Integration & CI/CD (Priority: Medium)
1. Integrate tests into development workflow
2. Set up pre-commit hooks (optional)
3. Configure Vercel/GitHub Actions for test execution
4. Set up test coverage reporting

## Best Practices

1. **Write tests that focus on user behavior** - Test what users see and do, not implementation details
2. **Keep tests simple and readable** - Each test should verify one specific behavior
3. **Use descriptive test names** - Test names should clearly describe what is being tested
4. **Maintain test independence** - Tests should not depend on each other
5. **Test edge cases** - Don't just test the happy path
6. **Keep E2E tests minimal** - Focus on critical user flows, not every possible scenario
7. **Run tests frequently** - Run tests during development, not just before commits
8. **Maintain test coverage** - Aim for 70-80% coverage, focusing on critical paths

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

