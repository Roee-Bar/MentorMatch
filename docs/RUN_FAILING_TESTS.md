# Running Only Failing Tests

All failing tests have been tagged with `@failing` so you can run only those tests without rerunning passing ones.

## Quick Command

Run only failing tests:
```bash
npm run test -- --grep "@failing"
```

## Failing Tests Tagged

1. ✅ `register.spec.ts` - "should successfully register a new student @failing"
2. ✅ `email-verification.spec.ts` - "should send verification email after registration @failing"
3. ✅ `email-verification.spec.ts` - "should handle verification link successfully @failing"
4. ✅ `email-verification.spec.ts` - "should show error for expired verification link @failing"
5. ✅ `email-verification.spec.ts` - "should show message for already verified email @failing"
6. ✅ `email-verification.spec.ts` - "should update verification status after verification @failing"
7. ✅ `supervisor/projects.spec.ts` - "should change project status to completed @failing"

## Other Useful Commands

### Run with UI mode (interactive):
```bash
npm run test:ui -- --grep "@failing"
```

### Run with visible browser:
```bash
npm run test:headed -- --grep "@failing"
```

### Run with verbose output:
```bash
npm run test:verbose -- --grep "@failing"
```

### Run specific test file:
```bash
npm run test -- e2e/tests/auth/register.spec.ts
```

### Run all tests (including passing ones):
```bash
npm run test
```

## Removing the Tag

Once a test is fixed and passing, remove the `@failing` tag from the test name.

Example:
```typescript
// Before (failing)
test('should successfully register a new student @smoke @fast @failing', async ({ page }) => {

// After (fixed)
test('should successfully register a new student @smoke @fast', async ({ page }) => {
```

