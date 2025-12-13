// lib/services/partnerships/partnership-service.ts
// SERVER-ONLY: Partnership service facade
// Re-exports all partnership-related services for backward compatibility

// Export individual services for direct access
export { PartnershipRequestService } from './partnership-request-service';
export { PartnershipWorkflowService } from './partnership-workflow';
export { PartnershipPairingService } from './partnership-pairing';

// Import for facade
import { PartnershipRequestService } from './partnership-request-service';
import { PartnershipWorkflowService } from './partnership-workflow';
import { PartnershipPairingService } from './partnership-pairing';

// ============================================
// LEGACY FACADE
// Maintains backward compatibility with existing API route imports
// Maps old method names to new service methods
// ============================================
export const StudentPartnershipService = {
  // Request CRUD operations (from PartnershipRequestService)
  getPartnershipRequest: PartnershipRequestService.getById.bind(PartnershipRequestService),
  getPartnershipRequests: PartnershipRequestService.getByStudent.bind(PartnershipRequestService),
  
  // Workflow operations (from PartnershipWorkflowService)
  createPartnershipRequest: PartnershipWorkflowService.createRequest.bind(PartnershipWorkflowService),
  respondToPartnershipRequest: PartnershipWorkflowService.respondToRequest.bind(PartnershipWorkflowService),
  cancelPartnershipRequest: PartnershipWorkflowService.cancelRequest.bind(PartnershipWorkflowService),
  
  // Pairing operations (from PartnershipPairingService)
  getAvailableStudents: PartnershipPairingService.getAvailableStudents.bind(PartnershipPairingService),
  getPartnerDetails: PartnershipPairingService.getPartnerDetails.bind(PartnershipPairingService),
  unpairStudents: PartnershipPairingService.unpairStudents.bind(PartnershipPairingService),
  cancelAllPendingRequests: PartnershipPairingService.cancelAllPendingRequests.bind(PartnershipPairingService),
  updateApplicationsAfterUnpair: PartnershipPairingService.updateApplicationsAfterUnpair.bind(PartnershipPairingService),
  updateApplicationsPartnerInfo: PartnershipPairingService.updateApplicationsPartnerInfo.bind(PartnershipPairingService),
};
