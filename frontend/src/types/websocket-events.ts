/**
 * WebSocket Event Types für Battle.Net Quiz-Plattform
 * 
 * Socket.IO Events zwischen Moderator, Server, Spieler und Dashboard
 */

// ============================================================================
// Basis-Typen
// ============================================================================

export type QuestionType = 
    | 'input-text'
    | 'input-number'
    | 'slider'
    | 'multiple-choice'
    | 'buzzer'
    | 'image-question'
    | 'hotspot'
    | 'sorting';

export type SessionStatus = 'active' | 'completed';

export interface PlayerScore {
    name: string;
    score: number;
    connected: boolean;
}

// ============================================================================
// Fragetyp-spezifische Daten
// ============================================================================

export interface InputTextData {
    type: 'input-text';
    requiredCorrect: number;
    maxLength?: number;
}

export interface InputNumberData {
    type: 'input-number';
    min?: number;
    max?: number;
    unit?: string;
}

export interface SliderData {
    type: 'slider';
    min: number;
    max: number;
    step: number;
    unit?: string;
}

export interface MultipleChoiceData {
    type: 'multiple-choice';
    options: Array<{
        id: string;
        text: string;
    }>;
    multiSelect: boolean;
}

export interface BuzzerData {
    type: 'buzzer';
}

export interface ImageQuestionData {
    type: 'image-question';
    imageUrl: string;
    allowZoom: boolean;
}

export interface HotspotData {
    type: 'hotspot';
    imageUrl: string;
    width: number;
    height: number;
}

export interface SortingData {
    type: 'sorting';
    items: Array<{
        id: string;
        text: string;
    }>;
}

export type QuestionData = 
    | InputTextData
    | InputNumberData
    | SliderData
    | MultipleChoiceData
    | BuzzerData
    | ImageQuestionData
    | HotspotData
    | SortingData;

// ============================================================================
// Moderator → Server Events
// ============================================================================

export interface ModeratorJoinPayload {
    sessionId: string;
    token: string;
}

export interface ModeratorQuestionStartPayload {
    questionId: string;
}

export interface ModeratorQuestionEndPayload {
    questionId: string;
}

export interface ModeratorImageShowPayload {
    imageUrl: string;
}

export interface ModeratorTimerStartPayload {
    duration: number; // in Sekunden
}

export interface ModeratorPointsAwardPayload {
    playerName: string;
    points: number;
    reason: string;
}

export interface ModeratorPointsSubtractPayload {
    playerName: string;
    points: number;
    reason: string;
}

export type ModeratorToServerEvents = {
    'moderator:join': (payload: ModeratorJoinPayload) => void;
    'moderator:question:start': (payload: ModeratorQuestionStartPayload) => void;
    'moderator:question:end': (payload: ModeratorQuestionEndPayload) => void;
    'moderator:image:show': (payload: ModeratorImageShowPayload) => void;
    'moderator:image:hide': () => void;
    'moderator:timer:start': (payload: ModeratorTimerStartPayload) => void;
    'moderator:timer:stop': () => void;
    'moderator:buzzer:enable': () => void;
    'moderator:buzzer:reset': () => void;
    'moderator:points:award': (payload: ModeratorPointsAwardPayload) => void;
    'moderator:points:subtract': (payload: ModeratorPointsSubtractPayload) => void;
    'moderator:session:end': () => void;
};

// ============================================================================
// Server → Moderator Events
// ============================================================================

export interface PlayerConnectedPayload {
    playerName: string;
    timestamp: number;
}

export interface PlayerDisconnectedPayload {
    playerName: string;
    timestamp: number;
}

export interface PlayerAnswerReceivedPayload {
    playerName: string;
    questionId: string;
    answer: any;
    timestamp: number;
}

export interface BuzzerPressedPayload {
    playerName: string;
    timestamp: number;
}

export interface LogEventPayload {
    type: 'QUESTION_STARTED' | 'QUESTION_ENDED' | 'POINTS_AWARDED' | 'BUZZER_TRIGGERED' | 'PLAYER_CONNECTED' | 'PLAYER_DISCONNECTED' | 'IMAGE_SHOWN' | 'IMAGE_HIDDEN';
    actor?: string;
    details?: string;
    timestamp: number;
}

export type ServerToModeratorEvents = {
    'player:connected': (payload: PlayerConnectedPayload) => void;
    'player:disconnected': (payload: PlayerDisconnectedPayload) => void;
    'player:answer:received': (payload: PlayerAnswerReceivedPayload) => void;
    'buzzer:pressed': (payload: BuzzerPressedPayload) => void;
    'log:event': (payload: LogEventPayload) => void;
    'error': (payload: { message: string }) => void;
};

// ============================================================================
// Server → Spieler Events
// ============================================================================

export interface QuestionStartPayload {
    id: string;
    prompt: string;
    type: QuestionType;
    data: QuestionData;
    imageUrl?: string;
}

export interface ImageShowPayload {
    url: string;
}

export interface TimerStartPayload {
    duration: number; // in Sekunden
    startedAt: number; // Unix timestamp (ms)
}

export interface TimerSyncPayload {
    remaining: number; // in Sekunden
}

export interface BuzzerResultPayload {
    winner: string;
    timestamp: number;
}

export interface ScoreboardUpdatePayload {
    players: PlayerScore[];
}

export type ServerToPlayerEvents = {
    'question:start': (payload: QuestionStartPayload) => void;
    'question:end': () => void;
    'image:show': (payload: ImageShowPayload) => void;
    'image:hide': () => void;
    'timer:start': (payload: TimerStartPayload) => void;
    'timer:stop': () => void;
    'timer:sync': (payload: TimerSyncPayload) => void;
    'buzzer:enabled': () => void;
    'buzzer:result': (payload: BuzzerResultPayload) => void;
    'buzzer:reset': () => void;
    'scoreboard:update': (payload: ScoreboardUpdatePayload) => void;
    'session:ended': () => void;
    'error': (payload: { message: string }) => void;
};

// ============================================================================
// Spieler → Server Events
// ============================================================================

export interface PlayerJoinPayload {
    sessionId: string;
    name: string;
}

export interface PlayerReconnectPayload {
    sessionId: string;
    name: string;
}

export interface PlayerAnswerPayload {
    questionId: string;
    answer: string | number | string[] | { x: number; y: number } | string[];
}

export interface PlayerBuzzerPayload {
    timestamp: number; // Client-Timestamp (ms)
}

export type PlayerToServerEvents = {
    'player:join': (payload: PlayerJoinPayload) => void;
    'player:reconnect': (payload: PlayerReconnectPayload) => void;
    'player:answer': (payload: PlayerAnswerPayload) => void;
    'player:buzzer': (payload: PlayerBuzzerPayload) => void;
};

// ============================================================================
// Server → Dashboard Events
// ============================================================================

export interface DashboardScoreboardPayload {
    players: PlayerScore[];
    sortBy: 'score' | 'name';
}

export interface DashboardQuestionPayload {
    prompt: string;
    type: QuestionType;
}

export interface DashboardTimerPayload {
    remaining: number; // in Sekunden
}

export type ServerToDashboardEvents = {
    'dashboard:scoreboard': (payload: DashboardScoreboardPayload) => void;
    'dashboard:question': (payload: DashboardQuestionPayload) => void;
    'dashboard:timer': (payload: DashboardTimerPayload) => void;
    'session:ended': () => void;
};

// ============================================================================
// Dashboard → Server Events
// ============================================================================

export interface DashboardJoinPayload {
    sessionId: string;
}

export type DashboardToServerEvents = {
    'dashboard:join': (payload: DashboardJoinPayload) => void;
};

// ============================================================================
// Socket.IO Typed Interfaces (für Client-Integration)
// ============================================================================

import { Socket } from 'socket.io-client';

export type ModeratorSocket = Socket<
    ServerToModeratorEvents,
    ModeratorToServerEvents
>;

export type PlayerSocket = Socket<
    ServerToPlayerEvents,
    PlayerToServerEvents
>;

export type DashboardSocket = Socket<
    ServerToDashboardEvents,
    DashboardToServerEvents
>;

// ============================================================================
// Antworttypen (für Validierung)
// ============================================================================

export type InputTextAnswer = string[];

export type InputNumberAnswer = number;

export type SliderAnswer = number;

export type MultipleChoiceAnswer = string[];

export type HotspotAnswer = {
    x: number;
    y: number;
};

export type SortingAnswer = string[]; // Array von item IDs in sortierter Reihenfolge

export type Answer = 
    | InputTextAnswer
    | InputNumberAnswer
    | SliderAnswer
    | MultipleChoiceAnswer
    | HotspotAnswer
    | SortingAnswer;

// ============================================================================
// Session-Informationen
// ============================================================================

export interface SessionInfo {
    sessionId: string;
    status: SessionStatus;
    createdAt: number;
    moderatorToken?: string; // Nur für Moderator
    playerCount: number;
    currentQuestion?: string;
}
