/**
 * Question Display Component - Renders different question types
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Input, Card, Icon } from '../atoms';
import { colors, spacing, typography } from '../../theme';

export interface Question {
	id: number;
	type: 'input_text' | 'input_number' | 'slider' | 'multiple_choice' | 'buzzer' | 'image' | 'hotspot' | 'sorting';
	text: string;
	category: string;
	difficulty: number;
	points: number;
	time_limit?: number;
	options?: Record<string, any>;
	image_url?: string;
}

interface QuestionDisplayProps {
	question: Question;
	onSubmit: (answer: any) => void;
	onBuzzer?: () => void;
	disabled?: boolean;
	timeRemaining?: number;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.xl};
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${spacing.lg};
`;

const CategoryBadge = styled.span<{ difficulty: number }>`
	padding: ${spacing.xs} ${spacing.md};
	border-radius: 12px;
	font-size: ${typography.fontSize.sm};
	font-weight: ${typography.fontWeight.medium};
	background: ${({ difficulty }) => {
		if (difficulty <= 3) return colors.primary[100];
		if (difficulty <= 6) return colors.primary[100];
		return colors.error[100];
	}};
	color: ${({ difficulty }) => {
		if (difficulty <= 3) return colors.primary[700];
		if (difficulty <= 6) return colors.primary[700];
		return colors.error[700];
	}};
`;

const Timer = styled.div<{ warning: boolean }>`
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.bold};
	font-family: ${typography.fontFamily.mono};
	color: ${({ warning }) => (warning ? colors.error[600] : colors.primary[600])};
`;

const QuestionText = styled.h2`
	margin: 0;
	font-size: ${typography.fontSize['2xl']};
	color: ${colors.text.primary};
	line-height: 1.4;
`;

const PointsDisplay = styled.div`
	font-size: ${typography.fontSize.lg};
	color: ${colors.primary[600]};
	font-weight: ${typography.fontWeight.semibold};
`;

const AnswerArea = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.lg};
`;

const Slider = styled.input`
	width: 100%;
	height: 8px;
	border-radius: 4px;
	outline: none;
	-webkit-appearance: none;
	background: ${colors.neutral[200]};

	&::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: ${colors.primary[600]};
		cursor: pointer;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.1);
		}
	}

	&::-moz-range-thumb {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: ${colors.primary[600]};
		cursor: pointer;
		border: none;
	}
`;

const SliderValue = styled.div`
	text-align: center;
	font-size: ${typography.fontSize['3xl']};
	font-weight: ${typography.fontWeight.bold};
	color: ${colors.primary[600]};
	padding: ${spacing.lg};
`;

const OptionsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.md};
`;

const Option = styled.button<{ selected: boolean }>`
	padding: ${spacing.lg};
	border: 2px solid ${({ selected }) => (selected ? colors.primary[600] : colors.neutral[300])};
	background: ${({ selected }) => (selected ? colors.primary[50] : colors.surface)};
	border-radius: 8px;
	font-size: ${typography.fontSize.lg};
	text-align: left;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${colors.primary[600]};
		background: ${colors.primary[50]};
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
`;

const BuzzerButton = styled.button<{ pressed: boolean }>`
	padding: ${spacing['3xl']};
	border: none;
	border-radius: 50%;
	width: 200px;
	height: 200px;
	margin: ${spacing.xl} auto;
	font-size: ${typography.fontSize['4xl']};
	font-weight: ${typography.fontWeight.bold};
	cursor: pointer;
	background: ${({ pressed }) => (pressed ? `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)` : `linear-gradient(135deg, ${colors.error[600]} 0%, ${colors.error[700]} 100%)`)};
	color: ${colors.text.inverse};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	transition: all 0.2s ease;
	transform: ${({ pressed }) => (pressed ? 'scale(0.95)' : 'scale(1)')};

	&:hover:not(:disabled) {
		transform: scale(1.05);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
	}

	&:active:not(:disabled) {
		transform: scale(0.95);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
`;

const QuestionImage = styled.img`
	width: 100%;
	max-height: 400px;
	object-fit: contain;
	border-radius: 8px;
`;

const SortableList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.sm};
`;

const SortableItem = styled.div<{ isDragging: boolean }>`
	padding: ${spacing.md} ${spacing.lg};
	background: ${({ isDragging }) => (isDragging ? colors.primary[50] : colors.surface)};
	border: 2px solid ${colors.neutral[300]};
	border-radius: 8px;
	cursor: move;
	user-select: none;
	opacity: ${({ isDragging }) => (isDragging ? 0.5 : 1)};
	transition: all 0.2s ease;

	&:hover {
		border-color: ${colors.primary[600]};
	}
`;

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, onSubmit, onBuzzer, disabled = false, timeRemaining }) => {
	const [answer, setAnswer] = useState<any>(null);
	const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
	const [sliderValue, setSliderValue] = useState<number>(50);
	const [buzzerPressed, setBuzzerPressed] = useState(false);
	const [sortedItems, setSortedItems] = useState<string[]>(question.options?.items || []);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	const handleSubmit = () => {
		let finalAnswer: any = answer;

		switch (question.type) {
			case 'multiple_choice':
				finalAnswer = Array.from(selectedOptions);
				break;
			case 'slider':
				finalAnswer = sliderValue;
				break;
			case 'sorting':
				finalAnswer = sortedItems;
				break;
		}

		onSubmit(finalAnswer);
	};

	const handleBuzzerPress = () => {
		if (!buzzerPressed && onBuzzer) {
			setBuzzerPressed(true);
			onBuzzer();
		}
	};

	const toggleOption = (option: string) => {
		const newSelected = new Set(selectedOptions);
		if (newSelected.has(option)) {
			newSelected.delete(option);
		} else {
			if (question.options?.multiple) {
				newSelected.add(option);
			} else {
				newSelected.clear();
				newSelected.add(option);
			}
		}
		setSelectedOptions(newSelected);
	};

	const handleDragStart = (index: number) => {
		setDraggedIndex(index);
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;

		const newItems = [...sortedItems];
		const draggedItem = newItems[draggedIndex];
		newItems.splice(draggedIndex, 1);
		newItems.splice(index, 0, draggedItem);
		setSortedItems(newItems);
		setDraggedIndex(index);
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
	};

	const renderAnswerInput = () => {
		switch (question.type) {
			case 'input_text':
				return <Input value={answer || ''} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter your answer..." disabled={disabled} fullWidth />;

			case 'input_number':
				return <Input type="number" value={answer || ''} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter a number..." disabled={disabled} fullWidth />;

			case 'slider':
				return (
					<>
						<Slider type="range" min={question.options?.min || 0} max={question.options?.max || 100} step={question.options?.step || 1} value={sliderValue} onChange={(e) => setSliderValue(Number(e.target.value))} disabled={disabled} />
						<SliderValue>{sliderValue}</SliderValue>
					</>
				);

			case 'multiple_choice':
				return (
					<OptionsList>
						{question.options?.choices?.map((choice: string) => (
							<Option key={choice} selected={selectedOptions.has(choice)} onClick={() => toggleOption(choice)} disabled={disabled}>
								{selectedOptions.has(choice) ? (
									<>
										<Icon name="check" size="xs" />{' '}
									</>
								) : (
									''
								)}
								{choice}
							</Option>
						))}
					</OptionsList>
				);

			case 'buzzer':
				return (
					<div style={{ textAlign: 'center' }}>
						<BuzzerButton pressed={buzzerPressed} onClick={handleBuzzerPress} disabled={disabled || buzzerPressed}>
							{buzzerPressed ? (
								<>
									<Icon name="check" size="xl" /> BUZZED!
								</>
							) : (
								<>
									<Icon name="bell" size="xl" /> BUZZ
								</>
							)}
						</BuzzerButton>
						{buzzerPressed && <Input value={answer || ''} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter your answer..." disabled={disabled} fullWidth style={{ marginTop: spacing.lg }} />}
					</div>
				);

			case 'image':
			case 'hotspot':
				return (
					<>
						{question.image_url && <QuestionImage src={question.image_url} alt="Question" />}
						<Input value={answer || ''} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter your answer..." disabled={disabled} fullWidth />
					</>
				);

			case 'sorting':
				return (
					<SortableList>
						{sortedItems.map((item, index) => (
							<SortableItem key={item} draggable={!disabled} isDragging={draggedIndex === index} onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd}>
								{index + 1}. {item}
							</SortableItem>
						))}
					</SortableList>
				);

			default:
				return <div>Unsupported question type</div>;
		}
	};

	return (
		<Card variant="outlined" padding="lg">
			<Container>
				<Header>
					<CategoryBadge difficulty={question.difficulty}>
						{question.category} • Difficulty: {question.difficulty}/10
					</CategoryBadge>
					{timeRemaining !== undefined && (
						<Timer warning={timeRemaining <= 10}>
							<Icon name="timer" size="md" /> {timeRemaining}s
						</Timer>
					)}
				</Header>

				<QuestionText>{question.text}</QuestionText>
				<PointsDisplay>
					<Icon name="target" size="sm" color="primary" /> {question.points} points
				</PointsDisplay>

				<AnswerArea>
					{renderAnswerInput()}

					{question.type !== 'buzzer' && (
						<Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={disabled || (question.type === 'input_text' && !answer) || (question.type === 'input_number' && !answer) || (question.type === 'multiple_choice' && selectedOptions.size === 0)}>
							Submit Answer
						</Button>
					)}
				</AnswerArea>
			</Container>
		</Card>
	);
};
