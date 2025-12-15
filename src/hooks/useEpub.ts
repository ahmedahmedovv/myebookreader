import { useState, useCallback } from 'react';
import { loadEpubContent } from '../utils/epub';
import { saveEpubFile, loadEpubFile, getEpubMetadata } from '../utils/storage';
import type { EpubContent, EpubMetadata } from '../types';

export function useEpub() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<EpubContent | null>(null);
  const [metadata, setMetadata] = useState<EpubMetadata | null>(null);

  const loadFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      await saveEpubFile(file);
      const epubContent = await loadEpubContent(file);
      setContent(epubContent);
      setMetadata({
        fileName: file.name,
        fileSize: file.size,
        lastModified: file.lastModified,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error reading EPUB';
      setError(errorMessage);
      console.error('EPUB Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSavedEpub = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const savedFile = await loadEpubFile();
      const savedMetadata = getEpubMetadata();
      
      if (savedFile && savedMetadata) {
        const epubContent = await loadEpubContent(savedFile);
        setContent(epubContent);
        setMetadata(savedMetadata);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading saved EPUB';
      setError(errorMessage);
      console.error('Failed to load saved EPUB:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    content,
    metadata,
    loadFile,
    loadSavedEpub,
    clearError,
  };
}

