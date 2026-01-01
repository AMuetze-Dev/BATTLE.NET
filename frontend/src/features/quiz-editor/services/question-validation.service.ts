/**
 * Question Validation Service
 *
 * Centralized validation logic for all question types.
 * Follows Single Responsibility Principle by handling only validation concerns.
 */
import type { EditorQuestion, QuestionValidationResult, EditorQuestionType, EditorAnswer } from '../types/editor.types';

/**
 * Validate a question based on its type
 *
 * @param question - The question to validate
 * @returns Validation result with status and error messages
 */
export function validateQuestion(question: EditorQuestion): QuestionValidationResult {
	const errors: string[] = [];

	// Common validations
	if (!question.question.trim()) {
		errors.push('Die Frage darf nicht leer sein.');
	}

	if (question.points <= 0) {
		errors.push('Die Punktzahl muss größer als 0 sein.');
	}

	// Type-specific validations
	switch (question.type) {
		case 'multiple-choice':
			errors.push(...validateMultipleChoice(question));
			break;
		case 'true-false':
			// No additional validation needed
			break;
		case 'text':
			errors.push(...validateText(question));
			break;
		case 'buzzer':
			// Buzzer questions don't require additional validation
			break;
		case 'slider':
			errors.push(...validateSlider(question));
			break;
		case 'hotspot':
			errors.push(...validateHotspot(question));
			break;
		case 'sorting':
			errors.push(...validateSorting(question));
			break;
		case 'matching':
			errors.push(...validateMatching(question));
			break;
		case 'image-choice':
			errors.push(...validateImageChoice(question));
			break;
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

function validateMultipleChoice(question: { answers: EditorAnswer[] }): string[] {
	const errors: string[] = [];

	if (question.answers.length < 2) {
		errors.push('Multiple-Choice-Fragen benötigen mindestens 2 Antworten.');
	}

	const hasCorrectAnswer = question.answers.some((a) => a.isCorrect);
	if (!hasCorrectAnswer) {
		errors.push('Mindestens eine Antwort muss als korrekt markiert sein.');
	}

	const hasEmptyAnswer = question.answers.some((a) => !a.text.trim());
	if (hasEmptyAnswer) {
		errors.push('Alle Antworten müssen ausgefüllt sein.');
	}

	return errors;
}

function validateText(question: { correctAnswerText: string }): string[] {
	const errors: string[] = [];

	if (!question.correctAnswerText.trim()) {
		errors.push('Die korrekte Antwort muss angegeben werden.');
	}

	return errors;
}

function validateSlider(question: {
	sliderMin: number;
	sliderMax: number;
	sliderCorrectValue: number;
}): string[] {
	const errors: string[] = [];
	const { sliderMin, sliderMax, sliderCorrectValue } = question;

	if (sliderMin >= sliderMax) {
		errors.push('Das Minimum muss kleiner als das Maximum sein.');
	}

	if (sliderCorrectValue < sliderMin || sliderCorrectValue > sliderMax) {
		errors.push(`Der korrekte Wert (${sliderCorrectValue}) muss zwischen ${sliderMin} und ${sliderMax} liegen.`);
	}

	return errors;
}

function validateHotspot(question: { imageData?: string; imageUrl?: string }): string[] {
	const errors: string[] = [];

	if (!question.imageData && !question.imageUrl) {
		errors.push('Hotspot-Fragen benötigen ein Bild.');
	}

	return errors;
}

function validateSorting(question: { sortingItems: string[] }): string[] {
	const errors: string[] = [];
	const items = question.sortingItems;

	if (items.length < 2) {
		errors.push('Sortieraufgaben benötigen mindestens 2 Elemente.');
	}

	const hasEmptyItem = items.some((item) => !item.trim());
	if (hasEmptyItem) {
		errors.push('Alle Sortierelemente müssen ausgefüllt sein.');
	}

	return errors;
}

function validateMatching(question: {
	matchingPairs: Array<{ left: string; right: string }>;
}): string[] {
	const errors: string[] = [];
	const pairs = question.matchingPairs;

	if (pairs.length < 2) {
		errors.push('Paarzuordnungs-Fragen benötigen mindestens 2 Paare.');
	}

	const hasEmptyPair = pairs.some((p) => !p.left.trim() || !p.right.trim());
	if (hasEmptyPair) {
		errors.push('Alle Paare müssen ausgefüllt sein.');
	}

	return errors;
}

function validateImageChoice(question: {
	imageOptions: Array<{ imageData?: string; imageUrl: string; correct: boolean }>;
}): string[] {
	const errors: string[] = [];
	const options = question.imageOptions;

	if (options.length < 2) {
		errors.push('Bildauswahl-Fragen benötigen mindestens 2 Optionen.');
	}

	const hasEmptyImage = options.some((o) => !o.imageData && !o.imageUrl);
	if (hasEmptyImage) {
		errors.push('Alle Bildoptionen müssen ein Bild haben.');
	}

	const hasCorrect = options.some((o) => o.correct);
	if (!hasCorrect) {
		errors.push('Mindestens eine Bildoption muss als korrekt markiert sein.');
	}

	return errors;
}

/**
 * Check if a question has required media (image/audio)
 */
export function hasRequiredMedia(question: EditorQuestion): boolean {
	switch (question.type) {
		case 'hotspot':
			return !!(question.imageData || question.imageUrl);
		case 'image-choice':
			return question.imageOptions.every((o) => o.imageData || o.imageUrl);
		default:
			return true;
	}
}

/**
 * Get a summary of the question's answer for display
 */
export function getQuestionAnswerSummary(question: EditorQuestion): string {
	switch (question.type) {
		case 'multiple-choice': {
			const correctAnswer = question.answers.find((a) => a.isCorrect);
			return correctAnswer?.text || 'Nicht festgelegt';
		}
		case 'true-false':
			return question.correctAnswer === 1 ? 'Wahr' : 'Falsch';
		case 'text':
		case 'buzzer':
			return question.correctAnswerText || '';
		case 'slider':
			return `${question.sliderCorrectValue}${question.sliderUnit ? ` ${question.sliderUnit}` : ''} (${question.sliderMin}-${question.sliderMax})`;
		case 'hotspot':
			if (!question.imageData && !question.imageUrl) {
				return 'Bild erforderlich';
			}
			return `Markierung bei ${question.hotspotX?.toFixed(0)}%, ${question.hotspotY?.toFixed(0)}%`;
		case 'sorting':
			return `${question.sortingItems.length} Elemente`;
		case 'matching':
			return `${question.matchingPairs.length} Paare`;
		case 'image-choice':
			return `${question.imageOptions.length} Bilder`;
		default:
			return '';
	}
}

/**
 * Check if a question type requires an image to be uploaded
 */
export function requiresImage(type: EditorQuestionType): boolean {
	return type === 'hotspot';
}

/**
 * Check if a question type has issues that need attention
 */
export function hasIssues(question: EditorQuestion): boolean {
	const validation = validateQuestion(question);
	return !validation.isValid;
}
