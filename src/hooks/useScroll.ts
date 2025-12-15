import { useState, useEffect, useRef, useCallback } from 'react';
import { CONFIG } from '../utils/constants';
import { saveScrollPosition } from '../utils/storage';

export function useScroll(readerRef: React.RefObject<HTMLDivElement>) {
  const [showBookInfo, setShowBookInfo] = useState(false);
  const [showTopPanel, setShowTopPanel] = useState(false);
  const lastScrollTopRef = useRef<number | null>(null);
  const isPanelShowingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (!readerRef.current) return;

    const scrollTop = readerRef.current.scrollTop || 0;
    
    // Initialize lastScrollTop on first scroll
    if (lastScrollTopRef.current === null) {
      lastScrollTopRef.current = scrollTop;
      return;
    }
    
    // Save scroll position
    saveScrollPosition(scrollTop);

    // Update book info visibility
    setShowBookInfo(scrollTop <= CONFIG.SCROLL_THRESHOLD);

    // Update top panel visibility
    const scrollingUp = scrollTop < lastScrollTopRef.current;
    const scrollingDown = scrollTop > lastScrollTopRef.current;

    if (scrollingUp && scrollTop > CONFIG.SCROLL_THRESHOLD) {
      // Show panel immediately when scrolling up
      setShowTopPanel(true);
      isPanelShowingRef.current = true;
    } else if (scrollingDown) {
      // Hide immediately when scrolling down
      setShowTopPanel(false);
      isPanelShowingRef.current = false;
    } else if (scrollTop <= CONFIG.SCROLL_THRESHOLD) {
      // Hide when near top
      setShowTopPanel(false);
      isPanelShowingRef.current = false;
    }

    lastScrollTopRef.current = scrollTop;
  }, [readerRef]);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;

    // Initialize scroll position
    const initialScrollTop = reader.scrollTop || 0;
    lastScrollTopRef.current = initialScrollTop;

    // Listen to reader scroll events
    reader.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen to window scroll as fallback
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      reader.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [readerRef, handleScroll]);

  return { showBookInfo, showTopPanel };
}

