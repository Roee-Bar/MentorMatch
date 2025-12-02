# Student-to-Student Matching Implementation Plan

## Overview

Replace the checkbox-based "I have a partner" system with a proper student-to-student matching system. Students will see "Available Students" above "My Applications" on their dashboard, can send partnership requests, and paired students are automatically included in supervisor applications.

## Design Decisions Summary

- **Flow**: Request/Accept model (like LinkedIn connections)
- **Unpairing**: Either student can unpair at any time
- **Applications**: Partner automatically included in application
- **Migration**: Reset all existing partnership data
- **Requests**: Students can send multiple outgoing requests
- **Visibility**: Show detailed student info (name, department, skills, interests, topics)
- **Notifications**: Not implemented in Phase 1
- **Search**: Advanced search in Phase 2 only
- **Cancellation**: Requesters can cancel pending requests

## Phase 1: Basic Partnership System

### Step 1: Database Schema Updates

**File**: [`types/database.ts`](types/database.ts)

Update the `Student` interface (lines 33-65):

```typescript
export interface Student {
  // ... existing fields ...
  
  // Partner Information - REPLACE OLD FIELDS
  partnerId?: string;  // Firebase UID of matched partner
  partnershipStatus: 'none' | 'pending_sent' | 'pending_received' | 'paired';
  
  // DEPRECATED - Keep for migration reference only
  hasPartner: boolean;
  partnerName?: string;
  partnerEmail?: string;
  
  // ... rest of fields ...
}
```

Add new interfaces after line 232:

```typescript
// Partnership Request Type (stored in 'partnership_requests' collection)
export interface StudentPartnershipRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterStudentId: string;
  requesterDepartment: string;
  targetStudentId: string;
  targetStudentName: string;
  targetStudentEmail: string;
  targetDepartment: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Date;
  respondedAt?: Date;
}

// Student Card Data for UI
export interface StudentCardData {
  id: string;
  fullName: string;
  studentId: string;
  department: string;
  email: string;
  skills: string;
  interests: string;
  preferredTopics?: string;
  previousProjects?: string;
  partnershipStatus: 'none' | 'pending_sent' | 'pending_received' | 'paired';
  partnerId?: string;
}
```

### Step 2: Validation Schema Updates

**File**: [`lib/middleware/validation.ts`](lib/middleware/validation.ts)

Update `updateStudentSchema` (lines 136-151):

```typescript
export const updateStudentSchema = z.object({
  // ... existing fields ...
  
  // Updated partnership fields
  partnerId: z.string().optional(),
  partnershipStatus: z.enum(['none', 'pending_sent', 'pending_received', 'paired']).optional(),
  
  // Keep old fields but mark as deprecated
  hasPartner: z.boolean().optional(),
  partnerName: z.string().max(100).optional(),
  partnerEmail: z.string().email().optional().or(z.literal('')),
  
  // ... rest of fields ...
}).strict();
```

Add partnership request validation:

```typescript
export const partnershipRequestSchema = z.object({
  targetStudentId: z.string().min(1, 'Target student ID is required'),
}).strict();

export const partnershipResponseSchema = z.object({
  action: z.enum(['accept', 'reject']),
}).strict();
```

### Step 3: Firebase Service Layer

**File**: [`lib/services/firebase-services.server.ts`](lib/services/firebase-services.server.ts)

Add StudentPartnershipService after StudentService:

```typescript
export class StudentPartnershipService {
  // Get available students (not paired, excluding current user)
  static async getAvailableStudents(currentUserId: string): Promise<Student[]> {
    const studentsRef = adminDb.collection('students');
    const snapshot = await studentsRef
      .where('partnershipStatus', '==', 'none')
      .get();
    
    return snapshot.docs
      .filter(doc => doc.id !== currentUserId)
      .map(doc => ({ id: doc.id, ...doc.data() } as Student));
  }

  // Create partnership request
  static async createPartnershipRequest(
    requesterId: string, 
    targetStudentId: string
  ): Promise<string> {
    // Get both student profiles
    // Validate both exist and are available
    // Create request document in 'partnership_requests' collection
    // Update requester: partnershipStatus = 'pending_sent'
    // Update target: partnershipStatus = 'pending_received'
    // Return request ID
  }

  // Get partnership requests for a student
  static async getPartnershipRequests(
    studentId: string, 
    type: 'incoming' | 'outgoing' | 'all'
  ): Promise<StudentPartnershipRequest[]> {
    // Query partnership_requests where:
    // - incoming: targetStudentId == studentId && status == 'pending'
    // - outgoing: requesterId == studentId && status == 'pending'
    // - all: either condition
  }

  // Respond to partnership request (accept/reject)
  static async respondToPartnershipRequest(
    requestId: string,
    targetStudentId: string,
    action: 'accept' | 'reject'
  ): Promise<void> {
    // Get request, verify targetStudentId matches
    // If accept:
    //   - Update both students: partnerId, partnershipStatus = 'paired'
    //   - Update request: status = 'accepted', respondedAt
    //   - Cancel all other pending requests for both students
    // If reject:
    //   - Reset target's partnershipStatus to 'none'
    //   - Update request: status = 'rejected', respondedAt
  }

  // Cancel partnership request (by requester)
  static async cancelPartnershipRequest(
    requestId: string,
    requesterId: string
  ): Promise<void> {
    // Verify requester owns the request
    // Update request: status = 'cancelled'
    // Reset requester's partnershipStatus to 'none'
  }

  // Unpair students
  static async unpairStudents(studentId1: string, studentId2: string): Promise<void> {
    // Reset both students: partnerId = null, partnershipStatus = 'none'
    // Update application if exists (remove partner reference)
  }

  // Get current partner details
  static async getPartnerDetails(partnerId: string): Promise<Student | null> {
    // Return full student profile
  }
}
```

### Step 4: API Routes

**File**: `app/api/students/available-partners/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authResult.user?.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const students = await StudentPartnershipService.getAvailableStudents(
    authResult.user.uid
  );
  
  return NextResponse.json({ 
    success: true, 
    data: students,
    count: students.length 
  });
}
```

**File**: `app/api/partnerships/request/route.ts` (NEW)

```typescript
// POST - Create partnership request
// Validate input with partnershipRequestSchema
// Call StudentPartnershipService.createPartnershipRequest
// Return request ID
```

**File**: `app/api/partnerships/[id]/route.ts` (NEW)

```typescript
// GET - Get specific partnership request
// DELETE - Cancel partnership request (requester only)
```

**File**: `app/api/partnerships/[id]/respond/route.ts` (NEW)

```typescript
// POST - Accept or reject partnership request
// Body: { action: 'accept' | 'reject' }
// Validate with partnershipResponseSchema
// Call StudentPartnershipService.respondToPartnershipRequest
```

**File**: `app/api/students/[id]/partnership-requests/route.ts` (NEW)

```typescript
// GET - Get all partnership requests for a student
// Query param: ?type=incoming|outgoing|all
// Call StudentPartnershipService.getPartnershipRequests
```

**File**: `app/api/partnerships/unpair/route.ts` (NEW)

```typescript
// POST - Unpair from current partner
// Call StudentPartnershipService.unpairStudents
```

### Step 5: API Client Updates

**File**: [`lib/api/client.ts`](lib/api/client.ts)

Add methods to apiClient:

```typescript
// Get available students for partnership
getAvailablePartners: async (token: string) => {
  return fetchWithAuth('/api/students/available-partners', token);
},

// Create partnership request
createPartnershipRequest: async (data: { targetStudentId: string }, token: string) => {
  return fetchWithAuth('/api/partnerships/request', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
},

// Get partnership requests
getPartnershipRequests: async (studentId: string, type: string, token: string) => {
  return fetchWithAuth(`/api/students/${studentId}/partnership-requests?type=${type}`, token);
},

// Respond to partnership request
respondToPartnershipRequest: async (requestId: string, action: string, token: string) => {
  return fetchWithAuth(`/api/partnerships/${requestId}/respond`, token, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
},

// Cancel partnership request
cancelPartnershipRequest: async (requestId: string, token: string) => {
  return fetchWithAuth(`/api/partnerships/${requestId}`, token, {
    method: 'DELETE',
  });
},

// Unpair from partner
unpairFromPartner: async (token: string) => {
  return fetchWithAuth('/api/partnerships/unpair', token, {
    method: 'POST',
  });
},

// Get partner details
getPartnerDetails: async (partnerId: string, token: string) => {
  return fetchWithAuth(`/api/students/${partnerId}`, token);
},
```

### Step 6: UI Components

**File**: `app/components/authenticated/StudentCard.tsx` (NEW)

Create similar to [`app/components/authenticated/SupervisorCard.tsx`](app/components/authenticated/SupervisorCard.tsx):

```typescript
interface StudentCardProps {
  student: StudentCardData;
  onRequestPartnership?: (studentId: string) => void;
  showRequestButton?: boolean;
  isCurrentPartner?: boolean;
  onUnpair?: () => void;
}

export default function StudentCard({ 
  student, 
  onRequestPartnership, 
  showRequestButton = true,
  isCurrentPartner = false,
  onUnpair
}) {
  // Display student name, department, studentId
  // Show skills, interests as tags
  // Show preferredTopics if available
  // Show previousProjects summary
  // Show "Request Partnership" button if showRequestButton
  // Show "Your Partner" badge if isCurrentPartner
  // Show "Unpair" button if isCurrentPartner && onUnpair provided
  // Show "Paired" badge if student.partnershipStatus === 'paired'
}
```

**File**: `app/components/authenticated/PartnershipRequestCard.tsx` (NEW)

```typescript
interface PartnershipRequestCardProps {
  request: StudentPartnershipRequest;
  type: 'incoming' | 'outgoing';
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

export default function PartnershipRequestCard({ 
  request, 
  type, 
  onAccept, 
  onReject, 
  onCancel 
}) {
  // Display requester/target info based on type
  // For incoming: Show "Accept" and "Reject" buttons
  // For outgoing: Show "Cancel Request" button
  // Show request date
  // Show student details (department, skills preview)
}
```

### Step 7: Update Student Dashboard

**File**: [`app/authenticated/student/page.tsx`](app/authenticated/student/page.tsx)

Update the page (lines 19-309):

1. Add state variables after line 29:
```typescript
const [availableStudents, setAvailableStudents] = useState<StudentCardData[]>([]);
const [incomingRequests, setIncomingRequests] = useState<StudentPartnershipRequest[]>([]);
const [outgoingRequests, setOutgoingRequests] = useState<StudentPartnershipRequest[]>([]);
const [currentPartner, setCurrentPartner] = useState<StudentCardData | null>(null);
const [showAllStudents, setShowAllStudents] = useState(false);
```

2. Add fetch function in useEffect after line 100:
```typescript
// Fetch partnership data
const [partnerDataResponse] = await Promise.all([
  Promise.all([
    apiClient.getAvailablePartners(token),
    apiClient.getPartnershipRequests(userId, 'incoming', token),
    apiClient.getPartnershipRequests(userId, 'outgoing', token),
    userProfile?.partnerId 
      ? apiClient.getPartnerDetails(userProfile.partnerId, token)
      : Promise.resolve({ data: null })
  ])
]);

const [studentsRes, incomingRes, outgoingRes, partnerRes] = partnerDataResponse;
setAvailableStudents(studentsRes.data);
setIncomingRequests(incomingRes.data);
setOutgoingRequests(outgoingRes.data);
setCurrentPartner(partnerRes.data);
```

3. Add handler functions after line 134:
```typescript
const handleRequestPartnership = async (targetStudentId: string) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    await apiClient.createPartnershipRequest({ targetStudentId }, token);
    
    // Refresh data
    const [studentsRes, outgoingRes] = await Promise.all([
      apiClient.getAvailablePartners(token),
      apiClient.getPartnershipRequests(userId!, 'outgoing', token)
    ]);
    setAvailableStudents(studentsRes.data);
    setOutgoingRequests(outgoingRes.data);
    
    setSuccessMessage('Partnership request sent!');
    setTimeout(() => setSuccessMessage(null), 5000);
  } catch (error) {
    console.error('Error sending partnership request:', error);
    setError('Failed to send partnership request.');
  }
};

const handleAcceptPartnership = async (requestId: string) => { /* ... */ };
const handleRejectPartnership = async (requestId: string) => { /* ... */ };
const handleCancelRequest = async (requestId: string) => { /* ... */ };
const handleUnpair = async () => { /* ... */ };
```

4. Add new sections in JSX before "My Applications" section (after line 230):

```typescript

{/* Partnership Requests Section - Show if any exist */}

{incomingRequests.length > 0 && (

<div className="mb-8">

<h2 className="section-title">Partnership Requests</h2>

<div className="grid-cards">

{incomingRequests.map(request => (

<PartnershipRequestCard

key={request.id}

request={request}

type="in