// lib/services/audit/audit-service.ts
// SERVER-ONLY: Audit trail service for partnership events

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { PartnershipAuditLog } from '@/types/database';

const SERVICE_NAME = 'AuditService';

// ============================================
// AUDIT TRAIL OPERATIONS
// ============================================
export const AuditService = {
  /**
   * Log a partnership event to the audit trail
   * 
   * @param eventType - Type of event being logged
   * @param userId - ID of the user who performed the action
   * @param details - Event details
   * @returns Promise resolving to audit log ID
   */
  async logPartnershipEvent(
    eventType: 'request_created' | 'request_accepted' | 'request_rejected' | 'request_cancelled' | 'co_supervisor_added' | 'co_supervisor_removed' | 'project_status_changed',
    userId: string,
    details: {
      requestId?: string;
      projectId?: string;
      requesterId?: string;
      targetSupervisorId?: string;
      coSupervisorId?: string;
      oldStatus?: string;
      newStatus?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    try {
      const auditLogRef = adminDb.collection('partnership_audit_logs').doc();
      const auditLogData: Omit<PartnershipAuditLog, 'id'> = {
        eventType,
        userId,
        details,
        timestamp: new Date(),
      };

      await auditLogRef.set(auditLogData);
      
      logger.service.success(SERVICE_NAME, 'logPartnershipEvent', {
        auditLogId: auditLogRef.id,
        eventType,
        userId
      });

      return auditLogRef.id;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'logPartnershipEvent', error, { eventType, userId });
      // Don't throw - audit logging failure shouldn't break the workflow
      return '';
    }
  },
};

