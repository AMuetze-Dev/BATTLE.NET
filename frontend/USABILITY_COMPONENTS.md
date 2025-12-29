# Usability Components Documentation

## Overview

Diese Komponenten verbessern die User Experience (UX) durch klares Feedback, intuitive Ladeanimationen und hilfreiche Dialoge.

---

## 🎯 Toast Notifications

**Zweck**: User-Feedback für Aktionen (Erfolg, Fehler, Warnung, Info)

### Installation

```tsx
import { ToastProvider, useToast } from './components';

// Wrap App with ToastProvider
<ToastProvider>
	<App />
</ToastProvider>;
```

### Verwendung

```tsx
import { useToast } from './components';

function MyComponent() {
	const toast = useToast();

	const handleSuccess = () => {
		toast.success('Session successfully created!');
	};

	const handleError = () => {
		toast.error('Failed to join session', 8000); // 8 seconds
	};

	const handleWarning = () => {
		toast.warning('Connection unstable');
	};

	const handleInfo = () => {
		toast.info('New player joined the session');
	};

	return <button onClick={handleSuccess}>Create Session</button>;
}
```

### API

```tsx
interface ToastContextValue {
	showToast(message: string, type?: ToastType, duration?: number): void;
	success(message: string, duration?: number): void;
	error(message: string, duration?: number): void;
	warning(message: string, duration?: number): void;
	info(message: string, duration?: number): void;
}
```

**Features**:

- ✅ Auto-dismiss (configurable duration)
- ✅ Stacking (multiple toasts)
- ✅ Accessibility (ARIA labels, role="alert")
- ✅ Responsive (mobile-friendly)
- ✅ Close button
- ✅ Color-coded by severity

---

## ⏳ Loading States

### Spinner

**Zweck**: Inline loading indicator

```tsx
import { Spinner } from './components';

<Spinner size="md" variant="primary" label="Loading data..." />;
```

**Props**:

- `size`: `'sm' | 'md' | 'lg' | 'xl'`
- `variant`: `'primary' | 'white' | 'neutral'`
- `label`: Accessibility label (screen readers)

### Loading Overlay

**Zweck**: Full-page loading indicator

```tsx
import { LoadingOverlay } from './components';

{
	isLoading && <LoadingOverlay message="Loading session..." />;
}
```

### Skeleton Loader

**Zweck**: Content placeholders während des Ladens

```tsx
import { Skeleton } from './components';

<Skeleton width="100%" height="20px" variant="text" animation="pulse" />
<Skeleton width="60px" height="60px" variant="circular" animation="wave" />
<Skeleton width="300px" height="200px" variant="rectangular" />
```

**Props**:

- `variant`: `'text' | 'circular' | 'rectangular'`
- `animation`: `'pulse' | 'wave' | 'none'`

### Inline Loader

**Zweck**: Kleiner Loader für Buttons/Text

```tsx
import { InlineLoader } from './components';

<span>
	Processing <InlineLoader size="sm" />
</span>;
```

---

## 📊 Progress Indicators

### Progress Bar

**Zweck**: Linearer Fortschrittsbalken

```tsx
import { ProgressBar } from './components';

<ProgressBar current={7} total={10} label="Questions answered" showPercentage variant="success" size="md" />;
```

**Props**:

- `current`: Aktueller Wert
- `total`: Maximalwert
- `label`: Beschreibung (optional)
- `showPercentage`: Zeige Prozent (optional)
- `variant`: `'default' | 'success' | 'warning' | 'danger'`
- `size`: `'sm' | 'md' | 'lg'`

### Step Progress

**Zweck**: Multi-Step-Prozess-Anzeige

```tsx
import { StepProgress } from './components';

const steps = [
	{ id: '1', label: 'Upload Questions', description: 'Select quiz file' },
	{ id: '2', label: 'Configure Session', description: 'Set time limits' },
	{ id: '3', label: 'Start Quiz', description: 'Begin the session' },
];

<StepProgress steps={steps} currentStep={1} />;
```

### Circular Progress

**Zweck**: Kreisförmiger Fortschrittsindikator

```tsx
import { CircularProgress } from './components';

<CircularProgress percentage={75} size={120} strokeWidth={8} color="#5b76f1" label="75%" />;
```

---

## ⚠️ Confirmation Dialog

**Zweck**: Bestätigung für kritische Aktionen

```tsx
import { ConfirmDialog } from './components';
import { useState } from 'react';

function MyComponent() {
	const [showDialog, setShowDialog] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleDelete = async () => {
		setIsLoading(true);
		await deleteSession();
		setIsLoading(false);
		setShowDialog(false);
	};

	return (
		<>
			<button onClick={() => setShowDialog(true)}>Delete Session</button>

			<ConfirmDialog isOpen={showDialog} onClose={() => setShowDialog(false)} onConfirm={handleDelete} title="Delete Session" message="Are you sure you want to delete this session? This action cannot be undone." confirmText="Delete" cancelText="Cancel" variant="danger" isLoading={isLoading} />
		</>
	);
}
```

**Props**:

- `variant`: `'danger' | 'warning' | 'info'`
- `isLoading`: Zeige Loading-State im Confirm-Button

---

## 🔍 Empty State

**Zweck**: Anzeige wenn keine Daten vorhanden

```tsx
import { EmptyState } from './components';
import { FiInbox } from 'react-icons/fi';

<EmptyState icon={<FiInbox />} title="No sessions yet" description="Create your first quiz session to get started" actionLabel="Create Session" onAction={() => navigate('/create')} />;
```

**Use Cases**:

- Keine Suchergebnisse
- Leere Listen
- Fehlerseiten (404)
- Onboarding

---

## 💡 Tooltip

**Zweck**: Kontextuelle Hilfe bei Hover

```tsx
import { Tooltip } from './components';

<Tooltip content="This will delete the session permanently" placement="top">
	<button>Delete</button>
</Tooltip>;
```

**Props**:

- `placement`: `'top' | 'bottom' | 'left' | 'right'`
- `delay`: Verzögerung in ms (default: 200)

**Features**:

- ✅ Auto-positioning
- ✅ Arrow indicator
- ✅ Keyboard accessible (focus/blur)
- ✅ Responsive

---

## 🎨 Best Practices

### Feedback Timing

```tsx
// ✅ Gut: Immediate feedback
toast.success('Session created!');

// ❌ Schlecht: No feedback
await createSession();
```

### Loading States

```tsx
// ✅ Gut: Show loading during async operations
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
	setIsLoading(true);
	try {
		await api.createSession();
		toast.success('Success!');
	} catch (error) {
		toast.error('Failed');
	} finally {
		setIsLoading(false);
	}
};

// ❌ Schlecht: No loading indicator
const handleSubmit = async () => {
	await api.createSession();
};
```

### Progress Indicators

```tsx
// ✅ Gut: Show progress for multi-step processes
<ProgressBar current={currentQuestion} total={totalQuestions} />;

// ✅ Gut: Use skeleton for content loading
{
	isLoading ? <Skeleton width="100%" height="200px" /> : <QuestionCard data={question} />;
}
```

### Confirmation Dialogs

```tsx
// ✅ Gut: Confirm destructive actions
<ConfirmDialog
  variant="danger"
  message="This cannot be undone"
/>

// ❌ Schlecht: No confirmation for deletion
<button onClick={deleteSession}>Delete</button>
```

---

## 📱 Responsive Design

Alle Komponenten sind mobile-optimiert:

- **Toast**: Stacks vertically, volle Breite auf mobil
- **Loading**: Overlay zentriert auf allen Screens
- **Progress**: Skaliert mit Container
- **Tooltip**: Auto-Repositioning bei Platzmangel
- **Empty State**: Responsive Padding und Font-Sizes

---

## ♿ Accessibility

Alle Komponenten folgen WCAG 2.1 Level AA:

- ✅ **ARIA labels**: Screen reader support
- ✅ **Keyboard navigation**: Tab, Enter, ESC
- ✅ **Focus management**: Visible focus states
- ✅ **Color contrast**: 4.5:1 minimum
- ✅ **Role attributes**: Semantic HTML

---

## 🚀 Performance

- **React.memo**: Alle Komponenten memoized
- **useCallback**: Optimierte Event-Handler
- **CSS Animations**: Hardware-accelerated
- **Conditional Rendering**: Nur wenn benötigt
- **Portal Rendering**: Toasts außerhalb DOM-Hierarchie

---

## 📦 Bundle Size

| Component     | Size (gzipped) |
| ------------- | -------------- |
| Toast         | ~2.5 KB        |
| Loading       | ~1.8 KB        |
| Progress      | ~2.2 KB        |
| ConfirmDialog | ~1.5 KB        |
| EmptyState    | ~1.0 KB        |
| Tooltip       | ~1.8 KB        |
| **Total**     | **~11 KB**     |

---

## 🔧 Customization

### Theme Integration

Alle Komponenten verwenden das zentrale Theme:

```tsx
import { colors, spacing, borderRadius } from '../theme';
```

### Custom Variants

```tsx
// Erweitere Toast mit custom variant
const StyledToast = styled(ToastItem)`
	&[data-variant='premium'] {
		background: linear-gradient(135deg, gold, orange);
	}
`;
```

---

## 🧪 Testing

Alle Komponenten sind testbar:

```tsx
import { render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './components';

test('shows success toast', () => {
	const TestComponent = () => {
		const toast = useToast();
		return <button onClick={() => toast.success('Test')}>Show</button>;
	};

	render(
		<ToastProvider>
			<TestComponent />
		</ToastProvider>
	);

	fireEvent.click(screen.getByText('Show'));
	expect(screen.getByText('Test')).toBeInTheDocument();
});
```

---

## 📚 Examples

Siehe `/examples` Ordner für:

- Quiz-Flow mit Progress
- Session-Management mit Toasts
- Player-Liste mit Empty State
- Settings mit Tooltips

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: Battle.Net Team
