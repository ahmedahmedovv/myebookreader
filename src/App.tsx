import { useState, useEffect, useRef } from 'react';
import { useEpub } from './hooks/useEpub';
import { useScroll } from './hooks/useScroll';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InstallPrompt } from './components/InstallPrompt';
import { BookInfo } from './components/BookInfo';
import { TopPanel } from './components/TopPanel';
import { Reader } from './components/Reader';
import { DefinitionPanel } from './components/DefinitionPanel';
import { LoadingScreen } from './components/LoadingScreen';
import { WelcomeGuide, type WelcomeGuideHandle } from './components/WelcomeGuide';
import { registerServiceWorker } from './utils/serviceWorker';
import './App.css';

function App() {
  const { loading, error, content, metadata, loadFile, loadSavedEpub, clearError } = useEpub();
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const welcomeGuideRef = useRef<WelcomeGuideHandle>(null);
  const { showBookInfo } = useScroll(readerRef);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSummaryMarker, setSelectedSummaryMarker] = useState<Element | null>(null);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    loadSavedEpub();
  }, [loadSavedEpub]);

  useEffect(() => {
    if (content) {
      setContentReady(false); // Reset ready state when content changes
    } else {
      setContentReady(false);
    }
  }, [content]);

  const handleContentReady = () => {
    setContentReady(true);
  };

  const handleFileSelect = async (file: File) => {
    await loadFile(file);
  };

  const handleOpenBook = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.epub,application/epub+zip';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };
    input.click();
  };

  const handleWordClick = (word: string) => {
    setSelectedWord(word);
    setSelectedSummaryMarker(null);
  };

  const handleSummaryClick = (marker: Element) => {
    setSelectedSummaryMarker(marker);
    setSelectedWord(null);
  };

  const handleScroll = () => {
    if (selectedWord || selectedSummaryMarker) {
      setSelectedWord(null);
      setSelectedSummaryMarker(null);
    }
  };

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;

    const handleScrollEvent = () => handleScroll();
    reader.addEventListener('scroll', handleScrollEvent, { passive: true });
    return () => {
      reader.removeEventListener('scroll', handleScrollEvent);
    };
  }, [selectedWord, selectedSummaryMarker]);

  return (
    <div className="app">
      <WelcomeGuide ref={welcomeGuideRef} />
      <OfflineIndicator />
      <InstallPrompt />
      
      {metadata && (
        <BookInfo
          show={showBookInfo}
          bookName={metadata.fileName}
          onOpenBook={handleOpenBook}
        />
      )}

      <TopPanel 
        onOpenBook={handleOpenBook}
        onFileSelect={handleFileSelect}
        onShowHelp={() => welcomeGuideRef.current?.show()}
      />

      {(loading || (content && !contentReady)) && (
        <LoadingScreen 
          message={metadata ? `Restoring "${metadata.fileName}"...` : 'Loading your book...'} 
        />
      )}

      {error && (
        <div className="error">
          {error}
          <button onClick={clearError} style={{ marginLeft: '10px' }}>✕</button>
        </div>
      )}

      {content && (
        <div ref={readerContainerRef} className="reader-container">
          <Reader
            ref={readerRef}
            content={content.html}
            onWordClick={handleWordClick}
            onSummaryClick={handleSummaryClick}
            onReady={handleContentReady}
          />
        </div>
      )}

      <DefinitionPanel
        word={selectedWord}
        summaryMarker={selectedSummaryMarker}
        onClose={() => {
          setSelectedWord(null);
          setSelectedSummaryMarker(null);
        }}
      />
    </div>
  );
}

export default App;

