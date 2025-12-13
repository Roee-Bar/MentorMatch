// lib/services/partnerships/utils/batch-utils.ts
// SERVER-ONLY: Shared utility for Firestore batch updates

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { DocumentReference } from 'firebase-admin/firestore';

const SERVICE_NAME = 'BatchUtils';

// Firestore batch limit
const BATCH_SIZE = 500;

/**
 * Execute batch updates on document references with automatic chunking
 * Handles Firestore's 500 document batch limit
 */
export async function executeBatchUpdates(
  refs: DocumentReference[],
  updateData: Record<string, unknown>,
  operationName: string
): Promise<{ success: boolean; totalUpdated: number }> {
  try {
    if (refs.length === 0) {
      return { success: true, totalUpdated: 0 };
    }

    // Split into batches of 500 (Firestore limit)
    const batches: DocumentReference[][] = [];
    
    for (let i = 0; i < refs.length; i += BATCH_SIZE) {
      batches.push(refs.slice(i, i + BATCH_SIZE));
    }

    let totalUpdated = 0;
    
    for (const batchRefs of batches) {
      const batch = adminDb.batch();
      batchRefs.forEach(ref => {
        batch.update(ref, updateData);
      });
      await batch.commit();
      totalUpdated += batchRefs.length;
    }

    logger.service.success(SERVICE_NAME, operationName, { totalUpdated });
    return { success: true, totalUpdated };
  } catch (error) {
    logger.service.error(SERVICE_NAME, operationName, error);
    return { success: false, totalUpdated: 0 };
  }
}

/**
 * Split document snapshots into batches for processing
 * Utility for when you need custom batch logic
 */
export function chunkDocumentRefs(
  refs: DocumentReference[],
  chunkSize: number = BATCH_SIZE
): DocumentReference[][] {
  const chunks: DocumentReference[][] = [];
  
  for (let i = 0; i < refs.length; i += chunkSize) {
    chunks.push(refs.slice(i, i + chunkSize));
  }
  
  return chunks;
}

