# Component Library

## Overview

This document catalogs reusable components in the MentorMatch application, providing a reference for developers to discover and use existing components. All components follow consistent patterns for props, styling, and accessibility.

**Component Locations**:
- `app/components/` - General-purpose components
- `app/components/dashboard/` - Dashboard-specific components

## Design System Principles

### Consistency
- All components use Tailwind utility classes or custom component classes
- Color schemes follow semantic naming (success, danger, warning, info)
- Spacing and sizing follow the Tailwind scale

### Accessibility
- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Proper focus management

### Responsiveness
- Mobile-first design
- Responsive layouts with Tailwind breakpoints
- Touch-friendly interactive elements

**See**: `docs/tailwind-usage.md` for detailed styling conventions

---

## Dashboard Components

### StatCard

**Purpose**: Display metric cards in dashboards with consistent formatting

**Location**: `app/components/dashboard/StatCard.tsx`

**Props**: `StatCardProps` interface with title, value, description, color ('blue' | 'green' | 'gray' | 'red'), and optional icon

**Styling**:
- Uses `card-base` component class
- Responsive layout
- Color-coded values based on `color` prop

**Usage Context**:
- Student dashboard (applications count, supervisors count)
- Supervisor dashboard (applications received, capacity status, approved projects)
- Admin dashboard (statistics overview)

**Tests**: `app/components/dashboard/__tests__/StatCard.test.tsx`

---

### ApplicationCard

**Purpose**: Display application details with status badges and action buttons

**Location**: `app/components/dashboard/ApplicationCard.tsx`

**Props**: `ApplicationCardProps` interface - receives `ApplicationCardData` from service layer

**ApplicationCardData Type**:
- `id` (string): Application ID
- `projectTitle` (string): Project name
- `projectDescription` (string): Project details
- `supervisorName` (string): Supervisor's name
- `dateApplied` (string): Formatted application date
- `status` (ApplicationStatus): Current status
- `responseTime` (string): Expected response time
- `comments` (string, optional): Supervisor feedback

**Status Badges**:
- `pending` → Yellow badge ("Pending")
- `approved` → Green badge ("Approved")
- `rejected` → Red badge ("Rejected")
- `under_review` → Blue badge ("Under Review")
- `revision_requested` → Orange badge ("Revision Requested")

**Action Buttons** (conditional):
- `pending` status: "Withdraw" button
- `revision_requested` status: "Edit & Resubmit" button
- `approved` status: "View Project Details" button

**Styling**:
- Uses `card-base` component class
- Status-based badge colors
- Truncated description with `line-clamp-3`

**Usage Context**:
- Student dashboard (view own applications)
- Supervisor dashboard (view received applications)

**Tests**: `app/components/dashboard/__tests__/ApplicationCard.test.tsx`

---

### SupervisorCard

**Purpose**: Display supervisor profiles with expertise, research interests, and availability

**Location**: `app/components/dashboard/SupervisorCard.tsx`

**Props**: `SupervisorCardProps` interface with supervisor data, optional apply callback, and optional showApplyButton flag (default: true)

**SupervisorCardData Type**:
- `id` (string): Supervisor ID
- `name` (string): Full name
- `department` (string): Department name
- `bio` (string): Profile bio
- `expertiseAreas` (string[]): Areas of expertise
- `researchInterests` (string[]): Research topics
- `availabilityStatus` ('available' | 'limited' | 'unavailable'): Current availability
- `currentCapacity` (string): Capacity string (e.g., "2/5 projects")
- `contact` (string): Email address

**Availability Badges**:
- `available` → Green badge ("Available")
- `limited` → Yellow badge ("Limited Capacity")
- `unavailable` → Red badge ("Unavailable")

**Tag Display**:
- Expertise areas: Blue tags (shows first 4, collapses rest)
- Research interests: Purple tags (shows first 3, collapses rest)

**Action Buttons** (conditional):
- Shows "Apply for Supervision" and "View Details" if `showApplyButton=true` and status not "unavailable"
- "Apply for Supervision" triggers `onApply` callback

**Styling**:
- Uses `card-hover` component class (hover effect)
- Tags use `tag-blue`, `tag-purple`, `tag-gray` utility classes
- Bio truncated with `line-clamp-3`

**Usage Context**:
- Student browsing supervisors
- Admin viewing supervisor list

**Tests**: `app/components/dashboard/__tests__/SupervisorCard.test.tsx`

---

### CapacityIndicator

**Purpose**: Visual gauge showing supervisor's current capacity vs. maximum

**Location**: `app/components/dashboard/CapacityIndicator.tsx`

**Props**: `CapacityIndicatorProps` interface with current count, maximum capacity, and status ('available' | 'limited' | 'unavailable')

**Visual Elements**:
- Large number display: "X / Y" format
- Percentage calculation and display
- Progress bar (color-coded by status)
- Status badge (matches progress bar color)

**Color Coding**:
- `available`: Green bar and badge
- `limited`: Yellow bar and badge
- `unavailable`: Red bar and badge

**Styling**:
- Uses `card-base` component class
- Progress bar with smooth transitions
- Percentage-based width calculation

**Usage Context**:
- Supervisor profile page
- Supervisor dashboard overview

**Tests**: `app/components/dashboard/__tests__/CapacityIndicator.test.tsx`

---

## Layout Components

### Header

**Purpose**: Main site navigation with authentication state

**Location**: `app/components/Header.tsx`

**Features**:
- Logo/branding
- Navigation links
- User authentication state
- Login/Logout buttons
- User dropdown menu (conditional)

**Responsive Behavior**:
- Desktop: Full navigation bar
- Mobile: Hamburger menu (future)

**Usage Context**: Present on all pages

**Tests**: `app/components/__tests__/Header.test.tsx`

---

### Footer

**Purpose**: Site footer with links and information

**Location**: `app/components/Footer.tsx`

**Features**:
- Copyright information
- Footer links
- Contact information

**Usage Context**: Present on all pages

---

### HeaderDropdown

**Purpose**: User account dropdown menu in header

**Location**: `app/components/HeaderDropdown.tsx`

**Features**:
- User profile link
- Dashboard link
- Settings (future)
- Logout action

**Styling**: Dropdown with hover/click activation

**Usage Context**: Shown when user is authenticated

---

## Content Components

### LandingPage

**Purpose**: Main landing page content and hero section

**Location**: `app/components/LandingPage.tsx`

**Features**:
- Hero section with CTA
- Feature highlights
- Value propositions
- Call to action buttons

**Styling**: Full-width sections with gradient backgrounds

**Usage Context**: Homepage for unauthenticated users

---

### UserProfile

**Purpose**: Display and edit user profile information

**Location**: `app/components/UserProfile.tsx`

**Features**:
- Role-based field display
- Profile photo
- Personal information
- Role-specific fields (student ID, department, etc.)

**Props**:
- User data
- Edit mode toggle
- Update callbacks

**Styling**: Card-based layout with form elements

**Usage Context**: User profile page

**Tests**: `app/components/__tests__/UserProfile.test.tsx`

---

## Component Patterns

### Props Patterns

#### Required vs Optional Props
- Required props: No default value, must be provided
- Optional props: Marked with `?`, may have default values

#### Callback Props
- Named with `on*` prefix (e.g., `onClick`, `onApply`, `onUpdate`)
- Optional unless component requires the functionality
- Type-safe with proper function signatures

#### Data Props
- Use types from `types/database.ts`
- Transform data in service layer before passing to components
- Components receive UI-ready data, not raw Firebase data

### Styling Patterns

#### Component Classes
Use Tailwind component classes for repeated patterns:
- `card-base`: Basic card styling
- `card-hover`: Card with hover effect
- `btn-primary`, `btn-secondary`, `btn-danger`: Button variants
- `badge-success`, `badge-warning`, `badge-danger`: Status badges
- `tag-blue`, `tag-purple`, `tag-gray`: Tag elements

#### Utility Classes
Use Tailwind utilities for unique styling:
- Layout: `flex`, `grid`, `items-center`, `justify-between`
- Spacing: `p-4`, `mt-2`, `gap-4`
- Typography: `text-lg`, `font-bold`, `text-gray-600`

**See**: `docs/tailwind-usage.md` for complete styling guide

### State Management

#### Local State
Components manage their own UI state (dropdowns, modals, inputs)

#### Lifted State
Parent components manage data and pass to children via props

#### Context State
Dashboard context provides user data to all dashboard components

**See**: `docs/data-flow.md` for state management patterns

---

## Accessibility Guidelines

### Semantic HTML
- Use proper HTML elements (`button`, `nav`, `main`, `article`)
- Avoid `div` for interactive elements

### ARIA Labels
- Add `aria-label` for icon-only buttons
- Use `aria-describedby` for form field hints
- Set `aria-expanded` for dropdown states

### Keyboard Navigation
- All interactive elements accessible via Tab key
- Enter/Space activate buttons
- Escape closes modals/dropdowns

### Focus Management
- Visible focus indicators
- Focus trap in modals
- Return focus after modal closes

### Color Contrast
- Text contrast meets WCAG AA standards
- Don't rely solely on color for information

---

## Testing Components

### Test Structure

Each component has a co-located test file in `__tests__/` folder.

### Test Coverage

**Do Test**:
- Component renders without errors
- Props are correctly displayed
- Conditional rendering based on props
- User interactions trigger callbacks
- Different states render correctly

**Don't Test**:
- Static text content
- Static CSS classes
- Implementation details

**See**: `docs/testing-strategy.md` for complete testing guidelines

---

## Creating New Components

### Checklist

When creating a new component:

1. **Define Props Interface**
   - Use TypeScript interfaces
   - Document each prop with comments
   - Use proper types from `types/database.ts`

2. **Implement Component**
   - Follow component structure pattern (imports, types, component, export)
   - Use component classes for repeated patterns
   - Use utility classes for unique styling

3. **Write Tests**
   - Create test file in `__tests__/` folder
   - Test rendering and interactions
   - Achieve 80%+ coverage

4. **Document Component**
   - Add to this component library doc
   - Include props, usage, and examples
   - Note any special behaviors

5. **Review Accessibility**
   - Check keyboard navigation
   - Verify ARIA labels
   - Test with screen reader (if applicable)

---

## Component Naming Conventions

### File Names
- Components: `PascalCase.tsx` (e.g., `StatCard.tsx`)
- Tests: `PascalCase.test.tsx` (e.g., `StatCard.test.tsx`)

### Component Names
- Match file name
- Descriptive noun or noun phrase
- Avoid generic names like `Card`, `Item`, `Container`

### Props Interface Names
- Component name + `Props` (e.g., `StatCardProps`)

**See**: `docs/code-conventions.md` for complete naming standards

---

## Future Components

### Planned Components

1. **DashboardSidebar** - Navigation sidebar for dashboard
2. **ApplicationForm** - Form for submitting applications
3. **SupervisorDetailModal** - Detailed supervisor view in modal
4. **ErrorBoundary** - Catch and display component errors
5. **LoadingSpinner** - Consistent loading indicator
6. **ConfirmDialog** - Confirmation modal for actions
7. **Toast** - Notification toast messages
8. **Pagination** - Paginate long lists
9. **SearchBar** - Reusable search input with filters
10. **FileUpload** - File upload component with preview

### Component Requests

If you need a new reusable component:
1. Check this library to ensure it doesn't exist
2. Consider if pattern appears 3+ times
3. Design props interface
4. Follow creation checklist above
5. Update this documentation

---

## Related Documentation

- `docs/tailwind-usage.md` - Styling conventions and patterns
- `docs/code-conventions.md` - Component structure and naming
- `docs/testing-strategy.md` - Component testing guidelines
- `docs/type-system.md` - TypeScript types for props
- `docs/data-flow.md` - State management patterns

## File Reference

**Components**: `app/components/`, `app/components/dashboard/`
**Tests**: `app/components/__tests__/`, `app/components/dashboard/__tests__/`
**Types**: `types/database.ts`

