# Testing Documentation

## Overview

MentorMatch uses Playwright for end-to-end (E2E) testing. Tests run against Firebase Emulator Suite to provide an isolated, reproducible test environment.

## Prerequisites

- Node.js 18+
- Java Runtime Environment (JRE) - Required for Firebase Emulators
  - macOS: `brew install openjdk` or download from [Oracle](https://www.java.com/)
    - **Note:** After installing via Homebrew, add to PATH:
      ```bash
      echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc
      source ~/.zshrc
      ```
  - Linux: `sudo apt install default-jre` or equivalent
  - Windows: Download from [Oracle](https://www.java.com/)
- Firebase Tools installed (`npm install -D firebase-tools`)
- Playwright browsers installed (`npx playwright install`)

### Verify Java Installation

```bash
java -version
# Should output: openjdk version "25.0.1" or similar
```

## Quick Start

### 1. Set Up Test Environment

Copy the example test environment file:

```bash
cp .env.test.local.example .env.test.local
```

Update `.env.test.local` with your test configuration (though defaults should work for emulator).

### 2. Start Firebase Emulators

**Important:** Firebase Emulators require Java to be installed. If you don't have Java, install it first (see Prerequisites).

```bash
# Start emulators in a separate terminal
npx firebase emulators:start --only auth,firestore
```

The emulators will start on:
- Auth Emulator: `http://localhost:9099`
- Firestore Emulator: `http://localhost:8080`
- Emulator UI: `http://localhost:4000`

### 3. Run Tests

**Option 1: With Emulators Running (Recommended)**
```bash
# Terminal 1: Start emulators (keep running)
npx firebase emulators:start --only auth,firestore

# Terminal 2: Run tests (will start Next.js automatically)
npm run test:e2e
```

**Option 2: Manual Server Start**
```bash
# Terminal 1: Start emulators
npx firebase emulators:start --only auth,firestore

# Terminal 2: Start Next.js
npm run dev

# Terminal 3: Run tests
npm run test:e2e
```

## Test Commands

- `npm run test:e2e` - Run all e2e tests
- `npm run test:e2e:ui` - Run tests with Playwright UI mode
- `npm run test:e2e:debug` - Run tests in debug mode
- `npm run test:e2e:headed` - Run tests with visible browser
- `npm run test:e2e:report` - View test report
- `npm run emulators:start` - Start Firebase emulators only

## Test Structure

```
e2e/
├── fixtures/          # Test fixtures and data generators
│   ├── auth.ts       # Authentication fixtures
│   ├── test-data.ts  # Test data generators
│   └── db-helpers.ts # Database seeding helpers
├── pages/            # Page Object Models
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── StudentDashboard.ts
│   ├── SupervisorDashboard.ts
│   └── AdminDashboard.ts
├── tests/            # Test specifications
│   ├── auth/         # Authentication tests
│   ├── student/      # Student flow tests
│   ├── supervisor/  # Supervisor flow tests
│   └── admin/        # Admin flow tests
└── utils/            # Test utilities
    ├── firebase-helpers.ts
    ├── test-helpers.ts
    └── assertions.ts
```

## Writing Tests

### Using Fixtures

Use authentication fixtures for authenticated tests:

```typescript
import { test as authTest } from '../../fixtures/auth';

test('should access student dashboard', async ({ page }) => {
  const { authenticatedStudent } = await authTest.use({ page });
  // User is already authenticated
  await page.goto('/authenticated/student');
});
```

### Using Page Objects

```typescript
import { LoginPage } from '../../pages/LoginPage';

test('should login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password');
});
```

### Using Test Data Generators

```typescript
import { generateRegistrationData } from '../../fixtures/test-data';

test('should register user', async ({ page }) => {
  const registrationData = generateRegistrationData();
  // Use registrationData in your test
});
```

## Firebase Emulator

Tests use Firebase Emulator Suite for:
- **Authentication Emulator**: Port 9099
- **Firestore Emulator**: Port 8080
- **Emulator UI**: Port 4000

The emulator automatically:
- Cleans up data between test runs
- Provides isolated test environment
- No cost (runs locally)

## CI/CD Integration

Tests run automatically on:
- Push to `main` branch
- Pull requests to `main` branch

See `.github/workflows/e2e-tests.yml` for CI/CD configuration.

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Use Fixtures**: Leverage authentication fixtures for authenticated tests
3. **Page Objects**: Use Page Object Model pattern for maintainability
4. **Test Data**: Use generators for consistent test data
5. **Cleanup**: Tests automatically clean up, but be mindful of test data

## Troubleshooting

### Tests Fail to Connect to Emulator

- Ensure emulators are running: `npm run emulators:start`
- Check emulator ports (9099 for Auth, 8080 for Firestore)
- Verify environment variables in `.env.test.local`

### Tests Timeout

- Increase timeout in `playwright.config.ts`
- Check that Next.js server is running
- Verify network connectivity

### Flaky Tests

- Add retries in `playwright.config.ts`
- Use `waitFor` instead of `waitForTimeout`
- Check for race conditions

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Firebase Emulator Documentation](https://firebase.google.com/docs/emulator-suite)
- [e2e/README.md](../e2e/README.md) - Detailed test structure guide

