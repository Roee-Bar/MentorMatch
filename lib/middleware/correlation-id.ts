/**
 * Correlation ID Middleware
 * 
 * Provides request-scoped correlation ID management using AsyncLocalStorage
 * for tracking requests across the application
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * AsyncLocalStorage instance for storing correlation ID per request
 */
const correlationIdStorage = new AsyncLocalStorage<string>();

/**
 * Get the current correlation ID from context
 * Returns undefined if not in a request context
 */
export function getCorrelationId(): string | undefined {
  return correlationIdStorage.getStore();
}

/**
 * Run a function with a correlation ID context
 * Generates a new correlation ID if one doesn't exist
 * 
 * @param correlationId - Optional correlation ID (generates new one if not provided)
 * @param fn - Function to run within the correlation ID context
 * @returns Result of the function
 */
export async function withCorrelationId<T>(
  correlationId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const id = correlationId || randomUUID();
  return correlationIdStorage.run(id, fn);
}

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

