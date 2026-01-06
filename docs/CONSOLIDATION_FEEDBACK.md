# MentorMatch Code Consolidation Feedback

## Executive Summary

The project has significantly more code than required for the stated features in `MentorMatch.pdf`. Key issues include redundant API requests, excessive abstraction layers, and duplicate logic. This document provides actionable recommendations to reduce code by ~30-40% while maintaining functionality.

---

## Critical Issues (High Priority)

### 1. Login Flow - Multiple Redundant Requests

**Problem:**
On login, `getUserProfile` is called in 4 different places:
- `app/page.tsx` (home page) - with retry logic
- `app/authenticated/layout.tsx` (layout wrapper)
- `lib/hooks/useAuth.ts` (auth hook)
- `app/components/Header.tsx` (header component)

**Impact:** 3-4 identical `/api/users/{uid}` calls on every login.

**Recommendation:**
- Create a single `AuthContext` that fetches user profile once
- Store profile in context and share across components
- Remove duplicate calls from all 4 locations
- **Expected reduction:** 2-3 API requests per login

---

### 2. Dashboard Data Fetching - Excessive Parallel Requests

**Problem:**

**Student Dashboard** makes 7+ requests on load:
1. `getStudentById` (profile)
2. `getStudentApplications`
3. `getSupervisors` (all available)
4. `getAvailablePartners` (if not paired)
5. `getPartnershipRequests` (incoming)
6. `getPartnershipRequests` (outgoing)
7. `getPartnerDetails` (if paired)

**Supervisor Dashboard** makes 3+ requests:
1. `getSupervisorById`
2. `getSupervisorApplications`
3. `getSupervisorProjects`

**Impact:** Slow page loads, unnecessary server load, poor user experience.

**Recommendation:**
Create consolidated dashboard endpoints:
- `/api/students/{id}/dashboard` - returns profile, applications, supervisors, partnerships in one response
- `/api/supervisors/{id}/dashboard` - returns supervisor, applications, projects in one response
- `/api/admin/dashboard` - returns stats + supervisors in one response

**Expected reduction:** 5-7 requests → 1 request per dashboard

---

### 3. Service + Repository Double Abstraction

**Problem:**
Current structure has both Repository and Service layers, but many services just pass through to repositories:

```typescript
// StudentService just calls repository
async getStudentById(studentId: string): Promise<Student | null> {
  return this.getById(studentId); // Just passes through
}
```

**Files affected:**
- `lib/repositories/` (11 files)
- `lib/services/` (multiple services that just wrap repositories)

**Recommendation:**
- Merge repositories into services for simple CRUD operations
- Keep repositories only for complex queries or if planning to swap data sources
- **Expected reduction:** ~11 repository files eliminated, services simplified

---

## Medium Priority Issues

### 4. Too Many Custom Hooks (20+)

**Current hooks:**
- `useAuth`, `useStudentDashboard`, `useSupervisorDashboard`, `useAdminDashboard`
- `useStudentPartnerships`, `usePartnershipActions`, `useRequestCardActions`
- `useApplicationActions`, `useSupervisorApplicationActions`, `useApplicationStatusModal`
- `useStatCardTables`, `useStatCardData`, `useCapacityUpdate`
- `useLoadingState`, `useModalScroll`, `useEmailVerification`
- And more...

**Recommendation:**
- Consolidate related hooks:
  - Merge `usePartnershipActions` + `useRequestCardActions` → single hook
  - Merge `useApplicationActions` + `useSupervisorApplicationActions` + `useApplicationStatusModal` → role-based hook
  - Remove trivial hooks like `useModalScroll` (use simple `useEffect`)
- Keep only hooks that encapsulate meaningful logic
- **Expected reduction:** 20+ hooks → ~10 hooks

---

### 5. Middleware Complexity

**Current middleware files:**
- `apiHandler.ts`, `auth.ts`, `authorization.ts`, `authorization-helpers.ts`
- `validation.ts`, `validation-helpers.ts`
- `errorHandler.ts`, `errors.ts`
- `route-handlers.ts`, `service-result-handler.ts`
- `query-params.ts`, `response.ts`, `correlation-id.ts`, `timeout.ts`, `rate-limit.ts`

**Recommendation:**
Consolidate into 3-4 files:
- `auth-middleware.ts` (auth + authorization)
- `validation-middleware.ts` (validation + helpers)
- `error-middleware.ts` (errors + handlers)
- `response-middleware.ts` (response + correlation-id)

**Expected reduction:** ~13 files → 4 files

---

### 6. Partnership Logic Duplication

**Problem:**
Separate files for student and supervisor partnerships with similar logic:
- Student: `partnership-service.ts`, `partnership-request-service.ts`, `partnership-pairing.ts`, `partnership-workflow.ts`
- Supervisor: `supervisor-partnership-request-service.ts`, `supervisor-partnership-pairing.ts`, `supervisor-partnership-workflow.ts`

**Recommendation:**
- Create unified partnership service with role-based logic
- Single service handles both student and supervisor partnerships
- **Expected reduction:** ~6 files → 2-3 files

---

### 7. API Endpoint Fragmentation

**Problem:**
Many separate endpoints that could be consolidated:
- `/api/students/{id}/applications` + `/api/students/{id}` → could be `/api/students/{id}/dashboard`
- `/api/supervisors/{id}/applications` + `/api/supervisors/{id}/projects` → could be `/api/supervisors/{id}/dashboard`
- Multiple partnership endpoints that could use query params

**Recommendation:**
- Use consolidated dashboard endpoints (see #2)
- Use query params for filtering instead of separate endpoints where appropriate
- **Expected reduction:** ~20% fewer API routes

---

## Low Priority (Nice to Have)

### 8. Email Service Files

**Current:** 5 files
- `email-config.ts`, `email-service.ts`, `email-styles.ts`, `resend-client.ts`, `templates.ts`

**Recommendation:**
- Consolidate into 2 files:
  - `email-service.ts` (main logic + config)
  - `email-templates.ts` (templates + styles)

---

### 9. Component Structure

**Problem:**
Many small components in `_components` folders that are thin wrappers.

**Recommendation:**
- Merge small related components
- Remove wrapper components that only add styling
- Keep components that have meaningful logic or are reused frequently

---

### 10. Unnecessary Abstraction Layers

**Examples:**
- `BaseService` with many simple pass-through methods
- `useAuthenticatedFetch` wrapper that adds minimal value
- Multiple validation helper files for similar schemas

**Recommendation:**
- Remove `BaseService` if most methods are pass-throughs
- Simplify `useAuthenticatedFetch` or merge into dashboard hooks
- Consolidate validation helpers

---

## Implementation Priority

### Phase 1 (Immediate - Highest Impact)
1. ✅ Fix duplicate `getUserProfile` calls on login
2. ✅ Create consolidated dashboard endpoints
3. ✅ Merge service + repository layers for simple CRUD

**Expected impact:**
- Before: ~8-10 API requests on student login
- After: ~2-3 API requests on login
- Code reduction: ~20-25%

### Phase 2 (High Impact)
4. Consolidate hooks (reduce from 20+ to ~10)
5. Merge partnership logic (student + supervisor)
6. Simplify middleware structure

**Expected impact:**
- Code reduction: Additional ~10-15%

### Phase 3 (Polish)
7. Consolidate email service files
8. Merge small components
9. Remove unnecessary abstraction layers

**Expected impact:**
- Code reduction: Additional ~5-10%

---

## Expected Overall Impact

- **API Requests:** 8-10 requests → 2-3 requests on login
- **Code Reduction:** ~30-40% fewer files, ~25-35% less code overall
- **Maintainability:** Significantly improved with less duplication
- **Performance:** Faster page loads, reduced server load

---

## Notes

- Focus on Phase 1 first - these changes will yield the largest reduction in requests and code
- Test thoroughly after each phase before moving to the next
- Consider creating a migration plan if this is a production system
- Some consolidation may require refactoring components that depend on the current structure

