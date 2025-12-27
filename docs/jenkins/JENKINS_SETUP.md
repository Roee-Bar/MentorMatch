# Jenkins Setup Guide

This guide covers setting up Jenkins CI/CD pipeline for MentorMatch E2E testing.

## Prerequisites

- Jenkins server installed and running
- Node.js 18+ available on Jenkins agents
- Git repository access configured
- (Optional) Report Portal instance for test reporting

## Required Jenkins Plugins

Install the following plugins via Jenkins Plugin Manager:

1. **Pipeline** - For Jenkinsfile support
2. **NodeJS Plugin** - For Node.js installation
3. **HTML Publisher Plugin** - For test report publishing
4. **Credentials Binding Plugin** - For secure credential management
5. **Email Extension Plugin** - For email notifications (optional)

## Pipeline Configuration

### 1. Create Jenkins Job

1. Go to Jenkins dashboard
2. Click "New Item"
3. Enter job name (e.g., "MentorMatch E2E Tests")
4. Select "Pipeline"
5. Click "OK"

### 2. Configure Pipeline

1. In job configuration, scroll to "Pipeline" section
2. Select "Pipeline script from SCM"
3. Choose your SCM (Git)
4. Enter repository URL
5. Set branch to `*/main` (or your default branch)
6. Script Path: `Jenkinsfile`
7. Save

### 3. Configure Node.js

1. Go to Jenkins → Manage Jenkins → Global Tool Configuration
2. Find "NodeJS" section
3. Add Node.js installation:
   - Name: `NodeJS-18`
   - Version: `18.x` (or latest LTS)
   - Install automatically: ✓

### 4. Configure Credentials (for Report Portal)

If using Report Portal:

1. Go to Jenkins → Manage Jenkins → Credentials
2. Add credentials:
   - **Kind**: Secret text
   - **ID**: `reportportal-endpoint`
   - **Secret**: Your Report Portal URL (e.g., `https://your-rp-instance.com`)
3. Add another credential:
   - **Kind**: Secret text
   - **ID**: `reportportal-token`
   - **Secret**: Your Report Portal authentication token

## Pipeline Stages

The pipeline includes the following stages:

### 1. Checkout
- Checks out source code from repository
- Extracts Git branch and commit information

### 2. Install Dependencies
- Runs `npm ci` for clean install
- Installs Playwright browsers with `npx playwright install --with-deps`

### 3. Build
- Runs `npm run build` to build Next.js application
- Verifies build succeeds before running tests

### 4. Run E2E Tests
- Runs `npm run test:e2e`
- Sets CI environment variables
- Archives test results and HTML reports

### 5. Post-Build Actions
- Archives test artifacts (`playwright-report/`, `test-results/`)
- Publishes HTML test report
- Cleans workspace

## Environment Variables

The pipeline uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_VERSION` | Node.js version | `18` |
| `E2E_BASE_URL` | Base URL for E2E tests | `http://localhost:3000` |
| `CI` | CI environment flag | `true` |
| `NODE_ENV` | Environment | `test` |
| `RP_ENDPOINT` | Report Portal URL | (from credentials) |
| `RP_TOKEN` | Report Portal token | (from credentials) |
| `RP_PROJECT` | Report Portal project | `mentormatch` |

## Test Execution

### Automatic Execution

Pipeline runs automatically on:
- Push to main branch (if configured)
- Manual trigger
- Scheduled builds (if configured)

### Manual Execution

1. Go to Jenkins job
2. Click "Build Now"
3. Monitor build progress in console output

### Viewing Results

1. Go to build page
2. Click "Playwright E2E Test Report" link (in sidebar)
3. View HTML report with test results, screenshots, and videos

## Troubleshooting

### Build Fails at Install Stage

- Verify Node.js is installed and configured
- Check npm version compatibility
- Ensure network access for package downloads

### Tests Fail

- Check console output for error messages
- Verify Firebase environment variables are set
- Ensure test accounts exist in Firebase
- Check HTML report for screenshots/videos

### Report Portal Not Working

- Verify credentials are configured correctly
- Check Report Portal server is accessible
- Verify token has correct permissions
- Check pipeline logs for Report Portal errors

### Browser Installation Fails

- Ensure sufficient disk space
- Check network connectivity
- Verify Playwright version compatibility

## Email Notifications

To enable email notifications on failure:

1. Install Email Extension Plugin
2. Uncomment email section in Jenkinsfile `post { failure { } }` block
3. Configure SMTP in Jenkins → Configure System → E-mail Notification
4. Set recipient email addresses

## Scheduled Builds

To run tests on a schedule:

1. In job configuration, check "Build periodically"
2. Enter cron expression (e.g., `H 2 * * *` for daily at 2 AM)
3. Save

## Best Practices

1. **Use Credentials**: Never hardcode secrets in Jenkinsfile
2. **Clean Workspace**: Always clean workspace in post-build
3. **Archive Artifacts**: Archive test reports for debugging
4. **Monitor Builds**: Set up notifications for failed builds
5. **Version Control**: Keep Jenkinsfile in repository

## Additional Resources

- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Playwright CI/CD Guide](https://playwright.dev/docs/ci)
- [Report Portal Setup Guide](../testing/REPORT_PORTAL_SETUP.md)

