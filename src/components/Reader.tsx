import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { getScrollPosition, saveScrollPosition } from '../utils/storage';
import './Reader.css';

// Delay before fetching definition to allow adjacent word selection
const DEFINITION_DELAY_MS = 800;

interface ReaderProps {
  content: string;
  onWordClick: (word: string) => void;
  onSummaryClick: (marker: Element) => void;
  onReady?: () => void;
}

export interface ReaderHandle {
  getElement: () => HTMLDivElement | null;
  markWordAsDefined: (word: string) => void;
  unmarkWordAsDefined: (word: string) => void;
  isWordDefined: (word: string) => boolean;
}

export const Reader = forwardRef<ReaderHandle, ReaderProps>(
  ({ content, onWordClick, onSummaryClick, onReady }, ref) => {
    const readerRef = useRef<HTMLDivElement>(null);
    const [isWrapped, setIsWrapped] = useState(false);
    const [isRestored, setIsRestored] = useState(false);
    const definitionTimeoutRef = useRef<number | null>(null);
    const pendingWordsRef = useRef<HTMLElement[]>([]);
    
    // Expose methods and DOM element to parent component
    useImperativeHandle(ref, () => ({
      getElement: () => readerRef.current,
      markWordAsDefined: (word: string) => {
        if (!readerRef.current) return;
        const normalizedWord = word.toLowerCase().trim();
        const allWords = Array.from(readerRef.current.querySelectorAll('.word')) as HTMLElement[];
        allWords.forEach((wordEl) => {
          const wordText = wordEl.textContent?.trim().toLowerCase() || '';
          if (wordText === normalizedWord) {
            wordEl.classList.add('defined');
          }
        });
      },
      unmarkWordAsDefined: (word: string) => {
        if (!readerRef.current) return;
        const normalizedWord = word.toLowerCase().trim();
        const allWords = Array.from(readerRef.current.querySelectorAll('.word')) as HTMLElement[];
        allWords.forEach((wordEl) => {
          const wordText = wordEl.textContent?.trim().toLowerCase() || '';
          if (wordText === normalizedWord) {
            wordEl.classList.remove('defined');
          }
        });
      },
      isWordDefined: (word: string) => {
        if (!readerRef.current) return false;
        const normalizedWord = word.toLowerCase().trim();
        const allWords = Array.from(readerRef.current.querySelectorAll('.word')) as HTMLElement[];
        return allWords.some((wordEl) => {
          const wordText = wordEl.textContent?.trim().toLowerCase() || '';
          return wordText === normalizedWord && wordEl.classList.contains('defined');
        });
      },
    }), []);

    useEffect(() => {
      if (!readerRef.current || isWrapped) return;

      // Wrap words in spans - this can take time for large books
      wrapWordsInSpans(readerRef.current);
      setIsWrapped(true);
      
      // Signal that content is ready after wrapping is complete
      // Use requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Mark all words that have cached definitions
          markCachedWords(readerRef.current!);
          if (onReady) {
            onReady();
          }
        });
      });
    }, [content, isWrapped, onReady]);

    // Restore scroll position after content is loaded and wrapped
    useEffect(() => {
      if (!readerRef.current || !isWrapped || isRestored) return;

      const savedPosition = getScrollPosition();
      if (savedPosition <= 0) {
        setIsRestored(true);
        return;
      }

      const restoreScroll = () => {
        const reader = readerRef.current;
        if (!reader) return;

        // Wait for content to be fully rendered
        if (reader.scrollHeight <= reader.clientHeight) {
          // Content not ready yet, try again
          requestAnimationFrame(restoreScroll);
          return;
        }

        const maxScroll = reader.scrollHeight - reader.clientHeight;
        if (maxScroll >= savedPosition) {
          reader.scrollTop = savedPosition;
          setIsRestored(true);
        } else {
          // Content might still be loading, try a few more times
          let attempts = 0;
          const retry = () => {
            attempts++;
            if (attempts > 20) {
              // Give up after 20 attempts (1 second)
              setIsRestored(true);
              return;
            }
            const newMaxScroll = reader.scrollHeight - reader.clientHeight;
            if (newMaxScroll >= savedPosition) {
              reader.scrollTop = savedPosition;
              setIsRestored(true);
            } else {
              setTimeout(retry, 50);
            }
          };
          setTimeout(retry, 50);
        }
      };

      // Start restoration after a short delay to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreScroll);
      });
    }, [isWrapped, isRestored]);

    // Reset restoration flag when content changes
    useEffect(() => {
      setIsRestored(false);
    }, [content]);

    // Save scroll position on scroll
    useEffect(() => {
      const reader = readerRef.current;
      if (!reader) return;

      const handleScroll = () => {
        if (reader.scrollTop > 0) {
          saveScrollPosition(reader.scrollTop);
        }
      };

      reader.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        reader.removeEventListener('scroll', handleScroll);
      };
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (definitionTimeoutRef.current) {
          clearTimeout(definitionTimeoutRef.current);
        }
      };
    }, []);

    const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;

      // Check if click is on summary marker or any of its children
      const summaryMarker = target.closest('.summary-marker') as HTMLElement;
      if (summaryMarker) {
        e.preventDefault();
        e.stopPropagation();
        onSummaryClick(summaryMarker);
        return;
      }

      if (target.classList.contains('word')) {
        e.preventDefault();
        e.stopPropagation();

        const wordText = target.textContent?.trim() || '';
        const isDefined = target.classList.contains('defined');
        
        // If word is already defined, show definition immediately (no delay)
        if (isDefined) {
          onWordClick(wordText);
          return;
        }

        const wasHighlighted = target.classList.contains('highlighted');
        
        // If word is not highlighted, highlight it first
        if (!wasHighlighted) {
          target.classList.add('highlighted');
        } else {
          // If word is already highlighted, unhighlight it and cancel pending definition
          target.classList.remove('highlighted');
          if (definitionTimeoutRef.current) {
            clearTimeout(definitionTimeoutRef.current);
            definitionTimeoutRef.current = null;
          }
          pendingWordsRef.current = [];
          return;
        }
        
        // Clear any existing timeout
        if (definitionTimeoutRef.current) {
          clearTimeout(definitionTimeoutRef.current);
          definitionTimeoutRef.current = null;
        }
        
        // Now check for adjacent highlighted words (including the one we just highlighted)
        const adjacentWords = getAdjacentHighlightedWords(target);
        
        // Store the words for the delayed definition fetch
        pendingWordsRef.current = adjacentWords;
        
        // Delay fetching definition to allow user to click adjacent words
        definitionTimeoutRef.current = window.setTimeout(() => {
          const wordsToUse = pendingWordsRef.current;
          
          // If there are multiple adjacent highlighted words, combine them into a phrase
          if (wordsToUse.length > 1) {
            const phrase = wordsToUse.map(w => w.textContent?.trim() || '').join(' ').trim();
            // Ensure all words in the phrase are highlighted
            wordsToUse.forEach(w => w.classList.add('highlighted'));
            onWordClick(phrase);
          } else {
            // Single word - get definition for just this word
            const word = wordsToUse[0]?.textContent?.trim() || '';
            onWordClick(word);
          }
          
          // Clear the pending words
          pendingWordsRef.current = [];
          definitionTimeoutRef.current = null;
        }, DEFINITION_DELAY_MS);
      }
    };

    return (
      <div
        ref={readerRef}
        className="reader"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
);

// Mark all words that have cached definitions
function markCachedWords(reader: HTMLElement) {
  const allWords = Array.from(reader.querySelectorAll('.word')) as HTMLElement[];
  const wordSet = new Set<string>();
  
  // Collect all unique words
  allWords.forEach((wordEl) => {
    const wordText = wordEl.textContent?.trim().toLowerCase() || '';
    if (wordText && !isWhitespaceOrPunctuation(wordText)) {
      wordSet.add(wordText);
    }
  });
  
  // Check each word against cache and mark if found
  wordSet.forEach((word) => {
    const cacheKey = `definition:${word}`;
    const cachedDef = localStorage.getItem(cacheKey);
    if (cachedDef) {
      // Mark all instances of this word
      allWords.forEach((wordEl) => {
        const wordText = wordEl.textContent?.trim().toLowerCase() || '';
        if (wordText === word) {
          wordEl.classList.add('defined');
        }
      });
    }
  });
}

function wrapWordsInSpans(element: HTMLElement) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const parent = node.parentNode;
        if (parent && parent instanceof Element && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes: Node[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.textContent?.trim()) {
      textNodes.push(node);
    }
  }

  textNodes.forEach(textNode => {
    const text = textNode.textContent || '';
    if (!text.trim()) return;

    const words = text.split(/(\s+)/);
    const fragment = document.createDocumentFragment();

    words.forEach(word => {
      if (word.trim()) {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        fragment.appendChild(span);
      } else if (word) {
        fragment.appendChild(document.createTextNode(word));
      }
    });

    textNode.parentNode?.replaceChild(fragment, textNode);
  });
}

function getAdjacentHighlightedWords(wordElement: HTMLElement): HTMLElement[] {
  // Start with the clicked word (it should be highlighted at this point)
  const words: HTMLElement[] = [wordElement];
  
  // Verify the clicked word is actually highlighted
  if (!wordElement.classList.contains('highlighted')) {
    wordElement.classList.add('highlighted'); // Fix it
  }
  
  // Find the reader container (could be .reader or a parent)
  const reader = wordElement.closest('.reader') as HTMLElement;
  if (!reader) return words;

  // Get ALL word elements in the entire reader, in document order
  const allWords = Array.from(reader.querySelectorAll('.word')) as HTMLElement[];
  const currentIndex = allWords.indexOf(wordElement);
  
  if (currentIndex === -1) {
    console.warn('Word element not found in reader words list');
    return words;
  }
  

  // Look backwards for highlighted words
  // Skip over whitespace/punctuation-only words to find adjacent highlighted words
  // Also skip duplicate words (same text but different element)
  const seenTexts = new Set<string>();
  seenTexts.add(wordElement.textContent?.trim() || '');
  
  for (let i = currentIndex - 1; i >= 0 && i >= currentIndex - 10; i--) {
    const word = allWords[i];
    const wordText = word.textContent?.trim() || '';
    const isHighlighted = word.classList.contains('highlighted');
    const isWhitespace = isWhitespaceOrPunctuation(wordText);
    const isDuplicate = seenTexts.has(wordText);
    
    if (isDuplicate && !isHighlighted) {
      // Skip duplicate non-highlighted words (they're different instances)
      continue;
    }
    
    if (isHighlighted) {
      // Found a highlighted word - add it and continue looking
      words.unshift(word);
      seenTexts.add(wordText);
      // Continue looking for more highlighted words
    } else if (isWhitespace) {
      // Skip whitespace/punctuation and continue looking
      continue;
    } else {
      // Found a real non-highlighted word - stop looking
      break;
    }
  }

  // Look forwards for highlighted words
  // Skip over whitespace/punctuation-only words to find adjacent highlighted words
  for (let i = currentIndex + 1; i < allWords.length && i <= currentIndex + 10; i++) {
    const word = allWords[i];
    const wordText = word.textContent?.trim() || '';
    const isHighlighted = word.classList.contains('highlighted');
    const isWhitespace = isWhitespaceOrPunctuation(wordText);
    const isDuplicate = seenTexts.has(wordText);
    
    if (isDuplicate && !isHighlighted) {
      // Skip duplicate non-highlighted words (they're different instances)
      continue;
    }
    
    if (isHighlighted) {
      // Found a highlighted word - add it and continue looking
      words.push(word);
      seenTexts.add(wordText);
      // Continue looking for more highlighted words
    } else if (isWhitespace) {
      // Skip whitespace/punctuation and continue looking
      continue;
    } else {
      // Found a real non-highlighted word - stop looking
      break;
    }
  }

  return words;
}

function isWhitespaceOrPunctuation(text: string): boolean {
  // Check if text is only whitespace or punctuation
  if (!text || text.length === 0) return true;
  // Remove all whitespace and punctuation, if nothing remains, it's just whitespace/punctuation
  const cleaned = text.replace(/[\s\p{P}]/gu, '');
  return cleaned.length === 0;
}



