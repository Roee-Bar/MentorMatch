# Automated Jenkins Setup Guide

This guide provides automated setup options for Jenkins CI/CD pipeline.

## Option 1: Docker Compose (Recommended for Local Testing)

### Quick Start

1. **Start Jenkins with Docker Compose:**
   ```bash
   docker-compose -f docker-compose.jenkins.yml up -d
   ```

2. **Get initial admin password:**
   ```bash
   docker exec mentor-match-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```

3. **Access Jenkins:**
   - Open http://localhost:8080
   - Enter the password from step 2
   - Install suggested plugins
   - Create admin user

4. **Run setup script:**
   ```bash
   export JENKINS_URL=http://localhost:8080
   export JENKINS_PASSWORD=<your-password>
   export REPO_URL=<your-git-repo-url>
   bash scripts/setup-jenkins.sh
   ```

### Stop Jenkins

```bash
docker-compose -f docker-compose.jenkins.yml down
```

### Persist Data

Jenkins data is stored in Docker volume `jenkins_home`. To remove all data:

```bash
docker-compose -f docker-compose.jenkins.yml down -v
```

## Option 2: Manual Setup with Automation Scripts

### Prerequisites

- Jenkins server running and accessible
- Jenkins admin credentials
- Git repository URL

### Step 1: Install Plugins

**Using Script (Linux/Mac):**
```bash
export JENKINS_URL=http://localhost:8080
export JENKINS_PASSWORD=<your-password>
bash scripts/install-jenkins-plugins.sh
```

**Or manually:**
1. Go to Jenkins → Manage Jenkins → Plugins
2. Install these plugins:
   - Pipeline
   - Git
   - NodeJS Plugin
   - HTML Publisher Plugin
   - Credentials Binding Plugin
   - Email Extension Plugin (optional)

### Step 2: Configure Node.js

1. Go to Jenkins → Manage Jenkins → Global Tool Configuration
2. Find "NodeJS" section
3. Add installation:
   - Name: `NodeJS-18`
   - Version: `18.x` (or latest LTS)
   - ✓ Install automatically

### Step 3: Create Pipeline Job

**Using Script (Linux/Mac):**
```bash
export JENKINS_URL=http://localhost:8080
export JENKINS_PASSWORD=<your-password>
export REPO_URL=<your-git-repo-url>
bash scripts/setup-jenkins.sh
```

**Using Script (Windows PowerShell):**
```powershell
$env:JENKINS_URL = "http://localhost:8080"
$env:JENKINS_PASSWORD = "<your-password>"
$env:REPO_URL = "<your-git-repo-url>"
powershell -ExecutionPolicy Bypass -File scripts\setup-jenkins.ps1
```

**Or manually:**
1. Jenkins Dashboard → New Item
2. Name: `MentorMatch E2E Tests`
3. Type: Pipeline
4. Pipeline section:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: Your repo URL
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`

### Step 4: Configure Report Portal (Optional)

1. Go to Jenkins → Manage Jenkins → Credentials
2. Add credential:
   - **Kind**: Secret text
   - **ID**: `reportportal-endpoint`
   - **Secret**: Your Report Portal URL
3. Add another credential:
   - **Kind**: Secret text
   - **ID**: `reportportal-token`
   - **Secret**: Your Report Portal API token

### Step 5: Run First Build

1. Go to Jenkins job: `MentorMatch E2E Tests`
2. Click "Build Now"
3. Monitor build progress
4. View results when complete

## Option 3: Jenkins Configuration as Code (JCasC)

For advanced setups, you can use Jenkins Configuration as Code:

1. Install Configuration as Code plugin
2. Create `jenkins.yaml` configuration file
3. Apply configuration via Jenkins UI or API

## Verification

After setup, verify everything works:

1. **Check job exists:**
   ```bash
   curl -u admin:password http://localhost:8080/job/MentorMatch%20E2E%20Tests/config.xml
   ```

2. **Trigger build:**
   ```bash
   curl -X POST -u admin:password http://localhost:8080/job/MentorMatch%20E2E%20Tests/build
   ```

3. **Check build status:**
   ```bash
   curl -u admin:password http://localhost:8080/job/MentorMatch%20E2E%20Tests/lastBuild/api/json
   ```

## Troubleshooting

### Script Fails to Connect

- Verify Jenkins is running: `curl http://localhost:8080/login`
- Check Jenkins URL is correct
- Verify credentials are correct

### Job Creation Fails

- Check Jenkins logs: `docker logs mentor-match-jenkins`
- Verify Git plugin is installed
- Check repository URL is accessible

### Plugins Not Installing

- Restart Jenkins after plugin installation
- Check Jenkins plugin manager for errors
- Verify network connectivity

## Next Steps

After successful setup:

1. Configure scheduled builds (if needed)
2. Set up email notifications
3. Configure webhooks for automatic builds
4. Review test results regularly

## Additional Resources

- [Quick Start Guide](./QUICK_START.md) - Manual setup steps
- [Complete Setup Guide](./JENKINS_SETUP.md) - Detailed documentation
- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)

