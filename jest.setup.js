// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

/**
 * Console Warning Suppression
 * 
 * This configuration suppresses React's "not wrapped in act()" warnings that commonly
 * appear in async component tests. These warnings occur when state updates happen
 * after a component test completes but before React's test utilities can properly
 * track them.
 * 
 * WHY THIS EXISTS:
 * - Our dashboard components use useEffect with async data fetching
 * - The auth state listener (onAuthChange) triggers state updates asynchronously
 * - These patterns are correct in production but create timing issues in tests
 * 
 * IMPORTANT: This suppression should be temporary. The proper fix is to:
 * 1. Ensure all async operations complete before test assertions
 * 2. Use waitFor() to properly wait for state updates
 * 3. Mock timers and auth listeners to have synchronous behavior in tests
 * 
 * TODO: Refactor tests to properly handle async auth state changes and remove
 * this suppression once all tests pass without warnings.
 * 
 * @see https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning
 */
const originalError = console.error;
console.error = (...args) => {
  // Only suppress the specific "not wrapped in act" warning
  if (
    typeof args[0] === 'string' &&
    args[0].includes('not wrapped in act')
  ) {
    return;
  }
  originalError.call(console, ...args);
};
