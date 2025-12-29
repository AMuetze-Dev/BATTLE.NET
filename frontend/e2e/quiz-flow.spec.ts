import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Quiz Flow
 * Tests the entire flow from session creation to question answering
 */
test.describe('Battle.Net Quiz - Complete Flow', () => {
  test('moderator creates session and player joins', async ({ page, context }) => {
    // Visit home page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Battle.Net Quiz Platform');

    // Click create session button
    await page.click('text=Create Session');
    
    // Create session modal should appear
    await expect(page.locator('text=Create Quiz Session')).toBeVisible();
    await page.click('button:has-text("Create Session")');

    // Should redirect to moderator dashboard
    await expect(page).toHaveURL(/\/moderator\/.+/);
    await expect(page.locator('text=Moderator Dashboard')).toBeVisible();

    // Extract session code
    const sessionCode = await page.locator('[data-testid="session-code"]').textContent();
    expect(sessionCode).toBeTruthy();

    // Open new page for player
    const playerPage = await context.newPage();
    await playerPage.goto('/');

    // Join session as player
    await playerPage.click('text=Join Session');
    await expect(playerPage.locator('text=Join Quiz Session')).toBeVisible();
    
    await playerPage.fill('input[placeholder*="session code"]', sessionCode || '');
    await playerPage.fill('input[placeholder*="name"]', 'Test Player');
    await playerPage.click('button:has-text("Join Session")');

    // Should redirect to player page
    await expect(playerPage).toHaveURL(/\/player\/.+/);
    await expect(playerPage.locator('text=Test Player')).toBeVisible();

    // Moderator should see the player
    await page.waitForTimeout(1000); // Wait for WebSocket update
    await expect(page.locator('text=Test Player')).toBeVisible();
    
    // Verify player count
    await expect(page.locator('text=Connected Players (1)')).toBeVisible();
  });

  test('player can see leaderboard', async ({ page, context }) => {
    // Create session and join as player (simplified)
    await page.goto('/');
    await page.click('text=Create Session');
    await page.click('button:has-text("Create Session")');
    
    const sessionCode = await page.url().split('/moderator/')[1];
    
    const playerPage = await context.newPage();
    await playerPage.goto('/');
    await playerPage.click('text=Join Session');
    await playerPage.fill('input[placeholder*="session code"]', sessionCode);
    await playerPage.fill('input[placeholder*="name"]', 'Player 1');
    await playerPage.click('button:has-text("Join Session")');

    // Check leaderboard exists
    await expect(playerPage.locator('text=Leaderboard')).toBeVisible();
    await expect(playerPage.locator('text=Player 1')).toBeVisible();
  });

  test('moderator can upload question catalog', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Session');
    await page.click('button:has-text("Create Session")');

    // Wait for redirect
    await expect(page).toHaveURL(/\/moderator\/.+/);

    // Click upload button
    await page.click('button:has-text("Upload Questions")');
    await expect(page.locator('text=Upload Question Catalog')).toBeVisible();

    // Note: Actual file upload would require a test file
    // This test just verifies the UI is accessible
  });

  test('player can leave session', async ({ page, context }) => {
    // Create and join session
    await page.goto('/');
    await page.click('text=Create Session');
    await page.click('button:has-text("Create Session")');
    
    const sessionCode = await page.url().split('/moderator/')[1];
    
    const playerPage = await context.newPage();
    await playerPage.goto('/');
    await playerPage.click('text=Join Session');
    await playerPage.fill('input[placeholder*="session code"]', sessionCode);
    await playerPage.fill('input[placeholder*="name"]', 'Test Player');
    await playerPage.click('button:has-text("Join Session")');

    // Leave session
    await playerPage.click('button:has-text("Leave")');
    
    // Should redirect to home
    await expect(playerPage).toHaveURL('/');
  });

  test('moderator can end session', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Session');
    await page.click('button:has-text("Create Session")');

    // Wait for dashboard
    await expect(page).toHaveURL(/\/moderator\/.+/);

    // End session (would need to handle confirm dialog)
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("End Session")');

    // Should redirect to home
    await expect(page).toHaveURL('/');
  });

  test('connection status indicator works', async ({ page, context }) => {
    await page.goto('/');
    await page.click('text=Create Session');
    await page.click('button:has-text("Create Session")');
    
    const sessionCode = await page.url().split('/moderator/')[1];
    
    const playerPage = await context.newPage();
    await playerPage.goto('/');
    await playerPage.click('text=Join Session');
    await playerPage.fill('input[placeholder*="session code"]', sessionCode);
    await playerPage.fill('input[placeholder*="name"]', 'Player 1');
    await playerPage.click('button:has-text("Join Session")');

    // Check for connected status
    await expect(playerPage.locator('text=Connected')).toBeVisible();
  });

  test('session code is displayed prominently', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Session');
    await page.click('button:has-text("Create Session")');

    // Session code should be visible and large
    const sessionCodeElement = page.locator('[data-testid="session-code"]');
    await expect(sessionCodeElement).toBeVisible();
    
    const fontSize = await sessionCodeElement.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    
    // Should be large (at least 24px)
    expect(parseInt(fontSize)).toBeGreaterThan(24);
  });
});
