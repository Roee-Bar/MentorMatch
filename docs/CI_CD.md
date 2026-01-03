# CI/CD Pipeline Documentation

## Overview

The CI/CD pipeline for MentorMatch runs automatically on pull requests to the `main` branch. It includes code quality checks, builds, security scanning, and comprehensive E2E testing.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CI Pipeline                               │
├─────────────────────────────────────────────────────────────┤
│  Fast Checks (Parallel)                                     │
│  ├── Lint                                                   │
│  ├── Build                                                  │
│  └── Security                                               │
├─────────────────────────────────────────────────────────────┤
│  Fast E2E Tests (New)                                      │
│  └── @fast @smoke tests (5 min timeout)                    │
├─────────────────────────────────────────────────────────────┤
│  Full E2E Tests (Conditional)                               │
│  ├── Auth + Student (sharded)                              │
│  ├── Supervisor                                             │
│  └── Admin                                                  │
├─────────────────────────────────────────────────────────────┤
│  Performance Tests (Optional)                               │
│  └── Performance metrics and budgets                        │
└─────────────────────────────────────────────────────────────┘
```

## Jobs

### Fast Checks (Parallel)

These jobs run in parallel and provide quick feedback:

#### Lint
- **Purpose**: Code quality and style checking
- **Timeout**: 5 minutes
- **Tools**: ESLint
- **Runs**: Always

#### Build
- **Purpose**: Type checking and production build
- **Timeout**: 10 minutes
- **Steps**:
  1. Type check with TypeScript
  2. Build Next.js application
- **Caching**: Node modules, TypeScript build info, Next.js cache
- **Runs**: Always

#### Security
- **Purpose**: Security vulnerability scanning
- **Timeout**: 10 minutes
- **Tools**: 
  - Dependency Review (GitHub)
  - npm audit
- **Runs**: Always

### E2E Setup

- **Purpose**: Determine if E2E tests should run
- **Timeout**: 10 minutes
- **Logic**: Checks if relevant files changed (app/, lib/, e2e/, config files)
- **Output**: `should_run` (true/false)

### Fast E2E Tests

- **Purpose**: Quick feedback on critical path tests
- **Timeout**: 5 minutes
- **Tests**: Only @fast and @smoke tagged tests
- **Dependencies**: lint, build, e2e-setup
- **Runs**: Conditionally (if e2e-setup.should_run == true)

### Full E2E Tests

- **Purpose**: Comprehensive test coverage
- **Timeout**: 15 minutes per shard
- **Strategy**: Matrix-based parallel execution
- **Sharding**: 
  - Auth + Student: 2 shards
  - Supervisor: 1 shard
  - Admin: 1 shard
- **Dependencies**: lint, build, security, e2e-setup, load-matrix
- **Runs**: Conditionally (if e2e-setup.should_run == true)
- **Post-steps**:
  - Test Analytics: Identifies flaky tests and performance trends
  - Failure Analysis: Categorizes failures and suggests fixes

### Performance Tests

- **Purpose**: Performance metrics and budget validation
- **Timeout**: 10 minutes
- **Tests**: Performance test suite
- **Dependencies**: e2e-setup, e2e-tests
- **Runs**: Conditionally (if e2e-setup.should_run == true)
- **Note**: Does not fail pipeline (informational only)

## Job Dependencies

```
lint ──┐
       ├──> fast-e2e-tests
build ─┘

lint ──┐
       ├──> e2e-tests
build ─┤
       │
security ─┘

e2e-setup ──> fast-e2e-tests
e2e-setup ──> e2e-tests
e2e-tests ──> performance-tests
```

## Caching Strategy

### Dependency Caching
- **Node Modules**: Cached based on `package-lock.json` hash
- **Restore Keys**: Fallback to previous cache if exact match not found

### Build Caching
- **Next.js Cache**: `.next/cache`, `.next/standalone`, `.next/static`
- **TypeScript Build Info**: `*.tsbuildinfo` files
- **Cache Key**: Includes package-lock hash and commit SHA

### Test Caching
- **Playwright Browsers**: `~/.cache/ms-playwright`
- **Test Results**: Cached for faster re-runs (optional)

## Test Execution Flow

1. **E2E Setup** determines if tests should run
2. **Fast E2E Tests** run immediately after lint/build for quick feedback
3. **Full E2E Tests** run in parallel shards:
   - Auth + Student (2 shards)
   - Supervisor (1 shard)
   - Admin (1 shard)
4. **Performance Tests** run after E2E suite completes
5. **Analytics** process test results:
   - Identify flaky tests
   - Track execution times
   - Categorize failures
   - Generate metrics

## Test Matrix Configuration

The test matrix is defined in `.github/workflows/test-matrix.json`:

```json
{
  "include": [
    {
      "suite": "Auth + Student",
      "test_paths": "e2e/tests/auth/ e2e/tests/student/",
      "artifact_name": "auth-student",
      "shard": 1,
      "shards": 2,
      "grep": "@regression"
    },
    // ... more suites
  ]
}
```

## Environment Variables

### Shared Environment
- `NODE_VERSION`: '20'
- `JAVA_VERSION`: '21'
- `PROJECT_ID`: 'demo-test'

### Test Environment
Set by `test-env-vars` action:
- `E2E_TEST`: 'true'
- `NODE_ENV`: 'test'
- Firebase emulator hosts
- Next.js public environment variables

## Troubleshooting

### Tests Not Running

**Issue**: E2E tests are skipped
**Solution**: Check if relevant files changed. Tests run if changes are in:
- `app/`
- `lib/`
- `e2e/`
- `playwright.config.ts`
- `package.json` / `package-lock.json`
- `.github/workflows/ci.yml`

### Slow Test Execution

**Issue**: Tests take too long
**Solutions**:
1. Check cache hit rates in job summaries
2. Review slow tests in test analytics
3. Optimize test timeouts
4. Consider additional sharding

### Flaky Tests

**Issue**: Tests fail intermittently
**Solutions**:
1. Review test analytics for flaky test identification
2. Use stability helpers (`waitForStableState`, `waitForNetworkIdle`)
3. Add retry logic with `retryWithBackoff()`
4. Check failure analysis for categorized failures

### Cache Misses

**Issue**: Dependencies/builds not cached
**Solutions**:
1. Verify `package-lock.json` is committed
2. Check cache key patterns
3. Review restore keys configuration
4. Ensure cache size limits aren't exceeded

### Firebase Emulator Issues

**Issue**: Emulators fail to start
**Solutions**:
1. Verify Java 21+ is installed
2. Check emulator logs in CI output
3. Review port conflicts
4. Check emulator health in debug steps

## Artifacts

The pipeline generates several artifacts:

- **Test Results**: Playwright HTML reports and screenshots
- **Test Metrics**: JSON file with test analytics
- **Failure Analysis**: Categorized failure report
- **Performance Reports**: Performance test results

Artifacts are retained for:
- Test results: 30 days
- Screenshots: 7 days
- Metrics: 30 days
- Failure analysis: 7 days

## Monitoring

### Job Summaries

Each job generates a summary with:
- Job status
- Cache hit/miss information
- Test execution details
- Performance metrics

### Test Analytics

The test analytics action provides:
- Total tests, passed, failed, skipped
- Flaky test identification
- Slow test detection (> 30s)
- Failure pattern categorization

### Failure Analysis

The failure analysis action provides:
- Failure categorization (timeout, assertion, network, element, other)
- Suggested fixes per failure type
- Test-specific recommendations

## Best Practices

1. **Tag Tests Appropriately**: Use tags for selective test execution
2. **Use Fast Tests for Quick Feedback**: Tag critical path tests with @fast and @smoke
3. **Monitor Flaky Tests**: Review test analytics regularly
4. **Optimize Caching**: Ensure cache keys are stable and meaningful
5. **Review Failure Patterns**: Use failure analysis to identify systemic issues
6. **Performance Budgets**: Monitor performance test results for regressions

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright CI/CD Guide](https://playwright.dev/docs/ci)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

