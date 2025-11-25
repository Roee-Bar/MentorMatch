# MentorMatch

A web-based platform for matching students with appropriate project supervisors at Braude College of Engineering.

## Overview

MentorMatch streamlines the process of matching students with project supervisors, transforming a fragmented manual process into a transparent, efficient system that benefits all stakeholders.

## Features

### For Students
- Browse available supervisors by expertise and research areas
- Submit project applications with detailed proposals
- Track application status in real-time
- View supervisor capacity and availability

### For Supervisors
- Set and manage supervision capacity
- Review and respond to student applications
- Manage project workload efficiently
- Communicate with students through the platform

### For Administrators
- Monitor all projects and assignments
- Assign unmatched students to appropriate supervisors
- Generate reports and analytics
- Ensure balanced supervision loads across faculty

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Testing**: Jest, React Testing Library, Playwright (E2E)
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Final
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

### Running the Application

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Testing

#### Unit & Component Tests (Run Locally)
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit         # Unit tests only
npm run test:component    # Component tests only
npm run test:integration  # Integration tests only
```

#### E2E Tests (Run in CI/CD by default)
```bash
# Run all E2E tests (manual)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific E2E flows
npm run test:e2e:student
npm run test:e2e:supervisor
npm run test:e2e:admin
```

**Note**: E2E tests are automatically executed in the CI/CD pipeline on every push/PR. They are **not** run on local commits to keep the development workflow fast. See [Testing Strategy Documentation](./docs/testing-strategy.md#cicd-and-test-execution-workflow) for more details.

## Project Structure

```
├── app/              # Next.js App Router pages
├── components/       # Reusable React components
├── public/           # Static assets
├── archive/          # Old prototype files
└── ...config files   # Configuration files
```

## Deployment

This project is configured for automatic deployment on Vercel. Every push to the main branch will trigger a new deployment.

## Team

- Roee Bar
- Eldar Gafarov

**Supervisor**: Dr. Julia Sheidin

## License

This project is part of a final year academic project at Braude College of Engineering.

