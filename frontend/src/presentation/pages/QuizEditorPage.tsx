/**
 * Quiz Editor Page - Create and edit quiz question catalogs
 *
 * This page component orchestrates the quiz editing experience.
 * Individual question type editors are delegated to specialized components.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus, FiTrash2, FiUpload, FiDownload, FiEdit2, FiMenu, FiFile, FiArrowLeft, FiSave, FiImage, FiFolder, FiUsers } from 'react-icons/fi';
import { Trans } from '@lingui/react/macro';
import JSZip from 'jszip';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Modal } from '../atoms/Modal';
import { Icon } from '../atoms/Icon';
import { GameModeSelector as GameModeSelectorComponent, TeamConfigEditor } from '../molecules';
import { Layout } from '../organisms/Layout';
import { createQuestionEditor, getQuestionTypeAbbreviation, getAvailableQuestionTypes } from '../organisms/question-editors/index';
import { api, QuizMetadata } from '../../services/api';
import { validateQuestion, getQuestionAnswerSummary, hasRequiredMedia } from '../../features/quiz-editor/services/question-validation.service';
import { createQuestion, convertQuestionType } from '../../features/quiz-editor/services/question-factory.service';
import { GameMode, TeamConfig, TeamDefinition, createDefaultTeamConfig, createTeamDefinition } from '../../types/team.types';
import type { EditorQuestion, EditorQuestionType, EditorAnswer } from '../../features/quiz-editor/types/editor.types';
import styles from './QuizEditorPage.module.css';

interface QuestionCatalog {
	title: string;
	description: string;
	questions: EditorQuestion[];
	gameMode: GameMode;
	teamConfig: TeamConfig;
}

export const QuizEditorPage: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const quizIdFromUrl = searchParams.get('id');

	const [catalog, setCatalog] = useState<QuestionCatalog>({
		title: 'Neues Quiz',
		description: '',
		questions: [],
		gameMode: 'free-for-all',
		teamConfig: createDefaultTeamConfig(),
	});
	const [editingQuestion, setEditingQuestion] = useState<EditorQuestion | null>(null);
	const [showQuestionModal, setShowQuestionModal] = useState(false);
	const [showLoadModal, setShowLoadModal] = useState(false);
	const [showTeamModal, setShowTeamModal] = useState(false);
	const [savedQuizId, setSavedQuizId] = useState<string | null>(quizIdFromUrl);
	const [saving, setSaving] = useState(false);
	const [loadingQuizList, setLoadingQuizList] = useState(false);
	const [availableQuizzes, setAvailableQuizzes] = useState<QuizMetadata[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const initialLoadDone = useRef(false);

	const loadQuizFromBackend = async (quizId: string, updateUrl: boolean = true) => {
		setShowLoadModal(false);
		try {
			const quiz = await api.quizzes.get(quizId);
			// Normalize teamConfig to ensure required fields exist (TypeScript expects full TeamConfig)
			const normalizedTeamConfig = quiz.teamConfig
				? ({
						...createDefaultTeamConfig(),
						...quiz.teamConfig,
						teams: quiz.teamConfig.teams && quiz.teamConfig.teams.length > 0 ? quiz.teamConfig.teams : createDefaultTeamConfig().teams,
				  } as any)
				: createDefaultTeamConfig();

			setCatalog({
				title: quiz.title,
				description: quiz.description || '',
				questions: (quiz.questions as unknown as EditorQuestion[]) || [],
				gameMode: quiz.gameMode || 'free-for-all',
				teamConfig: normalizedTeamConfig,
			});
			setSavedQuizId(quizId);
			// Update URL with quiz ID only if requested
			if (updateUrl) {
				navigate(`/quiz-editor?id=${encodeURIComponent(quizId)}`, { replace: true });
			}
		} catch (error) {
			console.error('Failed to load quiz:', error);
			alert('Quiz konnte nicht geladen werden.');
		}
	};

	// Load quiz from backend if ID is provided (only on initial mount)
	useEffect(() => {
		if (quizIdFromUrl && !initialLoadDone.current) {
			initialLoadDone.current = true;
			loadQuizFromBackend(quizIdFromUrl, false);
		}
	}, [quizIdFromUrl]);

	// Load quiz list when load modal opens
	useEffect(() => {
		if (showLoadModal) {
			loadQuizList();
		}
	}, [showLoadModal]);

	const loadQuizList = async () => {
		setLoadingQuizList(true);
		try {
			const quizzes = await api.quizzes.list();
			setAvailableQuizzes(quizzes);
		} catch (error) {
			console.error('Failed to load quiz list:', error);
		} finally {
			setLoadingQuizList(false);
		}
	};

	const saveToBackend = async () => {
		if (catalog.questions.length === 0) {
			alert('Bitte fügen Sie mindestens eine Frage hinzu, bevor Sie speichern.');
			return;
		}

		// Validate team config if in team mode
		if (catalog.gameMode === 'team') {
			if (catalog.teamConfig.teams.length < 2) {
				alert('Mindestens 2 Teams erforderlich für den Teammodus.');
				return;
			}
			const emptyTeamNames = catalog.teamConfig.teams.some((t) => !t.name.trim());
			if (emptyTeamNames) {
				alert('Alle Teams benötigen einen Namen.');
				return;
			}
		}

		setSaving(true);
		try {
			const quizData = {
				title: catalog.title,
				description: catalog.description || '',
				questions: catalog.questions,
				gameMode: catalog.gameMode,
				teamConfig: catalog.gameMode === 'team' ? catalog.teamConfig : null,
				quiz_id: savedQuizId || undefined,
			};

			const result = await api.quizzes.save(quizData);
			setSavedQuizId(result.id);

			// Update URL with quiz ID
			if (!savedQuizId) {
				navigate(`/quiz-editor?id=${encodeURIComponent(result.id)}`, { replace: true });
			}

			alert(`Quiz "${catalog.title}" erfolgreich gespeichert!`);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
			console.error('Fehler beim Speichern:', error);
			alert(`Fehler beim Speichern: ${message}`);
		} finally {
			setSaving(false);
		}
	};

	const createNewQuiz = () => {
		const hasContent = catalog.questions.length > 0 || catalog.title !== 'Neues Quiz' || catalog.description !== '';

		if (hasContent) {
			const confirmReset = window.confirm('Möchten Sie wirklich ein neues Quiz erstellen? Das aktuelle Quiz wird zurückgesetzt. Stellen Sie sicher, dass Sie es exportiert oder gespeichert haben, falls Sie es behalten möchten.');

			if (!confirmReset) return;
		}

		setCatalog({
			title: 'Neues Quiz',
			description: '',
			questions: [],
			gameMode: 'free-for-all',
			teamConfig: createDefaultTeamConfig(),
		});
		setSavedQuizId(null);
		setEditingQuestion(null);
		setShowQuestionModal(false);
		setShowTeamModal(false);
	};

	const addQuestion = (): void => {
		const newQuestion = createQuestion('buzzer');
		setEditingQuestion(newQuestion);
		setShowQuestionModal(true);
	};

	const saveQuestion = (): void => {
		if (!editingQuestion) return;

		// Use centralized validation service
		const validation = validateQuestion(editingQuestion);
		if (!validation.isValid) {
			alert(`Fehler: ${validation.errors[0]}`);
			return;
		}

		const questionIndex = catalog.questions.findIndex((q) => q.id === editingQuestion.id);

		if (questionIndex >= 0) {
			const updatedQuestions = [...catalog.questions];
			updatedQuestions[questionIndex] = editingQuestion;
			setCatalog({ ...catalog, questions: updatedQuestions });
		} else {
			setCatalog({ ...catalog, questions: [...catalog.questions, editingQuestion] });
		}

		setShowQuestionModal(false);
		setEditingQuestion(null);
	};

	const editQuestion = (question: EditorQuestion): void => {
		setEditingQuestion({ ...question });
		setShowQuestionModal(true);
	};

	const deleteQuestion = (questionId: string): void => {
		setCatalog({
			...catalog,
			questions: catalog.questions.filter((q) => q.id !== questionId),
		});
	};

	const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', index.toString());
		(e.currentTarget as HTMLDivElement).style.opacity = '0.4';
	};

	const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
		(e.currentTarget as HTMLDivElement).style.opacity = '1';
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
		e.preventDefault();
		const dragIndex = parseInt(e.dataTransfer.getData('text/html'));

		if (dragIndex === dropIndex) return;

		const newQuestions = [...catalog.questions];
		const [draggedItem] = newQuestions.splice(dragIndex, 1);
		newQuestions.splice(dropIndex, 0, draggedItem);

		setCatalog({ ...catalog, questions: newQuestions });
	};

	/**
	 * Update a field on the editing question.
	 * Uses the factory service for type changes to ensure proper initialization.
	 */
	const updateQuestionField = <K extends keyof EditorQuestion>(field: K, value: EditorQuestion[K]): void => {
		if (!editingQuestion) return;

		// When type changes, use the factory service for proper field initialization
		if (field === 'type') {
			const newType = value as EditorQuestionType;
			const convertedQuestion = convertQuestionType(editingQuestion, newType);
			setEditingQuestion(convertedQuestion);
		} else {
			setEditingQuestion({ ...editingQuestion, [field]: value });
		}
	};

	// Team configuration functions
	const toggleGameMode = (mode: GameMode): void => {
		const newTeamConfig = { ...catalog.teamConfig, enabled: mode === 'team' };
		setCatalog({ ...catalog, gameMode: mode, teamConfig: newTeamConfig });
	};

	const addTeam = (): void => {
		const newTeam = createTeamDefinition(catalog.teamConfig.teams.length);
		const updatedTeams = [...catalog.teamConfig.teams, newTeam];
		setCatalog({
			...catalog,
			teamConfig: { ...catalog.teamConfig, teams: updatedTeams },
		});
	};

	const removeTeam = (teamId: string): void => {
		if (catalog.teamConfig.teams.length <= 2) {
			alert('Mindestens 2 Teams erforderlich');
			return;
		}
		const updatedTeams = catalog.teamConfig.teams.filter((t) => t.id !== teamId);
		setCatalog({
			...catalog,
			teamConfig: { ...catalog.teamConfig, teams: updatedTeams },
		});
	};

	const updateTeam = (teamId: string, field: keyof TeamDefinition, value: string): void => {
		const updatedTeams = catalog.teamConfig.teams.map((t) => (t.id === teamId ? { ...t, [field]: value } : t));
		setCatalog({
			...catalog,
			teamConfig: { ...catalog.teamConfig, teams: updatedTeams },
		});
	};

	const exportToBattlenet = async () => {
		const zip = new JSZip();
		const imagesFolder = zip.folder('images');

		// Build XML content parts
		const xmlParts: string[] = [];
		xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
		xmlParts.push('<quiz>');
		xmlParts.push(`  <title>${escapeXml(catalog.title)}</title>`);
		xmlParts.push(`  <description>${escapeXml(catalog.description)}</description>`);
		xmlParts.push('  <questions>');

		catalog.questions.forEach((question, qIndex) => {
			xmlParts.push(`    <question id="${question.id}" number="${qIndex + 1}">`);
			xmlParts.push(`      <type>${question.type}</type>`);
			xmlParts.push(`      <text>${escapeXml(question.question)}</text>`);
			xmlParts.push(`      <points>${question.points}</points>`);

			// Handle image
			if (question.imageUrl || question.imageData) {
				const imageName = `question_${qIndex + 1}.png`;
				xmlParts.push(`      <image>${imageName}</image>`);

				// Add image to ZIP
				if (question.imageData) {
					// Extract base64 data
					const base64Data = question.imageData.split(',')[1] || question.imageData;
					imagesFolder?.file(imageName, base64Data, { base64: true });
				} else if (question.imageUrl) {
					xmlParts.push(`      <imageUrl>${escapeXml(question.imageUrl)}</imageUrl>`);
				}
			}

			if (question.type === 'multiple-choice') {
				xmlParts.push('      <answers>');
				question.answers.forEach((answer, aIndex) => {
					xmlParts.push(`        <answer id="${answer.id}" correct="${answer.isCorrect}" index="${aIndex}">`);
					xmlParts.push(`          <text>${escapeXml(answer.text)}</text>`);
					xmlParts.push('        </answer>');
				});
				xmlParts.push('      </answers>');
				xmlParts.push(`      <correctAnswerIndex>${question.correctAnswer}</correctAnswerIndex>`);
			} else if (question.type === 'true-false') {
				xmlParts.push(`      <correctAnswer>${question.correctAnswer === 1 ? 'true' : 'false'}</correctAnswer>`);
			} else if (question.type === 'text') {
				if (question.correctAnswerText) {
					xmlParts.push(`      <correctAnswer>${escapeXml(question.correctAnswerText)}</correctAnswer>`);
				}
				if (question.textInputType) {
					xmlParts.push(`      <inputType>${question.textInputType}</inputType>`);
				}
			} else if (question.type === 'buzzer') {
				if (question.correctAnswerText) {
					xmlParts.push(`      <correctAnswer>${escapeXml(question.correctAnswerText)}</correctAnswer>`);
				}
			} else if (question.type === 'slider') {
				xmlParts.push(`      <sliderMin>${question.sliderMin ?? 0}</sliderMin>`);
				xmlParts.push(`      <sliderMax>${question.sliderMax ?? 100}</sliderMax>`);
				xmlParts.push(`      <sliderStep>${question.sliderStep ?? 1}</sliderStep>`);
				if (question.sliderUnit) {
					xmlParts.push(`      <sliderUnit>${escapeXml(question.sliderUnit)}</sliderUnit>`);
				}
				xmlParts.push(`      <correctAnswer>${question.sliderCorrectValue ?? 50}</correctAnswer>`);
			} else if (question.type === 'hotspot') {
				xmlParts.push(`      <hotspotX>${question.hotspotX ?? 50}</hotspotX>`);
				xmlParts.push(`      <hotspotY>${question.hotspotY ?? 50}</hotspotY>`);
				xmlParts.push(`      <hotspotAllowZoom>${question.hotspotAllowZoom !== false}</hotspotAllowZoom>`);
			} else if (question.type === 'sorting') {
				xmlParts.push('      <sortingItems>');
				(question.sortingItems || []).forEach((item, index) => {
					xmlParts.push(`        <item index="${index}">${escapeXml(item)}</item>`);
				});
				xmlParts.push('      </sortingItems>');
			}

			if (question.hint) {
				xmlParts.push(`      <hint>${escapeXml(question.hint)}</hint>`);
			}
			xmlParts.push('    </question>');
		});

		xmlParts.push('  </questions>');
		xmlParts.push('</quiz>');

		const xml = xmlParts.join('\n');

		// Add quiz.xml to ZIP
		zip.file('quiz.xml', xml);

		// Generate ZIP file
		const zipBlob = await zip.generateAsync({ type: 'blob' });
		const url = URL.createObjectURL(zipBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${catalog.title.replace(/\s+/g, '_')}.battlenet.zip`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const escapeXml = (unsafe: string): string => {
		return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
	};

	const handleImportClick = () => {
		fileInputRef.current?.click();
	};

	const importFromBattlenet = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			let xmlString: string;
			let imagesMap: Map<string, string> = new Map();

			// Check if it's a ZIP file
			if (file.name.endsWith('.zip') || file.name.endsWith('.battlenet.zip')) {
				const zip = await JSZip.loadAsync(file);

				// Find and read quiz.xml
				const quizXmlFile = zip.file('quiz.xml');
				if (!quizXmlFile) {
					throw new Error('quiz.xml nicht im ZIP gefunden');
				}
				xmlString = await quizXmlFile.async('string');

				// Load images from images folder
				const imagesFolder = zip.folder('images');
				if (imagesFolder) {
					const imageFiles = Object.keys(zip.files).filter((name) => name.startsWith('images/') && !name.endsWith('/'));
					for (const imagePath of imageFiles) {
						const imageFile = zip.file(imagePath);
						if (imageFile) {
							const base64 = await imageFile.async('base64');
							const imageName = imagePath.replace('images/', '');
							imagesMap.set(imageName, `data:image/png;base64,${base64}`);
						}
					}
				}
			} else {
				// Legacy: Plain XML file
				xmlString = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = (e) => resolve(e.target?.result as string);
					reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
					reader.readAsText(file);
				});
			}

			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

			// Prüfe auf Parse-Fehler
			if (xmlDoc.querySelector('parsererror')) {
				throw new Error('Ungültiges XML-Format');
			}

			const title = xmlDoc.querySelector('quiz > title')?.textContent || 'Importiertes Quiz';
			const description = xmlDoc.querySelector('quiz > description')?.textContent || '';
			const questionElements = xmlDoc.querySelectorAll('quiz > questions > question');

			const questions: EditorQuestion[] = [];

			questionElements.forEach((qElement) => {
				const id = qElement.getAttribute('id') || `q-${Date.now()}-${questions.length}`;
				const type = (qElement.querySelector('type')?.textContent || 'buzzer') as EditorQuestionType;
				const questionText = qElement.querySelector('text')?.textContent || '';
				const points = parseInt(qElement.querySelector('points')?.textContent || '1000');
				const hint = qElement.querySelector('hint')?.textContent || undefined;
				const imageName = qElement.querySelector('image')?.textContent || undefined;
				const imageUrl = qElement.querySelector('imageUrl')?.textContent || undefined;

				// Use factory to create base question with correct type
				const newQuestion = createQuestion(type, id);
				newQuestion.question = questionText;
				newQuestion.points = points;
				newQuestion.hint = hint;

				// Load image if present
				if (imageName && imagesMap.has(imageName)) {
					newQuestion.imageData = imagesMap.get(imageName);
				} else if (imageUrl) {
					newQuestion.imageUrl = imageUrl;
				}

				// Parse type-specific fields
				if (newQuestion.type === 'multiple-choice') {
					const answerElements = qElement.querySelectorAll('answers > answer');
					const answers: EditorAnswer[] = [];
					let correctIndex = 0;

					answerElements.forEach((aElement, index) => {
						const answerId = aElement.getAttribute('id') || `a${index + 1}`;
						const text = aElement.querySelector('text')?.textContent || '';
						const isCorrect = aElement.getAttribute('correct') === 'true';

						if (isCorrect) correctIndex = index;

						answers.push({
							id: answerId,
							text,
							isCorrect,
						});
					});

					newQuestion.answers = answers;
					newQuestion.correctAnswer = correctIndex;
				} else if (newQuestion.type === 'true-false') {
					const correctAnswer = qElement.querySelector('correctAnswer')?.textContent;
					newQuestion.correctAnswer = correctAnswer === 'true' ? 1 : 0;
				} else if (newQuestion.type === 'text') {
					const correctAnswerText = qElement.querySelector('correctAnswer')?.textContent || '';
					newQuestion.correctAnswerText = correctAnswerText;
					const inputType = qElement.querySelector('inputType')?.textContent as 'text' | 'number';
					newQuestion.textInputType = inputType || 'text';
				} else if (newQuestion.type === 'buzzer') {
					const correctAnswerText = qElement.querySelector('correctAnswer')?.textContent || '';
					newQuestion.correctAnswerText = correctAnswerText;
				} else if (newQuestion.type === 'slider') {
					newQuestion.sliderMin = parseFloat(qElement.querySelector('sliderMin')?.textContent || '0');
					newQuestion.sliderMax = parseFloat(qElement.querySelector('sliderMax')?.textContent || '100');
					newQuestion.sliderStep = parseFloat(qElement.querySelector('sliderStep')?.textContent || '1');
					newQuestion.sliderUnit = qElement.querySelector('sliderUnit')?.textContent || '';
					newQuestion.sliderCorrectValue = parseFloat(qElement.querySelector('correctAnswer')?.textContent || '50');
				} else if (newQuestion.type === 'hotspot') {
					newQuestion.hotspotX = parseFloat(qElement.querySelector('hotspotX')?.textContent || '50');
					newQuestion.hotspotY = parseFloat(qElement.querySelector('hotspotY')?.textContent || '50');
					newQuestion.hotspotAllowZoom = qElement.querySelector('hotspotAllowZoom')?.textContent !== 'false';
				} else if (newQuestion.type === 'sorting') {
					const itemElements = qElement.querySelectorAll('sortingItems > item');
					const items: string[] = [];
					itemElements.forEach((itemEl) => {
						items.push(itemEl.textContent || '');
					});
					newQuestion.sortingItems = items.length > 0 ? items : ['Element 1', 'Element 2', 'Element 3'];
				}

				questions.push(newQuestion);
			});

			setCatalog({
				title,
				description,
				questions,
				gameMode: 'free-for-all',
				teamConfig: createDefaultTeamConfig(),
			});

			alert(`Quiz "${title}" erfolgreich importiert! (${questions.length} Fragen)`);
		} catch (error: any) {
			console.error('Import-Fehler:', error);
			alert(`Fehler beim Importieren: ${error.message || 'Unbekannter Fehler'}`);
		}

		// Reset input
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	// Helper function to get the appropriate CSS class for question type tag
	const getTypeTagClass = (type: EditorQuestionType): string => {
		switch (type) {
			case 'multiple-choice':
				return styles.typeTagMultipleChoice;
			case 'true-false':
				return styles.typeTagTrueFalse;
			case 'text':
				return styles.typeTagText;
			case 'buzzer':
				return styles.typeTagBuzzer;
			case 'slider':
				return styles.typeTagSlider;
			case 'hotspot':
				return styles.typeTagHotspot;
			case 'sorting':
				return styles.typeTagSorting;
			case 'matching':
				return styles.typeTagMatching;
			case 'image-choice':
				return styles.typeTagImageChoice;
			default:
				return styles.typeTagDefault;
		}
	};

	return (
		<div className={styles.pageContainer}>
			<Layout
				header={
					<div className={styles.header}>
						<div className={styles.headerLeft}>
							<Button variant="ghost" size="sm" leftIcon={<FiArrowLeft />} onClick={() => navigate('/')}>
								<Trans id="common.back">Zurück</Trans>
							</Button>
							<h1 className={styles.title}>
								<Trans id="quizEditor.title">Quiz-Editor</Trans>
							</h1>
						</div>
						<div className={styles.headerActions}>
							<Button variant="outline" size="sm" leftIcon={<FiFile />} onClick={createNewQuiz}>
								<Trans id="quizEditor.newQuiz">Neues Quiz</Trans>
							</Button>
							<Button variant="outline" size="sm" leftIcon={<FiFolder />} onClick={() => setShowLoadModal(true)}>
								<Trans id="common.load">Laden</Trans>
							</Button>
							<Button variant="primary" size="sm" leftIcon={<FiSave />} onClick={saveToBackend} disabled={saving || catalog.questions.length === 0}>
								{saving ? <Trans id="common.saving">Speichern...</Trans> : savedQuizId ? <Trans id="common.update">Aktualisieren</Trans> : <Trans id="common.save">Speichern</Trans>}
							</Button>
							<Button variant="outline" size="sm" leftIcon={<FiDownload />} onClick={exportToBattlenet}>
								<Trans id="common.export">Exportieren</Trans>
							</Button>
							<input ref={fileInputRef} type="file" accept=".battlenet,.battlenet.zip,.zip" onChange={importFromBattlenet} style={{ display: 'none' }} />
							<Button variant="outline" size="sm" leftIcon={<FiUpload />} onClick={handleImportClick}>
								<Trans id="common.import">Importieren</Trans>
							</Button>
						</div>
					</div>
				}
			>
				<div className={styles.container}>
					<div className={styles.catalogInfo}>
						<Input label="Quiz-Titel" value={catalog.title} onChange={(e) => setCatalog({ ...catalog, title: e.target.value })} placeholder="Gib deinem Quiz einen Titel" fullWidth />
						<Input label="Beschreibung" value={catalog.description} onChange={(e) => setCatalog({ ...catalog, description: e.target.value })} placeholder="Beschreibe dein Quiz" fullWidth />
					</div>

					{/* Game Mode Selection */}
					<div className={styles.gameModeSection}>
						<div className={styles.gameModeHeader}>
							<FiUsers size={20} />
							<Trans id="quizEditor.gameMode">Spielmodus</Trans>
						</div>
						<GameModeSelectorComponent value={catalog.gameMode} onChange={toggleGameMode} />

						{/* Team Configuration (only visible in team mode) */}
						{catalog.gameMode === 'team' && <TeamConfigEditor config={catalog.teamConfig} onUpdateTeam={updateTeam} onAddTeam={addTeam} onRemoveTeam={removeTeam} />}
					</div>

					<div className={styles.questionsSection}>
						<div className={styles.questionsHeader}>
							<h2>
								<Trans id="common.questions">Fragen</Trans> ({catalog.questions.length})
							</h2>
							<Button leftIcon={<FiPlus />} onClick={addQuestion}>
								<Trans id="quizEditor.addQuestion">Frage hinzufügen</Trans>
							</Button>
						</div>

						{catalog.questions.length === 0 ? (
							<div className={styles.emptyState}>
								<Icon name="clipboard" size="2xl" color="neutral" />
								<h3 className={styles.emptyTitle}>
									<Trans id="quizEditor.noQuestionsYet">Noch keine Fragen</Trans>
								</h3>
								<p className={styles.emptyText}>
									<Trans id="quizEditor.createFirstQuestionHint">Erstelle deine erste Frage, um mit dem Quiz zu beginnen</Trans>
								</p>
								<Button leftIcon={<FiPlus />} onClick={addQuestion}>
									<Trans id="quizEditor.createFirstQuestion">Erste Frage erstellen</Trans>
								</Button>
							</div>
						) : (
							<div className={styles.questionsTable}>
								{catalog.questions.map((question, index) => (
									<div key={question.id} className={styles.questionRow} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)}>
										<div className={styles.dragHandle} title="Ziehen zum Neu-Sortieren">
											<FiMenu />
										</div>

										<div className={styles.questionNumber}>{index + 1}</div>

										<div className={`${styles.typeTag} ${getTypeTagClass(question.type)}`}>
											{question.type === 'multiple-choice' && 'MC'}
											{question.type === 'true-false' && 'W/F'}
											{question.type === 'text' && 'TXT'}
											{question.type === 'buzzer' && 'BZR'}
											{question.type === 'slider' && 'SLD'}
											{question.type === 'hotspot' && 'HSP'}
											{question.type === 'sorting' && 'SRT'}
											{question.type === 'matching' && 'MTH'}
											{question.type === 'image-choice' && 'IMG'}
										</div>
										<div className={styles.questionTextCell} onClick={() => editQuestion(question)}>
											<div className={styles.questionTextMain}>{question.question || <Trans id="quizEditor.untitled">Ohne Titel</Trans>}</div>
											<div className={styles.questionTextSub}>
												{question.type === 'multiple-choice' && question.answers.length > 0 && (
													<>
														<Icon name="check" size="xs" color="success" /> {question.answers.find((a) => a.isCorrect)?.text || 'Nicht festgelegt'}
													</>
												)}
												{question.type === 'true-false' && (
													<>
														<Icon name="check" size="xs" color="success" /> {question.correctAnswer === 1 ? 'Wahr' : 'Falsch'}
													</>
												)}
												{(question.type === 'text' || question.type === 'buzzer') && question.correctAnswerText && (
													<>
														<Icon name="check" size="xs" color="success" /> {question.correctAnswerText}
													</>
												)}
												{question.type === 'slider' && (
													<>
														<Icon name="check" size="xs" color="success" /> {question.sliderCorrectValue}
														{question.sliderUnit ? ` ${question.sliderUnit}` : ''} ({question.sliderMin}-{question.sliderMax})
													</>
												)}
												{question.type === 'hotspot' && (question.imageData || question.imageUrl) && (
													<>
														<Icon name="check" size="xs" color="success" /> Markierung bei {question.hotspotX?.toFixed(0)}%, {question.hotspotY?.toFixed(0)}%
													</>
												)}
												{question.type === 'hotspot' && !(question.imageData || question.imageUrl) && (
													<>
														<Icon name="alert-triangle" size="xs" color="warning" /> Bild erforderlich
													</>
												)}
												{question.type === 'sorting' && question.sortingItems && (
													<>
														<Icon name="check" size="xs" color="success" /> {question.sortingItems.length} Elemente
													</>
												)}
												{question.type === 'matching' && question.matchingPairs && (
													<>
														<Icon name="check" size="xs" color="success" /> {question.matchingPairs.length} Paare
													</>
												)}
												{question.type === 'image-choice' && question.imageOptions && (
													<>
														<Icon name="check" size="xs" color="success" /> {question.imageOptions.length} Bilder
													</>
												)}
											</div>
										</div>

										<div className={styles.pointsCell}>{question.points}</div>

										<div className={styles.actionsCell}>
											<button className={styles.iconButton} onClick={() => editQuestion(question)} title="Bearbeiten">
												<FiEdit2 />
											</button>
											<button className={`${styles.iconButton} ${styles.iconButtonDanger}`} onClick={() => deleteQuestion(question.id)} title="Löschen">
												<FiTrash2 />
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Question Editor Modal */}
				<Modal isOpen={showQuestionModal} onClose={() => setShowQuestionModal(false)} title="Frage bearbeiten" size="lg" closeOnOverlayClick={false}>
					{editingQuestion && (
						<div className={styles.editorForm}>
							<div className={styles.formRow}>
								<div className={styles.formGroup}>
									<label>
										<Trans id="quizEditor.questionType">Fragetyp</Trans>
									</label>
									<select value={editingQuestion.type} onChange={(e) => updateQuestionField('type', e.target.value as EditorQuestionType)}>
										<option value="multiple-choice">Multiple Choice</option>
										<option value="true-false">Wahr/Falsch</option>
										<option value="text">Texteingabe</option>
										<option value="buzzer">Buzzer</option>
										<option value="slider">Slider (Schätzfrage)</option>
										<option value="hotspot">Hotspot (Bildmarkierung)</option>
										<option value="sorting">Sortieraufgabe</option>
										<option value="matching">Paarzuordnung</option>
										<option value="image-choice">Bildauswahl</option>
									</select>
								</div>
							</div>

							<div className={styles.formGroup}>
								<Input label="Frage" value={editingQuestion.question} onChange={(e) => updateQuestionField('question', e.target.value)} placeholder="Stelle deine Frage..." fullWidth />
							</div>

							{/* Image Upload Section */}
							<div className={styles.formGroup}>
								<label>
									<Trans id="quizEditor.imageOptional">Bild (optional)</Trans>
								</label>
								<div className={styles.imageUploadContainer}>
									{editingQuestion.imageData || editingQuestion.imageUrl ? (
										<div className={styles.imagePreviewContainer}>
											<img className={styles.imagePreview} src={editingQuestion.imageData || editingQuestion.imageUrl} alt="Fragebild" />
											<button
												className={styles.removeImageButton}
												onClick={() => {
													if (editingQuestion) {
														setEditingQuestion({ ...editingQuestion, imageData: undefined, imageUrl: undefined });
													}
												}}
											>
												<FiTrash2 /> <Trans id="common.remove">Entfernen</Trans>
											</button>
										</div>
									) : (
										<>
											<div
												className={styles.imageDropZone}
												onDragOver={(e) => {
													e.preventDefault();
													e.stopPropagation();
												}}
												onDrop={(e) => {
													e.preventDefault();
													e.stopPropagation();
													const file = e.dataTransfer.files[0];
													if (file && file.type.startsWith('image/')) {
														const reader = new FileReader();
														reader.onload = (ev) => {
															updateQuestionField('imageData', ev.target?.result as string);
														};
														reader.readAsDataURL(file);
													}
												}}
											>
												<FiImage size={32} />
												<span>
													<Trans id="quizEditor.dragImageHere">Bild hierher ziehen oder</Trans>
												</span>
												<label className={styles.imageUploadLabel}>
													<input
														type="file"
														accept="image/*"
														style={{ display: 'none' }}
														onChange={(e) => {
															const file = e.target.files?.[0];
															if (file) {
																const reader = new FileReader();
																reader.onload = (ev) => {
																	updateQuestionField('imageData', ev.target?.result as string);
																};
																reader.readAsDataURL(file);
															}
														}}
													/>
													<Trans id="quizEditor.selectFile">Datei auswählen</Trans>
												</label>
											</div>
											<div style={{ textAlign: 'center', margin: '8px 0' }}>
												<Trans id="common.or">oder</Trans>
											</div>
											<Input label="" value={editingQuestion.imageUrl || ''} onChange={(e) => updateQuestionField('imageUrl', e.target.value)} placeholder="Bild-URL eingeben..." fullWidth />
										</>
									)}
								</div>
							</div>

							{/* Audio Upload Section */}
							<div className={styles.formGroup}>
								<label>
									<Trans id="quizEditor.audioOptional">Audio (optional)</Trans>
								</label>
								<div className={styles.audioUploadContainer}>
									{editingQuestion.audioData || editingQuestion.audioUrl ? (
										<div className={styles.audioPreviewContainer}>
											<audio controls src={editingQuestion.audioData || editingQuestion.audioUrl} style={{ width: '100%' }} />
											<button
												className={styles.removeImageButton}
												onClick={() => {
													if (editingQuestion) {
														setEditingQuestion({ ...editingQuestion, audioData: undefined, audioUrl: undefined });
													}
												}}
											>
												<FiTrash2 /> <Trans id="common.remove">Entfernen</Trans>
											</button>
										</div>
									) : (
										<>
											<div
												className={styles.audioDropZone}
												onDragOver={(e) => {
													e.preventDefault();
													e.stopPropagation();
												}}
												onDrop={(e) => {
													e.preventDefault();
													e.stopPropagation();
													const file = e.dataTransfer.files[0];
													if (file && file.type.startsWith('audio/')) {
														const reader = new FileReader();
														reader.onload = (ev) => {
															updateQuestionField('audioData', ev.target?.result as string);
														};
														reader.readAsDataURL(file);
													}
												}}
											>
												🎵
												<span>
													<Trans id="quizEditor.dragAudioHere">Audio hierher ziehen oder</Trans>
												</span>
												<label className={styles.audioUploadLabel}>
													<input
														type="file"
														accept="audio/*"
														style={{ display: 'none' }}
														onChange={(e) => {
															const file = e.target.files?.[0];
															if (file) {
																const reader = new FileReader();
																reader.onload = (ev) => {
																	updateQuestionField('audioData', ev.target?.result as string);
																};
																reader.readAsDataURL(file);
															}
														}}
													/>
													<Trans id="quizEditor.selectFile">Datei auswählen</Trans>
												</label>
											</div>
											<div style={{ textAlign: 'center', margin: '8px 0' }}>
												<Trans id="common.or">oder</Trans>
											</div>
											<Input label="" value={editingQuestion.audioUrl || ''} onChange={(e) => updateQuestionField('audioUrl', e.target.value)} placeholder="Audio-URL eingeben..." fullWidth />
										</>
									)}
								</div>
							</div>

							{/* Type-specific Question Editor */}
							{createQuestionEditor(editingQuestion, updateQuestionField)}

							<div className={styles.formGroup}>
								<Input label="Punkte" type="number" value={editingQuestion.points} onChange={(e) => updateQuestionField('points', parseInt(e.target.value))} />
							</div>

							<div className={styles.formGroup}>
								<Input label="Hinweis (optional)" value={editingQuestion.hint || ''} onChange={(e) => updateQuestionField('hint', e.target.value)} placeholder="Optionaler Hinweis für den Moderator..." fullWidth />
							</div>

							<div className={styles.buttonRow}>
								<Button variant="outline" onClick={() => setShowQuestionModal(false)}>
									{' '}
									<Trans id="common.cancel">Abbrechen</Trans>
								</Button>
								<Button variant="primary" onClick={saveQuestion}>
									<Trans id="common.save">Speichern</Trans>
								</Button>
							</div>
						</div>
					)}
				</Modal>

				{/* Load Quiz Modal */}
				<Modal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} title="Quiz laden">
					{loadingQuizList ? (
						<div className={styles.loadingContainer}>
							<Trans id="quizEditor.loadingQuizzes">Lade Quizze...</Trans>
						</div>
					) : availableQuizzes.length === 0 ? (
						<div className={styles.emptyListMessage}>
							<Trans id="quizEditor.noSavedQuizzes">Keine gespeicherten Quizze gefunden.</Trans>
						</div>
					) : (
						<div className={styles.quizList}>
							{availableQuizzes.map((quiz) => (
								<div className={styles.quizListItem} key={quiz.id} onClick={() => loadQuizFromBackend(quiz.id)}>
									<h4 className={styles.quizListItemTitle}>{quiz.title}</h4>
									<span className={styles.quizListItemMeta}>
										{quiz.question_count} <Trans id="common.questionsCount">Fragen</Trans> • {new Date(quiz.updated_at).toLocaleDateString('de-DE')}
									</span>
								</div>
							))}
						</div>
					)}
					<div className={styles.modalActions}>
						<Button variant="outline" onClick={() => setShowLoadModal(false)}>
							<Trans id="common.close">Schließen</Trans>
						</Button>
					</div>
				</Modal>
			</Layout>
		</div>
	);
};
