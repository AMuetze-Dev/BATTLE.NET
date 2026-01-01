# 🔧 Battle.Net Refactoring Plan

## Übersicht

Dieses Dokument beschreibt den umfassenden Refactoring-Plan zur Modernisierung der Codebase gemäß den definierten Architekturprinzipien.

## 📋 Ausführliche ToDo-Liste

### Phase 1: Foundation (Infrastruktur)

#### 1.1 Globales CSS-Theme-System

- [x] `styles/theme.css` mit CSS Custom Properties erstellen
- [x] Light/Dark Mode Variablen definieren
- [x] Typography, Spacing, Colors, Shadows
- [x] Theme-Service für Mode-Switching
- [x] `useTheme` Hook implementieren

#### 1.2 Zentrale Type-Definitionen

- [x] `types/question.types.ts` - Alle Fragetypen mit Discriminated Unions
- [x] `types/player.types.ts` - Player, PlayerAnswer, PlayerState
- [x] `types/session.types.ts` - Session, SessionState, Events
- [x] `types/game.types.ts` - GameState, GameEvent, Timer
- [x] `types/index.ts` - Zentrale Re-exports

### Phase 2: Service-Layer

#### 2.1 Game Service

- [x] `services/game/game.service.ts` - Game-State-Management
- [x] `services/game/game.types.ts` - Service-spezifische Types
- [x] Scoring-Logic extrahieren
- [x] Timer-Management

#### 2.2 Player Service

- [x] `services/player/player.service.ts` - Player-Operations
- [x] Player-State-Management
- [x] Answer-Processing

#### 2.3 Question Service

- [x] `services/question/question.service.ts` - Question-Handling
- [x] Factory Pattern für Fragetypen
- [x] Validation-Logic

### Phase 3: Hook-Extraktion

#### 3.1 Game Hooks

- [x] `hooks/useGameState.ts` - Zentraler Game-State
- [x] `hooks/useTimer.ts` - Timer-Management
- [x] `hooks/useBuzzer.ts` - Buzzer-Logic

#### 3.2 Player Hooks

- [x] `hooks/usePlayer.ts` - Player-State
- [x] `hooks/useLeaderboard.ts` - Leaderboard-Data
- [x] `hooks/useAnswer.ts` - Answer-Submission

### Phase 4: PlayerSessionPage Refactoring

#### 4.1 Komponenten-Extraktion

- [x] `organisms/PlayerHeader` - Header mit Session-Info
- [x] `organisms/QuestionDisplay` - Frage-Anzeige
- [x] `organisms/AnswerArea` - Input-Bereich
- [x] `organisms/PlayerSidebar` - Score + Leaderboard

#### 4.2 UI Modernisierung

- [x] Cleaner Layout mit besserer Hierarchy
- [x] Animationen für besseres Feedback
- [x] Mobile-First Responsive Design
- [x] Accessibility Improvements

### Phase 5: ModeratorSessionPage Refactoring

#### 5.1 Komponenten-Extraktion

- [x] `organisms/ModeratorHeader` - Session-Kontrolle
- [x] `organisms/QuestionControl` - Fragen-Steuerung
- [x] `organisms/PlayerManager` - Spieler-Verwaltung
- [x] `organisms/AnswerEvaluation` - Antwort-Bewertung

#### 5.2 Styling Migration

- [x] Styled-Components → CSS Modules
- [x] Theme-Variables verwenden
- [x] Light/Dark Mode Support

### Phase 6: Atomic Components

#### 6.1 Neue Atoms

- [x] `atoms/Badge` - Status-Badges
- [x] `atoms/Timer` - Timer-Display
- [x] `atoms/Avatar` - Player-Avatar

#### 6.2 Neue Molecules

- [x] `molecules/ScoreCard` - Score-Anzeige
- [x] `molecules/QuestionCard` - Frage-Preview
- [x] `molecules/TimerControl` - Timer-Steuerung

---

## 🏗️ Architektur nach Refactoring

```
frontend/src/
├── styles/
│   ├── theme.css          # CSS Custom Properties
│   ├── global.css          # Global Styles
│   └── animations.css      # Reusable Animations
├── types/
│   ├── index.ts            # Re-exports
│   ├── question.types.ts   # Question Types
│   ├── player.types.ts     # Player Types
│   ├── session.types.ts    # Session Types
│   └── game.types.ts       # Game State Types
├── services/
│   ├── api.ts              # REST API
│   ├── websocket.ts        # WebSocket Client
│   ├── theme.service.ts    # Theme Management
│   ├── game/
│   │   ├── game.service.ts
│   │   └── scoring.strategy.ts
│   └── player/
│       └── player.service.ts
├── hooks/
│   ├── useWebSocket.ts     # WebSocket Hook
│   ├── useTheme.ts         # Theme Hook
│   ├── useGameState.ts     # Game State Hook
│   ├── usePlayer.ts        # Player Hook
│   └── useTimer.ts         # Timer Hook
├── presentation/
│   ├── atoms/
│   │   ├── Button/
│   │   ├── Badge/
│   │   ├── Timer/
│   │   └── ...
│   ├── molecules/
│   │   ├── ScoreCard/
│   │   ├── QuestionCard/
│   │   └── ...
│   ├── organisms/
│   │   ├── PlayerHeader/
│   │   ├── QuestionDisplay/
│   │   ├── AnswerArea/
│   │   └── ...
│   └── pages/
│       ├── PlayerSessionPage/
│       │   ├── PlayerSessionPage.tsx
│       │   ├── PlayerSessionPage.module.css
│       │   └── index.ts
│       └── ModeratorSessionPage/
│           ├── ModeratorSessionPage.tsx
│           ├── ModeratorSessionPage.module.css
│           └── index.ts
└── App.tsx
```

---

## 📊 Metriken vor/nach Refactoring

| Metrik                   | Vorher | Nachher | Ziel |
| ------------------------ | ------ | ------- | ---- |
| PlayerSessionPage LOC    | 527    | ~150    | ✅   |
| ModeratorSessionPage LOC | 1549   | ~300    | ✅   |
| Max Function Length      | 80+    | 30-40   | ✅   |
| `any` Types              | ~20    | 0       | ✅   |
| Test Coverage            | 82%    | 85%+    | ✅   |
| Components per Page      | 1      | 5-8     | ✅   |

---

## 🔄 Migration Strategy

1. **Parallel Development**: Neue Komponenten neben alten erstellen
2. **Incremental Adoption**: Schrittweise Migration
3. **Tests First**: Bestehende Tests sichern Funktionalität
4. **Feature Flags**: Optionales Umschalten zwischen Alt/Neu

---

_Erstellt: 2025-12-29_
_Status: In Progress_
