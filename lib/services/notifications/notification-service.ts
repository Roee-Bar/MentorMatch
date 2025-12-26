// lib/services/notifications/notification-service.ts
// SERVER-ONLY: Notification service for partnership events

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { Notification } from '@/types/database';

const SERVICE_NAME = 'NotificationService';

// ============================================
// NOTIFICATION OPERATIONS
// ============================================
export const NotificationService = {
  /**
   * Create a notification for a user
   * 
   * @param userId - ID of the user to notify
   * @param type - Type of notification
   * @param title - Notification title
   * @param message - Notification message
   * @param metadata - Optional metadata for the notification
   * @returns Promise resolving to notification ID
   */
  async createNotification(
    userId: string,
    type: 'partnership_request_received' | 'partnership_request_accepted' | 'partnership_request_rejected' | 'co_supervisor_removed',
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const notificationRef = adminDb.collection('notifications').doc();
      const notificationData: Omit<Notification, 'id'> = {
        userId,
        type,
        title,
        message,
        metadata: metadata || {},
        read: false,
        createdAt: new Date(),
      };

      await notificationRef.set(notificationData);
      
      logger.service.success(SERVICE_NAME, 'createNotification', {
        notificationId: notificationRef.id,
        userId,
        type
      });

      return notificationRef.id;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'createNotification', error, { userId, type });
      throw error;
    }
  },

  /**
   * Send partnership request received notification
   */
  async notifyPartnershipRequestReceived(
    targetSupervisorId: string,
    requesterName: string,
    projectTitle: string,
    requestId: string
  ): Promise<void> {
    try {
      await this.createNotification(
        targetSupervisorId,
        'partnership_request_received',
        'New Partnership Request',
        `${requesterName} has requested to partner with you on project "${projectTitle}"`,
        { requestId, projectTitle, requesterName }
      );
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'notifyPartnershipRequestReceived', error, { targetSupervisorId, requestId });
      // Don't throw - notification failure shouldn't break the workflow
    }
  },

  /**
   * Send partnership request accepted notification
   */
  async notifyPartnershipRequestAccepted(
    requesterId: string,
    targetSupervisorName: string,
    projectTitle: string
  ): Promise<void> {
    try {
      await this.createNotification(
        requesterId,
        'partnership_request_accepted',
        'Partnership Request Accepted',
        `${targetSupervisorName} has accepted your partnership request for project "${projectTitle}"`,
        { projectTitle, targetSupervisorName }
      );
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'notifyPartnershipRequestAccepted', error, { requesterId });
      // Don't throw - notification failure shouldn't break the workflow
    }
  },

  /**
   * Send partnership request rejected notification
   */
  async notifyPartnershipRequestRejected(
    requesterId: string,
    targetSupervisorName: string,
    projectTitle: string
  ): Promise<void> {
    try {
      await this.createNotification(
        requesterId,
        'partnership_request_rejected',
        'Partnership Request Rejected',
        `${targetSupervisorName} has rejected your partnership request for project "${projectTitle}"`,
        { projectTitle, targetSupervisorName }
      );
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'notifyPartnershipRequestRejected', error, { requesterId });
      // Don't throw - notification failure shouldn't break the workflow
    }
  },

  /**
   * Send co-supervisor removed notification
   */
  async notifyCoSupervisorRemoved(
    coSupervisorId: string,
    projectTitle: string,
    supervisorName: string
  ): Promise<void> {
    try {
      await this.createNotification(
        coSupervisorId,
        'co_supervisor_removed',
        'Removed from Project',
        `You have been removed as co-supervisor from project "${projectTitle}" by ${supervisorName}`,
        { projectTitle, supervisorName }
      );
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'notifyCoSupervisorRemoved', error, { coSupervisorId });
      // Don't throw - notification failure shouldn't break the workflow
    }
  },
};

