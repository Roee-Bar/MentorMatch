# Development Process Documentation

## Project Overview
This document records the development process of our final project, including challenges encountered and solutions implemented.

---

## Initial Setup Phase

### First Challenges Encountered

When starting the project, we encountered our first major issues during the initial setup phase:

#### 1. Deprecated NPM Packages
- **Challenge**: Dealing with deprecated npm packages that introduced vulnerabilities to the project
- **Issues faced**: 
  - Initial npm packages were outdated and marked as deprecated
  - These deprecated packages introduced security vulnerabilities to the project
  - Had to identify and update vulnerable dependencies
  - Ensuring compatibility when replacing deprecated packages with newer versions
- **Resolution**: Successfully updated all deprecated packages, resolved security vulnerabilities, and established a secure development environment

#### 2. Vercel Framework Detection
- **Challenge**: Configuring Vercel to properly recognize and deploy the Next.js framework
- **Issues faced**:
  - Vercel initially could not detect that we were using the Next.js framework
  - Had to include proper configuration for framework detection
  - Ensuring Vercel uses the correct build settings for Next.js
  - Setting up the appropriate deployment configuration
- **Resolution**: Successfully configured the project to allow Vercel to recognize the Next.js framework and deploy it correctly

### Milestone Achieved
After resolving these initial challenges, we successfully achieved our first milestone: a simple, working Next.js website deployed and accessible via Vercel.

---

## User Profile Page Development Phase

### Implementation Overview
After establishing the basic Next.js infrastructure, we focused on creating a comprehensive user profile system that supports all user types in the platform.

#### 1. Generic User Profile Component
- **Challenge**: Creating a flexible profile component that works for students, supervisors, and administrators
- **Implementation**:
  - Developed a reusable `UserProfile` component that adapts based on user role
  - Implemented conditional rendering for role-specific fields:
    - Students: Student ID, Degree Program
    - Supervisors: Department, Areas of Expertise
    - Administrators: Department
  - Created TypeScript type definitions for user roles and data structures
  - Designed responsive UI with Tailwind CSS featuring gradient headers and card-based layouts
- **Resolution**: Successfully created a flexible, role-aware profile component that provides a consistent user experience across all user types

### Milestone Achieved
Completed a fully functional user profile page that dynamically displays relevant information based on user role, with a modern and responsive design.

---

## Testing Infrastructure Phase

### Implementation Overview
To ensure code quality and reliability, we implemented a comprehensive testing infrastructure for the project.

#### 1. Testing Framework Setup
- **Challenge**: Setting up a testing environment compatible with Next.js and React

#### 2. Component Testing
- **Challenge**: Writing first comprehensive tests for the UserProfile component

#### 3. CI/CD Integration
- **Challenge**: Automating test execution in the development workflow
- **Initial Approach**: 
  - Initially attempted to run tests as part of the Vercel deployment process
  - Found that combining testing with deployment created complications and slower feedback cycles
- **Decision**: Separated deployment and testing processes for better workflow efficiency
- **Implementation**:
  - Created GitHub Actions workflow for automated testing (separate from Vercel deployment)
  - Configured workflow to run on all pushes and pull requests
  - Set up test coverage reporting and artifact uploads
  - Vercel now focuses solely on deployment, while GitHub Actions handles all testing
- **Benefits**:
  - Faster feedback on test results without waiting for deployment
  - Ability to run tests even if deployment fails
  - Clear separation of concerns between testing and deployment pipelines

#### 4. Vercel Build Check Integration
- **Challenge**: Ensuring team members without Vercel access can see build feedback and verify deployments will succeed
- **Issues faced**:
  - Team members without enterprise plan cannot access Vercel project logs
  - Need for early detection of build failures before deployment
  - Ensuring build process works correctly before pushing to production
- **Implementation**:
  - Added separate `build-check` job to GitHub Actions workflow
  - Simulates Vercel's build process by running `next build` in production mode
  - All build logs are now visible in GitHub Actions for all team members
  - Build check runs automatically on every push and pull request
  - Provides clear success/failure feedback with detailed error messages
- **Benefits**:
  - All team members can access build logs through GitHub (no Vercel access required)
  - Early detection of build issues before they reach Vercel
  - Consistent build environment testing (matches Vercel's production build)
  - Better collaboration and transparency for the entire team

#### 5. Pre-commit Hooks Integration
- **Challenge**: Preventing broken code and dependency issues from being committed to the repository
- **Issues faced**:
  - Need to catch issues before code reaches the repository
  - Ensuring package-lock.json stays in sync with package.json
  - Preventing commits that would break the test suite
  - Maintaining code quality standards at the point of commit
- **Implementation**:
  - Set up Husky for Git hooks management
  - Created pre-commit hook that runs automatically before each commit
  - Hook validates package-lock.json synchronization with package.json using `npm ci --dry-run`
  - Hook runs the full test suite before allowing commits
  - Commits are blocked if validation or tests fail
- **Benefits**:
  - Prevents broken code from entering the repository
  - Ensures dependency consistency across all commits
  - Catches test failures immediately before code is committed
  - Maintains repository integrity and reduces CI/CD pipeline failures
  - Provides immediate feedback to developers during the commit process

### Milestone Achieved
Established a complete testing infrastructure with automated CI/CD integration, ensuring code quality and reliability throughout the development process. The project now has comprehensive test coverage for core components, automated testing on every code change, build verification that's accessible to all team members through GitHub Actions, and pre-commit hooks that prevent broken code and dependency issues from being committed to the repository.

---

## Routing Architecture Update Phase

### Implementation Overview
To align with Next.js 14 best practices, we implemented a routing architecture using the App Router pattern with file-based routing, nested layouts, and authentication-protected routes.

#### 1. Next.js App Router Implementation
- **Challenge**: Implementing Next.js 14 App Router best practices for optimal performance and developer experience
- **Issues faced**:
  - Understanding App Router patterns and file-based routing structure
  - Ensuring automatic code splitting and setting up nested layouts
  - Managing client-side navigation without full page reloads
- **Implementation**:
  - Adopted Next.js 14 App Router with file-based routing
  - Created route structure: `app/page.tsx` (root), `app/login/page.tsx`, `app/register/page.tsx`, `app/profile/page.tsx`, `app/dashboard/page.tsx` (router), `app/dashboard/student/page.tsx`
  - Leveraged automatic code splitting and nested layout hierarchy
- **Resolution**: Successfully established a scalable routing architecture with better performance through automatic code splitting and improved developer experience

#### 2. Layout Hierarchy and Shared Components
- **Challenge**: Creating a layout system that provides shared UI components while maintaining route-specific functionality
- **Issues faced**:
  - Need for consistent header/footer across public pages and authentication-protected layout for dashboard
  - Ensuring proper loading states and managing different layout requirements
- **Implementation**:
  - Created root layout (`app/layout.tsx`) with shared Header and Footer components, global metadata, and consistent page structure
  - Implemented dashboard layout (`app/dashboard/layout.tsx`) that handles authentication verification, user profile fetching, loading states, and redirects unauthenticated users
  - Used React's layout composition pattern for automatic layout nesting
- **Benefits**: Consistent UI without prop drilling, centralized authentication logic, and clear separation between public and protected routes

#### 3. Authentication-Based Routing
- **Challenge**: Implementing secure, role-aware routing that protects sensitive routes and redirects users appropriately
- **Issues faced**:
  - Preventing unauthorized access, handling authentication state changes, and managing loading states to avoid content flash
- **Implementation**:
  - Home page monitors authentication state and redirects authenticated users to `/dashboard` with loading spinner
  - Dashboard layout verifies authentication, fetches user profile, redirects unauthenticated users using `router.replace()`, and provides user context
  - Login/Register pages use `router.push()` for navigation after successful authentication
- **Benefits**: Secure route protection, smooth user experience with appropriate redirects, and role-based routing foundation

#### 4. Client-Side Navigation and Routing Patterns
- **Challenge**: Implementing efficient client-side navigation following Next.js best practices
- **Issues faced**:
  - Choosing between `router.push()` and `router.replace()` for different scenarios
  - Using Next.js `Link` component vs. programmatic routing appropriately
- **Implementation**:
  - Used `useRouter` from `next/navigation` (App Router): `router.replace()` for authentication redirects, `router.push()` for user-initiated navigation
  - Implemented `Link` component for declarative navigation in Header and auth pages with automatic prefetching
  - Applied navigation patterns: authentication redirects use `replace()`, form submissions use `push()`, all navigation is client-side
- **Benefits**: Fast, seamless navigation without page reloads, proper browser history management, and consistent navigation patterns

#### 5. Role-Based Route Organization
- **Challenge**: Structuring routes to support multiple user roles while maintaining scalability
- **Issues faced**:
  - Need for role-specific dashboard routes without code duplication and easy addition of new roles
- **Implementation**:
  - Created role-based structure: `/dashboard` (router), `/dashboard/student` (implemented), with future routes planned for supervisor and admin
  - Dashboard router redirects users to role-specific dashboards (currently defaults to student)
  - Organized route files following Next.js conventions with co-located test files
- **Benefits**: Scalable architecture for new roles, clear semantic URLs, independent development/testing, and automatic code splitting per role

### Milestone Achieved
Successfully implemented a routing architecture following Next.js 14 App Router best practices. The application now features a scalable file-based routing system with nested layouts, authentication-protected routes, role-based organization, and efficient client-side navigation, providing a solid foundation for future development.

---

## Next Steps
_To be documented as development continues..._

