# Battle.Net - Implementierungs-Checkliste

## ✅ Abgeschlossen

### Dokumentation & Schema

- [x] Projektspezifikation erstellt (battlenet-project.instructions.md)
- [x] XSD-Schema für alle 8 Fragetypen
- [x] Beispiel-XML mit allen Fragetypen
- [x] TypeScript WebSocket-Event-Interfaces
- [x] PostgreSQL Datenbank-Schema
- [x] README mit Quick Start

### Architektur-Entscheidungen

- [x] Socket.IO für bidirektionale WebSocket-Kommunikation
- [x] Zustand für State Management
- [x] Styled-Components für CSS-in-JS
- [x] LinguiJS für i18n
- [x] Vite als Build-Tool (Migration notwendig)
- [x] nginx als Reverse Proxy

---

## 🔨 Nächste Schritte

### 1. Backend-Implementierung (Python/FastAPI)

#### 1.1 Basis-Setup

- [ ] FastAPI Projekt-Struktur aufsetzen
- [ ] SQLAlchemy Models erstellen (aus schema.sql)
- [ ] Alembic für Migrations einrichten
- [ ] PostgreSQL Connection einrichten
- [ ] Environment Variables (.env)

#### 1.2 REST API Endpoints

- [ ] `POST /api/sessions` - Session erstellen
- [ ] `POST /api/sessions/:id/upload` - ZIP hochladen
- [ ] `GET /api/sessions/:id` - Session-Info abrufen
- [ ] `GET /api/health` - Health Check

#### 1.3 WebSocket (Socket.IO)

- [ ] Socket.IO Server einrichten (python-socketio)
- [ ] Moderator-Events implementieren
- [ ] Spieler-Events implementieren
- [ ] Dashboard-Events implementieren
- [ ] Room-Management (sessionId-basiert)

#### 1.4 Services

- [ ] XML-Validierung gegen XSD
- [ ] ZIP-Extraktion und Validierung
- [ ] Punkte-Berechnung pro Fragetyp
- [ ] Timer-Service (server-authoritative)
- [ ] Buzzer-Service (Zeitstempel-basiert)

#### 1.5 Testing

- [ ] Unit-Tests für Validierung
- [ ] Unit-Tests für Punkteberechnung
- [ ] Integration-Tests für REST-API
- [ ] Integration-Tests für WebSocket

#### Benötigte Pakete

```txt
fastapi==0.115.4
uvicorn[standard]==0.34.0
python-socketio==5.11.4
aiofiles==24.1.0
sqlalchemy==2.0.36
asyncpg==0.30.0
alembic==1.14.0
pydantic==2.10.6
lxml==5.3.0
pytest==8.3.4
pytest-asyncio==0.24.0
pytest-cov==6.0.0
python-dotenv==1.0.1
```

---

### 2. Frontend-Implementierung (React/TypeScript)

#### 2.1 Migration zu Vite

- [ ] Vite installieren und konfigurieren
- [ ] `vite.config.ts` erstellen
- [ ] `index.html` ins Root verschieben
- [ ] `package.json` Scripts anpassen
- [ ] Imports anpassen (kein `%PUBLIC_URL%`)
- [ ] Vitest für Testing einrichten

#### 2.2 Basis-Setup

- [ ] React Router DOM konfigurieren
- [ ] Styled-Components Theme Provider
- [ ] Zustand Store einrichten
- [ ] Socket.IO Client einrichten
- [ ] LinguiJS konfigurieren

#### 2.3 Atomic Design Components

##### Atoms

- [ ] Button
- [ ] Input
- [ ] Label
- [ ] Card
- [ ] Timer
- [ ] LoadingSpinner

##### Molecules

- [ ] InputGroup (Label + Input)
- [ ] QuestionCard
- [ ] PlayerCard
- [ ] ScoreboardRow
- [ ] BuzzerButton

##### Organisms

- [ ] QuestionDisplay (alle 8 Typen)
- [ ] PlayerList
- [ ] Scoreboard
- [ ] ModeratorControls
- [ ] UploadForm
- [ ] LogViewer

#### 2.4 Pages

- [ ] `/moderator/:sessionId` - Moderator-Interface
- [ ] `/player/:sessionId` - Spieler-Interface
- [ ] `/dashboard/:sessionId` - Dashboard-Interface
- [ ] `/create` - Session erstellen (optional)
- [ ] `404` - Not Found

#### 2.5 Hooks

- [ ] `useSocket` - Socket.IO Connection
- [ ] `useSession` - Session-State
- [ ] `usePlayer` - Spieler-State
- [ ] `useTimer` - Timer-Logik
- [ ] `useBuzzer` - Buzzer-Logik

#### 2.6 Context

- [ ] SessionContext - Globale Session-Info
- [ ] WebSocketContext - Socket-Connection
- [ ] ThemeContext - Theme-Provider (Styled-Components)

#### 2.7 Testing

- [ ] Unit-Tests für Atoms
- [ ] Unit-Tests für Molecules
- [ ] Integration-Tests für Pages
- [ ] E2E-Tests (Selenium)

#### Benötigte Pakete

```json
{
	"dependencies": {
		"react": "^19.2.3",
		"react-dom": "^19.2.3",
		"react-router-dom": "^7.11.0",
		"socket.io-client": "^4.8.1",
		"zustand": "^5.0.2",
		"styled-components": "^6.1.13",
		"@lingui/react": "^5.3.0",
		"@lingui/macro": "^5.3.0"
	},
	"devDependencies": {
		"@vitejs/plugin-react": "^4.3.4",
		"vite": "^6.0.7",
		"vitest": "^3.0.5",
		"@testing-library/react": "^16.1.0",
		"@testing-library/jest-dom": "^6.9.1",
		"@lingui/cli": "^5.3.0",
		"@types/styled-components": "^5.1.34"
	}
}
```

---

### 3. Docker & Infrastructure

#### 3.1 Docker

- [ ] Dockerfile für Backend optimieren
- [ ] Dockerfile für Frontend (Multi-Stage Build)
- [ ] docker-compose.yml aktualisieren
  - [ ] PostgreSQL Service
  - [ ] Backend Service
  - [ ] Frontend Service
  - [ ] nginx Service

#### 3.2 nginx

- [ ] nginx.conf für Reverse Proxy
- [ ] WebSocket-Proxy konfigurieren
- [ ] Static Files (Frontend)
- [ ] CORS-Header

#### Beispiel docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: battlenet
      POSTGRES_USER: battlenet
      POSTGRES_PASSWORD: secret
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - postgres-data:/var/lib/postgresql/data

  backend:
    build: ./backend
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://battlenet:secret@postgres:5432/battlenet
      ALLOWED_ORIGINS: http://localhost:3000
    ports:
      - '8000:8000'

  frontend:
    build: ./frontend
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    depends_on:
      - backend
      - frontend
    ports:
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

---

### 4. Storybook

- [ ] Storybook installieren
- [ ] Stories für Atoms
- [ ] Stories für Molecules
- [ ] Stories für Organisms
- [ ] Theme-Switcher für Storybook

```bash
npx storybook@latest init
```

---

### 5. CI/CD (optional)

- [ ] GitHub Actions für Tests
- [ ] Docker Image Build Pipeline
- [ ] Automatisches Deployment

---

## 📝 Reihenfolge der Implementierung

### Phase 1: Grundgerüst (Woche 1-2)

1. Backend-Basis (FastAPI + SQLAlchemy)
2. PostgreSQL Setup
3. Frontend-Migration zu Vite
4. Socket.IO Integration (Backend + Frontend)

### Phase 2: Kern-Features (Woche 3-4)

1. Session-Management (Erstellen, Beitreten)
2. Fragenkatalog-Upload & Validierung
3. Einfacher Fragetyp (Input-Text)
4. Grundlegendes UI (Moderator + Spieler)

### Phase 3: Erweiterte Features (Woche 5-6)

1. Alle 8 Fragetypen
2. Timer-Logik
3. Buzzer-Logik
4. Punkte-System
5. Dashboard

### Phase 4: Polish (Woche 7-8)

1. Storybook
2. E2E-Tests
3. i18n
4. Performance-Optimierung
5. Docker-Optimierung

---

## 🐛 Bekannte Herausforderungen

### Technisch

- [ ] WebSocket-Reconnect bei Verbindungsabbruch
- [ ] Timer-Synchronisation bei hoher Latenz
- [ ] Buzzer-Fairness (Client vs. Server Timestamps)
- [ ] Bildgröße-Optimierung (ZIP-Uploads)
- [ ] Session-Cleanup (alte Sessions löschen)

### UX

- [ ] Responsive Design für alle Bildschirmgrößen
- [ ] Barrierefreiheit (ARIA, Keyboard-Navigation)
- [ ] Fehlerbehandlung & User-Feedback
- [ ] Loading-States

---

## 📚 Dokumentation ToDo

- [ ] API-Dokumentation (FastAPI Auto-Docs)
- [ ] WebSocket-Event-Dokumentation
- [ ] Deployment-Anleitung
- [ ] User-Manual (Moderator-Guide)
- [ ] Entwickler-Onboarding

---

## 🎯 Wichtige Entscheidungen zu treffen

- [ ] Session-Cleanup-Strategie (nach X Tagen?)
- [ ] Max. Spieler pro Session
- [ ] Max. ZIP-Größe für Upload
- [ ] Rate-Limiting für API
- [ ] Caching-Strategie
- [ ] Error-Reporting (Sentry?)
- [ ] Analytics (Posthog?)

---

**Zuletzt aktualisiert**: 2025-12-21
**Status**: Bereit für Implementierung
