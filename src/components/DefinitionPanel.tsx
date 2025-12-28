import { useState, useEffect } from 'react';
import { getWordDefinition, generateSummary, removeWordDefinition } from '../utils/api';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { CONFIG } from '../utils/constants';
import './DefinitionPanel.css';

interface DefinitionPanelProps {
  word: string | null;
  summaryMarker: Element | null;
  onClose: () => void;
  onDefinitionFetched?: (word: string) => void;
  onWordUnmarked?: (word: string) => void;
}

export function DefinitionPanel({ word, summaryMarker, onClose, onDefinitionFetched, onWordUnmarked }: DefinitionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<{ type: 'definition' | 'summary'; data: any } | null>(null);
  const isOnline = useOnlineStatus();

  const handleUnmark = () => {
    if (!word || content?.type !== 'definition') return;
    
    // Remove from cache
    removeWordDefinition(word);
    
    // Unmark all instances in the book
    if (onWordUnmarked) {
      onWordUnmarked(word);
    }
    
    // Close the panel
    onClose();
  };

  useEffect(() => {
    if (word) {
      // Check if word is already cached
      const cacheKey = `definition:${word.toLowerCase()}`;
      const cachedDef = localStorage.getItem(cacheKey);
      
      if (cachedDef) {
        // Word is cached, show immediately without loading
        const cached = JSON.parse(cachedDef);
        setContent({
          type: 'definition',
          data: { word, definition: cached.definition, example: cached.example }
        });
        setLoading(false);
        // Mark word as defined
        if (onDefinitionFetched) {
          onDefinitionFetched(word);
        }
        return;
      }
      
      // Word not cached, fetch from API
      setLoading(true);
      getWordDefinition(word, isOnline)
        .then((def) => {
          setContent({ type: 'definition', data: def });
          setLoading(false);
          // Mark word as defined after successful fetch
          if (onDefinitionFetched) {
            onDefinitionFetched(word);
          }
        })
        .catch((err) => {
          setContent({
            type: 'definition',
            data: { word, definition: err.message || 'Failed to load definition' }
          });
          setLoading(false);
        });
    } else if (summaryMarker) {
      setLoading(true);
      const text = getTextBetweenMarkers(summaryMarker);
      if (text && text.length >= 100) {
        generateSummary(text, isOnline)
          .then((summary) => {
            setContent({ type: 'summary', data: { summary } });
            setLoading(false);
          })
          .catch((err) => {
            const textHash = text.substring(0, 100).replace(/\s/g, '').toLowerCase();
            const cacheKey = `summary:${textHash}`;
            const cachedSummary = localStorage.getItem(cacheKey);
            if (cachedSummary) {
              setContent({ type: 'summary', data: { summary: cachedSummary } });
            } else {
              setContent({ type: 'summary', data: { summary: err.message || 'Failed to generate summary' } });
            }
            setLoading(false);
          });
      } else {
        setContent({ type: 'summary', data: { summary: 'Not enough text to summarize' } });
        setLoading(false);
      }
    } else {
      setContent(null);
    }
  }, [word, summaryMarker, isOnline, onDefinitionFetched, onWordUnmarked]);

  if (!word && !summaryMarker) return null;

  return (
    <div className="definition">
      {loading ? (
        <>
          <div className="definition-word">{word || 'Summary'}</div>
          <div className="definition-section">
            <div className="definition-text definition-loading">Loading...</div>
          </div>
        </>
      ) : content ? (
        <>
          <div className="definition-header">
            <div className="definition-word">{content.type === 'definition' ? content.data.word : 'Summary'}</div>
            {content.type === 'definition' && (
              <button 
                className="definition-unmark-btn" 
                onClick={handleUnmark}
                title="Unmark word and remove from cache"
              >
                ✕
              </button>
            )}
          </div>
          <div className="definition-section">
            <div className="definition-text">
              {content.type === 'definition' ? content.data.definition : content.data.summary}
            </div>
          </div>
          {content.type === 'definition' && content.data.example && (
            <div className="definition-section">
              <div className="definition-example">{content.data.example}</div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function getTextBetweenMarkers(currentMarker: Element): string {
  const reader = currentMarker.closest('.reader');
  if (!reader) return '';

  const allMarkers = Array.from(reader.querySelectorAll('.summary-marker'));
  const currentIndex = allMarkers.indexOf(currentMarker);

  if (currentIndex === -1) return '';

  const previousMarker = currentIndex > 0 ? allMarkers[currentIndex - 1] : null;

  const range = document.createRange();

  if (previousMarker) {
    range.setStartAfter(previousMarker);
    range.setEndBefore(currentMarker);
  } else {
    range.setStart(reader, 0);
    range.setEndBefore(currentMarker);
  }

  // Remove any summary marker content from the text
  let text = range.toString().trim();
  // Remove emoji markers (for backwards compatibility)
  text = text.replace(/📝/g, '');
  // Remove any summary marker HTML content that might have been included
  text = text.replace(/\s+/g, ' ');

  return text.substring(0, CONFIG.MAX_SUMMARY_TEXT);
}

