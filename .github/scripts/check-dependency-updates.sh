#!/bin/bash
# Check for updates to CI/CD dependencies
# This script checks for newer versions of GitHub Actions and tools

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config/dependencies.yml"
TEMP_FILE=$(mktemp)

echo "Checking for dependency updates..."
echo ""

# Check GitHub Actions versions
check_action_version() {
  local action_name=$1
  local current_version=$2
  local repo_url=$3
  
  # Extract owner/repo from URL
  local repo=$(echo "$repo_url" | sed 's|https://github.com/||')
  
  # Get latest release tag using GitHub API
  local latest=$(curl -s "https://api.github.com/repos/$repo/releases/latest" | \
    grep '"tag_name":' | \
    sed -E 's/.*"tag_name": "([^"]+)".*/\1/' | \
    head -1)
  
  if [ -z "$latest" ]; then
    # Try to get latest tag if no releases
    latest=$(curl -s "https://api.github.com/repos/$repo/tags" | \
      grep '"name":' | \
      sed -E 's/.*"name": "([^"]+)".*/\1/' | \
      head -1)
  fi
  
  if [ -n "$latest" ] && [ "$latest" != "$current_version" ]; then
    echo "⚠️  $action_name: $current_version → $latest (update available)"
    return 1
  else
    echo "✅ $action_name: $current_version (up to date)"
    return 0
  fi
}

# Check npm package versions
check_npm_version() {
  local package_name=$1
  local current_version=$2
  
  # Remove ^ or ~ prefix for comparison
  local clean_version=$(echo "$current_version" | sed 's/^[^0-9]*//')
  
  # Get latest version from npm
  local latest=$(npm view "$package_name" version 2>/dev/null || echo "")
  
  if [ -n "$latest" ] && [ "$latest" != "$clean_version" ]; then
    echo "⚠️  $package_name: $current_version → $latest (update available)"
    return 1
  else
    echo "✅ $package_name: $current_version (up to date)"
    return 0
  fi
}

# Parse YAML and check versions (simplified)
UPDATES_FOUND=0

# Check GitHub Actions
echo "GitHub Actions:"
check_action_version "actions/checkout" "v4" "https://github.com/actions/checkout" || UPDATES_FOUND=1
check_action_version "actions/cache" "v4" "https://github.com/actions/cache" || UPDATES_FOUND=1
check_action_version "actions/setup-node" "v4" "https://github.com/actions/setup-node" || UPDATES_FOUND=1
check_action_version "actions/setup-java" "v4" "https://github.com/actions/setup-java" || UPDATES_FOUND=1
check_action_version "actions/upload-artifact" "v4" "https://github.com/actions/upload-artifact" || UPDATES_FOUND=1
check_action_version "actions/download-artifact" "v4" "https://github.com/actions/download-artifact" || UPDATES_FOUND=1
check_action_version "actions/dependency-review-action" "v4" "https://github.com/actions/dependency-review-action" || UPDATES_FOUND=1

echo ""
echo "NPM Packages:"

# Check npm packages (requires npm to be available)
if command -v npm &> /dev/null; then
  check_npm_version "firebase-tools" "^15.1.0" || UPDATES_FOUND=1
  check_npm_version "@playwright/test" "^1.57.0" || UPDATES_FOUND=1
else
  echo "⚠️  npm not found, skipping npm package checks"
fi

echo ""
if [ $UPDATES_FOUND -eq 0 ]; then
  echo "✅ All dependencies are up to date!"
  exit 0
else
  echo "⚠️  Some dependencies have updates available"
  echo "Review the versions above and update dependencies.yml if needed"
  exit 1
fi

