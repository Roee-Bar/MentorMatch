// lib/hooks/useRateLimit.ts
// Custom hook for rate limiting with localStorage persistence

'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseRateLimitReturn {
  cooldown: number | null;
  checkLimit: () => boolean;
  recordAttempt: () => void;
  formatCooldown: (ms: number) => string;
}

/**
 * Custom hook for rate limiting with localStorage persistence
 * Tracks attempts and enforces cooldown periods
 * 
 * @param key - localStorage key to store attempts
 * @param maxAttempts - Maximum number of attempts allowed in cooldown period
 * @param cooldownMs - Cooldown period in milliseconds
 * @returns Object with cooldown state, checkLimit, recordAttempt, and formatCooldown functions
 * 
 * @example
 * const { cooldown, checkLimit, recordAttempt, formatCooldown } = useRateLimit(
 *   'emailVerificationResends',
 *   3,
 *   60 * 60 * 1000 // 1 hour
 * );
 * 
 * if (!checkLimit()) {
 *   // Rate limited, show cooldown message
 *   return `Wait ${formatCooldown(cooldown)}`;
 * }
 * 
 * recordAttempt(); // Record successful attempt
 */
export function useRateLimit(
  key: string,
  maxAttempts: number,
  cooldownMs: number
): UseRateLimitReturn {
  const [cooldown, setCooldown] = useState<number | null>(null);

  // Check if rate limit is exceeded
  const checkLimit = useCallback((): boolean => {
    const stored = localStorage.getItem(key);
    if (!stored) return true;

    try {
      const data = JSON.parse(stored);
      const now = Date.now();
      const attempts = data.attempts || [];
      
      // Filter out attempts older than cooldown period
      const recentAttempts = attempts.filter((timestamp: number) => 
        now - timestamp < cooldownMs
      );
      
      if (recentAttempts.length >= maxAttempts) {
        const oldestAttempt = Math.min(...recentAttempts);
        const cooldownEnd = oldestAttempt + cooldownMs;
        const remaining = cooldownEnd - now;
        setCooldown(remaining);
        return false;
      }
      
      return true;
    } catch {
      return true;
    }
  }, [key, maxAttempts, cooldownMs]);

  // Record an attempt
  const recordAttempt = useCallback(() => {
    const stored = localStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : { attempts: [] };
    data.attempts = data.attempts || [];
    data.attempts.push(Date.now());
    localStorage.setItem(key, JSON.stringify(data));
    
    // Recheck limit after recording
    checkLimit();
  }, [key, checkLimit]);

  // Format cooldown time as MM:SS
  const formatCooldown = useCallback((ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Update cooldown timer
  useEffect(() => {
    if (cooldown && cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev === null || prev <= 1000) {
            return null;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Initial check on mount
  useEffect(() => {
    checkLimit();
  }, [checkLimit]);

  return {
    cooldown,
    checkLimit,
    recordAttempt,
    formatCooldown,
  };
}

