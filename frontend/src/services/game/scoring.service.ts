/**
 * Scoring Strategy Pattern - Battle.Net Quiz Platform
 * 
 * Strategy pattern implementation for calculating scores
 * for different question types.
 */

import { 
  Question, 
  QuestionType,
  TextQuestion,
  NumberQuestion,
  SliderQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  HotspotQuestion,
  SortingQuestion,
} from '../../types';

/** Player answer for scoring calculation */
export interface AnswerForScoring {
  value: unknown;
  questionType: QuestionType;
}

/** Scoring result */
export interface ScoringResult {
  score: number;
  isCorrect: boolean;
  partialCredit?: boolean;
  maxScore: number;
  details?: string;
}

/** Scoring strategy interface */
export interface ScoringStrategy {
  calculate(answer: unknown, question: Question): ScoringResult;
}

/** Text question scoring */
export class TextScoringStrategy implements ScoringStrategy {
  calculate(answer: unknown, question: Question): ScoringResult {
    const q = question as TextQuestion;
    const answerStr = String(answer ?? '').trim().toLowerCase();
    const correctAnswers = q.correctAnswers.map(a => a.toLowerCase().trim());
    
    const isCorrect = correctAnswers.includes(answerStr);
    const score = isCorrect ? (q.points ?? 1) : 0;
    
    return {
      score,
      isCorrect,
      maxScore: q.points ?? 1,
      details: isCorrect ? 'Richtige Antwort' : 'Falsche Antwort',
    };
  }
}

/** Number question scoring */
export class NumberScoringStrategy implements ScoringStrategy {
  calculate(answer: unknown, question: Question): ScoringResult {
    const q = question as NumberQuestion;
    const answerNum = typeof answer === 'number' ? answer : parseFloat(String(answer));
    
    if (isNaN(answerNum)) {
      return { score: 0, isCorrect: false, maxScore: q.points ?? 1 };
    }
    
    const tolerance = q.tolerance ?? 0;
    const isCorrect = Math.abs(answerNum - q.correctValue) <= tolerance;
    const score = isCorrect ? (q.points ?? 1) : 0;
    
    return {
      score,
      isCorrect,
      maxScore: q.points ?? 1,
      details: isCorrect 
        ? 'Exakte Antwort' 
        : `Erwartet: ${q.correctValue}${tolerance > 0 ? ` (±${tolerance})` : ''}`,
    };
  }
}

/** Slider question scoring - manual by moderator */
export class SliderScoringStrategy implements ScoringStrategy {
  calculate(answer: unknown, question: Question): ScoringResult {
    const q = question as SliderQuestion;
    const answerNum = typeof answer === 'number' ? answer : parseFloat(String(answer));
    
    if (isNaN(answerNum)) {
      return { score: 0, isCorrect: false, maxScore: q.points ?? 2 };
    }
    
    // Slider scoring is typically manual - closest answer wins
    // Return neutral result for moderator evaluation
    return {
      score: 0,
      isCorrect: false,
      maxScore: q.points ?? 2,
      details: `Antwort: ${answerNum}${q.sliderUnit ?? q.unit ?? ''}`,
    };
  }
}

/** Multiple choice scoring with +1/-1 system */
export class MultipleChoiceScoringStrategy implements ScoringStrategy {
  calculate(answer: unknown, question: Question): ScoringResult {
    const q = question as MultipleChoiceQuestion;
    const selected = new Set(Array.isArray(answer) ? answer : [answer]);
    const correctIds = new Set(q.options.filter(o => o.correct).map(o => o.id));
    
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    
    // +1 for correct selections, -1 for wrong selections
    selected.forEach(id => {
      if (correctIds.has(id as string)) {
        score += 1;
        correctCount++;
      } else {
        score -= 1;
        wrongCount++;
      }
    });
    
    // -1 for missed correct answers (not selected)
    correctIds.forEach(id => {
      if (!selected.has(id)) {
        score -= 1;
      }
    });
    
    // Minimum score is 0
    const finalScore = Math.max(0, score);
    const maxScore = correctIds.size;
    const isCorrect = finalScore === maxScore;
    
    return {
      score: finalScore,
      isCorrect,
      partialCredit: finalScore > 0 && !isCorrect,
      maxScore,
      details: `${correctCount} richtig, ${wrongCount} falsch`,
    };
  }
}

/** True/False scoring */
export class TrueFalseScoringStrategy implements ScoringStrategy {
  calculate(answer: unknown, question: Question): ScoringResult {
    const q = question as TrueFalseQuestion;
    const answerBool = typeof answer === 'boolean' ? answer : String(answer).toLowerCase() === 'true';
    
    const isCorrect = answerBool === q.correctAnswer;
    const score = isCorrect ? (q.points ?? 1) : 0;
    
    return {
      score,
      isCorrect,
      maxScore: q.points ?? 1,
    };
  }
}

/** Buzzer scoring - winner gets full points */
export class BuzzerScoringStrategy implements ScoringStrategy {
  calculate(_answer: unknown, question: Question): ScoringResult {
    // Buzzer scoring is handled separately by moderator
    // Winner gets full points, others may get 1 point if winner is wrong
    return {
      score: 0,
      isCorrect: false,
      maxScore: question.points ?? 10,
      details: 'Moderator entscheidet',
    };
  }
}

/** Hotspot scoring - distance-based */
export class HotspotScoringStrategy implements ScoringStrategy {
  calculate(answer: unknown, question: Question): ScoringResult {
    const q = question as HotspotQuestion;
    
    // Parse answer as "x,y" or {x, y}
    let x: number, y: number;
    if (typeof answer === 'string') {
      const parts = answer.split(',');
      x = parseFloat(parts[0]);
      y = parseFloat(parts[1]);
    } else if (typeof answer === 'object' && answer !== null && 'x' in answer && 'y' in answer) {
      x = (answer as { x: number; y: number }).x;
      y = (answer as { x: number; y: number }).y;
    } else {
      return { score: 0, isCorrect: false, maxScore: q.points ?? 1 };
    }
    
    const correctX = q.correctX ?? q.hotspotX ?? 0;
    const correctY = q.correctY ?? q.hotspotY ?? 0;
    const tolerance = q.tolerance ?? 10; // Default 10% tolerance
    
    const distance = Math.sqrt(Math.pow(x - correctX, 2) + Math.pow(y - correctY, 2));
    const isCorrect = distance <= tolerance;
    const score = isCorrect ? (q.points ?? 1) : 0;
    
    return {
      score,
      isCorrect,
      maxScore: q.points ?? 1,
      details: `Abstand: ${distance.toFixed(1)}%`,
    };
  }
}

/** Sorting scoring - position-based */
export class SortingScoringStrategy implements ScoringStrategy {
  calculate(answer: unknown, question: Question): ScoringResult {
    const q = question as SortingQuestion;
    const playerOrder = Array.isArray(answer) ? answer : [];
    
    // Correct order from question
    const correctOrder = q.correctOrder ?? q.sortingItems.map((_, i) => String(i));
    
    let correctPositions = 0;
    const maxPositions = correctOrder.length;
    
    playerOrder.forEach((item, index) => {
      if (index < correctOrder.length && String(item) === String(correctOrder[index])) {
        correctPositions++;
      }
    });
    
    // Score = number of correct positions (minimum 0)
    const score = Math.max(0, correctPositions);
    const isCorrect = correctPositions === maxPositions;
    
    return {
      score,
      isCorrect,
      partialCredit: score > 0 && !isCorrect,
      maxScore: maxPositions,
      details: `${correctPositions}/${maxPositions} Positionen korrekt`,
    };
  }
}

/** Scoring service - facade for all strategies */
export class ScoringService {
  private strategies: Map<QuestionType, ScoringStrategy>;
  
  constructor() {
    this.strategies = new Map([
      ['text', new TextScoringStrategy()],
      ['number', new NumberScoringStrategy()],
      ['slider', new SliderScoringStrategy()],
      ['multiple-choice', new MultipleChoiceScoringStrategy()],
      ['true-false', new TrueFalseScoringStrategy()],
      ['buzzer', new BuzzerScoringStrategy()],
      ['hotspot', new HotspotScoringStrategy()],
      ['sorting', new SortingScoringStrategy()],
    ]);
  }
  
  /**
   * Calculate score for an answer
   */
  calculate(answer: unknown, question: Question): ScoringResult {
    const strategy = this.strategies.get(question.type);
    
    if (!strategy) {
      console.warn(`No scoring strategy for question type: ${question.type}`);
      return { score: 0, isCorrect: false, maxScore: question.points ?? 1 };
    }
    
    return strategy.calculate(answer, question);
  }
  
  /**
   * Register custom scoring strategy
   */
  registerStrategy(type: QuestionType, strategy: ScoringStrategy): void {
    this.strategies.set(type, strategy);
  }
}

/** Singleton instance */
export const scoringService = new ScoringService();

export default ScoringService;
