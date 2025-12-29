```instructions
---
description: 'Battle.Net Quiz- und Minispiel-Plattform Architektur und Entwicklungsrichtlinien'
applyTo: '**/*'
---

# Battle.Net Projekt Spezifikation

## Projektziel

Eine interaktive Echtzeit-Webplattform für Quiz- und Minispiele mit drei Rollen:
- **Moderator**: Erstellt Sessions, lädt Fragenkataloge, steuert Spielablauf
- **Spieler**: Tritt Sessions bei, beantwortet Fragen in Echtzeit
- **Dashboard**: Zeigt Punktestände und optionale Frage-Informationen

---

## Technologie-Stack

### Backend
- **Framework**: FastAPI (Python)
- **WebSocket**: **Socket.IO** (python-socketio) - bidirektionale Kommunikation mit Auto-Reconnect
- **REST API**: Nur für Session-Erstellung und Fragenkatalog-Upload
- **Datenbank**: PostgreSQL mit SQLAlchemy ORM
- **Container**: Docker (Dockerfiles vorhanden)
- **Reverse Proxy**: nginx (docker-compose)
- **Testing**: pytest, pytest-asyncio, coverage

### Frontend
- **Framework**: React 19 mit TypeScript 5.x
- **Build-Tool**: **Vite** (Migration von React Scripts notwendig)
- **WebSocket-Client**: **Socket.IO Client** (socket.io-client)
- **State Management**: **Zustand** (leichtgewichtig, performant für Echtzeit-Updates)
- **Styling**: **Styled-Components** (CSS-in-JS mit klarer Komponentenisolierung)
- **Design-System**: Atomic Design Pattern
- **UI-Dokumentation**: Storybook
- **Testing**: Vitest (Vite-native), React Testing Library, Selenium (E2E)
- **i18n**: **LinguiJS** (@lingui/react, @lingui/macro)
- **Routing**: React Router DOM v7

### Projektstruktur

```

/backend
/app
/api # REST-Endpoints (Session, Upload)
/ws # WebSocket-Handler
/models # Datenmodelle (SQLAlchemy)
/services # Business-Logik (XML-Validierung, Punkte-Berechnung)
/validation # XSD-Validierung, ZIP-Prüfung
/logging # Event- und Error-Logging
/tests # pytest Tests
main.py # FastAPI Einstiegspunkt
requirements.txt

/frontend
/src
/components
/atoms # Basis-UI-Elemente (Button, Input, Label)
/molecules # Kombinierte Elemente (InputGroup, Card)
/organisms # Komplexe Komponenten (QuestionDisplay, PlayerList)
/templates # Layout-Templates (optional)
/pages # Seiten (Moderator, Player, Dashboard)
/hooks # Custom React Hooks
/context # React Context (Session, WebSocket)
/theme # Globales Theme (Farben, Typografie)
/i18n # Übersetzungen
/storybook # Storybook Konfiguration

/questions-schema
questions.xsd # XML-Schema für Fragenkataloge

/database
migrations.sql # Datenbank-Schema

```

---

## Session- und Rollenmodell

### Session-Lebenszyklus
1. **Erstellung**: Moderator erstellt Session via REST
   - Backend generiert:
     - `sessionId`: 6-stelliger alphanumerischer Code (z.B. `ABC123`)
     - `moderatorToken`: UUID v4 für URL-basierte Authentifizierung
   - Session-Status: `active`
2. **Beitritt**:
   - Spieler verbinden via WebSocket mit `sessionId` + `name` (keine weitere Auth)
   - Dashboard verbindet via WebSocket mit `sessionId`
3. **Ablauf**:
   - Moderator steuert Fragen via WebSocket
   - Server-seitige Timer (authoritative)
   - Punkte werden automatisch/manuell vergeben
4. **Beendigung**:
   - Moderator beendet Session
   - Session-Status: `completed` (bleibt in DB persistiert)
   - Alle Verbindungen werden geschlossen

### Rollen & Routen

#### Moderator
- **Route**: `/moderator/:sessionId?token=<uuid>`
- **Authentifizierung**: URL-Parameter `token` (ermöglicht Gerätewechsel)
- **Funktionen**:
  - Fragenkatalog hochladen (ZIP)
  - Fragen anzeigen/verbergen
  - Bilder ein-/ausblenden
  - Timer starten/stoppen (server-seitig)
  - Buzzer freigeben/sperren (bei Latenz-Problemen)
  - Punkte vergeben (automatisch + manuell)
  - Logs einsehen

#### Spieler
- **Route**: `/player/:sessionId`
- **Authentifizierung**: Nur Name (Freitext oder Auto-Generierung)
- **Reconnect**: Über gespeicherten Namen (keine Player-ID notwendig)
- **Funktionen**:
  - Namen eingeben bei Beitritt
  - Fragen beantworten
  - Buzzer drücken
  - Bei Verbindungsabbruch: Reconnect über Namen

#### Dashboard
- **Route**: `/dashboard/:sessionId`
- **Funktionen**:
  - Punktestand anzeigen
  - Optional: Aktuelle Frage + Timer

---

## Fragenkatalog-System

### ZIP-Struktur
```

quiz.zip
├── questions.xml
└── media/
├── q1.png
├── q2.jpg
└── ...

````

### XML-Struktur
```xml
<quiz>
  <category id="1" name="Kategorie 1">
    <question id="q1" type="input-text">
      <prompt>Was ist die Hauptstadt von Deutschland?</prompt>
      <answers requiredCorrect="1">
        <answer correct="true">Berlin</answer>
        <answer correct="true">berlin</answer>
      </answers>
      <points>1</points>
      <image>media/q1.png</image>
    </question>
  </category>
</quiz>
````

### Serverseitige Validierung

1. ZIP entpackbar?
2. `questions.xml` vorhanden?
3. XML valide gegen XSD?
4. Alle referenzierten Bilder vorhanden?
5. Keine unbekannten Fragetypen?
6. Keine fehlenden Pflichtfelder?

Bei Fehler: Detaillierte Fehlermeldung an Moderator

---

## Fragetypen & Auswertung

### 1. Input-Text

- **Beschreibung**: Freie Texteingabe
- **XML-Felder**: `prompt`, `answers` (mit `requiredCorrect`)
- **Auswertung**:
  - Case-insensitive, Trimmed
  - Mehrere Antworten möglich
  - Automatisch + manuelle Korrektur durch Moderator
- **Punkte**: 1 Punkt pro richtiger Antwort

### 2. Input-Zahl

- **Beschreibung**: Numerische Eingabe
- **XML-Felder**: `prompt`, `correctValue`, `tolerance` (optional)
- **Auswertung**: Exakt oder Toleranzbereich
- **Punkte**: 1 Punkt

### 3. Slider / Schätzfrage

- **Beschreibung**: Wertebereich schätzen
- **XML-Felder**: `prompt`, `min`, `max`, `step`, `correctValue`
- **Auswertung**: Manuell durch Moderator (nächster Wert gewinnt)
- **Punkte**: 2 Punkte (Moderator entscheidet)

### 4. Multiple-Choice

- **Beschreibung**: Mehrfachauswahl
- **XML-Felder**: `prompt`, `options` (mit `correct="true/false"`)
- **Auswertung**:
  - +1 Punkt pro richtig
  - -1 Punkt pro falsch
  - Minimum: 0 Punkte
- **Punkte**: Variabel

### 5. Buzzer

- **Beschreibung**: Erster Spieler drückt Buzzer
- **XML-Felder**: `prompt`
- **Ablauf**:
  1. Spieler drücken Button
  2. Server entscheidet per Zeitstempel
  3. Gewinner wird hervorgehoben
  4. Andere werden blockiert
  5. Moderator gibt Buzzer frei
- **Punkte**: 3 Punkte für Gewinner, 1 Punkt für Rest bei falscher Antwort

### 6. Bildfrage

- **Beschreibung**: Bild anzeigen/ausblenden
- **XML-Felder**: `prompt`, `image`
- **Funktion**: Spieler können zoomen
- **Auswertung**: Manuell durch Moderator

### 7. Bild-Auswahl (Hotspot)

- **Beschreibung**: Klick auf Bildbereich
- **XML-Felder**: `prompt`, `image`, `hotspots` (x, y, radius)
- **Auswertung**: Automatisch (Klick innerhalb Radius)
- **Punkte**: 1 Punkt

### 8. Sortieraufgabe (Drag & Drop)

- **Beschreibung**: Elemente in richtige Reihenfolge bringen
- **XML-Felder**: `prompt`, `items` (mit `order`)
- **Auswertung**:
  - +1 Punkt pro Element an richtiger Position
  - -1 Punkt pro Element an falscher Position
  - Minimum: 0 Punkte
- **Punkte**: Variabel

---

## Punktevergabe-System

### Automatische Punktevergabe

- **Buzzer**: 3 Punkte (Gewinner), 1 Punkt (andere bei falscher Antwort)
- **Input-Text**: 1 Punkt pro richtiger Antwort
- **Input-Zahl**: 1 Punkt (bei Treffer)
- **Slider**: 2 Punkte (falls automatisch)
- **Multiple-Choice**: +1/-1 System (Min: 0)
- **Hotspot**: 1 Punkt
- **Sortieren**: +1/-1 System (Min: 0)

### Manuelle Punktevergabe

Moderator kann jederzeit:

- Punkte hinzufügen
- Punkte abziehen
- Punkte überschreiben
- Punkte zurücksetzen

---

## WebSocket-Events

### Moderator → Server → Spieler

```typescript
// Frage senden
{ type: 'QUESTION_START', question: QuestionData }
{ type: 'QUESTION_END' }

// Bild-Steuerung
{ type: 'IMAGE_SHOW', url: string }
{ type: 'IMAGE_HIDE' }

// Timer
{ type: 'TIMER_START', duration: number }
{ type: 'TIMER_STOP' }

// Buzzer
{ type: 'BUZZER_ENABLE' }
{ type: 'BUZZER_DISABLE' }

// Punkte
{ type: 'POINTS_UPDATE', players: PlayerPoints[] }
```

### Spieler → Server → Moderator

```typescript
// Antworten
{ type: 'ANSWER_SUBMIT', questionId: string, answer: any }

// Buzzer
{ type: 'BUZZER_PRESS', timestamp: number }

// Connection
{ type: 'PLAYER_JOIN', name: string }
{ type: 'PLAYER_RECONNECT', playerId: string }
```

### Server → Dashboard

```typescript
// Punktestand
{ type: 'SCOREBOARD_UPDATE', players: PlayerScore[] }

// Optionale Frage
{ type: 'CURRENT_QUESTION', question: QuestionData }

// Timer-Sync
{ type: 'TIMER_SYNC', remaining: number }
```

---

## UI/UX Design-System

### Farbpalette

```css
--color-background: #1a1a1a; /* Dunkelgrau */
--color-accent: #00bfff; /* Hellblau */
--color-text: #ffffff; /* Weiß */
--color-error: #ff4444; /* Rot */
--color-success: #44ff44; /* Grün */
--color-warning: #ffaa00; /* Orange */
--color-disabled: #666666; /* Grau */
--color-hover: #0099cc; /* Dunkleres Blau */
```

### Typografie

```css
--font-primary: 'Inter', sans-serif;
--font-size-h1: 2.5rem;
--font-size-h2: 2rem;
--font-size-body: 1rem;
--font-size-small: 0.875rem;
--font-weight-bold: 700;
--font-weight-normal: 400;
```

### Abstände

```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
```

### Responsivität

- **Spieler & Moderator**: Mobil + Desktop optimiert
- **Dashboard**: Fokus auf 16:9 Desktop

### Barrierefreiheit

- ARIA-Roles für interaktive Elemente
- WCAG AA Kontraste (mindestens 4.5:1)
- Tastaturnavigation für alle Funktionen
- Screen-Reader optimiert

---

## Logging-System

### UI-Log (Moderator-Interface)

Zeigt chronologisch:

- `QUESTION_STARTED` - Frage ID, Titel
- `QUESTION_ENDED` - Frage ID
- `POINTS_AWARDED` - Spieler, Punkte, Grund
- `BUZZER_TRIGGERED` - Spieler, Timestamp
- `PLAYER_CONNECTED` - Spielername
- `PLAYER_DISCONNECTED` - Spielername
- `IMAGE_SHOWN` - Bild-URL
- `IMAGE_HIDDEN` - Bild-URL

### Backend-Log

Technische Logs:

- WebSocket-Verbindungen
- REST-API-Calls
- XML-Validierungsfehler
- Datenbank-Operationen
- Fehler mit Stack-Traces
- Audit-Events (Session erstellt/beendet)

---

## Testing-Strategie

### Backend (pytest)

```python
# Unit-Tests
tests/test_xml_validation.py      # XSD-Validierung
tests/test_zip_validation.py      # ZIP-Struktur
tests/test_points_calculation.py  # Punktelogik
tests/test_websocket_events.py    # Event-Handling
tests/test_session_management.py  # Session-Lifecycle

# Integration-Tests
tests/integration/test_api.py     # REST-Endpoints
tests/integration/test_ws.py      # WebSocket-Flow
```

### Frontend (Jest + Selenium)

```typescript
// Unit-Tests
components/atoms/Button.test.tsx
components/molecules/QuestionCard.test.tsx

// Integration-Tests
pages/Player.test.tsx
pages/Moderator.test.tsx

// E2E-Tests (Selenium)
tests/e2e/test_session_flow.py    # Session beitreten
tests/e2e/test_question_answer.py # Frage beantworten
tests/e2e/test_buzzer.py          # Buzzer-Logik
tests/e2e/test_points.py          # Punktevergabe
```

---

## Erweiterbarkeit

### Geplante Features

- **Team-Modus**: Spieler in Teams gruppieren
- **Mehrsprachigkeit**: i18n für EN, FR, ES
- **Neue Fragetypen**: Audio-Fragen, Video-Fragen
- **Themes**: Benutzerdefinierte Farbschemata
- **Dashboard-Erweiterungen**: Statistiken, Grafiken
- **Export**: Session-Ergebnisse als PDF/CSV

### Architektur-Prinzipien für Erweiterungen

- **Modular**: Neue Fragetypen als eigene Module
- **Plugin-System**: Fragetypen registrierbar
- **Theme-System**: CSS-Variablen überschreibbar
- **i18n-Ready**: Translation-Keys konsistent

---

## Code-Conventions

### Backend (Python)

Siehe [python.instructions.md](./python.instructions.md)

- FastAPI Best Practices
- Async/Await für I/O
- Type Hints für alle Funktionen
- Pydantic Models für Validierung

### Frontend (TypeScript)

Siehe [typescript-5-es2022.instructions.md](./typescript-5-es2022.instructions.md)

- Atomic Design Pattern
- Functional Components mit Hooks
- CSS-Modules pro Komponente
- Strikte Type-Checks

---

## 🏗️ Architektur-Prinzipien (VERPFLICHTEND)

Diese Prinzipien sind **nicht verhandelbar** und müssen bei jedem Code-Change strikt eingehalten werden.

### Fundamentale Prinzipien

#### 1. Separation of Concerns (SoC)

- **Komponenten**: Nur UI-Darstellung, keine Business-Logik
- **Services**: Business-Logik, API-Calls, Datenverarbeitung
- **Hooks**: React-spezifische Zustandsverwaltung und Side-Effects
- **Utils**: Reine Funktionen ohne Seiteneffekte
- **Types**: Separate `.types.ts` Dateien pro Modul

**Beispiel:**

```typescript
// ❌ FALSCH - Logik in Komponente
const PlayerList = () => {
	const [players, setPlayers] = useState([]);

	useEffect(() => {
		fetch('/api/players')
			.then((res) => res.json())
			.then(setPlayers);
	}, []);

	return (
		<>
			{players.map((p) => (
				<div>{p.name}</div>
			))}
		</>
	);
};

// ✅ RICHTIG - Service + Hook + Component
// services/player.service.ts
export const PlayerService = {
	fetchPlayers: async (sessionId: string): Promise<Player[]> => {
		const response = await api.get(`/sessions/${sessionId}/players`);
		return response.data;
	},
};

// hooks/usePlayer.ts
export const usePlayer = (sessionId: string) => {
	const [players, setPlayers] = useState<Player[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		PlayerService.fetchPlayers(sessionId)
			.then(setPlayers)
			.catch(setError)
			.finally(() => setLoading(false));
	}, [sessionId]);

	return { players, loading, error };
};

// components/PlayerList.tsx
export const PlayerList: React.FC<{ sessionId: string }> = ({ sessionId }) => {
	const { players, loading, error } = usePlayer(sessionId);

	if (loading) return <Loading />;
	if (error) return <ErrorState message={error.message} />;

	return (
		<PlayerListContainer>
			{players.map((player) => (
				<PlayerCard key={player.id} player={player} />
			))}
		</PlayerListContainer>
	);
};
```

#### 2. Single Responsibility Principle (SRP)

- **Eine Funktion = Eine Aufgabe**
- **Eine Komponente = Ein UI-Konzept**
- **Ein Service = Ein Datenbereich**
- Maximal **30-40 Zeilen** pro Funktion (exklusive Types/Interfaces)

**Beispiel:**

```typescript
// ❌ FALSCH - God Function
const handleSubmit = (data: any) => {
	// Validation
	if (!data.name || data.name.length < 3) return;

	// Sanitization
	const cleaned = data.name.trim().toLowerCase();

	// API Call
	fetch('/api/player', { method: 'POST', body: JSON.stringify({ name: cleaned }) });

	// State Update
	setPlayers([...players, { name: cleaned }]);

	// Navigation
	navigate('/game');
};

// ✅ RICHTIG - Einzelverantwortlichkeiten
const validatePlayerName = (name: string): ValidationResult => {
	if (!name || name.length < 3) {
		return { valid: false, error: 'Name muss mindestens 3 Zeichen haben' };
	}
	return { valid: true };
};

const sanitizePlayerName = (name: string): string => {
	return name.trim().toLowerCase();
};

const handleSubmit = async (data: PlayerFormData) => {
	const validation = validatePlayerName(data.name);
	if (!validation.valid) {
		setError(validation.error);
		return;
	}

	const sanitized = sanitizePlayerName(data.name);
	await PlayerService.createPlayer(sessionId, sanitized);
	navigate('/game');
};
```

#### 3. KISS (Keep It Simple, Stupid)

- Einfache Lösungen bevorzugen
- Keine Over-Engineering
- Keine vorzeitigen Abstraktionen
- Lesbarkeit > Cleverness

#### 4. YAGNI (You Aren't Gonna Need It)

- Keine Features "auf Vorrat"
- Nur implementieren, was **jetzt** benötigt wird
- Refactoring bei Bedarf, nicht spekulativ

#### 5. Atomic Design

- **Atoms**: Button, Input, Label, Icon
- **Molecules**: SearchBar, InputGroup, Card
- **Organisms**: QuestionDisplay, PlayerList, Leaderboard
- **Templates**: PageLayout, DashboardLayout
- **Pages**: Kombination von Templates + Organismen

**Ordnerstruktur:**

```
frontend/src/presentation/
├── atoms/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   ├── Button.types.ts
│   │   └── Button.test.tsx
│   └── Input/
├── molecules/
│   ├── SearchBar/
│   │   ├── SearchBar.tsx
│   │   ├── SearchBar.module.css
│   │   └── SearchBar.types.ts
├── organisms/
│   └── QuestionDisplay/
└── pages/
    └── ModeratorSessionPage/
```

---

## 🎨 Design Patterns (VERPFLICHTEND)

### 1. Factory Pattern

Verwendung für **Fragetyp-Instanziierung** und **Komponenten-Erstellung**.

```typescript
// types/question.types.ts
export type QuestionType = 'text' | 'number' | 'slider' | 'multiple-choice' | 'true-false' | 'buzzer' | 'hotspot' | 'sorting';

export interface BaseQuestion {
	id: string;
	type: QuestionType;
	prompt: string;
	points: number;
}

export interface TextQuestion extends BaseQuestion {
	type: 'text';
	correctAnswers: string[];
	requiredCorrect: number;
}

export interface NumberQuestion extends BaseQuestion {
	type: 'number';
	correctValue: number;
	tolerance?: number;
}

// ... weitere Question-Types

// services/question.factory.ts
export class QuestionFactory {
	static create(data: QuestionDTO): Question {
		switch (data.type) {
			case 'text':
				return new TextQuestion(data);
			case 'number':
				return new NumberQuestion(data);
			case 'slider':
				return new SliderQuestion(data);
			case 'multiple-choice':
				return new MultipleChoiceQuestion(data);
			case 'true-false':
				return new TrueFalseQuestion(data);
			case 'buzzer':
				return new BuzzerQuestion(data);
			case 'hotspot':
				return new HotspotQuestion(data);
			case 'sorting':
				return new SortingQuestion(data);
			default:
				throw new Error(`Unknown question type: ${data.type}`);
		}
	}
}

// components/QuestionRenderer.tsx
export const QuestionRenderer: React.FC<{ question: Question }> = ({ question }) => {
	const Component = QuestionComponentFactory.get(question.type);
	return <Component question={question} />;
};

const QuestionComponentFactory = {
	get: (type: QuestionType): React.ComponentType<{ question: Question }> => {
		const components: Record<QuestionType, React.ComponentType<any>> = {
			text: TextQuestionInput,
			number: NumberQuestionInput,
			slider: SliderQuestionInput,
			'multiple-choice': MultipleChoiceInput,
			'true-false': TrueFalseInput,
			buzzer: BuzzerInput,
			hotspot: HotspotInput,
			sorting: SortingInput,
		};
		return components[type];
	},
};
```

### 2. Strategy Pattern

Verwendung für **Punkteberechnung** und **Validierung**.

```typescript
// strategies/scoring.strategy.ts
export interface ScoringStrategy {
	calculate(answer: PlayerAnswer, question: Question): number;
}

export class TextScoringStrategy implements ScoringStrategy {
	calculate(answer: PlayerAnswer, question: TextQuestion): number {
		const normalized = answer.value.trim().toLowerCase();
		return question.correctAnswers.some((a) => a.toLowerCase() === normalized) ? 1 : 0;
	}
}

export class MultipleChoiceScoringStrategy implements ScoringStrategy {
	calculate(answer: PlayerAnswer, question: MultipleChoiceQuestion): number {
		const selected = new Set(answer.value as string[]);
		const correct = new Set(question.options.filter((o) => o.correct).map((o) => o.id));

		let score = 0;
		selected.forEach((id) => {
			score += correct.has(id) ? 1 : -1;
		});

		return Math.max(0, score);
	}
}

export class SortingScoringStrategy implements ScoringStrategy {
	calculate(answer: PlayerAnswer, question: SortingQuestion): number {
		const playerOrder = answer.value as string[];
		const correctOrder = question.correctOrder;

		let score = 0;
		playerOrder.forEach((item, index) => {
			score += correctOrder[index] === item ? 1 : -1;
		});

		return Math.max(0, score);
	}
}

// services/scoring.service.ts
export class ScoringService {
	private strategies: Record<QuestionType, ScoringStrategy> = {
		text: new TextScoringStrategy(),
		number: new NumberScoringStrategy(),
		slider: new SliderScoringStrategy(),
		'multiple-choice': new MultipleChoiceScoringStrategy(),
		'true-false': new TrueFalseScoringStrategy(),
		buzzer: new BuzzerScoringStrategy(),
		hotspot: new HotspotScoringStrategy(),
		sorting: new SortingScoringStrategy(),
	};

	calculateScore(answer: PlayerAnswer, question: Question): number {
		const strategy = this.strategies[question.type];
		return strategy.calculate(answer, question);
	}
}
```

### 3. Observer / Pub-Sub Pattern

Verwendung für **WebSocket-Events** und **State-Updates**.

```typescript
// services/event-bus.service.ts
type EventHandler<T = any> = (data: T) => void;

export class EventBus {
	private subscribers: Map<string, Set<EventHandler>> = new Map();

	subscribe<T>(event: string, handler: EventHandler<T>): () => void {
		if (!this.subscribers.has(event)) {
			this.subscribers.set(event, new Set());
		}
		this.subscribers.get(event)!.add(handler);

		// Unsubscribe-Funktion zurückgeben
		return () => {
			this.subscribers.get(event)?.delete(handler);
		};
	}

	publish<T>(event: string, data: T): void {
		const handlers = this.subscribers.get(event);
		if (handlers) {
			handlers.forEach((handler) => handler(data));
		}
	}

	clear(event?: string): void {
		if (event) {
			this.subscribers.delete(event);
		} else {
			this.subscribers.clear();
		}
	}
}

export const eventBus = new EventBus();

// Verwendung in WebSocket-Service
export class WebSocketService {
	private socket: Socket | null = null;

	connect(sessionId: string): void {
		this.socket = io(WS_URL);

		this.socket.on('question:start', (data) => {
			eventBus.publish('QUESTION_START', data);
		});

		this.socket.on('timer:sync', (data) => {
			eventBus.publish('TIMER_SYNC', data);
		});

		this.socket.on('scoreboard:update', (data) => {
			eventBus.publish('SCOREBOARD_UPDATE', data);
		});
	}

	disconnect(): void {
		this.socket?.disconnect();
		eventBus.clear();
	}
}

// Verwendung in Hook
export const useQuestionEvents = () => {
	const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

	useEffect(() => {
		const unsubscribe = eventBus.subscribe('QUESTION_START', (question: Question) => {
			setCurrentQuestion(question);
		});

		return unsubscribe;
	}, []);

	return currentQuestion;
};
```

### 4. State Machine Pattern

Verwendung für **Session-Status** und **Question-Lifecycle**.

```typescript
// services/session-state-machine.ts
export enum SessionState {
	IDLE = 'idle',
	WAITING_FOR_PLAYERS = 'waiting_for_players',
	QUESTION_ACTIVE = 'question_active',
	QUESTION_EVALUATION = 'question_evaluation',
	LEADERBOARD = 'leaderboard',
	COMPLETED = 'completed',
}

export enum SessionEvent {
	START = 'START',
	PLAYER_JOINED = 'PLAYER_JOINED',
	QUESTION_START = 'QUESTION_START',
	QUESTION_END = 'QUESTION_END',
	SHOW_LEADERBOARD = 'SHOW_LEADERBOARD',
	END_SESSION = 'END_SESSION',
}

export class SessionStateMachine {
	private currentState: SessionState = SessionState.IDLE;

	private transitions: Record<SessionState, Partial<Record<SessionEvent, SessionState>>> = {
		[SessionState.IDLE]: {
			[SessionEvent.START]: SessionState.WAITING_FOR_PLAYERS,
		},
		[SessionState.WAITING_FOR_PLAYERS]: {
			[SessionEvent.PLAYER_JOINED]: SessionState.WAITING_FOR_PLAYERS,
			[SessionEvent.QUESTION_START]: SessionState.QUESTION_ACTIVE,
		},
		[SessionState.QUESTION_ACTIVE]: {
			[SessionEvent.QUESTION_END]: SessionState.QUESTION_EVALUATION,
		},
		[SessionState.QUESTION_EVALUATION]: {
			[SessionEvent.SHOW_LEADERBOARD]: SessionState.LEADERBOARD,
			[SessionEvent.QUESTION_START]: SessionState.QUESTION_ACTIVE,
		},
		[SessionState.LEADERBOARD]: {
			[SessionEvent.QUESTION_START]: SessionState.QUESTION_ACTIVE,
			[SessionEvent.END_SESSION]: SessionState.COMPLETED,
		},
		[SessionState.COMPLETED]: {},
	};

	transition(event: SessionEvent): void {
		const nextState = this.transitions[this.currentState][event];

		if (!nextState) {
			throw new Error(`Invalid transition: ${event} from state ${this.currentState}`);
		}

		console.log(`State transition: ${this.currentState} -> ${nextState}`);
		this.currentState = nextState;
		eventBus.publish('SESSION_STATE_CHANGED', nextState);
	}

	getState(): SessionState {
		return this.currentState;
	}

	canTransition(event: SessionEvent): boolean {
		return !!this.transitions[this.currentState][event];
	}
}
```

### 5. Adapter Pattern

Verwendung für **API-Responses** und **WebSocket-Messages**.

```typescript
// adapters/question.adapter.ts
export class QuestionAdapter {
	static fromDTO(dto: QuestionDTO): Question {
		const base = {
			id: dto.id,
			type: dto.type as QuestionType,
			prompt: dto.prompt,
			points: dto.points ?? 1,
		};

		switch (dto.type) {
			case 'text':
				return {
					...base,
					type: 'text',
					correctAnswers: dto.answers.filter((a) => a.correct).map((a) => a.text),
					requiredCorrect: dto.requiredCorrect ?? 1,
				};

			case 'multiple-choice':
				return {
					...base,
					type: 'multiple-choice',
					options: dto.options.map((o) => ({
						id: o.id,
						text: o.text,
						correct: o.correct,
					})),
				};

			// ... weitere Typen

			default:
				throw new Error(`Unsupported question type: ${dto.type}`);
		}
	}

	static toDTO(question: Question): QuestionDTO {
		// Umgekehrte Transformation
	}
}

// Verwendung in Service
export class QuestionService {
	async loadQuestions(sessionId: string): Promise<Question[]> {
		const response = await api.get(`/sessions/${sessionId}/questions`);
		return response.data.map(QuestionAdapter.fromDTO);
	}
}
```

### 6. Builder Pattern

Verwendung für **komplexe Objekte** wie Session-Konfiguration.

```typescript
// builders/session.builder.ts
export class SessionBuilder {
	private session: Partial<Session> = {};

	setId(id: string): this {
		this.session.id = id;
		return this;
	}

	setModeratorToken(token: string): this {
		this.session.moderatorToken = token;
		return this;
	}

	setQuestionCatalog(catalog: QuestionCatalog): this {
		this.session.questionCatalog = catalog;
		return this;
	}

	setMaxPlayers(max: number): this {
		this.session.maxPlayers = max;
		return this;
	}

	enableBuzzer(enabled: boolean = true): this {
		this.session.buzzerEnabled = enabled;
		return this;
	}

	setTimerDuration(duration: number): this {
		this.session.timerDuration = duration;
		return this;
	}

	build(): Session {
		if (!this.session.id || !this.session.moderatorToken) {
			throw new Error('Session ID and Moderator Token are required');
		}

		return {
			id: this.session.id,
			moderatorToken: this.session.moderatorToken,
			questionCatalog: this.session.questionCatalog ?? null,
			maxPlayers: this.session.maxPlayers ?? 50,
			buzzerEnabled: this.session.buzzerEnabled ?? true,
			timerDuration: this.session.timerDuration ?? 30,
			status: SessionState.IDLE,
			createdAt: new Date(),
		} as Session;
	}
}

// Verwendung
const session = new SessionBuilder().setId('ABC123').setModeratorToken(uuid()).setMaxPlayers(30).enableBuzzer().setTimerDuration(45).build();
```

---

## 📝 Code-Qualität (VERPFLICHTEND)

### 1. Strikte Typisierung

#### ❌ VERBOTEN: ANY-Types

```typescript
// ❌ NIEMALS
const data: any = await fetchData();
const handleClick = (event: any) => {};
const items: any[] = [];
```

#### ✅ ERFORDERLICH: Explizite Types

```typescript
// ✅ IMMER
interface PlayerData {
	id: string;
	name: string;
	score: number;
	connected: boolean;
}

const data: PlayerData = await fetchData();
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {};
const items: Player[] = [];
```

### 2. Generics statt Union-Chaos

#### ❌ FALSCH: Union-Type-Hölle

```typescript
type Response =
	| {
			success: true;
			data: Player | Question | Session | string | number;
	  }
	| {
			success: false;
			error: string;
	  };
```

#### ✅ RICHTIG: Generics

```typescript
interface SuccessResponse<T> {
	success: true;
	data: T;
}

interface ErrorResponse {
	success: false;
	error: string;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Verwendung
const response: ApiResponse<Player> = await api.get('/player');
if (response.success) {
	const player: Player = response.data; // Type-safe!
}
```

### 3. Enums oder String Literal Unions

```typescript
// ✅ Option 1: Enum (wenn Iteration/Mapping benötigt)
export enum QuestionType {
	Text = 'text',
	Number = 'number',
	Slider = 'slider',
	MultipleChoice = 'multiple-choice',
	TrueFalse = 'true-false',
	Buzzer = 'buzzer',
	Hotspot = 'hotspot',
	Sorting = 'sorting',
}

// ✅ Option 2: String Literal Union (wenn nur Type-Check)
export type QuestionType = 'text' | 'number' | 'slider' | 'multiple-choice' | 'true-false' | 'buzzer' | 'hotspot' | 'sorting';

// ✅ Option 3: Const Assertion (wenn Object benötigt)
export const QUESTION_TYPES = {
	TEXT: 'text',
	NUMBER: 'number',
	SLIDER: 'slider',
	MULTIPLE_CHOICE: 'multiple-choice',
	TRUE_FALSE: 'true-false',
	BUZZER: 'buzzer',
	HOTSPOT: 'hotspot',
	SORTING: 'sorting',
} as const;

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];
```

### 4. Funktionen maximal 30-40 Zeilen

```typescript
// ❌ FALSCH - 80+ Zeilen God Function
const processAnswer = (answer: any, question: any) => {
	// Validation (10 lines)
	// Sanitization (10 lines)
	// Scoring (20 lines)
	// Database Update (15 lines)
	// Event Publishing (10 lines)
	// UI Update (15 lines)
};

// ✅ RICHTIG - Mehrere kleine Funktionen
const validateAnswer = (answer: PlayerAnswer): ValidationResult => {
	// Max 10 Zeilen
};

const sanitizeAnswer = (answer: PlayerAnswer): SanitizedAnswer => {
	// Max 10 Zeilen
};

const calculateScore = (answer: SanitizedAnswer, question: Question): number => {
	// Max 15 Zeilen
};

const processAnswer = async (answer: PlayerAnswer, question: Question): Promise<void> => {
	const validation = validateAnswer(answer);
	if (!validation.valid) throw new ValidationError(validation.error);

	const sanitized = sanitizeAnswer(answer);
	const score = calculateScore(sanitized, question);

	await AnswerService.save(sanitized, score);
	eventBus.publish('ANSWER_PROCESSED', { answer: sanitized, score });
};
```

### 5. Pure Functions wo möglich

```typescript
// ✅ Pure Functions - Keine Seiteneffekte
export const calculateTotalScore = (answers: Answer[]): number => {
	return answers.reduce((sum, answer) => sum + answer.score, 0);
};

export const sortPlayersByScore = (players: Player[]): Player[] => {
	return [...players].sort((a, b) => b.score - a.score);
};

export const formatPlayerName = (name: string): string => {
	return name.trim().toLowerCase().replace(/\s+/g, '-');
};

// ❌ Impure Functions - Seiteneffekte isolieren
export const savePlayerScore = async (player: Player, score: number): Promise<void> => {
	// Side-Effect: API Call
	await api.post('/scores', { player, score });
	// Side-Effect: State Update
	store.updatePlayerScore(player.id, score);
	// Side-Effect: Event Publishing
	eventBus.publish('SCORE_UPDATED', { player, score });
};
```

### 6. Keine versteckten Seiteneffekte

```typescript
// ❌ FALSCH - Versteckte Seiteneffekte
const getPlayer = (id: string): Player => {
	const player = players.find((p) => p.id === id);

	// ⚠️ Versteckter Seiteneffekt!
	logAccess('getPlayer', id);
	analytics.track('player_accessed');

	return player;
};

// ✅ RICHTIG - Explizite Seiteneffekte
const getPlayer = (id: string): Player => {
	return players.find((p) => p.id === id);
};

const getPlayerWithTracking = (id: string): Player => {
	const player = getPlayer(id);

	// Explizit benannte Funktion für Seiteneffekte
	trackPlayerAccess(id);

	return player;
};
```

### 7. JSDoc für komplexe Funktionen

````typescript
/**
 * Berechnet die Punktzahl für eine Sortieraufgabe basierend auf der Anzahl
 * korrekt platzierter Elemente. Falsch platzierte Elemente führen zu Punktabzug.
 *
 * @param playerOrder - Die vom Spieler gewählte Reihenfolge der Item-IDs
 * @param correctOrder - Die korrekte Reihenfolge der Item-IDs
 * @returns Die berechnete Punktzahl (minimum 0)
 *
 * @example
 * ```ts
 * const score = calculateSortingScore(
 *   ['item3', 'item1', 'item2'],
 *   ['item1', 'item2', 'item3']
 * );
 * // score = 1 (nur item2 an richtiger Position)
 * ```
 */
export const calculateSortingScore = (playerOrder: string[], correctOrder: string[]): number => {
	let score = 0;
	playerOrder.forEach((itemId, index) => {
		score += correctOrder[index] === itemId ? 1 : -1;
	});
	return Math.max(0, score);
};
````

### 8. Kommentare nur wenn nötig

```typescript
// ❌ OFFENSICHTLICHE Kommentare vermeiden
// Increment counter
counter++;

// Loop through players
players.forEach((player) => {
	// Update score
	player.score += 1;
});

// ✅ Kommentare für komplexe Logik
// Berechne gewichteten Durchschnitt basierend auf Antwortzeiten.
// Schnellere Antworten erhalten höhere Gewichtung (exponentiell abnehmend).
const weightedAverage =
	answers.reduce((sum, answer, index) => {
		const weight = Math.exp(-index * 0.1);
		return sum + answer.score * weight;
	}, 0) / answers.length;
```

### 9. Funktionale Programmierung bevorzugen

```typescript
// ✅ Immutability
const addPlayer = (players: Player[], newPlayer: Player): Player[] => {
	return [...players, newPlayer]; // Neue Array erstellen
};

const updatePlayerScore = (player: Player, score: number): Player => {
	return { ...player, score }; // Neues Objekt erstellen
};

// ✅ Higher-Order Functions
const filterActivePlayers = (players: Player[]): Player[] => {
	return players.filter((player) => player.connected);
};

const mapToScoreboard = (players: Player[]): ScoreboardEntry[] => {
	return players.map((player) => ({
		name: player.name,
		score: player.score,
		rank: 0, // Wird später berechnet
	}));
};

// ✅ Function Composition
const getActiveScoreboard = (players: Player[]): ScoreboardEntry[] => {
	return pipe(players, filterActivePlayers, sortPlayersByScore, mapToScoreboard, addRankings);
};
```

### 10. Side-Effects isolieren

```typescript
// ✅ Side-Effects in eigenen Funktionen
const saveAnswerWithEffects = async (answer: PlayerAnswer): Promise<void> => {
	// Pure Function für Berechnung
	const score = calculateScore(answer);

	// Side-Effect: Database
	await database.saveAnswer(answer, score);

	// Side-Effect: Event Bus
	eventBus.publish('ANSWER_SAVED', { answer, score });

	// Side-Effect: Analytics
	analytics.track('answer_submitted', { questionType: answer.questionType });
};

// ✅ Side-Effects in useEffect
const PlayerComponent = ({ playerId }: Props) => {
	const [player, setPlayer] = useState<Player | null>(null);

	useEffect(() => {
		// Side-Effect: API Call
		PlayerService.fetchPlayer(playerId).then(setPlayer);
	}, [playerId]);

	return <>{player && <PlayerCard player={player} />}</>;
};
```

---

## ⚡ Performance (VERPFLICHTEND)

### 1. Lazy Loading

```typescript
// ✅ Route-based Code Splitting
const ModeratorSessionPage = lazy(() => import('./presentation/pages/ModeratorSessionPage'));
const PlayerSessionPage = lazy(() => import('./presentation/pages/PlayerSessionPage'));
const DashboardPage = lazy(() => import('./presentation/pages/DashboardPage'));

// ✅ Component Lazy Loading
const HeavyChart = lazy(() => import('./components/HeavyChart'));

export const Dashboard = () => (
	<Suspense fallback={<Loading />}>
		<HeavyChart data={data} />
	</Suspense>
);
```

### 2. Memoization

```typescript
// ✅ useMemo für teure Berechnungen
const ScoreBoard = ({ players }: Props) => {
	const sortedPlayers = useMemo(() => {
		return [...players].sort((a, b) => b.score - a.score).map((player, index) => ({ ...player, rank: index + 1 }));
	}, [players]);

	return (
		<>
			{sortedPlayers.map((p) => (
				<PlayerRow key={p.id} player={p} />
			))}
		</>
	);
};

// ✅ useCallback für Event-Handler
const PlayerList = ({ players }: Props) => {
	const handlePlayerClick = useCallback((playerId: string) => {
		console.log('Player clicked:', playerId);
		// ... weitere Logik
	}, []); // Leeres Dependency-Array = Function wird nur einmal erstellt

	return (
		<>
			{players.map((player) => (
				<PlayerCard key={player.id} player={player} onClick={handlePlayerClick} />
			))}
		</>
	);
};
```

### 3. Keine unnötigen Re-Renders

```typescript
// ✅ React.memo für reine Komponenten
export const PlayerCard = React.memo<PlayerCardProps>(
	({ player, onClick }) => {
		return (
			<Card onClick={() => onClick(player.id)}>
				<h3>{player.name}</h3>
				<p>Score: {player.score}</p>
			</Card>
		);
	},
	(prevProps, nextProps) => {
		// Custom Comparison: nur bei Änderung von player.id oder player.score re-rendern
		return prevProps.player.id === nextProps.player.id && prevProps.player.score === nextProps.player.score;
	}
);

// ✅ State-Optimierung
const QuestionDisplay = () => {
	// ❌ FALSCH - Gesamtes gameState bei jeder Änderung
	const gameState = useGameState();

	// ✅ RICHTIG - Nur benötigte Teile
	const currentQuestion = useGameState((state) => state.currentQuestion);
	const timer = useGameState((state) => state.timer);
};
```

### 4. Debouncing/Throttling bei Inputs

```typescript
// utils/debounce.ts
export const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): ((...args: Parameters<T>) => void) => {
	let timeoutId: NodeJS.Timeout;

	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
};

// Verwendung in Komponente
const SearchBar = () => {
	const [query, setQuery] = useState('');

	const debouncedSearch = useMemo(
		() =>
			debounce((searchTerm: string) => {
				// API Call nur nach 300ms ohne weitere Eingabe
				api.search(searchTerm);
			}, 300),
		[]
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setQuery(e.target.value);
		debouncedSearch(e.target.value);
	};

	return <input value={query} onChange={handleChange} />;
};
```

---

## 🔒 Sicherheit (VERPFLICHTEND)

### 1. Input-Validierung

```typescript
// schemas/player.schema.ts
import { z } from 'zod';

export const PlayerJoinSchema = z.object({
	sessionId: z
		.string()
		.min(6, 'Session-ID muss 6 Zeichen haben')
		.max(6, 'Session-ID muss 6 Zeichen haben')
		.regex(/^[A-Z0-9]{6}$/, 'Session-ID muss alphanumerisch sein'),
	name: z
		.string()
		.min(1, 'Name darf nicht leer sein')
		.max(50, 'Name darf maximal 50 Zeichen haben')
		.regex(/^[a-zA-Z0-9äöüÄÖÜß\s-]+$/, 'Name enthält ungültige Zeichen'),
});

export type PlayerJoinInput = z.infer<typeof PlayerJoinSchema>;

// Verwendung
const handlePlayerJoin = (data: unknown) => {
	const result = PlayerJoinSchema.safeParse(data);

	if (!result.success) {
		const errors = result.error.flatten().fieldErrors;
		throw new ValidationError(errors);
	}

	const validated: PlayerJoinInput = result.data;
	// ... weiter mit validated data
};
```

### 2. Input-Sanitization

```typescript
// utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (html: string): string => {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
		ALLOWED_ATTR: [],
	});
};

export const sanitizePlayerName = (name: string): string => {
	return name
		.trim()
		.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '') // Entferne ungültige Zeichen
		.substring(0, 50); // Maximal 50 Zeichen
};

export const sanitizeQuestionPrompt = (prompt: string): string => {
	return prompt
		.trim()
		.replace(/<script.*?>.*?<\/script>/gi, '') // Entferne Script-Tags
		.substring(0, 1000); // Maximal 1000 Zeichen
};
```

---

## 🎨 CSS-Architektur (VERPFLICHTEND)

### 1. Module CSS für Komponenten

```
frontend/src/components/atoms/Button/
├── Button.tsx
├── Button.module.css
├── Button.types.ts
└── Button.test.tsx
```

**Button.module.css:**

```css
.button {
	padding: var(--spacing-md);
	background-color: var(--color-primary);
	color: var(--color-text);
	border: none;
	border-radius: var(--border-radius-sm);
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.button:hover {
	background-color: var(--color-primary-hover);
}

.button:disabled {
	background-color: var(--color-disabled);
	cursor: not-allowed;
}

.button--primary {
	background-color: var(--color-primary);
}

.button--secondary {
	background-color: var(--color-secondary);
}

.button--danger {
	background-color: var(--color-danger);
}
```

**Button.tsx:**

```typescript
import styles from './Button.module.css';

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
	const className = `${styles.button} ${styles[`button--${variant}`]}`;

	return (
		<button className={className} {...props}>
			{children}
		</button>
	);
};
```

### 2. Zentrales Theme-System

**frontend/src/styles/theme.css:**

```css
:root {
	/* === COLORS === */
	/* Primary */
	--color-primary: #00bfff;
	--color-primary-hover: #0099cc;
	--color-primary-active: #007799;

	/* Secondary */
	--color-secondary: #6c757d;
	--color-secondary-hover: #5a6268;

	/* Semantic */
	--color-success: #28a745;
	--color-danger: #dc3545;
	--color-warning: #ffc107;
	--color-info: #17a2b8;

	/* Neutrals */
	--color-text: #ffffff;
	--color-text-muted: #adb5bd;
	--color-background: #1a1a1a;
	--color-surface: #2a2a2a;
	--color-border: #444444;
	--color-disabled: #666666;

	/* === TYPOGRAPHY === */
	--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	--font-family-mono: 'Fira Code', 'Courier New', monospace;

	/* Font Sizes */
	--font-size-xs: 0.75rem; /* 12px */
	--font-size-sm: 0.875rem; /* 14px */
	--font-size-base: 1rem; /* 16px */
	--font-size-lg: 1.125rem; /* 18px */
	--font-size-xl: 1.25rem; /* 20px */
	--font-size-2xl: 1.5rem; /* 24px */
	--font-size-3xl: 2rem; /* 32px */
	--font-size-4xl: 2.5rem; /* 40px */

	/* Font Weights */
	--font-weight-normal: 400;
	--font-weight-medium: 500;
	--font-weight-semibold: 600;
	--font-weight-bold: 700;

	/* Line Heights */
	--line-height-tight: 1.2;
	--line-height-normal: 1.5;
	--line-height-relaxed: 1.75;

	/* === SPACING === */
	--spacing-xs: 0.25rem; /* 4px */
	--spacing-sm: 0.5rem; /* 8px */
	--spacing-md: 1rem; /* 16px */
	--spacing-lg: 1.5rem; /* 24px */
	--spacing-xl: 2rem; /* 32px */
	--spacing-2xl: 3rem; /* 48px */
	--spacing-3xl: 4rem; /* 64px */

	/* === BORDERS === */
	--border-radius-sm: 0.25rem; /* 4px */
	--border-radius-md: 0.5rem; /* 8px */
	--border-radius-lg: 1rem; /* 16px */
	--border-radius-full: 9999px;

	--border-width-thin: 1px;
	--border-width-medium: 2px;
	--border-width-thick: 4px;

	/* === SHADOWS === */
	--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

	/* === TRANSITIONS === */
	--transition-fast: 150ms ease;
	--transition-base: 250ms ease;
	--transition-slow: 350ms ease;

	/* === Z-INDEX === */
	--z-index-dropdown: 1000;
	--z-index-sticky: 1020;
	--z-index-fixed: 1030;
	--z-index-modal-backdrop: 1040;
	--z-index-modal: 1050;
	--z-index-popover: 1060;
	--z-index-tooltip: 1070;
}

/* === DARK MODE (Default) === */
[data-theme='dark'] {
	--color-text: #ffffff;
	--color-text-muted: #adb5bd;
	--color-background: #1a1a1a;
	--color-surface: #2a2a2a;
	--color-border: #444444;
}

/* === LIGHT MODE === */
[data-theme='light'] {
	--color-text: #212529;
	--color-text-muted: #6c757d;
	--color-background: #ffffff;
	--color-surface: #f8f9fa;
	--color-border: #dee2e6;

	/* Adjust primary colors for better light mode contrast */
	--color-primary: #0066cc;
	--color-primary-hover: #0052a3;
	--color-primary-active: #004080;
}
```

### 3. Theme Toggle Service

```typescript
// services/theme.service.ts
export type Theme = 'light' | 'dark';

export class ThemeService {
	private static STORAGE_KEY = 'battlenet-theme';

	static getTheme(): Theme {
		const stored = localStorage.getItem(this.STORAGE_KEY);
		if (stored === 'light' || stored === 'dark') {
			return stored;
		}

		// System-Präferenz
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	static setTheme(theme: Theme): void {
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem(this.STORAGE_KEY, theme);
		eventBus.publish('THEME_CHANGED', theme);
	}

	static toggleTheme(): void {
		const current = this.getTheme();
		this.setTheme(current === 'light' ? 'dark' : 'light');
	}

	static initialize(): void {
		const theme = this.getTheme();
		this.setTheme(theme);
	}
}

// Hook
export const useTheme = () => {
	const [theme, setTheme] = useState<Theme>(ThemeService.getTheme());

	useEffect(() => {
		const unsubscribe = eventBus.subscribe('THEME_CHANGED', setTheme);
		return unsubscribe;
	}, []);

	const toggleTheme = useCallback(() => {
		ThemeService.toggleTheme();
	}, []);

	return { theme, toggleTheme };
};
```

---

## 🧪 Refactoring mit Tests (VERPFLICHTEND)

### Golden Rule: **Nie ohne Tests refactorieren**

```bash
# 1. Bestehende Funktionalität testen
npm test

# 2. Refactoring durchführen
# ... code changes ...

# 3. Tests erneut ausführen
npm test

# 4. Coverage prüfen
npm test -- --coverage

# ✅ Nur committen wenn:
# - Alle Tests grün
# - Coverage nicht gesunken
# - Keine neuen Linting-Errors
```

### Test-First Refactoring Workflow

```typescript
// 1. Test für bestehende Funktionalität schreiben
describe('PlayerService.calculateScore', () => {
	it('should calculate correct score for text question', () => {
		const answer: PlayerAnswer = { value: 'Berlin', questionId: 'q1' };
		const question: TextQuestion = {
			id: 'q1',
			type: 'text',
			correctAnswers: ['Berlin', 'berlin'],
		};

		const score = PlayerService.calculateScore(answer, question);

		expect(score).toBe(1);
	});
});

// 2. Test ausführen - sollte grün sein
// npm test

// 3. Refactoring durchführen (z.B. Extraction zu Strategy Pattern)
export class ScoringService {
	private strategies = new Map<QuestionType, ScoringStrategy>();

	calculateScore(answer: PlayerAnswer, question: Question): number {
		const strategy = this.strategies.get(question.type);
		return strategy.calculate(answer, question);
	}
}

// 4. Test erneut ausführen - sollte immer noch grün sein
// npm test

// 5. Neue Tests für neues Design schreiben
describe('ScoringService with Strategy Pattern', () => {
	it('should use correct strategy for text questions', () => {
		const service = new ScoringService();
		const spy = jest.spyOn(TextScoringStrategy.prototype, 'calculate');

		service.calculateScore(answer, textQuestion);

		expect(spy).toHaveBeenCalled();
	});
});
```

---

## 📚 README für neue Funktionalitäten

Bei jeder neuen Funktion/Modul ein entsprechendes README erstellen:

**Example: `services/scoring/README.md`**

````markdown
# Scoring Service

## Zweck

Berechnet Punktzahlen für Spielerantworten basierend auf Fragetyp und Antwortgenauigkeit.

## Architecture

Verwendet das **Strategy Pattern** für unterschiedliche Bewertungslogiken pro Fragetyp.

## Input

```typescript
interface CalculateScoreInput {
	answer: PlayerAnswer;
	question: Question;
}
```
````

## Output

```typescript
type ScoreResult = number; // 0-N Punkte
```

## Verwendung

```typescript
import { ScoringService } from '@/services/scoring';

const service = new ScoringService();
const score = service.calculateScore(playerAnswer, question);
```

## Strategies

| Fragetyp        | Strategy                        | Beschreibung                     |
| --------------- | ------------------------------- | -------------------------------- |
| text            | `TextScoringStrategy`           | Case-insensitive String-Matching |
| number          | `NumberScoringStrategy`         | Exakt oder Toleranzbereich       |
| multiple-choice | `MultipleChoiceScoringStrategy` | +1/-1 System                     |
| sorting         | `SortingScoringStrategy`        | Position-basiert                 |

## Testing

```bash
npm test services/scoring
```

## Extension

Neue Fragetypen hinzufügen:

1. Neue Strategy-Klasse erstellen: `XyzScoringStrategy.ts`
2. Interface `ScoringStrategy` implementieren
3. In `ScoringService` registrieren
4. Tests schreiben

````

---

## 🚨 Code-Review-Checkliste

Vor jedem Commit/PR folgende Checkliste durchgehen:

### Architecture
- [ ] Separation of Concerns eingehalten?
- [ ] Single Responsibility Principle befolgt?
- [ ] Funktionen unter 40 Zeilen?
- [ ] Design Pattern korrekt angewendet?

### Types
- [ ] Keine `any` Types?
- [ ] Generics statt Union-Chaos?
- [ ] Enums/String Literals für Status?
- [ ] Alle Funktionen typisiert?

### Code Quality
- [ ] Pure Functions wo möglich?
- [ ] Side-Effects isoliert?
- [ ] JSDoc für komplexe Funktionen?
- [ ] Keine offensichtlichen Kommentare?

### Performance
- [ ] Lazy Loading angewendet?
- [ ] Memoization bei teuren Berechnungen?
- [ ] Re-Renders optimiert?
- [ ] Debouncing bei Inputs?

### Security
- [ ] Input-Validierung vorhanden?
- [ ] User-Inputs sanitized?
- [ ] XSS-Prevention beachtet?

### Testing
- [ ] Unit Tests geschrieben?
- [ ] Tests laufen grün?
- [ ] Coverage nicht gesunken?
- [ ] E2E Tests für kritische Flows?

### Styling
- [ ] Module.css verwendet?
- [ ] CSS-Variablen aus Theme?
- [ ] Light/Dark Mode unterstützt?
- [ ] Keine Inline-Styles (außer dynamic)?

### Documentation
- [ ] README für neues Modul?
- [ ] Komplexe Logik dokumentiert?
- [ ] API-Änderungen dokumentiert?

---

## 🎯 Refactoring-Roadmap

### Phase 1: Foundation (Woche 1-2)
- [ ] Zentrales Theme-System mit CSS-Variablen
- [ ] Light/Dark Mode Implementation
- [ ] Module.css für alle Komponenten
- [ ] Service-Layer für API-Calls
- [ ] Event-Bus Implementation

### Phase 2: Architecture (Woche 3-4)
- [ ] Factory Pattern für Fragetypen
- [ ] Strategy Pattern für Scoring
- [ ] State Machine für Session
- [ ] Adapter Pattern für DTOs
- [ ] Builder Pattern für komplexe Objekte

### Phase 3: Performance (Woche 5-6)
- [ ] Lazy Loading für Routes
- [ ] Memoization für teure Komponenten
- [ ] Debouncing/Throttling
- [ ] React.memo für Pure Components
- [ ] Code Splitting optimieren

### Phase 4: Testing (Woche 7-8)
- [ ] Unit Tests für Services
- [ ] Integration Tests für Hooks
- [ ] E2E Tests mit Playwright
- [ ] 90%+ Coverage erreichen
- [ ] Performance Tests

---

## Entwicklungsworkflow

### Setup

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install

# Docker
docker-compose up --build
````

### Development

```bash
# Backend (mit Hot-Reload)
cd backend
.venv\Scripts\activate
uvicorn main:app --reload

# Frontend (Dev-Server)
cd frontend
npm start

# Tests
pytest                  # Backend
npm test               # Frontend
```

### Deployment

```bash
# Docker Compose
docker-compose up -d

# Einzelne Services
docker build -t battlenet-backend ./backend
docker build -t battlenet-frontend ./frontend
```

---

## Offene Fragen / Klärungsbedarf

✅ **Alle Architektur-Fragen geklärt (Stand: 2025-12-21)**

### Technologieentscheidungen:

1. ✅ Socket.IO für bidirektionale WebSocket-Kommunikation
2. ✅ Zustand für Frontend State Management
3. ✅ Styled-Components für CSS-in-JS
4. ✅ PostgreSQL mit Session-Persistierung (Status: active/completed)
5. ✅ Moderator-Auth via URL-Token, Spieler via Name
6. ✅ Vite als Build-Tool (Migration notwendig)
7. ✅ LinguiJS für Internationalisierung
8. ✅ Docker Compose + nginx als Reverse Proxy
9. ✅ Server-seitige Timer-Logik (Moderator kann bei Latenz Buzzer freigeben)

---

## Datenbank-Schema (PostgreSQL)

### Tabellen

#### `sessions`

```sql
CREATE TABLE sessions (
    id VARCHAR(6) PRIMARY KEY,           -- z.B. 'ABC123'
    moderator_token UUID NOT NULL,       -- UUID v4
    status VARCHAR(20) NOT NULL,         -- 'active', 'completed'
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    question_catalog JSONB               -- Gecachtes XML als JSON
);
```

#### `players`

```sql
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(6) REFERENCES sessions(id),
    name VARCHAR(100) NOT NULL,
    score INTEGER DEFAULT 0,
    connected BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, name)             -- Name pro Session eindeutig
);
```

#### `events` (Audit-Log)

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(6) REFERENCES sessions(id),
    event_type VARCHAR(50) NOT NULL,     -- 'QUESTION_STARTED', 'POINTS_AWARDED', etc.
    actor VARCHAR(100),                  -- Spieler-Name oder 'moderator'
    payload JSONB,                       -- Event-spezifische Daten
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## WebSocket-Events (Detailliert)

### Socket.IO Event-Schema

#### Moderator → Server

```typescript
// Session-Management
socket.emit('moderator:join', { sessionId: string, token: string });

// Fragen-Steuerung
socket.emit('moderator:question:start', { questionId: string });
socket.emit('moderator:question:end', { questionId: string });

// Bild-Steuerung
socket.emit('moderator:image:show', { imageUrl: string });
socket.emit('moderator:image:hide');

// Timer-Steuerung
socket.emit('moderator:timer:start', { duration: number }); // in Sekunden
socket.emit('moderator:timer:stop');

// Buzzer-Steuerung
socket.emit('moderator:buzzer:enable');
socket.emit('moderator:buzzer:reset');

// Manuelle Punktevergabe
socket.emit('moderator:points:award', { playerName: string, points: number, reason: string });
socket.emit('moderator:points:subtract', { playerName: string, points: number, reason: string });
```

#### Server → Spieler

```typescript
// Fragen
socket.emit('question:start', {
	id: string,
	type: string,
	prompt: string,
	data: any, // Fragetyp-spezifische Daten
});
socket.emit('question:end');

// Bilder
socket.emit('image:show', { url: string });
socket.emit('image:hide');

// Timer (authoritative)
socket.emit('timer:start', { duration: number, startedAt: number }); // Unix timestamp
socket.emit('timer:stop');
socket.emit('timer:sync', { remaining: number }); // Periodisches Sync

// Buzzer
socket.emit('buzzer:enabled');
socket.emit('buzzer:result', { winner: string, timestamp: number });
socket.emit('buzzer:reset');

// Punkte
socket.emit('scoreboard:update', {
	players: Array<{ name: string; score: number }>,
});
```

#### Spieler → Server

```typescript
// Verbindung
socket.emit('player:join', { sessionId: string, name: string });
socket.emit('player:reconnect', { sessionId: string, name: string });

// Antworten
socket.emit('player:answer', { questionId: string, answer: any });

// Buzzer
socket.emit('player:buzzer', { timestamp: number }); // Client-Timestamp
```

#### Server → Dashboard

```typescript
// Scoreboard
socket.emit('dashboard:scoreboard', {
	players: Array<{ name: string; score: number; connected: boolean }>,
	sortBy: 'score', // Absteigend sortiert
});

// Optionale Frage
socket.emit('dashboard:question', {
	prompt: string,
	type: string,
});

// Timer-Sync
socket.emit('dashboard:timer', { remaining: number });
```

---

## Styling-Konventionen (Styled-Components)

### Theme-Provider

```typescript
// theme.ts
export const theme = {
	colors: {
		background: '#1a1a1a',
		accent: '#00bfff',
		text: '#ffffff',
		error: '#ff4444',
		success: '#44ff44',
		warning: '#ffaa00',
		disabled: '#666666',
		hover: '#0099cc',
	},
	typography: {
		fontFamily: "'Inter', sans-serif",
		sizes: {
			h1: '2.5rem',
			h2: '2rem',
			body: '1rem',
			small: '0.875rem',
		},
		weights: {
			bold: 700,
			normal: 400,
		},
	},
	spacing: {
		xs: '0.25rem',
		sm: '0.5rem',
		md: '1rem',
		lg: '1.5rem',
		xl: '2rem',
	},
};
```

### Komponenten-Struktur

```typescript
// Button.tsx (Atom)
import styled from 'styled-components';

const StyledButton = styled.button`
	background-color: ${(props) => props.theme.colors.accent};
	color: ${(props) => props.theme.colors.text};
	padding: ${(props) => props.theme.spacing.md};
	border: none;
	border-radius: 4px;
	cursor: pointer;

	&:hover {
		background-color: ${(props) => props.theme.colors.hover};
	}

	&:disabled {
		background-color: ${(props) => props.theme.colors.disabled};
		cursor: not-allowed;
	}
`;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => <StyledButton {...props}>{children}</StyledButton>;
```

---

## i18n mit LinguiJS

### Setup

```bash
npm install @lingui/react @lingui/macro @lingui/cli
```

### Konfiguration (lingui.config.js)

```javascript
module.exports = {
	locales: ['de', 'en', 'fr', 'es'],
	sourceLocale: 'de',
	catalogs: [
		{
			path: 'src/locales/{locale}/messages',
			include: ['src'],
		},
	],
};
```

### Verwendung

```typescript
import { Trans, t } from '@lingui/macro';

// In JSX
<Trans>Willkommen bei Battle.Net</Trans>;

// In Variablen
const placeholder = t`Gib deinen Namen ein`;
```

---

## Migration zu Vite

### Erforderliche Schritte

1. ✅ `vite` und `@vitejs/plugin-react` installieren
2. ✅ `vite.config.ts` erstellen
3. ✅ `index.html` ins Root-Verzeichnis verschieben
4. ✅ Imports von `%PUBLIC_URL%` zu relativen Pfaden ändern
5. ✅ `package.json` Scripts anpassen:
   - `"dev": "vite"`
   - `"build": "tsc && vite build"`
   - `"preview": "vite preview"`
6. ✅ Testing-Framework zu Vitest migrieren

---

```

```
