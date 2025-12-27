# Jenkins Setup Quick Reference

Quick commands and links for Jenkins CI/CD setup.

## Quick Commands

### Validation & Testing
```bash
# Validate setup
npm run test:validate-setup

# Test pipeline locally
npm run test:pipeline-local
```

### Jenkins Docker Setup
```bash
# Start Jenkins
npm run jenkins:start

# Stop Jenkins
npm run jenkins:stop

# View logs
docker logs mentor-match-jenkins

# Get admin password
docker exec mentor-match-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### Jenkins Job Setup
```bash
# Automated setup (Linux/Mac)
export JENKINS_URL=http://localhost:8080
export JENKINS_PASSWORD=<password>
export REPO_URL=<your-repo-url>
bash scripts/setup-jenkins.sh

# Automated setup (Windows)
$env:JENKINS_URL = "http://localhost:8080"
$env:JENKINS_PASSWORD = "<password>"
$env:REPO_URL = "<your-repo-url>"
powershell -ExecutionPolicy Bypass -File scripts\setup-jenkins.ps1
```

### Plugin Installation
```bash
# Install required plugins
export JENKINS_URL=http://localhost:8080
export JENKINS_PASSWORD=<password>
bash scripts/install-jenkins-plugins.sh
```

## Jenkins URLs

- **Jenkins Dashboard**: http://localhost:8080
- **Job Configuration**: http://localhost:8080/job/MentorMatch%20E2E%20Tests/configure
- **Build History**: http://localhost:8080/job/MentorMatch%20E2E%20Tests/
- **Global Tools**: http://localhost:8080/configureTools
- **Credentials**: http://localhost:8080/credentials
- **Plugin Manager**: http://localhost:8080/pluginManager

## Required Plugins

- Pipeline
- Git
- NodeJS Plugin
- HTML Publisher Plugin
- Credentials Binding Plugin
- Email Extension Plugin (optional)

## Environment Variables

### Jenkins Pipeline
```groovy
NODE_VERSION = '18'
E2E_BASE_URL = 'http://localhost:3000'
CI = 'true'
NODE_ENV = 'test'
```

### Report Portal (Optional)
```groovy
RP_ENDPOINT = credentials('reportportal-endpoint')
RP_TOKEN = credentials('reportportal-token')
RP_PROJECT = 'mentormatch'
```

## Setup Checklist

- [ ] Jenkins running and accessible
- [ ] Plugins installed
- [ ] Node.js tool configured (version 18+)
- [ ] Pipeline job created
- [ ] Report Portal credentials set (optional)
- [ ] First build successful
- [ ] Test results visible

## Troubleshooting

### Cannot Connect to Jenkins
```bash
# Check if Jenkins is running
docker ps | grep jenkins

# Check Jenkins logs
docker logs mentor-match-jenkins

# Restart Jenkins
docker restart mentor-match-jenkins
```

### Build Fails
```bash
# Check build logs in Jenkins UI
# Or via API:
curl -u admin:password http://localhost:8080/job/MentorMatch%20E2E%20Tests/lastBuild/consoleText
```

### Plugin Issues
```bash
# Restart Jenkins after plugin installation
docker restart mentor-match-jenkins
# Or use safe restart:
curl -X POST http://localhost:8080/safeRestart
```

## Documentation Links

- [Automated Setup](./AUTOMATED_SETUP.md) - Docker and automation
- [Quick Start](./QUICK_START.md) - 5-minute setup
- [Complete Guide](./JENKINS_SETUP.md) - Detailed documentation
- [Setup Checklist](./SETUP_CHECKLIST.md) - Verification
- [E2E Testing Guide](../testing/E2E_TESTING_GUIDE.md) - Test documentation

## Common Tasks

### Trigger Build via API
```bash
curl -X POST -u admin:password \
  http://localhost:8080/job/MentorMatch%20E2E%20Tests/build
```

### Check Build Status
```bash
curl -u admin:password \
  http://localhost:8080/job/MentorMatch%20E2E%20Tests/lastBuild/api/json
```

### View Test Report
After build completes, click "Playwright E2E Test Report" link in Jenkins job page.

## Next Steps After Setup

1. Configure scheduled builds (if needed)
2. Set up email notifications
3. Configure webhooks for automatic builds
4. Review and expand test coverage

