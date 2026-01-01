/**
 * Question Factory Service
 *
 * Creates new questions and handles type conversion.
 * Follows Single Responsibility Principle by handling only question creation logic.
 */
import type { EditorQuestion, EditorQuestionType, EditorAnswer, EditorMatchingPair, EditorImageOption } from '../types/editor.types';

/**
 * Create a new empty question of a specific type
 *
 * @param type - The question type to create
 * @param existingId - Optional existing ID to preserve
 * @returns A new question with default values for the given type
 */
export function createQuestion(type: EditorQuestionType, existingId?: string): EditorQuestion {
	const id = existingId ?? `q-${Date.now()}`;
	const baseQuestion = {
		id,
		question: '',
		points: 5,
		hint: undefined,
		imageUrl: undefined,
		imageData: undefined,
		audioUrl: undefined,
		audioData: undefined,
	};

	switch (type) {
		case 'multiple-choice':
			return {
				...baseQuestion,
				type: 'multiple-choice',
				answers: createDefaultAnswers(),
				correctAnswer: 0,
			};

		case 'true-false':
			return {
				...baseQuestion,
				type: 'true-false',
				correctAnswer: 1, // Default to true
			};

		case 'text':
			return {
				...baseQuestion,
				type: 'text',
				correctAnswerText: '',
				textInputType: 'text',
			};

		case 'buzzer':
			return {
				...baseQuestion,
				type: 'buzzer',
				correctAnswerText: '',
			};

		case 'slider':
			return {
				...baseQuestion,
				type: 'slider',
				sliderMin: 0,
				sliderMax: 100,
				sliderStep: 1,
				sliderUnit: '',
				sliderCorrectValue: 50,
			};

		case 'hotspot':
			return {
				...baseQuestion,
				type: 'hotspot',
				hotspotX: 50,
				hotspotY: 50,
				hotspotAllowZoom: true,
			};

		case 'sorting':
			return {
				...baseQuestion,
				type: 'sorting',
				sortingItems: ['Element 1', 'Element 2', 'Element 3'],
			};

		case 'matching':
			return {
				...baseQuestion,
				type: 'matching',
				matchingPairs: createDefaultMatchingPairs(),
			};

		case 'image-choice':
			return {
				...baseQuestion,
				type: 'image-choice',
				imageOptions: createDefaultImageOptions(),
				imageChoiceMultiSelect: false,
			};

		default:
			// Default to buzzer if unknown type
			return {
				...baseQuestion,
				type: 'buzzer',
				correctAnswerText: '',
			};
	}
}

/**
 * Convert a question to a new type, preserving common fields
 *
 * @param question - The existing question
 * @param newType - The new type to convert to
 * @returns A new question of the specified type with preserved common fields
 */
export function convertQuestionType(question: EditorQuestion, newType: EditorQuestionType): EditorQuestion {
	// If same type, return as-is
	if (question.type === newType) {
		return question;
	}

	// Create new question with the new type
	const newQuestion = createQuestion(newType, question.id);

	// Preserve common fields
	newQuestion.question = question.question;
	newQuestion.points = question.points;
	newQuestion.hint = question.hint;
	newQuestion.imageUrl = question.imageUrl;
	newQuestion.imageData = question.imageData;
	newQuestion.audioUrl = question.audioUrl;
	newQuestion.audioData = question.audioData;

	return newQuestion;
}

/**
 * Create default multiple choice answers
 */
export function createDefaultAnswers(): EditorAnswer[] {
	return [
		{ id: 'a1', text: '', isCorrect: true },
		{ id: 'a2', text: '', isCorrect: false },
		{ id: 'a3', text: '', isCorrect: false },
		{ id: 'a4', text: '', isCorrect: false },
	];
}

/**
 * Create default matching pairs
 */
export function createDefaultMatchingPairs(): EditorMatchingPair[] {
	return [
		{ id: 'p1', left: '', right: '' },
		{ id: 'p2', left: '', right: '' },
	];
}

/**
 * Create default image options
 */
export function createDefaultImageOptions(): EditorImageOption[] {
	return [
		{ id: 'opt1', imageUrl: '', alt: 'Option A', correct: true },
		{ id: 'opt2', imageUrl: '', alt: 'Option B', correct: false },
	];
}

/**
 * Clone a question with a new ID
 *
 * @param question - The question to clone
 * @returns A new question with a unique ID
 */
export function cloneQuestion(question: EditorQuestion): EditorQuestion {
	return {
		...structuredClone(question),
		id: `q-${Date.now()}`,
	};
}

/**
 * Check if a question has any content
 */
export function hasContent(question: EditorQuestion): boolean {
	return question.question.trim() !== '';
}
