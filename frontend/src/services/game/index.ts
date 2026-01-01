/**
 * Game Services - Re-exports
 */

export { GameService, gameService } from './game.service';
export type { GameConfig } from './game.service';

export { 
  ScoringService, 
  scoringService,
  TextScoringStrategy,
  NumberScoringStrategy,
  SliderScoringStrategy,
  MultipleChoiceScoringStrategy,
  TrueFalseScoringStrategy,
  BuzzerScoringStrategy,
  HotspotScoringStrategy,
  SortingScoringStrategy,
} from './scoring.service';
export type { ScoringStrategy, ScoringResult, AnswerForScoring } from './scoring.service';
