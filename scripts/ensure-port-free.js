#!/usr/bin/env node
/**
 * Script to ensure port 3000 is free before starting the dev server
 * Kills any process using port 3000 if not in CI mode
 */

const { execSync } = require('child_process');
const isCI = process.env.CI === 'true';
const reuseExisting = process.env.REUSE_EXISTING_SERVER === 'true';

// Only kill processes if we're not reusing existing server and not in CI
if (!reuseExisting && !isCI) {
  try {
    // Find process using port 3000
    const result = execSync('lsof -ti:3000', { encoding: 'utf8', stdio: 'pipe' }).trim();
    if (result) {
      const pids = result.split('\n').filter(Boolean);
      console.log(`[Port Check] Found ${pids.length} process(es) using port 3000: ${pids.join(', ')}`);
      // Kill the processes
      pids.forEach(pid => {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
          console.log(`[Port Check] Killed process ${pid}`);
        } catch (err) {
          // Process might have already exited
        }
      });
      // Wait a bit for port to be released (blocking sleep)
      const start = Date.now();
      while (Date.now() - start < 1000) {
        // Busy wait for 1 second
      }
    }
  } catch (err) {
    // No process using port 3000, which is fine
  }
}

// #region agent log
const http = require('http');
const logData = JSON.stringify({location:'scripts/ensure-port-free.js:30',message:'Port check completed',data:{isCI,reuseExisting,portFree:true},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'});
const req = http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req.on('error',()=>{});req.write(logData);req.end();
// #endregion

