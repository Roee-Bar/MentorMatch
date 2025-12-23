'use client';

// lib/hooks/useModalScroll.ts
// Custom hook for automatically scrolling to a modal when it opens

import { useEffect } from 'react';

interface UseModalScrollConfig {
  /**
   * Whether the modal is currently open
   */
  isOpen: boolean;
  
  /**
   * CSS selector to find the modal element
   * @default '[data-application-modal="true"]'
   */
  selector?: string;
  
  /**
   * Delay in milliseconds before scrolling (to ensure DOM is updated)
   * @default 100
   */
  delay?: number;
  
  /**
   * Scroll behavior options
   * @default { behavior: 'smooth', block: 'start' }
   */
  scrollOptions?: ScrollIntoViewOptions;
}

/**
 * Hook for automatically scrolling to a modal when it opens
 * Follows the same pattern as useStatCardTables scroll behavior
 * 
 * @param config - Configuration with isOpen state and optional selector/delay
 * 
 * @example
 * // Basic usage with default selector
 * useModalScroll({ isOpen: showApplicationModal });
 * 
 * @example
 * // Custom selector and delay
 * useModalScroll({ 
 *   isOpen: showModal, 
 *   selector: '[data-custom-modal]',
 *   delay: 150 
 * });
 */
export function useModalScroll({
  isOpen,
  selector = '[data-application-modal="true"]',
  delay = 100,
  scrollOptions = { behavior: 'smooth', block: 'start' }
}: UseModalScrollConfig) {
  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to ensure DOM has updated and modal is rendered
      setTimeout(() => {
        const modalElement = document.querySelector(selector);
        if (modalElement) {
          modalElement.scrollIntoView(scrollOptions);
        }
      }, delay);
    }
  }, [isOpen, selector, delay, scrollOptions]);
}

