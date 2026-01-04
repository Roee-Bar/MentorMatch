# E2E Test Structure Guide

This directory contains all end-to-end tests for MentorMatch.

## Directory Structure

```
e2e/
├── fixtures/          # Test fixtures and reusable test setup
│   ├── auth.ts       # Authentication fixtures (student, supervisor, admin)
│   ├── test-data.ts  # Test data generators
│   └── db-helpers.ts # Database seeding and cleanup helpers
├── pages/            # Page Object Models (POM pattern)
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── StudentDashboard.ts
│   ├── SupervisorDashboard.ts
│   └── AdminDashboard.ts
├── tests/            # Test specifications
│   ├── auth/         # Authentication tests
│   │   ├── login.spec.ts
│   │   ├── register.spec.ts
│   │   ├── logout.spec.ts
│   │   └── protected-routes.spec.ts
│   ├── student/      # Student flow tests
│   │   ├── supervisors.spec.ts
│   │   ├── applications.spec.ts
│   │   └── partnerships.spec.ts
│   ├── supervisor/   # Supervisor flow tests
│   │   ├── applications.spec.ts
│   │   └── capacity.spec.ts
│   └── admin/        # Admin flow tests
│       ├── dashboard.spec.ts
│       └── management.spec.ts
└── utils/            # Test utilities
    ├── firebase-helpers.ts  # Firebase emulator utilities
    ├── test-helpers.ts      # General test helpers
    └── assertions.ts        # Custom assertions
```

## Fixtures

### Authentication Fixtures (`fixtures/auth.ts`)

Provides authenticated user fixtures:

```typescript
import { test as authTest } from '../../fixtures/auth';

test('test with authenticated student', async ({ page }) => {
  const { authenticatedStudent } = await authTest.use({ page });
  // authenticatedStudent contains: uid, email, password, student
});
```

Available fixtures:
- `authenticatedStudent` - Authenticated student user
- `authenticatedSupervisor` - Authenticated supervisor user
- `authenticatedAdmin` - Authenticated admin user

### Test Data Generators (`fixtures/test-data.ts`)

Generate realistic test data:

```typescript
import { generateRegistrationData, generateStudentData } from '../../fixtures/test-data';

const registrationData = generateRegistrationData();
const studentData = generateStudentData({ department: 'Computer Science' });
```

### Database Helpers (`fixtures/db-helpers.ts`)

Seed and clean up test data:

```typescript
import { seedStudent, seedSupervisor, cleanupUser } from '../../fixtures/db-helpers';

const { uid, student } = await seedStudent();
// ... use in test
await cleanupUser(uid);
```

## Page Objects

Page Object Models encapsulate page interactions:

```typescript
import { LoginPage } from '../../pages/LoginPage';

const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login('email@example.com', 'password');
```

Benefits:
- Reusable page interactions
- Easier maintenance when UI changes
- Clear test intent

## Test Utilities

### Firebase Helpers (`utils/firebase-helpers.ts`)

```typescript
import { resetEmulatorState, clearFirestoreData } from '../../utils/firebase-helpers';

await resetEmulatorState(); // Clear all emulator data
```

### Test Helpers (`utils/test-helpers.ts`)

```typescript
import { waitForPageLoad, fillFieldWithRetry } from '../../utils/test-helpers';

await waitForPageLoad(page);
await fillFieldWithRetry(page, '#email', 'test@example.com');
```

### Assertions (`utils/assertions.ts`)

```typescript
import { expectErrorMessage, expectAuthenticatedDashboard } from '../../utils/assertions';

await expectErrorMessage(page, 'Invalid credentials');
await expectAuthenticatedDashboard(page, 'student');
```

## Writing New Tests

### 1. Create Test File

Create a new `.spec.ts` file in the appropriate directory:

```typescript
// e2e/tests/feature/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### 2. Use Appropriate Fixtures

For authenticated tests, use auth fixtures:

```typescript
import { test as authTest } from '../../fixtures/auth';

test('authenticated test', async ({ page }) => {
  const { authenticatedStudent } = await authTest.use({ page });
  // Test with authenticated user
});
```

### 3. Use Page Objects

Interact with pages using Page Objects:

```typescript
import { StudentDashboard } from '../../pages/StudentDashboard';

const dashboard = new StudentDashboard(page);
await dashboard.goto();
await dashboard.navigateToSupervisors();
```

### 4. Use Test Data Generators

Generate test data:

```typescript
import { generateStudentData } from '../../fixtures/test-data';

const studentData = generateStudentData({
  department: 'Computer Science',
  firstName: 'John',
});
```

## Test Organization

- **Group related tests** with `test.describe()`
- **Use descriptive test names** that explain what is being tested
- **Keep tests independent** - each test should be able to run alone
- **Clean up after tests** - fixtures handle this automatically

## Running Specific Tests

```bash
# Run specific test file
npx playwright test e2e/tests/auth/login.spec.ts

# Run tests matching pattern
npx playwright test --grep "login"

# Run tests in specific directory
npx playwright test e2e/tests/auth/
```

## Debugging Tests

### UI Mode
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Headed Mode
```bash
npm run test:e2e:headed
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Use Fixtures**: Leverage fixtures for common setup
3. **Page Objects**: Use POM pattern for maintainability
4. **Wait Strategically**: Use `waitFor` instead of fixed timeouts
5. **Meaningful Assertions**: Assert what matters, not implementation details
6. **Clean Code**: Keep tests readable and maintainable

## Common Patterns

### Testing Form Submission

```typescript
const form = page.locator('form');
await form.fill('input[name="email"]', 'test@example.com');
await form.click('button[type="submit"]');
await page.waitForURL(/\/success/);
```

### Testing Authentication

```typescript
import { test as authTest } from '../../fixtures/auth';

test('authenticated action', async ({ page }) => {
  const { authenticatedStudent } = await authTest.use({ page });
  // User is authenticated, proceed with test
});
```

### Testing Error States

```typescript
import { expectErrorMessage } from '../../utils/assertions';

await expectErrorMessage(page, 'Invalid email');
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)

