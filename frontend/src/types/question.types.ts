/**
 * Question Types - Battle.Net Quiz Platform
 * 
 * Discriminated union types for all question types with strict typing.
 * Uses string literal unions for question type discrimination.
 */

/** All supported question types */
export type QuestionType =
  | 'text'
  | 'number'
  | 'slider'
  | 'multiple-choice'
  | 'true-false'
  | 'buzzer'
  | 'hotspot'
  | 'sorting';

/** Normalized question type (lowercase with underscores) */
export type NormalizedQuestionType =
  | 'text'
  | 'number'
  | 'slider'
  | 'multiple_choice'
  | 'true_false'
  | 'buzzer'
  | 'hotspot'
  | 'sorting';

/** Base question properties shared by all types */
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
  text?: string; // Alternative to question
  points: number;
  section?: string;
  image?: string;
  imageData?: string;
  imageUrl?: string;
}

/** Text input question - free text answer */
export interface TextQuestion extends BaseQuestion {
  type: 'text';
  correctAnswers: string[];
  requiredCorrect?: number;
  caseSensitive?: boolean;
}

/** Number input question - numeric answer */
export interface NumberQuestion extends BaseQuestion {
  type: 'number';
  correctValue: number;
  tolerance?: number;
  min?: number;
  max?: number;
}

/** Slider/estimation question */
export interface SliderQuestion extends BaseQuestion {
  type: 'slider';
  sliderMin: number;
  sliderMax: number;
  sliderStep?: number;
  sliderUnit?: string;
  correctValue?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/** Multiple choice option */
export interface MultipleChoiceOption {
  id: string;
  text: string;
  correct: boolean;
}

/** Multiple choice question */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: MultipleChoiceOption[];
  multiSelect?: boolean;
}

/** True/False question */
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

/** Buzzer question - first to press wins */
export interface BuzzerQuestion extends BaseQuestion {
  type: 'buzzer';
}

/** Hotspot question - click on image location */
export interface HotspotQuestion extends BaseQuestion {
  type: 'hotspot';
  correctX: number;
  correctY: number;
  hotspotX?: number;
  hotspotY?: number;
  tolerance?: number;
}

/** Sorting item */
export interface SortingItem {
  id: string;
  text: string;
  order?: number;
}

/** Sorting question - arrange items in correct order */
export interface SortingQuestion extends BaseQuestion {
  type: 'sorting';
  sortingItems: SortingItem[];
  correctOrder?: string[];
}

/** Union of all question types */
export type Question =
  | TextQuestion
  | NumberQuestion
  | SliderQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | BuzzerQuestion
  | HotspotQuestion
  | SortingQuestion;

/** Question as received from backend (less strict typing) */
export interface QuestionDTO {
  id: string;
  type: string;
  question?: string;
  text?: string;
  points?: number;
  section?: string;
  image?: string;
  imageData?: string;
  imageUrl?: string;
  // Type-specific fields
  correctAnswers?: string[];
  requiredCorrect?: number;
  correctValue?: number;
  tolerance?: number;
  min?: number;
  max?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  sliderUnit?: string;
  options?: MultipleChoiceOption[];
  correctAnswer?: boolean;
  correctX?: number;
  correctY?: number;
  hotspotX?: number;
  hotspotY?: number;
  sortingItems?: SortingItem[];
  correctOrder?: string[];
}

/** Question display state */
export interface QuestionDisplayState {
  visible: boolean;
  imageVisible: boolean;
  locked: boolean;
}

/** Type guard functions */
export const isTextQuestion = (q: Question): q is TextQuestion => q.type === 'text';
export const isNumberQuestion = (q: Question): q is NumberQuestion => q.type === 'number';
export const isSliderQuestion = (q: Question): q is SliderQuestion => q.type === 'slider';
export const isMultipleChoiceQuestion = (q: Question): q is MultipleChoiceQuestion => q.type === 'multiple-choice';
export const isTrueFalseQuestion = (q: Question): q is TrueFalseQuestion => q.type === 'true-false';
export const isBuzzerQuestion = (q: Question): q is BuzzerQuestion => q.type === 'buzzer';
export const isHotspotQuestion = (q: Question): q is HotspotQuestion => q.type === 'hotspot';
export const isSortingQuestion = (q: Question): q is SortingQuestion => q.type === 'sorting';

/** Normalize question type to lowercase with underscores */
export const normalizeQuestionType = (type: string): NormalizedQuestionType => {
  return type.toLowerCase().replace(/-/g, '_') as NormalizedQuestionType;
};

/** Get question type display name */
export const getQuestionTypeLabel = (type: QuestionType): string => {
  const labels: Record<QuestionType, string> = {
    'text': 'Text',
    'number': 'Zahl',
    'slider': 'Schätzfrage',
    'multiple-choice': 'Multiple Choice',
    'true-false': 'Wahr/Falsch',
    'buzzer': 'Buzzer',
    'hotspot': 'Hotspot',
    'sorting': 'Sortieren',
  };
  return labels[type] || type;
};

/** Get question type icon */
export const getQuestionTypeIcon = (type: QuestionType): string => {
  const icons: Record<QuestionType, string> = {
    'text': '✏️',
    'number': '🔢',
    'slider': '📊',
    'multiple-choice': '☑️',
    'true-false': '⚖️',
    'buzzer': '🔔',
    'hotspot': '📍',
    'sorting': '↕️',
  };
  return icons[type] || '❓';
};
