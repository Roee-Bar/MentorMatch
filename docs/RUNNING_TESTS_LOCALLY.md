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

**Note:** The test suite has been condensed to focus on critical smoke tests (~7 tests) covering core functionality to reduce execution time.

## Quick Start & Common Issues

**Most Common Issues:**

1. **Java not found** → See Step 0 below (add Java to PATH)
2. **Ports already in use** → Emulators may already be running - verify with `curl http://localhost:4000`
3. **Emulators not detected** → The setup script may not detect already-running emulators - verify manually
4. **Next.js server not ready** → Start the dev server manually before running tests to avoid authentication timeouts
5. **Authentication timeouts** → Ensure both emulators AND Next.js server are running and ready before tests

**Quick Verification Commands:**

```bash
# Check Java
java -version

# Check if emulators are running
curl http://localhost:4000 && echo "✓ Emulator UI running"
curl http://localhost:9099 && echo "✓ Auth Emulator running"
curl http://localhost:8081 && echo "✓ Firestore Emulator running"

# Check if Next.js server is running (CRITICAL for avoiding timeouts)
curl http://localhost:3000/api/health && echo "✓ Next.js server running" || echo "✗ Next.js server NOT running - start it manually!"
```

If all checks pass, you can proceed directly to running tests (Step 2).

## Step-by-Step Instructions

### Step 0: Ensure Java is in PATH (CRITICAL - Do This First!)

**Before starting the emulators, you MUST ensure Java is accessible in your PATH.**

**Check if Java is available:**
```bash
java -version
```

**If you get an error like "command not found" or "Unable to locate a Java Runtime":**

1. **Verify Java is installed:**
   ```bash
   # Check if Java is installed via Homebrew
   brew list openjdk
   ```

2. **Add Java to PATH for this terminal session:**
   ```bash
   # For Apple Silicon (M1/M2/M3) Macs:
   export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
   
   # For Intel Macs:
   export PATH="/usr/local/opt/openjdk/bin:$PATH"
   ```

3. **Verify Java is now accessible:**
   ```bash
   java -version
   # Should show: openjdk version "X.X.X"
   ```

**Important:** You must export the PATH **in the same terminal window** where you'll run `npm run test:setup`. If you open a new terminal, you'll need to export it again, or add it permanently to your shell configuration (see Troubleshooting section for permanent setup).

### Step 1: Check if Emulators Are Already Running

**Before starting new emulators, check if they're already running:**

```bash
# Check if emulators are accessible
curl -s http://localhost:4000 > /dev/null && echo "✓ Emulator UI is running" || echo "✗ Emulator UI is not running"
curl -s http://localhost:9099 | grep -q "ready" && echo "✓ Auth Emulator is running" || echo "✗ Auth Emulator is not running"
curl -s http://localhost:8081 | grep -q "Ok" && echo "✓ Firestore Emulator is running" || echo "✗ Firestore Emulator is not running"
```

**If all emulators are already running:**
- You can skip to Step 2 and run tests directly
- The `npm run test:setup` command will detect running emulators and inform you

**If emulators are not running, proceed to start them:**

### Step 1a: Start Firebase Emulators

Open a terminal window and navigate to the project directory:

```bash
cd /path/to/MentorMatch
```

**Ensure Java is in PATH (see Step 0 above), then start the Firebase emulators:**

```bash
npm run test:setup
```

**Alternative command:**
```bash
npm run emulators:start
```

**Note:** Both commands automatically configure Java with the necessary options (`_JAVA_OPTIONS='-XX:+IgnoreUnrecognizedVMOptions'`) to prevent compatibility issues. You don't need to set this manually when using these npm scripts.

**What to expect:**
- If emulators are already running, you'll see: `✓ Firebase emulators are already running!`
- If starting new emulators, you'll see output indicating they're starting
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
curl http://localhost:4000 | head -5

# Check Auth Emulator (should return JSON with "ready": true)
curl http://localhost:9099

# Check Firestore Emulator (should return "Ok")
curl http://localhost:8081
```

**Expected responses:**
- Emulator UI: HTML content starting with `<!DOCTYPE html>`
- Auth Emulator: `{"authEmulator":{"ready":true,...}}`
- Firestore Emulator: `Ok`

If all three commands return successfully, the emulators are ready for testing.

**Important:** Keep this terminal window open and running. The emulators must remain active while running tests.

### Step 1b: Start Next.js Dev Server (RECOMMENDED - Prevents Timeout Issues)

**CRITICAL:** To avoid authentication timeout errors and connection issues, start the Next.js dev server manually before running tests. While Playwright can start it automatically, starting it manually ensures it's fully ready before tests begin.

**Open a second terminal window** (keep the emulators running in Terminal 1) and navigate to the project directory:

```bash
cd /path/to/MentorMatch
npm run dev
```

**What to expect:**
- The server will start compiling
- Wait for the message: `✓ Ready in X.Xs` or `Ready on http://localhost:3000`
- The server will be available at: http://localhost:3000

**Wait time:**
- **Wait at least 10-15 seconds** after seeing "Ready" before running tests
- The server needs time to fully initialize and connect to Firebase emulators

**Verify the server is ready:**
Before running tests, verify the server is fully operational:

```bash
# Check if the server responds (should return a response)
curl http://localhost:3000/api/health

# Check if the main page loads (should return HTML)
curl http://localhost:3000 | head -5
```

**Expected responses:**
- Health endpoint: Should return a response (may be JSON or HTML)
- Main page: HTML content starting with `<!DOCTYPE html>` or similar

**Why this is important:**
- Prevents "Authentication not complete within 20000ms" errors
- Ensures the server is connected to Firebase emulators before tests run
- Reduces flaky test failures due to timing issues
- Allows you to see server logs if tests fail

**Important:** Keep this terminal window open and running. The dev server must remain active while running tests.

### Step 2: Run the Tests

Open a **new terminal window** (keep the emulators running in Terminal 1 and the dev server running in Terminal 2) and navigate to the project directory:

```bash
cd /path/to/MentorMatch
npm run test:e2e
```

**Note:** While Playwright is configured to automatically start the Next.js dev server, **starting it manually (Step 1b) is strongly recommended** to avoid authentication timeout errors and ensure reliable test execution.

## Available Test Commands

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests (~7 critical smoke tests) |
| `npm run test:e2e:ui` | Run tests with Playwright UI mode (interactive) |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:headed` | Run tests with visible browser |
| `npm run test:e2e:verbose` | Run tests with verbose output |
| `npm run test:e2e:report` | View the test report from last run |

**Test Suite:** The suite focuses on critical smoke tests covering:
- User authentication (login, registration)
- Admin dashboard display
- Student applications and supervisors display
- Supervisor applications and projects display

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

### Java Not Found or Configuration Issues

**Problem:** Error when running `npm run test:setup`:
```
Error: Process `java -version` has exited with code 1. 
Please make sure Java is installed and on your system PATH.
```

**Root Cause:** Java is not installed or not in your terminal's PATH environment variable.

**Solution:**

1. **Install Java if not installed:**
   ```bash
   brew install openjdk
   java -version  # Verify installation
   ```

2. **Configure Java PATH (if Java is installed but not found):**
   
   **Find Java installation path:**
   ```bash
   # Find the exact path:
   /usr/libexec/java_home -V
   # or
   brew --prefix openjdk
   ```
   
   **Export Java PATH in your terminal session:**
   
   **Option A: Temporary (current session only):**
   ```bash
   # For Apple Silicon (M1/M2/M3):
   export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
   
   # For Intel Mac:
   export PATH="/usr/local/opt/openjdk/bin:$PATH"
   ```
   
   **Option B: Permanent (add to shell configuration):**
   
   For zsh (default on macOS):
   ```bash
   echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc
   # For Intel Macs, use: /usr/local/opt/openjdk/bin
   source ~/.zshrc
   ```
   
   For bash:
   ```bash
   echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.bash_profile
   # For Intel Macs, use: /usr/local/opt/openjdk/bin
   source ~/.bash_profile
   ```
   
   **Verify Java is accessible:**
   ```bash
   java -version
   which java
   ```

3. **Run emulator setup again:**
   ```bash
   npm run test:setup
   ```

**Note:** The setup scripts automatically configure Java with `_JAVA_OPTIONS='-XX:+IgnoreUnrecognizedVMOptions'`. If starting emulators manually (not using npm scripts):
```bash
# macOS/Linux:
_JAVA_OPTIONS='-XX:+IgnoreUnrecognizedVMOptions' npx firebase emulators:start --only auth,firestore

# Windows (PowerShell):
$env:_JAVA_OPTIONS='-XX:+IgnoreUnrecognizedVMOptions'; npx firebase emulators:start --only auth,firestore
```

### Next.js Server Not Starting Automatically / Authentication Timeouts

**Problem:** Tests fail with authentication timeout errors or connection issues:
- `Authentication not complete within 20000ms`
- `ERR_CONNECTION_REFUSED` or `Timeout 15000ms exceeded` when trying to connect to `http://localhost:3000`
- Multiple tests failing with authentication errors

**Symptoms:**
- Tests fail with "Authentication failed after 3 attempts" errors
- `page.goto: Timeout 15000ms exceeded` errors
- `net::ERR_CONNECTION_REFUSED` errors
- Tests that require authentication consistently fail

**Root Cause:**
The Next.js dev server may not be ready when Playwright tries to start tests automatically, or it may not have fully connected to Firebase emulators. This causes authentication flows to timeout.

**Solution:**

1. **Check if the server is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **If the server is not running, start it manually (RECOMMENDED):**
   - Open a **separate terminal window** (Terminal 2)
   - Navigate to the project directory
   - Run: `npm run dev`
   - **Wait for the "Ready" message** (usually takes 10-30 seconds)
   - **Wait an additional 10-15 seconds** after "Ready" to ensure full initialization
   - Verify it's accessible: `curl http://localhost:3000/api/health`
   - Then run tests in another terminal: `npm run test:e2e`

3. **Verify the server is fully ready:**
   ```bash
   # Should return a response
   curl http://localhost:3000/api/health
   
   # Should return HTML
   curl http://localhost:3000 | head -5
   ```

4. **If tests still fail with authentication timeouts:**
   - Ensure Firebase emulators are running (Step 1a)
   - Restart the Next.js dev server: Stop it (Ctrl+C) and start again (`npm run dev`)
   - Wait longer after "Ready" message (30+ seconds)
   - Check server logs for connection errors to Firebase emulators
   - Verify emulator ports match your configuration (Auth: 9099, Firestore: 8081)

**Why this happens:**
- Playwright's `webServer` configuration may start the server, but it might not be fully ready when tests begin
- The server needs time to connect to Firebase emulators
- Cold starts can take longer than expected
- Starting the server manually ensures it's ready before tests execute

**Best Practice:**
Always start the Next.js dev server manually (Step 1b) before running tests to avoid these issues entirely.

### Emulators Not Starting

**Problem:** `ECONNREFUSED` errors when running tests, or emulators fail to start

**Symptoms:**
- Tests fail with connection errors to Firebase emulators
- `ECONNREFUSED` errors in test output
- Emulators don't start when running `npm run test:setup`

**Solution:**

1. **Verify emulators are actually running:**
   ```bash
   # Check Emulator UI
   curl http://localhost:4000
   
   # Check Auth Emulator
   curl http://localhost:9099
   
   # Check Firestore Emulator
   curl http://localhost:8081
   ```

2. **If emulators are not running:**
   - Ensure Java is in PATH (see Step 0)
   - Check if ports are already in use (see "Port Already in Use" section)
   - Try stopping any existing emulator processes:
     ```bash
     # Find and kill existing emulator processes
     pkill -f "firebase emulators"
     pkill -f "java.*emulator"
     ```
   - Then restart emulators:
     ```bash
     npm run test:setup
     ```

3. **If emulators appear to be running but tests still fail:**
   - Verify environment variables are set correctly (check `e2e/config/env.ts`)
   - Check that the emulator ports match your configuration:
     - Auth: `localhost:9099`
     - Firestore: `localhost:8081`
   - Try accessing the Emulator UI in your browser: http://localhost:4000
   - Restart emulators to ensure clean state:
     ```bash
     # Stop emulators (Ctrl+C in emulator terminal)
     # Wait a few seconds
     # Then restart:
     npm run test:setup
     ```

### Port Already in Use

**Problem:** Error messages like:
```
⚠ ui: Port 4000 is not open on localhost
⚠ auth: Port 9099 is not open on localhost
⚠ firestore: Port 8081 is not open on localhost
Error: Could not start Emulator UI, port taken.
```

**Root Cause:** Ports 4000, 9099, or 8081 are already in use, likely by existing emulator instances.

**Solution:**

1. **First, check if emulators are already running (they might be working fine):**
   ```bash
   # Verify emulators are accessible
   curl -s http://localhost:4000 > /dev/null && echo "✓ Emulator UI is running" || echo "✗ Not running"
   curl -s http://localhost:9099 | grep -q "ready" && echo "✓ Auth Emulator is running" || echo "✗ Not running"
   curl -s http://localhost:8081 | grep -q "Ok" && echo "✓ Firestore Emulator is running" || echo "✗ Not running"
   ```

2. **If emulators ARE running and accessible:**
   - You can skip starting new emulators and proceed directly to running tests
   - The ports are already in use by working emulators - this is fine!

3. **If emulators are NOT running but ports are still in use:**
   - Find what's using the ports:
     ```bash
     # Check what processes are using the ports
     lsof -i:4000,9099,8081,3000
     ```
   - If you see `node` or `java` processes, they might be stale emulator instances
   - Kill the processes if needed (replace PID with actual process ID):
     ```bash
     # Find PIDs
     lsof -ti:4000,9099,8081
     
     # Kill processes (use with caution)
     kill -9 <PID>
     ```
   - Then restart emulators:
     ```bash
     npm run test:setup
     ```

4. **Alternative: Use different ports (if you need to run multiple emulator instances):**
   - Edit `firebase.json` to use different ports
   - Update environment variables in `e2e/config/env.ts` to match
   - This is rarely needed for normal development

## Test Configuration

The test configuration is in `playwright.config.ts`. Key settings:

- **Test Directory**: `./e2e/tests`
- **Base URL**: `http://localhost:3000`
- **Timeout**: 60 seconds locally, 240 seconds in CI
- **Browsers**: Chromium (default)
- **Retries**: 0 locally, 2 in CI
- **Web Server**: Automatically starts Next.js dev server (may need manual start if it fails)

## Best Practices

1. **Start emulators first:** Always start Firebase emulators before running tests (Step 1a)
2. **Start Next.js server manually:** Always start the dev server manually (Step 1b) before running tests to avoid authentication timeouts
3. **Wait and verify:** Wait 10-15 seconds after starting each service and verify they're ready using the curl commands before running tests
4. **Keep services running:** Start emulators and dev server once and keep them running while developing/running tests multiple times
5. **Verify readiness:** Use the verification commands in Steps 1a and 1b to ensure all services are ready before running tests
6. **Use UI mode for debugging:** Use `npm run test:e2e:ui` when debugging test failures
7. **Run specific tests:** When working on a feature, run only relevant tests to save time
8. **Check test reports:** After test runs, check the HTML report for detailed failure information

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

## Testing the Setup

**Verified Working Setup:**

During testing, the following setup was verified to work successfully:

1. **Java Setup:**
   - Java installed via Homebrew: `brew install openjdk`
   - Java version: OpenJDK 25.0.1
   - Path: `/opt/homebrew/opt/openjdk/bin` (Apple Silicon Mac)
   - Added to PATH: `export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"`

2. **Emulator Status:**
   - Emulators were already running from a previous session
   - Verified accessible via:
     - Emulator UI: http://localhost:4000 ✓
     - Auth Emulator: http://localhost:9099 ✓ (returns `{"authEmulator":{"ready":true}}`)
     - Firestore Emulator: http://localhost:8081 ✓ (returns `Ok`)

3. **Common Issues Encountered:**
   - **Issue:** `npm run test:setup` tried to start new emulators even though they were already running
   - **Solution:** The script should detect running emulators, but if ports are in use, verify manually with curl commands
   - **Workaround:** If emulators are already running and accessible, skip `npm run test:setup` and proceed directly to running tests
   - **Issue:** Authentication timeout errors ("Authentication not complete within 20000ms")
   - **Solution:** Start Next.js dev server manually before running tests (Step 1b) and wait for it to be fully ready
   - **Prevention:** Always verify both emulators AND Next.js server are running before executing tests

**Recommended Workflow:**

1. Check if emulators are already running (Step 1)
2. If not running, ensure Java is in PATH (Step 0) and start emulators (Step 1a)
3. Verify emulators are ready (verification commands in Step 1a)
4. **Start Next.js dev server manually (Step 1b)** - This prevents authentication timeout errors
5. Verify Next.js server is ready (verification commands in Step 1b)
6. Run tests (Step 2)

## Complete Workflow Example

Here's a complete example using three terminal windows:

**Terminal 1:** Follow Step 0 and Step 1a to set up Java PATH and start Firebase emulators. Keep this terminal open.
```bash
cd /path/to/MentorMatch
# Ensure Java is in PATH (Step 0)
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"  # Apple Silicon Mac
# Start emulators (Step 1a)
npm run test:setup
# Wait for "✓ Firebase emulators are running!" message
# Keep this terminal open
```

**Terminal 2:** Start Next.js dev server manually (Step 1b) - **RECOMMENDED to prevent timeout issues:**
```bash
cd /path/to/MentorMatch
npm run dev
# Wait for "Ready" message, then wait additional 10-15 seconds
# Verify: curl http://localhost:3000/api/health
# Keep this terminal open
```

**Terminal 3:** Follow Step 2 to run tests:
```bash
cd /path/to/MentorMatch
npm run test:e2e
```

After tests complete, view the report:
```bash
npm run test:e2e:report
```

**Note:** Starting the Next.js server manually (Terminal 2) is strongly recommended to avoid authentication timeout errors. While Playwright can start it automatically, manual startup ensures it's fully ready before tests begin.
