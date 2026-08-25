import { test, expect } from '@playwright/test';

test.describe('DevPulse Full E2E Flow', () => {
  const timestamp = Date.now();
  const testUser = {
    name: 'E2E Tester',
    username: `e2e_user_${timestamp}`,
    email: `e2e_${timestamp}@devpulse.dev`,
    password: 'Password123!',
  };

  test('Complete flow: Register -> Workspace -> Project -> Issue -> Kanban', async ({ page }) => {
    // 1. Visit Register Page
    await page.goto('/register');
    await expect(page).toHaveTitle(/DevPulse/);

    // 2. Fill Register Form
    await page.fill('input[placeholder="Gaurang"]', testUser.name);
    await page.fill('input[placeholder="gaurang"]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // 3. Redirected to Dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Workspace Overview');

    // 4. Create Workspace
    await page.click('button:has-text("Create Project")');
    await page.fill('input[placeholder="e.g. Mobile API / Web Client"]', 'Core API Service');
    await page.click('button:has-text("Create Project")');

    // 5. Verify Project Card appears
    await expect(page.locator('text=Core API Service')).toBeVisible();

    // 6. Navigate to Project
    await page.click('text=Core API Service');
    await expect(page.locator('h1')).toContainText('Core API Service');

    // 7. Open Kanban
    await page.click('text=Open Kanban');
    await expect(page.locator('h1')).toContainText('Kanban Board');

    // 8. Create Issue
    await page.click('button:has-text("New Issue")');
    await page.fill('input[placeholder="e.g. Fix API login timeout"]', 'Fix API login timeout');
    await page.fill('textarea', 'Investigate redis session timeout in production.');
    await page.click('button:has-text("Create Issue")');

    // 9. Verify Issue Card on Kanban
    await expect(page.locator('text=Fix API login timeout')).toBeVisible();
  });
});
