# Development Workflow

Complete guide to testing, CI/CD, and development processes for MentorMatch.

## Quick Reference

### Running Tests

```bash
# Unit/integration tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

### Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Testing Strategy

### Test Levels

**Unit Tests** - Individual functions and utilities
- Fast execution
- Business logic, validators, formatters
- Pure functions in isolation

**Component Tests** - React components
- User interactions and rendering
- Props handling, conditional logic
- Test behavior, not implementation

**Integration Tests** - Multiple modules together
- Page components, API routes
- Component composition
- State management flows

**E2E Tests** - Complete user workflows
- Student, supervisor, admin flows
- Real user behavior simulation
- Slower but comprehensive

### Test Organization

```
Final/
├── app/
│   └── __tests__/          # Page and route tests
├── lib/
│   └── __tests__/          # Unit tests
├── e2e/                    # E2E tests
│   ├── student-flow.spec.ts
│   ├── supervisor-flow.spec.ts
│   └── admin-flow.spec.ts
├── jest.config.js
└── playwright.config.ts
```

### What to Test

**DO Test:**
- User interactions (clicks, form submissions)
- Conditional logic and role-based UI
- State management and async operations
- Business logic and validation
- Integration points and API calls

**DON'T Test:**
- Static text content or labels
- Static href attributes
- CSS classes without logic
- Implementation details

## Testing Tools

### Jest + React Testing Library

Used for unit, component, and integration tests:

```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';

test('should submit form', async () => {
  render(<MyComponent />);
  fireEvent.click(screen.getByText(/submit/i));
  await expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

### Playwright

Used for E2E tests:

```typescript
// Example E2E test
import { test, expect } from '@playwright/test';

test('student can apply', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Apply');
  await expect(page).toHaveURL(/application/);
});
```

## CI/CD Pipeline

### Pipeline Flow

```
Git Push
  ↓
GitHub Actions CI          Vercel Preview
  ↓                             ↓
Unit Tests → E2E Tests → Build Check
  ↓
All Pass? → Production Deployment
```

### GitHub Actions Workflow

Three parallel jobs run on every push:

**1. Unit Tests (30-40s)**
- Checkout code
- Install dependencies
- Run linter
- Run tests with coverage
- Upload coverage report

**2. E2E Tests (2-3min)**
- Install Playwright
- Run end-to-end tests
- Upload test reports
- Screenshot failures

**3. Build Check (40-50s)**
- Verify Vercel configuration
- Simulate production build
- Catch deployment issues early

### Vercel Deployment

**Preview Deployments:**
- Every push to feature branches
- Unique URL per deployment
- Full production build
- Posted on pull requests

**Production Deployments:**
- Automatic on `main` branch
- Production environment variables
- Accessible via project URL

### Environment Variables

**Client-Side (NEXT_PUBLIC_*):**
- Visible in browser
- Required:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

**Server-Side (FIREBASE_ADMIN_*):**
- Never exposed to browser
- Required:
  - `FIREBASE_ADMIN_PROJECT_ID`
  - `FIREBASE_ADMIN_CLIENT_EMAIL`
  - `FIREBASE_ADMIN_PRIVATE_KEY`

## Development Workflow

### Local Development

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes**
   - Follow code conventions
   - Write tests for new code

3. **Test locally**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Commit** (pre-commit hook runs tests)
   ```bash
   git add .
   git commit -m "feat: add feature"
   ```

5. **Push** (triggers CI/CD)
   ```bash
   git push origin feature/my-feature
   ```

6. **Create pull request**
   - CI checks run automatically
   - Preview deployment created
   - Request code review

7. **Merge to main** (after approval)
   - Automatic production deployment

### Pre-Commit Hook

Runs automatically on every commit:
- Validates `package-lock.json` sync
- Runs unit tests
- Fails commit if tests fail
- Bypass with `--no-verify` if needed

### CI/CD Strategy

**Local commits:** Unit tests only (fast)
**CI pipeline:** Full test suite including E2E

This keeps local commits fast while ensuring comprehensive testing before deployment.

## Branch Strategy

### Branch Types

- `main` - Production-ready code (protected)
- `feature/{name}` - New features
- `bugfix/{name}` - Bug fixes
- `hotfix/{name}` - Urgent fixes

### Protection Rules (main)

- Require pull request reviews
- Require status checks to pass
- Require branches up to date
- No direct pushes

## Firebase Mocking

Tests mock Firebase services to avoid database calls:

```typescript
jest.mock('@/lib/services', () => ({
  getSupervisors: jest.fn().mockResolvedValue(mockData),
}));

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: mockUser }),
}));
```

## Troubleshooting

### "useRouter is not a function"

Mock Next.js navigation:
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/',
}));
```

### Tests pass locally, fail in CI

- Check Node version matches (20.x)
- Use `npm ci` in CI
- Check environment variables
- Review timing-sensitive tests

### Build fails on Vercel

- Verify environment variables
- Check `vercel.json` configuration
- Test locally: `NODE_ENV=production npm run build`
- Review Vercel logs

### E2E tests timeout

- Increase timeout in `playwright.config.ts`
- Check dev server started
- Review browser console logs

### Port 3000 in use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

## Best Practices

### Testing

- Focus on user behavior
- Keep tests simple and readable
- One behavior per test
- Maintain test independence
- Test edge cases
- Run tests frequently

### CI/CD

- Run tests before pushing
- Keep commits small and focused
- Use descriptive commit messages
- Review CI logs when failures occur
- Monitor build times

### Security

- Never commit `.env.local`
- Never expose admin credentials
- Use different Firebase projects for dev/prod
- Rotate credentials if exposed
- Review GitHub Actions logs

## Configuration Files

### vercel.json

```json
{
  "buildCommand": "next build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### playwright.config.ts

- Base URL: `http://localhost:3000`
- Auto-start dev server
- Retry on CI: 2 times
- Capture on failure: trace, screenshot, video

## Monitoring

### GitHub Actions

View metrics in Actions tab:
- Test pass rate
- Build duration
- Test coverage trends
- Workflow history

### Vercel

Dashboard metrics:
- Deployment success rate
- Build duration
- Function execution time
- Edge network performance

## Resources

- [Jest Documentation](https://jestjs.io)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [GitHub Actions](https://docs.github.com/actions)
- [Vercel Deployment](https://vercel.com/docs)

---

**Last Updated**: November 2025

