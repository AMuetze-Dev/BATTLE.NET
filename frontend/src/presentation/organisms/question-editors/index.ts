/**
 * Question Editors - Re-export for backward compatibility
 *
 * @deprecated Import from '@/features/quiz-editor' instead
 */
export {
	createQuestionEditor,
	hasEditor,
	getQuestionTypeLabel,
	getQuestionTypeAbbreviation,
	getAvailableQuestionTypes,
	MultipleChoiceEditor,
	TrueFalseEditor,
	TextEditor,
	BuzzerEditor,
	SliderEditor,
	HotspotEditor,
	SortingEditor,
	MatchingEditor,
	ImageChoiceEditor,
} from '../../../features/quiz-editor';
