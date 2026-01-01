import { test as base, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Test Fixtures for Battle.Net Quiz Platform
 *
 * Provides reusable helpers for E2E tests
 */

export interface QuizTestContext {
	sessionCode: string;
	moderatorToken: string;
	quizId: string;
}

export interface PlayerInfo {
	name: string;
	page: Page;
}

/**
 * Test helper class for quiz operations
 */
export class QuizTestHelper {
	constructor(private context: BrowserContext) {}

	/**
	 * Create a new browser page
	 */
	async newPage(): Promise<Page> {
		return this.context.newPage();
	}

	/**
	 * Navigate to home page
	 */
	async goHome(page: Page): Promise<void> {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	}

	/**
	 * Open the quiz editor
	 */
	async openEditor(page: Page): Promise<void> {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');
	}

	/**
	 * Create a session with the first available quiz
	 */
	async createSession(page: Page): Promise<string | null> {
		await this.goHome(page);

		// Open create session modal
		const createButton = page.locator('text=Session starten, text=Session erstellen, text=Create Session');
		await createButton.first().click();

		// Wait for modal
		await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 }).catch(() => {});
		await page.waitForTimeout(1500);

		// Check if quizzes exist
		const emptyMessage = page.locator('text=Keine Quizze, text=No quizzes');
		if (await emptyMessage.isVisible().catch(() => false)) {
			return null;
		}

		// Select first quiz
		const quizItem = page.locator('[data-testid^="quiz-item"]').first();
		if (await quizItem.isVisible()) {
			await quizItem.click();
		}

		// Click create
		const startButton = page.locator('button:has-text("starten"), button:has-text("Session")').last();
		await startButton.click();

		// Wait for redirect
		await page.waitForURL(/\/moderator\//i, { timeout: 10000 }).catch(() => {});

		// Extract session code
		const url = page.url();
		const sessionCode = url.split('/moderator/')[1]?.split('?')[0] || null;

		return sessionCode;
	}

	/**
	 * Join a session as a player
	 */
	async joinSession(page: Page, sessionCode: string, playerName: string): Promise<boolean> {
		await this.goHome(page);

		// Open join modal
		const joinButton = page.locator('text=Session beitreten, text=Beitreten, text=Join Session');
		await joinButton.first().click();

		// Wait for modal
		await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 }).catch(() => {});

		// Fill session code
		const codeInput = page.locator('input').first();
		await codeInput.fill(sessionCode);

		// Fill name
		const inputs = page.locator('input');
		if ((await inputs.count()) > 1) {
			await inputs.nth(1).fill(playerName);
		}

		// Click join
		const submitButton = page.locator('button:has-text("Beitreten"), button:has-text("Join")');
		await submitButton.first().click();

		// Wait for redirect
		try {
			await page.waitForURL(/\/player\//i, { timeout: 10000 });
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Wait for WebSocket connection
	 */
	async waitForConnection(page: Page, timeout = 5000): Promise<void> {
		const connectedIndicator = page.locator('text=Connected, text=Verbunden, .connection-status');
		await connectedIndicator.waitFor({ state: 'visible', timeout }).catch(() => {});
	}

	/**
	 * Navigate to next question (moderator)
	 */
	async nextQuestion(page: Page): Promise<void> {
		const nextButton = page.locator('button:has-text("→"), button:has-text("Next"), [aria-label*="Next"]').first();
		if (await nextButton.isVisible()) {
			await nextButton.click();
			await page.waitForTimeout(500);
		}
	}

	/**
	 * Navigate to previous question (moderator)
	 */
	async prevQuestion(page: Page): Promise<void> {
		const prevButton = page.locator('button:has-text("←"), button:has-text("Prev"), [aria-label*="Previous"]').first();
		if (await prevButton.isVisible()) {
			await prevButton.click();
			await page.waitForTimeout(500);
		}
	}

	/**
	 * Reveal question to players (moderator)
	 */
	async revealQuestion(page: Page): Promise<void> {
		const revealButton = page.locator('button:has-text("Show"), button:has-text("Reveal"), [aria-label*="reveal"], [aria-label*="visibility"]').first();
		if (await revealButton.isVisible()) {
			await revealButton.click();
			await page.waitForTimeout(500);
		}
	}

	/**
	 * Add points to a player (moderator)
	 */
	async addPoints(page: Page, playerName?: string): Promise<void> {
		// If player name is provided, find the specific player row
		let container = page;
		if (playerName) {
			const playerRow = page.locator(`text=${playerName}`).locator('..');
			if (await playerRow.isVisible()) {
				container = playerRow as unknown as Page;
			}
		}

		const plusButton = container.locator('button:has-text("+")').first();
		if (await plusButton.isVisible()) {
			await plusButton.click();
			await page.waitForTimeout(300);
		}
	}

	/**
	 * Subtract points from a player (moderator)
	 */
	async subtractPoints(page: Page, playerName?: string): Promise<void> {
		let container = page;
		if (playerName) {
			const playerRow = page.locator(`text=${playerName}`).locator('..');
			if (await playerRow.isVisible()) {
				container = playerRow as unknown as Page;
			}
		}

		const minusButton = container.locator('button:has-text("−"), button:has-text("-")').first();
		if (await minusButton.isVisible()) {
			await minusButton.click();
			await page.waitForTimeout(300);
		}
	}

	/**
	 * End session (moderator)
	 */
	async endSession(page: Page): Promise<void> {
		// Handle confirmation dialog
		page.on('dialog', (dialog) => dialog.accept());

		const endButton = page.locator('button:has-text("End"), button:has-text("Beenden"), [aria-label*="end"]').first();
		if (await endButton.isVisible()) {
			await endButton.click();
			await page.waitForTimeout(500);
		}
	}

	/**
	 * Delete a quiz by title
	 */
	async deleteQuiz(page: Page, quizTitle: string): Promise<boolean> {
		await this.goHome(page);

		// Open session modal to access quiz list
		const createButton = page.locator('text=Session starten, text=Session erstellen');
		await createButton.first().click();

		await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 }).catch(() => {});
		await page.waitForTimeout(1000);

		// Find the quiz
		const quizLocator = page.locator(`text=${quizTitle}`);
		if (!(await quizLocator.isVisible())) {
			return false;
		}

		// Handle confirmation
		page.on('dialog', (dialog) => dialog.accept());

		// Find and click delete button
		const deleteButton = page.locator('[aria-label="Quiz löschen"], [title="Quiz löschen"]').first();
		if (await deleteButton.isVisible()) {
			await deleteButton.click();
			await page.waitForTimeout(500);
			return true;
		}

		return false;
	}

	/**
	 * Get player count from moderator view
	 */
	async getPlayerCount(page: Page): Promise<number> {
		const countText = page.locator('text=/\\d+ (Spieler|Players|verbunden|connected)/i');
		if (await countText.isVisible()) {
			const text = await countText.textContent();
			const match = text?.match(/(\d+)/);
			return match ? parseInt(match[1]) : 0;
		}
		return 0;
	}

	/**
	 * Get current score for a player
	 */
	async getPlayerScore(page: Page, playerName: string): Promise<number> {
		const playerRow = page.locator(`text=${playerName}`).locator('..');
		const scoreText = playerRow.locator('text=/\\d+/').first();
		if (await scoreText.isVisible()) {
			const text = await scoreText.textContent();
			return parseInt(text || '0');
		}
		return 0;
	}
}

/**
 * Extended test fixture with helper
 */
export const test = base.extend<{ helper: QuizTestHelper }>({
	helper: async ({ context }, use) => {
		const helper = new QuizTestHelper(context);
		await use(helper);
	},
});

export { expect };
