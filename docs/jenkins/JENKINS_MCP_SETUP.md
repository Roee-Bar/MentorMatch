# Jenkins MCP Server Configuration for Cursor IDE

This guide explains how to configure Cursor IDE to connect to your Jenkins MCP server running at `http://localhost:8080`.

## Quick Start

1. **Install Jenkins MCP Server Plugin** in Jenkins (Manage Jenkins > Manage Plugins)
2. **Configuration file location**: `C:/users/barro/.cursor/mcp.json` (already configured!)
3. **Add authentication** (see Step 3 below) if your Jenkins requires it
4. **Restart Cursor** to apply changes

**Configuration Added** (in `C:/users/barro/.cursor/mcp.json`):

```json
{
  "jenkins": {
    "autoApprove": [],
    "disabled": false,
    "timeout": 60,
    "type": "streamableHttp",
    "url": "http://localhost:8080/mcp-server/mcp"
  }
}
```

**Note**: Based on the [official Jenkins MCP Server Plugin documentation](https://plugins.jenkins.io/mcp-server/), the endpoint is `/mcp-server/mcp` for streamable HTTP transport.

## Prerequisites

1. **Jenkins MCP Server Plugin** must be installed in your Jenkins instance
   - Navigate to `http://localhost:8080`
   - Go to **Manage Jenkins** > **Manage Plugins**
   - Search for "MCP Server" in the **Available** tab
   - Install the plugin (version 0.86.v7d3355e6a or later for security)
   - Restart Jenkins if required

2. **Verify MCP Server is Running**
   - After installation, the MCP server should be accessible at your Jenkins URL
   - The default endpoint is typically at `http://localhost:8080/mcp` or similar

## Cursor IDE Configuration

### Step 1: Access Cursor MCP Settings

1. Open Cursor IDE
2. Go to **Settings** (or press `Ctrl+,` on Windows)
3. Search for "MCP" or "Model Context Protocol"
4. Navigate to the MCP servers configuration section

Alternatively, you can directly edit the MCP configuration file:
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- Or check Cursor's settings directory for MCP configuration files

### Step 2: Add Jenkins MCP Configuration

According to the [official Jenkins MCP Server Plugin documentation](https://plugins.jenkins.io/mcp-server/), the plugin provides three endpoints:

* **Streamable HTTP Endpoint**: `<jenkins-url>/mcp-server/mcp` (recommended for Cursor/Cline)
* **SSE Endpoint**: `<jenkins-url>/mcp-server/sse`
* **Message Endpoint**: `<jenkins-url>/mcp-server/message`

For Cursor (which uses Cline), use the **streamableHttp** type:

```json
{
  "mcpServers": {
    "jenkins": {
      "autoApprove": [],
      "disabled": false,
      "timeout": 60,
      "type": "streamableHttp",
      "url": "http://localhost:8080/mcp-server/mcp"
    }
  }
}
```

**Configuration Location**: `C:/users/barro/.cursor/mcp.json`

**Note**: This configuration has already been added to your MCP settings file!

### Step 3: Authentication (if required)

If your Jenkins instance requires authentication, you need to add an `Authorization` header with Basic authentication. According to the [official documentation](https://plugins.jenkins.io/mcp-server/), use Basic Auth with your username and API token.

#### Generate a Jenkins API Token

1. Sign in to Jenkins at `http://localhost:8080`
2. Click your user icon in the upper-right corner
3. Select **Security**
4. Click **Add new token**
5. Enter a name to distinguish the token
6. Click **Generate**
7. **Copy the token immediately** (you won't see it again!)
8. Click **Done** and **Save**

#### Encode Credentials for HTTP Basic Authentication

You need to Base64 encode your `username:token` combination.

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("YOUR_USERNAME:YOUR_TOKEN"))
```

Replace `YOUR_USERNAME` and `YOUR_TOKEN` with your actual Jenkins username and the API token you just generated.

**Example output:**
```
dXNlcm5hbWU6dG9rZW4=
```

#### Add Authentication to Configuration

Update your `C:/users/barro/.cursor/mcp.json` file to include the Authorization header:

```json
{
  "mcpServers": {
    "jenkins": {
      "autoApprove": [],
      "disabled": false,
      "timeout": 60,
      "type": "streamableHttp",
      "url": "http://localhost:8080/mcp-server/mcp",
      "headers": {
        "Authorization": "Basic dXNlcm5hbWU6dG9rZW4="
      }
    }
  }
}
```

Replace `dXNlcm5hbWU6dG9rZW4=` with your actual Base64-encoded credentials.

**Security Note**: Base64 encoding is NOT encryption. Anyone with access to the encoded string can decode it. Always protect your credentials!

## Verification

After adding the configuration:

1. Restart Cursor IDE
2. Check the MCP status in Cursor's settings
3. You should see Jenkins MCP server listed as connected
4. Test by asking Cursor to interact with Jenkins (e.g., "List Jenkins jobs" or "Get build status")

## Available MCP Tools

According to the [official documentation](https://plugins.jenkins.io/mcp-server/), the plugin provides the following built-in tools:

### Job Management
- `getJob` - Get a Jenkins job by its full path
- `getJobs` - Get a paginated list of Jenkins jobs, sorted by name
- `triggerBuild` - Trigger a build of a job (supports parameterized builds)

### Build Information
- `getBuild` - Retrieve a specific build or the last build of a Jenkins job
- `updateBuild` - Update build display name and/or description
- `getBuildLog` - Retrieve log lines with pagination for a specific build or the last build
- `searchBuildLog` - Search for log lines matching a pattern (string or regex) in build logs

### SCM Integration
- `getJobScm` - Retrieve SCM configurations of a Jenkins job
- `getBuildScm` - Retrieve SCM configurations of a specific build
- `getBuildChangeSets` - Retrieve change log sets of a specific build

### Management Information
- `whoAmI` - Get information about the current user
- `getStatus` - Checks the health and readiness status of a Jenkins instance

Each tool accepts specific parameters. Use MCP introspection capabilities or refer to the [plugin documentation](https://plugins.jenkins.io/mcp-server/) for detailed usage instructions.

## Troubleshooting

### Connection Issues

1. **Verify Jenkins is running**: Check `http://localhost:8080` in your browser
2. **Check MCP Server Plugin**: Ensure it's installed and enabled in Jenkins
3. **Check firewall**: Ensure port 8080 is accessible
4. **Check logs**: Review Cursor's MCP connection logs for errors

### Authentication Issues

1. **Verify credentials**: Ensure username and token/password are correct
2. **Check permissions**: Ensure your Jenkins user has necessary permissions
3. **API Token**: Prefer API tokens over passwords for security

### Plugin Issues

1. **Update plugin**: Ensure you have version 0.86.v7d3355e6a or later
2. **Restart Jenkins**: Some plugin changes require a restart
3. **Check plugin logs**: Review Jenkins logs for MCP Server Plugin errors

## Security Notes

- **Never commit credentials** to version control
- Use **API tokens** instead of passwords when possible
- Keep the **MCP Server Plugin updated** to avoid security vulnerabilities
- The plugin version 0.86.v7d3355e6a or later addresses CVE-2025-64132

## References

- [Jenkins MCP Server Plugin Documentation](https://plugins.jenkins.io/mcp-server/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Cursor IDE Documentation](https://cursor.sh/docs)

