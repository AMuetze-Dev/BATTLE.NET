import { test, expect } from '@playwright/test';

/**
 * E2E Test: Question Types
 * Tests different question type interactions
 */
test.describe('Question Types', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create session and navigate to question view
    // This would be implemented with actual backend integration
    await page.goto('/');
  });

  test('input text question can be answered', async ({ page }) => {
    // Mock question display
    // In real scenario, moderator would start question
    const questionText = 'What is the capital of France?';
    
    // Type answer
    const input = page.locator('input[placeholder*="answer"]');
    await input.fill('Paris');
    
    // Submit
    await page.click('button:has-text("Submit Answer")');
    
    // Verify submission (would check for confirmation)
  });

  test('multiple choice question can be selected', async ({ page }) => {
    // Select option
    await page.click('text=Option A');
    
    // Verify selection visual feedback
    const selectedOption = page.locator('button:has-text("Option A")');
    await expect(selectedOption).toHaveCSS('border-color', /rgb.*600/);
    
    // Submit
    await page.click('button:has-text("Submit Answer")');
  });

  test('slider question can be adjusted', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    
    // Move slider
    await slider.fill('75');
    
    // Verify value display
    await expect(page.locator('text=75')).toBeVisible();
    
    // Submit
    await page.click('button:has-text("Submit Answer")');
  });

  test('buzzer question can be buzzed', async ({ page }) => {
    // Click buzzer
    await page.click('button:has-text("BUZZ")');
    
    // Verify buzzer pressed state
    await expect(page.locator('text=BUZZED!')).toBeVisible();
    
    // Should show answer input
    await expect(page.locator('input[placeholder*="answer"]')).toBeVisible();
  });

  test('sorting question can be reordered', async ({ page }) => {
    // Find first item
    const firstItem = page.locator('[draggable="true"]').first();
    const secondItem = page.locator('[draggable="true"]').nth(1);
    
    // Drag and drop
    await firstItem.dragTo(secondItem);
    
    // Submit
    await page.click('button:has-text("Submit Answer")');
  });

  test('question timer counts down', async ({ page }) => {
    // Check timer exists
    const timer = page.locator('text=/⏱️ \\d+s/');
    await expect(timer).toBeVisible();
    
    // Get initial time
    const initialText = await timer.textContent();
    const initialTime = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Wait and check it decreased
    await page.waitForTimeout(2000);
    const newText = await timer.textContent();
    const newTime = parseInt(newText?.match(/\d+/)?.[0] || '0');
    
    expect(newTime).toBeLessThan(initialTime);
  });

  test('question shows points value', async ({ page }) => {
    await expect(page.locator('text=/🎯 \\d+ points/')).toBeVisible();
  });

  test('question shows difficulty badge', async ({ page }) => {
    await expect(page.locator('text=/Difficulty: \\d+\\/10/')).toBeVisible();
  });

  test('submit button is disabled without answer', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Submit Answer")');
    await expect(submitButton).toBeDisabled();
  });

  test('submit button enables after answer provided', async ({ page }) => {
    const input = page.locator('input[placeholder*="answer"]');
    await input.fill('Test answer');
    
    const submitButton = page.locator('button:has-text("Submit Answer")');
    await expect(submitButton).toBeEnabled();
  });
});
