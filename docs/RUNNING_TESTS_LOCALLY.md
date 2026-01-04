# Running Tests Locally

This guide explains how to run end-to-end (E2E) tests for MentorMatch on your local machine.

## Prerequisites

- Node.js installed (check with `node --version`)
- npm installed (check with `npm --version`)
- Firebase CLI tools installed locally (via `npm install` in the project)
- Java installed (required for Firebase emulators)

## Overview

The E2E tests use Playwright and require Firebase emulators to be running. The test setup includes:

- **Firebase Emulators**: Auth and Firestore emulators running on localhost
- **Next.js Dev Server**: Should start automatically via Playwright, but may need to be started manually
- **Playwright Tests**: E2E tests that interact with the application

## Step-by-Step Instructions

### Step 1: Start Firebase Emulators

Open a terminal window and navigate to the project directory:

```bash
cd /path/to/MentorMatch
```

Start the Firebase emulators:

```bash
npm run test:setup
```

**Alternative command:**
```bash
npm run emulators:start
```

**Java Configuration:**
Both commands automatically configure Java with the necessary options (`_JAVA_OPTIONS='-XX:+IgnoreUnrecognizedVMOptions'`) to prevent compatibility issues. You don't need to set this manually when using these npm scripts.

**What to expect:**
- The emulators will start and you'll see output indicating they're running
- Wait for the message: `✓ Firebase emulators are running!`
- The Emulator UI will be available at: http://localhost:4000
- Auth Emulator: http://localhost:9099
- Firestore Emulator: http://localhost:8081

**Wait time:**
- **Wait at least 10-15 seconds** after starting the emulators before running tests
- The emulators need time to fully initialize all services
- You can verify they're ready using the verification steps below

**Verify emulators are ready:**
Before running tests, verify the emulators are fully operational:

```bash
# Check Emulator UI (should return HTML)
curl http://localhost:4000

# Check Auth Emulator (should return JSON with "ready": true)
curl http://localhost:9099

# Check Firestore Emulator (should return "Ok")
curl http://localhost:8081
```

If all three commands return successfully, the emulators are ready for testing.

**Important:** Keep this terminal window open and running. The emulators must remain active while running tests.

### Step 2: Run the Tests

Open a **new terminal window** (keep the emulators running in the first terminal) and navigate to the project directory:

```bash
cd /path/to/MentorMatch
npm run test:e2e
```

**Note:** Playwright is configured to automatically start the Next.js dev server, but if you encounter connection errors, you may need to start it manually (see Troubleshooting section below).

## Available Test Commands

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests (default mode) |
| `npm run test:e2e:ui` | Run tests with Playwright UI mode (interactive) |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:headed` | Run tests with visible browser |
| `npm run test:e2e:verbose` | Run tests with verbose output |
| `npm run test:e2e:report` | View the test report from last run |

### Running Specific Tests

```bash
# Run a specific test file
npx playwright test e2e/tests/auth/login.spec.ts

# Run tests matching a pattern
npx playwright test --grep "login"

# Run tests in a specific directory
npx playwright test e2e/tests/auth/

# Run tests with specific tags
npx playwright test --grep "@smoke"
```

## Troubleshooting

### Next.js Server Not Starting Automatically

**Problem:** Tests fail with `ERR_CONNECTION_REFUSED` or `Timeout 15000ms exceeded` when trying to connect to `http://localhost:3000`

**Symptoms:**
- All tests fail with connection/timeout errors
- `page.goto: Timeout 15000ms exceeded` errors
- `net::ERR_CONNECTION_REFUSED` errors

**Solution:**
1. **Check if the server is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **If the server is not running, start it manually:**
   - Open a **third terminal window**
   - Navigate to the project directory
   - Run: `npm run dev`
   - Wait for the server to start (you should see "Ready" message)
   - Then run tests: `npm run test:e2e`

3. **Verify the server is accessible:**
   ```bash
   # Should return a response
   curl http://localhost:3000/api/health
   ```

**Why this happens:**
Playwright's `webServer` configuration should automatically start the Next.js dev server, but it may fail silently or timeout. Starting the server manually ensures it's running before tests execute.

### Emulators Not Starting

**Problem:** `ECONNREFUSED` errors when running tests

**Solution:**
1. Ensure emulators are running: Check http://localhost:4000 in your browser
2. Verify no other processes are using ports 4000, 9099, or 8081
3. Try stopping and restarting the emulators:
   ```bash
   # Stop any running emulators (Ctrl+C in the emulator terminal)
   # Then restart:
   npm run test:setup
   ```

### Port Already in Use

**Problem:** Error about ports being already in use

**Solution:**
```bash
# Check what's using the ports
lsof -ti:4000,9099,8081,3000

# Kill processes if needed (replace PID with actual process ID)
kill -9 <PID>
```

### Java Not Found or Configuration Issues

**Problem:** Firebase emulators fail to start with Java-related errors

**Solution:**
1. **Install Java if not installed:**
   - On macOS: `brew install openjdk`
   - Verify installation: `java -version`

2. **Configure Java PATH (if Java is not found):**
   
   If you get errors like `java: command not found` after installing Java, you **must** add Java to your PATH in the terminal where you'll run the emulators.
   
   **Find Java installation path:**
   ```bash
   # On macOS with Homebrew, Java is typically installed at:
   # Apple Silicon (M1/M2/M3): /opt/homebrew/opt/openjdk/bin/java
   # Intel Mac: /usr/local/opt/openjdk/bin/java
   
   # Find the exact path:
   /usr/libexec/java_home -V
   # or
   brew --prefix openjdk
   ```
   
   **IMPORTANT: Export Java PATH in your terminal session:**
   
   You need to export the Java path **in the terminal where you'll run the emulators**. You can do this in two ways:
   
   **Option A: Export for current terminal session only (temporary):**
   ```bash
   # For Apple Silicon (M1/M2/M3):
   export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
   
   # For Intel Mac:
   export PATH="/usr/local/opt/openjdk/bin:$PATH"
   ```
   
   **Option B: Add to shell configuration file (permanent):**
   
   For zsh (default on macOS):
   ```bash
   # Add to ~/.zshrc
   echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc
   # For Intel Macs, use: /usr/local/opt/openjdk/bin
   
   # Reload your shell configuration
   source ~/.zshrc
   ```
   
   For bash:
   ```bash
   # Add to ~/.bash_profile or ~/.bashrc
   echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.bash_profile
   # For Intel Macs, use: /usr/local/opt/openjdk/bin
   
   # Reload your shell configuration
   source ~/.bash_profile
   ```
   
   **Verify Java is accessible:**
   ```bash
   java -version
   which java
   ```
   
   **Note:** If you use Option A (export in current session), you'll need to export it again each time you open a new terminal. Option B makes it permanent for all future terminal sessions.

3. **Java configuration is automatic:**
   The setup scripts (`npm run test:setup` and `npm run emulators:start`) automatically configure Java with `_JAVA_OPTIONS='-XX:+IgnoreUnrecognizedVMOptions'` to prevent compatibility issues with newer Java versions.

4. **If starting emulators manually (not using npm scripts):**
   ```bash
   # On macOS/Linux:
   _JAVA_OPTIONS='-XX:+IgnoreUnrecognizedVMOptions' npx firebase emulators:start --only auth,firestore
   
   # On Windows (PowerShell):
   $env:_JAVA_OPTIONS='-XX:+IgnoreUnrecognizedVMOptions'; npx firebase emulators:start --only auth,firestore
   ```

**Note:** The `npm run test:e2e` command does **not** require Java configuration because it doesn't start the emulators. It only runs tests against already-running emulators. However, the terminal where you run `npm run test:setup` or `npm run emulators:start` **must** have Java in the PATH.

## Test Configuration

The test configuration is in `playwright.config.ts`. Key settings:

- **Test Directory**: `./e2e/tests`
- **Base URL**: `http://localhost:3000`
- **Timeout**: 60 seconds locally, 240 seconds in CI
- **Browsers**: Chromium (default)
- **Retries**: 0 locally, 2 in CI
- **Web Server**: Automatically starts Next.js dev server (may need manual start if it fails)

## Test Execution Findings

Based on test runs, here are important observations:

### Test Execution
- **Test duration:** Full test suite takes approximately 4-7 minutes to complete
- **Pass rate:** Some tests may fail due to application logic issues, not infrastructure problems
- **Authentication:** Many tests require proper authentication setup - ensure emulators are fully ready before running

### Common Issues
- **Authentication timeouts:** If tests fail with "Authentication not complete within 20000ms", verify emulators are running and wait longer before retrying
- **Connection errors:** If you see `ECONNREFUSED`, verify emulators are running and accessible

## Best Practices

1. **Start emulators first:** Always start Firebase emulators before running tests
2. **Wait and verify:** Wait 10-15 seconds after starting emulators and verify they're ready using the curl commands in Step 1 before running tests
3. **Keep emulators running:** Start emulators once and keep them running while developing/running tests multiple times
4. **Start dev server manually if needed:** If Playwright fails to start the Next.js server automatically, start it manually in a separate terminal
5. **Use UI mode for debugging:** Use `npm run test:e2e:ui` when debugging test failures
6. **Run specific tests:** When working on a feature, run only relevant tests to save time
7. **Check test reports:** After test runs, check the HTML report for detailed failure information

## Viewing Test Results

After tests complete, view the HTML report:

```bash
npm run test:e2e:report
```

This opens the Playwright HTML report in your browser, showing:
- Test results and status
- Screenshots of failures
- Video recordings (if enabled)
- Test execution timeline

## Quick Reference

**Start emulators (wait 10-15 seconds for readiness):**
```bash
npm run test:setup
# Wait for "✓ Firebase emulators are running!" message
# Verify with: curl http://localhost:4000
```

**Start Next.js dev server (if needed):**
```bash
npm run dev
```

**Run all tests:**
```bash
npm run test:e2e
```

**Run tests with UI:**
```bash
npm run test:e2e:ui
```

**View test report:**
```bash
npm run test:e2e:report
```

---

**Important Notes:**
- Always ensure Firebase emulators are running before executing tests
- Wait 10-15 seconds after starting emulators and verify they're ready before running tests
- If Java is not found, export the Java PATH in the terminal where you start emulators (see Java Configuration section)
- If tests fail with connection errors, verify both emulators and the Next.js dev server are running
- The Next.js dev server should start automatically, but may need to be started manually if Playwright's webServer fails
