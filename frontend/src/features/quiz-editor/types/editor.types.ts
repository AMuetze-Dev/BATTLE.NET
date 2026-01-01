/**
 * Editor Types - Battle.Net Quiz Platform
 *
 * Types specifically for the Quiz Editor functionality.
 * These types are used internally in the editor and may differ from the API types.
 */

/** Answer option for multiple-choice questions in editor */
export interface EditorAnswer {
	id: string;
	text: string;
	isCorrect: boolean;
}

/** All supported question types in the editor */
export type EditorQuestionType =
	| 'multiple-choice'
	| 'true-false'
	| 'text'
	| 'buzzer'
	| 'slider'
	| 'hotspot'
	| 'sorting'
	| 'matching'
	| 'image-choice';

/** Matching pair for matching questions */
export interface EditorMatchingPair {
	id: string;
	left: string;
	right: string;
}

/** Image option for image-choice questions */
export interface EditorImageOption {
	id: string;
	imageUrl: string;
	imageData?: string;
	alt: string;
	correct: boolean;
}

/**
 * Base question properties shared by all types.
 *
 * All questions can optionally have:
 * - An image (imageUrl/imageData) - displayed by moderator
 * - Audio (audioUrl/audioData) - played by moderator for players to hear
 */
interface EditorQuestionBase {
	id: string;
	question: string;
	points: number;
	hint?: string;
	/** Optional image URL (external or from quiz package) */
	imageUrl?: string;
	/** Optional image as Base64 data URL */
	imageData?: string;
	/** Optional audio URL (external or from quiz package) */
	audioUrl?: string;
	/** Optional audio as Base64 data URL */
	audioData?: string;
}

/** Multiple Choice Question */
export interface EditorMultipleChoiceQuestion extends EditorQuestionBase {
	type: 'multiple-choice';
	answers: EditorAnswer[];
	correctAnswer: number;
}

/** True/False Question */
export interface EditorTrueFalseQuestion extends EditorQuestionBase {
	type: 'true-false';
	correctAnswer: number; // 1 = true, 0 = false
}

/** Text Question */
export interface EditorTextQuestion extends EditorQuestionBase {
	type: 'text';
	correctAnswerText: string;
	textInputType: 'text' | 'number';
}

/** Buzzer Question */
export interface EditorBuzzerQuestion extends EditorQuestionBase {
	type: 'buzzer';
	correctAnswerText?: string;
}

/** Slider Question */
export interface EditorSliderQuestion extends EditorQuestionBase {
	type: 'slider';
	sliderMin: number;
	sliderMax: number;
	sliderStep: number;
	sliderUnit?: string;
	sliderCorrectValue: number;
}

/** Hotspot Question */
export interface EditorHotspotQuestion extends EditorQuestionBase {
	type: 'hotspot';
	hotspotX: number;
	hotspotY: number;
	hotspotAllowZoom: boolean;
}

/** Sorting Question */
export interface EditorSortingQuestion extends EditorQuestionBase {
	type: 'sorting';
	sortingItems: string[];
}

/** Matching Question */
export interface EditorMatchingQuestion extends EditorQuestionBase {
	type: 'matching';
	matchingPairs: EditorMatchingPair[];
}

/** Image Choice Question */
export interface EditorImageChoiceQuestion extends EditorQuestionBase {
	type: 'image-choice';
	imageOptions: EditorImageOption[];
	imageChoiceMultiSelect: boolean;
	/** How many images players must select (optional, defaults to number of correct answers) */
	requiredSelections?: number;
}

/** Union type of all editor questions */
export type EditorQuestion =
	| EditorMultipleChoiceQuestion
	| EditorTrueFalseQuestion
	| EditorTextQuestion
	| EditorBuzzerQuestion
	| EditorSliderQuestion
	| EditorHotspotQuestion
	| EditorSortingQuestion
	| EditorMatchingQuestion
	| EditorImageChoiceQuestion;

/** Type guard functions */
export const isMultipleChoice = (q: EditorQuestion): q is EditorMultipleChoiceQuestion => q.type === 'multiple-choice';
export const isTrueFalse = (q: EditorQuestion): q is EditorTrueFalseQuestion => q.type === 'true-false';
export const isText = (q: EditorQuestion): q is EditorTextQuestion => q.type === 'text';
export const isBuzzer = (q: EditorQuestion): q is EditorBuzzerQuestion => q.type === 'buzzer';
export const isSlider = (q: EditorQuestion): q is EditorSliderQuestion => q.type === 'slider';
export const isHotspot = (q: EditorQuestion): q is EditorHotspotQuestion => q.type === 'hotspot';
export const isSorting = (q: EditorQuestion): q is EditorSortingQuestion => q.type === 'sorting';
export const isMatching = (q: EditorQuestion): q is EditorMatchingQuestion => q.type === 'matching';
export const isImageChoice = (q: EditorQuestion): q is EditorImageChoiceQuestion => q.type === 'image-choice';

/** Check if a question has media attachments */
export const hasImage = (q: EditorQuestion): boolean => Boolean(q.imageUrl || q.imageData);
export const hasAudio = (q: EditorQuestion): boolean => Boolean(q.audioUrl || q.audioData);
export const hasMedia = (q: EditorQuestion): boolean => hasImage(q) || hasAudio(q);

/** Common props for all question type editors */
export interface QuestionEditorProps<T extends EditorQuestion = EditorQuestion> {
	question: T;
	onChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

/** Validation result for a question */
export interface QuestionValidationResult {
	isValid: boolean;
	errors: string[];
}

/** Question catalog structure */
export interface EditorQuestionCatalog {
	title: string;
	description: string;
	questions: EditorQuestion[];
	gameMode: 'free-for-all' | 'team';
	teamConfig: {
		enabled: boolean;
		teams: Array<{
			id: string;
			name: string;
			color: string;
		}>;
	};
}
