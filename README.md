# 🎮 Battle.Net Quiz-Plattform

Eine moderne, skalierbare Echtzeit-Quiz-Plattform mit WebSocket-basierter Kommunikation für interaktive Lernszenarien, Team-Events und Wissensabfragen.

![Coverage](https://img.shields.io/badge/coverage-82%25-brightgreen)
![Tests](https://img.shields.io/badge/tests-195%20passed-success)
![Python](https://img.shields.io/badge/python-3.13-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![React](https://img.shields.io/badge/react-19.0-blue)
![FastAPI](https://img.shields.io/badge/fastapi-0.115-green)

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Technologie-Stack](#-technologie-stack)
- [Voraussetzungen](#-voraussetzungen)
- [Installation & Setup](#-installation--setup)
  - [Backend-Einrichtung](#1-backend-einrichtung-python--fastapi)
  - [Frontend-Einrichtung](#2-frontend-einrichtung-react--typescript)
  - [Datenbank-Setup](#3-datenbank-setup-postgresql)
  - [Docker Deployment](#4-docker-deployment-optional)
- [Entwicklung](#-entwicklung)
- [Architektur](#-architektur)
- [Fragetypen](#-fragetypen)
- [Testing](#-testing)
- [Deployment](#-deployment)

---

## 🎯 Übersicht

Battle.Net ist eine vollständig asynchrone Quiz-Plattform, die auf modernen Web-Technologien basiert. Die Architektur folgt dem Client-Server-Modell mit bidirektionaler WebSocket-Kommunikation für Echtzeit-Updates.

### Kernfunktionalitäten

- **Echtzeit-Synchronisation**: Socket.IO für bidirektionale Kommunikation zwischen allen Clients
- **Moderator-Dashboard**: Vollständige Kontrolle über Spielablauf, Fragensteuerung und Punktevergabe
- **8 Fragetypen**: Von Multiple-Choice über Hotspot-Bildfragen bis zu Drag-&-Drop-Sortieraufgaben
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile
- **XML-basierte Fragenkataloge**: Strukturierte, validierte Quizinhalte mit XSD-Schema
- **Live-Leaderboard**: Automatische Ranglisten-Updates für alle Teilnehmer

---

## 🛠️ Technologie-Stack

### Backend (Python)

- **Framework**: FastAPI 0.115.4 (ASGI-basiert, async/await)
- **WebSocket**: python-socketio 5.11.4
- **ORM**: SQLAlchemy 2.0.36 (async engine mit asyncpg)
- **Validierung**: Pydantic 2.10.6 für type-safe Models
- **Server**: Uvicorn (ASGI server mit uvloop)

### Frontend (TypeScript/React)

- **Framework**: React 19.0 mit TypeScript 5.x
- **Styling**: styled-components 6.x
- **State Management**: React Hooks + Context API
- **WebSocket Client**: socket.io-client 4.x
- **Build Tool**: React Scripts (Migration zu Vite geplant)
- **Testing**: Playwright für E2E-Tests

### Datenbank

- **DBMS**: PostgreSQL 15+
- **Connection Pool**: asyncpg (PostgreSQL async driver)
- **Migrations**: Alembic

### Infrastructure

- **Reverse Proxy**: nginx
- **Container**: Docker + docker-compose
- **CI/CD**: GitHub Actions ready

---

## ✅ Voraussetzungen

Stellen Sie sicher, dass folgende Software auf Ihrem System installiert ist:

### Minimal-Requirements

| Tool           | Version | Download                                               |
| -------------- | ------- | ------------------------------------------------------ |
| **Python**     | 3.11+   | [python.org](https://www.python.org/downloads/)        |
| **Node.js**    | 18+ LTS | [nodejs.org](https://nodejs.org/)                      |
| **PostgreSQL** | 15+     | [postgresql.org](https://www.postgresql.org/download/) |
| **Git**        | 2.x     | [git-scm.com](https://git-scm.com/)                    |

### Optional (für Docker Deployment)

- **Docker Desktop** | 20+ | [docker.com](https://www.docker.com/products/docker-desktop)

### Empfohlene IDEs

- **VS Code** mit Extensions: Python, Pylance, ESLint, Prettier
- **PyCharm Professional** (für Python-Entwicklung)
- **WebStorm** (für Frontend-Entwicklung)

---

## 🚀 Installation & Setup

Diese Anleitung führt Sie Schritt für Schritt durch die lokale Einrichtung der Entwicklungsumgebung.

### 1. Backend-Einrichtung (Python + FastAPI)

#### 1.1 Repository klonen

```bash
git clone <repository-url>
cd Battle.Net/backend
```

#### 1.2 Virtuelle Python-Umgebung erstellen

Eine virtuelle Umgebung (Virtual Environment) isoliert die Projekt-Dependencies vom System-Python.

**Windows:**

```powershell
# Python Virtual Environment erstellen
python -m venv .venv

# Umgebung aktivieren
.venv\Scripts\activate

# Erfolgreiche Aktivierung: Prompt zeigt (.venv)
```

**Linux/macOS:**

```bash
# Python Virtual Environment erstellen
python3 -m venv .venv

# Umgebung aktivieren
source .venv/bin/activate
```

#### 1.3 Dependencies installieren

```bash
# Alle erforderlichen Packages installieren
pip install -r requirements.txt

# Installation verifizieren
pip list
```

**Wichtige Dependencies:**

- `fastapi` - REST API Framework
- `uvicorn` - ASGI Server
- `sqlalchemy` - ORM für Datenbank-Abstraction
- `python-socketio` - WebSocket-Server
- `pydantic` - Data Validation
- `pytest` - Testing Framework

#### 1.4 Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei im `backend/` Verzeichnis:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/battlenet

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS (Frontend URLs)
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

#### 1.5 Backend-Server starten

```bash
# Development Server mit Auto-Reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Server läuft auf: http://localhost:8000
# API Dokumentation: http://localhost:8000/docs (Swagger UI)
# Alternative Docs: http://localhost:8000/redoc
```

**Wichtige Hinweise:**

- `--reload`: Server startet bei Code-Änderungen automatisch neu
- `--host 0.0.0.0`: Server ist im lokalen Netzwerk erreichbar
- Swagger UI zeigt alle verfügbaren REST Endpoints mit Testfunktion

#### 1.6 Backend-Tests ausführen

```bash
# Alle Tests ausführen
pytest -v

# Mit Coverage-Report
pytest --cov=app --cov-report=html

# Coverage-Report öffnen: backend/htmlcov/index.html

# Spezifische Test-Datei
pytest tests/test_socketio.py -v

# Nur Failed Tests erneut ausführen
pytest --lf
```

---

### 2. Frontend-Einrichtung (React + TypeScript)

#### 2.1 Frontend-Verzeichnis öffnen

```bash
cd ../frontend
# oder neues Terminal: cd Battle.Net/frontend
```

#### 2.2 Node.js Dependencies installieren

```bash
# npm Package Manager verwenden
npm install

# Alternative: yarn (falls installiert)
yarn install
```

**Installierte Dependencies (Auszug):**

- `react` & `react-dom` - UI Framework
- `typescript` - Type-Safe JavaScript
- `styled-components` - CSS-in-JS
- `socket.io-client` - WebSocket Client
- `react-router-dom` - Client-side Routing
- `@lingui/react` - i18n (Internationalisierung)

#### 2.3 Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei im `frontend/` Verzeichnis:

```env
# Backend API Endpoint
REACT_APP_API_URL=http://localhost:8000

# WebSocket Server
REACT_APP_WS_URL=http://localhost:8000

# Development Port
PORT=3000
```

#### 2.4 Frontend Development Server starten

```bash
# Development Server mit Hot Module Replacement
npm start

# Server läuft auf: http://localhost:3000
# Öffnet automatisch den Browser
```

**Development Features:**

- **Hot Reload**: Änderungen werden sofort im Browser sichtbar
- **Error Overlay**: Kompilierungsfehler werden im Browser angezeigt
- **Source Maps**: Original TypeScript im Browser-Debugger

#### 2.5 Production Build erstellen

```bash
# Optimierter Production Build
npm run build

# Ausgabe: frontend/build/
# - Minifiziertes JavaScript
# - Optimierte Assets
# - Service Worker (optional)

# Build testen (mit serve)
npx serve -s build -l 3000
```

#### 2.6 Frontend-Tests ausführen

```bash
# Unit Tests (Jest)
npm test

# E2E Tests (Playwright)
npm run test:e2e

# E2E Tests mit UI
npm run test:e2e:ui

# E2E Tests im Browser sichtbar
npm run test:e2e:headed
```

---

### 3. Datenbank-Setup (PostgreSQL)

#### 3.1 PostgreSQL installieren

**Windows:**

- Download: [PostgreSQL Windows Installer](https://www.postgresql.org/download/windows/)
- Installation mit pgAdmin 4 (grafisches Management-Tool)

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**

```bash
brew install postgresql@15
brew services start postgresql@15
```

#### 3.2 Datenbank erstellen

```bash
# PostgreSQL CLI öffnen
psql -U postgres

# Datenbank erstellen
CREATE DATABASE battlenet;

# User erstellen (optional)
CREATE USER battlenet_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE battlenet TO battlenet_user;

# CLI verlassen
\q
```

#### 3.3 Schema initialisieren

```bash
# Aus dem Projekt-Root-Verzeichnis
cd Battle.Net

# Schema-Datei ausführen
psql -U postgres -d battlenet -f database/schema.sql

# Erfolgreiche Ausführung: Tabellen werden erstellt
# - sessions
# - players
# - questions
# - answers
# - buzzer_presses
# - events (Audit-Log)
```

#### 3.4 Datenbank-Verbindung testen

```bash
# Python Shell öffnen (im backend/ Verzeichnis mit aktivierter venv)
cd backend
python

# In Python Shell:
>>> from app.core.database import engine, SessionLocal
>>> from sqlalchemy import text
>>>
>>> async def test_connection():
...     async with engine.begin() as conn:
...         result = await conn.execute(text("SELECT version()"))
...         print(result.scalar())
...
>>> import asyncio
>>> asyncio.run(test_connection())
# Ausgabe: PostgreSQL 15.x ...
```

---

### 4. Docker Deployment (Optional)

Für eine vereinfachte Einrichtung aller Services können Sie Docker Compose verwenden.

#### 4.1 Docker Compose starten

```bash
# Aus dem Projekt-Root
cd Battle.Net

# Alle Services bauen und starten
docker-compose up --build

# Im Hintergrund starten (detached)
docker-compose up -d

# Logs anzeigen
docker-compose logs -f
```

**Gestartete Services:**

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- nginx: `http://localhost:80` (Reverse Proxy)

#### 4.2 Docker Container verwalten

```bash
# Status prüfen
docker-compose ps

# Services stoppen
docker-compose stop

# Services stoppen und Container entfernen
docker-compose down

# Datenbank-Volumes ebenfalls entfernen
docker-compose down -v

# Einzelnen Service neu starten
docker-compose restart backend
```

---

## 💻 Entwicklung

### Development Workflow

1. **Backend ändern**:

   - Code editieren in `backend/app/`
   - Server lädt automatisch neu (uvicorn --reload)
   - Tests ausführen: `pytest`

2. **Frontend ändern**:

   - Code editieren in `frontend/src/`
   - Browser aktualisiert automatisch (Hot Reload)
   - TypeScript-Fehler werden sofort angezeigt

3. **Datenbank ändern**:
   - Schema ändern in `database/schema.sql`
   - Migration mit Alembic erstellen (optional)
   - Tests mit In-Memory SQLite für Geschwindigkeit

### Debugging

**Backend (VS Code):**

```json
// .vscode/launch.json
{
	"name": "Python: FastAPI",
	"type": "python",
	"request": "launch",
	"module": "uvicorn",
	"args": ["app.main:app", "--reload"],
	"cwd": "${workspaceFolder}/backend"
}
```

**Frontend (Browser DevTools):**

- Chrome DevTools: F12
- React DevTools Extension empfohlen
- Source Maps aktiviert für TypeScript-Debugging

---

## 🏗️ Architektur

### System-Übersicht

```
┌─────────────┐      HTTP/WS        ┌──────────────┐
│   Browser   │ ◄─────────────────► │    nginx     │
│  (Player/   │                     │ Reverse Proxy│
│ Moderator)  │                     └──────────────┘
└─────────────┘                            │
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                              │
              ┌─────▼──────┐                              ┌───────▼────────┐
              │  Frontend  │                              │    Backend     │
              │   React    │                              │    FastAPI     │
              │TypeScript  │                              │ + Socket.IO    │
              └────────────┘                              └────────┬───────┘
                                                                   │
                                                          ┌────────▼────────┐
                                                          │   PostgreSQL    │
                                                          │    Database     │
                                                          └─────────────────┘
```

### Backend-Architektur (FastAPI)

```
backend/
├── app/
│   ├── main.py              # FastAPI Application Entry Point
│   ├── socketio_app.py      # Socket.IO Event Handlers
│   │
│   ├── api/                 # REST API Endpoints
│   │   ├── sessions.py      # Session CRUD
│   │   ├── players.py       # Player Management
│   │   └── dependencies.py  # Dependency Injection
│   │
│   ├── core/               # Core Functionality
│   │   ├── database.py     # SQLAlchemy Engine & Session
│   │   ├── config.py       # Settings (Pydantic)
│   │   └── game_state.py   # In-Memory Game State
│   │
│   ├── models/             # Database Models (ORM)
│   │   └── models.py       # SQLAlchemy Models
│   │
│   ├── services/           # Business Logic Layer
│   │   ├── session_service.py
│   │   ├── player_service.py
│   │   └── xml_validator.py
│   │
│   └── schemas/            # Pydantic Schemas (API)
│       └── schemas.py      # Request/Response Models
│
├── tests/                  # pytest Test Suite
│   ├── test_api.py
│   ├── test_socketio.py
│   └── test_models.py
│
├── requirements.txt        # Python Dependencies
└── .env                    # Environment Variables
```

### Frontend-Architektur (React)

```
frontend/
├── src/
│   ├── index.tsx           # React Root
│   ├── App.tsx             # Main App Component
│   ├── theme.ts            # Design System (Colors, Spacing)
│   │
│   ├── components/         # Reusable UI Components
│   │   ├── atoms/          # Atomic Design: Basic Elements
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── BuzzerButton.tsx
│   │   │   ├── SliderInput.tsx
│   │   │   ├── HotspotInput.tsx
│   │   │   └── SortingInput.tsx
│   │   │
│   │   ├── molecules/      # Composite Components
│   │   │   ├── AnswerInput.tsx
│   │   │   └── QuestionCard.tsx
│   │   │
│   │   └── organisms/      # Complex Components
│   │       ├── Leaderboard.tsx
│   │       └── QuestionDisplay.tsx
│   │
│   ├── presentation/       # Page-Level Components
│   │   └── pages/
│   │       ├── ModeratorSessionPage.tsx
│   │       ├── PlayerSessionPage.tsx
│   │       ├── QuizEditorPage.tsx
│   │       └── DashboardPage.tsx
│   │
│   ├── hooks/              # Custom React Hooks
│   │   ├── useWebSocket.ts # Socket.IO Connection
│   │   └── useCommon.ts    # Shared Logic
│   │
│   ├── services/           # External API Communication
│   │   └── api.ts          # REST API Client
│   │
│   ├── types/              # TypeScript Definitions
│   │   ├── websocket-events.ts
│   │   └── index.ts
│   │
│   └── locales/            # i18n Translations
│       ├── de/
│       └── en/
│
├── public/
│   ├── index.html
│   └── manifest.json
│
├── package.json            # npm Dependencies
└── tsconfig.json           # TypeScript Configuration
```

### Datenbank-Schema (PostgreSQL)

**Wichtigste Tabellen:**

```sql
-- Quiz Sessions
sessions (
    id, token, moderator_token, status, created_at
)

-- Teilnehmer
players (
    id, session_id, name, score, connected
)

-- Fragen (gecached aus XML)
questions (
    id, session_id, question_data (JSONB), order_num
)

-- Spieler-Antworten
answers (
    id, player_id, question_id, answer_text, is_correct, points
)

-- Buzzer-Events
buzzer_presses (
    id, player_id, question_id, timestamp
)

-- Audit-Log
events (
    id, session_id, event_type, event_data (JSONB), created_at
)
```

### WebSocket Event-Flow

**Spieler tritt bei:**

```
Player Browser              Backend                 Moderator Browser
     │                         │                           │
     ├──► player:join          │                           │
     │                         ├──► DB: INSERT player      │
     │                         ├──► broadcast:             │
     │                         │     player_joined ────────┤
     │◄──── game_state_update ─┤                           │
```

**Moderator startet Frage:**

```
Moderator                   Backend                    All Players
     │                         │                           │
     ├──► start_question       │                           │
     │                         ├──► game_state.current =   │
     │                         │     question              │
     │                         ├──► broadcast:             │
     │                         │     game_state_update ────┤
     │◄──── confirmation ──────┤                           │
```

### User Roles & Permissions

| Role          | URL Pattern                          | Authentifizierung    | Berechtigungen                                                                 |
| ------------- | ------------------------------------ | -------------------- | ------------------------------------------------------------------------------ |
| **Moderator** | `/moderator/:sessionId?token=<uuid>` | UUID-Token (URL)     | • Fragen steuern<br>• Punkte vergeben<br>• Timer starten<br>• Buzzer freigeben |
| **Spieler**   | `/player/:sessionId`                 | Name (self-assigned) | • Antworten senden<br>• Buzzer drücken<br>• Leaderboard sehen                  |
| **Dashboard** | `/dashboard/:sessionId`              | Keine (öffentlich)   | • Leaderboard anzeigen<br>• (optional) Aktuelle Frage                          |

---

## 🎮 Fragetypen

Die Plattform unterstützt 8 verschiedene Fragetypen mit jeweils spezialisierten UI-Komponenten:

### 1. **Text-Input** (Freitext)

```xml
<question type="text">
    <text>Hauptstadt von Deutschland?</text>
    <answer>Berlin</answer>
    <answer>berlin</answer> <!-- Case-insensitive -->
</question>
```

- **UI**: Text-Eingabefeld
- **Auswertung**: Mehrere korrekte Antworten möglich
- **Verwendung**: Offene Fragen, Namen, Begriffe

### 2. **Zahl-Input** (Numerisch)

```xml
<question type="number">
    <text>Wie viele Bundesländer hat Deutschland?</text>
    <answer>16</answer>
    <tolerance>0</tolerance>
</question>
```

- **UI**: Numerisches Eingabefeld
- **Auswertung**: Mit optionaler Toleranz (±)
- **Verwendung**: Jahreszahlen, Mengen, Messungen

### 3. **Slider** (Schätzfrage)

```xml
<question type="slider">
    <text>Einwohnerzahl Deutschland (in Millionen)?</text>
    <sliderMin>0</sliderMin>
    <sliderMax>100</sliderMax>
    <sliderStep>1</sliderStep>
    <sliderUnit>Mio</sliderUnit>
    <sliderCorrectValue>84</sliderCorrectValue>
</question>
```

- **UI**: Visueller Slider mit Wertebereich
- **Auswertung**: Nähe zur korrekten Antwort
- **Verwendung**: Schätzungen, Prozentwerte

### 4. **Multiple-Choice**

```xml
<question type="multiple-choice">
    <text>Welche Länder grenzen an Deutschland?</text>
    <answers>
        <answer correct="true">Frankreich</answer>
        <answer correct="true">Polen</answer>
        <answer correct="false">Spanien</answer>
        <answer correct="true">Österreich</answer>
    </answers>
</question>
```

- **UI**: Checkbox-Liste (Mehrfachauswahl)
- **Auswertung**: +1 Punkt pro richtiger Auswahl, -1 pro falscher
- **Verwendung**: Wissensabfragen mit Mehrfachantworten

### 5. **True/False**

```xml
<question type="true-false">
    <text>Die Erde ist flach.</text>
    <correctAnswer>0</correctAnswer> <!-- 0=False, 1=True -->
</question>
```

- **UI**: Zwei große Buttons (Wahr/Falsch)
- **Auswertung**: Binäre Entscheidung
- **Verwendung**: Ja/Nein-Fragen, Faktenprüfung

### 6. **Buzzer**

```xml
<question type="buzzer">
    <text>Wie heißt der höchste Berg Deutschlands?</text>
    <correctAnswerText>Zugspitze</correctAnswerText>
</question>
```

- **UI**: Großer Buzzer-Button + Spacebar-Shortcut
- **Mechanik**: Erster Spieler gewinnt, alle anderen blockiert
- **Verwendung**: Schnelligkeitsfragen, Quiz-Shows

### 7. **Hotspot** (Bild-Klick)

```xml
<question type="hotspot">
    <text>Klicke auf Berlin</text>
    <image>deutschland-karte.png</image>
    <hotspotX>52.5</hotspotX> <!-- Prozent von links -->
    <hotspotY>48.2</hotspotY> <!-- Prozent von oben -->
    <allowZoom>true</allowZoom>
</question>
```

- **UI**: Interaktives Bild, Spieler klicken Position
- **Auswertung**: Distanz zum korrekten Hotspot
- **Features**:
  - Zoom-Funktion für Details
  - Farbcodierte Player-Pins (Moderator-Ansicht)
  - Hover-Highlight für Spieler-Antworten
- **Verwendung**: Geografie, Anatomie, Diagramme

### 8. **Sorting** (Reihenfolge)

```xml
<question type="sorting">
    <text>Sortiere chronologisch (älteste zuerst)</text>
    <sortingItems>
        <item>Römisches Reich</item>
        <item>Mittelalter</item>
        <item>Renaissance</item>
        <item>Industrialisierung</item>
    </sortingItems>
</question>
```

- **UI**: Drag-&-Drop Interface (Desktop) + Buttons (Mobile)
- **Mechanik**:
  - Items werden für Spieler zufällig gemischt
  - Moderator sieht sortierte Antworten mit Farbcodierung
  - Blau = korrekte Position, Grau = falsche Position
- **Verwendung**: Zeitlinien, Prozesse, Prioritäten

---

## 📦 Fragenkatalog-Format

### XML-Struktur

Fragenkataloge werden als ZIP-Archiv mit validierter XML-Datei hochgeladen:

```
quiz-beispiel.zip
├── questions.xml         # Hauptdatei (validiert gegen XSD)
└── media/               # Medien-Verzeichnis
    ├── frage1-bild.png
    ├── frage2-bild.jpg
    └── logo.svg
```

### XML-Schema (questions.xsd)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<questions>
    <question type="multiple-choice" section="Geschichte" points="10">
        <text>Hauptfrage hier...</text>
        <image>media/bild.png</image> <!-- Optional -->
        <answers>
            <answer correct="true">Antwort A</answer>
            <answer correct="false">Antwort B</answer>
        </answers>
    </question>
    <!-- Weitere Fragen... -->
</questions>
```

### Upload-Prozess

1. **Moderator** wählt ZIP-Datei aus
2. **Backend** entpackt und validiert XML gegen XSD-Schema
3. **Bilder** werden Base64-encodiert und in DB gespeichert
4. **Fragen** werden in `questions` Tabelle gecached
5. **Fehlerhafte XMLs** werden mit detaillierter Fehlermeldung abgelehnt

### Validation Rules

- XML muss UTF-8 encoded sein
- Alle `<image>` Referenzen müssen in `media/` existieren
- Fragetypen müssen erlaubt sein (siehe XSD)
- `points` Attribut optional (default: 10)
- `section` Attribut optional (für Kategorisierung)

**Vollständiges Beispiel**: [example-quiz.xml](questions-schema/example-quiz.xml)  
**XSD-Schema**: [questions.xsd](questions-schema/questions.xsd)

---

## 🧪 Testing

### Backend Testing (pytest)

#### Test-Suite Overview

```bash
# Alle Tests ausführen mit Verbose Output
pytest -v

# Mit Coverage-Report
pytest --cov=app --cov-report=html --cov-report=term

# Parallele Ausführung (schneller)
pytest -n auto

# Nur Failed Tests
pytest --lf

# Spezifische Test-Datei
pytest tests/test_socketio.py -v

# Einzelner Test
pytest tests/test_api.py::test_create_session -v
```

#### Test-Struktur

```
backend/tests/
├── test_api.py              # REST API Endpoints
├── test_socketio.py         # WebSocket Events
├── test_models.py           # Database Models
├── test_xml_validation.py   # XML/XSD Validation
└── conftest.py              # Fixtures & Configuration
```

#### Test-Coverage

| Modul            | Coverage | Status |
| ---------------- | -------- | ------ |
| API Endpoints    | 95%      | ✅     |
| Socket.IO Events | 88%      | ✅     |
| Database Models  | 92%      | ✅     |
| XML Validation   | 78%      | ⚠️     |
| **Gesamt**       | **82%**  | ✅     |

**Coverage-Report anzeigen:**

```bash
pytest --cov=app --cov-report=html
# Öffnen: backend/htmlcov/index.html
```

### Frontend Testing

#### Unit Tests (React Testing Library)

```bash
# Alle Tests ausführen
npm test

# Watch Mode (re-runs on file change)
npm test -- --watch

# Coverage Report
npm test -- --coverage
```

#### E2E Tests (Playwright)

```bash
# Alle E2E Tests
npm run test:e2e

# Mit UI (interaktiv)
npm run test:e2e:ui

# Im Browser sichtbar (headed mode)
npm run test:e2e:headed

# Spezifischer Test
npx playwright test e2e/quiz-flow.spec.ts
```

**E2E Test-Szenarien:**

- `leaderboard.spec.ts` - Leaderboard Live-Updates
- `quiz-flow.spec.ts` - Vollständiger Quiz-Durchlauf
- `question-types.spec.ts` - Alle 8 Fragetypen

### Integration Tests

Testen des kompletten Stacks (Backend + Frontend + DB):

```bash
# 1. Backend starten
cd backend
uvicorn app.main:app --reload &

# 2. Frontend starten
cd ../frontend
npm start &

# 3. E2E Tests ausführen
npm run test:e2e
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Environment Variables konfiguriert (`.env`)
- [ ] PostgreSQL Datenbank initialisiert
- [ ] Backend Tests erfolgreich (`pytest`)
- [ ] Frontend Build erstellt (`npm run build`)
- [ ] CORS Origins konfiguriert
- [ ] SSL/TLS Zertifikate eingerichtet (HTTPS)
- [ ] nginx Reverse Proxy konfiguriert
- [ ] Monitoring & Logging aktiviert

### Docker Production Deployment

#### 1. Production docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: battlenet
      POSTGRES_USER: battlenet
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://battlenet:${DB_PASSWORD}@postgres:5432/battlenet
      DEBUG: false
    depends_on:
      - postgres
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: always

volumes:
  postgres_data:
```

#### 2. Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Dependencies installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application Code
COPY . .

# Non-root User
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Server starten
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 3. Frontend Dockerfile

```dockerfile
# frontend/Dockerfile (Multi-Stage Build)
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 4. Deployment ausführen

```bash
# Environment Variables setzen
export DB_PASSWORD=secure_password_here

# Services starten
docker-compose -f docker-compose.prod.yml up -d

# Logs prüfen
docker-compose logs -f

# Status prüfen
docker-compose ps

# Datenbank initialisieren (einmalig)
docker-compose exec postgres psql -U battlenet -d battlenet -f /schema.sql
```

### Traditional Server Deployment

#### Backend (systemd Service)

```ini
# /etc/systemd/system/battlenet-backend.service
[Unit]
Description=Battle.Net Backend (FastAPI)
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/battlenet/backend
Environment="PATH=/var/www/battlenet/backend/.venv/bin"
ExecStart=/var/www/battlenet/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Service aktivieren und starten
sudo systemctl enable battlenet-backend
sudo systemctl start battlenet-backend
sudo systemctl status battlenet-backend
```

#### Frontend (nginx)

```nginx
# /etc/nginx/sites-available/battlenet
server {
    listen 80;
    server_name quiz.example.com;

    # Frontend (Static Files)
    root /var/www/battlenet/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Proxy
    location /socket.io {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# nginx konfigurieren
sudo ln -s /etc/nginx/sites-available/battlenet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Monitoring & Logging

### Application Logs

**Backend (Python Logging):**

```python
# Strukturierte Logs mit Log-Leveln
import logging

logger = logging.getLogger(__name__)
logger.info("Session erstellt", extra={"session_id": session_id})
logger.error("Fehler beim Laden", exc_info=True)
```

**Log-Level konfigurieren:**

```env
# .env
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### Datenbank Audit-Log

Alle wichtigen Events werden in der `events` Tabelle gespeichert:

```sql
SELECT
    event_type,
    event_data,
    created_at
FROM events
WHERE session_id = 'abc123'
ORDER BY created_at DESC;
```

**Event-Types:**

- `session_created`
- `player_joined`
- `question_started`
- `answer_submitted`
- `points_awarded`

### Performance Monitoring

**Backend Metriken:**

- Request Duration (uvicorn logs)
- Database Query Time (SQLAlchemy logging)
- WebSocket Connection Count

**Frontend Metriken:**

- Lighthouse Score (Performance, Accessibility)
- Bundle Size (webpack-bundle-analyzer)
- React DevTools Profiler

---

## 🔐 Sicherheit & Best Practices

### Authentifizierung

| Rolle     | Mechanismus          | Sicherheitsstufe               |
| --------- | -------------------- | ------------------------------ |
| Moderator | UUID v4 Token (URL)  | Hoch - nicht erratbar          |
| Spieler   | Name (self-assigned) | Niedrig - öffentliche Sessions |
| Dashboard | Keine Auth           | Öffentlich                     |

### Input Validation

**Backend (Pydantic):**

```python
class PlayerJoinRequest(BaseModel):
    session_id: str = Field(..., min_length=6, max_length=20)
    name: str = Field(..., min_length=1, max_length=50)

    @validator('name')
    def sanitize_name(cls, v):
        # XSS Prevention
        return v.strip()[:50]
```

**Frontend (TypeScript):**

```typescript
// Type-Safety mit strikten Types
const answer: string = userInput.trim();
if (answer.length > 1000) {
	throw new Error('Input zu lang');
}
```

### SQL Injection Prevention

- **SQLAlchemy ORM** verwendet Prepared Statements
- Keine Raw SQL Queries in Production-Code
- Parametrized Queries für Custom Queries

### XSS Prevention

- **styled-components** escaped automatisch HTML
- React `dangerouslySetInnerHTML` vermeiden
- Content Security Policy Headers (nginx)

### CORS Configuration

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://quiz.example.com"],  # Specific origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

---

## 📚 Weitere Dokumentation

### Projekt-Guidelines

- **[Python Coding Standards](.github/instructions/python.instructions.md)** - Type Hints, Async/Await, Error Handling
- **[TypeScript Guidelines](.github/instructions/typescript-5-es2022.instructions.md)** - ES2022 Features, React Best Practices
- **[Projekt-Spezifikation](.github/instructions/battlenet-project.instructions.md)** - Vollständige technische Spezifikation

### API Dokumentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **WebSocket Events**: [websocket-events.ts](frontend/src/types/websocket-events.ts)

### Datenbank-Schema

- **SQL Schema**: [database/schema.sql](database/schema.sql)
- **ER-Diagramm**: Siehe Spezifikation

---

## 🤝 Contribution Guidelines

1. **Fork** das Repository
2. **Branch** erstellen: `git checkout -b feature/neue-funktion`
3. **Tests** schreiben: pytest + Playwright
4. **Code** commiten: `git commit -m "feat: Neue Funktion"`
5. **Push**: `git push origin feature/neue-funktion`
6. **Pull Request** erstellen mit Beschreibung

### Commit Message Convention

```
feat: Neue Funktion hinzufügen
fix: Bug in Leaderboard behoben
docs: README erweitert
test: E2E Tests für Hotspot
refactor: Code cleanup in api.ts
```

---

## 🐛 Troubleshooting

### Backend startet nicht

```bash
# Python Version prüfen
python --version  # Muss 3.11+ sein

# Dependencies neu installieren
pip install --upgrade -r requirements.txt

# Datenbank-Verbindung testen
psql -U postgres -d battlenet -c "SELECT version();"

# Logs prüfen
tail -f backend/logs/app.log
```

### Frontend Build-Fehler

```bash
# Node Modules neu installieren
rm -rf node_modules package-lock.json
npm install

# Cache leeren
npm cache clean --force

# TypeScript Errors prüfen
npx tsc --noEmit
```

### WebSocket Verbindung schlägt fehl

- CORS Origins konfiguriert? (Backend `.env`)
- Firewall blockiert Port 8000?
- nginx WebSocket Proxy konfiguriert?
- Browser DevTools → Network Tab prüfen

### Datenbank-Probleme

```bash
# Verbindung testen
psql -U postgres -d battlenet

# Schema neu laden
psql -U postgres -d battlenet -f database/schema.sql

# Alle Daten löschen (Vorsicht!)
psql -U postgres -d battlenet -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## 📞 Support & Kontakt

**Issues:** GitHub Issues erstellen mit:

- Fehlerbeschreibung
- Schritte zur Reproduktion
- Environment (OS, Python/Node Version)
- Logs/Screenshots

**Dokumentation:** Siehe `.github/instructions/` für detaillierte Guides

---

## 📝 Lizenz & Status

**Status**: Production-Ready ✅  
**Version**: 1.0.0  
**Letzte Aktualisierung**: 2025-12-29

**Testing Status:**

- Backend: 195 Tests passed, 82% Coverage
- Frontend: E2E Tests für alle Fragetypen
- Deployment: Docker + Traditional Server Ready

---

**Entwickelt als modulare, wartbare und skalierbare Quiz-Plattform mit modernen Web-Technologien.**
