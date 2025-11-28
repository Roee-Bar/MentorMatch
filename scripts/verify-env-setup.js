#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * 
 * This script checks if all required environment variables are set.
 * Use this to verify your local setup or debug CI/CD issues.
 * 
 * Usage:
 *   node scripts/verify-env-setup.js
 */

const requiredEnvVars = {
  'Firebase Client SDK (Public)': [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ],
  'Firebase Admin SDK (Private)': [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
  ],
};

console.log('🔍 Verifying Environment Variables Setup...\n');

let allPresent = true;
let missingVars = [];

Object.entries(requiredEnvVars).forEach(([category, vars]) => {
  console.log(`\n📦 ${category}:`);
  console.log('─'.repeat(50));
  
  vars.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    const status = isSet ? '✅' : '❌';
    const preview = isSet 
      ? (value.length > 50 ? `${value.substring(0, 20)}...` : value.substring(0, 30))
      : 'NOT SET';
    
    console.log(`${status} ${varName}`);
    if (isSet) {
      console.log(`   Value: ${preview}`);
      
      // Validate format for specific variables
      if (varName === 'FIREBASE_ADMIN_PRIVATE_KEY') {
        if (!value.includes('BEGIN PRIVATE KEY')) {
          console.log('   ⚠️  Warning: Private key might be malformed');
        }
        if (value.includes('\\n') && !value.includes('\n')) {
          console.log('   ⚠️  Warning: Newlines might not be properly escaped');
        }
      }
      
      if (varName.includes('PROJECT_ID') && value === 'test-project') {
        console.log('   ⚠️  Warning: Using placeholder value');
      }
    } else {
      allPresent = false;
      missingVars.push(varName);
    }
  });
});

console.log('\n' + '='.repeat(50));

if (allPresent) {
  console.log('\n✅ SUCCESS: All required environment variables are set!\n');
  console.log('Your environment is properly configured.');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run build');
  console.log('  2. Run: npm run dev');
  console.log('  3. Run: npm test');
  process.exit(0);
} else {
  console.log('\n❌ MISSING ENVIRONMENT VARIABLES:\n');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  console.log('\n📚 How to fix:');
  console.log('   1. Create a .env.local file in the project root');
  console.log('   2. Add the missing variables to .env.local');
  console.log('   3. Restart your development server');
  console.log('\n📖 See DEPLOYMENT_FIX_GUIDE.md for detailed instructions');
  
  process.exit(1);
}

