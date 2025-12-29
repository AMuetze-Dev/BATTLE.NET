import { test, expect } from '@playwright/test';

/**
 * E2E Test: Leaderboard Features
 */
test.describe('Leaderboard', () => {
  test('leaderboard displays player rankings', async ({ page, context }) => {
    // Setup: Create session with multiple players
    await page.goto('/');
    await page.click('text=Create Session');
    await page.click('button:has-text("Create Session")');
    
    const sessionCode = await page.url().split('/moderator/')[1];

    // Add multiple players
    for (let i = 1; i <= 3; i++) {
      const playerPage = await context.newPage();
      await playerPage.goto('/');
      await playerPage.click('text=Join Session');
      await playerPage.fill('input[placeholder*="session code"]', sessionCode);
      await playerPage.fill('input[placeholder*="name"]', `Player ${i}`);
      await playerPage.click('button:has-text("Join Session")');
    }

    // Check moderator view
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Leaderboard')).toBeVisible();
    
    // All players should be visible
    for (let i = 1; i <= 3; i++) {
      await expect(page.locator(`text=Player ${i}`)).toBeVisible();
    }
  });

  test('top 3 players have special badges', async ({ page }) => {
    await page.goto('/');
    
    // Check for medal emojis
    await expect(page.locator('text=🥇')).toBeVisible(); // Gold
    await expect(page.locator('text=🥈')).toBeVisible(); // Silver
    await expect(page.locator('text=🥉')).toBeVisible(); // Bronze
  });

  test('leaderboard shows player scores', async ({ page }) => {
    await page.goto('/');
    
    // Check score format
    await expect(page.locator('text=/\\d+ pts/')).toBeVisible();
  });

  test('leaderboard shows player stats', async ({ page }) => {
    await page.goto('/');
    
    // Check for stats display (correct/total answers)
    await expect(page.locator('text=/\\d+\\/\\d+ correct/')).toBeVisible();
  });

  test('current player is highlighted', async ({ page, context }) => {
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

    // Player should see their own entry highlighted
    const highlightedEntry = playerPage.locator('text=Test Player').locator('..');
    const backgroundColor = await highlightedEntry.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have special background color
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)');
  });

  test('leaderboard updates in real-time', async ({ page }) => {
    // This would test WebSocket updates
    // Setup: Create session, answer question, check leaderboard updates
    // Implementation depends on backend integration
  });

  test('empty leaderboard shows message', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Session');
    await page.click('button:has-text("Create Session")');

    // Initially no players
    await expect(page.locator('text=No players yet')).toBeVisible();
  });

  test('leaderboard is sorted by score', async ({ page, context }) => {
    // Add players with different scores
    // Verify order is correct
    // This requires backend integration to set scores
  });
});
