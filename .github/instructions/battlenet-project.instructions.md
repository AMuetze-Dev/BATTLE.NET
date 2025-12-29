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
```

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
