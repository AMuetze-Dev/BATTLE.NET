/**
 * Editor Types
 *
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/quiz-editor' instead.
 */

// Re-export everything from the new location
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
} from '../features/quiz-editor/types/editor.types';
