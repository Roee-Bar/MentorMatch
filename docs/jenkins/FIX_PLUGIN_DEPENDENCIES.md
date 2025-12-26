# Fixing Jenkins Plugin Dependency Errors

This guide helps resolve plugin dependency issues in Jenkins, specifically the Git plugin dependency error.

## Quick Fix: Use the "Correct" Button

The easiest way to fix dependency errors is to use Jenkins' built-in correction feature:

1. **On the error page**, click the blue **"Correct"** button in the top right of the red error box
2. Jenkins will automatically install missing dependencies
3. **Restart Jenkins** when prompted:
   - Docker: `docker restart mentor-match-jenkins`
   - Or visit: `http://localhost:8080/safeRestart`

## Manual Fix: Install Missing Plugin

If the "Correct" button doesn't work, install the missing plugin manually:

### Option 1: Via Jenkins UI

1. Go to **Manage Jenkins → Plugins**
2. Click the **"Available"** tab
3. Search for **"Git Client Plugin"**
4. Check the box next to it
5. Click **"Install without restart"** or **"Download now and install after restart"**
6. Wait for installation to complete
7. **Restart Jenkins**:
   - Docker: `docker restart mentor-match-jenkins`
   - Or visit: `http://localhost:8080/safeRestart`

### Option 2: Via Jenkins CLI

```bash
# Download Jenkins CLI if needed
curl -o jenkins-cli.jar http://localhost:8080/jnlpJars/jenkins-cli.jar

# Install git-client plugin
java -jar jenkins-cli.jar -s http://localhost:8080 \
    -auth admin:<your-password> \
    install-plugin git-client -deploy

# Restart Jenkins
java -jar jenkins-cli.jar -s http://localhost:8080 \
    -auth admin:<your-password> \
    safe-restart
```

### Option 3: Using the Updated Script

The plugin installation script has been updated to include `git-client`. Run:

```bash
export JENKINS_URL=http://localhost:8080
export JENKINS_PASSWORD=<your-password>
bash scripts/install-jenkins-plugins.sh
```

## Verify Fix

After restarting Jenkins:

1. Go to **Manage Jenkins**
2. Check that the red error box is gone
3. Verify plugins are loaded:
   - Go to **Manage Jenkins → Plugins → Installed**
   - Search for "Git" - should show as installed
   - Search for "Git Client" - should show as installed

## Common Dependency Issues

### Git Plugin Dependencies

The Git plugin requires:
- **git-client** (version 6.4.0 or compatible)
- **scm-api** (usually installed automatically)

### Pipeline Plugin Dependencies

The Pipeline plugin requires:
- **workflow-aggregator** (includes all pipeline plugins)
- **git** (for SCM checkout)

## Prevention

To avoid dependency issues in the future:

1. **Install plugins via the UI** - Jenkins automatically handles dependencies
2. **Use the updated plugin script** - It includes all required dependencies
3. **Install workflow-aggregator first** - It includes most pipeline-related plugins
4. **Always restart Jenkins** after installing plugins

## Troubleshooting

### "Correct" Button Doesn't Work

- Check Jenkins logs for errors
- Try installing the plugin manually
- Verify Jenkins has internet access to download plugins

### Plugin Still Shows as Failed After Installation

1. Go to **Manage Jenkins → Plugins → Installed**
2. Find the failed plugin
3. Click **"Uninstall"**
4. Restart Jenkins
5. Reinstall the plugin (it should pull in dependencies)

### Jenkins Won't Restart

- Check if any builds are running
- Use `safe-restart` instead of `restart`
- For Docker: `docker restart mentor-match-jenkins`

## Additional Resources

- [Jenkins Plugin Installation Guide](https://www.jenkins.io/doc/book/managing/plugins/)
- [Plugin Dependency Resolution](https://www.jenkins.io/doc/developer/plugin-development/dependency-management/)

