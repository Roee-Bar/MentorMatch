import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Running global setup...');
  
  // Verify Firebase connection by checking environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];
  
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.warn(
      `Warning: Missing Firebase environment variables: ${missingVars.join(', ')}`
    );
    console.warn('Tests may fail if Firebase is not properly configured.');
  } else {
    console.log('✓ Firebase environment variables are set');
  }
  
  // Verify test accounts exist by attempting to connect
  // Note: In a real scenario, you might want to verify test accounts exist in Firebase
  // For now, we'll just log that setup is complete
  
  console.log('✓ Global setup complete');
}

export default globalSetup;

