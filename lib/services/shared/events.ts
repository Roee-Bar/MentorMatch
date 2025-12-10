/**
 * Service Event System
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Simple fire-and-forget event dispatcher for decoupling service operations
 * from side effects (like sending emails, logging, etc.)
 */

import { logger } from '@/lib/logger';
import type { ApplicationStatus } from '@/types/database';

// ============================================
// EVENT TYPES
// ============================================

export type ApplicationEventType =
  | 'application:created'
  | 'application:status_changed'
  | 'application:resubmitted';

// ============================================
// EVENT PAYLOADS
// ============================================

/**
 * Emitted when a new application is created
 */
export interface ApplicationCreatedEvent {
  type: 'application:created';
  applicationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  supervisorId: string;
  supervisorName: string;
  supervisorEmail: string;
  projectTitle: string;
  hasPartner: boolean;
  partnerName?: string;
  partnerEmail?: string;
}

/**
 * Emitted when an application status changes
 */
export interface ApplicationStatusChangedEvent {
  type: 'application:status_changed';
  applicationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  supervisorId: string;
  supervisorName: string;
  projectTitle: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  feedback?: string;
  hasPartner: boolean;
  partnerName?: string;
  partnerEmail?: string;
}

/**
 * Emitted when an application is resubmitted after revision
 */
export interface ApplicationResubmittedEvent {
  type: 'application:resubmitted';
  applicationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  supervisorId: string;
  supervisorName: string;
  supervisorEmail: string;
  projectTitle: string;
  hasPartner: boolean;
  partnerName?: string;
  partnerEmail?: string;
}

/**
 * Union type of all service events
 */
export type ServiceEvent =
  | ApplicationCreatedEvent
  | ApplicationStatusChangedEvent
  | ApplicationResubmittedEvent;

// ============================================
// EVENT HANDLER TYPE
// ============================================

/**
 * Event handler function type
 * Handlers should be async and return void
 * Errors in handlers are caught and logged, not propagated
 */
export type EventHandler<T extends ServiceEvent = ServiceEvent> = (event: T) => Promise<void>;

// ============================================
// EVENT DISPATCHER
// ============================================

/**
 * Simple in-memory event dispatcher
 * 
 * Features:
 * - Fire-and-forget: emit() doesn't wait for handlers
 * - Error isolation: handler errors don't affect other handlers
 * - Logging: all events and errors are logged for debugging
 * 
 * Usage:
 * ```typescript
 * // Register a handler
 * serviceEvents.on('application:created', async (event) => {
 *   await sendEmail(event.supervisorEmail, ...);
 * });
 * 
 * // Emit an event
 * await serviceEvents.emit({
 *   type: 'application:created',
 *   applicationId: '123',
 *   ...
 * });
 * ```
 */
class EventDispatcher {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register an event handler
   * @param type - Event type to listen for
   * @param handler - Async function to handle the event
   */
  on<T extends ServiceEvent>(
    type: T['type'],
    handler: EventHandler<T>
  ): void {
    const existing = this.handlers.get(type) || [];
    this.handlers.set(type, [...existing, handler as EventHandler]);
    
    logger.debug(`Event handler registered for ${type}`, {
      context: 'Events',
      data: { handlersCount: existing.length + 1 }
    });
  }

  /**
   * Remove an event handler
   * @param type - Event type
   * @param handler - The handler function to remove
   */
  off<T extends ServiceEvent>(
    type: T['type'],
    handler: EventHandler<T>
  ): void {
    const existing = this.handlers.get(type) || [];
    const filtered = existing.filter(h => h !== handler);
    this.handlers.set(type, filtered);
    
    logger.debug(`Event handler removed for ${type}`, {
      context: 'Events',
      data: { handlersCount: filtered.length }
    });
  }

  /**
   * Emit an event to all registered handlers
   * 
   * Handlers run in parallel (Promise.allSettled) so:
   * - One handler's failure doesn't affect others
   * - The emit() call returns quickly
   * - Errors are logged but not thrown
   * 
   * @param event - The event to emit
   */
  async emit(event: ServiceEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    if (handlers.length === 0) {
      logger.debug(`No handlers for event ${event.type}`, {
        context: 'Events',
        data: { eventType: event.type }
      });
      return;
    }

    logger.debug(`Emitting event ${event.type} to ${handlers.length} handler(s)`, {
      context: 'Events',
      data: { eventType: event.type, handlersCount: handlers.length }
    });

    // Run all handlers in parallel, catching individual failures
    const results = await Promise.allSettled(
      handlers.map(handler => handler(event))
    );

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(
          `Event handler ${index + 1} failed for ${event.type}`,
          result.reason,
          { context: 'Events' }
        );
      }
    });

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      logger.warn(`Event ${event.type}: ${succeeded} handlers succeeded, ${failed} failed`, {
        context: 'Events'
      });
    }
  }

  /**
   * Check if there are any handlers for an event type
   * Useful for conditional logic
   */
  hasHandlers(type: ServiceEvent['type']): boolean {
    return (this.handlers.get(type)?.length ?? 0) > 0;
  }

  /**
   * Get the count of handlers for an event type
   * Useful for debugging
   */
  getHandlerCount(type: ServiceEvent['type']): number {
    return this.handlers.get(type)?.length ?? 0;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clearAll(): void {
    this.handlers.clear();
    logger.debug('All event handlers cleared', { context: 'Events' });
  }
}

// Export singleton instance
export const serviceEvents = new EventDispatcher();

// ============================================
// EVENT HANDLER REGISTRATION
// ============================================

/**
 * TODO: Register event handlers for email notifications
 * 
 * Future implementation phases:
 * 1. Create email service in lib/services/email/email-service.ts
 * 2. Register handlers for:
 *    - application:created -> notify supervisor of new application
 *    - application:status_changed -> notify student of decision
 *    - application:resubmitted -> notify supervisor of resubmission
 * 
 * Example:
 * ```typescript
 * import { EmailService } from '@/lib/services/email/email-service';
 * 
 * serviceEvents.on('application:created', async (event) => {
 *   await EmailService.sendNewApplicationNotification(event);
 * });
 * ```
 */

