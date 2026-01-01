/**
 * Question Display Component - Shows current question to players
 */
import React from 'react';
import styled from 'styled-components';
import { Icon } from '../atoms';
import { colors, spacing, typography } from '../../theme';

export interface QuestionData {
	id: string;
	type: 'multiple-choice' | 'true-false' | 'text' | 'buzzer';
	question: string;
	answers?: Answer[];
	points: number;
	timeLimit: number;
	imageUrl?: string;
}

export interface Answer {
	id: string;
	text: string;
	isCorrect?: boolean;
}

interface QuestionDisplayProps {
	question: QuestionData;
	timeRemaining?: number;
	onAnswerSelect?: (answerId: string) => void;
	selectedAnswerId?: string | null;
	showCorrect?: boolean;
	disabled?: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, timeRemaining, onAnswerSelect, selectedAnswerId, showCorrect = false, disabled = false }) => {
	const handleAnswerClick = (answerId: string) => {
		if (disabled || !onAnswerSelect) return;
		onAnswerSelect(answerId);
	};

	const getAnswerClassName = (answer: Answer): string => {
		if (!showCorrect && answer.id === selectedAnswerId) return 'selected';
		if (showCorrect && answer.isCorrect) return 'correct';
		if (showCorrect && answer.id === selectedAnswerId && !answer.isCorrect) return 'wrong';
		return '';
	};

	return (
		<Container>
			<Header>
				<QuestionType>{question.type}</QuestionType>
				<TimeDisplay warning={timeRemaining !== undefined && timeRemaining < 10}>{timeRemaining !== undefined ? `${timeRemaining}s` : `${question.timeLimit}s`}</TimeDisplay>
			</Header>

			<QuestionText>{question.question}</QuestionText>

			{question.imageUrl && <QuestionImage src={question.imageUrl} alt="Question" />}

			{question.type === 'multiple-choice' && question.answers && (
				<AnswersList>
					{question.answers.map((answer, index) => (
						<AnswerButton key={answer.id} onClick={() => handleAnswerClick(answer.id)} className={getAnswerClassName(answer)} disabled={disabled}>
							<AnswerNumber>{index + 1}</AnswerNumber>
							<AnswerText>{answer.text}</AnswerText>
							{showCorrect && answer.isCorrect && <Icon name="check" size="sm" color="success" />}
						</AnswerButton>
					))}
				</AnswersList>
			)}

			{question.type === 'true-false' && (
				<TrueFalseButtons>
					<TrueFalseButton onClick={() => handleAnswerClick('true')} className={selectedAnswerId === 'true' ? 'selected' : ''} disabled={disabled}>
						<Icon name="check" size="sm" /> Richtig
					</TrueFalseButton>
					<TrueFalseButton onClick={() => handleAnswerClick('false')} className={selectedAnswerId === 'false' ? 'selected' : ''} disabled={disabled}>
						<Icon name="x" size="sm" /> Falsch
					</TrueFalseButton>
				</TrueFalseButtons>
			)}

			{question.type === 'text' && (
				<TextAnswerContainer>
					<TextAnswerInput placeholder="Deine Antwort eingeben..." disabled={disabled} />
				</TextAnswerContainer>
			)}

			{question.type === 'buzzer' && (
				<BuzzerContainer>
					<BuzzerButton disabled={disabled}>
						<Icon name="bell" size="lg" /> BUZZER
					</BuzzerButton>
				</BuzzerContainer>
			)}

			<Footer>
				<PointsBadge>{question.points} Punkte</PointsBadge>
			</Footer>
		</Container>
	);
};

// Styled Components
const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.lg};
	padding: ${spacing.xl};
	background: ${colors.background};
	border-radius: 12px;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const QuestionType = styled.div`
	padding: ${spacing.xs} ${spacing.md};
	background: ${colors.primary[100]};
	color: ${colors.primary[700]};
	border-radius: 6px;
	font-size: ${typography.fontSize.sm};
	font-weight: ${typography.fontWeight.medium};
	text-transform: uppercase;
`;

const TimeDisplay = styled.div<{ warning?: boolean }>`
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.bold};
	font-family: ${typography.fontFamily.mono};
	color: ${({ warning }) => (warning ? colors.error[600] : colors.text.primary)};
	animation: ${({ warning }) => (warning ? 'pulse 1s infinite' : 'none')};

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
`;

const QuestionText = styled.h2`
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.text.primary};
	line-height: 1.4;
	margin: 0;
	text-align: center;
`;

const QuestionImage = styled.img`
	max-width: 100%;
	max-height: 300px;
	object-fit: contain;
	border-radius: 8px;
	margin: ${spacing.md} auto;
`;

const AnswersList = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: ${spacing.md};
	margin-top: ${spacing.lg};
`;

const AnswerButton = styled.button`
	display: flex;
	align-items: center;
	gap: ${spacing.md};
	padding: ${spacing.lg};
	background: ${colors.surface};
	border: 2px solid ${colors.neutral[200]};
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: left;

	&:hover:not(:disabled) {
		background: ${colors.primary[50]};
		border-color: ${colors.primary[400]};
		transform: translateY(-2px);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	&.selected {
		background: ${colors.primary[100]};
		border-color: ${colors.primary[600]};
	}

	&.correct {
		background: ${colors.primary[100]};
		border-color: ${colors.primary[600]};
	}

	&.wrong {
		background: ${colors.error[100]};
		border-color: ${colors.error[600]};
	}
`;

const AnswerNumber = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: ${colors.neutral[200]};
	color: ${colors.text.primary};
	font-weight: ${typography.fontWeight.bold};
	font-size: ${typography.fontSize.lg};
	flex-shrink: 0;
`;

const AnswerText = styled.div`
	flex: 1;
	font-size: ${typography.fontSize.lg};
	font-weight: ${typography.fontWeight.medium};
	color: ${colors.text.primary};
`;

const CorrectIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: ${colors.primary[600]};
	color: ${colors.text.inverse};
	font-size: ${typography.fontSize.lg};
	font-weight: ${typography.fontWeight.bold};
`;

const TrueFalseButtons = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: ${spacing.lg};
	margin-top: ${spacing.lg};
`;

const TrueFalseButton = styled.button`
	padding: ${spacing.xl};
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.semibold};
	background: ${colors.surface};
	border: 3px solid ${colors.neutral[200]};
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background: ${colors.primary[50]};
		border-color: ${colors.primary[400]};
		transform: scale(1.02);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	&.selected {
		background: ${colors.primary[100]};
		border-color: ${colors.primary[600]};
	}
`;

const TextAnswerContainer = styled.div`
	margin-top: ${spacing.lg};
`;

const TextAnswerInput = styled.textarea`
	width: 100%;
	min-height: 120px;
	padding: ${spacing.lg};
	font-size: ${typography.fontSize.lg};
	font-family: ${typography.fontFamily.base};
	background: ${colors.surface};
	border: 2px solid ${colors.neutral[200]};
	border-radius: 12px;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: ${colors.primary[400]};
	}

	&:disabled {
		background: ${colors.neutral[100]};
		cursor: not-allowed;
	}
`;

const BuzzerContainer = styled.div`
	display: flex;
	justify-content: center;
	margin-top: ${spacing.xl};
`;

const BuzzerButton = styled.button`
	width: 200px;
	height: 200px;
	border-radius: 50%;
	font-size: ${typography.fontSize['4xl']};
	font-weight: ${typography.fontWeight.bold};
	background: linear-gradient(135deg, ${colors.error[500]} 0%, ${colors.error[600]} 100%);
	color: ${colors.text.inverse};
	border: 8px solid ${colors.error[700]};
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);

	&:hover:not(:disabled) {
		transform: scale(1.1);
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
	}

	&:active:not(:disabled) {
		transform: scale(0.95);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const Footer = styled.div`
	display: flex;
	justify-content: center;
	margin-top: ${spacing.md};
`;

const PointsBadge = styled.div`
	padding: ${spacing.sm} ${spacing.lg};
	background: ${colors.primary[100]};
	color: ${colors.primary[700]};
	border-radius: 20px;
	font-size: ${typography.fontSize.md};
	font-weight: ${typography.fontWeight.semibold};
`;
