# Jenkins Quick Start Guide

Quick setup guide to get Jenkins pipeline running for MentorMatch E2E tests.

## Prerequisites Check

Run the validation script:

```bash
bash scripts/validate-jenkins-setup.sh
```

Or on Windows (PowerShell):

```powershell
# Check Node.js
node --version  # Should be 18+

# Check npm
npm --version

# Check files exist
Test-Path Jenkinsfile
Test-Path playwright.config.ts
```

## 5-Minute Setup

### 1. Install Jenkins Plugins (2 minutes)

1. Go to Jenkins → Manage Jenkins → Plugins
2. Install these plugins:
   - NodeJS Plugin
   - HTML Publisher Plugin
   - Credentials Binding Plugin

### 2. Configure Node.js (1 minute)

1. Go to Jenkins → Manage Jenkins → Global Tool Configuration
2. Find "NodeJS" section
3. Add installation:
   - Name: `NodeJS-18`
   - Version: `18.x` (or latest LTS)
   - ✓ Install automatically

### 3. Create Pipeline Job (1 minute)

1. Jenkins Dashboard → New Item
2. Name: `MentorMatch E2E Tests`
3. Type: Pipeline
4. Pipeline section:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: Your repo URL
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`

### 4. Run First Build (1 minute)

1. Click "Build Now"
2. Watch the build progress
3. Check results when complete

## Verify Setup

After first build:

- [ ] Build completes successfully
- [ ] "Playwright E2E Test Report" link appears in sidebar
- [ ] Click link to view HTML report

## Optional: Report Portal Setup

If you want Report Portal integration:

1. Set up Report Portal instance (or use existing)
2. Generate API token in Report Portal
3. Create Jenkins credentials:
   - `reportportal-endpoint`: Your RP URL
   - `reportportal-token`: Your RP API token
4. Run pipeline again - results will appear in Report Portal

See [REPORT_PORTAL_SETUP.md](../testing/REPORT_PORTAL_SETUP.md) for details.

## Troubleshooting

**Build fails at "Install Dependencies":**
- Check Node.js is configured in Global Tool Configuration
- Verify npm is available

**Tests fail:**
- Ensure Firebase environment variables are set in Jenkins
- Check test accounts exist in Firebase
- Review HTML report for error details

**Report Portal not working:**
- Verify credentials are set correctly
- Check Report Portal server is accessible
- Review pipeline logs for errors

## Next Steps

- Set up scheduled builds (daily/weekly)
- Configure email notifications
- Review test results regularly
- Expand test coverage

## Full Documentation

- [Complete Jenkins Setup Guide](./JENKINS_SETUP.md)
- [E2E Testing Guide](../testing/E2E_TESTING_GUIDE.md)
- [Report Portal Setup](../testing/REPORT_PORTAL_SETUP.md)

