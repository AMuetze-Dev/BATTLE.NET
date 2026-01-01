/**
 * AnswerInput - Molecule component that renders the appropriate input based on question type
 *
 * Supports: text, number, true_false, multiple_choice, slider, buzzer, hotspot, sorting
 * Includes submit button with toggle functionality (send/withdraw)
 */
import React from 'react';
import styled from 'styled-components';
import { Trans } from '@lingui/react/macro';
import { Button, TextInput, NumberInput, TrueFalseInput, MultipleChoiceInput, SliderInput, BuzzerButton, HotspotInput, SortingInput, Icon } from '../atoms';
import { colors, spacing, typography, borderRadius } from '../../theme';

// Normalized question types used internally
export type QuestionType = 'text' | 'number' | 'true_false' | 'multiple_choice' | 'slider' | 'buzzer' | 'hotspot' | 'sorting';

// Map various backend/editor type formats to normalized types
const normalizeQuestionType = (type: string | undefined): QuestionType => {
	if (!type) return 'text';
	const normalized = type.toLowerCase().replace(/-/g, '_');
	switch (normalized) {
		case 'true_false':
		case 'truefalse':
			return 'true_false';
		case 'multiple_choice':
		case 'multiplechoice':
			return 'multiple_choice';
		case 'buzzer':
			return 'buzzer';
		case 'slider':
			return 'slider';
		case 'hotspot':
		case 'image_question':
		case 'imagequestion':
			return 'hotspot';
		case 'sorting':
		case 'sort':
			return 'sorting';
		case 'number':
		case 'input_number':
		case 'inputnumber':
			return 'number';
		case 'text':
		case 'input_text':
		case 'inputtext':
		default:
			return 'text';
	}
};

export interface Question {
	id?: string;
	type?: string;
	question?: string;
	text?: string;
	options?: string[];
	answers?: Array<{ id: string; text: string; isCorrect: boolean }>;
	min?: number;
	max?: number;
	step?: number;
	expected_answer?: string;
	correctAnswerText?: string;
	textInputType?: 'text' | 'number';
	/** Unit for slider display (e.g., "km", "Jahre") */
	unit?: string;
	/** Image source for hotspot questions */
	image?: string;
	imageData?: string;
	imageUrl?: string;
	/** Allow zoom for hotspot images */
	allowZoom?: boolean;
	/** Items for sorting questions */
	sortingItems?: string[];
	/** Shuffled item indices for sorting (sent from backend) */
	shuffledOrder?: number[];
}

export interface AnswerInputProps {
	/** The current question being answered */
	question: Question | null;
	/** Current answer value */
	value: string;
	/** Called when answer changes */
	onChange: (value: string) => void;
	/** Called when user submits/withdraws answer */
	onSubmit: () => void;
	/** Called when buzzer is pressed */
	onBuzzerPress?: () => void;
	/** Whether the input is locked (no interaction allowed) */
	locked?: boolean;
	/** Whether the answer has been submitted */
	submitted?: boolean;
	/** Buzzer winner info (if someone already buzzed) */
	buzzerWinner?: {
		player_id: number;
		player_name: string;
	} | null;
	/** Current player ID (to check if I am the buzzer winner) */
	currentPlayerId?: number;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${spacing.md};
	width: 100%;

	@media (max-width: 480px) {
		gap: ${spacing.sm};
	}
`;

const InputWrapper = styled.div`
	width: 100%;
	display: flex;
	justify-content: center;
`;

const SubmitButton = styled(Button)`
	min-width: 200px;

	@media (max-width: 480px) {
		min-width: 100%;
		max-width: 280px;
		height: 48px;
		font-size: ${typography.fontSize.md};
	}
`;

const BuzzerHint = styled.div`
	font-size: ${typography.fontSize.sm};
	color: ${colors.text.secondary};
`;

const BuzzerWinnerDisplay = styled.div`
	padding: ${spacing.md} ${spacing.xl};
	background: ${colors.primary[100]};
	border: 2px solid ${colors.primary[400]};
	border-radius: ${borderRadius.lg};
	color: ${colors.primary[800]};
	font-weight: ${typography.fontWeight.bold};
	font-size: ${typography.fontSize.lg};
	text-align: center;

	@media (max-width: 480px) {
		padding: ${spacing.sm} ${spacing.md};
		font-size: ${typography.fontSize.md};
	}
`;

const WaitingPlaceholder = styled.div`
	color: ${colors.text.secondary};
	font-size: ${typography.fontSize.md};
	padding: ${spacing.md};
`;

export const AnswerInput: React.FC<AnswerInputProps> = ({ question, value, onChange, onSubmit, onBuzzerPress, locked = false, submitted = false, buzzerWinner, currentPlayerId }) => {
	const questionType = normalizeQuestionType(question?.type);
	const isInputLocked = locked || submitted;
	const iAmWinner = buzzerWinner?.player_id === currentPlayerId;

	// Get options from question - support both 'options' array and 'answers' array format
	const getOptions = (): string[] => {
		if (question?.options && question.options.length > 0) {
			return question.options;
		}
		if (question?.answers && question.answers.length > 0) {
			return question.answers.map((a) => a.text);
		}
		return [];
	};

	// Get sorting items - use sortingItems or answers
	const getSortingItems = (): string[] => {
		if (question?.sortingItems && question.sortingItems.length > 0) {
			return question.sortingItems;
		}
		if (question?.answers && question.answers.length > 0) {
			return question.answers.map((a) => a.text);
		}
		return [];
	};

	// Get image source for hotspot
	const getHotspotImage = (): string => {
		return question?.image || question?.imageData || question?.imageUrl || '';
	};

	// Handle Enter key for text/number inputs
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !submitted && value.trim()) {
			onSubmit();
		}
	};

	// Check if submit button should be disabled
	const isSubmitDisabled = (() => {
		if (locked) return true;
		if (!value && !submitted) return true;
		return false;
	})();

	// Buzzer question - show buzzer button or winner display
	if (questionType === 'buzzer') {
		// If someone already buzzed in a buzzer question, show winner display
		if (buzzerWinner) {
			return (
				<Container>
					<BuzzerWinnerDisplay>
						{iAmWinner ? (
							<>
								<Icon name="check" size="md" color="success" /> <Trans id="player.youBuzzed">Du hast gebuzzert!</Trans>
							</>
						) : (
							<>
								<Icon name="bell" size="md" color="warning" /> <Trans id="player.otherBuzzed">{buzzerWinner.player_name} hat gebuzzert!</Trans>
							</>
						)}
					</BuzzerWinnerDisplay>
				</Container>
			);
		}
		return (
			<Container>
				<BuzzerButton onPress={() => onBuzzerPress?.()} locked={locked} />
				{!locked && (
					<BuzzerHint>
						<Trans id="player.buzzerHint">Drücke Leertaste oder klicke</Trans>
					</BuzzerHint>
				)}
			</Container>
		);
	}

	// No question yet
	if (!question) {
		return (
			<Container>
				<Icon name="clock" size="xl" color="neutral" />
			</Container>
		);
	}

	// Render appropriate input based on question type
	const renderInput = () => {
		switch (questionType) {
			case 'true_false':
				return <TrueFalseInput value={value} onChange={onChange} locked={isInputLocked} />;

			case 'multiple_choice':
				return <MultipleChoiceInput value={value} onChange={onChange} options={getOptions()} locked={isInputLocked} />;

			case 'slider':
				return <SliderInput value={value} onChange={onChange} min={question.min} max={question.max} step={question.step} unit={question.unit} locked={isInputLocked} />;

			case 'hotspot':
				return <HotspotInput value={value} onChange={onChange} imageSrc={getHotspotImage()} allowZoom={question.allowZoom ?? true} locked={isInputLocked} />;

			case 'sorting':
				return <SortingInput value={value} onChange={onChange} items={getSortingItems()} locked={isInputLocked} />;

			case 'number':
				return <NumberInput value={value} onChange={onChange} min={question.min} max={question.max} step={question.step} locked={isInputLocked} placeholder="0" />;

			case 'text':
			default:
				return <TextInput value={value} onChange={onChange} locked={isInputLocked} inputType={question.textInputType === 'number' ? 'number' : 'text'} placeholder="Deine Antwort..." onKeyDown={handleKeyDown} />;
		}
	};

	return (
		<Container>
			<InputWrapper>{renderInput()}</InputWrapper>
			<SubmitButton onClick={onSubmit} disabled={isSubmitDisabled} variant={submitted ? 'success' : 'primary'}>
				{submitted ? (
					<>
						<Icon name="check" size="xs" /> <Trans id="player.sentWithdraw">Gesendet • Zurückziehen</Trans>
					</>
				) : (
					<Trans id="player.submit">Absenden</Trans>
				)}
			</SubmitButton>
		</Container>
	);
};
