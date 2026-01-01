/**
 * useQuizUpload Hook - Battle.Net Quiz Platform
 * 
 * Custom hook that encapsulates quiz file upload logic.
 * Handles modal state, file selection, upload process, and error handling.
 */

import { useState, useCallback } from 'react';
import { api } from '../services/api';

/** Upload state */
export interface QuizUploadState {
  showUploadModal: boolean;
  uploadFile: File | null;
  uploading: boolean;
  uploadError: string;
}

/** Upload actions */
export interface QuizUploadActions {
  openUploadModal: () => void;
  closeUploadModal: () => void;
  setUploadFile: (file: File | null) => void;
  handleUpload: () => Promise<boolean>;
  clearUploadError: () => void;
}

/** Hook return type */
export interface UseQuizUploadReturn extends QuizUploadState, QuizUploadActions {}

/** Hook options */
export interface UseQuizUploadOptions {
  sessionId: string | undefined;
  moderatorToken: string | null;
  onUploadSuccess?: (questionsCount: number) => void;
}

/**
 * Custom hook for quiz file upload management
 */
export const useQuizUpload = (options: UseQuizUploadOptions): UseQuizUploadReturn => {
  const { sessionId, moderatorToken, onUploadSuccess } = options;

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const openUploadModal = useCallback(() => {
    setShowUploadModal(true);
    setUploadError('');
  }, []);

  const closeUploadModal = useCallback(() => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadError('');
  }, []);

  const clearUploadError = useCallback(() => {
    setUploadError('');
  }, []);

  const handleUpload = useCallback(async (): Promise<boolean> => {
    if (!uploadFile || !sessionId || !moderatorToken) {
      setUploadError('Missing required data for upload');
      return false;
    }

    setUploading(true);
    setUploadError('');

    try {
      const result = await api.sessions.uploadQuestions(sessionId, moderatorToken, uploadFile);
      
      // Notify success
      if (onUploadSuccess) {
        onUploadSuccess(result.questions_count);
      }
      
      // Reset state
      setShowUploadModal(false);
      setUploadFile(null);
      
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(message);
      return false;
    } finally {
      setUploading(false);
    }
  }, [uploadFile, sessionId, moderatorToken, onUploadSuccess]);

  return {
    // State
    showUploadModal,
    uploadFile,
    uploading,
    uploadError,
    
    // Actions
    openUploadModal,
    closeUploadModal,
    setUploadFile,
    handleUpload,
    clearUploadError,
  };
};

export default useQuizUpload;
