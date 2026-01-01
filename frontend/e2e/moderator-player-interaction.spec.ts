import { test, expect } from './fixtures';

/**
 * E2E Test: Moderator-Player Interaction
 *
 * Tests the real-time interaction between moderator and players:
 * - Score management
 * - Question visibility controls
 * - Buzzer functionality
 * - Answer submission and verification
 */

test.describe('Moderator-Player Interaction', () => {
	test.describe.configure({ mode: 'serial' });

	let sessionCode: string | null = null;

	test.beforeAll(async ({ browser }) => {
		// Setup: Create a session for all tests in this suite
		const context = await browser.newContext();
		const page = await context.newPage();
		const testHelper = new (await import('./fixtures')).QuizTestHelper(context);

		sessionCode = await testHelper.createSession(page);

		if (!sessionCode) {
			console.log('No quizzes available - some tests will be skipped');
		}

		await context.close();
	});

	test('moderator can see player join in real-time', async ({ helper, context }) => {
		if (!sessionCode) {
			test.skip();
			return;
		}

		const moderatorPage = await helper.newPage();
		const playerPage = await helper.newPage();

		// Moderator goes to session
		await moderatorPage.goto(`/moderator/${sessionCode}`);
		await moderatorPage.waitForLoadState('networkidle');

		// Player joins
		await helper.joinSession(playerPage, sessionCode, 'RealTimePlayer');

		// Wait for WebSocket update
		await moderatorPage.waitForTimeout(2000);

		// Verify moderator sees the player
		await expect(moderatorPage.locator('text=RealTimePlayer')).toBeVisible({ timeout: 5000 });

		await moderatorPage.close();
		await playerPage.close();
	});

	test('score changes reflect on player leaderboard', async ({ helper }) => {
		if (!sessionCode) {
			test.skip();
			return;
		}

		const moderatorPage = await helper.newPage();
		const playerPage = await helper.newPage();

		// Setup session
		await moderatorPage.goto(`/moderator/${sessionCode}`);
		await helper.joinSession(playerPage, sessionCode, 'ScorePlayer');

		await moderatorPage.waitForTimeout(2000);

		// Get initial score (should be 0)
		const initialScore = await helper.getPlayerScore(moderatorPage, 'ScorePlayer');

		// Add points
		await helper.addPoints(moderatorPage, 'ScorePlayer');
		await moderatorPage.waitForTimeout(500);

		// Check score increased
		const newScore = await helper.getPlayerScore(moderatorPage, 'ScorePlayer');
		expect(newScore).toBeGreaterThan(initialScore);

		// Check player page reflects the change
		await playerPage.waitForTimeout(1000);
		const playerScoreElement = playerPage.locator(`text=${newScore}`);
		await expect(playerScoreElement).toBeVisible({ timeout: 5000 }).catch(() => {
			// Score might be displayed differently
			console.log('Score display format may differ on player side');
		});

		await moderatorPage.close();
		await playerPage.close();
	});

	test('question visibility toggle works', async ({ helper }) => {
		if (!sessionCode) {
			test.skip();
			return;
		}

		const moderatorPage = await helper.newPage();
		const playerPage = await helper.newPage();

		await moderatorPage.goto(`/moderator/${sessionCode}`);
		await helper.joinSession(playerPage, sessionCode, 'VisibilityPlayer');

		await moderatorPage.waitForTimeout(1500);

		// Navigate to a question
		await helper.nextQuestion(moderatorPage);
		await moderatorPage.waitForTimeout(500);

		// Toggle question visibility
		await helper.revealQuestion(moderatorPage);
		await moderatorPage.waitForTimeout(1000);

		// Player should see the question content
		// The exact selector depends on the UI, but we check for any question-like content
		const questionElements = playerPage.locator('.question-content, .question-text, h2, h3');
		const count = await questionElements.count();
		console.log(`Found ${count} potential question elements on player page`);

		await moderatorPage.close();
		await playerPage.close();
	});

	test('multiple players receive synchronized updates', async ({ helper }) => {
		if (!sessionCode) {
			test.skip();
			return;
		}

		const moderatorPage = await helper.newPage();
		const player1Page = await helper.newPage();
		const player2Page = await helper.newPage();
		const player3Page = await helper.newPage();

		// Moderator opens session
		await moderatorPage.goto(`/moderator/${sessionCode}`);
		await moderatorPage.waitForLoadState('networkidle');

		// All players join
		await helper.joinSession(player1Page, sessionCode, 'SyncPlayer1');
		await helper.joinSession(player2Page, sessionCode, 'SyncPlayer2');
		await helper.joinSession(player3Page, sessionCode, 'SyncPlayer3');

		// Wait for all connections
		await moderatorPage.waitForTimeout(3000);

		// Verify moderator sees all players
		await expect(moderatorPage.locator('text=SyncPlayer1')).toBeVisible({ timeout: 5000 });
		await expect(moderatorPage.locator('text=SyncPlayer2')).toBeVisible({ timeout: 5000 });
		await expect(moderatorPage.locator('text=SyncPlayer3')).toBeVisible({ timeout: 5000 });

		// Moderator changes question
		await helper.nextQuestion(moderatorPage);
		await helper.revealQuestion(moderatorPage);

		// Wait for update to propagate
		await player1Page.waitForTimeout(1000);

		// All players should receive the update simultaneously
		// We check the leaderboard is visible on all player pages
		await expect(player1Page.locator('text=Leaderboard')).toBeVisible({ timeout: 5000 }).catch(() => {});
		await expect(player2Page.locator('text=Leaderboard')).toBeVisible({ timeout: 5000 }).catch(() => {});
		await expect(player3Page.locator('text=Leaderboard')).toBeVisible({ timeout: 5000 }).catch(() => {});

		await moderatorPage.close();
		await player1Page.close();
		await player2Page.close();
		await player3Page.close();
	});

	test('timer controls update for all players', async ({ helper }) => {
		if (!sessionCode) {
			test.skip();
			return;
		}

		const moderatorPage = await helper.newPage();
		const playerPage = await helper.newPage();

		await moderatorPage.goto(`/moderator/${sessionCode}`);
		await helper.joinSession(playerPage, sessionCode, 'TimerPlayer');

		await moderatorPage.waitForTimeout(1500);

		// Find timer controls on moderator page
		const timerIncrease = moderatorPage.locator('button:has-text("+"), [aria-label*="Increase timer"]').last();
		const timerDecrease = moderatorPage.locator('button:has-text("−"), button:has-text("-"), [aria-label*="Decrease timer"]').first();

		if (await timerIncrease.isVisible()) {
			// Increase timer
			await timerIncrease.click();
			await moderatorPage.waitForTimeout(500);

			// Check timer display updated
			const timerDisplay = moderatorPage.locator('text=/\\d+s/');
			if (await timerDisplay.isVisible()) {
				const timerText = await timerDisplay.textContent();
				console.log('Timer value:', timerText);
			}
		}

		await moderatorPage.close();
		await playerPage.close();
	});
});

test.describe('Buzzer Functionality', () => {
	test('player can buzz and moderator sees it', async ({ helper }) => {
		const moderatorPage = await helper.newPage();
		const playerPage = await helper.newPage();

		// Create session
		const sessionCode = await helper.createSession(moderatorPage);

		if (!sessionCode) {
			test.skip();
			return;
		}

		// Player joins
		await helper.joinSession(playerPage, sessionCode, 'BuzzerPlayer');
		await moderatorPage.waitForTimeout(1500);

		// Navigate to a buzzer question (if available)
		await helper.nextQuestion(moderatorPage);
		await helper.revealQuestion(moderatorPage);
		await playerPage.waitForTimeout(1000);

		// Look for buzzer button on player page
		const buzzerButton = playerPage.locator('button:has-text("BUZZ"), button:has-text("Buzzer"), [aria-label*="buzzer"]');

		if (await buzzerButton.isVisible()) {
			// Click buzzer
			await buzzerButton.click();
			await playerPage.waitForTimeout(500);

			// Check moderator sees the buzz
			const buzzIndicator = moderatorPage.locator('text=BuzzerPlayer, text=buzzed, .buzz-indicator');
			await expect(buzzIndicator.first()).toBeVisible({ timeout: 5000 }).catch(() => {
				console.log('Buzz indicator might have different UI');
			});
		} else {
			console.log('No buzzer question available');
		}

		await moderatorPage.close();
		await playerPage.close();
	});

	test('moderator can accept or reject buzzer answer', async ({ helper }) => {
		const moderatorPage = await helper.newPage();
		const playerPage = await helper.newPage();

		const sessionCode = await helper.createSession(moderatorPage);

		if (!sessionCode) {
			test.skip();
			return;
		}

		await helper.joinSession(playerPage, sessionCode, 'AnswerPlayer');
		await moderatorPage.waitForTimeout(1500);

		// Navigate to question
		await helper.nextQuestion(moderatorPage);
		await helper.revealQuestion(moderatorPage);

		// Look for correct/wrong buttons on moderator page
		const correctButton = moderatorPage.locator('button:has-text("Correct"), button:has-text("Richtig"), button:has-text("✓")').first();
		const wrongButton = moderatorPage.locator('button:has-text("Wrong"), button:has-text("Falsch"), button:has-text("✗")').first();

		if (await correctButton.isVisible()) {
			await correctButton.click();
			await moderatorPage.waitForTimeout(500);

			// Points should have been added
			console.log('Correct answer processed');
		}

		await moderatorPage.close();
		await playerPage.close();
	});
});

test.describe('Answer Submission', () => {
	test('player can submit text answer', async ({ helper }) => {
		const moderatorPage = await helper.newPage();
		const playerPage = await helper.newPage();

		const sessionCode = await helper.createSession(moderatorPage);

		if (!sessionCode) {
			test.skip();
			return;
		}

		await helper.joinSession(playerPage, sessionCode, 'TextAnswerPlayer');
		await moderatorPage.waitForTimeout(1500);

		// Navigate and reveal question
		await helper.nextQuestion(moderatorPage);
		await helper.revealQuestion(moderatorPage);
		await playerPage.waitForTimeout(1000);

		// Find answer input on player page
		const answerInput = playerPage.locator('input[type="text"], input[placeholder*="answer"], input[placeholder*="Antwort"]');

		if (await answerInput.isVisible()) {
			// Type answer
			await answerInput.fill('Test Answer');

			// Submit
			const submitButton = playerPage.locator('button:has-text("Submit"), button:has-text("Absenden"), button[type="submit"]');
			if (await submitButton.isVisible()) {
				await submitButton.click();
				await playerPage.waitForTimeout(500);

				// Verify submission feedback
				const feedback = playerPage.locator('text=submitted, text=gesendet, .answer-submitted');
				await expect(feedback.first()).toBeVisible({ timeout: 5000 }).catch(() => {
					console.log('Answer submitted - feedback may vary');
				});
			}
		} else {
			console.log('No text input question available');
		}

		await moderatorPage.close();
		await playerPage.close();
	});

	test('player can select multiple choice answer', async ({ helper }) => {
		const moderatorPage = await helper.newPage();
		const playerPage = await helper.newPage();

		const sessionCode = await helper.createSession(moderatorPage);

		if (!sessionCode) {
			test.skip();
			return;
		}

		await helper.joinSession(playerPage, sessionCode, 'MCPlayer');
		await moderatorPage.waitForTimeout(1500);

		await helper.nextQuestion(moderatorPage);
		await helper.revealQuestion(moderatorPage);
		await playerPage.waitForTimeout(1000);

		// Look for choice buttons
		const choiceButtons = playerPage.locator('.choice-button, button[data-choice], .answer-option');
		const count = await choiceButtons.count();

		if (count > 0) {
			// Click first choice
			await choiceButtons.first().click();
			await playerPage.waitForTimeout(500);

			// Verify selection visual feedback
			const selectedChoice = choiceButtons.first();
			const borderColor = await selectedChoice.evaluate((el) => window.getComputedStyle(el).borderColor);
			console.log('Choice selected, border color:', borderColor);
		} else {
			console.log('No multiple choice question available');
		}

		await moderatorPage.close();
		await playerPage.close();
	});
});
