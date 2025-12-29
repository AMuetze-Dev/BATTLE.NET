# Battle.Net Quiz Platform - Frontend

Modern React-based frontend for the Battle.Net Quiz Platform with real-time WebSocket integration.

## 🚀 Features

### Core Functionality

- ✅ **Session Management**: Create and join quiz sessions
- ✅ **Real-time Updates**: WebSocket integration with Socket.IO
- ✅ **8 Question Types**:
  - Input Text
  - Input Number
  - Slider
  - Multiple Choice
  - Buzzer
  - Image
  - Hotspot
  - Sorting
- ✅ **Live Leaderboard**: Real-time ranking with animations
- ✅ **File Upload**: Drag & drop question catalog upload
- ✅ **Responsive Design**: Mobile-friendly UI

### Architecture

- **Atomic Design Pattern**: Atoms → Molecules → Organisms → Pages
- **TypeScript**: Full type safety
- **styled-components**: CSS-in-JS styling
- **React Router**: Client-side routing
- **Socket.IO Client**: Real-time bidirectional communication

## 📁 Project Structure

```
src/
├── presentation/
│   ├── atoms/           # Basic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── molecules/       # Composite components
│   │   ├── Leaderboard.tsx
│   │   └── FileUpload.tsx
│   ├── organisms/       # Complex components
│   │   ├── Layout.tsx
│   │   └── QuestionDisplay.tsx
│   └── pages/           # Full pages
│       ├── HomePage.tsx
│       ├── ModeratorSessionPage.tsx
│       └── PlayerSessionPage.tsx
├── services/            # API & WebSocket clients
│   ├── api.ts
│   └── websocket.ts
├── hooks/               # Custom React hooks
│   └── useWebSocket.ts
├── theme.ts             # Design system
├── config.ts            # Configuration
├── App.tsx              # Main app component
└── index.tsx            # Entry point
```

## 🛠️ Installation

```bash
npm install
```

## 🚦 Development

### Start Development Server

```bash
npm start
```

Runs on [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=http://localhost:8000
```

## 🧪 Testing

### Unit & Integration Tests

```bash
npm test
```

### E2E Tests with Playwright

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### E2E Test Coverage

- ✅ Session creation and joining
- ✅ Player management
- ✅ Question display and interaction
- ✅ Leaderboard updates
- ✅ File upload UI
- ✅ Connection status indicators
- ✅ All 8 question types

## 📦 Build

```bash
npm run build
```

Creates optimized production build in `build/` directory.

## 🎨 Design System

### Colors

- **Primary**: Blue gradient (`#0070f3`)
- **Secondary**: Purple (`#7928ca`)
- **Success**: Green (`#0a0`)
- **Warning**: Orange (`#fa0`)
- **Error**: Red (`#e00`)

### Typography

- **Font**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI)
- **Sizes**: sm (14px) → 5xl (48px)
- **Weights**: 400 (normal) → 700 (bold)

### Spacing

- Based on 4px scale: xs (4px) → 3xl (48px)

## 🔌 API Integration

### REST API (api.ts)

```typescript
import { api } from './services/api';

// Create session
const session = await api.sessions.create();

// Join as player
const player = await api.players.create(sessionId, playerName);

// Get leaderboard
const leaderboard = await api.sessions.getLeaderboard(sessionId);
```

### WebSocket (useWebSocket.ts)

```typescript
import { useWebSocket } from './hooks/useWebSocket';

const { joinSession, isConnected } = useWebSocket({
	onPlayerJoined: (data) => console.log('Player joined', data),
	onQuestionStarted: (data) => console.log('Question started', data),
	onLeaderboardUpdated: (data) => console.log('Leaderboard updated', data),
});

// Join session
joinSession(sessionId, playerId, playerName);
```

## 📄 Components

### Atoms

- **Button**: 5 variants, 3 sizes, loading state
- **Input**: Labels, errors, icons, full validation
- **Card**: 3 variants (default/outlined/elevated)
- **Modal**: Responsive, keyboard support

### Molecules

- **Leaderboard**: Ranked list with medals, stats, animations
- **FileUpload**: Drag-drop, validation, progress

### Organisms

- **QuestionDisplay**: Handles all 8 question types
- **Layout**: Header/Main/Footer structure

### Pages

- **HomePage**: Landing with create/join session
- **ModeratorSessionPage**: Manage quiz, upload questions, view players
- **PlayerSessionPage**: Participate in quiz, see leaderboard

## 🚢 Deployment

### Docker

```bash
docker build -t battlenet-quiz-frontend .
docker run -p 3000:80 battlenet-quiz-frontend
```

### Nginx

Serve `build/` directory with:

```nginx
location / {
  try_files $uri /index.html;
}
```

## 🔧 Configuration

### config.ts

```typescript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8000';

export const APP_CONFIG = {
	sessionCodeLength: 6,
	maxPlayerNameLength: 50,
	defaultQuestionTimeout: 30,
	reconnectAttempts: 5,
	reconnectDelay: 3000,
};
```

## 📊 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Follow Atomic Design structure
2. Use TypeScript for type safety
3. Follow styled-components naming conventions
4. Write E2E tests for new features
5. Maintain design system consistency

## 📝 License

MIT

## 🔗 Related

- [Backend API Documentation](../backend/README.md)
- [WebSocket Events Documentation](../docs/websocket-events.md)
- [Question Catalog Format](../docs/question-catalog.md)
