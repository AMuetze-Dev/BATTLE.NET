/**
 * Quiz Editor Page - Create and edit quiz question catalogs
 */
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus, FiTrash2, FiUpload, FiDownload, FiEdit2, FiMenu, FiFile, FiArrowLeft, FiSave, FiImage, FiFolder } from 'react-icons/fi';
import { Trans } from '@lingui/react/macro';
import JSZip from 'jszip';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Card } from '../atoms/Card';
import { Modal } from '../atoms/Modal';
import { Icon } from '../atoms/Icon';
import { Layout } from '../organisms/Layout';
import { api, QuizMetadata } from '../../services/api';
import { colors, spacing } from '../../theme';

interface Answer {
	id: string;
	text: string;
	isCorrect: boolean;
}

interface Question {
	id: string;
	type: 'multiple-choice' | 'true-false' | 'text' | 'buzzer' | 'slider' | 'hotspot' | 'sorting';
	question: string;
	answers: Answer[];
	correctAnswer: number;
	correctAnswerText?: string;
	textInputType?: 'text' | 'number';
	points: number;
	hint?: string;
	imageUrl?: string;
	imageData?: string; // Base64 encoded image for local storage/export
	// Slider-specific fields
	sliderMin?: number;
	sliderMax?: number;
	sliderStep?: number;
	sliderUnit?: string;
	sliderCorrectValue?: number;
	// Hotspot-specific fields
	hotspotX?: number; // 0-100 percentage
	hotspotY?: number; // 0-100 percentage
	hotspotAllowZoom?: boolean;
	// Sorting-specific fields
	sortingItems?: string[]; // Items in correct order
}

interface QuestionCatalog {
	title: string;
	description: string;
	questions: Question[];
}

export const QuizEditorPage: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const quizIdFromUrl = searchParams.get('id');

	const [catalog, setCatalog] = useState<QuestionCatalog>({
		title: 'Neues Quiz',
		description: '',
		questions: [],
	});
	const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
	const [showQuestionModal, setShowQuestionModal] = useState(false);
	const [showLoadModal, setShowLoadModal] = useState(false);
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
			setCatalog({
				title: quiz.title,
				description: quiz.description || '',
				questions: quiz.questions || [],
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

		setSaving(true);
		try {
			const quizData = {
				title: catalog.title,
				description: catalog.description || '',
				questions: catalog.questions,
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
		});
		setSavedQuizId(null);
		setEditingQuestion(null);
		setShowQuestionModal(false);
	};

	const createNewQuestion = (): Question => ({
		id: `q-${Date.now()}`,
		type: 'buzzer',
		question: '',
		answers: [],
		correctAnswer: 0,
		correctAnswerText: '',
		points: 5,
	});

	const addQuestion = () => {
		const newQuestion = createNewQuestion();
		setEditingQuestion(newQuestion);
		setShowQuestionModal(true);
	};

	const saveQuestion = () => {
		if (!editingQuestion) return;

		// Validate slider question
		if (editingQuestion.type === 'slider') {
			const min = editingQuestion.sliderMin ?? 0;
			const max = editingQuestion.sliderMax ?? 100;
			const correctValue = editingQuestion.sliderCorrectValue ?? 50;

			if (min >= max) {
				alert('Fehler: Das Minimum muss kleiner als das Maximum sein.');
				return;
			}

			if (correctValue < min || correctValue > max) {
				alert(`Fehler: Der korrekte Wert (${correctValue}) muss zwischen ${min} und ${max} liegen.`);
				return;
			}
		}

		// Validate hotspot question
		if (editingQuestion.type === 'hotspot') {
			if (!editingQuestion.imageData && !editingQuestion.imageUrl) {
				alert('Fehler: Hotspot-Fragen benötigen ein Bild.');
				return;
			}
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

	const editQuestion = (question: Question) => {
		setEditingQuestion({ ...question });
		setShowQuestionModal(true);
	};

	const deleteQuestion = (questionId: string) => {
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

	const updateQuestionField = (field: keyof Question, value: any) => {
		if (!editingQuestion) return;

		// Wenn der Typ gewechselt wird, initialisiere die entsprechenden Felder
		if (field === 'type') {
			const newQuestion = { ...editingQuestion, [field]: value };

			if (value === 'multiple-choice') {
				newQuestion.answers = [
					{ id: 'a1', text: '', isCorrect: true },
					{ id: 'a2', text: '', isCorrect: false },
					{ id: 'a3', text: '', isCorrect: false },
					{ id: 'a4', text: '', isCorrect: false },
				];
				newQuestion.correctAnswer = 0;
				delete newQuestion.correctAnswerText;
				delete newQuestion.textInputType;
			} else if (value === 'true-false') {
				newQuestion.answers = [];
				newQuestion.correctAnswer = 1; // Standard: Wahr
				delete newQuestion.correctAnswerText;
				delete newQuestion.textInputType;
			} else if (value === 'text') {
				newQuestion.answers = [];
				newQuestion.correctAnswerText = '';
				newQuestion.textInputType = 'text';
				newQuestion.correctAnswer = 0;
			} else if (value === 'buzzer') {
				newQuestion.answers = [];
				newQuestion.correctAnswerText = '';
				newQuestion.correctAnswer = 0;
				delete newQuestion.textInputType;
				delete newQuestion.sliderMin;
				delete newQuestion.sliderMax;
				delete newQuestion.sliderStep;
				delete newQuestion.sliderUnit;
				delete newQuestion.sliderCorrectValue;
				delete newQuestion.hotspotX;
				delete newQuestion.hotspotY;
				delete newQuestion.hotspotAllowZoom;
				delete newQuestion.sortingItems;
			} else if (value === 'slider') {
				newQuestion.answers = [];
				newQuestion.correctAnswer = 0;
				newQuestion.sliderMin = 0;
				newQuestion.sliderMax = 100;
				newQuestion.sliderStep = 1;
				newQuestion.sliderUnit = '';
				newQuestion.sliderCorrectValue = 50;
				delete newQuestion.correctAnswerText;
				delete newQuestion.textInputType;
				delete newQuestion.hotspotX;
				delete newQuestion.hotspotY;
				delete newQuestion.hotspotAllowZoom;
				delete newQuestion.sortingItems;
			} else if (value === 'hotspot') {
				newQuestion.answers = [];
				newQuestion.correctAnswer = 0;
				newQuestion.hotspotX = 50;
				newQuestion.hotspotY = 50;
				newQuestion.hotspotAllowZoom = true;
				delete newQuestion.correctAnswerText;
				delete newQuestion.textInputType;
				delete newQuestion.sliderMin;
				delete newQuestion.sliderMax;
				delete newQuestion.sliderStep;
				delete newQuestion.sliderUnit;
				delete newQuestion.sliderCorrectValue;
				delete newQuestion.sortingItems;
			} else if (value === 'sorting') {
				newQuestion.answers = [];
				newQuestion.correctAnswer = 0;
				newQuestion.sortingItems = ['Element 1', 'Element 2', 'Element 3'];
				delete newQuestion.correctAnswerText;
				delete newQuestion.textInputType;
				delete newQuestion.sliderMin;
				delete newQuestion.sliderMax;
				delete newQuestion.sliderStep;
				delete newQuestion.sliderUnit;
				delete newQuestion.sliderCorrectValue;
				delete newQuestion.hotspotX;
				delete newQuestion.hotspotY;
				delete newQuestion.hotspotAllowZoom;
			}

			setEditingQuestion(newQuestion);
		} else {
			setEditingQuestion({ ...editingQuestion, [field]: value });
		}
	};

	const updateAnswer = (index: number, text: string) => {
		if (!editingQuestion) return;
		const newAnswers = [...editingQuestion.answers];
		newAnswers[index].text = text;
		setEditingQuestion({ ...editingQuestion, answers: newAnswers });
	};

	const setCorrectAnswer = (index: number) => {
		if (!editingQuestion) return;
		const newAnswers = editingQuestion.answers.map((answer, i) => ({
			...answer,
			isCorrect: i === index,
		}));
		setEditingQuestion({ ...editingQuestion, answers: newAnswers, correctAnswer: index });
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
			} else if (question.type === 'text' || question.type === 'buzzer') {
				if (question.correctAnswerText) {
					xmlParts.push(`      <correctAnswer>${escapeXml(question.correctAnswerText)}</correctAnswer>`);
				}
				if (question.textInputType) {
					xmlParts.push(`      <inputType>${question.textInputType}</inputType>`);
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

			const questions: Question[] = [];

			questionElements.forEach((qElement) => {
				const id = qElement.getAttribute('id') || `q-${Date.now()}-${questions.length}`;
				const type = (qElement.querySelector('type')?.textContent || 'buzzer') as Question['type'];
				const question = qElement.querySelector('text')?.textContent || '';
				const points = parseInt(qElement.querySelector('points')?.textContent || '1000');
				const hint = qElement.querySelector('hint')?.textContent || undefined;
				const imageName = qElement.querySelector('image')?.textContent || undefined;
				const imageUrl = qElement.querySelector('imageUrl')?.textContent || undefined;

				const newQuestion: Question = {
					id,
					type,
					question,
					answers: [],
					correctAnswer: 0,
					points,
					hint,
				};

				// Load image if present
				if (imageName && imagesMap.has(imageName)) {
					newQuestion.imageData = imagesMap.get(imageName);
				} else if (imageUrl) {
					newQuestion.imageUrl = imageUrl;
				}

				if (type === 'multiple-choice') {
					const answerElements = qElement.querySelectorAll('answers > answer');
					const answers: Answer[] = [];
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
				} else if (type === 'true-false') {
					const correctAnswer = qElement.querySelector('correctAnswer')?.textContent;
					newQuestion.correctAnswer = correctAnswer === 'true' ? 1 : 0;
				} else if (type === 'text' || type === 'buzzer') {
					const correctAnswerText = qElement.querySelector('correctAnswer')?.textContent || '';
					newQuestion.correctAnswerText = correctAnswerText;

					if (type === 'text') {
						const inputType = qElement.querySelector('inputType')?.textContent as 'text' | 'number';
						newQuestion.textInputType = inputType || 'text';
					}
				} else if (type === 'slider') {
					newQuestion.sliderMin = parseFloat(qElement.querySelector('sliderMin')?.textContent || '0');
					newQuestion.sliderMax = parseFloat(qElement.querySelector('sliderMax')?.textContent || '100');
					newQuestion.sliderStep = parseFloat(qElement.querySelector('sliderStep')?.textContent || '1');
					newQuestion.sliderUnit = qElement.querySelector('sliderUnit')?.textContent || '';
					newQuestion.sliderCorrectValue = parseFloat(qElement.querySelector('correctAnswer')?.textContent || '50');
				} else if (type === 'hotspot') {
					newQuestion.hotspotX = parseFloat(qElement.querySelector('hotspotX')?.textContent || '50');
					newQuestion.hotspotY = parseFloat(qElement.querySelector('hotspotY')?.textContent || '50');
					newQuestion.hotspotAllowZoom = qElement.querySelector('hotspotAllowZoom')?.textContent !== 'false';
				} else if (type === 'sorting') {
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

	return (
		<Layout
			header={
				<HeaderContent>
					<HeaderLeft>
						<Button variant="ghost" size="sm" leftIcon={<FiArrowLeft />} onClick={() => navigate('/')}>
							<Trans id="common.back">Zurück</Trans>
						</Button>
						<Title>
							<Trans id="quizEditor.title">Quiz-Editor</Trans>
						</Title>
					</HeaderLeft>
					<HeaderActions>
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
					</HeaderActions>
				</HeaderContent>
			}
		>
			<Container>
				<CatalogInfo>
					<Input label="Quiz-Titel" value={catalog.title} onChange={(e) => setCatalog({ ...catalog, title: e.target.value })} placeholder="Gib deinem Quiz einen Titel" fullWidth />
					<Input label="Beschreibung" value={catalog.description} onChange={(e) => setCatalog({ ...catalog, description: e.target.value })} placeholder="Beschreibe dein Quiz" fullWidth />
				</CatalogInfo>

				<QuestionsList>
					<ListHeader>
						<h2>
							<Trans id="common.questions">Fragen</Trans> ({catalog.questions.length})
						</h2>
						<Button leftIcon={<FiPlus />} onClick={addQuestion}>
							<Trans id="quizEditor.addQuestion">Frage hinzufügen</Trans>
						</Button>
					</ListHeader>

					{catalog.questions.length === 0 ? (
						<EmptyState>
							<Icon name="clipboard" size="2xl" color="neutral" />
							<EmptyTitle>
								<Trans id="quizEditor.noQuestionsYet">Noch keine Fragen</Trans>
							</EmptyTitle>
							<EmptyText>
								<Trans id="quizEditor.createFirstQuestionHint">Erstelle deine erste Frage, um mit dem Quiz zu beginnen</Trans>
							</EmptyText>
							<Button leftIcon={<FiPlus />} onClick={addQuestion}>
								<Trans id="quizEditor.createFirstQuestion">Erste Frage erstellen</Trans>
							</Button>
						</EmptyState>
					) : (
						<QuestionsTable>
							{catalog.questions.map((question, index) => (
								<QuestionRow key={question.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)}>
									<DragHandle title="Ziehen zum Neu-Sortieren">
										<FiMenu />
									</DragHandle>

									<QuestionNumber>{index + 1}</QuestionNumber>

									<QuestionTypeTag type={question.type}>
										{question.type === 'multiple-choice' && 'MC'}
										{question.type === 'true-false' && 'T/F'}
										{question.type === 'text' && 'Text'}
										{question.type === 'buzzer' && 'Buzzer'}
										{question.type === 'slider' && 'Slider'}
										{question.type === 'hotspot' && 'Hotspot'}
										{question.type === 'sorting' && 'Sort'}
									</QuestionTypeTag>

									<QuestionTextCell onClick={() => editQuestion(question)}>
										<QuestionTextMain>{question.question || <Trans id="quizEditor.untitled">Ohne Titel</Trans>}</QuestionTextMain>
										<QuestionTextSub>
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
										</QuestionTextSub>
									</QuestionTextCell>

									<PointsCell>{question.points}</PointsCell>

									<ActionsCell>
										<IconButton onClick={() => editQuestion(question)} title="Bearbeiten">
											<FiEdit2 />
										</IconButton>
										<IconButton onClick={() => deleteQuestion(question.id)} title="Löschen" danger>
											<FiTrash2 />
										</IconButton>
									</ActionsCell>
								</QuestionRow>
							))}
						</QuestionsTable>
					)}
				</QuestionsList>
			</Container>

			{/* Question Editor Modal */}
			<Modal isOpen={showQuestionModal} onClose={() => setShowQuestionModal(false)} title="Frage bearbeiten" size="lg" closeOnOverlayClick={false}>
				{editingQuestion && (
					<EditorForm>
						<FormRow>
							<FormGroup>
								<label>
									<Trans id="quizEditor.questionType">Fragetyp</Trans>
								</label>
								<select value={editingQuestion.type} onChange={(e) => updateQuestionField('type', e.target.value)}>
									<option value="multiple-choice">Multiple Choice</option>
									<option value="true-false">Wahr/Falsch</option>
									<option value="text">Texteingabe</option>
									<option value="buzzer">Buzzer</option>
									<option value="slider">Slider (Schätzfrage)</option>
									<option value="hotspot">Hotspot (Bildmarkierung)</option>
									<option value="sorting">Sortieraufgabe</option>
								</select>
							</FormGroup>
						</FormRow>

						<FormGroup>
							<Input label="Frage" value={editingQuestion.question} onChange={(e) => updateQuestionField('question', e.target.value)} placeholder="Stelle deine Frage..." fullWidth />
						</FormGroup>

						{/* Image Upload Section */}
						<FormGroup>
							<label>
								<Trans id="quizEditor.imageOptional">Bild (optional)</Trans>
							</label>
							<ImageUploadContainer>
								{editingQuestion.imageData || editingQuestion.imageUrl ? (
									<ImagePreviewContainer>
										<ImagePreview src={editingQuestion.imageData || editingQuestion.imageUrl} alt="Fragebild" />
										<RemoveImageButton
											onClick={() => {
												if (editingQuestion) {
													setEditingQuestion({ ...editingQuestion, imageData: undefined, imageUrl: undefined });
												}
											}}
										>
											<FiTrash2 /> <Trans id="common.remove">Entfernen</Trans>
										</RemoveImageButton>
									</ImagePreviewContainer>
								) : (
									<>
										<ImageDropZone
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
											<ImageUploadLabel>
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
											</ImageUploadLabel>
										</ImageDropZone>
										<div style={{ textAlign: 'center', margin: '8px 0' }}>
											<Trans id="common.or">oder</Trans>
										</div>
										<Input label="" value={editingQuestion.imageUrl || ''} onChange={(e) => updateQuestionField('imageUrl', e.target.value)} placeholder="Bild-URL eingeben..." fullWidth />
									</>
								)}
							</ImageUploadContainer>
						</FormGroup>

						{editingQuestion.type === 'multiple-choice' && (
							<AnswersSection>
								<label>
									<Trans id="quizEditor.answersLabel">Antworten (Wähle die korrekte Antwort)</Trans>
								</label>
								{editingQuestion.answers.map((answer, index) => (
									<AnswerRow key={answer.id} isCorrect={answer.isCorrect}>
										<CorrectRadio type="radio" name="correctAnswer" checked={answer.isCorrect} onChange={() => setCorrectAnswer(index)} title="Als korrekte Antwort markieren" />
										<CorrectLabel isCorrect={answer.isCorrect}>
											{answer.isCorrect ? (
												<>
													<Icon name="check" size="xs" color="success" /> <Trans id="quizEditor.markedCorrect">Korrekt</Trans>
												</>
											) : (
												<Trans id="quizEditor.answerNumber">Antwort {index + 1}</Trans>
											)}
										</CorrectLabel>
										<Input value={answer.text} onChange={(e) => updateAnswer(index, e.target.value)} placeholder={`Antwort ${index + 1}`} fullWidth />
									</AnswerRow>
								))}
							</AnswersSection>
						)}

						{editingQuestion.type === 'true-false' && (
							<FormGroup>
								<label>
									<Trans id="quizEditor.correctAnswer">Korrekte Antwort</Trans>
								</label>
								<TrueFalseOptions>
									<TrueFalseOption selected={editingQuestion.correctAnswer === 1} onClick={() => updateQuestionField('correctAnswer', 1)}>
										<input type="radio" checked={editingQuestion.correctAnswer === 1} readOnly />
										<span>
											<Trans id="quizEditor.trueOption">Wahr (True)</Trans>
										</span>
									</TrueFalseOption>
									<TrueFalseOption selected={editingQuestion.correctAnswer === 0} onClick={() => updateQuestionField('correctAnswer', 0)}>
										<input type="radio" checked={editingQuestion.correctAnswer === 0} readOnly />
										<span>
											<Trans id="quizEditor.falseOption">Falsch (False)</Trans>
										</span>
									</TrueFalseOption>
								</TrueFalseOptions>
							</FormGroup>
						)}

						{editingQuestion.type === 'text' && (
							<>
								<FormGroup>
									<label>
										<Trans id="quizEditor.inputType">Eingabetyp</Trans>
									</label>
									<select value={editingQuestion.textInputType || 'text'} onChange={(e) => updateQuestionField('textInputType', e.target.value)}>
										<option value="text">Text</option>
										<option value="number">
											<Trans id="quizEditor.numbersOnly">Nur Zahlen</Trans>
										</option>
									</select>
								</FormGroup>
								<FormGroup>
									<Input label="Korrekte Antwort" type={editingQuestion.textInputType || 'text'} value={editingQuestion.correctAnswerText || ''} onChange={(e) => updateQuestionField('correctAnswerText', e.target.value)} placeholder="Gib die korrekte Antwort ein..." fullWidth />
								</FormGroup>
							</>
						)}

						{editingQuestion.type === 'buzzer' && (
							<FormGroup>
								<Input label="Korrekte Antwort" value={editingQuestion.correctAnswerText || ''} onChange={(e) => updateQuestionField('correctAnswerText', e.target.value)} placeholder="Gib die korrekte Antwort ein..." fullWidth />
							</FormGroup>
						)}

						{editingQuestion.type === 'slider' && (
							<>
								<FormRow>
									<FormGroup>
										<Input label="Minimum" type="number" value={editingQuestion.sliderMin ?? 0} onChange={(e) => updateQuestionField('sliderMin', parseFloat(e.target.value) || 0)} fullWidth />
									</FormGroup>
									<FormGroup>
										<Input label="Maximum" type="number" value={editingQuestion.sliderMax ?? 100} onChange={(e) => updateQuestionField('sliderMax', parseFloat(e.target.value) || 100)} fullWidth />
									</FormGroup>
								</FormRow>
								<FormRow>
									<FormGroup>
										<Input label="Schrittweite" type="number" value={editingQuestion.sliderStep ?? 1} onChange={(e) => updateQuestionField('sliderStep', parseFloat(e.target.value) || 1)} placeholder="z.B. 0.1, 0.5, 1" fullWidth />
									</FormGroup>
									<FormGroup>
										<Input label="Einheit (optional)" type="text" value={editingQuestion.sliderUnit || ''} onChange={(e) => updateQuestionField('sliderUnit', e.target.value)} placeholder="z.B. km, Jahre, €" fullWidth />
									</FormGroup>
								</FormRow>
								<FormGroup>
									<Input label="Korrekte Antwort" type="number" value={editingQuestion.sliderCorrectValue ?? 50} onChange={(e) => updateQuestionField('sliderCorrectValue', parseFloat(e.target.value) || 0)} fullWidth />
									<SliderPreview>
										<SliderPreviewLabel>Vorschau:</SliderPreviewLabel>
										<SliderPreviewValue>
											{editingQuestion.sliderCorrectValue ?? 50}
											{editingQuestion.sliderUnit ? ` ${editingQuestion.sliderUnit}` : ''}
										</SliderPreviewValue>
										<SliderPreviewRange>
											(von {editingQuestion.sliderMin ?? 0} bis {editingQuestion.sliderMax ?? 100})
										</SliderPreviewRange>
									</SliderPreview>
								</FormGroup>
							</>
						)}

						{editingQuestion.type === 'hotspot' && (
							<>
								{editingQuestion.imageData || editingQuestion.imageUrl ? (
									<FormGroup>
										<label>Korrekte Position markieren (Klicke auf das Bild)</label>
										<HotspotEditorContainer>
											<HotspotImageWrapper>
												<HotspotEditorImage
													src={editingQuestion.imageData || editingQuestion.imageUrl}
													alt="Hotspot Bild"
													onClick={(e) => {
														const rect = e.currentTarget.getBoundingClientRect();
														const x = ((e.clientX - rect.left) / rect.width) * 100;
														const y = ((e.clientY - rect.top) / rect.height) * 100;
														setEditingQuestion({
															...editingQuestion,
															hotspotX: Math.max(0, Math.min(100, x)),
															hotspotY: Math.max(0, Math.min(100, y)),
														});
													}}
												/>
												{editingQuestion.hotspotX !== undefined && editingQuestion.hotspotY !== undefined && (
													<HotspotMarker
														style={{
															left: `${editingQuestion.hotspotX}%`,
															top: `${editingQuestion.hotspotY}%`,
														}}
													/>
												)}
											</HotspotImageWrapper>
										</HotspotEditorContainer>
										<HotspotCoords>
											Position: X = {editingQuestion.hotspotX?.toFixed(1)}%, Y = {editingQuestion.hotspotY?.toFixed(1)}%
										</HotspotCoords>
									</FormGroup>
								) : (
									<FormGroup>
										<HotspotWarning>⚠️ Bitte lade zuerst ein Bild hoch, um die korrekte Position zu markieren.</HotspotWarning>
									</FormGroup>
								)}
								<FormGroup>
									<label>Optionen</label>
									<CheckboxRow>
										<input type="checkbox" checked={editingQuestion.hotspotAllowZoom ?? true} onChange={(e) => updateQuestionField('hotspotAllowZoom', e.target.checked)} id="allowZoom" />
										<label htmlFor="allowZoom">Zoom erlauben (Spieler können das Bild vergrößern)</label>
									</CheckboxRow>
								</FormGroup>
							</>
						)}

						{editingQuestion.type === 'sorting' && (
							<FormGroup>
								<label>Elemente (in korrekter Reihenfolge)</label>
								<SortingItemsContainer>
									{(editingQuestion.sortingItems || []).map((item, index) => (
										<SortingItemRow key={index}>
											<SortingItemNumber>{index + 1}.</SortingItemNumber>
											<Input
												value={item}
												onChange={(e) => {
													const newItems = [...(editingQuestion.sortingItems || [])];
													newItems[index] = e.target.value;
													updateQuestionField('sortingItems', newItems);
												}}
												placeholder={`Element ${index + 1}`}
												fullWidth
											/>
											<IconButton
												onClick={() => {
													const newItems = (editingQuestion.sortingItems || []).filter((_, i) => i !== index);
													updateQuestionField('sortingItems', newItems.length > 0 ? newItems : ['Element 1']);
												}}
												title="Entfernen"
												danger
												disabled={(editingQuestion.sortingItems || []).length <= 2}
											>
												<FiTrash2 />
											</IconButton>
										</SortingItemRow>
									))}
									<Button
										variant="outline"
										size="sm"
										leftIcon={<FiPlus />}
										onClick={() => {
											const newItems = [...(editingQuestion.sortingItems || []), `Element ${(editingQuestion.sortingItems || []).length + 1}`];
											updateQuestionField('sortingItems', newItems);
										}}
									>
										Element hinzufügen
									</Button>
								</SortingItemsContainer>
								<SortingHint>Die Elemente werden den Spielern in zufälliger Reihenfolge angezeigt. Sie müssen sie in die hier definierte korrekte Reihenfolge bringen.</SortingHint>
							</FormGroup>
						)}
						<FormGroup>
							<Input label="Punkte" type="number" value={editingQuestion.points} onChange={(e) => updateQuestionField('points', parseInt(e.target.value))} />
						</FormGroup>

						<FormGroup>
							<Input label="Hinweis (optional)" value={editingQuestion.hint || ''} onChange={(e) => updateQuestionField('hint', e.target.value)} placeholder="Optionaler Hinweis für den Moderator..." fullWidth />
						</FormGroup>

						<ButtonRow>
							<Button variant="outline" onClick={() => setShowQuestionModal(false)}>
								{' '}
								<Trans id="common.cancel">Abbrechen</Trans>
							</Button>
							<Button variant="primary" onClick={saveQuestion}>
								<Trans id="common.save">Speichern</Trans>
							</Button>
						</ButtonRow>
					</EditorForm>
				)}
			</Modal>

			{/* Load Quiz Modal */}
			<Modal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} title="Quiz laden">
				{loadingQuizList ? (
					<LoadingContainer>
						<Trans id="quizEditor.loadingQuizzes">Lade Quizze...</Trans>
					</LoadingContainer>
				) : availableQuizzes.length === 0 ? (
					<EmptyListMessage>
						<Trans id="quizEditor.noSavedQuizzes">Keine gespeicherten Quizze gefunden.</Trans>
					</EmptyListMessage>
				) : (
					<QuizList>
						{availableQuizzes.map((quiz) => (
							<QuizListItem key={quiz.id} onClick={() => loadQuizFromBackend(quiz.id)}>
								<QuizListItemTitle>{quiz.title}</QuizListItemTitle>
								<QuizListItemMeta>
									{quiz.question_count} <Trans id="common.questionsCount">Fragen</Trans> • {new Date(quiz.updated_at).toLocaleDateString('de-DE')}
								</QuizListItemMeta>
							</QuizListItem>
						))}
					</QuizList>
				)}
				<ModalActions>
					<Button variant="outline" onClick={() => setShowLoadModal(false)}>
						<Trans id="common.close">Schließen</Trans>
					</Button>
				</ModalActions>
			</Modal>
		</Layout>
	);
};

// Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: ${spacing.xl};
	display: flex;
	flex-direction: column;
	gap: ${spacing.xl};
`;

const HeaderContent = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: ${spacing.md};
`;

const Title = styled.h1`
	margin: 0;
	font-size: var(--font-size-2xl);
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-primary);
`;

const HeaderLeft = styled.div`
	display: flex;
	gap: ${spacing.md};
	align-items: center;
`;

const HeaderActions = styled.div`
	display: flex;
	gap: ${spacing.sm};
	align-items: center;
`;

const CatalogInfo = styled(Card)`
	padding: ${spacing.lg};
	display: flex;
	flex-direction: column;
	gap: ${spacing.md};
`;

const QuestionsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.md};
`;

const ListHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;

	h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: var(--color-text-primary);
	}
`;

const QuestionsTable = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1px;
	background: var(--color-border);
	border-radius: var(--radius-md);
	overflow: hidden;
`;

const QuestionRow = styled.div`
	display: grid;
	grid-template-columns: 40px 50px 60px 1fr 80px 100px;
	align-items: center;
	gap: var(--spacing-md);
	padding: var(--spacing-md) var(--spacing-lg);
	background: var(--color-surface);
	transition: all 0.2s;
	cursor: grab;

	&:active {
		cursor: grabbing;
	}

	&:hover {
		background: var(--color-surface-hover);
		box-shadow: var(--shadow-xs);
	}
`;

const DragHandle = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--color-text-tertiary);
	font-size: 18px;
	cursor: grab;
	transition: color 0.2s;

	&:hover {
		color: var(--color-text-secondary);
	}

	&:active {
		cursor: grabbing;
	}
`;

const QuestionNumber = styled.div`
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-secondary);
	font-size: var(--font-size-sm);
	text-align: center;
`;

const QuestionTypeTag = styled.div<{ type: string }>`
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-semibold);
	text-transform: uppercase;
	padding: 4px 8px;
	border-radius: var(--radius-sm);
	text-align: center;
	white-space: nowrap;
	background: ${(props) => {
		switch (props.type) {
			case 'multiple-choice':
				return 'var(--color-primary-100)';
			case 'true-false':
				return 'var(--color-primary-100)';
			case 'text':
				return 'var(--color-primary-100)';
			case 'buzzer':
				return 'var(--color-error-100)';
			case 'slider':
				return 'var(--color-success-100)';
			case 'hotspot':
				return 'var(--color-warning-100)';
			case 'sorting':
				return 'var(--color-secondary-100)';
			default:
				return 'var(--color-neutral-100)';
		}
	}};
	color: ${(props) => {
		switch (props.type) {
			case 'multiple-choice':
				return 'var(--color-primary-700)';
			case 'true-false':
				return 'var(--color-primary-700)';
			case 'text':
				return 'var(--color-primary-700)';
			case 'buzzer':
				return 'var(--color-error-700)';
			case 'slider':
				return 'var(--color-success-700)';
			case 'hotspot':
				return 'var(--color-warning-700)';
			case 'sorting':
				return 'var(--color-secondary-700)';
			default:
				return 'var(--color-neutral-700)';
		}
	}};
`;

const QuestionTextCell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
	cursor: pointer;

	&:hover {
		color: var(--color-primary-600);
	}
`;

const QuestionTextMain = styled.div`
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-medium);
	color: var(--color-text-primary);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const QuestionTextSub = styled.div`
	font-size: var(--font-size-xs);
	color: var(--color-primary-600);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const PointsCell = styled.div`
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-secondary);
	text-align: right;

	&::after {
		content: ' Pkt';
		font-weight: var(--font-weight-normal);
		color: var(--color-text-tertiary);
	}
`;

const ActionsCell = styled.div`
	display: flex;
	gap: ${spacing.xs};
	justify-content: flex-end;
`;

const IconButton = styled.button<{ danger?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border: none;
	background: ${(props) => (props.danger ? 'var(--color-error-bg)' : 'var(--color-surface-hover)')};
	color: ${(props) => (props.danger ? 'var(--color-error-500)' : 'var(--color-text-secondary)')};
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition: all 0.2s;
	font-size: 16px;

	&:hover {
		background: ${(props) => (props.danger ? 'var(--color-error-100, #fee2e2)' : 'var(--color-border)')};
		color: ${(props) => (props.danger ? 'var(--color-error-700)' : 'var(--color-text-primary)')};
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
	}
`;

const EmptyState = styled.div`
	text-align: center;
	padding: ${spacing['3xl']} ${spacing.xl};
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${spacing.md};
`;

const EmptyIcon = styled.div`
	font-size: 64px;
	opacity: 0.5;
`;

const EmptyTitle = styled.h3`
	margin: 0;
	font-size: var(--font-size-xl);
	color: var(--color-text-primary);
`;

const EmptyText = styled.p`
	margin: 0;
	color: var(--color-text-secondary);
`;

const EditorForm = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.lg};
`;

const FormRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: ${spacing.md};
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);

	label {
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
	}

	select {
		padding: 10px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		background: var(--color-surface);
		color: var(--color-text-primary);

		&:focus {
			outline: none;
			border-color: var(--color-primary-400);
		}
	}
`;

const AnswersSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.md};
`;

const AnswerRow = styled.div<{ isCorrect?: boolean }>`
	display: flex;
	gap: var(--spacing-sm);
	align-items: center;
	padding: var(--spacing-md);
	border-radius: var(--radius-md);
	background: ${(props) => (props.isCorrect ? 'var(--color-primary-bg)' : 'var(--color-surface-hover)')};
	border: 2px solid ${(props) => (props.isCorrect ? 'var(--color-primary-border)' : 'var(--color-border)')};
	transition: all 0.2s;

	&:hover {
		border-color: ${(props) => (props.isCorrect ? 'var(--color-primary-500)' : 'var(--color-primary-300)')};
	}
`;

const CorrectRadio = styled.input`
	width: 20px;
	height: 20px;
	cursor: pointer;
	accent-color: var(--color-primary-500);
`;

const CorrectLabel = styled.span<{ isCorrect: boolean }>`
	min-width: 100px;
	font-size: var(--font-size-sm);
	font-weight: ${(props) => (props.isCorrect ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)')};
	color: ${(props) => (props.isCorrect ? 'var(--color-primary-700)' : 'var(--color-text-secondary)')};
`;

const TrueFalseOptions = styled.div`
	display: flex;
	gap: ${spacing.md};
`;

const TrueFalseOption = styled.div<{ selected: boolean }>`
	flex: 1;
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
	padding: var(--spacing-md);
	border: 2px solid ${(props) => (props.selected ? 'var(--color-primary-border)' : 'var(--color-border)')};
	background: ${(props) => (props.selected ? 'var(--color-primary-bg)' : 'var(--color-surface)')};
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		border-color: ${(props) => (props.selected ? 'var(--color-primary-500)' : 'var(--color-primary-300)')};
	}

	input {
		width: 20px;
		height: 20px;
		cursor: pointer;
		accent-color: var(--color-primary-500);
	}

	span {
		font-size: var(--font-size-sm);
		font-weight: ${(props) => (props.selected ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)')};
		color: ${(props) => (props.selected ? 'var(--color-primary-700)' : 'var(--color-text-primary)')};
	}
`;

const ButtonRow = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: ${spacing.md};
	margin-top: ${spacing.lg};
`;

// Image Upload Components
const ImageUploadContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.sm};
`;

const ImageDropZone = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--spacing-sm);
	padding: var(--spacing-xl);
	border: 2px dashed var(--color-border);
	border-radius: var(--radius-md);
	background: var(--color-surface-hover);
	color: var(--color-text-secondary);
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		border-color: var(--color-primary-400);
		background: var(--color-primary-bg);
	}
`;

const ImageUploadLabel = styled.label`
	padding: var(--spacing-sm) var(--spacing-md);
	background: var(--color-primary-500);
	color: var(--color-text-inverse);
	border-radius: var(--radius-sm);
	cursor: pointer;
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-medium);
	transition: background 0.2s;

	&:hover {
		background: var(--color-primary-600);
	}
`;

const ImagePreviewContainer = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${spacing.sm};
`;

const ImagePreview = styled.img`
	max-width: 100%;
	max-height: 200px;
	border-radius: var(--radius-md);
	object-fit: contain;
	border: 1px solid var(--color-border);
`;

const RemoveImageButton = styled.button`
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	padding: var(--spacing-sm) var(--spacing-md);
	background: var(--color-error-bg);
	color: var(--color-error-700);
	border: 1px solid var(--color-error-border);
	border-radius: var(--radius-sm);
	cursor: pointer;
	font-size: var(--font-size-sm);
	transition: all 0.2s;

	&:hover {
		background: var(--color-error-100, #fecaca);
	}
`;

// Load Modal Styled Components
const LoadingContainer = styled.div`
	padding: var(--spacing-xl);
	text-align: center;
	color: var(--color-text-secondary);
`;

const EmptyListMessage = styled.div`
	padding: var(--spacing-xl);
	text-align: center;
	color: var(--color-text-secondary);
	font-style: italic;
`;

const QuizList = styled.div`
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
	max-height: 400px;
	overflow-y: auto;
`;

const QuizListItem = styled.div`
	padding: var(--spacing-md);
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: var(--color-primary-bg);
		border-color: var(--color-primary-border);
	}
`;

const QuizListItemTitle = styled.h4`
	margin: 0 0 var(--spacing-xs) 0;
	font-size: var(--font-size-md);
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-primary);
`;

const QuizListItemMeta = styled.span`
	font-size: var(--font-size-sm);
	color: var(--color-text-secondary);
`;

const ModalActions = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-top: var(--spacing-lg);
	padding-top: var(--spacing-md);
	border-top: 1px solid var(--color-border);
`;

// Slider Editor Styles
const SliderPreview = styled.div`
	margin-top: var(--spacing-sm);
	padding: var(--spacing-md);
	background: var(--color-surface-hover);
	border-radius: var(--radius-md);
	display: flex;
	align-items: center;
	gap: var(--spacing-md);
`;

const SliderPreviewLabel = styled.span`
	font-size: var(--font-size-sm);
	color: var(--color-text-secondary);
`;

const SliderPreviewValue = styled.span`
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-semibold);
	color: var(--color-success-600);
`;

const SliderPreviewRange = styled.span`
	font-size: var(--font-size-xs);
	color: var(--color-text-disabled);
`;

// Hotspot Editor Styles
const HotspotEditorContainer = styled.div`
	width: 100%;
	max-height: 400px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--radius-md);
	border: 2px solid var(--color-border);
	background: var(--color-surface-hover);
	overflow: hidden;
`;

const HotspotImageWrapper = styled.div`
	position: relative;
	display: inline-block;
	cursor: crosshair;
`;

const HotspotEditorImage = styled.img`
	max-width: 100%;
	max-height: 396px;
	object-fit: contain;
	display: block;
`;

const HotspotMarker = styled.div`
	position: absolute;
	width: 24px;
	height: 24px;
	background: var(--color-error-500);
	border: 3px solid white;
	border-radius: 50%;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	transform: translate(-50%, -50%);
	pointer-events: none;

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 8px;
		height: 8px;
		background: white;
		border-radius: 50%;
		transform: translate(-50%, -50%);
	}
`;

const HotspotCoords = styled.div`
	margin-top: var(--spacing-sm);
	font-size: var(--font-size-sm);
	color: var(--color-text-secondary);
	text-align: center;
`;

const HotspotWarning = styled.div`
	padding: var(--spacing-lg);
	background: var(--color-warning-bg);
	border: 1px solid var(--color-warning-border);
	border-radius: var(--radius-md);
	color: var(--color-warning-700);
	text-align: center;
`;

const CheckboxRow = styled.div`
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);

	input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	label {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
		cursor: pointer;
	}
`;

// Sorting Editor Styles
const SortingItemsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
	margin-top: var(--spacing-sm);
`;

const SortingItemRow = styled.div`
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
`;

const SortingItemNumber = styled.span`
	width: 24px;
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-secondary);
	text-align: right;
`;

const SortingHint = styled.p`
	margin-top: var(--spacing-md);
	font-size: var(--font-size-sm);
	color: var(--color-text-secondary);
	font-style: italic;
`;
