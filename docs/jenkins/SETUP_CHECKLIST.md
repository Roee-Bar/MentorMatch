# Jenkins Setup Checklist

Use this checklist to ensure complete Jenkins setup for MentorMatch E2E tests.

## Prerequisites

- [ ] Jenkins server installed and running
- [ ] Jenkins accessible (default: http://localhost:8080)
- [ ] Jenkins admin credentials available
- [ ] Git repository URL available
- [ ] Node.js 18+ available (or will be installed via Jenkins)

## Initial Jenkins Setup

- [ ] Jenkins started and accessible
- [ ] Initial admin password retrieved
- [ ] Admin user created (or using default admin)
- [ ] Jenkins fully configured

## Plugin Installation

- [ ] Pipeline plugin installed
- [ ] Git plugin installed
- [ ] NodeJS Plugin installed
- [ ] HTML Publisher Plugin installed
- [ ] Credentials Binding Plugin installed
- [ ] Email Extension Plugin installed (optional)
- [ ] Jenkins restarted after plugin installation

## Tool Configuration

- [ ] Node.js tool configured in Global Tool Configuration
  - [ ] Name: `NodeJS-18`
  - [ ] Version: `18.x` or latest LTS
  - [ ] Install automatically: ✓

## Credentials Setup (Optional - for Report Portal)

- [ ] Report Portal endpoint credential created
  - [ ] ID: `reportportal-endpoint`
  - [ ] Type: Secret text
  - [ ] Value: Report Portal URL
- [ ] Report Portal token credential created
  - [ ] ID: `reportportal-token`
  - [ ] Type: Secret text
  - [ ] Value: Report Portal API token

## Pipeline Job Creation

- [ ] Pipeline job created
  - [ ] Name: `MentorMatch E2E Tests`
  - [ ] Type: Pipeline
  - [ ] SCM: Git
  - [ ] Repository URL: Configured
  - [ ] Branch: `*/main` (or your default branch)
  - [ ] Script Path: `Jenkinsfile`

## First Build

- [ ] First build triggered
- [ ] Build completed successfully
- [ ] Test results visible
- [ ] HTML report accessible
- [ ] Report Portal results visible (if configured)

## Verification

- [ ] All pipeline stages execute:
  - [ ] Checkout
  - [ ] Install Dependencies
  - [ ] Build
  - [ ] Run E2E Tests
- [ ] Test artifacts archived
- [ ] HTML report published
- [ ] No build errors

## Post-Setup Configuration (Optional)

- [ ] Scheduled builds configured (if needed)
- [ ] Email notifications configured (if needed)
- [ ] Webhooks configured for automatic builds (if needed)
- [ ] Build badges/widgets added to repository (if needed)

## Documentation

- [ ] Team members have access to:
  - [ ] Quick Start Guide
  - [ ] Complete Setup Guide
  - [ ] E2E Testing Guide
  - [ ] Report Portal Setup Guide

## Troubleshooting

If any step fails:

1. Check Jenkins logs
2. Review pipeline console output
3. Verify all prerequisites are met
4. Consult troubleshooting sections in documentation
5. Check [SETUP_RESULTS.md](./SETUP_RESULTS.md) for common issues

## Quick Commands

### Start Jenkins (Docker)
```bash
npm run jenkins:start
```

### Stop Jenkins (Docker)
```bash
npm run jenkins:stop
```

### Setup Jenkins Job
```bash
npm run jenkins:setup
```

### Validate Setup
```bash
npm run test:validate-setup
```

### Test Pipeline Locally
```bash
npm run test:pipeline-local
```

## Success Criteria

✅ Setup is complete when:
- All checklist items are checked
- First build completes successfully
- Test results are visible and accessible
- Team can trigger builds manually or automatically

