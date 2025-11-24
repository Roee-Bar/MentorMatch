// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Suppress specific React warnings in tests to keep output clean
const originalError = console.error;
console.error = (...args) => {
  // Suppress React act() warnings - these are common in async component tests
  // and don't indicate actual test failures
  if (
    typeof args[0] === 'string' &&
    args[0].includes('not wrapped in act')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

