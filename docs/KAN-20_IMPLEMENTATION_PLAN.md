# KAN-20: Supervisor Partnerships - Implementation Plan

## Overview
Add supervisor partnership functionality for co-supervising projects together. **Partnerships are project-based** - supervisors form partnerships for specific projects during project creation/editing. Supervisors can have multiple active partnerships simultaneously (one per project). Partnerships automatically end when project status changes to 'completed' OR when projects are deleted.

**Epic**: KAN-20  
**Status**: Implemented  
**Priority**: Low

---

## Requirements Summary

### Functional Requirements
1. **Partnership Workflow**: Request → pending → accept/reject/cancel (project-based)
2. **Multiple Partnerships**: Supervisors can have multiple active partnerships simultaneously (one per project)
3. **Project-Based**: Partnerships are formed FOR specific projects during project creation/editing
4. **Automatic End**: Partnerships end when project status changes to 'completed' OR when projects are deleted
5. **Project Integration**: Suggest supervisors with available capacity when creating/editing projects
6. **Manual Removal**: Supervisors can manually remove co-supervisor from a project
7. **Admin View**: Admins can see supervisor partnerships (counted via projects)

### Business Rules
- Partnerships are formed during project creation/editing (not beforehand)
- `projectId` is REQUIRED when creating partnership requests
- Supervisors can have multiple active partnerships (different projects)
- Partnerships automatically end when project status changes to 'completed' OR when projects are deleted (coSupervisorId cleared)
- Only show supervisors with available capacity when suggesting co-supervisors
- Co-supervising does NOT count toward supervisor capacity (separate from main supervisor capacity)

---

## Technical Design

### Data Model Changes

#### 1. Supervisor Type (`types/database.ts`)
**NO partnership fields on Supervisor** - partnerships are tracked via `Project.coSupervisorId`

**Important**: The Supervisor interface has NO partnership-related fields. All partnerships are tracked through the `Project.coSupervisorId` field. This is a project-based model, not a supervisor-based model.

```typescript
export interface Supervisor {
  // ... existing fields ...
  // NO partnership fields - partnerships are project-based
  // Partnerships are tracked via Project.coSupervisorId only
}
```

#### 2. New Collection: `supervisor_partnership_requests`
```typescript
export interface SupervisorPartnershipRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterDepartment: string;
  targetSupervisorId: string;
  targetSupervisorName: string;
  targetSupervisorEmail: string;
  targetDepartment: string;
  projectId: string; // REQUIRED - partnership is for specific project
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Date;
  respondedAt?: Date;
}
```

#### 3. Firestore Indexes (`firestore.indexes.json`)
- Composite indexes for supervisor partnership queries:
  - `supervisor_partnership_requests`: `status + targetSupervisorId`
  - `supervisor_partnership_requests`: `status + requesterId`
  - `supervisor_partnership_requests`: `status + requesterId + targetSupervisorId`
  - `supervisor_partnership_requests`: `projectId + status` (for project-based queries)
  - `projects`: `coSupervisorId + status` (for partnership queries)
  - `projects`: `supervisorId + status` (for supervisor project queries)

---

## Implementation Phases

### Phase 1: Backend Foundation
**Goal**: Create core services and data models

#### Tasks:
1. **Update Type Definitions**
   - [ ] Verify NO partnership fields exist on `Supervisor` interface in `types/database.ts` (partnerships are project-based)
   - [ ] Create `SupervisorPartnershipRequest` interface in `types/database.ts`
   - [ ] Update `CreateProjectData` to include partner suggestions helper type (if needed for UI)

2. **Create Supervisor Partnership Services**
   - [ ] Create `lib/services/partnerships/supervisor-partnership-request-service.ts`
     - `getById(requestId)`
     - `getBySupervisor(supervisorId, type)`
     - `checkExistingRequest(requesterId, targetSupervisorId)`
     - `updateStatus(requestId, status)`
   - [ ] Create `lib/services/partnerships/supervisor-partnership-workflow.ts`
     - `createRequest(requesterId, targetSupervisorId, projectId?)`
     - `respondToRequest(requestId, targetSupervisorId, action)`
     - `cancelRequest(requestId, requesterId)`
     - `_acceptRequest()` (private)
     - `_rejectRequest()` (private)
     - `_validatePartnershipStatus()` (private)
   - [ ] Create `lib/services/partnerships/supervisor-partnership-pairing.ts`
     - `getAvailableSupervisors(currentSupervisorId)`
     - `getPartnerDetails(partnerId)`
     - `pairSupervisors(supervisorId1, supervisorId2)`
     - `unpairSupervisors(supervisorId1, supervisorId2)`
     - `cancelAllPendingRequests(supervisorId)`
     - `getPartnersWithAvailableCapacity(supervisorId)`

3. **Update Firestore Converters**
   - [ ] Add `toSupervisorPartnershipRequest()` in `lib/services/shared/firestore-converters.ts`
   - [ ] Verify `toSupervisor()` has NO partnership field handling (partnerships are project-based)

4. **Update Firestore Rules** (`firestore.rules`)
   - [ ] Add validation rules for supervisor partnership status consistency
   - [ ] Document partnership data model requirements

5. **Update Firestore Indexes** (`firestore.indexes.json`)
   - [ ] Add composite indexes for supervisor partnership queries

---

### Phase 2: API Routes
**Goal**: Create REST API endpoints for supervisor partnerships

#### Tasks:
1. **Partnership Request Endpoints**
   - [ ] Create `app/api/supervisor-partnerships/request/route.ts` (POST)
     - Create new partnership request
     - Validate supervisor exists and not already paired
     - Prevent self-partnership
   - [ ] Create `app/api/supervisor-partnerships/[id]/respond/route.ts` (POST)
     - Accept/reject partnership request
     - Update both supervisors' status
   - [ ] Create `app/api/supervisor-partnerships/[id]/route.ts` (GET, DELETE)
     - Get partnership request details
     - Cancel outgoing request
   - [ ] Create `app/api/supervisor-partnerships/unpair/route.ts` (POST)
     - Remove co-supervisor from project
     - Handle project cleanup if needed
   - [ ] Create `app/api/projects/[id]/status-change/route.ts` (POST)
     - Handle project status changes
     - Automatically clear coSupervisorId when status changes to 'completed'
     - Handle project deletion scenario

2. **Partnership Query Endpoints**
   - [ ] Create `app/api/supervisor-partnerships/requests/route.ts` (GET)
     - Get incoming/outgoing requests
     - Query params: `type=incoming|outgoing|all`
   - [ ] Create `app/api/supervisor-partnerships/available/route.ts` (GET)
     - Get available supervisors for partnership
     - Exclude current supervisor and already paired supervisors
   - [ ] Create `app/api/supervisor-partnerships/partner/route.ts` (GET)
     - Get current partner details
   - [ ] Create `app/api/supervisor-partnerships/partners-with-capacity/route.ts` (GET)
     - Get partners with available capacity (for project creation)

3. **Validation Schemas**
   - [ ] Add `supervisorPartnershipRequestSchema` in `lib/middleware/validation.ts`
   - [ ] Add `supervisorPartnershipRespondSchema` in `lib/middleware/validation.ts`

4. **Authorization**
   - [ ] Ensure all routes use `withAuth` middleware
   - [ ] Verify supervisor role for all endpoints
   - [ ] Add ownership checks (can't respond to requests not sent to you)

---

### Phase 3: Frontend Hooks & API Client
**Goal**: Create React hooks and API client methods

#### Tasks:
1. **API Client Methods** (`lib/api/client.ts`)
   - [ ] `createSupervisorPartnershipRequest(targetSupervisorId, projectId)` - projectId is REQUIRED
   - [ ] `getSupervisorPartnershipRequests(type)`
   - [ ] `respondToSupervisorPartnershipRequest(requestId, action)`
   - [ ] `cancelSupervisorPartnershipRequest(requestId)`
   - [ ] `getAvailableSupervisorPartners()`
   - [ ] `getSupervisorPartnerDetails(partnerId)`
   - [ ] `removeCoSupervisor(projectId)` - remove co-supervisor from specific project
   - [ ] `getSupervisorPartnersWithCapacity()`

2. **React Hooks** (`lib/hooks/`)
   - [ ] Create `useSupervisorPartnerships.ts`
     - Fetch available supervisors, requests, current partner
     - Similar structure to `useStudentPartnerships.ts`
   - [ ] Create `useSupervisorPartnershipActions.ts`
     - Handle create, accept, reject, cancel, remove co-supervisor actions
     - Similar structure to `usePartnershipActions.ts`

---

### Phase 4: UI Components
**Goal**: Create supervisor partnership UI components

#### Tasks:
1. **Shared Components**
   - [ ] Create `app/components/shared/SupervisorCard.tsx`
     - Display supervisor info
     - Show partnership status
     - Request partnership button
     - Similar to `StudentCard.tsx`
   - [ ] Create `app/components/shared/SupervisorPartnershipRequestCard.tsx`
     - Display partnership request
     - Accept/reject buttons
     - Similar to `PartnershipRequestCard.tsx` (if exists)

2. **Supervisor Dashboard Integration**
   - [ ] Update `app/authenticated/supervisor/page.tsx`
     - Add partnerships section
     - Show incoming requests
     - Show current partner
     - Show outgoing requests
     - Show available supervisors for partnership
   - [ ] Add partnerships tab/section similar to student dashboard

3. **Supervisor Profile Page**
   - [ ] Update `app/authenticated/supervisor/profile/page.tsx`
     - Display active partnerships (projects where supervisor is co-supervisor)
     - Show current co-supervisor projects
     - Remove co-supervisor button for each project

---

### Phase 5: Project Integration
**Goal**: Integrate partnerships with project creation/editing

#### Tasks:
1. **Project Creation/Edit Forms**
   - [ ] Update project creation form (admin or supervisor)
     - Add co-supervisor dropdown
     - Filter to show only partners with available capacity
     - Use `getSupervisorPartnersWithCapacity()` API
   - [ ] Update project edit form
     - Same co-supervisor selection
     - Handle partnership updates when co-supervisor changes

2. **Project Service Updates**
   - [ ] Update `lib/services/projects/project-service.ts`
     - When project created/updated with co-supervisor, set `coSupervisorId` and `coSupervisorName` on Project
     - No supervisor document updates needed (partnerships are project-based)
     - Co-supervising does NOT count toward supervisor capacity

3. **Project Status Changes**
   - [ ] Create `app/api/projects/[id]/status-change/route.ts` endpoint for handling project status changes
   - [ ] When project status changes to 'completed': automatically clear `coSupervisorId` and `coSupervisorName` from Project
   - [ ] When project is deleted: automatically clear `coSupervisorId` and cancel all pending partnership requests for that project
   - [ ] Use `ProjectService.handleProjectStatusChange()` method for status change handling
   - [ ] Use `ProjectService.handleProjectDeletion()` method for deletion handling

---

### Phase 5.5: Error Handling & Edge Cases
**Goal**: Handle edge cases and error scenarios gracefully

#### Edge Case Handling:
1. **Project Deletion with Pending Requests**
   - When a project is deleted while partnership requests are pending, automatically cancel all pending requests for that project
   - Implementation: `SupervisorPartnershipRequestService.cancelRequestsForProject(projectId)`
   - Called from `ProjectService.handleProjectDeletion()`

2. **Supervisor Deletion with Active Partnerships**
   - When a supervisor is deleted while partnered in active projects, clear `coSupervisorId` from all affected projects
   - Implementation: Clear `coSupervisorId` and `coSupervisorName` from all projects where supervisor is co-supervisor
   - Called from supervisor deletion/deactivation methods

3. **Capacity Validation at Acceptance Time**
   - Re-validate supervisor capacity when accepting a partnership request (not just at request creation)
   - Capacity may change between request creation and acceptance
   - Implementation: Re-check `currentCapacity < maxCapacity` in `_acceptRequest()` method
   - Return appropriate error if capacity is no longer available

4. **Concurrent Requests for Same Project**
   - Allow multiple pending requests for the same project
   - When one request is accepted, automatically cancel all other pending requests for that project
   - Implementation: `SupervisorPartnershipPairingService.cancelAllPendingRequestsForProject(projectId)`

---

### Phase 6: Admin Integration
**Goal**: Add admin views for supervisor partnerships

#### Tasks:
1. **Admin Dashboard**
   - [ ] Update `app/authenticated/admin/page.tsx`
     - Add supervisor partnerships stat card
     - Show count of active partnerships
     - Click to view table of all partnerships

2. **Admin Supervisor Management**
   - [ ] Update supervisor management views
     - Display partnership status
     - Show current partner
     - Option to view partnership history

3. **Admin Reports**
   - [ ] Add supervisor partnerships to admin stats
     - Total partnerships
     - Active partnerships
     - Pending requests

---

### Phase 7: Testing & Documentation
**Goal**: Ensure quality and document the feature

#### Tasks:
1. **Unit Tests**
   - [ ] Test supervisor partnership services
   - [ ] Test workflow operations
   - [ ] Test validation logic

2. **Integration Tests**
   - [ ] Test API endpoints
   - [ ] Test partnership workflow end-to-end
   - [ ] Test project integration

3. **Manual Testing**
   - [ ] Test partnership request flow (create request for specific project)
   - [ ] Test accept/reject/cancel partnership requests
   - [ ] Test removing co-supervisor from project
   - [ ] Test project creation with co-supervisor
   - [ ] Test capacity filtering (only show supervisors with available capacity)
   - [ ] Test project deletion with pending requests (verify requests are auto-cancelled)
   - [ ] Test supervisor deletion with active partnerships (verify coSupervisorId cleared from projects)
   - [ ] Test capacity validation at acceptance time (capacity changes between request and acceptance)
   - [ ] Test project status change endpoint (status to 'completed' clears coSupervisorId)
   - [ ] Test multiple projects with same supervisor pair (should be allowed)

4. **Documentation**
   - [ ] Update README with supervisor partnerships feature
   - [ ] Document API endpoints
   - [ ] Document data model changes
   - [ ] Add code comments explaining design decisions

---

## File Structure

```
lib/services/partnerships/
├── supervisor-partnership-request-service.ts  (NEW)
├── supervisor-partnership-workflow.ts         (NEW)
├── supervisor-partnership-pairing.ts          (NEW)
├── partnership-request-service.ts            (existing - student)
├── partnership-workflow.ts                   (existing - student)
└── partnership-pairing.ts                    (existing - student)

app/api/supervisor-partnerships/
├── request/route.ts                          (NEW)
├── requests/route.ts                         (NEW)
├── available/route.ts                       (NEW)
├── partner/route.ts                          (NEW)
├── partners-with-capacity/route.ts          (NEW)
├── [id]/
│   ├── route.ts                              (NEW)
│   └── respond/route.ts                      (NEW)
└── unpair/route.ts                           (NEW - remove co-supervisor endpoint)

lib/hooks/
├── useSupervisorPartnerships.ts              (NEW)
└── useSupervisorPartnershipActions.ts        (NEW)

app/components/shared/
├── SupervisorCard.tsx                        (NEW)
└── SupervisorPartnershipRequestCard.tsx      (NEW)

app/authenticated/supervisor/
├── page.tsx                                  (UPDATE - add partnerships section)
└── profile/page.tsx                          (UPDATE - add partnership status)
```

---

## Key Design Decisions

### 1. Reuse Student Partnership Pattern
- **Rationale**: Consistency, proven pattern, easier maintenance
- **Implementation**: Mirror student partnership services but for supervisors

### 2. Project-Based Partnership Model
- **Rationale**: Partnerships are formed for specific projects, supporting multiple simultaneous partnerships
- **Fields**: `Project.coSupervisorId` and `Project.coSupervisorName` (no fields on Supervisor)
- **Lifecycle**: Partnership exists while `Project.coSupervisorId` is set, ends when project completes/cancels

### 3. Multiple Simultaneous Partnerships
- **Rationale**: Supervisors can co-supervise multiple projects with different partners
- **Implementation**: Each project can have its own co-supervisor, tracked via `Project.coSupervisorId`

### 4. Capacity Filtering for Co-Supervisor Selection
- **Rationale**: Only suggest supervisors who can actually take on projects
- **Implementation**: `getPartnersWithAvailableCapacity()` filters by `currentCapacity < maxCapacity` and excludes supervisors already partnered with requester in active projects

### 5. Partnership Formation During Project Creation/Editing
- **Rationale**: Partnerships are formed when needed for specific projects
- **Implementation**: Partnership requests include `projectId` (required), formed during project workflow

---

## Migration Considerations

### Data Migration
- [x] Migration script created: `scripts/migrate-supervisor-partnerships.ts`
- [ ] **Migration Steps**:
  1. Run migration script after deployment, before enabling new partnership features
  2. Remove old partnership fields from Supervisor documents:
     - `partnerId` (if exists)
     - `partnershipStatus` (if exists)
     - `activePartnershipProjectId` (if exists)
  3. Migration script should be idempotent (safe to run multiple times)
  4. Verify existing projects with `coSupervisorId` are preserved and correctly set
  5. Verify no Supervisor documents have partnership-related fields after migration

### Backward Compatibility
- [x] Partnership fields removed from Supervisor (breaking change)
- [x] `projectId` is now required in partnership requests (breaking change)
- [x] Project creation without co-supervisor still works
- [x] Migration script handles cleanup of old partnership fields

---

## Dependencies

### External
- None (uses existing Firebase/Firestore setup)

### Internal
- Student partnership services (for reference/pattern)
- Supervisor service
- Project service
- Authentication/authorization middleware

---

## Risks & Mitigations

### Risk 1: Complexity of Project-Partnership Integration
- **Mitigation**: Clear separation of concerns, well-defined service boundaries

### Risk 2: Capacity Management Edge Cases
- **Mitigation**: Thorough validation, transaction safety for capacity updates

### Risk 3: Partnership Lifecycle Confusion
- **Mitigation**: Clear documentation, consistent naming, status badges in UI

---

## Success Criteria

1. ✅ Supervisors can send partnership requests for specific projects
2. ✅ Supervisors can accept/reject/cancel partnership requests
3. ✅ Supervisors can view active partnerships (projects where they are co-supervisor)
4. ✅ Supervisors can remove co-supervisor from projects
5. ✅ When creating/editing projects, supervisors with available capacity are suggested
6. ✅ Partnerships are tracked per project via `Project.coSupervisorId`
7. ✅ Admin can view supervisor partnerships (counted via projects)
8. ✅ All operations use transactions for data consistency
9. ✅ Multiple simultaneous partnerships supported (one per project)
10. ✅ Partnerships automatically end when projects complete/cancel

---

## Estimated Effort

- **Phase 1 (Backend Foundation)**: 2-3 days
- **Phase 2 (API Routes)**: 1-2 days
- **Phase 3 (Frontend Hooks)**: 1 day
- **Phase 4 (UI Components)**: 2-3 days
- **Phase 5 (Project Integration)**: 2 days
- **Phase 6 (Admin Integration)**: 1 day
- **Phase 7 (Testing & Documentation)**: 2 days

**Total**: ~11-14 days

---

## Notes

- Follow existing code patterns from student partnerships
- Maintain consistency with student partnership UX
- Use transactions for all critical operations
- Add comprehensive error handling and logging
- Consider future enhancements (e.g., partnership history, notifications)

