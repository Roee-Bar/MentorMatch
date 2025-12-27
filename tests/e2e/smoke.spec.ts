import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-users';
import { loginAs } from '../utils/setup';

test.describe('Smoke Tests', () => {
  test('can import fixtures', () => {
    expect(TEST_USERS.admin).toBeDefined();
    expect(TEST_USERS.supervisor).toBeDefined();
    expect(TEST_USERS.studentWithPartner).toBeDefined();
    expect(TEST_USERS.studentNoPartner).toBeDefined();
  });

  test('can login as admin', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/authenticated\/admin/);
  });
});

