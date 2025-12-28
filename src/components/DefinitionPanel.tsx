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
                title="Remove word from cache and unmark all instances"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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

