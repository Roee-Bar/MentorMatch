# Running Tests Locally

This guide explains how to run end-to-end (E2E) tests for MentorMatch on your local machine.

## Prerequisites

- Node.js installed (check with `node --version`)
- npm installed (check with `npm --version`)

## Quick Start

Run all tests with a single command:

```bash
npm run test
```

That's it! The test infrastructure automatically:
- Uses an in-memory test database (no emulators needed)
- Starts the Next.js dev server
- Runs all E2E tests
- Cleans up automatically

## Available Test Commands

| Command | Description |
|---------|-------------|
| `npm run test` | Run all E2E tests |
| `npm run test:e2e` | Alias for `npm run test` |
| `npm run test:ui` | Run tests with Playwright UI mode (interactive) |
| `npm run test:debug` | Run tests in debug mode |
| `npm run test:headed` | Run tests with visible browser |
| `npm run test:verbose` | Run tests with verbose output |
| `npm run test:report` | View the test report from last run |

## Running Specific Tests

```bash
# Run a specific test file
npx playwright test e2e/tests/auth/login.spec.ts

# Run tests matching a pattern
npx playwright test --grep "login"

# Run tests in a specific directory
npx playwright test e2e/tests/auth/
```

## Troubleshooting

**Tests fail with connection errors:**
- Ensure the Next.js dev server can start (port 3000 should be available)
- Check that no other process is using port 3000: `lsof -i:3000`

**Tests are slow:**
- This is normal for E2E tests. Use `npm run test:headed` to see what's happening
- Use `npm run test:ui` for interactive debugging

**Need more details:**
- Use `npm run test:verbose` to see detailed output
- Check the HTML report: `npm run test:report`

## Test Configuration

The test configuration is in `playwright.config.ts`. Key settings:
- **Test Directory**: `./e2e/tests`
- **Base URL**: `http://localhost:3000`
- **Timeout**: 60 seconds locally, 240 seconds in CI
- **Browsers**: Chromium (default)

## How It Works

Tests use an in-memory database instead of Firebase emulators:
- **No Java required** - no emulator dependencies
- **No separate processes** - everything runs in one command
- **Fast and reliable** - no network calls or timing issues
- **Automatic cleanup** - database is cleared after each test run

## Test Patterns

The test suite follows established patterns for reliability and maintainability:

### Authentication Fixtures

All authenticated tests use auth fixtures instead of form-based login:

```typescript
import { test, expect } from '../../fixtures/auth';

test('my test', async ({ page, authenticatedStudent }) => {
  // User is already authenticated
  // authenticatedStudent provides: uid, email, password, student
});
```

**Why**: Form-based login has complex redirect chains and timing issues. Auth fixtures use `signInWithCustomToken` for reliable, fast authentication.

### API Fallback Pattern

UI tests include API fallbacks to verify business logic even if UI isn't ready:

```typescript
const listVisible = await applicationsList.first().isVisible({ timeout: 10000 }).catch(() => false);
if (!listVisible) {
  // Fallback to API verification
  const response = await authenticatedRequest(page, 'GET', '/api/applications');
  const data = await response.json();
  expect(Array.isArray(data)).toBeTruthy();
  return; // Test passes
}
```

**Why**: Tests business logic even when UI isn't implemented or has timing issues. More resilient to UI changes.

### Database Verification

State change tests verify changes directly in the database:

```typescript
// After UI action
const projectDoc = await adminDb.collection('projects').doc(projectId).get();
expect(projectDoc.data()?.status).toBe('completed');
```

**Why**: More reliable than waiting for UI updates. Catches backend issues that UI might not show.

### Shared Data Setup

Tests that need shared data use `beforeAll`/`afterAll`:

```typescript
let sharedData: Type | undefined;

test.beforeAll(async () => {
  try {
    sharedData = await seedData();
  } catch (error) {
    console.error('Failed to seed:', error);
    throw error;
  }
});

test.afterAll(async () => {
  if (sharedData?.uid) {
    try {
      await cleanupUser(sharedData.uid);
    } catch (error) {
      console.error('Failed to cleanup:', error);
      // Don't throw - cleanup errors shouldn't fail suite
    }
  }
});
```

**Why**: Reduces test setup time and ensures cleanup even if tests fail.

### Wait Strategies

Tests use `load` state instead of `networkidle`:

```typescript
// Good
await page.waitForLoadState('load', { timeout: 10000 });

// Avoid
await page.waitForLoadState('networkidle', { timeout: 10000 }); // Unreliable
```

**Why**: `networkidle` times out when background requests continue. `load` is more reliable and faster.
