/**
 * useMediaPreloader Hook - Battle.Net Quiz Platform
 * 
 * Preloads all images and audio files after joining a session
 * to minimize delays between questions.
 */

import { useState, useEffect, useCallback } from 'react';

export interface MediaPreloadProgress {
  total: number;
  loaded: number;
  failed: number;
  percentage: number;
  isComplete: boolean;
}

/**
 * Extracts all media URLs from session questions
 */
const extractMediaUrls = (questions: any[]): { images: string[], audio: string[] } => {
  const images = new Set<string>();
  const audio = new Set<string>();

  questions.forEach(question => {
    // Question image
    if (question.image) images.add(question.image);
    if (question.imageData) images.add(question.imageData);
    if (question.imageUrl) images.add(question.imageUrl);

    // Image choice options
    if (question.imageOptions && Array.isArray(question.imageOptions)) {
      question.imageOptions.forEach((opt: any) => {
        if (opt.imageUrl) images.add(opt.imageUrl);
        if (opt.imageData) images.add(opt.imageData);
      });
    }

    // Audio
    if (question.audioUrl) audio.add(question.audioUrl);
    if (question.audioData) audio.add(question.audioData);
  });

  return {
    images: Array.from(images),
    audio: Array.from(audio)
  };
};

/**
 * Preloads an image
 */
const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * Preloads an audio file
 */
const preloadAudio = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => resolve();
    audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
    audio.src = url;
    audio.load();
  });
};

/**
 * Hook for preloading media files
 */
export const useMediaPreloader = (questions: any[], enabled: boolean = true) => {
  const [progress, setProgress] = useState<MediaPreloadProgress>({
    total: 0,
    loaded: 0,
    failed: 0,
    percentage: 0,
    isComplete: false
  });

  const preloadAll = useCallback(async () => {
    if (!enabled || !questions || questions.length === 0) {
      setProgress({
        total: 0,
        loaded: 0,
        failed: 0,
        percentage: 100,
        isComplete: true
      });
      return;
    }

    const { images, audio } = extractMediaUrls(questions);
    const allMedia = [...images, ...audio];
    const total = allMedia.length;

    if (total === 0) {
      setProgress({
        total: 0,
        loaded: 0,
        failed: 0,
        percentage: 100,
        isComplete: true
      });
      return;
    }

    setProgress({
      total,
      loaded: 0,
      failed: 0,
      percentage: 0,
      isComplete: false
    });

    let loaded = 0;
    let failed = 0;

    // Preload all media in parallel
    const promises = allMedia.map(async (url, index) => {
      try {
        if (index < images.length) {
          await preloadImage(url);
        } else {
          await preloadAudio(url);
        }
        loaded++;
      } catch (error) {
        console.warn(`Failed to preload media: ${url}`, error);
        failed++;
      } finally {
        // Update progress
        const currentLoaded = loaded;
        const currentFailed = failed;
        const percentage = Math.round(((currentLoaded + currentFailed) / total) * 100);
        
        setProgress({
          total,
          loaded: currentLoaded,
          failed: currentFailed,
          percentage,
          isComplete: (currentLoaded + currentFailed) >= total
        });
      }
    });

    await Promise.allSettled(promises);

    // Final update
    setProgress(prev => ({
      ...prev,
      isComplete: true
    }));
  }, [questions, enabled]);

  useEffect(() => {
    preloadAll();
  }, [preloadAll]);

  return progress;
};

export default useMediaPreloader;
