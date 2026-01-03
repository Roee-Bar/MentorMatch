#!/usr/bin/env node
/**
 * Load CI Configuration Script
 * Parses ci-config.yml and exports values as environment variables
 */

const fs = require('fs');
const path = require('path');

// Try to use yaml package if available, otherwise use simple parser
let parseYaml;
try {
  const yaml = require('yaml');
  parseYaml = yaml.parse;
} catch (e) {
  // Fallback: simple YAML parser for our specific structure
  parseYaml = (content) => {
    const config = {};
    const lines = content.split('\n');
    let currentSection = null;
    let currentSubsection = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Section header (e.g., "versions:")
      if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
        currentSection = trimmed.slice(0, -1);
        config[currentSection] = {};
        currentSubsection = null;
        continue;
      }
      
      // Key-value pair
      const match = trimmed.match(/^(\w+):\s*(.+)$/);
      if (match && currentSection) {
        const key = match[1];
        let value = match[2].trim();
        
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Handle arrays (multiline with -)
        if (value === '' && lines[lines.indexOf(line) + 1]?.trim().startsWith('-')) {
          const array = [];
          let i = lines.indexOf(line) + 1;
          while (i < lines.length && lines[i].trim().startsWith('-')) {
            const item = lines[i].trim().slice(1).trim();
            array.push(item.replace(/^["']|["']$/g, ''));
            i++;
          }
          value = array;
        } else {
          // Try to parse as number or boolean
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (/^\d+$/.test(value)) value = parseInt(value, 10);
          else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
        }
        
        if (currentSubsection) {
          config[currentSection][currentSubsection][key] = value;
        } else {
          config[currentSection][key] = value;
        }
      }
    }
    
    return config;
  };
}

function flattenConfig(obj, prefix = '') {
  const exports = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const envKey = prefix 
      ? `${prefix}_${key.toUpperCase().replace(/-/g, '_')}` 
      : key.toUpperCase().replace(/-/g, '_');
    
    if (value === null || value === undefined) {
      continue;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively handle nested objects
      exports.push(...flattenConfig(value, envKey));
    } else if (Array.isArray(value)) {
      // Handle arrays - join with space for paths, or newline for multiline
      const arrayValue = value.join(' ');
      exports.push(`${envKey}="${arrayValue.replace(/"/g, '\\"')}"`);
    } else {
      // Handle primitive values
      const stringValue = String(value).replace(/"/g, '\\"').replace(/\n/g, '\\n');
      exports.push(`${envKey}="${stringValue}"`);
    }
  }
  
  return exports;
}

// Main execution
const configPath = process.argv[2] || '.github/config/ci-config.yml';
const githubEnvPath = process.env.GITHUB_ENV;

if (!fs.existsSync(configPath)) {
  console.error(`ERROR: Configuration file not found at ${configPath}`);
  process.exit(1);
}

try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = parseYaml(configContent);
  
  // Flatten and export
  const exports = flattenConfig(config);
  
  // Write to GITHUB_ENV
  if (githubEnvPath) {
    const envExports = exports.map(exp => {
      // Convert to GitHub Actions env format: KEY=value
      const match = exp.match(/^(\w+)="(.+)"$/);
      if (match) {
        return `${match[1]}=${match[2]}`;
      }
      return exp;
    });
    
    fs.appendFileSync(githubEnvPath, envExports.join('\n') + '\n');
  }
  
  // Output summary
  console.log('✓ Configuration loaded successfully');
  console.log(`  Exported ${exports.length} environment variables`);
  
  // Show key variables for verification
  const keyVars = ['NODE_VERSION', 'JAVA_VERSION', 'PROJECT_ID', 'PORTS_NEXTJS', 'TIMEOUTS_LINT'];
  keyVars.forEach(key => {
    const match = exports.find(e => e.startsWith(key + '='));
    if (match) {
      console.log(`  ${key}=${match.split('=')[1]?.replace(/^"|"$/g, '') || 'N/A'}`);
    }
  });
  
} catch (error) {
  console.error(`ERROR: Failed to load configuration: ${error.message}`);
  process.exit(1);
}

