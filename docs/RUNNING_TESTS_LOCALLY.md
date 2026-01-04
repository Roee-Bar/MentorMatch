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
