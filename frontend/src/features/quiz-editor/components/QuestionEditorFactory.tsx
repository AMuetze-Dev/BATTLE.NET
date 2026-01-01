/**
 * Question Editor Factory
 *
 * Provides the correct editor component based on question type.
 * Follows the Factory Pattern to encapsulate editor creation logic.
 */
import React from 'react';
import type { EditorQuestion, EditorQuestionType } from '../types/editor.types';
import { MultipleChoiceEditor } from './MultipleChoiceEditor';
import { TrueFalseEditor } from './TrueFalseEditor';
import { TextEditor } from './TextEditor';
import { BuzzerEditor } from './BuzzerEditor';
import { SliderEditor } from './SliderEditor';
import { HotspotEditor } from './HotspotEditor';
import { SortingEditor } from './SortingEditor';
import { MatchingEditor } from './MatchingEditor';
import { ImageChoiceEditor } from './ImageChoiceEditor';

/**
 * Factory function to get the appropriate editor component for a question type.
 *
 * @param question - The question to edit
 * @param onChange - Callback for when a field changes
 * @returns The appropriate editor component or null
 */
export function createQuestionEditor(question: EditorQuestion, onChange: <K extends keyof EditorQuestion>(field: K, value: EditorQuestion[K]) => void): React.ReactNode {
	// Type assertion helper for onChange to satisfy specific editor prop requirements
	const typedOnChange = onChange as <T extends EditorQuestion, K extends keyof T>(field: K, value: T[K]) => void;

	switch (question.type) {
		case 'multiple-choice':
			return <MultipleChoiceEditor question={question} onChange={typedOnChange} />;
		case 'true-false':
			return <TrueFalseEditor question={question} onChange={typedOnChange} />;
		case 'text':
			return <TextEditor question={question} onChange={typedOnChange} />;
		case 'buzzer':
			return <BuzzerEditor question={question} onChange={typedOnChange} />;
		case 'slider':
			return <SliderEditor question={question} onChange={typedOnChange} />;
		case 'hotspot':
			return <HotspotEditor question={question} onChange={typedOnChange} />;
		case 'sorting':
			return <SortingEditor question={question} onChange={typedOnChange} />;
		case 'matching':
			return <MatchingEditor question={question} onChange={typedOnChange} />;
		case 'image-choice':
			return <ImageChoiceEditor question={question} onChange={typedOnChange} />;
		default:
			return null;
	}
}

/** Check if a question type has a specific editor */
export function hasEditor(type: EditorQuestionType): boolean {
	const supportedTypes: EditorQuestionType[] = ['multiple-choice', 'true-false', 'text', 'buzzer', 'slider', 'hotspot', 'sorting', 'matching', 'image-choice'];
	return supportedTypes.includes(type);
}

/** Get display label for a question type */
export function getQuestionTypeLabel(type: EditorQuestionType): string {
	const labels: Record<EditorQuestionType, string> = {
		'multiple-choice': 'Multiple Choice',
		'true-false': 'Wahr/Falsch',
		text: 'Texteingabe',
		buzzer: 'Buzzer',
		slider: 'Slider (Schätzfrage)',
		hotspot: 'Hotspot (Bildmarkierung)',
		sorting: 'Sortieraufgabe',
		matching: 'Paarzuordnung',
		'image-choice': 'Bildauswahl',
	};
	return labels[type] || type;
}

/** Get abbreviated label for a question type (for table display) */
export function getQuestionTypeAbbreviation(type: EditorQuestionType): string {
	const abbreviations: Record<EditorQuestionType, string> = {
		'multiple-choice': 'MC',
		'true-false': 'W/F',
		text: 'TXT',
		buzzer: 'BZR',
		slider: 'SLD',
		hotspot: 'HSP',
		sorting: 'SRT',
		matching: 'MTH',
		'image-choice': 'IMG',
	};
	return abbreviations[type] || type.toUpperCase().slice(0, 3);
}

/** Get all available question types */
export function getAvailableQuestionTypes(): Array<{ value: EditorQuestionType; label: string }> {
	return [
		{ value: 'multiple-choice', label: 'Multiple Choice' },
		{ value: 'true-false', label: 'Wahr/Falsch' },
		{ value: 'text', label: 'Texteingabe' },
		{ value: 'buzzer', label: 'Buzzer' },
		{ value: 'slider', label: 'Slider (Schätzfrage)' },
		{ value: 'hotspot', label: 'Hotspot (Bildmarkierung)' },
		{ value: 'sorting', label: 'Sortieraufgabe' },
		{ value: 'matching', label: 'Paarzuordnung' },
		{ value: 'image-choice', label: 'Bildauswahl' },
	];
}
