/**
 * Quiz Editor Feature - Public API
 *
 * This module exports all public components, services, and types
 * for the Quiz Editor feature.
 */

// Components
export {
	createQuestionEditor,
	hasEditor,
	getQuestionTypeLabel,
	getQuestionTypeAbbreviation,
	getAvailableQuestionTypes,
} from './components/QuestionEditorFactory';

export { MultipleChoiceEditor } from './components/MultipleChoiceEditor';
export { TrueFalseEditor } from './components/TrueFalseEditor';
export { TextEditor } from './components/TextEditor';
export { BuzzerEditor } from './components/BuzzerEditor';
export { SliderEditor } from './components/SliderEditor';
export { HotspotEditor } from './components/HotspotEditor';
export { SortingEditor } from './components/SortingEditor';
export { MatchingEditor } from './components/MatchingEditor';
export { ImageChoiceEditor } from './components/ImageChoiceEditor';

// Services
export { validateQuestion, getQuestionAnswerSummary, hasRequiredMedia } from './services/question-validation.service';
export { createQuestion, convertQuestionType, cloneQuestion } from './services/question-factory.service';

// Types
export type {
	EditorQuestion,
	EditorQuestionType,
	EditorAnswer,
	EditorMatchingPair,
	EditorImageOption,
	EditorMultipleChoiceQuestion,
	EditorTrueFalseQuestion,
	EditorTextQuestion,
	EditorBuzzerQuestion,
	EditorSliderQuestion,
	EditorHotspotQuestion,
	EditorSortingQuestion,
	EditorMatchingQuestion,
	EditorImageChoiceQuestion,
	QuestionEditorProps,
	QuestionValidationResult,
} from './types/editor.types';

// Type guards
export { isMultipleChoice, isTrueFalse, isText, isBuzzer, isSlider, isHotspot, isSorting, isMatching, isImageChoice, hasImage, hasAudio, hasMedia } from './types/editor.types';
