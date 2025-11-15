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

### Milestone Achieved
Established a complete testing infrastructure with automated CI/CD integration, ensuring code quality and reliability throughout the development process. The project now has comprehensive test coverage for core components, automated testing on every code change, and build verification that's accessible to all team members through GitHub Actions.

---

## Next Steps
_To be documented as development continues..._

